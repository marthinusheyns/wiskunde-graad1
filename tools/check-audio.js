/* Kontroleer opgeneemde stukkies: stuur 'n steekproef deur Azure se spraak-na-teks (af-ZA)
   en vergelyk wat gehoor word met wat dit moet wees. Vang verkeerd gesnyde klank.
   Gebruik: AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=... node check-audio.js [aantal] [--recent uur]
            node check-audio.js --durations [--fix]   (geen sleutel nodig nie) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const N = Number(process.argv[2] || 40);
const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;

const ctx = { console, Math, JSON }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['util', 'af']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx);
const AF = ctx.W.AF;

const pieces = JSON.parse(fs.readFileSync(path.join(__dirname, 'audio-pieces.json'), 'utf8'));
const have = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio', 'manifest.json'), 'utf8')).clips;
// --recent H: steekproef net uit grepies wat die afgelope H uur opgeneem is (ná 'n nuwe opname)
const recentAt = process.argv.indexOf('--recent');
const pool = recentAt < 0 ? have : have.filter((h) =>
  Date.now() - fs.statSync(path.join(ROOT, 'audio', h + '.mp3')).mtimeMs < Number(process.argv[recentAt + 1] || 24) * 3600e3);
const sample = pool.slice().sort(() => Math.random() - 0.5).slice(0, N);

const norm = (s) => String(s).toLowerCase()
  .replace(/\d+/g, (d) => ' ' + AF.numWord(+d) + ' ')
  .replace(/[’']n\b/g, 'n').replace(/[^a-zà-ÿ\s-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
function similarity(a, b) {
  const x = norm(a).split(' '), y = norm(b).split(' ');
  const setY = new Set(y);
  const hit = x.filter((w) => setY.has(w)).length;
  return hit / Math.max(x.length, y.length);
}

/* --durations: vergelyk elke grepie se lengte met sy teks (vang stukkies wat saamgesmelt of
   afgesny is). Met --fix word verdagte lêers verwyder sodat build-audio.js hulle weer opneem. */
if (process.argv.includes('--durations')) {
  const fix = process.argv.includes('--fix');
  const rows = have.map((h) => {
    const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(ROOT, 'audio', h + '.mp3')]);
    return { h, text: pieces[h], d: parseFloat(String(r.stdout)) };
  });
  // seconds per letter (median) for this voice
  const per = rows.map((r) => (r.d - 0.15) / Math.max(1, r.text.replace(/[^a-zà-ÿ]/gi, '').length)).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  const odd = rows.filter((r) => {
    const exp = 0.15 + per * Math.max(1, r.text.replace(/[^a-zà-ÿ]/gi, '').length);
    return r.d > exp * 1.9 + 0.35 || r.d < exp * 0.45;
  });
  console.log(`${rows.length} grepies; mediaan ${(per * 1000).toFixed(0)} ms per letter; ${odd.length} verdag`);
  odd.forEach((r) => console.log(`  ${r.h} ${r.d.toFixed(2)}s  "${r.text}"`));
  if (fix) { odd.forEach((r) => fs.unlinkSync(path.join(ROOT, 'audio', r.h + '.mp3'))); console.log(`${odd.length} verwyder; hardloop build-audio.js weer.`); }
  process.exit(0);
}

(async () => {
  let ok = 0, bad = [];
  for (const h of sample) {
    const wav = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', path.join(ROOT, 'audio', h + '.mp3'), '-ar', '16000', '-ac', '1', '-f', 'wav', 'pipe:1'], { maxBuffer: 1e7 }).stdout;
    const r = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=af-ZA&format=simple`, {
      method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000' }, body: wav
    });
    const j = await r.json().catch(() => ({}));
    const heard = j.DisplayText || '(' + (j.RecognitionStatus || r.status) + ')';
    const sim = similarity(pieces[h], heard);
    const secs = (wav.length - 44) / 32000;
    if (sim >= 0.5) ok++; else bad.push(`${h}  "${pieces[h]}"  ->  "${heard}"  (${secs.toFixed(2)}s)`);
    await new Promise((res) => setTimeout(res, 300));
  }
  console.log(`${ok}/${sample.length} pas (minstens die helfte van die woorde reg gehoor)`);
  if (bad.length) console.log('Nagaan:\n' + bad.join('\n'));
})();
