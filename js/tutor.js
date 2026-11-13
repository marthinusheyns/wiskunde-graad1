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
  T.nodeState = function (nodes, id) {
    var x = nodes[id], a = acc(nodes, id);
    if (!x || x.recent.length < 3) return 'grey';
    return a >= 0.85 ? 'green' : a >= 0.7 ? 'orange' : 'red';
  };
  function allPre(id, seen) {
    seen = seen || {};
    (W.SKILLMAP[id] ? W.SKILLMAP[id].pre : []).forEach(function (p) { if (!seen[p]) { seen[p] = 1; allPre(p, seen); } });
    return seen;
  }
  /* Wortelgapings: swak vaardighede waarvan geen voorvereiste self swak is nie. */
  T.report = function (data) {
    var nodes = data.nodes || {}, mis = data.mis || {};
    var weak = Object.keys(W.SKILLMAP).filter(function (id) { return T.nodeState(nodes, id) === 'red'; });
    var roots = weak.filter(function (id) {
      var pre = allPre(id);
      return !weak.some(function (w) { return pre[w]; });
    }).map(function (id) {
      return {
        id: id, name: W.SKILLMAP[id].name, acc: acc(nodes, id),
        blocks: weak.filter(function (w) { return w !== id && allPre(w)[id]; }).map(function (w) { return W.SKILLMAP[w].name; })
      };
    });
    var misList = Object.keys(mis).filter(function (k) { return mis[k].n >= 2 && W.MIS[k]; })
      .sort(function (a, b) { return mis[b].n - mis[a].n; })
      .map(function (k) { return { id: k, n: mis[k].n, parent: W.MIS[k].parent, home: W.MIS[k].home }; });
    return { roots: roots, mis: misList };
  };
})(W.Tutor);
