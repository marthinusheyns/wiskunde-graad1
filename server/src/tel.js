/* Gebruikstellings: net getalle per dag, sonder om 'n toestel of kind te volg (sien js/stats.js in die app).

   Die app stuur (POST, teks-JSON):
     { v: '1.12',
       o: { d: '2026-11-14', n: 1, i: 0, wk: 1, mo: 1 },       een keer per dag: die toestel is vandag oopgemaak
                                                               (n: eerste keer ooit, i: as app geïnstalleer,
                                                               wk/mo: eerste keer hierdie week/maand)
       w: [ { d: '2026-11-14', q: 12, w: 1, l: 0, k: 1,        vrae, werkblaaie en lesse sedert die vorige keer
              p: 1, pwk: 1, pmo: 1, r: 3, c: '2026-11' } ] }   (net die verskil), k: spelers wat vandag begin het,
                                                               p/pwk/pmo: eerste vraag op hierdie toestel vandag /
                                                               hierdie week / maand, r: die toestel se r-de speeldag
                                                               (net 1, 2, 3, 5, 7, 10, 14, 21, 30), c: maand van sy
                                                               eerste besoek
   Daar is geen ID nie: die aantal "o"-reëls vir 'n dag is die aantal toestelle daardie dag, die som van wk vir
   'n week die aantal toestelle daardie week, ens., en die som van die "w"-reëls is die totale.
   Ons stoor nie die IP-adres of iets anders van die versoek nie. (Weergawe 1.11 stuur nog nie wk, mo, p, pwk,
   pmo, r en c nie.)
   Elke dag het sy eie byvoeg-lêer in die private houer "tel": tel/2026-11-14.jsonl. Lees dit met tools/stats.js.

   App-instellings (net in Azure): TEL_URL (houer se URL), TEL_SAS (gestoorde beleid tel-ac: byvoeg en skep, nie lees nie),
   ALLOWED_ORIGINS. */
const { app } = require('@azure/functions');

const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const DAY = /^\d{4}-\d{2}-\d{2}$/, MONTH = /^\d{4}-\d{2}$/;
const MARKS = [1, 2, 3, 5, 7, 10, 14, 21, 30];
const int = (x, max) => Number.isInteger(x) && x >= 0 && x <= max;
const opt = (x, max) => x === undefined || int(x, max); // nuwer velde: ou weergawes stuur dit nie
/* Hou net velde wat nie 0 is nie (kleiner lêers) */
const some = (r, keys, x) => { keys.forEach((k) => { if (x[k]) r[k] = x[k]; }); return r; };

/* 'n Dag wat sin maak: nie in die toekoms nie (een dag speling vir tydsones) en nie ouer as 35 dae nie
   (die app hou ongestuurde tellings so lank as die foon vanlyn was). */
function okDay(d) {
  if (typeof d !== 'string' || !DAY.test(d)) return false;
  const t = Date.parse(d + 'T12:00:00Z'), now = Date.now();
  return Number.isFinite(t) && t <= now + 36 * 3600e3 && t >= now - 35 * 86400e3;
}

/* Die reëls om te stoor, per dag; null as iets nie klop nie. */
function lines(b) {
  if (!b || typeof b !== 'object' || typeof b.v !== 'string' || !/^\d{1,2}\.\d{1,3}$/.test(b.v)) return null;
  const out = {};
  const add = (d, r) => { (out[d] = out[d] || []).push(JSON.stringify(Object.assign(r, { v: b.v }))); };
  if (b.o != null) {
    const o = b.o;
    if (!o || !okDay(o.d) || !int(o.n, 1) || !int(o.i, 1) || !opt(o.wk, 1) || !opt(o.mo, 1)) return null;
    add(o.d, some({ t: 'o', n: o.n, i: o.i }, ['wk', 'mo'], o));
  }
  if (b.w != null) {
    if (!Array.isArray(b.w) || b.w.length > 40) return null;
    for (const x of b.w) {
      if (!x || !okDay(x.d) || !int(x.q, 5000) || !int(x.w, 300) || !int(x.l, 500) || !int(x.k, 20)) return null;
      if (!opt(x.p, 1) || !opt(x.pwk, 1) || !opt(x.pmo, 1) || !(x.r === undefined || x.r === 0 || MARKS.includes(x.r))) return null;
      if (x.r && !(typeof x.c === 'string' && MONTH.test(x.c) && x.c <= x.d.slice(0, 7))) return null;
      const r = some({ t: 'w', q: x.q, w: x.w, l: x.l, k: x.k }, ['p', 'pwk', 'pmo', 'r'], x);
      if (x.r) r.c = x.c;
      if (x.q + x.w + x.l + x.k + (x.p | 0) + (x.r | 0) > 0) add(x.d, r);
    }
  }
  return out;
}

/* Voeg reëls by tel/<dag>.jsonl; skep die lêer die eerste keer. */
async function append(day, text) {
  const url = `${process.env.TEL_URL}/${day}.jsonl`, sas = process.env.TEL_SAS;
  const put = () => fetch(`${url}?comp=appendblock&${sas}`, { method: 'PUT', body: text });
  let r = await put();
  if (r.status === 404) {
    await fetch(`${url}?${sas}`, { method: 'PUT', headers: { 'x-ms-blob-type': 'AppendBlob', 'x-ms-blob-content-type': 'application/x-ndjson', 'If-None-Match': '*' } });
    r = await put();
  }
  return r.ok;
}

app.http('tel', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (req) => {
    const origin = req.headers.get('origin');
    if (!origin || !ORIGINS.includes(origin)) return { status: 403 };
    const raw = await req.text().catch(() => '');
    if (!raw || raw.length > 4000) return { status: 400 };
    let body;
    try { body = JSON.parse(raw); } catch (e) { return { status: 400 }; }
    const out = lines(body);
    if (!out) return { status: 400 };
    const days = Object.keys(out);
    if (days.length > 40) return { status: 400 };
    const ok = await Promise.all(days.map((d) => append(d, out[d].join('\n') + '\n').catch(() => false)));
    return { status: ok.every(Boolean) ? 204 : 503, headers: { 'Cache-Control': 'no-store' } };
  }
});

module.exports = { lines, okDay };
