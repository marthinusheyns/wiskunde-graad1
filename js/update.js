/* Nuwe weergawe? Met internet laai die app altyd die nuutste lêers (sien sw.js). Maar op 'n foon bly die
   app dikwels dae lank oop in die agtergrond. Daarom kyk ons wanneer die app weer na vore kom (en op die
   tuisskerm) of daar 'n nuwer weergawe is, en wys dan 'n strook met "Laai dit". Nie terwyl 'n kind besig is
   met 'n werkblad nie. W.VERSION in js/util.js is die enigste plek waar die weergawe staan. */
var W = window.W || (window.W = {});

W.Update = (function () {
  var last = 0, shown = false;

  /* Is weergawe a nuwer as b? ("1.10" is nuwer as "1.9") */
  function newer(a, b) {
    var x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var d = (x[i] || 0) - (y[i] || 0);
      if (d) return d > 0;
    }
    return false;
  }
  function busy() { return !!(W.App && W.App.session && W.App.session()) || !!document.querySelector('.tutor-ov, .modal'); }

  function check() {
    if (shown || navigator.onLine === false || Date.now() - last < 60000 || busy()) return;
    last = Date.now();
    // Met 'n unieke adres: anders kan GitHub Pages se CDN 'n ou util.js gee (dit hou lêers tot 10 minute)
    fetch('js/util.js?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      var m = /W\.VERSION\s*=\s*'([\d.]+)'/.exec(t);
      if (m && newer(m[1], W.VERSION) && !busy()) bar(m[1]);
    }).catch(function () { });
  }

  function bar(v) {
    shown = true;
    var d = document.createElement('div');
    d.className = 'updbar';
    d.setAttribute('role', 'status');
    d.innerHTML = '<span>✨ Nuwe weergawe <b>' + W.U.esc(v) + '</b> is gereed.</span>' +
      '<button class="btn small go" data-u="go">Laai dit</button><button class="icon" data-u="no" aria-label="Later">✕</button>';
    d.addEventListener('click', function (e) {
      var u = e.target.getAttribute('data-u');
      // Laai die nuwe weergawe met die weergawe in die adres: die diensbode vra dan elke lêer as js/app.js?v=…, wat
      // die CDN nog nie het nie, so alles kom vars en uit dieselfde weergawe (sien sw.js). 'n Gewone herlaai kon
      // nog 'n ou app.js uit die CDN kry, sodat 'n mens moes aftrek om te herlaai.
      if (u === 'go') location.replace(location.pathname + '?v=' + encodeURIComponent(v) + location.hash);
      else if (u === 'no') d.remove();
    });
    document.body.appendChild(d);
  }

  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(); });
  window.addEventListener('online', check);

  return { check: check, newer: newer };
})();
