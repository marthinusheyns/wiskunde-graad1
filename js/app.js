/* Die app self: skerms, die vraag-speler, resultate en die ouerhoek. */
(function () {
  var U = W.U, AF = W.AF, V = W.V, S = W.Store, CUR = W.CURRICULUM;
  var $app = document.getElementById('app');
  var AVATARS = ['🦁', '🐯', '🐼', '🐨', '🐸', '🦄', '🐙', '🦊', '🐰', '🐻', '🐵', '🐧', '🦒', '🐢', '🐞', '🦋'];
  var TERM_COL = { 1: '#e53935', 2: '#fb8c00', 3: '#43a047', 4: '#1e88e5' };
  var sess = null, timer = null;
  var SPONSOR = '<p class="sponsor">Geborg deur <a href="https://www.heynstech.com/" target="_blank" rel="noopener">Heynstech</a>' +
    '<span class="ver"> · Weergawe ' + W.VERSION + '</span></p>';
  var DISCLAIMER = 'Hierdie app is gratis en is nie geaffilieer met die Departement van Basiese Onderwys nie. ' +
    'Privaatheid: geen advertensies en geen aanmelding nie, en die app samel self niks in nie. Vordering bly net op hierdie toestel. ' +
    'Net ’n nota wat jy self stuur (“Help om die app te verbeter”), gaan na ons toe, sonder jou kind se naam.';
  var esc = U.esc;

  function render(html, cls) {
    clearTimeout(timer);
    W.Voice.stop();
    $app.className = cls || '';
    $app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function byId(id) { return CUR.filter(function (w) { return w.id === String(id); })[0]; }
  function starStr(n) { return '<span class="st">' + '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i></span>'; }
  function strip() {
    return '<div class="strip">' + U.range(0, 10).map(function (n, i) {
      return '<span style="color:' + V.RAINBOW[i % 8] + '">' + n + '</span>';
    }).join('') + '</div>';
  }

  /* "Installeer die app?": die strook verskyn sodra Chrome gereed is (sien js/install.js) */
  function installSlot() { return '<div id="installSlot">' + W.Install.banner() + '</div>'; }
  W.Install.onChange(function () {
    var el = document.getElementById('installSlot'); if (el) el.innerHTML = W.Install.banner();
    var pn = document.getElementById('installPanel'); if (pn) pn.innerHTML = W.Install.panel();
  });

  /* ============ Spelers ============ */
  function showProfiles() {
    var ps = S.profiles();
    if (!ps.length) return showNewProfile(true);
    render('<div class="page center">' +
      '<h1 class="logo">Wiskunde <span>Graad 1</span></h1>' +
      '<h2>Wie speel vandag?</h2>' +
      '<div class="people">' + ps.map(function (p) {
        return '<button class="person" data-act="pick" data-id="' + p.id + '"><span class="av">' + p.avatar + '</span><span>' + esc(p.name) + '</span>' +
          '<small>' + S.totalStars(p.id) + ' ★</small></button>';
      }).join('') +
      '<button class="person add" data-act="newProfile"><span class="av">＋</span><span>Nuwe speler</span></button></div>' +
      installSlot() + strip() + SPONSOR + '</div>', 'bg-home');
    W.Update.check();
  }
  function showNewProfile(first) {
    render('<div class="page center">' +
      '<h1 class="logo">Wiskunde <span>Graad 1</span></h1>' +
      (first ? '<p class="lead">Welkom! Hierdie app help jou om <b>Wiskunde in Afrikaans, Graad 1</b> (Boek 1 en 2) te oefen.</p>' + installSlot() : '') +
      '<h2>Wat is jou naam?</h2>' +
      '<input id="pname" class="namein" maxlength="20" autocomplete="off" placeholder="Naam">' +
      '<h2>Kies jou prentjie</h2>' +
      '<div class="avatars">' + AVATARS.map(function (a, i) { return '<button class="avpick' + (i === 0 ? ' on' : '') + '" data-act="av" data-a="' + a + '">' + a + '</button>'; }).join('') + '</div>' +
      '<button class="btn big go" data-act="saveProfile">Klaar ✓</button>' +
      (first ? '<p class="note fine">' + DISCLAIMER + '</p>' + SPONSOR : '<button class="btn ghost" data-act="profiles">Terug</button>') +
      '</div>', 'bg-home');
    var inp = document.getElementById('pname');
    inp.focus();
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') act.saveProfile(); });
  }

  /* ============ Tuis ============ */
  function nextWs() {
    var d = S.data(), last = d.lastWs ? byId(d.lastWs) : null;
    if (!last) return CUR[0];
    var lw = d.ws[last.id];
    if (lw && lw.best < 2) return last;
    for (var i = last.idx + 1; i < CUR.length; i++) {
      var w = d.ws[CUR[i].id];
      if (!w || w.best < 3) return CUR[i];
    }
    for (var j = 0; j < CUR.length; j++) { var x = d.ws[CUR[j].id]; if (!x || x.best < 3) return CUR[j]; }
    return CUR[0];
  }
  function bookProgress(book) {
    var list = CUR.filter(function (w) { return w.book === book; }), d = S.data(), stars = 0;
    list.forEach(function (w) { if (d.ws[w.id]) stars += d.ws[w.id].best; });
    return { stars: stars, max: list.length * 3 };
  }
  function showHome() {
    var p = S.current();
    if (!p) return showProfiles();
    var nx = nextWs();
    var b1 = bookProgress(1), b2 = bookProgress(2);
    function bookCard(b, pr, terms) {
      return '<button class="bookcard b' + b + '" data-act="book" data-b="' + b + '">' +
        '<span class="bk">Boek ' + b + '</span><span class="bt">Kwartaal ' + terms + '</span>' +
        '<span class="bw">Werkblaaie ' + (b === 1 ? '1 – 64' : '65 – 128') + '</span>' +
        '<span class="bar"><i style="width:' + Math.round(100 * pr.stars / pr.max) + '%"></i></span>' +
        '<span class="bs">' + pr.stars + ' / ' + pr.max + ' ★</span></button>';
    }
    render('<div class="page">' +
      '<header class="hbar"><button class="me" data-act="profiles"><span class="av">' + p.avatar + '</span>' + esc(p.name) + '</button>' +
      '<span class="total">⭐ ' + S.totalStars() + '</span>' +
      '<button class="icon" data-act="parents" title="Ouerhoek">⚙️</button></header>' +
      '<h1 class="hello">Hallo, ' + esc(p.name) + '!</h1>' +
      '<button class="nextbtn" data-act="intro" data-id="' + nx.id + '" style="--c:' + TERM_COL[nx.term] + '">' +
      '<span class="nb">' + nx.id + '</span><span class="nt"><small>Speel volgende</small>' + esc(nx.title) + '</span><span class="play">▶</span></button>' +
      '<div class="books">' + bookCard(1, b1, '1 & 2') + bookCard(2, b2, '3 & 4') + '</div>' +
      '<button class="btn wide review" data-act="review">🔁 Hersiening: oefen gemengde vrae</button>' +
      installSlot() + strip() + SPONSOR + '</div>', 'bg-home');
    W.Update.check();
  }

  /* ============ Boek ============ */
  var lastTerm = {};
  function showBook(book, term) {
    term = term || lastTerm[book] || (book === 1 ? 1 : 3);
    lastTerm[book] = term;
    var terms = book === 1 ? [1, 2] : [3, 4], d = S.data();
    var list = CUR.filter(function (w) { return w.term === term; });
    render('<div class="page">' +
      '<header class="hbar"><button class="icon" data-act="home">⬅</button><h1>Boek ' + book + '</h1><span class="total">⭐ ' + S.totalStars() + '</span></header>' +
      '<div class="tabs">' + terms.map(function (t) {
        return '<button class="tab' + (t === term ? ' on' : '') + '" style="--c:' + TERM_COL[t] + '" data-act="term" data-b="' + book + '" data-t="' + t + '">Kwartaal ' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="tiles">' + list.map(function (w) {
        var info = d.ws[w.id];
        return '<button class="tile' + (info ? ' played' : '') + '" style="--c:' + TERM_COL[w.term] + '" data-act="intro" data-id="' + w.id + '">' +
          '<span class="tnum">' + w.id + '</span><span class="ttitle">' + esc(w.title) + '</span>' + starStr(info ? info.best : 0) + '</button>';
      }).join('') + '</div></div>', 'bg-book');
  }

  function showIntro(id) {
    var w = byId(id), info = S.wsInfo(w.id);
    var skills = {};
    w.ex.forEach(function (e) {
      try { skills[W.G[e[0]](e[1]).skill] = 1; } catch (er) { }
    });
    render('<div class="page center">' +
      '<header class="hbar"><button class="icon" data-act="book" data-b="' + w.book + '">⬅</button><span></span></header>' +
      '<div class="bigbadge" style="--c:' + TERM_COL[w.term] + '">' + w.id + '</div>' +
      '<h1 class="wtitle">' + esc(w.title) + '</h1>' +
      '<p class="meta">Boek ' + w.book + ' · Kwartaal ' + w.term + ' · bladsy ' + w.bl + '</p>' +
      '<div class="skills">' + Object.keys(skills).map(function (s) { return '<span>' + esc(W.SKILLS[s]) + '</span>'; }).join('') + '</div>' +
      (info ? '<p class="best">Beste: ' + starStr(info.best) + '</p>' : '') +
      '<button class="btn big go" data-act="start" data-id="' + w.id + '">▶ Begin</button>' +
      (w.ex.some(function (e) { return W.Tutor.hasLesson(e[0]); }) ? '<br><button class="btn learn" data-act="learn" data-id="' + w.id + '">🐸 Leer my</button>' : '') +
      '</div>', 'bg-book');
  }

  /* ============ Speel ============ */
  function plan(specs, n) {
    var out = [], bag = [];
    while (out.length < n) {
      if (!bag.length) bag = U.shuffle(specs.slice());
      out.push(bag.pop());
    }
    return out;
  }
  function startSession(ws, review) {
    var n = S.settings().qCount || 8, items;
    if (review) items = review;
    else items = plan(ws.ex.map(function (e) { return { gen: e[0], p: e[1], ws: ws.id }; }), n);
    sess = {
      ws: ws, review: !!review, items: items.map(function (it) { return Object.assign({ scored: true, state: 'todo' }, it); }),
      i: 0, ft: 0, scoredN: items.length, extra: 0, seen: {}, touched: {}, fbTok: 0
    };
    nextQuestion();
  }
  function genQuestion(it) {
    var q, sig, tries = 0;
    do {
      q = W.G[it.gen](it.p);
      sig = q.prompt + '|' + q.input.answer + '|' + (q.visual || '').length;
      tries++;
    } while (sess.seen[sig] && tries < 8);
    sess.seen[sig] = 1;
    return q;
  }
  function nextQuestion() {
    if (sess.i >= sess.items.length) return finish();
    var it = sess.items[sess.i];
    sess.q = genQuestion(it);
    sess.attempts = 0;
    sess.locked = false;
    sess.helped = false;
    sess.misSeen = [];
    sess.ev = {};       // bewys per vaardigheid vir hierdie vraag (hoogstens een keer)
    sess.hintSay = [];
    renderQuestion();
  }
  function dots() {
    return sess.items.map(function (it, i) {
      return '<i class="' + (i === sess.i ? 'now' : it.state) + (it.scored ? '' : ' extra') + '"></i>';
    }).join('');
  }
  function renderQuestion() {
    var q = sess.q, it = sess.items[sess.i], ws = byId(it.ws);
    render('<div class="play">' +
      '<div class="topbar"><button class="icon" data-act="quit">✕</button><div class="dots">' + dots() + '</div>' +
      (W.Voice.available() ? '<button class="icon" data-act="speak">🔊</button>' : '<span class="icon"></span>') + '</div>' +
      '<div class="wsrow"><div class="wsline" style="--c:' + TERM_COL[ws.term] + '"><b>' + ws.id + '</b> ' + esc(ws.title) + '</div>' +
      '<button class="wsnote" data-act="note" aria-label="Help om die app te verbeter" title="Help om die app te verbeter">💬</button></div>' +
      '<div class="prompt">' + esc(q.prompt) + '</div>' +
      (W.Tutor.hasLesson(it.gen) ? '<div class="helprow"><button class="helpbtn" data-act="showme">💡 Wys my hoe</button></div>' : '') +
      (q.visual ? '<div class="visual">' + q.visual + '</div>' : '') +
      '<div class="answer" id="answer"></div>' +
      '</div><div class="feedback" id="fb"></div>', 'bg-play');
    renderInput();
    if (S.settings().autoSpeak) setTimeout(speakQ, 250);
  }
  function speakQ() { if (sess && sess.q && !document.querySelector('.tutor-ov')) W.Voice.speak(sess.q.say || sess.q.prompt); }

  function renderInput() {
    var q = sess.q, inp = q.input, el = document.getElementById('answer');
    if (inp.kind === 'choice') {
      var canSay = W.Voice.available() && inp.layout === 'words' && inp.speakOptions !== false;
      el.innerHTML = '<div class="choices ' + (inp.layout || 'nums') + '">' + inp.options.map(function (o, i) {
        var btn = '<button class="ch" data-act="choose" data-i="' + i + '">' + (o.html != null ? o.html : esc(o.label)) + '</button>';
        return canSay ? '<div class="chwrap">' + btn + '<button class="sayopt" data-act="sayopt" data-i="' + i + '" aria-label="Lees">🔈</button></div>' : btn;
      }).join('') + '</div>';
    } else if (inp.kind === 'number') {
      sess.typed = '';
      el.innerHTML = '<div class="numin"><div class="display" id="disp">' + (inp.prefix || '') + '<span class="cur">?</span></div>' +
        '<div class="pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (d) { return '<button data-act="key" data-k="' + d + '">' + d + '</button>'; }).join('') +
        '<button class="del" data-act="key" data-k="del">⌫</button><button data-act="key" data-k="0">0</button>' +
        '<button class="ok" data-act="key" data-k="ok">✓</button></div></div>';
    } else if (inp.kind === 'colour') {
      sess.on = [];
      el.innerHTML = '<div class="colgrid">' + U.range(0, inp.total - 1).map(function (i) {
        return '<button class="cshape" data-act="tog" data-i="' + i + '">' + V.shape(inp.shape, { fill: '#fff', size: 46 }) + '</button>';
      }).join('') + '</div><button class="btn go" data-act="checkColour">Klaar ✓</button>';
    } else if (inp.kind === 'order') {
      sess.slots = []; sess.pool = U.range(0, inp.items.length - 1);
      renderOrder();
    } else if (inp.kind === 'trace') {
      el.innerHTML = '<div id="tracehost" class="tracehost"></div><div class="row"><button class="btn ghost" data-act="traceClear">Vee uit</button><button class="btn go" data-act="traceCheck">Klaar ✓</button></div>';
      var mountIt = function () { sess.tracer = W.Trace.mount(document.getElementById('tracehost'), inp.text); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(mountIt); else mountIt();
    }
  }
  function renderOrder() {
    var inp = sess.q.input, el = document.getElementById('answer');
    var emo = inp.items.some(function (x) { return /[^\d\s]/.test(x.label); });
    el.innerHTML = '<div class="slots' + (emo ? ' emo' : '') + '">' + inp.items.map(function (x, i) {
      var k = sess.slots[i];
      return '<button class="slot' + (k != null ? ' full' : '') + '" data-act="slot" data-i="' + i + '">' + (k != null ? esc(inp.items[k].label) : (i + 1)) + '</button>';
    }).join('') + '</div><div class="pool' + (emo ? ' emo' : '') + '">' + sess.pool.map(function (k) {
      return '<button class="ptile" data-act="pool" data-k="' + k + '">' + esc(inp.items[k].label) + '</button>';
    }).join('') + '</div>';
  }

  function feedback(kind, html, withNext) {
    var fb = document.getElementById('fb');
    if (!fb) return;
    fb.className = 'feedback show ' + kind;
    // 'n Wenk-strook kan weggetik word, sodat dit nie die syferblok bedek terwyl die kind weer probeer nie
    fb.innerHTML = '<div class="fbin"' + (kind === 'retry' ? ' data-act="fbhide"' : '') + '>' + html + (withNext ? '<button class="btn go" data-act="next">Volgende ➜</button>' : '') + '</div>';
  }
  /* Sê die wenk; die strook bly totdat die stem klaar is (minstens 3,5 s). */
  function sayHint(extra) {
    var tok = ++sess.fbTok, q0 = sess.q, t0 = Date.now();
    W.Voice.speak([].concat(extra || [], sess.hintSay)).then(function () {
      if (!sess || sess.q !== q0 || sess.fbTok !== tok || sess.locked) return;
      timer = setTimeout(function () {
        if (sess && sess.q === q0 && sess.fbTok === tok && !sess.locked) hideFeedback();
      }, Math.max(900, 3500 - (Date.now() - t0)));
    });
  }
  /* Bewys vir die leerdermodel: hoogstens een keer per vaardigheid per vraag. */
  function nodeEv(n, ok) {
    if (!n || sess.ev[n] != null) return;
    sess.ev[n] = ok; sess.touched[n] = 1;
    S.recordNode(n, ok);
  }
  function hideFeedback() { var fb = document.getElementById('fb'); if (fb) fb.className = 'feedback'; }

  /* value: die gekose/getikte antwoord, sodat die tutor 'n bekende fout kan herken */
  function result(ok, value) {
    if (sess.locked) return;
    clearTimeout(timer); // 'n wenk se wegsteek-tydhouer mag nie die "Volgende"-strook van die tweede fout wegsteek nie
    sess.fbTok++;
    var q = sess.q, it = sess.items[sess.i], path = W.Tutor.path(it.gen, q);
    if (ok) {
      sess.locked = true;
      // Hulp kos nie sterre nie: reg met die eerste probeerslag tel, ook ná "Wys my hoe" (oranje kolletjie).
      var first = sess.attempts === 0, alone = first && !sess.helped;
      if (it.scored) { if (first) sess.ft++; if (!sess.helped) S.recordAnswer(q.skill, first); }
      if (alone) W.Tutor.testable(q, path).forEach(function (n) { nodeEv(n, true); });
      it.state = alone ? 'good' : 'help';
      W.Sfx.good();
      var pr = U.pick(AF.PRAISE);
      feedback('good', '<span class="big">✓</span> ' + pr);
      W.Voice.speak(pr);
      timer = setTimeout(advance, 1300);
      return;
    }
    sess.attempts++;
    W.Sfx.bad();
    var misId = value != null && q.mis ? q.mis[String(value)] : null;
    if (misId) {
      if (sess.misSeen.indexOf(misId) < 0) { S.recordMis(misId); nodeEv(W.Tutor.misNode(misId, path), false); } // een keer per vraag
      sess.misSeen.push(misId);
    } else nodeEv(path[path.length - 1], false); // onbekende fout: teen die doelvaardigheid
    if (sess.attempts >= 2) {
      sess.locked = true;
      if (it.scored && !sess.helped) S.recordAnswer(q.skill, false);
      it.state = 'help';
      reveal();
      feedback('reveal', '<b>Kom ons kyk saam.</b> ' + esc(q.explain), true);
      if (W.Tutor.hasLesson(it.gen)) {
        // Juffrou Padda wys hoe, op hierdie vraag, en begin by die fout wat ons herken het
        var lastMis = sess.misSeen[sess.misSeen.length - 1];
        var intro = lastMis ? W.MIS[lastMis].tutor : 'Kom ons kyk saam hoe om dit te doen.';
        W.Tutor.play(lastMis ? W.LESSONS.forMistake(lastMis, it.gen, q, intro) : W.LESSONS[it.gen](q, intro), { done: 'Klaar ✓' });
      } else W.Voice.speak(q.explain);
      // Oefen hierdie soort vraag later weer (hoogstens 3 ekstra vrae)
      if (sess.extra < 3 && q.input.kind !== 'trace') {
        sess.extra++;
        sess.items.push({ gen: it.gen, p: it.p, ws: it.ws, scored: false, state: 'todo' });
      }
      return;
    }
    // Kort fout-wenk (as ons die fout herken) en dan die vraag se eie wenk, met die getalle van hierdie vraag
    var msg = U.pick(AF.TRY_AGAIN);
    sess.hintSay = [misId ? W.MIS[misId].child : null, q.hint].filter(Boolean);
    feedback('retry', '<b>' + esc(msg) + '</b> ' + esc(sess.hintSay.join(' ')));
    sayHint(msg);
  }
  function advance() { hideFeedback(); sess.i++; nextQuestion(); }

  function reveal() {
    var inp = sess.q.input;
    if (inp.kind === 'choice') {
      document.querySelectorAll('.ch').forEach(function (b) {
        var o = inp.options[+b.dataset.i];
        if (String(o.value) === String(inp.answer)) b.classList.add('right');
        b.disabled = true;
      });
    } else if (inp.kind === 'number') {
      document.getElementById('disp').innerHTML = (inp.prefix || '') + inp.answer;
    } else if (inp.kind === 'order') {
      sess.slots = inp.answer.map(function (v) { return U.range(0, inp.items.length - 1).filter(function (k) { return String(inp.items[k].value) === String(v); })[0]; });
      sess.pool = [];
      renderOrder();
      document.querySelectorAll('.slot').forEach(function (s) { s.classList.add('right'); });
    }
  }

  /* ============ Resultate ============ */
  function finish() {
    var ws = sess.ws, n = sess.scoredN, ft = sess.ft, stars;
    S.endSession(Object.keys(sess.touched));
    if (sess.review) stars = S.starsFor(ft, n);
    else stars = S.recordSession(ws.id, ft, n);
    W.Sfx.win();
    var msg = stars === 3 ? W.AF.PHRASES.results3 : stars === 2 ? W.AF.PHRASES.results2 : W.AF.PHRASES.results1;
    var next = !sess.review && CUR[ws.idx + 1];
    render('<div class="page center results">' +
      '<div class="confetti">' + U.range(1, 18).map(function (i) {
        return '<i style="left:' + U.rnd(2, 96) + '%;animation-delay:' + (U.rnd(0, 900) / 1000) + 's">' + U.pick(['⭐', '🎉', '✨', '🌟']) + '</i>';
      }).join('') + '</div>' +
      '<div class="bigstars">' + [1, 2, 3].map(function (i) { return '<span class="' + (i <= stars ? 'on' : '') + '" style="animation-delay:' + (i * 0.25) + 's">★</span>'; }).join('') + '</div>' +
      '<h1>' + msg + '</h1>' +
      '<p class="lead">Jy het <b>' + ft + ' uit ' + n + '</b> die eerste keer reg gehad.</p>' +
      '<div class="col">' +
      (sess.review ? '<button class="btn big go" data-act="review">🔁 Nog hersiening</button>' :
        stars === 1 || !next ?
          '<button class="btn big go" data-act="start" data-id="' + ws.id + '">↻ Speel weer</button>' +
          (next ? '<button class="btn" data-act="intro" data-id="' + next.id + '">Volgende werkblad ➜</button>' : '') :
          '<button class="btn big go" data-act="intro" data-id="' + next.id + '">Volgende werkblad ➜</button>' +
          '<button class="btn" data-act="start" data-id="' + ws.id + '">↻ Speel weer</button>') +
      '<button class="btn ghost" data-act="home">🏠 Tuis</button></div></div>', 'bg-home');
    W.Voice.speak(msg);
  }

  /* ============ Hersiening ============ */
  /* Hersiening hou vas wat die kind reeds kan: net werkblaaie wat klaar gespeel is met minstens 2 sterre
     (70% reg met die eerste probeerslag). Werkblaaie wat lank laas gespeel is, kom meer gereeld (gespreide
     herhaling). Werkblaaie met 1 ster bly uit; dié speel 'n mens weer self (die ouerhoek wys watter). */
  function startReview() {
    var d = S.data(), played = CUR.filter(function (w) { return d.ws[w.id]; });
    var good = played.filter(function (w) { return d.ws[w.id].best >= 2; });
    if (!good.length) {
      render('<div class="page center"><h1>Hersiening</h1><p class="lead">' + (played.length ?
        'Hier oefen ons wat jy al goed kan. Kry eers 2 of 3 sterre op ’n werkblad, dan kom dit in die hersiening.' :
        'Speel eers ’n paar werkblaaie. Dan maak ons vir jou ’n gemengde oefening van wat jy al goed kan.') + '</p>' +
        '<button class="btn big go" data-act="home">🏠 Tuis</button></div>', 'bg-home');
      return;
    }
    played = good;
    var now = Date.now();
    var weights = played.map(function (w) {
      var info = d.ws[w.id], days = Math.min(21, (now - info.last) / 864e5);
      return 1 + days / 3 + (info.best === 2 ? 1 : 0);
    });
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    var items = [];
    for (var k = 0; k < 10; k++) {
      var r = Math.random() * sum, i = 0;
      while (r > weights[i] && i < weights.length - 1) { r -= weights[i]; i++; }
      var w = played[i], e = U.pick(w.ex);
      items.push({ gen: e[0], p: e[1], ws: w.id });
    }
    startSession({ id: 'hersiening', title: 'Hersiening', term: 1, idx: -1 }, items);
  }

  /* ============ Ouerhoek ============ */
  function showGate() {
    var a = U.rnd(6, 9), b = U.rnd(6, 9);
    sess = null;
    render('<div class="page center"><header class="hbar"><button class="icon" data-act="home">⬅</button><span></span></header>' +
      '<h1>Ouerhoek</h1><p class="lead">Vir ouers en onderwysers. Beantwoord om voort te gaan:</p>' +
      '<p class="gateq">' + a + ' × ' + b + ' = <input id="gate" type="number" inputmode="numeric" class="namein short"></p>' +
      '<button class="btn go" data-act="gate" data-a="' + (a * b) + '">Gaan voort</button></div>', 'bg-book');
    var g = document.getElementById('gate'); g.focus();
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter') act.gate({ a: String(a * b) }); });
  }
  function showParents() {
    var p = S.current(), d = S.data(), st = S.settings();
    var termRows = [1, 2, 3, 4].map(function (t) {
      var list = CUR.filter(function (w) { return w.term === t; });
      var played = list.filter(function (w) { return d.ws[w.id]; }).length;
      var mastered = list.filter(function (w) { return d.ws[w.id] && d.ws[w.id].best === 3; }).length;
      return '<tr><td>Kwartaal ' + t + '</td><td><span class="bar"><i style="width:' + Math.round(100 * mastered / list.length) + '%;background:' + TERM_COL[t] + '"></i></span></td>' +
        '<td>' + mastered + ' / ' + list.length + ' bemeester<br><small>' + played + ' gespeel</small></td></tr>';
    }).join('');
    var skillRows = Object.keys(W.SKILLS).map(function (k) {
      var s = d.skills[k];
      if (!s) return '';
      var acc = S.skillAcc(k), pct = Math.round(acc * 100);
      var flag = acc < 0.7 ? '<span class="flag">Oefen nog</span>' : acc >= 0.9 ? '<span class="flag ok">Sterk</span>' : '';
      return '<tr><td>' + esc(W.SKILLS[k]) + '</td><td><span class="bar"><i style="width:' + pct + '%;background:' + (acc < 0.7 ? '#fb8c00' : '#43a047') + '"></i></span></td><td>' + pct + '% ' + flag + '<br><small>' + s.t + ' vrae</small></td></tr>';
    }).join('');
    var weak = CUR.filter(function (w) { return d.ws[w.id] && d.ws[w.id].best < 3; });
    var vinfo = W.Voice.info();
    var voiceTxt = W.Voice.recorded() ?
      'Stem: <b>Adri</b>, ’n Afrikaanse rekenaarstem (Microsoft Azure), ingebou in die app. Dit werk op enige foon of rekenaar. ' +
      '<button class="btn small" data-act="testVoice">Toets</button><br>' +
      '<button class="btn small" data-act="voiceDownload">Laai die stem af vir vanlyn gebruik' + (vinfo && vinfo.mb ? ' (' + vinfo.mb + ' MB)' : '') + '</button>' :
      W.Say.available() ? 'Afrikaanse stem op hierdie toestel: <b>' + esc(W.Say.voiceName()) + '</b> <button class="btn small" data-act="testVoice">Toets</button>' :
      'Die stem kon nie gelaai word nie. Maak seker jy is aan die internet gekoppel en probeer weer.';
    render('<div class="page parents">' +
      '<header class="hbar"><button class="icon" data-act="home">⬅</button><h1>Ouerhoek</h1><span></span></header>' +
      '<section><h2>' + p.avatar + ' ' + esc(p.name) + ' se vordering</h2>' +
      '<table class="ptable">' + termRows + '</table></section>' +
      tutorReport(p, d) +
      '<section><h2>Vaardighede</h2>' + (skillRows ? '<p class="note">Persentasie reg met die eerste probeerslag (laaste 20 vrae per vaardigheid). Vrae waar 💡 Wys my hoe gebruik is, tel nie hier nie.</p><table class="ptable">' + skillRows + '</table>' : '<p class="note">Nog geen vrae beantwoord nie.</p>') + '</section>' +
      (weak.length ? '<section><h2>Werkblaaie om weer te oefen</h2><div class="weak">' + weak.map(function (w) {
        return '<button class="chip" style="--c:' + TERM_COL[w.term] + '" data-act="intro" data-id="' + w.id + '"><b>' + w.id + '</b> ' + esc(w.title) + ' ' + starStr(d.ws[w.id].best) + '</button>';
      }).join('') + '</div></section>' : '') +
      '<section><h2>💬 Help om die app te verbeter</h2><p class="note">Sien jy ’n fout, klink ’n woord verkeerd, of het jy ’n idee? Stuur vir ons ’n kort nota. ' +
      'Op ’n vraag self is daar ook ’n 💬-knoppie wat die vraag saamstuur. Onderwysers: kies “Onderwyser” en tik die verwysing wat jy gekry het. ' +
      'Moenie persoonlike inligting in die nota sit nie.</p>' +
      '<button class="btn small" data-act="note">Skryf ’n nota</button>' +
      (W.Notes.waiting() ? ' <small class="muted">' + W.Notes.waiting() + ' nota(s) wag vir internet</small>' : '') + '</section>' +
      '<section><h2>📲 Installeer die app</h2><div id="installPanel">' + W.Install.panel() + '</div></section>' +
      '<section><h2>Instellings</h2>' +
      '<label class="set">Vrae per werkblad <select id="qc">' + [5, 8, 10, 12].map(function (n) { return '<option' + (n === st.qCount ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
      '<label class="set"><input type="checkbox" id="as"' + (st.autoSpeak ? ' checked' : '') + '> Lees elke vraag outomaties hardop</label>' +
      '<label class="set"><input type="checkbox" id="snd"' + (st.sound !== false ? ' checked' : '') + '> Klankeffekte</label>' +
      '<p class="note">' + voiceTxt + '</p></section>' +
      '<section><h2>Speler</h2><div class="row wrap">' +
      '<button class="btn small" data-act="rename">Verander naam</button>' +
      '<button class="btn small" data-act="resetP">Begin vordering oor</button>' +
      '<button class="btn small danger" data-act="delP">Verwyder speler</button></div></section>' +
      '<section><h2>Oor hierdie app</h2><p class="note">Gebou rondom die DBO se Reënboog-werkboeke <i>Wiskunde in Afrikaans, Graad 1</i>: Boek 1 (Kwartaal 1 en 2, werkblaaie 1 – 64) en Boek 2 (Kwartaal 3 en 4, werkblaaie 65 – 128). ' +
      'Elke werkblad in die app het dieselfde nommer as in die boek en oefen dieselfde vaardighede met nuwe vrae elke keer. Drie sterre beteken die kind het 90% of meer met die eerste probeerslag reg gehad. Hulp met 💡 Wys my hoe kos nie sterre nie. ' +
      'Verkeerde antwoorde kry eers ’n wenk; ná ’n tweede fout wys die app die antwoord en kom later met ’n soortgelyke vraag terug. Vordering word net op hierdie toestel gestoor. Weergawe ' + W.VERSION + '.</p>' +
      '<p class="note">' + DISCLAIMER + '</p>' + SPONSOR + '</section>' +
      '</div>', 'bg-book');
    document.getElementById('qc').addEventListener('change', function (e) { S.setSetting('qCount', +e.target.value); });
    document.getElementById('as').addEventListener('change', function (e) { S.setSetting('autoSpeak', e.target.checked); });
    document.getElementById('snd').addEventListener('change', function (e) { S.setSetting('sound', e.target.checked); });
  }

  /* "Waar sukkel ...?": wortelgapings, herhaalde foute (met wenke vir tuis) en die vaardigheidskaart */
  function tutorReport(p, d) {
    var r = W.Tutor.report(d), nodes = d.nodes || {};
    var any = Object.keys(nodes).length;
    var html = '<section><h2>🐸 Waar sukkel ' + esc(p.name) + '?</h2>';
    if (!any) return html + '<p class="note">Juffrou Padda hou dop watter klein vaardighede al vas is. Speel ’n paar werkblaaie, dan verskyn die verslag hier.</p></section>';
    if (r.roots.length) {
      html += '<h3>Begin hier</h3><ul class="roots">' + r.roots.map(function (x) {
        return '<li><b>' + esc(x.name) + '</b> <span class="flag">' + x.ok + ' uit ' + x.n + ' reg</span>' +
          (x.blocks.length ? '<br><small>Dit hou ook terug: ' + esc(x.blocks.join(', ')) + '</small>' : '') + '</li>';
      }).join('') + '</ul>';
    } else html += r.watching ? '<p class="note">Juffrou Padda hou ' + r.watching + ' vaardighe' + (r.watching > 1 ? 'de' : 'id') + ' dop (rooi in die kaart hier onder). ’n Swak plek verskyn hier eers as dit twee werkblaaie agtereen moeilik was.</p>' :
      '<p class="note">Geen swak plekke nie. 🎉</p>';
    if (r.mis.length) {
      html += '<h3>Foute wat herhaal word (laaste 14 dae)</h3><ul class="misl">' + r.mis.slice(0, 5).map(function (m) {
        return '<li>' + esc(m.parent) + ' <span class="flag">' + m.n + '×</span><br><small>💡 Tuis: ' + esc(m.home) + '</small></li>';
      }).join('') + '</ul>';
    }
    html += '<h3>Vaardigheidskaart</h3><div class="smap">' + Object.keys(W.SKILLGROUPS).map(function (g) {
      return '<div class="sgroup"><b>' + esc(W.SKILLGROUPS[g]) + '</b>' + Object.keys(W.SKILLMAP).filter(function (id) { return W.SKILLMAP[id].g === g; }).map(function (id) {
        return '<span class="snode ' + W.Tutor.nodeState(nodes, id) + '">' + esc(W.SKILLMAP[id].name) + '</span>';
      }).join('') + '</div>';
    }).join('') + '</div><p class="note">Groen: vas · Oranje: besig om te leer · Rooi: oefen nog · Grys: nog nie genoeg gesien nie (minstens 6 vrae).</p></section>';
    return html;
  }

  function confirmBox(text, yes, onYes) {
    var div = document.createElement('div');
    div.className = 'modal';
    div.innerHTML = '<div class="mbox"><p>' + esc(text) + '</p><div class="row"><button class="btn ghost" data-m="no">Nee</button><button class="btn go" data-m="yes">' + esc(yes) + '</button></div></div>';
    document.body.appendChild(div);
    div.addEventListener('click', function (e) {
      var m = e.target.getAttribute('data-m');
      if (m === 'yes') { div.remove(); onYes(); } else if (m === 'no' || e.target === div) div.remove();
    });
  }

  /* ============ Aksies ============ */
  var act = {
    pick: function (d) { S.setCurrent(d.id); showHome(); },
    newProfile: function () { showNewProfile(false); },
    profiles: function () { showProfiles(); },
    av: function (d, el) { document.querySelectorAll('.avpick').forEach(function (b) { b.classList.remove('on'); }); el.classList.add('on'); },
    saveProfile: function () {
      var name = (document.getElementById('pname').value || '').trim();
      if (!name) { document.getElementById('pname').classList.add('shake'); return; }
      var av = document.querySelector('.avpick.on');
      S.addProfile(name, av ? av.getAttribute('data-a') : '🦁');
      showHome();
    },
    home: function () { sess = null; showHome(); },
    book: function (d) { showBook(+d.b); },
    term: function (d) { showBook(+d.b, +d.t); },
    intro: function (d) { sess = null; showIntro(d.id); },
    start: function (d) { W.Sfx.tap(); startSession(byId(d.id)); },
    review: function () { startReview(); },
    parents: function () { showGate(); },
    gate: function (d) {
      var v = document.getElementById('gate').value;
      if (String(v).trim() === String(d.a)) showParents();
      else document.getElementById('gate').classList.add('shake');
    },
    speak: function () {
      // Terwyl 'n wenk-strook wys, herhaal 🔊 die wenk; anders die vraag
      var fb = document.getElementById('fb');
      if (fb && / show retry/.test(' ' + fb.className) && sess.hintSay.length) sayHint(); else speakQ();
    },
    fbhide: function () { if (sess) sess.fbTok++; hideFeedback(); },
    showme: function () {
      if (sess.locked) return;
      var it = sess.items[sess.i], q = sess.q, q2 = null;
      // 'n Soortgelyke vraag, sodat die antwoord nie weggegee word nie
      for (var k = 0; k < 30; k++) {
        q2 = W.G[it.gen](it.p);
        if (String(q2.input.answer) !== String(q.input.answer)) break;
      }
      sess.helped = true;
      W.Tutor.play(W.LESSONS[it.gen](q2, W.AF.PHRASES.showme), { done: W.AF.PHRASES.yourTurn }).then(function () {
        if (sess && sess.q === q && !sess.locked) speakQ();
      });
    },
    learn: function (d) {
      var w = byId(d.id), e = w.ex.filter(function (x) { return W.Tutor.hasLesson(x[0]); })[0];
      var q = W.G[e[0]](e[1]);
      W.Tutor.play(W.LESSONS[e[0]](q, W.AF.PHRASES.learn), { done: 'Klaar ✓' });
    },
    sayopt: function (d) { var o = sess.q.input.options[+d.i]; W.Voice.speak(o.label); },
    quit: function () {
      confirmBox('Wil jy ophou met hierdie werkblad?', 'Ja, stop', function () {
        var ws = sess && sess.ws;
        sess = null;
        if (ws && ws.book) showBook(ws.book, ws.term); else showHome();
      });
    },
    next: function () { advance(); },
    choose: function (d, el) {
      if (sess.locked || el.disabled) return;
      var inp = sess.q.input, o = inp.options[+d.i];
      var ok = String(o.value) === String(inp.answer);
      if (ok) el.classList.add('right'); else { el.classList.add('wrong'); el.disabled = true; }
      result(ok, o.value);
    },
    key: function (d) {
      if (sess.locked) return;
      var inp = sess.q.input, disp = document.getElementById('disp');
      if (d.k === 'del') sess.typed = sess.typed.slice(0, -1);
      else if (d.k === 'ok') {
        if (!sess.typed) return;
        var typed = +sess.typed, ok = typed === inp.answer;
        disp.classList.toggle('wrong', !ok);
        result(ok, typed);
        if (!ok && !sess.locked) sess.typed = '';
        if (ok) disp.classList.add('right');
      } else if (sess.typed.length < 3) { sess.typed += d.k; disp.classList.remove('wrong'); }
      W.Sfx.tap();
      if (!sess.locked) disp.innerHTML = (inp.prefix || '') + (sess.typed || '<span class="cur">?</span>');
    },
    tog: function (d, el) {
      if (sess.locked) return;
      var inp = sess.q.input, i = +d.i, k = sess.on.indexOf(i);
      if (k >= 0) sess.on.splice(k, 1); else sess.on.push(i);
      el.innerHTML = V.shape(inp.shape, { fill: k >= 0 ? '#fff' : inp.colour, size: 46 });
      W.Sfx.tap();
    },
    checkColour: function () {
      if (sess.locked) return;
      var inp = sess.q.input, n = sess.on.length;
      if (n === inp.target) return result(true);
      sess.q.hint = W.AF.colourHint(n, inp.target);
      result(false);
    },
    pool: function (d) {
      if (sess.locked) return;
      var k = +d.k, inp = sess.q.input;
      sess.pool = sess.pool.filter(function (x) { return x !== k; });
      var free = 0; while (sess.slots[free] != null) free++;
      sess.slots[free] = k;
      W.Sfx.tap();
      renderOrder();
      if (sess.slots.filter(function (x) { return x != null; }).length === inp.items.length) {
        var ok = sess.slots.every(function (k2, i) { return String(inp.items[k2].value) === String(inp.answer[i]); });
        if (!ok && sess.attempts === 0) {
          result(false);
          setTimeout(function () { if (!sess || sess.locked) return; sess.slots = []; sess.pool = U.range(0, inp.items.length - 1); renderOrder(); }, 900);
        } else result(ok);
      }
    },
    slot: function (d) {
      if (sess.locked) return;
      var i = +d.i, k = sess.slots[i];
      if (k == null) return;
      sess.slots[i] = null; sess.pool.push(k);
      renderOrder();
    },
    traceClear: function () { if (sess.tracer) sess.tracer.clear(); },
    traceCheck: function () {
      if (sess.locked || !sess.tracer) return;
      if (!sess.tracer.hasInk()) { feedback('retry', '<b>' + esc(W.AF.PHRASES.traceFirst) + '</b>'); W.Voice.speak(W.AF.PHRASES.traceFirst); timer = setTimeout(hideFeedback, 2500); return; }
      var sc = sess.tracer.score();
      var ok = sc.coverage >= 0.5 && sc.inside >= 0.6;
      if (ok || sess.attempts >= 1) {
        if (!ok) sess.attempts++;
        return result(true);
      }
      sess.q.hint = sc.coverage < 0.5 ? W.AF.PHRASES.traceAll : W.AF.PHRASES.traceInside;
      result(false);
      setTimeout(function () { if (sess && sess.tracer && !sess.locked) sess.tracer.clear(); }, 600);
    },
    testVoice: function () { W.Voice.speak(W.AF.PHRASES.test); },
    install: function () { W.Install.prompt(); },
    installLater: function () { W.Install.later(); },
    note: function () {
      var ctx = null;
      if (sess && sess.q && document.querySelector('.play')) {
        var it = sess.items[sess.i], q = sess.q, inp = q.input;
        ctx = {
          ws: it.ws, title: byId(it.ws).title, n: (sess.i + 1) + '/' + sess.items.length, review: sess.review || undefined,
          gen: it.gen, p: it.p, prompt: String(q.prompt).slice(0, 300), kind: inp.kind, answer: inp.answer,
          options: inp.options ? inp.options.map(function (o) { return o.label != null ? String(o.label) : String(o.value); }) : undefined,
          attempts: sess.attempts
        };
      }
      W.Notes.open(ctx);
    },
    voiceDownload: function (d, el) {
      el.disabled = true;
      W.Voice.downloadAll(function (done, total) { el.textContent = 'Laai af… ' + Math.round(100 * done / total) + '%'; })
        .then(function (ok) { el.textContent = ok ? '✓ Die stem werk nou ook vanlyn' : 'Kon nie aflaai nie'; });
    },
    rename: function () {
      var p = S.current(), n = window.prompt('Nuwe naam:', p.name);
      if (n && n.trim()) { S.renameProfile(p.id, n.trim()); showParents(); }
    },
    resetP: function () {
      var p = S.current();
      confirmBox('Vee al ' + p.name + ' se sterre en vordering uit?', 'Ja, begin oor', function () { S.resetProgress(p.id); showParents(); });
    },
    delP: function () {
      var p = S.current();
      confirmBox('Verwyder ' + p.name + ' heeltemal?', 'Ja, verwyder', function () { S.removeProfile(p.id); showProfiles(); });
    }
  };

  $app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t || !$app.contains(t)) return;
    var name = t.getAttribute('data-act');
    if (act[name]) act[name](t.dataset, t, e);
  });
  document.addEventListener('keydown', function (e) {
    if (!sess || !sess.q || document.querySelector('.modal, .tutor-ov')) return;
    var inp = sess.q.input;
    if (inp.kind === 'number' && /^[0-9]$/.test(e.key)) act.key({ k: e.key });
    else if (inp.kind === 'number' && e.key === 'Backspace') act.key({ k: 'del' });
    else if (e.key === 'Enter') {
      if (sess.locked) { var nb = document.querySelector('#fb [data-act="next"]'); if (nb) advance(); }
      else if (inp.kind === 'number') act.key({ k: 'ok' });
    } else if (inp.kind === 'choice' && /^[1-4]$/.test(e.key)) {
      var b = document.querySelectorAll('.ch')[+e.key - 1];
      if (b) act.choose({ i: b.dataset.i }, b);
    }
  });

  // Vir toetse: kyk na die huidige sessie
  W.App = { session: function () { return sess; } };

  // Begin
  W.Voice.load();
  if (S.current()) showHome(); else showProfiles();

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
})();
