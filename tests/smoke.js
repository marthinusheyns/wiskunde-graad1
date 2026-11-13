/* Rooktoets: genereer baie vrae vir elke werkblad en kontroleer dat elkeen geldig is.
   Hardloop met:  node tests/smoke.js  */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'js');
const files = ['util.js', 'af.js', 'visuals.js', 'gen-number.js', 'gen-ops.js', 'gen-measure.js', 'gen-space.js', 'gen-money-data.js', 'curriculum.js', 'tutor-data.js', 'tutor-lessons.js'];
const ctx = { console, Math, JSON, Array, Object, String, Number };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

const W = ctx.W;
const RUNS = Number(process.argv[2] || 300);
const errors = [];
const kinds = new Set(['choice', 'number', 'order', 'colour', 'trace']);
let total = 0, tutorChecks = 0;
const seenGens = new Set();

function fail(ws, gen, msg, q) {
  if (errors.length < 60) errors.push(`[${ws.id} ${gen}] ${msg}\n   prompt: ${q && q.prompt}`);
}

for (const ws of W.CURRICULUM) {
  for (const [gen, params] of ws.ex) {
    seenGens.add(gen);
    if (typeof W.G[gen] !== 'function') { fail(ws, gen, 'generator ontbreek'); continue; }
    for (let i = 0; i < RUNS; i++) {
      let q;
      try { q = W.G[gen](params); } catch (e) { fail(ws, gen, 'gooi fout: ' + e.stack.split('\n').slice(0, 3).join(' | ')); break; }
      total++;
      const text = [q.prompt, q.visual, q.hint, q.explain, q.say || ''].join(' ');
      if (!q.prompt || typeof q.prompt !== 'string') fail(ws, gen, 'geen prompt', q);
      if (/undefined|NaN|\[object/.test(text)) fail(ws, gen, 'undefined/NaN in teks: ' + (text.match(/.{0,40}(undefined|NaN|\[object).{0,20}/) || [''])[0], q);
      if (!W.SKILLS[q.skill]) fail(ws, gen, 'onbekende vaardigheid ' + q.skill, q);
      const inp = q.input;
      if (!inp || !kinds.has(inp.kind)) { fail(ws, gen, 'slegte input', q); continue; }
      if (inp.kind === 'choice') {
        const vals = inp.options.map(o => String(o.value));
        if (inp.options.length < 2) fail(ws, gen, 'te min keuses: ' + vals, q);
        if (new Set(vals).size !== vals.length) fail(ws, gen, 'dubbel keuses: ' + vals, q);
        if (!vals.includes(String(inp.answer))) fail(ws, gen, 'antwoord ' + inp.answer + ' nie in keuses ' + vals + ' nie', q);
        inp.options.forEach(o => { if (o.label == null && o.html == null) fail(ws, gen, 'keuse sonder label/html', q); });
        const labels = inp.options.filter(o => o.label != null).map(o => String(o.label));
        if (new Set(labels).size !== labels.length) fail(ws, gen, 'dubbel etikette: ' + labels, q);
      } else if (inp.kind === 'number') {
        if (!Number.isInteger(inp.answer) || inp.answer < 0) fail(ws, gen, 'slegte getalantwoord ' + inp.answer, q);
      } else if (inp.kind === 'order') {
        const a = inp.items.map(x => String(x.value)).sort().join(), b = inp.answer.map(String).sort().join();
        if (a !== b) fail(ws, gen, 'volgorde-items pas nie', q);
        if (inp.items.map(x => String(x.value)).join() === inp.answer.map(String).join() && inp.items.length > 2 && i % 50 === 0) { /* soms reeds gesorteer; geen fout */ }
      } else if (inp.kind === 'colour') {
        if (!(inp.target >= 1 && inp.target <= inp.total)) fail(ws, gen, 'kleur teiken ' + inp.target + '/' + inp.total, q);
      } else if (inp.kind === 'trace') {
        if (!inp.text) fail(ws, gen, 'geen spoorteks', q);
      }
      // Tutor: pad, bekende foute en lesse
      W.Tutor.path(gen, q).forEach((n) => { if (!W.SKILLMAP[n]) fail(ws, gen, 'onbekende vaardigheid op pad: ' + n, q); });
      Object.keys(q.mis || {}).forEach((k) => {
        if (!W.MIS[q.mis[k]]) fail(ws, gen, 'onbekende fout ' + q.mis[k], q);
        if (k === String(inp.answer)) fail(ws, gen, 'fout-antwoord is die regte antwoord ' + k, q);
      });
      if (W.LESSONS[gen] && i % 5 === 0) {
        tutorChecks++;
        let frames;
        const someMis = Object.values(q.mis || {})[i % 3] || null;
        try { frames = someMis && i % 2 ? W.LESSONS.forMistake(someMis, gen, q, W.MIS[someMis].tutor) : W.LESSONS[gen](q); } catch (e) { fail(ws, gen, 'les gooi fout: ' + String(e.stack).split(/\n/).slice(0, 2).join(' | '), q); continue; }
        if (!Array.isArray(frames) || frames.length < 2) fail(ws, gen, 'les het te min rame', q);
        else frames.forEach((f) => {
          if (!f.say || typeof f.html !== 'string') fail(ws, gen, 'raam sonder teks of prentjie', q);
          if (/undefined|NaN|\[object/.test(f.say + f.html)) fail(ws, gen, 'undefined/NaN in les: ' + f.say, q);
        });
      }
    }
  }
}

// Stemdekking: is elke stukkie wat die app kan sê opgeneem? (net 'n waarskuwing)
const manPath = path.join(__dirname, '..', 'audio', 'manifest.json');
if (fs.existsSync(manPath)) {
  const have = new Set(JSON.parse(fs.readFileSync(manPath, 'utf8')).clips);
  const missing = new Map();
  let spoken = 0, lessonSents = 0, lessonWhole = 0;
  const TOK = new RegExp('\\d|\\b(' + W.AF.NAMES.join('|') + ')\\b');
  const STORY = new Set(['wordProblem', 'moneyChange']); // stories bly stukkies (te veel name x getalle)
  // Soos W.Voice.speak: die hele sin as dit opgeneem is, anders die stukkies
  const say = (t, lesson) => {
    for (const s of W.AF.sentences(t || '')) {
      if (have.has(W.AF.hash(s.say))) { spoken++; if (lesson && TOK.test(s.raw)) { lessonSents++; lessonWhole++; } continue; }
      if (lesson && TOK.test(s.raw)) lessonSents++;
      for (const p of W.AF.segments(s.raw)) {
        spoken++;
        if (!have.has(W.AF.hash(p))) missing.set(p, (missing.get(p) || 0) + 1);
      }
    }
  };
  for (const ws of W.CURRICULUM) for (const [gen, params] of ws.ex) for (let i = 0; i < 50; i++) {
    const q = W.G[gen](params);
    [q.say || q.prompt, q.hint, q.explain].forEach((t) => say(t));
    if (q.done) say(q.done, true); // ná 'n regte antwoord: moet as hele sin opgeneem wees
    Object.values(q.mis || {}).forEach((m) => { say(W.MIS[m].child); say(W.MIS[m].tutor); });
    if (W.LESSONS[gen] && i % 5 === 0) W.LESSONS[gen](q).forEach((f) => say(f.say, !(STORY.has(gen) && f.say === (q.say || q.prompt))));
  }
  console.log(`Stem: ${have.size} opnames; ${missing.size} stukkies ontbreek (${[...missing.values()].reduce((a, b) => a + b, 0)} van ${spoken} keer gesê)`);
  console.log(`  Lessinne met getalle: ${lessonWhole} van ${lessonSents} as hele sinne opgeneem`);
  if (missing.size) console.log('  bv.: ' + [...missing.keys()].slice(0, 8).map((s) => JSON.stringify(s)).join(', ') + '\n  Hardloop tools/build-audio.js om dit op te neem.');
}

const unused = Object.keys(W.G).filter(k => !k.startsWith('_') && !seenGens.has(k));
console.log(`Werkblaaie: ${W.CURRICULUM.length}, generators: ${seenGens.size}, vrae getoets: ${total}, lesse getoets: ${tutorChecks}`);
// Elke vaardigheid se voorvereistes bestaan, en elke fout wys na 'n bestaande vaardigheid
Object.keys(W.SKILLMAP).forEach((id) => W.SKILLMAP[id].pre.forEach((p) => { if (!W.SKILLMAP[p]) errors.push('Onbekende voorvereiste ' + p + ' by ' + id); }));
Object.keys(W.MIS).forEach((id) => W.MIS[id].node.forEach((n) => { if (!W.SKILLMAP[n]) errors.push('Fout ' + id + ' wys na onbekende vaardigheid ' + n); }));
if (unused.length) console.log('Ongebruikte generators:', unused.join(', '));
const ids = W.CURRICULUM.map(w => w.id);
if (new Set(ids).size !== ids.length) errors.push('Dubbel werkblad-ids');
const nums = new Set(W.CURRICULUM.map(w => w.num));
for (let n = 1; n <= 128; n++) if (!nums.has(n)) errors.push('Werkblad ontbreek: ' + n);
if (errors.length) {
  console.log(`\n${errors.length} probleme:\n` + errors.join('\n'));
  process.exit(1);
}
console.log('Alles reg ✔');
