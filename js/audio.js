/* Klank: Afrikaanse spraak (Web Speech API) en eenvoudige klankeffekte (Web Audio). */
var W = window.W || (window.W = {});

W.Say = (function () {
  var synth = window.speechSynthesis, voice = null, ready = false, listeners = [];
  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices() || [];
    var af = vs.filter(function (v) { return /^af([-_]|$)/i.test(v.lang); });
    // Verkies natuurlike/aanlyn stemme (bv. Microsoft Adri/Willem in Edge)
    af.sort(function (a, b) { return score(b) - score(a); });
    voice = af[0] || null;
    ready = true;
    listeners.forEach(function (f) { f(); });
  }
  function score(v) { return (/natural|online|neural/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1); }
  if (synth) {
    pickVoice();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', pickVoice);
    else synth.onvoiceschanged = pickVoice;
  }
  function available() { return !!voice; }
  function speak(text, opts) {
    if (!synth || !voice) return null;
    opts = opts || {};
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(W.AF.speakable(text));
      u.voice = voice; u.lang = voice.lang; u.rate = opts.rate || 0.9; u.pitch = 1.05;
      var done = new Promise(function (res) {
        u.onend = res; u.onerror = res;
        setTimeout(res, 1500 + String(text).length * 90); // vangnet
      });
      synth.speak(u);
      return done;
    } catch (e) { return null; }
  }
  function stop() { try { synth && synth.cancel(); } catch (e) { } }
  function onReady(f) { listeners.push(f); if (ready) f(); }
  function voiceName() { return voice ? voice.name : ''; }
  return { speak: speak, stop: stop, available: available, onReady: onReady, voiceName: voiceName, supported: !!synth };
})();

W.Sfx = (function () {
  var ctx = null;
  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } }
    return ctx;
  }
  function tone(freq, start, dur, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    var t = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function on() { return W.Store ? W.Store.settings().sound !== false : true; }
  return {
    good: function () { if (!on()) return; tone(660, 0, 0.15, 'triangle'); tone(880, 0.12, 0.25, 'triangle'); },
    bad: function () { if (!on()) return; tone(300, 0, 0.18, 'sine', 0.12); tone(240, 0.15, 0.25, 'sine', 0.1); },
    tap: function () { if (!on()) return; tone(520, 0, 0.06, 'sine', 0.06); },
    win: function () { if (!on()) return; [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.13, 0.3, 'triangle', 0.16); }); }
  };
})();

/* Ingeboude, opgeneemde stem (Microsoft Azure se Afrikaanse neurale stem "Adri").
   Elke stukkie teks is een keer opgeneem as audio/<hash>.mp3. Juffrou Padda se lessinne (en die
   vrae wat sy voorlees) is in hul geheel opgeneem, met elke getal daarin; ander sinne stel die app
   saam uit stukkies (sinne, name en getalle). As 'n stukkie ontbreek, gebruik ons die toestel se
   eie stem as daar een is. */
W.Voice = (function () {
  var manifest = null, meta = null, loading = null, ctx = null, cache = {}, gen = 0, sources = [];

  function load() {
    if (!loading) {
      loading = fetch('audio/manifest.json').then(function (r) { return r.ok ? r.json() : null; })
        .then(function (m) {
          if (m && m.clips && m.clips.length) {
            manifest = {}; m.clips.forEach(function (h) { manifest[h] = 1; }); meta = m;
          }
          return manifest;
        }).catch(function () { return null; });
    }
    return loading;
  }
  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } }
    return ctx;
  }
  function decode(c, buf) {
    return new Promise(function (res, rej) {
      var p = c.decodeAudioData(buf, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  function getBuf(h) {
    if (!cache[h]) {
      cache[h] = fetch('audio/' + h + '.mp3')
        .then(function (r) { if (!r.ok) throw new Error('404'); return r.arrayBuffer(); })
        .then(function (b) { return decode(ac(), b); })
        .catch(function (e) { delete cache[h]; throw e; });
    }
    return cache[h];
  }
  function recorded() { return !!manifest; }
  function available() { return recorded() || W.Say.available(); }

  var pending = [];
  function stop() {
    gen++;
    sources.forEach(function (s) { try { s.stop(); } catch (e) { } });
    sources = [];
    pending.splice(0).forEach(function (r) { r(); });
    W.Say.stop();
  }
  function estimate(texts) { return 600 + texts.join(' ').length * 60; }
  function wait(ms) { return new Promise(function (res) { pending.push(res); setTimeout(res, ms); }); }

  /* texts: een string of 'n lys strings wat na mekaar gesê word.
     Gee 'n Promise terug wat klaar is wanneer die stem klaar gepraat het. */
  function speak(texts) {
    texts = [].concat(texts).filter(Boolean);
    stop();
    if (!texts.length) return Promise.resolve();
    // Elke sin: die opname van die hele sin as daar een is (natuurlike toon), anders stukkies
    var pieces = [], hs = [], whole = [];
    texts.forEach(function (t) {
      W.AF.sentences(t).forEach(function (s) {
        var h = W.AF.clip(s.say);
        if (manifest && manifest[h]) { pieces.push(s.say); hs.push(h); whole.push(true); return; }
        W.AF.segments(s.raw).forEach(function (p) { pieces.push(p); hs.push(W.AF.clip(p)); whole.push(false); });
      });
    });
    if (!pieces.length) return Promise.resolve();
    var missing = !manifest || hs.some(function (h) { return !manifest[h]; });
    if (missing && W.Say.available()) return W.Say.speak(texts.join(' ')) || wait(estimate(texts));
    var c = manifest && ac();
    if (!c) return wait(estimate(texts));
    var my = gen;
    var items = pieces.map(function (p, i) { return { p: p, h: hs[i], w: whole[i] }; }).filter(function (x) { return manifest[x.h]; });
    return Promise.all(items.map(function (x) { return getBuf(x.h).catch(function () { return null; }); })).then(function (bufs) {
      if (my !== gen) return;
      var t = c.currentTime + 0.05;
      bufs.forEach(function (b, i) {
        if (!b) { t += (items[i].p.length * 60 + 150) / 1000; return; } // grepie kon nie laai nie: gee tog leestyd
        var s = c.createBufferSource();
        s.buffer = b; s.connect(c.destination); s.start(t);
        sources.push(s);
        t += b.duration + (items[i].w || /[.!?]$/.test(items[i].p) ? 0.25 : 0.04);
      });
      return wait(Math.max(0, (t - c.currentTime) * 1000));
    });
  }

  /* Laai al die klankgrepies af sodat die stem ook vanlyn werk (die diensbode stoor dit). */
  function downloadAll(onProgress) {
    return load().then(function () {
      if (!manifest) return false;
      var hs = Object.keys(manifest), i = 0, done = 0;
      return new Promise(function (res) {
        function next() {
          if (i >= hs.length) return;
          var h = hs[i++];
          fetch('audio/' + h + '.mp3').catch(function () { }).then(function () {
            done++;
            if (onProgress) onProgress(done, hs.length);
            if (done === hs.length) res(true); else next();
          });
        }
        for (var k = 0; k < 6; k++) next();
      });
    });
  }

  return {
    load: load, speak: speak, stop: stop, available: available, recorded: recorded,
    downloadAll: downloadAll, info: function () { return meta; }
  };
})();
