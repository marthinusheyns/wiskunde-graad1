/* Gebruikstellings sonder om iemand te volg: net getalle per dag, geen ID en geen naam nie.

   - Een keer per dag stuur die app "oop": hierdie toestel is vandag gebruik. Die aantal daarvan is die aantal
     toestelle per dag. Die eerste keer ooit op 'n toestel sê dit ook "nuut".
   - Ná elke werkblad (en as die app na die agtergrond gaan) stuur dit hoeveel vrae, werkblaaie en lesse sedert die
     vorige keer gedoen is (net die verskil), en hoeveel spelers vandag hul eerste vraag gedoen het. Die som daarvan
     is die totale per dag.
   Niks hiervan kan 'n toestel of kind herken nie: die bediener kry net 'n datum, getalle en die weergawe, en stoor
   nie die IP-adres nie (server/src/tel.js). Sonder internet wag die getalle op die foon tot later.
   Ouers kan dit in die ouerafdeling afskakel (instelling "stats"). Lees die tellings met tools/stats.js. */
var W = window.W || (window.W = {});

W.Stats = (function () {
  var KEY = 'wiskunde-gr1-tel-v1';
  var URL = 'https://wiskunde-stem.azurewebsites.net/api/tel';
  var KEEP = 30; // dae: ouer ongestuurde getalle word weggegooi (die bediener aanvaar tot 35 dae)
  var st = load(), busy = false;

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object') return { open: s.open || '', ever: !!s.ever, pend: s.pend || {}, seen: s.seen || {} };
    } catch (e) { }
    return { open: '', ever: false, pend: {}, seen: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function on() { return W.Store.settings().stats !== false && location.protocol.indexOf('http') === 0; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function day(t) { var d = t ? new Date(t) : new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function installed() {
    try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true ? 1 : 0; } catch (e) { return 0; }
  }

  function bump(f) {
    var d = day(), p = st.pend[d] || (st.pend[d] = { q: 0, w: 0, l: 0, k: 0 });
    p[f]++;
    save();
  }

  /* Wat om te stuur: "oop" as dit vandag nog nie gestuur is nie, en die ongestuurde getalle per dag */
  function body() {
    var d = day(), old = day(Date.now() - KEEP * 864e5), b = { v: W.VERSION }, w = [];
    Object.keys(st.pend).sort().forEach(function (k) {
      var p = st.pend[k];
      if (k < old) delete st.pend[k];
      else w.push({ d: k, q: p.q, w: p.w, l: p.l, k: p.k });
    });
    if (st.open !== d) b.o = { d: d, n: st.ever ? 0 : 1, i: installed() };
    if (w.length) b.w = w;
    return b.o || b.w ? b : null;
  }
  /* Trek af wat gestuur is (intussen kon nog vrae bygekom het) */
  function done(b) {
    if (b.o) { st.open = b.o.d; st.ever = true; }
    (b.w || []).forEach(function (x) {
      var p = st.pend[x.d];
      if (!p) return;
      ['q', 'w', 'l', 'k'].forEach(function (f) { p[f] = Math.max(0, p[f] - x[f]); });
      if (!(p.q || p.w || p.l || p.k)) delete st.pend[x.d];
    });
    save();
  }
  /* beacon: as die app na die agtergrond gaan (die blaaier stuur dit klaar, al gaan die bladsy toe) */
  function send(beacon) {
    if (!on() || busy || navigator.onLine === false) return;
    var b = body();
    if (!b) return;
    var txt = JSON.stringify(b);
    if (beacon) {
      // Ons hoor nie of dit aangekom het nie: liewer 'n telling verloor as dubbel tel
      if (navigator.sendBeacon && navigator.sendBeacon(URL, txt)) done(b);
      return;
    }
    busy = true;
    fetch(URL, { method: 'POST', body: txt, mode: 'cors', credentials: 'omit', keepalive: true })
      .then(function (r) { busy = false; if (r.ok || r.status === 400) done(b); }) // 400: iets klop nie (bv. die foon se datum), moenie aanhou probeer nie
      .catch(function () { busy = false; });
  }

  document.addEventListener('visibilitychange', function () { send(document.visibilityState === 'hidden'); });
  window.addEventListener('online', function () { send(false); });

  return {
    start: function () { send(false); },
    /* Die eerste antwoord op 'n vraag (een keer per vraag) */
    question: function () {
      if (!on()) return;
      var d = day(), p = W.Store.current();
      bump('q');
      if (p && st.seen[p.id] !== d) { st.seen[p.id] = d; bump('k'); }
    },
    worksheet: function () { if (on()) { bump('w'); send(false); } },
    lesson: function () { if (on()) bump('l'); },
    /* Afgeskakel in die ouerafdeling: gooi ook die ongestuurde getalle weg */
    off: function () { st.pend = {}; save(); }
  };
})();
