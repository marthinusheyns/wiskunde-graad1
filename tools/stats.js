/* Gebruikstellings: besoekers en spelers per dag, week en maand, en hoeveel nuwe besoekers bly speel.
   Daar is geen ID nie (sien js/stats.js en server/src/tel.js): elke toestel sê self of dit die eerste keer
   vandag / hierdie week / hierdie maand is, en op die dag wat dit sy 1ste, 2de, 3de, 5de, ... dag van speel
   bereik. Ons tel net daardie getalle op.

   Besoeker = toestel wat die app oopgemaak het. Speler = toestel wat ten minste een vraag beantwoord het.
   Kinders = spelers-profiele (een toestel kan meer as een kind hê). Weekliks en maandeliks begin by weergawe 1.12.

   Gebruik (uit die app-gids):  node tools/stats.js              14 dae, 8 weke, 6 maande en "bly speel"
                                node tools/stats.js --days 60
                                node tools/stats.js --json       alles, vir 'n paneelbord of sigblad

   Nodig: die az CLI, aangemeld, en tools/notes.local.json (dieselfde as vir tools/notes.js).
   Die lêers word afgelaai na ../tel/ (buite die repo); ou dae (wat nie meer verander nie) net een keer. */
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
const DAYS = daysAt >= 0 ? Math.max(1, +args[daysAt + 1] || 14) : 14;
const asJson = args.includes('--json');
const MARKS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

function az(cmd) {
  return execSync(`az ${cmd} --account-name ${cfg.account} --subscription "${cfg.subscription}" --auth-mode key --only-show-errors`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}
const pad = (n) => (n < 10 ? '0' : '') + n;
/* ISO-week van 'n dag (dieselfde as js/stats.js) */
function isoWeek(day) {
  const [y, m, d] = day.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d));
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
  return x.getUTCFullYear() + '-W' + pad(Math.ceil(((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7));
}

// Laai af: dae van die laaste 37 dae altyd (laat tellings kom tot 35 dae later), ouer dae net as ons dit nog nie het nie
fs.mkdirSync(OUT, { recursive: true });
const fresh = new Date(Date.now() - 37 * 864e5).toISOString().slice(0, 10);
const blobs = JSON.parse(az('storage blob list -c tel --query "[].name" -o json')).filter((n) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(n)).sort();
const zero = () => ({ visitors: 0, new: 0, installed: 0, players: 0, children: 0, questions: 0, worksheets: 0, lessons: 0 });
const days = {}, weeks = {}, months = {}, cohorts = {};
for (const b of blobs) {
  const day = b.slice(0, 10), file = path.join(OUT, b);
  if (day >= fresh || !fs.existsSync(file)) az(`storage blob download -c tel -n ${b} -f "${file}" --overwrite -o none`);
  const D = days[day] = zero(), Wk = weeks[isoWeek(day)] = weeks[isoWeek(day)] || zero(), M = months[day.slice(0, 7)] = months[day.slice(0, 7)] || zero();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let x;
    try { x = JSON.parse(line); } catch (e) { continue; }
    if (!x || x.v === '0.0') continue; // toetsreëls
    if (x.t === 'o') {
      D.visitors++; Wk.visitors += x.wk | 0; M.visitors += x.mo | 0;
      for (const T of [D, Wk, M]) { T.new += x.n | 0; T.installed += x.i | 0; }
      const C = cohorts[day.slice(0, 7)] = cohorts[day.slice(0, 7)] || { new: 0, reached: {} };
      C.new += x.n | 0;
    } else if (x.t === 'w') {
      D.players += x.p | 0; Wk.players += x.pwk | 0; M.players += x.pmo | 0;
      for (const T of [D, Wk, M]) { T.children += x.k | 0; T.questions += x.q | 0; T.worksheets += x.w | 0; T.lessons += x.l | 0; }
      if (x.r && x.c) {
        const C = cohorts[x.c] = cohorts[x.c] || { new: 0, reached: {} };
        C.reached[x.r] = (C.reached[x.r] || 0) + 1;
      }
    }
  }
}

const last = (o, n) => Object.keys(o).sort().slice(-n).map((k) => Object.assign({ key: k }, o[k]));
const out = { days: last(days, DAYS), weeks: last(weeks, 8), months: last(months, 6), keptPlaying: [] };
const all = { key: 'Alles', new: 0, reached: {} };
for (const k of Object.keys(cohorts).sort()) {
  const C = cohorts[k];
  out.keptPlaying.push({ key: k, new: C.new, reached: C.reached });
  all.new += C.new;
  for (const r of Object.keys(C.reached)) all.reached[r] = (all.reached[r] || 0) + C.reached[r];
}
if (out.keptPlaying.length > 1) out.keptPlaying.push(all);

if (asJson) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
if (!blobs.length) { console.log('Nog geen tellings nie.'); process.exit(0); }

function table(title, rows, cols) {
  console.log('\n' + title);
  if (!rows.length) return console.log('  (nog niks)');
  const w = cols.map(([k, h]) => Math.max(h.length, ...rows.map((r) => String(r[k] ?? '').length)));
  const line = (r) => '  ' + cols.map(([k], i) => (i ? String(r[k] ?? '').padStart(w[i]) : String(r[k] ?? '').padEnd(w[i]))).join('  ');
  console.log(line(Object.fromEntries(cols.map(([k, h]) => [k, h]))));
  rows.forEach((r) => console.log(line(r)));
}
// Kinders net per dag: opgetel oor 'n week sou dieselfde kind meer as een keer tel
const C = (extra, kids) => [['key', extra], ['visitors', 'Besoekers'], ['new', 'Nuut'], ['players', 'Spelers']]
  .concat(kids ? [['children', 'Kinders']] : [])
  .concat([['questions', 'Vrae'], ['worksheets', 'Werkblaaie'], ['lessons', 'Lesse'], ['installed', 'Geïnstalleer']]);
table(`Per dag (laaste ${DAYS})`, out.days, C('Dag', true));
table('Per week (unieke toestelle in die week; vanaf weergawe 1.12)', out.weeks, C('Week'));
table('Per maand (unieke toestelle in die maand; vanaf weergawe 1.12)', out.months, C('Maand'));

const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-');
const funnel = out.keptPlaying.map((c) => {
  const r = { key: c.key, new: c.new };
  MARKS.forEach((m) => { const n = c.reached[m] || 0; r['d' + m] = n ? `${n} (${pct(n, c.new)})` : '0'; });
  return r;
});
table('Bly speel: nuwe besoekers per maand van eerste besoek, en hoeveel daarvan op ten minste x dae gespeel het', funnel,
  [['key', 'Maand'], ['new', 'Nuut']].concat(MARKS.map((m) => ['d' + m, m === 1 ? '1 dag' : m + ' dae'])));

console.log('\nBesoekers = toestelle wat die app oopgemaak het; Spelers = toestelle wat ten minste een vraag beantwoord het.' +
  '\nNuut = eerste keer ooit op daardie toestel. Kinders = spelersprofiele wat daardie dag ten minste een vraag gedoen het.' +
  '\n"Bly speel" begin by weergawe 1.12; jong maande lyk swakker omdat hul toestelle nog nie tyd gehad het nie.');
