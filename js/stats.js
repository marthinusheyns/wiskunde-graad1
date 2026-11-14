/* Gebruikstellings sonder om iemand te volg: net getalle, geen ID en geen naam nie.

   - "Oop": die eerste keer op 'n dag dat die app oopmaak, sê die toestel dat dit vandag gebruik is, en of dit die
     eerste keer hierdie week (wk) of maand (mo) is, of die eerste keer ooit (n). So tel ons besoekers per dag, week
     en maand.
   - "Werk": ná elke werkblad (en as die app na die agtergrond gaan) stuur dit hoeveel vrae, werkblaaie en lesse
     sedert die vorige keer gedoen is (net die verskil), en hoeveel spelers vandag hul eerste vraag gedoen het (k).
     Die eerste vraag op 'n dag, week of maand op hierdie toestel sê p, pwk of pmo: so tel ons spelers.
   - "Bly speel": op die dag wat die toestel sy 1ste, 2de, 3de, 5de, 7de, 10de, 14de, 21ste of 30ste dag van speel
     bereik, sê dit een keer r (daardie getal) en c (die maand van die eerste besoek). Dan kan ons sien hoeveel nuwe
     besoekers op ten minste x dae gespeel het, per maand.
   Niks hiervan kan 'n toestel of kind herken nie: die bediener kry net datums, getalle en die weergawe, en stoor
   nie die IP-adres nie (server/src/tel.js). Sonder internet wag die getalle op die foon tot later.
   Ouers kan dit in die ouerafdeling afskakel (instelling "stats"). Lees die tellings met tools/stats.js. */
var W = window.W || (window.W = {});

W.Stats = (function () {
  var KEY = 'wiskunde-gr1-tel-v1';
  var URL = 'https://wiskunde-stem.azurewebsites.net/api/tel';
  var KEEP = 30; // dae: ouer ongestuurde getalle word weggegooi (die bediener aanvaar tot 35 dae)
  var MARKS = [1, 2, 3, 5, 7, 10, 14, 21, 30]; // "het op ten minste x dae gespeel"
  var NUM = ['q', 'w', 'l', 'k', 'p', 'pwk', 'pmo', 'r'];
  var st = load(), busy = false;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* Dag, ISO-week (Maandag tot Sondag) en maand, in die foon se tyd */
  function when(t) {
    var d = t ? new Date(t) : new Date();
    var day = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    var x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
    var wk = Math.ceil(((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
    return { day: day, week: x.getUTCFullYear() + '-W' + pad(wk), month: day.slice(0, 7) };
  }

  function load() {
    var s = null, now = when();
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
    if (!s || typeof s !== 'object') s = {};
    s.pend = s.pend || {}; s.seen = s.seen || {}; s.ever = !!s.ever; s.open = s.open || '';
    // Maand van die eerste besoek (vir toestelle van weergawe 1.11: die maand van die laaste besoek)
    if (!s.first) s.first = (s.open || now.day).slice(0, 7);
    if (!s.play) {
      // Het hierdie toestel al voor vandag gespeel, voordat ons speeldae getel het? Dan ken ons nie sy
      // speeldae nie (n = -1) en stuur dit nie "bly speel" nie, sodat die syfers nie skeef trek nie.
      var start = new Date(); start.setHours(0, 0, 0, 0);
      var old = W.Store.profiles().some(function (p) {
        var ws = W.Store.data(p.id).ws || {};
        return Object.keys(ws).some(function (k) { return ws[k].last && ws[k].last < start.getTime(); });
      });
      s.play = { d: '', wk: '', mo: '', n: old ? -1 : 0 };
    }
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  function on() { return W.Store.settings().stats !== false && location.protocol.indexOf('http') === 0; }
  function installed() {
    try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true ? 1 : 0; } catch (e) { return 0; }
  }
  function rec(day) {
    return st.pend[day] || (st.pend[day] = { q: 0, w: 0, l: 0, k: 0, p: 0, pwk: 0, pmo: 0, r: 0 });
  }

  /* Wat om te stuur: "oop" as dit vandag nog nie gestuur is nie, en die ongestuurde getalle per dag */
  function body() {
    var now = when(), old = when(Date.now() - KEEP * 864e5).day, b = { v: W.VERSION }, w = [];
    Object.keys(st.pend).sort().forEach(function (k) {
      var p = st.pend[k];
      if (k < old) { delete st.pend[k]; return; }
      var x = { d: k };
      NUM.forEach(function (f) { x[f] = p[f] | 0; });
      if (x.r) x.c = p.c;
      w.push(x);
    });
    if (st.open !== now.day) {
      b.o = { d: now.day, n: st.ever ? 0 : 1, i: installed(), wk: st.owk !== now.week ? 1 : 0, mo: st.omo !== now.month ? 1 : 0, _wk: now.week, _mo: now.month };
    }
    if (w.length) b.w = w;
    return b.o || b.w ? b : null;
  }
  /* Trek af wat gestuur is (intussen kon nog vrae bygekom het) */
  function done(b) {
    if (b.o) { st.open = b.o.d; st.owk = b.o._wk; st.omo = b.o._mo; st.ever = true; }
    (b.w || []).forEach(function (x) {
      var p = st.pend[x.d];
      if (!p) return;
      NUM.forEach(function (f) { p[f] = Math.max(0, (p[f] | 0) - x[f]); });
      if (!p.r) delete p.c;
      if (!NUM.some(function (f) { return p[f]; })) delete st.pend[x.d];
    });
    save();
  }
  /* beacon: as die app na die agtergrond gaan (die blaaier stuur dit klaar, al gaan die bladsy toe) */
  function send(beacon) {
    if (!on() || busy || navigator.onLine === false) return;
    var b = body();
    if (!b) return;
    var txt = JSON.stringify(b, function (k, v) { return k.charAt(0) === '_' ? undefined : v; }); // _wk/_mo bly op die foon
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
      var now = when(), r = rec(now.day), p = W.Store.current(), pl = st.play;
      r.q++;
      if (p && st.seen[p.id] !== now.day) { st.seen[p.id] = now.day; r.k++; }
      if (pl.d !== now.day) { // die eerste vraag vandag op hierdie toestel
        r.p = 1;
        if (pl.wk !== now.week) r.pwk = 1;
        if (pl.mo !== now.month) r.pmo = 1;
        if (pl.n >= 0) {
          pl.n++;
          if (MARKS.indexOf(pl.n) >= 0) { r.r = pl.n; r.c = st.first; }
        }
        pl.d = now.day; pl.wk = now.week; pl.mo = now.month;
      }
      save();
    },
    worksheet: function () { if (on()) { rec(when().day).w++; save(); send(false); } },
    lesson: function () { if (on()) { rec(when().day).l++; save(); } },
    /* Afgeskakel in die ouerafdeling: gooi ook die ongestuurde getalle weg */
    off: function () { st.pend = {}; save(); },
    when: when // vir toetse
  };
})();
