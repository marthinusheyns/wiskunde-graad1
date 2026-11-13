/* Getalle natrek met die vinger. Ons teken die getal liggrys, die kind trek met die vinger,
   en ons kyk hoeveel van die getal bedek is en hoeveel van die strepe binne die lyne is. */
var W = window.W || (window.W = {});

W.Trace = (function () {
  var FONT = '"Andika", "Comic Sans MS", "Segoe UI", sans-serif';

  function mount(host, text) {
    var w = Math.min(host.clientWidth || 360, 560);
    var h = Math.round(Math.min(320, w * (text.length > 1 ? 0.62 : 0.85)));
    var dpr = window.devicePixelRatio || 1;
    host.innerHTML = '<div class="tracebox"><canvas class="tguide"></canvas><canvas class="tdraw"></canvas></div>';
    var guide = host.querySelector('.tguide'), draw = host.querySelector('.tdraw');
    [guide, draw].forEach(function (c) {
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
      c.getContext('2d').scale(dpr, dpr);
    });
    var fontSize = Math.round(h * 0.86);
    function setFont(ctx) {
      ctx.font = '700 ' + fontSize + 'px ' + FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    }
    // Riglyn
    var g = guide.getContext('2d');
    setFont(g);
    g.fillStyle = '#eceff1';
    g.fillText(text, w / 2, h / 2 + fontSize * 0.04);
    g.setLineDash([10, 9]); g.lineWidth = 3; g.strokeStyle = '#90a4ae';
    g.strokeText(text, w / 2, h / 2 + fontSize * 0.04);

    // Maskers (op lae resolusie, sonder dpr) om te kontroleer
    function mask(extra) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); setFont(x);
      x.fillStyle = '#000'; x.strokeStyle = '#000'; x.lineJoin = 'round';
      x.fillText(text, w / 2, h / 2 + fontSize * 0.04);
      if (extra) { x.lineWidth = extra; x.strokeText(text, w / 2, h / 2 + fontSize * 0.04); }
      return x.getImageData(0, 0, w, h).data;
    }
    var core = null, zone = null;

    var d = draw.getContext('2d');
    var lw = Math.max(16, Math.round(fontSize * 0.11));
    d.lineCap = 'round'; d.lineJoin = 'round'; d.lineWidth = lw; d.strokeStyle = '#1e88e5';
    var drawing = false, last = null, inked = false;
    // Ons hou die strepe ook op 'n lae-resolusie doek by vir die kontrole
    var ink = document.createElement('canvas'); ink.width = w; ink.height = h;
    var ic = ink.getContext('2d'); ic.lineCap = 'round'; ic.lineJoin = 'round'; ic.lineWidth = lw; ic.strokeStyle = '#000';

    function pos(e) { var r = draw.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function line(a, b) {
      [d, ic].forEach(function (c) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
    }
    draw.addEventListener('pointerdown', function (e) {
      e.preventDefault(); drawing = true; last = pos(e); line(last, { x: last.x + 0.1, y: last.y }); inked = true;
      try { draw.setPointerCapture(e.pointerId); } catch (er) { }
    });
    draw.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); line(last, p); last = p; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { draw.addEventListener(t, function () { drawing = false; }); });

    return {
      clear: function () {
        d.clearRect(0, 0, w, h); ic.clearRect(0, 0, w, h); inked = false;
      },
      hasInk: function () { return inked; },
      /* gee {coverage, inside} terug, albei tussen 0 en 1 */
      score: function () {
        if (!core) { core = mask(0); zone = mask(Math.round(fontSize * 0.16)); }
        var inkData = ic.getImageData(0, 0, w, h).data;
        var coreN = 0, covered = 0, drawn = 0, inZone = 0;
        for (var i = 3; i < inkData.length; i += 4 * 3) {
          var m = core[i] > 100, z = zone[i] > 100, k = inkData[i] > 100;
          if (m) { coreN++; if (k) covered++; }
          if (k) { drawn++; if (z) inZone++; }
        }
        return { coverage: coreN ? covered / coreN : 0, inside: drawn ? inZone / drawn : 0 };
      }
    };
  }
  return { mount: mount };
})();
