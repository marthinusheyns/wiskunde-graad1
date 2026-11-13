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
const { joinFor, replaceWord, joinTakes } = require('../server/src/join'); // dieselfde saamlas as die stembediener

const ROOT = path.join(__dirname, '..');
const AUDIO = path.join(ROOT, 'audio');
const VOICE = process.env.VOICE || 'af-ZA-AdriNeural';
const RATE = '-8%';
const SR = 24000;
const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const DRY = args.includes('--dry');

/* Woorde wat die stem alleen swak sê, word saamgestel uit twee ander opnames, aanmekaar gelas by die stil
   "t" in die middel (die gebruiker het dit op die oor gekies, 2026-11-13). [kop, stert]: die kop-woord tot by
   sy "t", en die stert-woord vanaf sy "t". Sulke woorde kry 'n nuwe lêernaam via RETAKE in js/af.js. */
const SPLICE = {
  'dertien': ['dertig', 'veertien'],      // "der" van dertig + "tien" van veertien
  'negentien': ['neëntien', 'sewentien']  // "neën" van neëntien + "tien" van sewentien
};

/* ---------- 1. Versamel teks ---------- */
function loadApp() {
  const ctx = { console, Math, JSON };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['util', 'af', 'visuals', 'gen-number', 'gen-ops', 'gen-measure', 'gen-space', 'gen-money-data', 'curriculum', 'tutor-data', 'tutor-lessons']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  }
  return ctx.W;
}

function collectPieces(W) {
  const pieces = new Map(); // hash -> text
  const add = (t) => {
    for (const p of W.AF.segments(t)) {
      const h = W.AF.clip(p);
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
  if (W.MIS) Object.values(W.MIS).forEach((m) => { add(m.child); add(m.tutor); });
  ['Kom ons kyk saam hoe om dit te doen.', 'Klaar'].forEach(add);
  for (let n = 0; n <= 20; n++) for (let t = 1; t <= 20; t++) add(W.AF.colourHint(n, t));

  /* Hele sinne vir Juffrou Padda: elke lessin met getalle en elke vraag wat sy voorlees, word in sy
     geheel opgeneem, sodat die toon natuurlik bly. Die stukkies bly ook (as terugval).
     Uitsondering: die stories (woordsomme en winkelsomme). Name x dinge x getalle gee meer as
     20 000 sinne, so dié bly saamgestel uit stukkies. */
  const STORY = new Set(['wordProblem', 'moneyChange']);
  const TOK = new RegExp('\\d|\\b(' + W.AF.NAMES.join('|') + ')\\b');
  const whole = new Set();
  const addWhole = (t) => {
    add(t);
    for (const s of W.AF.sentences(t)) {
      if (!TOK.test(s.raw)) continue; // sonder getalle of name is die sin reeds een stukkie
      const h = W.AF.clip(s.say);
      if (pieces.has(h) && pieces.get(h) !== s.say) throw new Error(`Hash-botsing: "${s.say}" en "${pieces.get(h)}"`);
      pieces.set(h, s.say);
      whole.add(h);
    }
  };

  // Vrae: genereer totdat daar vir 'n lang ruk niks nuuts bykom nie
  let round = 0, quiet = 0, before = 0;
  while (round < 60000 && quiet < 3000) {
    for (const ws of W.CURRICULUM) {
      for (const [g, p] of ws.ex) {
        const q = W.G[g](p);
        const prompt = q.say || q.prompt;
        const lesson = W.LESSONS && W.LESSONS[g];
        (lesson && !STORY.has(g) ? addWhole : add)(prompt);
        if (q.hint) add(q.hint);
        add(q.explain);
        if (q.done) addWhole(q.done); // die hele prentjie ná 'n regte antwoord
        const inp = q.input;
        if (inp.kind === 'choice' && inp.layout === 'words' && inp.speakOptions !== false) inp.options.forEach((o) => add(String(o.label)));
        if (!lesson) continue;
        const frames = round % 2 === 0 ? W.LESSONS[g](q) : [].concat(...Object.values(q.mis || {}).map((m) => W.LESSONS.forMistake(m, g, q)));
        frames.forEach((f) => (STORY.has(g) && f.say === prompt ? add : addWhole)(f.say));
      }
    }
    round++;
    if (pieces.size === before) quiet++; else { quiet = 0; before = pieces.size; }
  }
  console.log(`Stukkies: ${pieces.size}, waarvan ${whole.size} hele sinne (ná ${round} rondtes)`);
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
    const marks = [], words = [];
    s.bookmarkReached = (_, e) => marks.push({ i: Number(e.text), off: e.audioOffset });
    s.wordBoundary = (_, e) => words.push({ text: e.text, off: e.audioOffset, dur: e.duration }); // vir JOIN
    s.speakSsmlAsync(ssml, (res) => {
      s.close();
      if (res.reason === sdk.ResultReason.SynthesizingAudioCompleted) resolve({ pcm: Buffer.from(res.audioData), marks, words });
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
/* Die stilste 40 ms in die middel van 'n woord: die "t" se sluiting. Gee die middel daarvan. */
function closure(s, from = 0.25, to = 0.8) {
  const F = Math.round(0.005 * SR), win = 8, env = [];
  let best = -1, bestE = Infinity;
  for (let i = 0; i + F <= s.length; i += F) { let e = 0; for (let j = i; j < i + F; j++) e += Math.abs(s[j]); env.push(e / F); }
  for (let k = Math.floor(env.length * from); k + win < env.length * to; k++) {
    let e = 0; for (let j = k; j < k + win; j++) e += env[j];
    if (e < bestE) { bestE = e; best = k; }
  }
  return (best + win / 2) * F;
}
function splice(head, tail) {
  const a = head.slice(0, closure(head)), b = tail.slice(closure(tail)), f = Math.round(0.004 * SR);
  for (let i = 0; i < f; i++) { a[a.length - 1 - i] = Math.round(a[a.length - 1 - i] * i / f); b[i] = Math.round(b[i] * i / f); }
  const out = new Int16Array(a.length + b.length);
  out.set(a); out.set(b, a.length);
  return out;
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
  const all = [...pieces].filter(([h]) => !fs.existsSync(path.join(AUDIO, h + '.mp3'))).map(([h, text]) => ({ h, text })).slice(0, LIMIT);
  const spliced = all.filter((t) => SPLICE[t.text]);
  const joins = all.filter((t) => !SPLICE[t.text] && joinFor(t.text, W.AF.JOIN)).map((t) => Object.assign(t, { j: joinFor(t.text, W.AF.JOIN) }));
  const todo = all.filter((t) => !SPLICE[t.text] && !t.j);
  const chars = todo.reduce((n, t) => n + t.text.length, 0);
  console.log(`Nog op te neem: ${todo.length} stukkies, ${chars} karakters` + (spliced.length ? `; saam te stel: ${spliced.map((t) => t.text).join(', ')}` : '') +
    (joins.length ? `; sinne om saam te las: ${joins.length}` : ''));
  if (DRY || !all.length) { console.log(writeManifest(pieces)); return; }

  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new Error('Stel AZURE_SPEECH_KEY en AZURE_SPEECH_REGION');
  const sdk = require('microsoft-cognitiveservices-speech-sdk');
  const cfg = sdk.SpeechConfig.fromSubscription(key, region);
  cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw24Khz16BitMonoPcm;

  // groepe van hoogstens ~1500 karakters / 60 stukkies
  function group(list) {
    const out = [];
    let cur = [], len = 0;
    for (const t of list) {
      if (cur.length && (len + t.text.length > 1500 || cur.length >= 60)) { out.push(cur); cur = []; len = 0; }
      cur.push(t); len += t.text.length;
    }
    if (cur.length) out.push(cur);
    return out;
  }
  const batches = group(todo);

  let done = 0, failed = 0;
  const started = Date.now();
  /* Neem 'n groep op en gee die grepies terug (in die geheue). */
  async function record(batch) {
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
        return (await record(batch.slice(0, mid))).concat(await record(batch.slice(mid)));
      }
    }
    const cuts = [0];
    for (let i = 1; i < marks.length; i++) cuts.push(findCut(samples, Math.round(marks[i].off / 1e7 * SR), cuts[i - 1]));
    cuts.push(samples.length);
    // Elke grepie met sy woordgrense (sekondes, van die begin van die grepie af)
    const words = (res.words || []).map((w) => ({ text: w.text, at: Math.round(w.off / 1e7 * SR), len: Math.round(w.dur / 1e7 * SR) }));
    return batch.map((_, i) => {
      const clip = trim(samples.subarray(cuts[i], Math.min(cuts[i + 1], samples.length)));
      if (!clip) return null;
      const start = (clip.byteOffset - samples.byteOffset) / 2, end = start + clip.length;
      // ook 'n woord wat 'n fraksie vóór die gesnyde begin begin (die eerste woord van 'n sin)
      return { clip, words: words.filter((w) => w.at + w.len > start && w.at < end).map((w) => ({ text: w.text, off: Math.max(0, w.at - start) / SR, dur: (w.len - Math.max(0, start - w.at)) / SR })) };
    });
  }
  async function run(batch) {
    (await record(batch)).forEach((r, i) => {
      if (!r) { failed++; console.log('  stil:', batch[i].text); return; }
      encode(r.clip, path.join(AUDIO, batch[i].h + '.mp3'));
      done++;
    });
  }
  for (let k = 0; k < batches.length; k++) {
    const t0 = Date.now();
    await run(batches[k]);
    const m = writeManifest(pieces);
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`groep ${k + 1}/${batches.length}: ${done} klaar, ${failed} misluk, ${m.count} lêers (${m.mb} MB), ${mins} min`);
    const wait = 3200 - (Date.now() - t0); // gratis vlak: hoogstens 20 versoeke per minuut
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  // Saamgestelde woorde: neem die twee bronwoorde op en las hulle by die stil "t" aanmekaar
  for (const t of spliced) {
    const src = await record(SPLICE[t.text].map((text) => ({ text })));
    if (src.some((c) => !c)) { failed++; console.log('  stil:', t.text); continue; }
    encode(splice(Int16Array.from(src[0].clip), Int16Array.from(src[1].clip)), path.join(AUDIO, t.h + '.mp3'));
    done++;
    console.log(`saamgestel: ${t.text} (${SPLICE[t.text].join(' + ')})`);
    await new Promise((r) => setTimeout(r, 3200));
  }
  /* Sinne met 'n JOIN-woord (bv. "dertien"): neem elke sin twee keer op, met die kop-woord ("dertig") en met
     die stert-woord ("veertien"), en las by die stil "t" (server/src/join.js, dieselfde as die stembediener). */
  const takes = new Map();
  const variants = [];
  for (const t of joins) {
    const [w, head, tail] = t.j;
    variants.push({ text: replaceWord(t.text, w, head), item: t, side: 0 }, { text: replaceWord(t.text, w, tail), item: t, side: 1 });
  }
  const vb = group(variants);
  for (let k = 0; k < vb.length; k++) {
    const t0 = Date.now();
    (await record(vb[k])).forEach((r, i) => {
      const v = vb[k][i];
      if (!takes.has(v.item)) takes.set(v.item, []);
      takes.get(v.item)[v.side] = r ? { pcm: Int16Array.from(r.clip), words: r.words } : null;
    });
    console.log(`saamlas-groep ${k + 1}/${vb.length}`);
    const wait = 3200 - (Date.now() - t0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }
  let joined = 0;
  for (const t of joins) {
    let [A, B] = takes.get(t) || [];
    let pcm = A && B ? joinTakes(A, B, t.j[1], t.j[2]) : null;
    if (!pcm) { // nog 'n keer, elke weergawe apart (sonder punt aan die einde loop die groep se sinne in mekaar)
      const one = async (text) => { const r = (await record([{ text }]))[0]; await new Promise((x) => setTimeout(x, 3200)); return r && { pcm: Int16Array.from(r.clip), words: r.words }; };
      A = await one(replaceWord(t.text, t.j[0], t.j[1])); B = await one(replaceWord(t.text, t.j[0], t.j[2]));
      pcm = A && B ? joinTakes(A, B, t.j[1], t.j[2]) : null;
    }
    const clip = pcm && trim(pcm);
    if (!clip) { failed++; console.log('  kon nie saamlas nie:', t.text); continue; }
    encode(clip, path.join(AUDIO, t.h + '.mp3'));
    done++; joined++;
  }
  if (joins.length) console.log(`saamgelas: ${joined} van ${joins.length} sinne`);
  console.log('Klaar:', writeManifest(pieces));
}

main().catch((e) => { console.error(e); process.exit(1); });
