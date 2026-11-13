/* "Installeer die app?": vang Chrome se installeer-geleentheid (beforeinstallprompt) op en wys
   ons eie knoppie. Op iPhone/iPad is daar geen knoppie nie; daar wys ons hoe om dit met Deel te doen. */
var W = window.W || (window.W = {});

W.Install = (function () {
  var deferred = null, justInstalled = false, listeners = [];
  var LATER_DAYS = 14;

  function standalone() {
    try {
      return ['standalone', 'fullscreen', 'minimal-ui'].some(function (m) { return window.matchMedia('(display-mode: ' + m + ')').matches; }) ||
        window.navigator.standalone === true;
    } catch (e) { return false; }
  }
  function ios() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function changed() { listeners.forEach(function (fn) { try { fn(); } catch (e) { } }); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); // ons wys self die knoppie
    deferred = e;
    changed();
  });
  window.addEventListener('appinstalled', function () {
    deferred = null; justInstalled = true;
    changed();
  });

  /* installed | prompt (ons kan Chrome se venster wys) | ios (wys Deel-stappe) | manual (wys kieslys-stappe) */
  function state() {
    if (standalone()) return 'installed';
    if (justInstalled) return 'done';
    if (deferred) return 'prompt';
    return ios() ? 'ios' : 'manual';
  }
  function later() {
    var t = W.Store && W.Store.settings().installLater;
    return t && Date.now() - t < LATER_DAYS * 864e5;
  }
  var SHARE = '<svg class="shareic" viewBox="0 0 24 24" width="18" height="18" aria-label="Deel"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var STEPS = {
    ios: 'Tik in Safari op Deel ' + SHARE + ' en kies dan <b>Voeg by tuisskerm</b> (<i>Add to Home Screen</i>).',
    manual: 'Tik in jou blaaier se kieslys (<b>⋮</b> bo regs) op <b>Installeer app</b> of <b>Voeg by tuisskerm</b> (<i>Install app</i> / <i>Add to Home screen</i>).'
  };
  var WHY = 'Dan is dit op jou tuisskerm, maak dit met een tik oop en vul dit die hele skerm.';

  /* Die strook bo-aan die tuisskerm (net as Chrome gereed is, of op iPhone/iPad, en nie onlangs weggewys nie) */
  function banner() {
    var s = state();
    if (s === 'done') return '<div class="installbar ok"><span class="ib-ic">✓</span><div class="ib-t"><b>Klaar!</b><small>Die app is nou op jou tuisskerm. Maak dit voortaan van daar oop.</small></div></div>';
    if ((s !== 'prompt' && s !== 'ios') || later()) return '';
    return '<div class="installbar"><span class="ib-ic">📲</span><div class="ib-t"><b>Installeer die app?</b><small>' +
      (s === 'prompt' ? WHY : STEPS.ios) + '</small></div><div class="ib-b">' +
      (s === 'prompt' ? '<button class="btn small go" data-act="install">Installeer</button>' : '') +
      '<button class="btn small ghost" data-act="installLater">Nie nou nie</button></div></div>';
  }
  /* Die afdeling in die Ouerhoek: wys altyd die stand van sake */
  function panel() {
    var s = state();
    if (s === 'installed') return '<p class="note">✓ Die app loop as ’n geïnstalleerde app op hierdie toestel.</p>';
    if (s === 'done') return '<p class="note">✓ Geïnstalleer. Maak dit voortaan van jou tuisskerm af oop.</p>';
    return '<p class="note">' + WHY + '</p>' +
      (s === 'prompt' ? '<button class="btn small go" data-act="install">📲 Installeer die app</button>' :
        '<p class="note">' + STEPS[s] + '</p>' +
        (s === 'manual' ? '<p class="note fine0">Is dit reeds op jou tuisskerm? Maak dit dan van daar oop.</p>' : ''));
  }
  function prompt() {
    if (!deferred) return Promise.resolve('unavailable');
    var e = deferred;
    deferred = null; // Chrome laat die venster net een keer per geleentheid toe
    return e.prompt().then(function () { return e.userChoice; }).then(function (c) {
      changed();
      return c && c.outcome;
    }).catch(function () { changed(); return 'error'; });
  }
  return {
    state: state, banner: banner, panel: panel, prompt: prompt,
    later: function () { if (W.Store) W.Store.setSetting('installLater', Date.now()); changed(); },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
