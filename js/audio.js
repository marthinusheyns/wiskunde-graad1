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
    if (!synth || !voice) return false;
    opts = opts || {};
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(W.AF.speakable(text));
      u.voice = voice; u.lang = voice.lang; u.rate = opts.rate || 0.9; u.pitch = 1.05;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
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
