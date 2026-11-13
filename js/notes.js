/* "Help om die app te verbeter": 'n ouer skryf 'n kort nota; die app voeg dit as een reël by 'n private lêer
   (graad1.jsonl) in Azure Storage. Die skakel hier onder kan NET reëls byvoeg: dit kan niks lees, verander of
   uitvee nie, en werk net vir hierdie een lêer. Herroep dit deur die gestoorde beleid "graad1-add" op die
   houer "notas" uit te vee. Notas wag op die toestel as daar geen internet is nie. Haal notas af met
   node tools/notes.js. Geen naam van die kind en geen ander inligting word saamgestuur nie. Die skrywer kies
   of hy 'n ouer of onderwyser is, en kan 'n verwysing gee (voorletters of 'n kode), sodat 'n mens notas van
   dieselfde persoon saam kan lees. Die toestel onthou dit vir die volgende nota. */
var W = window.W || (window.W = {});

W.Notes = (function () {
  var APP = 'graad1';
  var FILE = 'https://wiskundenotas.blob.core.windows.net/notas/' + APP + '.jsonl';
  var LINK = { sv: '2026-02-06', si: 'graad1-add', sr: 'b', spr: 'https', sig: 'H09XOHhUZIlj4ykpGl9D09b2NAmbs1hUouTdxwDAPzg=' }; // byvoeg-alleen; openbaar met opset
  var OUTBOX = 'wiskunde-gr1-notas-v1', MAX_WAIT = 20, MAX_LEN = 1000, MAX_REF = 40;
  var ME = 'wiskunde-gr1-nota-wie-v1';
  var WHO = [['ouer', 'Ouer'], ['onderwyser', 'Onderwyser'], ['ander', 'Ander']];
  var esc = function (s) { return W.U.esc(s); };

  function url() {
    return FILE + '?comp=appendblock&' + Object.keys(LINK).map(function (k) { return k + '=' + encodeURIComponent(LINK[k]); }).join('&');
  }
  function load() { try { return JSON.parse(localStorage.getItem(OUTBOX)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(OUTBOX, JSON.stringify(list.slice(-MAX_WAIT))); } catch (e) { } }
  function waiting() { return load().length; }
  function me() { try { return JSON.parse(localStorage.getItem(ME)) || {}; } catch (e) { return {}; } }
  function remember(o) { try { localStorage.setItem(ME, JSON.stringify(o)); } catch (e) { } }

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
  function submit(text, ctx, from) {
    var rec = { id: uid(), t: new Date().toISOString(), app: APP, v: W.VERSION, kind: 'nota', note: text.slice(0, MAX_LEN), dev: device() };
    if (from && from.who) rec.who = from.who;
    if (from && from.ref) rec.ref = from.ref.slice(0, MAX_REF);
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
    var prev = me(), who = prev.who || '';
    var div = document.createElement('div');
    div.className = 'modal';
    div.innerHTML = '<div class="mbox notebox" role="dialog" aria-label="Help om die app te verbeter">' +
      '<h2>💬 Help om die app te verbeter</h2>' +
      '<p class="nb-lead">Het jy iets gesien wat verkeerd is of beter kan? Skryf ’n kort nota. Ons lees al die notas.</p>' +
      '<div class="nb-who" role="group" aria-label="Wie skryf?"><span>Ek is:</span>' + WHO.map(function (w) {
        return '<button type="button" class="nb-opt" data-who="' + w[0] + '" aria-pressed="' + (prev.who === w[0]) + '">' + w[1] + '</button>';
      }).join('') + '</div>' +
      '<label class="nb-ref">Verwysing <small>(opsioneel)</small>' +
      '<input id="noteref" maxlength="' + MAX_REF + '" autocomplete="off" value="' + esc(prev.ref || '') + '" placeholder="Bv. voorletters of jou kode"></label>' +
      (ctx ? '<p class="nb-q">Oor hierdie vraag: <b>Werkblad ' + esc(ctx.ws) + '</b>, “' + esc(ctx.prompt) + '”</p>' : '') +
      '<textarea id="notetxt" maxlength="' + MAX_LEN + '" rows="5" placeholder="Bv. Die antwoord is verkeerd. Die stem sê ’n woord verkeerd. My kind verstaan nie wat om te doen nie."></textarea>' +
      '<p class="privacy">🔒 <b>Moenie persoonlike inligting skryf nie:</b> geen volle name, e-posadresse, telefoonnommers of ID-nommers. ' +
      'Gebruik voorletters of ’n kode as verwysing. Ons stuur net jou nota, of jy ’n ouer of onderwyser is, jou verwysing, ' +
      (ctx ? 'die werkblad en vraag, ' : '') + 'die app-weergawe en die soort foon saam. Nie jou kind se naam nie.</p>' +
      '<p class="nb-warn" hidden></p>' +
      '<div class="row"><button class="btn ghost" data-m="no">Kanselleer</button><button class="btn go" data-m="send">Stuur ✓</button></div></div>';
    document.body.appendChild(div);
    var ta = div.querySelector('#notetxt'), ref = div.querySelector('#noteref'), warn = div.querySelector('.nb-warn'), sendBtn = div.querySelector('[data-m=send]');
    var warned = false;
    if (who) ta.focus(); // die eerste keer kies 'n mens eers wie skryf
    function edited() { warned = false; warn.hidden = true; sendBtn.textContent = 'Stuur ✓'; }
    ta.addEventListener('input', edited);
    ref.addEventListener('input', edited);
    div.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-who]');
      if (opt) {
        who = opt.getAttribute('data-who');
        [].forEach.call(div.querySelectorAll('[data-who]'), function (b) { b.setAttribute('aria-pressed', String(b === opt)); });
        warn.hidden = true;
        return;
      }
      var m = e.target.getAttribute('data-m');
      if (m === 'no' || e.target === div) return div.remove();
      if (m === 'done') return div.remove();
      if (m !== 'send') return;
      var text = ta.value.trim(), r = ref.value.replace(/\s+/g, ' ').trim().slice(0, MAX_REF);
      if (!who) { warn.hidden = false; warn.textContent = 'Kies asseblief eers wie skryf: ouer, onderwyser of ander.'; return; }
      if (text.length < 3) { warn.hidden = false; warn.textContent = 'Skryf asseblief eers ’n paar woorde.'; ta.focus(); return; }
      if ((personal(text) || personal(r)) && !warned) {
        warned = true; warn.hidden = false;
        warn.textContent = 'Dit lyk of daar ’n e-posadres of telefoonnommer in is. Haal dit asseblief uit. As dit nie persoonlik is nie, tik weer op Stuur.';
        sendBtn.textContent = 'Stuur tog';
        return;
      }
      sendBtn.disabled = true; sendBtn.textContent = 'Stuur…';
      remember({ who: who, ref: r });
      submit(text, ctx, { who: who, ref: r }).then(function (left) {
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
