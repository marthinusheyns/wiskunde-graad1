/* Juffrou Padda: speel 'n les (rame met prentjie + gesproke sin), en die
   leerdermodel-hulp wat die "breekpunt" vind vir die ouerverslag. */
var W = window.W || (window.W = {});
W.Tutor = W.Tutor || {};

(function (T) {
  var U = W.U;

  T.hasLesson = function (gen) { return !!(W.LESSONS && W.LESSONS[gen]) && gen !== 'forMistake'; };

  /* Speel rame. opts.done: teks op die laaste knoppie. Gee 'n Promise terug wat klaar is as die les toemaak. */
  T.play = function (frames, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var i = 0, playing = true, token = 0, closed = false, shownAt = 0;
      var ov = document.createElement('div');
      ov.className = 'tutor-ov';
      ov.innerHTML = '<div class="tutor" role="dialog" aria-label="Juffrou Padda">' +
        '<div class="thead"><span class="padda">🐸</span><b>Juffrou Padda</b><button class="icon" data-t="close" aria-label="Maak toe">✕</button></div>' +
        '<div class="tbubble"></div><div class="tvis"></div><div class="tdots"></div>' +
        '<div class="tctrl"><button class="btn ghost" data-t="again">↺ Weer</button>' +
        '<button class="btn" data-t="pause">⏸</button>' +
        '<button class="btn go" data-t="next">Volgende ➜</button></div></div>';
      document.body.appendChild(ov);
      var bubble = ov.querySelector('.tbubble'), vis = ov.querySelector('.tvis'), dots = ov.querySelector('.tdots');
      var pauseBtn = ov.querySelector('[data-t=pause]'), nextBtn = ov.querySelector('[data-t=next]');

      function show(k) {
        i = k; shownAt = Date.now();
        var f = frames[i], my = ++token;
        bubble.textContent = f.say;
        vis.innerHTML = f.html;
        dots.innerHTML = frames.map(function (_, j) { return '<i class="' + (j < i ? 'done' : j === i ? 'now' : '') + '"></i>'; }).join('');
        var last = i === frames.length - 1;
        nextBtn.textContent = last ? (opts.done || 'Klaar ✓') : 'Volgende ➜';
        var t0 = Date.now();
        W.Voice.speak(f.say).then(function () {
          var rest = Math.max(0, (f.ms || 0) - (Date.now() - t0));
          setTimeout(function () {
            if (closed || my !== token || !playing || last) return;
            show(i + 1);
          }, rest + (f.ms ? 120 : 450));
        });
      }
      function close() {
        if (closed) return;
        closed = true; token++;
        W.Voice.stop();
        ov.remove();
        resolve();
      }
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('[data-t]');
        if (!b) return; // 'n tik op die prentjie (bv. om saam te tel) blaai nie aan nie
        var t = b.getAttribute('data-t');
        if (t === 'close') close();
        else if (t === 'again') { playing = true; pauseBtn.textContent = '⏸'; show(0); }
        else if (t === 'pause') {
          playing = !playing; pauseBtn.textContent = playing ? '⏸' : '▶';
          if (playing) show(i); else { token++; W.Voice.stop(); }
        } else if (t === 'next') {
          var since = Date.now() - shownAt; // vinnige herhaalde tikke slaan nie die hele les oor nie
          if (i < frames.length - 1) { if (since > 350) show(i + 1); } else if (since > 1000) close();
        }
      });
      show(0);
    });
  };

  /* ---------- leerdermodel ---------- */
  function acc(nodes, id) {
    var x = nodes[id];
    if (!x || !x.recent.length) return null;
    return x.recent.reduce(function (a, b) { return a + b; }, 0) / x.recent.length;
  }
  /* Grys onder 6 antwoorde. Rooi volg die traagheid in store.recordNode (x.red). */
  T.nodeState = function (nodes, id) {
    var x = nodes[id], a = acc(nodes, id);
    if (!x || x.recent.length < 6) return 'grey';
    var red = x.red != null ? x.red : a < 0.65; // ouer data sonder x.red
    return red ? 'red' : a >= 0.85 ? 'green' : 'orange';
  };
  /* Watter vaardighede op die pad het hierdie vraag werklik getoets? Die doelvaardigheid (laaste op die pad)
     altyd; 'n voorvereiste net as die kind die fout wat daarby hoort kon maak (die fout-antwoord was 'n keuse,
     of die kind kon dit intik). So kry 'n voorvereiste nie krediet vir iets wat nie kon misluk nie. */
  T.testable = function (q, path) {
    var ok = {}, mis = q.mis || {};
    if (path.length) ok[path[path.length - 1]] = 1;
    var vals = q.input.kind === 'choice' ? q.input.options.map(function (o) { return String(o.value); }) : Object.keys(mis);
    vals.forEach(function (v) { if (mis[v]) ok[T.misNode(mis[v], path)] = 1; });
    return path.filter(function (n) { return ok[n]; });
  };
  function allPre(id, seen) {
    seen = seen || {};
    (W.SKILLMAP[id] ? W.SKILLMAP[id].pre : []).forEach(function (p) { if (!seen[p]) { seen[p] = 1; allPre(p, seen); } });
    return seen;
  }
  /* Wortelgapings: swak vaardighede waarvan geen voorvereiste self swak is nie, en wat al minstens twee
     sessies agtereen swak was (een slegte dag is nog nie 'n swak plek nie). */
  var RECENT = 14 * 864e5;
  T.report = function (data, now) {
    var nodes = data.nodes || {}, mis = data.mis || {};
    now = now || Date.now();
    var weak = Object.keys(W.SKILLMAP).filter(function (id) { return T.nodeState(nodes, id) === 'red'; });
    var roots = weak.filter(function (id) {
      var pre = allPre(id);
      return (nodes[id].redS || 0) >= 2 && !weak.some(function (w) { return pre[w]; });
    }).map(function (id) {
      var r = nodes[id].recent;
      return {
        id: id, name: W.SKILLMAP[id].name, acc: acc(nodes, id),
        ok: r.reduce(function (a, b) { return a + b; }, 0), n: r.length,
        blocks: weak.filter(function (w) { return w !== id && allPre(w)[id]; }).map(function (w) { return W.SKILLMAP[w].name; })
      };
    });
    // Foute wat in die afgelope 14 dae minstens twee keer (by verskillende vrae) gebeur het
    function recentN(m) {
      if (m.times) return m.times.filter(function (t) { return now - t < RECENT; }).length;
      return now - (m.last || 0) < RECENT ? m.n : 0;
    }
    var misList = Object.keys(mis).filter(function (k) { return W.MIS[k] && recentN(mis[k]) >= 2; })
      .sort(function (a, b) { return recentN(mis[b]) - recentN(mis[a]); })
      .map(function (k) { return { id: k, n: recentN(mis[k]), parent: W.MIS[k].parent, home: W.MIS[k].home }; });
    return { roots: roots, mis: misList, watching: weak.length - roots.length };
  };
})(W.Tutor);
