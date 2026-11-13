/* Neem die app se Afrikaanse stem op met Microsoft Azure (neurale stem af-ZA-AdriNeural).

   1. Versamel elke stukkie teks wat die app kan sê (deur baie vrae te genereer).
   2. Stuur stukkies in groepe na Azure, met 'n <bookmark> voor elke stukkie.
   3. Sny die klank by die boekmerke, sny stilte af en stoor elke stukkie as audio/<hash>.mp3.
   4. Skryf audio/manifest.json (die lys wat die app gebruik).

   Dit kan gestop en weer begin word: stukkies wat reeds bestaan word oorgeslaan.

   Gebruik (die sleutel bly buite die repo):
     cd tools && npm install
     AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southafricanorth node build-audio.js [--limit N] [--dry]
   Vereis ffmpeg op die PATH. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const AUDIO = path.join(ROOT, 'audio');
const VOICE = process.env.VOICE || 'af-ZA-AdriNeural';
const RATE = '-8%';
const SR = 24000;
const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const DRY = args.includes('--dry');

/* ---------- 1. Versamel teks ---------- */
function loadApp() {
  const ctx = { console, Math, JSON };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['util', 'af', 'visuals', 'gen-number', 'gen-ops', 'gen-measure', 'gen-space', 'gen-money-data', 'curriculum']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  }
  return ctx.W;
}

function collectPieces(W) {
  const pieces = new Map(); // hash -> text
  const add = (t) => {
    for (const p of W.AF.segments(t)) {
      const h = W.AF.hash(p);
      if (pieces.has(h) && pieces.get(h) !== p) throw new Error(`Hash-botsing: "${p}" en "${pieces.get(h)}"`);
      pieces.set(h, p);
    }
  };
  // Vaste dele
  for (let n = 0; n <= 100; n++) add(String(n));
  ['rand', 'sent'].forEach(add);
  W.AF.NAMES.forEach(add);
  W.AF.PRAISE.concat(W.AF.TRY_AGAIN).forEach(add);
  Object.values(W.AF.PHRASES).forEach(add);
  for (let n = 0; n <= 20; n++) for (let t = 1; t <= 20; t++) add(W.AF.colourHint(n, t));
  // Vrae: genereer totdat daar vir 'n lang ruk niks nuuts bykom nie
  let round = 0, quiet = 0, before = 0;
  while (round < 60000 && quiet < 3000) {
    for (const ws of W.CURRICULUM) {
      for (const [g, p] of ws.ex) {
        const q = W.G[g](p);
        add(q.say || q.prompt);
        if (q.hint) add(q.hint);
        add(q.explain);
        const inp = q.input;
        if (inp.kind === 'choice' && inp.layout === 'words' && inp.speakOptions !== false) inp.options.forEach((o) => add(String(o.label)));
      }
    }
    round++;
    if (pieces.size === before) quiet++; else { quiet = 0; before = pieces.size; }
  }
  console.log(`Stukkies: ${pieces.size} (ná ${round} rondtes)`);
  return pieces;
}

/* ---------- 2. Azure ---------- */
const xmlEsc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function synth(sdk, cfg, batch) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="af-ZA"><voice name="${VOICE}"><prosody rate="${RATE}">` +
    batch.map((b, i) => `<bookmark mark="${i}"/>${xmlEsc(b.text)}<break time="450ms"/>`).join('') +
    `</prosody></voice></speak>`;
  return new Promise((resolve, reject) => {
    const s = new sdk.SpeechSynthesizer(cfg, null);
    const marks = [];
    s.bookmarkReached = (_, e) => marks.push({ i: Number(e.text), off: e.audioOffset });
    s.speakSsmlAsync(ssml, (res) => {
      s.close();
      if (res.reason === sdk.ResultReason.SynthesizingAudioCompleted) resolve({ pcm: Buffer.from(res.audioData), marks });
      else reject(new Error(sdk.CancellationDetails.fromResult(res).errorDetails || 'onbekende fout'));
    }, (err) => { s.close(); reject(new Error(err)); });
  });
}

/* ---------- 3. Sny, trim en enkodeer ---------- */
function trim(samples) {
  const thr = 350;
  let a = 0, b = samples.length - 1;
  while (a < samples.length && Math.abs(samples[a]) < thr) a++;
  while (b > a && Math.abs(samples[b]) < thr) b--;
  if (a >= b) return null;
  a = Math.max(0, a - Math.round(0.02 * SR));
  b = Math.min(samples.length - 1, b + Math.round(0.05 * SR));
  return samples.subarray(a, b + 1);
}
/* Azure se boekmerke val effens vóór die vorige woord klaar is. Ons sny dus nie presies by die
   boekmerk nie, maar in die middel van die langste stil stuk (die <break>) naby die boekmerk. */
function findCut(samples, approx, prevCut) {
  const thr = 350, win = Math.round(0.01 * SR), minRun = Math.round(0.15 * SR);
  const from = Math.max(0, prevCut + Math.round(0.12 * SR), approx - Math.round(0.35 * SR));
  const to = Math.min(samples.length, approx + Math.round(0.9 * SR));
  // al die stil stukke in die venster; kies die een naaste aan waar die <break> verwag word
  const runs = [];
  let run = -1;
  for (let f = from; f + win <= to; f += win) {
    let m = 0;
    for (let j = f; j < f + win; j++) { const v = Math.abs(samples[j]); if (v > m) m = v; }
    if (m < thr) { if (run < 0) run = f; } else { if (run >= 0 && f - run >= minRun) runs.push([run, f]); run = -1; }
  }
  if (run >= 0 && to - run >= minRun) runs.push([run, to]);
  if (!runs.length) return Math.max(approx, prevCut + 1);
  const target = approx + Math.round(0.25 * SR);
  runs.sort((a, b) => Math.abs((a[0] + a[1]) / 2 - target) - Math.abs((b[0] + b[1]) / 2 - target));
  return Math.floor((runs[0][0] + runs[0][1]) / 2);
}
function encode(samples, file) {
  const buf = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0',
    '-codec:a', 'libmp3lame', '-b:a', '40k', '-y', file], { input: buf });
  if (r.status !== 0) throw new Error('ffmpeg: ' + String(r.stderr));
}

function writeManifest(pieces) {
  const have = fs.readdirSync(AUDIO).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4));
  const keep = have.filter((h) => pieces.has(h)).sort();
  const bytes = keep.reduce((n, h) => n + fs.statSync(path.join(AUDIO, h + '.mp3')).size, 0);
  fs.writeFileSync(path.join(AUDIO, 'manifest.json'), JSON.stringify({ voice: VOICE, count: keep.length, mb: Math.round(bytes / 1e6), clips: keep }));
  fs.writeFileSync(path.join(__dirname, 'audio-pieces.json'), JSON.stringify(Object.fromEntries([...pieces].sort()), null, 0));
  return { count: keep.length, mb: (bytes / 1e6).toFixed(1) };
}

async function main() {
  const W = loadApp();
  const pieces = collectPieces(W);
  fs.mkdirSync(AUDIO, { recursive: true });
  const todo = [...pieces].filter(([h]) => !fs.existsSync(path.join(AUDIO, h + '.mp3'))).map(([h, text]) => ({ h, text })).slice(0, LIMIT);
  const chars = todo.reduce((n, t) => n + t.text.length, 0);
  console.log(`Nog op te neem: ${todo.length} stukkies, ${chars} karakters`);
  if (DRY || !todo.length) { console.log(writeManifest(pieces)); return; }

  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new Error('Stel AZURE_SPEECH_KEY en AZURE_SPEECH_REGION');
  const sdk = require('microsoft-cognitiveservices-speech-sdk');
  const cfg = sdk.SpeechConfig.fromSubscription(key, region);
  cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw24Khz16BitMonoPcm;

  // groepe van hoogstens ~1500 karakters / 60 stukkies
  const batches = [];
  let cur = [], len = 0;
  for (const t of todo) {
    if (cur.length && (len + t.text.length > 1500 || cur.length >= 60)) { batches.push(cur); cur = []; len = 0; }
    cur.push(t); len += t.text.length;
  }
  if (cur.length) batches.push(cur);

  let done = 0, failed = 0;
  const started = Date.now();
  async function run(batch, depth) {
    let res;
    for (let attempt = 0; ; attempt++) {
      try { res = await synth(sdk, cfg, batch); break; } catch (e) {
        const msg = String(e.message);
        if (attempt < 5 && /429|throttl|too many|quota|1007|4429/i.test(msg)) { console.log('  wag vir Azure se limiet...', msg.slice(0, 80)); await new Promise((r) => setTimeout(r, 30000 * (attempt + 1))); continue; }
        if (attempt < 2) { console.log('  fout, probeer weer:', msg.slice(0, 120)); await new Promise((r) => setTimeout(r, 5000)); continue; }
        throw e;
      }
    }
    const samples = new Int16Array(res.pcm.buffer, res.pcm.byteOffset, Math.floor(res.pcm.length / 2));
    const marks = res.marks.sort((a, b) => a.i - b.i);
    if (marks.length !== batch.length) {
      if (batch.length === 1) { marks.length = 0; marks.push({ i: 0, off: 0 }); }
      else {
        console.log(`  ${marks.length}/${batch.length} boekmerke; verdeel die groep`);
        const mid = Math.ceil(batch.length / 2);
        await run(batch.slice(0, mid), depth + 1); await run(batch.slice(mid), depth + 1);
        return;
      }
    }
    const cuts = [0];
    for (let i = 1; i < marks.length; i++) cuts.push(findCut(samples, Math.round(marks[i].off / 1e7 * SR), cuts[i - 1]));
    cuts.push(samples.length);
    for (let i = 0; i < batch.length; i++) {
      const a = cuts[i], b = cuts[i + 1];
      const clip = trim(samples.subarray(a, Math.min(b, samples.length)));
      if (!clip) { failed++; console.log('  stil:', batch[i].text); continue; }
      encode(clip, path.join(AUDIO, batch[i].h + '.mp3'));
      done++;
    }
  }
  for (let k = 0; k < batches.length; k++) {
    const t0 = Date.now();
    await run(batches[k], 0);
    const m = writeManifest(pieces);
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`groep ${k + 1}/${batches.length}: ${done} klaar, ${failed} misluk, ${m.count} lêers (${m.mb} MB), ${mins} min`);
    const wait = 3200 - (Date.now() - t0); // gratis vlak: hoogstens 20 versoeke per minuut
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  console.log('Klaar:', writeManifest(pieces));
}

main().catch((e) => { console.error(e); process.exit(1); });
