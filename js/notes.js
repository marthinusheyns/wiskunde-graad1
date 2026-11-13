/* "Help om die app te verbeter": 'n ouer skryf 'n kort nota; die app voeg dit as een reël by 'n private lêer
   (graad1.jsonl) in Azure Storage. Die skakel hier onder kan NET reëls byvoeg: dit kan niks lees, verander of
   uitvee nie, en werk net vir hierdie een lêer. Herroep dit deur die gestoorde beleid "graad1-add" op die
   houer "notas" uit te vee. Notas wag op die toestel as daar geen internet is nie. Haal notas af met
   node tools/notes.js. Geen naam van die kind en geen ander inligting word saamgestuur nie. */
var W = window.W || (window.W = {});

W.Notes = (function () {
  var APP = 'graad1';
  var FILE = 'https://wiskundenotas.blob.core.windows.net/notas/' + APP + '.jsonl';
  var LINK = { sv: '2026-02-06', si: 'graad1-add', sr: 'b', spr: 'https', sig: 'H09XOHhUZIlj4ykpGl9D09b2NAmbs1hUouTdxwDAPzg=' }; // byvoeg-alleen; openbaar met opset
  var OUTBOX = 'wiskunde-gr1-notas-v1', MAX_WAIT = 20, MAX_LEN = 1000;
  var esc = function (s) { return W.U.esc(s); };

  function url() {
    return FILE + '?comp=appendblock&' + Object.keys(LINK).map(function (k) { return k + '=' + encodeURIComponent(LINK[k]); }).join('&');
  }
  function load() { try { return JSON.parse(localStorage.getItem(OUTBOX)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(OUTBOX, JSON.stringify(list.slice(-MAX_WAIT))); } catch (e) { } }
  function waiting() { return load().length; }

  /* Net die soort toestel (bv. "Android 14 · Chrome 131"), nie die volle blaaier-string nie */
  function device() {
    var ua = navigator.userAgent || '';
    var os = /Android [\d.]+/.exec(ua) || /(?:iPhone|iPad|iPod).*?OS (\d+)/.exec(ua) || /Windows|Macintosh|CrOS|Linux/.exec(ua);
    var br = /SamsungBrowser\/\d+|Firefox\/\d+|FxiOS\/\d+|Edg\w*\/\d+|OPR\/\d+|CriOS\/\d+|Chrome\/\d+|Version\/\d+(?=.*Safari)/.exec(ua);
    os = os ? (os[1] ? 'iOS ' + os[1] : os[0]) : '?';
    br = br ? br[0].replace('/', ' ').replace(/^Version/, 'Safari') : '?';
    var inst = W.Install && W.Install.state() === 'installed' ? ' · geïnstalleer' : '';
    return os + ' · ' + br + inst + ' · ' + (window.screen ? screen.width + '×' + screen.height : '');
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function post(rec) {
    return fetch(url(), {
      method: 'PUT', mode: 'cors', cache: 'no-store', credentials: 'omit',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: JSON.stringify(rec) + '\n'
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }
  var busy = null;
  /* Stuur alles wat wag, een vir een. Gee terug hoeveel nog wag. */
  function flush() {
    if (busy) return busy;
    busy = (function next() {
      var list = load();
      if (!list.length || navigator.onLine === false) return Promise.resolve(list.length);
      return post(list[0]).then(function () {
        var now = load();
        save(now.filter(function (r) { return r.id !== list[0].id; }));
        return next();
      }, function () { return load().length; });
    })().then(function (n) { busy = null; return n; }, function () { busy = null; return load().length; });
    return busy;
  }
  function submit(text, ctx) {
    var rec = { id: uid(), t: new Date().toISOString(), app: APP, v: W.VERSION, kind: 'nota', note: text.slice(0, MAX_LEN), dev: device() };
    if (ctx) rec.q = ctx;
    var list = load(); list.push(rec); save(list);
    return flush();
  }

  /* Waarskuwing as dit lyk of daar persoonlike inligting in die nota is */
  function personal(t) {
    return /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(t) || /\d[\d\s()+-]{7,}\d/.test(t);
  }

  /* Die vorm. ctx: die vraag waaroor dit gaan (opsioneel): { ws, title, prompt, answer, ... } */
  function open(ctx) {
    if (W.Voice) W.Voice.stop();
    var div = document.createElement('div');
    div.className = 'modal';
    div.innerHTML = '<div class="mbox notebox" role="dialog" aria-label="Help om die app te verbeter">' +
      '<h2>💬 Help om die app te verbeter</h2>' +
      '<p class="nb-lead">Het jy iets gesien wat verkeerd is of beter kan? Skryf ’n kort nota. Ons lees al die notas.</p>' +
      (ctx ? '<p class="nb-q">Oor hierdie vraag: <b>Werkblad ' + esc(ctx.ws) + '</b>, “' + esc(ctx.prompt) + '”</p>' : '') +
      '<textarea id="notetxt" maxlength="' + MAX_LEN + '" rows="5" placeholder="Bv. Die antwoord is verkeerd. Die stem sê ’n woord verkeerd. My kind verstaan nie wat om te doen nie."></textarea>' +
      '<p class="privacy">🔒 <b>Moenie persoonlike inligting skryf nie:</b> geen name, e-posadresse, telefoonnommers of ID-nommers. ' +
      'Ons stuur net jou nota, ' + (ctx ? 'die werkblad en vraag, ' : '') + 'die app-weergawe en die soort foon saam. Nie jou kind se naam nie.</p>' +
      '<p class="nb-warn" hidden></p>' +
      '<div class="row"><button class="btn ghost" data-m="no">Kanselleer</button><button class="btn go" data-m="send">Stuur ✓</button></div></div>';
    document.body.appendChild(div);
    var ta = div.querySelector('#notetxt'), warn = div.querySelector('.nb-warn'), sendBtn = div.querySelector('[data-m=send]');
    var warned = false;
    ta.focus();
    ta.addEventListener('input', function () { warned = false; warn.hidden = true; sendBtn.textContent = 'Stuur ✓'; });
    div.addEventListener('click', function (e) {
      var m = e.target.getAttribute('data-m');
      if (m === 'no' || e.target === div) return div.remove();
      if (m === 'done') return div.remove();
      if (m !== 'send') return;
      var text = ta.value.trim();
      if (text.length < 3) { warn.hidden = false; warn.textContent = 'Skryf asseblief eers ’n paar woorde.'; ta.focus(); return; }
      if (personal(text) && !warned) {
        warned = true; warn.hidden = false;
        warn.textContent = 'Dit lyk of daar ’n e-posadres of telefoonnommer in is. Haal dit asseblief uit. As dit nie persoonlik is nie, tik weer op Stuur.';
        sendBtn.textContent = 'Stuur tog';
        return;
      }
      sendBtn.disabled = true; sendBtn.textContent = 'Stuur…';
      submit(text, ctx).then(function (left) {
        div.querySelector('.mbox').innerHTML = '<h2>Dankie! 🐸</h2><p class="nb-lead">' +
          (left ? 'Daar is nou geen internet nie. Die nota wag op hierdie toestel en gaan vanself sodra daar internet is.' : 'Ons het jou nota ontvang. Dit help ons om die app beter te maak.') +
          '</p><div class="row"><button class="btn go" data-m="done">Klaar ✓</button></div>';
      });
    });
  }

  // Stuur notas wat nog wag, sodra die app oopmaak of die internet terugkom
  window.addEventListener('online', function () { flush(); });
  setTimeout(function () { if (waiting()) flush(); }, 4000);

  return { open: open, flush: flush, waiting: waiting, personal: personal };
})();
