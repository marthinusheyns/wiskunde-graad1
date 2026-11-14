/* Spelers, vordering en instellings, gestoor in die blaaier (localStorage). */
var W = window.W || (window.W = {});

W.Store = (function () {
  var KEY = 'wiskunde-gr1-v1';
  var DEFAULT_SETTINGS = { qCount: 8, sound: true, autoSpeak: true, stats: true };
  var state = load();

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.profiles) { s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings || {}); return s; }
    } catch (e) { }
    return { profiles: [], current: null, data: {}, settings: Object.assign({}, DEFAULT_SETTINGS) };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }

  function profiles() { return state.profiles; }
  function addProfile(name, avatar) {
    var id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    state.profiles.push({ id: id, name: name, avatar: avatar });
    state.data[id] = blank();
    state.current = id;
    save();
    return id;
  }
  function removeProfile(id) {
    state.profiles = state.profiles.filter(function (p) { return p.id !== id; });
    delete state.data[id];
    if (state.current === id) state.current = state.profiles[0] ? state.profiles[0].id : null;
    save();
  }
  function setCurrent(id) { state.current = id; save(); }
  function current() {
    var p = state.profiles.filter(function (x) { return x.id === state.current; })[0];
    return p || null;
  }
  function blank() { return { ws: {}, skills: {}, lastWs: null, nodes: {}, mis: {} }; }
  function data(id) {
    id = id || state.current;
    if (!state.data[id]) state.data[id] = blank();
    var d = state.data[id];
    if (!d.nodes) d.nodes = {};
    if (!d.mis) d.mis = {};
    return d;
  }
  /* Tutor: bewyse per klein vaardigheid, en hoe gereeld elke bekende fout voorkom */
  function recordNode(nodeId, ok) {
    if (!nodeId) return;
    var d = data(), x = d.nodes[nodeId] || (d.nodes[nodeId] = { c: 0, t: 0, recent: [] });
    x.t++; if (ok) x.c++;
    x.recent.push(ok ? 1 : 0);
    if (x.recent.length > 12) x.recent.shift();
    // Swak ("rooi") met traagheid: dit word rooi onder 65% (minstens 6 antwoorde en 3 foute),
    // en raak eers weer vry by 80%, sodat een goeie of slegte oomblik dit nie heen en weer laat flikker nie.
    // (Gesimuleer: 'n kind wat 90% reg het, word in 48 antwoorde net 9% van die kere ooit rooi; 65% of swakker byna altyd.)
    var n = x.recent.length, c = x.recent.reduce(function (a, b) { return a + b; }, 0);
    if (x.red) { if (c / n >= 0.8) { x.red = false; x.redS = 0; } }
    else if (n >= 6 && n - c >= 3 && c / n < 0.65) x.red = true;
    save();
  }
  /* Aan die einde van 'n werkblad: tel hoeveel sessies agtereen elke geoefende vaardigheid swak was. */
  function endSession(nodeIds) {
    var d = data();
    nodeIds.forEach(function (id) { var x = d.nodes[id]; if (x) x.redS = x.red ? (x.redS || 0) + 1 : 0; });
    save();
  }
  function recordMis(misId, nodeId) {
    var d = data(), m = d.mis[misId] || (d.mis[misId] = { n: 0, last: 0 });
    m.n++; m.last = Date.now();
    m.times = (m.times || []).concat(m.last).slice(-10); // vir "herhaal onlangs", nie oor die hele jaar nie
    recordNode(nodeId, false);
  }

  function recordAnswer(skill, firstTry) {
    var d = data(), s = d.skills[skill] || (d.skills[skill] = { c: 0, t: 0, recent: [] });
    s.t++; if (firstTry) s.c++;
    s.recent.push(firstTry ? 1 : 0);
    if (s.recent.length > 20) s.recent.shift();
    save();
  }
  function starsFor(ft, total) {
    var r = total ? ft / total : 0;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : 1;
  }
  function recordSession(wsId, ft, total) {
    var d = data(), w = d.ws[wsId] || (d.ws[wsId] = { best: 0, plays: 0, last: 0, acc: 0 });
    var stars = starsFor(ft, total);
    w.best = Math.max(w.best, stars); w.plays++; w.last = Date.now(); w.acc = total ? ft / total : 0;
    d.lastWs = wsId;
    save();
    return stars;
  }
  function wsInfo(wsId, id) { return data(id).ws[wsId] || null; }
  function totalStars(id) {
    var ws = data(id).ws, n = 0;
    Object.keys(ws).forEach(function (k) { n += ws[k].best; });
    return n;
  }
  function skillAcc(skill, id) {
    var s = data(id).skills[skill];
    if (!s || !s.recent.length) return null;
    return s.recent.reduce(function (a, b) { return a + b; }, 0) / s.recent.length;
  }
  function settings() { return state.settings; }
  function setSetting(k, v) { state.settings[k] = v; save(); }
  function resetProgress(id) { state.data[id] = blank(); save(); }
  function renameProfile(id, name) {
    state.profiles.forEach(function (p) { if (p.id === id) p.name = name; });
    save();
  }

  return {
    profiles: profiles, addProfile: addProfile, removeProfile: removeProfile, setCurrent: setCurrent,
    current: current, data: data, recordAnswer: recordAnswer, recordSession: recordSession, wsInfo: wsInfo,
    totalStars: totalStars, skillAcc: skillAcc, settings: settings, setSetting: setSetting,
    recordNode: recordNode, recordMis: recordMis, endSession: endSession,
    resetProgress: resetProgress, renameProfile: renameProfile, starsFor: starsFor
  };
})();
