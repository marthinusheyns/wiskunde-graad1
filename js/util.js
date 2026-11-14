/* Klein hulpfunksies wat oral gebruik word. Alles hang aan die globale W-objek
   sodat die app sonder 'n bou-stap (en selfs vanaf file://) werk. */
var W = window.W || (window.W = {});
W.VERSION = '1.10'; // verhoog saam met CACHE in sw.js by elke uitgawe

W.U = (function () {
  function rnd(min, max) { // heelgetal, insluitend albei kante
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function range(a, b, step) {
    step = step || 1;
    var out = [];
    for (var i = a; step > 0 ? i <= b : i >= b; i += step) out.push(i);
    return out;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function chance(p) { return Math.random() < p; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Bou 'n stel antwoordkeuses rondom die regte getal.
     opts: {min, max, n (aantal keuses), spread} */
  function numChoices(answer, opts) {
    opts = opts || {};
    var min = opts.min == null ? 0 : opts.min;
    var max = opts.max == null ? Math.max(answer + 5, 10) : opts.max;
    var n = opts.n || 3;
    var spread = opts.spread || 3;
    var set = [answer];
    var tries = 0;
    while (set.length < n && tries < 200) {
      tries++;
      var d = rnd(1, spread) * (chance(0.5) ? 1 : -1);
      var c = answer + d;
      if (opts.step) c = answer + d * opts.step;
      if (c >= min && c <= max && set.indexOf(c) < 0) set.push(c);
    }
    // vul aan as die reeks te klein was
    for (var v = min; set.length < n && v <= max; v++) if (set.indexOf(v) < 0) set.push(v);
    return shuffle(set).map(function (v) {
      return { value: v, label: (opts.prefix || '') + v + (opts.suffix || '') };
    });
  }

  /* Keuses uit 'n lys woorde/waardes, met die regte een ingesluit. */
  function listChoices(answer, pool, n) {
    n = n || 3;
    var others = shuffle(pool.filter(function (x) { return x !== answer; })).slice(0, n - 1);
    return shuffle([answer].concat(others)).map(function (v) { return { value: v, label: v }; });
  }

  return {
    rnd: rnd, pick: pick, shuffle: shuffle, range: range, sample: sample, esc: esc,
    chance: chance, clamp: clamp, numChoices: numChoices, listChoices: listChoices
  };
})();
