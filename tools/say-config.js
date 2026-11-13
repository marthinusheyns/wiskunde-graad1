/* Skryf server/config.json vir die stembediener: die goedgekeurde woordelys (elke woord wat die app kan sê,
   uit tools/audio-pieces.json wat build-audio.js maak), die woordvervangings (W.AF.SAY) en die woorde wat
   saamgelas word (W.AF.JOIN), albei uit js/af.js.
   Hardloop ná build-audio.js, en ontplooi dan die bediener weer (sien README, "Stembediener").
   Gebruik: node tools/say-config.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { words } = require('../server/src/words');

const ROOT = path.join(__dirname, '..');
const ctx = { console, Math, JSON }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['util', 'af']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx);
const AF = ctx.W.AF;

const pieces = JSON.parse(fs.readFileSync(path.join(__dirname, 'audio-pieces.json'), 'utf8'));
const vocab = new Set();
for (const text of Object.values(pieces)) words(text).forEach((w) => vocab.add(w));
for (let n = 0; n <= 100; n++) words(AF.numWord(n)).forEach((w) => vocab.add(w));
AF.NAMES.forEach((n) => vocab.add(n.toLowerCase()));
Object.values(AF.SAY).forEach((w) => vocab.add(w.toLowerCase()));

Object.values(AF.JOIN).forEach((pair) => pair.forEach((w) => vocab.add(w.toLowerCase())));
const out = { note: 'Gemaak deur tools/say-config.js. Moenie met die hand verander nie.', say: AF.SAY, join: AF.JOIN, vocab: [...vocab].sort() };
fs.writeFileSync(path.join(ROOT, 'server', 'config.json'), JSON.stringify(out, null, 0));
console.log(`server/config.json: ${out.vocab.length} woorde, ${Object.keys(out.say).length} vervangings, ${Object.keys(out.join).length} saamgelas`);
