/* Gebruikstellings: hoeveel toestelle die app elke dag gebruik het en hoeveel vrae gedoen is.
   Daar is geen ID nie (sien js/stats.js en server/src/tel.js), so "toestelle" is per dag; 'n toestel wat
   op drie dae gebruik is, tel op elkeen van daardie dae een keer.

   Gebruik (uit die app-gids):  node tools/stats.js              die laaste 30 dae
                                node tools/stats.js --days 90
                                node tools/stats.js --json       vir 'n paneelbord of sigblad

   Nodig: die az CLI, aangemeld, en tools/notes.local.json (dieselfde as vir tools/notes.js).
   Die lêers word afgelaai na ../tel/ (buite die repo). */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, '..', '..', 'tel');
const CFG = path.join(__dirname, 'notes.local.json');
if (!fs.existsSync(CFG)) {
  console.error('Skep eers tools/notes.local.json met {"subscription": "<naam of id van die intekening>"}');
  process.exit(1);
}
const cfg = Object.assign({ account: 'wiskundenotas' }, JSON.parse(fs.readFileSync(CFG, 'utf8')));
const args = process.argv.slice(2);
const daysAt = args.indexOf('--days');
const DAYS = daysAt >= 0 ? Math.max(1, +args[daysAt + 1] || 30) : 30;
const asJson = args.includes('--json');

function az(cmd) {
  return execSync(`az ${cmd} --account-name ${cfg.account} --subscription "${cfg.subscription}" --auth-mode key --only-show-errors`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

const from = new Date(Date.now() - (DAYS - 1) * 86400e3).toISOString().slice(0, 10);
fs.mkdirSync(OUT, { recursive: true });
const blobs = JSON.parse(az('storage blob list -c tel --query "[].name" -o json'))
  .filter((n) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(n) && n.slice(0, 10) >= from).sort();

const rows = [];
for (const b of blobs) {
  const file = path.join(OUT, b);
  az(`storage blob download -c tel -n ${b} -f "${file}" --overwrite -o none`);
  const r = { day: b.slice(0, 10), devices: 0, new: 0, installed: 0, children: 0, questions: 0, worksheets: 0, lessons: 0 };
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let x;
    try { x = JSON.parse(line); } catch (e) { continue; }
    if (!x || x.v === '0.0') continue; // toetsreëls
    if (x.t === 'o') { r.devices++; r.new += x.n | 0; r.installed += x.i | 0; }
    else if (x.t === 'w') { r.questions += x.q | 0; r.worksheets += x.w | 0; r.lessons += x.l | 0; r.children += x.k | 0; }
  }
  rows.push(r);
}

if (asJson) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }
if (!rows.length) { console.log(`Nog geen tellings sedert ${from} nie.`); process.exit(0); }
const cols = [['day', 'Dag'], ['devices', 'Toestelle'], ['new', 'Nuut'], ['installed', 'Geïnstalleer'], ['children', 'Kinders'], ['questions', 'Vrae'], ['worksheets', 'Werkblaaie'], ['lessons', 'Lesse']];
const sum = { day: 'Totaal' };
cols.slice(1).forEach(([k]) => { sum[k] = rows.reduce((a, r) => a + r[k], 0); });
const table = rows.concat([sum]);
const w = cols.map(([k, h]) => Math.max(h.length, ...table.map((r) => String(r[k]).length)));
const line = (r) => cols.map(([k], i) => (i ? String(r[k]).padStart(w[i]) : String(r[k]).padEnd(w[i]))).join('  ');
console.log(line(Object.fromEntries(cols.map(([k, h]) => [k, h]))));
rows.forEach((r) => console.log(line(r)));
console.log(line(sum));
console.log('\nToestelle = toestelle wat die app daardie dag oopgemaak het (geen ID nie, dus nie uniek oor dae heen nie).' +
  '\nNuut = eerste keer ooit op daardie toestel. Kinders = spelers wat daardie dag ten minste een vraag gedoen het.');
