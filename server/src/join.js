/* Las 'n woord saam uit twee opnames van dieselfde sin (gebruik deur die stembediener én tools/build-audio.js).

   Die stem sê party woorde swak (bv. "dertien"). Ons neem die sin twee keer op: een keer met die kop-woord
   ("dertig") en een keer met die stert-woord ("veertien") op daardie plek. Die kop-opname loop tot by die stil
   "t" in die kop-woord, en die stert-opname gaan van die "t" in die stert-woord verder. Die "t" is 'n kort
   stilte, so die las hoor 'n mens nie. Die woordgrense kom van Azure se woordgrens-gebeure (wordBoundary).

   JOIN (uit js/af.js, via server/config.json): { woord: [kop, stert] }, bv. { dertien: ['dertig', 'veertien'] }. */
const SR = 24000;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (w, flags) => new RegExp('(^|[^\\p{L}-])(' + esc(w) + ')(?![\\p{L}-])', flags);

/* Watter JOIN-woord kom in die teks voor? Gee [woord, kop, stert] of null. */
function joinFor(text, JOIN) {
  for (const w of Object.keys(JOIN || {})) if (wordRe(w, 'iu').test(text)) return [w, JOIN[w][0], JOIN[w][1]];
  return null;
}
/* Die teks met elke voorkoms van w vervang deur r (met dieselfde hoofletter). */
function replaceWord(text, w, r) {
  return text.replace(wordRe(w, 'giu'), (m, pre, word) => pre + (word[0] !== word[0].toLowerCase() ? r[0].toUpperCase() + r.slice(1) : r));
}
/* Die stilste 40 ms tussen a en b (monsters): die "t" se sluiting. Gee die middel daarvan. */
function closureIn(s, a, b) {
  const F = Math.round(0.005 * SR), win = 8;
  let best = a, bestE = Infinity;
  for (let i = a; i + F * win < b; i += F) {
    let e = 0;
    for (let j = i; j < i + F * win; j++) e += Math.abs(s[j]);
    if (e < bestE) { bestE = e; best = i; }
  }
  return best + Math.round(F * win / 2);
}
/* Die monster-grense van elke voorkoms van 'word' in 'n opname. words: [{ text, off, dur }] in sekondes,
   relatief tot die begin van pcm. */
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}-]/gu, '');
const span = (x) => [Math.round(x.off * SR), Math.round((x.off + x.dur) * SR)];
function spans(words, word) {
  return words.filter((x) => norm(x.text) === word.toLowerCase()).map(span);
}
/* Die pare [spanA, spanB] van die vervangde woord. Albei opnames het dieselfde woorde in dieselfde volgorde,
   behalwe die vervangde een, so ons koppel woord vir woord: net waar A die kop-woord en B die stert-woord het
   (nie 'n "veertien" wat reeds in die sin was nie). */
function pairs(A, B, head, tail) {
  if (A.words.length === B.words.length) {
    const out = [];
    A.words.forEach((a, i) => { if (norm(a.text) === head && norm(B.words[i].text) === tail) out.push([span(a), span(B.words[i])]); });
    if (out.length) return out;
  }
  const sa = spans(A.words, head), sb = spans(B.words, tail);
  return sa.length && sa.length === sb.length ? sa.map((x, k) => [x, sb[k]]) : null;
}
/* A: { pcm: Int16Array, words } van die kop-sin; B: dieselfde vir die stert-sin. Gee die saamgelaste Int16Array,
   of null as die woordgrense nie klop nie. Elke voorkoms word gelas: A tot by die kop se "t", B van die stert
   se "t" tot by die begin van die volgende voorkoms, ens. */
function joinTakes(A, B, head, tail) {
  const pr = pairs(A, B, head, tail);
  if (!pr) return null;
  const mid = ([a, b]) => [a + Math.round((b - a) * 0.25), a + Math.round((b - a) * 0.8)];
  const parts = [];
  let fromB = 0;
  pr.forEach(([spanA, spanB], k) => {
    const ca = closureIn(A.pcm, ...mid(spanA)), cb = closureIn(B.pcm, ...mid(spanB));
    if (k === 0) parts.push(A.pcm.slice(0, ca)); // die sin tot by die eerste kop se "t"
    else parts.push(B.pcm.slice(fromB, Math.max(fromB, spanB[0])), A.pcm.slice(spanA[0], ca)); // ... tot by die volgende woord, dan sy kop
    fromB = cb;
  });
  parts.push(B.pcm.slice(fromB)); // die res van die sin, van die laaste stert se "t" af
  const f = Math.round(0.004 * SR); // 4 ms in- en uitdoof by elke las, sonder klik
  parts.forEach((p, i) => {
    if (i > 0) for (let j = 0; j < f && j < p.length; j++) p[j] = Math.round(p[j] * j / f);
    if (i < parts.length - 1) for (let j = 0; j < f && j < p.length; j++) p[p.length - 1 - j] = Math.round(p[p.length - 1 - j] * j / f);
  });
  const out = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  // Kontrole: die saamgelaste sin moet omtrent so lank wees as die twee opnames; anders was 'n las verkeerd
  const avg = (A.pcm.length + B.pcm.length) / 2;
  return out.length > avg * 0.85 && out.length < avg * 1.15 ? out : null;
}

module.exports = { SR, joinFor, replaceWord, closureIn, spans, pairs, joinTakes };
