/* Vraaggenerators: ruimte en vorm, patrone, kleure, posisie en rigting, simmetrie. */
var W = window.W || (window.W = {});
W.G = W.G || {};

(function (G) {
  var U = W.U, V = W.V, AF = W.AF;
  var rnd = U.rnd, pick = U.pick, numInput = G._numInput;
  var PL = { sirkel: 'sirkels', vierkant: 'vierkante', driehoek: 'driehoeke', reghoek: 'reghoeke', ovaal: 'ovale', ruit: 'ruite', ster: 'sterre', hart: 'harte' };
  var FILLS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#fb8c00', '#8e24aa', '#8d6e63'];

  G.shapeName = function (p) {
    var set = p.set || ['sirkel', 'vierkant', 'driehoek', 'reghoek'];
    var s = pick(set);
    return {
      skill: 'vorms',
      prompt: 'Watter vorm is dit?',
      visual: V.shape(s, { fill: pick(FILLS), size: 110, rot: s === 'driehoek' || s === 'reghoek' ? pick([0, 0, 15, -15]) : 0 }),
      input: { kind: 'choice', answer: s, layout: 'words', options: U.listChoices(s, set, Math.min(set.length, 4)) },
      hint: 'Tel die hoeke en kyk na die sye.',
      explain: 'Dit is ’n ' + s + '.'
    };
  };

  G.findShape = function (p) {
    var set = p.set || ['sirkel', 'vierkant', 'driehoek', 'reghoek'];
    var opts = U.sample(set, Math.min(set.length, 4)), s = pick(opts);
    return {
      skill: 'vorms',
      prompt: 'Tik op die ' + s + '.',
      visual: '',
      input: { kind: 'choice', answer: s, layout: 'pics', options: opts.map(function (o) { return { value: o, html: V.shape(o, { fill: pick(FILLS), size: 70 }) }; }) },
      hint: 'Onthou: ’n driehoek het 3 sye, ’n vierkant het 4 ewe lang sye.',
      explain: 'Dit was die ' + s + '.'
    };
  };

  G.shapeCount = function (p) {
    var set = p.set || ['sirkel', 'vierkant', 'driehoek', 'reghoek'];
    var list = [], counts = {};
    set.forEach(function (s) { counts[s] = rnd(1, p.max || 5); for (var i = 0; i < counts[s]; i++) list.push({ type: s, fill: pick(FILLS), rot: s === 'driehoek' || s === 'reghoek' ? pick([0, 0, 15, -15]) : 0 }); });
    var target = pick(set);
    return {
      skill: 'vorms',
      prompt: 'Hoeveel ' + PL[target] + ' is daar?',
      visual: V.shapeScene(U.shuffle(list)),
      input: numInput(counts[target], { mode: 'choice' }, { min: 0, max: (p.max || 5) + 2 }),
      hint: 'Soek net die ' + PL[target] + '. Tel elkeen net een keer.',
      explain: 'Daar is ' + counts[target] + ' ' + (counts[target] === 1 ? target : PL[target]) + '.'
    };
  };

  /* Kleur vorms per kleur: hoeveel rooi sirkels */
  G.colourCount = function (p) {
    var cols = U.sample(AF.COLOURS.slice(0, 5), 3), list = [], counts = {};
    var shape = pick(['sirkel', 'ster', 'hart']);
    cols.forEach(function (c) { counts[c.n] = rnd(1, p.max || 6); for (var i = 0; i < counts[c.n]; i++) list.push({ type: shape, fill: c.c }); });
    var t = pick(cols);
    return {
      skill: 'data',
      prompt: 'Hoeveel ' + t.n + ' ' + PL[shape] + ' is daar?',
      visual: V.shapeScene(U.shuffle(list)),
      input: numInput(counts[t.n], { mode: 'choice' }, { min: 0, max: (p.max || 6) + 2 }),
      hint: 'Sorteer in jou kop: kyk net na die ' + t.n + ' ' + PL[shape] + '.',
      explain: 'Daar is ' + counts[t.n] + ' ' + t.n + ' ' + (counts[t.n] === 1 ? shape : PL[shape]) + '.'
    };
  };

  G.shapeSides = function (p) {
    var v = p.sidesOnly ? 0 : rnd(0, 1);
    if (v === 0) {
      var s = pick(['sirkel', 'vierkant', 'driehoek', 'reghoek', 'ovaal']);
      var ans = s === 'sirkel' || s === 'ovaal' ? 'ronde sye' : 'reguit sye';
      return {
        skill: 'vorms',
        prompt: 'Het hierdie vorm reguit sye of ronde sye?',
        visual: V.shape(s, { fill: pick(FILLS), size: 110 }),
        input: { kind: 'choice', answer: ans, layout: 'words', options: [{ value: 'reguit sye', label: 'reguit sye' }, { value: 'ronde sye', label: 'ronde sye' }] },
        hint: 'Trek met jou vinger om die vorm. Is dit reguit of rond?',
        explain: 'Die ' + s + ' het ' + ans + '.'
      };
    }
    var t = pick([['driehoek', 3], ['vierkant', 4], ['reghoek', 4]]);
    return {
      skill: 'vorms',
      prompt: 'Hoeveel sye het ’n ' + t[0] + '?',
      visual: V.shape(t[0], { fill: pick(FILLS), size: 110 }),
      input: numInput(t[1], { mode: 'choice' }, { min: 2, max: 6 }),
      hint: 'Tel die reguit lyne om die vorm.',
      explain: '’n ' + AF.cap(t[0]) + ' het ' + t[1] + ' sye.'
    };
  };

  /* 3D: bal of boks, rol of gly, toring bou, plat of nie */
  var BALLS = ['⚽', '🏀', '🍊', '🌍', '🎾', '🏐'], BOXES = ['📦', '🎁', '🎲'];
  G.solid3D = function (p) {
    var v = p.only != null ? p.only : rnd(0, p.flat ? 3 : 2);
    if (v === 0) {
      var isBall = U.chance(0.5), e = pick(isBall ? BALLS : BOXES);
      return {
        skill: 'vorms',
        prompt: 'Lyk dit soos ’n bal of soos ’n boks?',
        visual: '<div class="wpic">' + e + '</div>',
        input: { kind: 'choice', answer: isBall ? 'bal' : 'boks', layout: 'pics', options: [{ value: 'bal', html: V.solid('bal') + '<small>bal</small>' }, { value: 'boks', html: V.solid('boks') + '<small>boks</small>' }] },
        hint: 'Is dit rond oral, of het dit plat kante?',
        explain: 'Dit lyk soos ’n ' + (isBall ? 'bal' : 'boks') + '.'
      };
    }
    if (v === 1) {
      var ball = U.chance(0.5), sol = pick(ball ? ['bal'] : ['boks']);
      var em = pick(ball ? BALLS : BOXES);
      return {
        skill: 'vorms',
        prompt: 'Sal dit rol of gly as jy dit stoot?',
        visual: '<div class="wpic">' + em + '</div>',
        input: { kind: 'choice', answer: ball ? 'rol' : 'gly', layout: 'words', options: [{ value: 'rol', label: 'rol' }, { value: 'gly', label: 'gly' }] },
        hint: 'Ronde dinge rol. Dinge met plat kante gly.',
        explain: (ball ? 'Ronde dinge rol.' : 'Dinge met plat kante gly.')
      };
    }
    if (v === 2) {
      var items = U.range(1, 3).map(function () { return U.chance(0.6) ? pick(BOXES) : pick(BALLS); });
      var canStack = items.every(function (x) { return BOXES.indexOf(x) >= 0; });
      return {
        skill: 'vorms',
        prompt: 'Kan jy ’n toring bou met al hierdie voorwerpe?',
        visual: '<div class="wpic">' + items.join(' ') + '</div>',
        input: { kind: 'choice', answer: canStack ? 'ja' : 'nee', layout: 'words', options: [{ value: 'ja', label: 'ja' }, { value: 'nee', label: 'nee' }] },
        hint: 'Kan ’n bal stil bo-op iets bly lê?',
        explain: canStack ? 'Bokse kan bo-op mekaar staan.' : 'Balle rol af, so die toring sal val.'
      };
    }
    var flat = U.chance(0.5);
    return {
      skill: 'vorms',
      prompt: 'Is dit ’n plat vorm (2D) of ’n voorwerp (3D)?',
      visual: flat ? V.shape(pick(['sirkel', 'vierkant', 'driehoek']), { fill: pick(FILLS), size: 100 }) : V.solid(pick(['bal', 'boks', 'blik', 'keel'])),
      input: { kind: 'choice', answer: flat ? '2D' : '3D', layout: 'words', options: [{ value: '2D', label: 'plat vorm (2D)' }, { value: '3D', label: 'voorwerp (3D)' }] },
      hint: '’n Voorwerp kan jy optel en vashou.',
      explain: flat ? 'Dit is ’n plat vorm.' : 'Dit is ’n voorwerp.'
    };
  };

  /* Patrone: wat kom volgende */
  G.pattern = function (p) {
    var kind = pick(p.kinds || ['colour', 'shape', 'emoji']);
    var unitLen = pick(p.units || [2, 3]);
    var core, render;
    if (kind === 'colour') {
      var cs = U.sample(FILLS, unitLen === 4 ? 3 : unitLen);
      core = unitLen === 3 && U.chance(0.4) ? [cs[0], cs[0], cs[1]] : unitLen === 4 ? [cs[0], cs[1], cs[2], cs[1]] : cs;
      render = function (c) { return V.shape('sirkel', { fill: c, size: 44 }); };
    } else if (kind === 'shape') {
      var ss = U.sample(['sirkel', 'vierkant', 'driehoek', 'ster', 'hart'], Math.min(unitLen, 3));
      var col = pick(FILLS);
      core = unitLen === 3 && U.chance(0.4) ? [ss[0], ss[0], ss[1]] : ss;
      render = function (s) { return V.shape(s, { fill: col, size: 44 }); };
    } else if (kind === 'shapecolour') {
      var a = { s: pick(['sirkel', 'vierkant']), c: FILLS[0] }, b = { s: pick(['driehoek', 'ster']), c: FILLS[1] }, c2 = { s: pick(['hart', 'ruit']), c: FILLS[2] };
      core = unitLen === 3 ? [a, b, c2] : [a, b];
      render = function (o) { return V.shape(o.s, { fill: o.c, size: 44 }); };
    } else {
      var es = U.sample(['🍎', '🍌', '⭐', '🐱', '🌸', '🎈', '🐟', '🚗'], Math.min(unitLen, 3));
      core = unitLen === 3 && U.chance(0.4) ? [es[0], es[0], es[1]] : es;
      render = function (e) { return '<span class="emo sm">' + e + '</span>'; };
    }
    var shown = rnd(core.length + 2, core.length * 2 + 1);
    var seq = U.range(0, shown - 1).map(function (i) { return core[i % core.length]; });
    var ans = core[shown % core.length];
    var key = function (x) { return typeof x === 'object' ? x.s + x.c : String(x); };
    var uniq = [];
    core.forEach(function (x) { if (uniq.map(key).indexOf(key(x)) < 0) uniq.push(x); });
    if (uniq.length < 3) {
      // voeg 'n afleier by
      if (kind === 'colour') uniq.push(FILLS.filter(function (f) { return core.indexOf(f) < 0; })[0]);
      else if (kind === 'shape') uniq.push(['ruit', 'ovaal'].filter(function (f) { return core.indexOf(f) < 0; })[0]);
      else if (kind === 'emoji') uniq.push(['🍉', '🐸'].filter(function (f) { return core.indexOf(f) < 0; })[0]);
      else uniq.push({ s: 'ovaal', c: FILLS[4] });
    }
    return {
      skill: 'patrone',
      prompt: 'Wat kom volgende in die patroon?',
      visual: '<div class="pat">' + seq.map(render).join('') + '<span class="q">?</span></div>',
      input: { kind: 'choice', answer: key(ans), layout: 'pics', options: U.shuffle(uniq).map(function (x) { return { value: key(x), html: render(x) }; }) },
      hint: 'Sê die patroon hardop. Wat herhaal elke keer?',
      explain: 'Die patroon herhaal elke ' + core.length + ' prentjies.'
    };
  };

  /* Watter een pas nie */
  G.oddOneOut = function (p) {
    var cats = [AF.FRUIT, AF.ANIMALS, AF.VEHICLES];
    var ci = U.sample([0, 1, 2], 2), main = U.sample(cats[ci[0]], 3), odd = pick(cats[ci[1]]);
    var items = U.shuffle(main.concat([odd]));
    var catName = ['vrugte', 'diere', 'voertuie'];
    return {
      skill: 'data',
      prompt: 'Watter een pas nie by die ander nie?',
      visual: '',
      input: { kind: 'choice', answer: odd, layout: 'pics', options: items.map(function (k) { return { value: k, html: '<span class="emo">' + AF.thing(k).e + '</span>' }; }) },
      hint: 'Drie van hulle is in dieselfde groep. Watter groep?',
      explain: 'Die ander is almal ' + catName[ci[0]] + '. Die ' + AF.thing(odd).s + ' pas nie.'
    };
  };

  G.colourName = function (p) {
    var set = AF.COLOURS.slice(0, p.many ? 9 : 6), c = pick(set);
    return {
      skill: 'vorms',
      prompt: 'Watter kleur is dit?',
      visual: V.svg(200, 110, '<path d="M20 70 Q60 20 100 60 T180 50 L185 75 Q140 95 100 85 T20 95Z" fill="' + c.c + '" stroke="#263238" stroke-width="2"/>', 'paint'),
      input: { kind: 'choice', answer: c.n, layout: 'words', options: U.listChoices(c.n, set.map(function (x) { return x.n; }), 3) },
      hint: 'Waar sien jy nog hierdie kleur?',
      explain: 'Dit is ' + c.n + '.'
    };
  };

  G.colourMatch = function (p) {
    var cols = U.sample(AF.COLOURS.slice(0, 7), 3), t = cols[0];
    var shapes = U.sample(['sirkel', 'vierkant', 'driehoek', 'ster', 'hart'], 3);
    return {
      skill: 'vorms',
      prompt: 'Tik op die vorm met dieselfde kleur as die verfstreep.',
      visual: V.svg(200, 90, '<path d="M20 50 Q60 10 100 45 T180 40 L182 62 Q140 80 100 70 T20 75Z" fill="' + t.c + '" stroke="#263238" stroke-width="2"/>', 'paint'),
      input: { kind: 'choice', answer: t.n, layout: 'pics', options: U.shuffle(cols.map(function (c, i) { return { value: c.n, html: V.shape(shapes[i], { fill: c.c, size: 60 }) }; })) },
      hint: 'Vergelyk die kleure, nie die vorms nie.',
      explain: 'Die verfstreep is ' + t.n + '.'
    };
  };

  /* Presies dieselfde (ook oriëntasie) */
  var POLY = [ // klein blokkiesvorms
    [[1, 0], [1, 0], [1, 1]], [[1, 1, 1], [0, 1, 0]], [[1, 1], [1, 0], [1, 0]], [[0, 1], [1, 1], [1, 0]], [[1, 1, 0], [0, 1, 1]]
  ];
  function rot90(m) { var r = []; for (var c = 0; c < m[0].length; c++) { r.push([]); for (var k = m.length - 1; k >= 0; k--) r[c].push(m[k][c]); } return r; }
  function mirror(m) { return m.map(function (row) { return row.slice().reverse(); }); }
  function mkey(m) { return m.map(function (r) { return r.join(''); }).join('/'); }
  G.sameAs = function (p) {
    if (p.emoji || U.chance(0.35)) {
      var pool = pick([['🐶', '🐱', '🐭', '🐹', '🐰'], ['🍎', '🍏', '🍅', '🍒'], ['🚗', '🚕', '🚙', '🚓'], ['⭐', '🌟', '✨', '💫']]);
      var tgt = pick(pool), others = U.sample(pool.filter(function (x) { return x !== tgt; }), 2);
      return {
        skill: 'vorms',
        prompt: 'Watter prentjie is presies dieselfde as hierdie een?',
        visual: '<div class="wpic">' + tgt + '</div>',
        input: { kind: 'choice', answer: tgt, layout: 'pics', options: U.shuffle([tgt].concat(others)).map(function (e) { return { value: e, html: '<span class="emo">' + e + '</span>' }; }) },
        hint: 'Kyk mooi na die kleure en die klein dingetjies.',
        explain: 'Hulle lyk presies eenders.'
      };
    }
    var m = pick(POLY), col = pick(FILLS);
    var variants = [m, rot90(m), rot90(rot90(m)), rot90(rot90(rot90(m))), mirror(m)];
    var seen = {}, uniq = [];
    variants.forEach(function (v) { var k = mkey(v); if (!seen[k]) { seen[k] = 1; uniq.push(v); } });
    var opts = [m].concat(U.sample(uniq.slice(1), Math.min(3, uniq.length - 1)));
    return {
      skill: 'posisie',
      prompt: 'Watter vorm is presies dieselfde, en wys in dieselfde rigting?',
      visual: V.cells(m, col),
      input: { kind: 'choice', answer: mkey(m), layout: 'pics', options: U.shuffle(opts).map(function (v) { return { value: mkey(v), html: V.cells(v, col) }; }) },
      hint: 'Sommige is gedraai. Soek die een wat nie gedraai is nie.',
      explain: 'Die regte een wys presies dieselfde kant toe.'
    };
  };

  /* Dieselfde plek as die groen blokkie */
  G.positionMatch = function (p) {
    var n = 4, g = rnd(0, n - 1), animals = U.sample(AF.ROW_ANIMALS, n);
    return {
      skill: 'posisie',
      prompt: 'Watter dier is op dieselfde plek as die groen blokkie?',
      visual: V.blockRow(n, g) + V.row(animals.map(function (a) { return a.e; }), { cls: 'spaced' }),
      input: { kind: 'choice', answer: animals[g].s, layout: 'pics', options: animals.map(function (a) { return { value: a.s, html: '<span class="emo">' + a.e + '</span>' }; }) },
      hint: 'Tel van links: die hoeveelste blokkie is groen?',
      explain: 'Die groen blokkie is die ' + AF.ordinal(g + 1) + ' een. Die ' + animals[g].s + ' is ook die ' + AF.ordinal(g + 1) + '.'
    };
  };

  /* Diere in 'n ry: voor, agter, tussen, eerste, laaste, middel */
  G.rowPosition = function (p) {
    var n = 5, a = U.sample(AF.ROW_ANIMALS, n), v = rnd(0, 4), q, ans;
    if (v === 0) { q = 'Watter dier staan eerste in die ry?'; ans = a[0]; }
    else if (v === 1) { q = 'Watter dier staan laaste in die ry?'; ans = a[n - 1]; }
    else if (v === 2) { q = 'Watter dier staan in die middel van die ry?'; ans = a[2]; }
    else if (v === 3) { var i = rnd(1, n - 2); q = 'Watter dier staan tussen die ' + a[i - 1].s + ' en die ' + a[i + 1].s + '?'; ans = a[i]; }
    else {
      var j = rnd(1, n - 2), voor = U.chance(0.5);
      q = 'Watter dier staan reg ' + (voor ? 'voor' : 'agter') + ' die ' + a[j].s + '?';
      ans = voor ? a[j - 1] : a[j + 1];
    }
    return {
      skill: 'posisie',
      prompt: q,
      visual: '<div class="queue"><span class="front">VOOR ◀</span>' + V.row(a.map(function (x) { return x.e; })) + '</div>',
      input: { kind: 'choice', answer: ans.s, layout: 'pics', options: optsWith(a, ans) },
      hint: 'Die voorkant van die ry is links, by die woord VOOR.',
      explain: 'Die antwoord is die ' + ans.s + ' ' + ans.e + '.'
    };
  };
  function optsWith(all, ans) {
    var others = U.sample(all.filter(function (x) { return x !== ans; }), 2);
    return U.shuffle([ans].concat(others)).map(function (x) { return { value: x.s, html: '<span class="emo">' + x.e + '</span><small>' + x.s + '</small>' }; });
  }

  /* Ordinaalgetalle: resies en krale */
  G.ordinal = function (p) {
    var v = rnd(0, 2);
    if (v < 2) {
      var n = 5, a = U.sample(AF.ROW_ANIMALS, n), k = rnd(1, n);
      if (v === 0) {
        return {
          skill: 'posisie',
          prompt: 'Die diere hardloop ’n resies na die vlag toe. Wie is ' + AF.ordinal(k) + '?',
          visual: '<div class="queue"><span class="front flag">🏁</span>' + V.row(a.map(function (x) { return x.e; })) + '</div>',
          input: { kind: 'choice', answer: a[k - 1].s, layout: 'pics', options: optsWith(a, a[k - 1]) },
          hint: 'Die eerste een is die naaste aan die vlag.',
          explain: 'Die ' + a[k - 1].s + ' is ' + AF.ordinal(k) + '.'
        };
      }
      var ords = U.range(1, n).map(AF.ordinal);
      return {
        skill: 'posisie',
        prompt: 'In watter posisie is die ' + a[k - 1].s + '?',
        visual: '<div class="queue"><span class="front flag">🏁</span>' + V.row(a.map(function (x) { return x.e; }), { mark: k - 1 }) + '</div>',
        input: { kind: 'choice', answer: AF.ordinal(k), layout: 'words', options: U.listChoices(AF.ordinal(k), ords, 3) },
        hint: 'Tel vanaf die vlag: eerste, tweede, derde...',
        explain: 'Die ' + a[k - 1].s + ' is ' + AF.ordinal(k) + '.'
      };
    }
    var cols = AF.COLOURS.slice(0, 5), beadsN = 8, pattern = U.range(0, beadsN - 1).map(function () { return pick(cols); });
    var i = rnd(1, beadsN);
    return {
      skill: 'posisie',
      prompt: 'Watter kleur is die ' + AF.ordinal(i) + ' kraal? Begin links tel.',
      visual: V.beads(beadsN, { colours: pattern.map(function (c) { return c.c; }) }),
      input: { kind: 'choice', answer: pattern[i - 1].n, layout: 'words', options: U.listChoices(pattern[i - 1].n, cols.map(function (c) { return c.n; }), 3) },
      hint: 'Wys met jou vinger: eerste, tweede, derde...',
      explain: 'Die ' + AF.ordinal(i) + ' kraal is ' + pattern[i - 1].n + '.'
    };
  };

  /* Links en regs */
  G.leftRight = function (p) {
    var anchor = pick([{ e: '🌳', s: 'boom' }, { e: '🏠', s: 'huis' }, { e: '🧒', s: 'kind' }]);
    var obj = pick([{ e: '⚽', s: 'bal' }, { e: '🐶', s: 'hond' }, { e: '🚗', s: 'motor' }, { e: '🌸', s: 'blom' }, { e: '🐦', s: 'voël' }]);
    var left = U.chance(0.5);
    return {
      skill: 'posisie',
      prompt: 'Is die ' + obj.s + ' links of regs van die ' + anchor.s + '?',
      visual: V.stage([{ e: anchor.e, x: 50, y: 50, size: 90 }, { e: obj.e, x: left ? 20 : 80, y: 60, size: 56 }], 180),
      input: { kind: 'choice', answer: left ? 'links' : 'regs', layout: 'words', options: [{ value: 'links', label: '⬅ links' }, { value: 'regs', label: 'regs ➡' }] },
      hint: 'Lig jou linkerhand op. Is die ' + obj.s + ' aan daardie kant?',
      explain: 'Die ' + obj.s + ' is ' + (left ? 'links' : 'regs') + ' van die ' + anchor.s + '.'
    };
  };

  G.arrowDir = function (p) {
    var dirs = ['boontoe', 'ondertoe', 'links', 'regs'], d = pick(dirs);
    if (U.chance(0.5)) {
      return {
        skill: 'posisie',
        prompt: 'Na watter kant wys die pyl?',
        visual: V.arrow(d),
        input: { kind: 'choice', answer: d, layout: 'words', options: dirs.map(function (x) { return { value: x, label: x }; }) },
        hint: 'Kyk na die punt van die pyl.',
        explain: 'Die pyl wys ' + d + '.'
      };
    }
    return {
      skill: 'posisie',
      prompt: 'Tik op die pyl wat ' + d + ' wys.',
      visual: '',
      input: { kind: 'choice', answer: d, layout: 'pics', options: U.shuffle(dirs).map(function (x) { return { value: x, html: V.arrow(x, pick(FILLS)) }; }) },
      hint: 'Kyk na die punt van elke pyl.',
      explain: 'Hierdie pyl wys ' + d + '.'
    };
  };

  /* Help die hasie: kies 'n rigting op 'n rooster */
  G.gridMove = function (p) {
    var dirs = { boontoe: [0, -1], ondertoe: [0, 1], links: [-1, 0], regs: [1, 0] };
    var d = pick(Object.keys(dirs)), steps = p.steps2 && U.chance(0.4) ? 2 : 1;
    var size = 5, bx = 2, by = 2, cx = bx + dirs[d][0] * steps, cy = by + dirs[d][1] * steps;
    var html = '<table class="grid">';
    for (var y = 0; y < size; y++) {
      html += '<tr>';
      for (var x = 0; x < size; x++) html += '<td>' + (x === bx && y === by ? '🐰' : x === cx && y === cy ? '🥕' : '') + '</td>';
      html += '</tr>';
    }
    html += '</table>';
    var arrow = { boontoe: '⬆', ondertoe: '⬇', links: '⬅', regs: '➡' };
    return {
      skill: 'posisie',
      prompt: 'Watter kant toe moet die hasie spring om by die wortel te kom?',
      visual: html,
      input: { kind: 'choice', answer: d, layout: 'words', options: Object.keys(dirs).map(function (x) { return { value: x, label: arrow[x] + ' ' + x }; }) },
      hint: 'Waar is die wortel: bo, onder, links of regs van die hasie?',
      explain: 'Die hasie moet ' + d + ' spring.'
    };
  };

  /* Posisiewoorde: bo-op, langsaan, voor, agter */
  G.positionWords = function (p) {
    var w = pick(['bo-op', 'langsaan', 'voor', 'agter']);
    var obj = pick([{ e: '🐱', s: 'kat' }, { e: '⚽', s: 'bal' }, { e: '🧸', s: 'teddiebeer' }]);
    var items;
    if (w === 'bo-op') items = [{ e: '📦', x: 50, y: 66, size: 110, z: 1 }, { e: obj.e, x: 50, y: 24, size: 60, z: 2 }];
    else if (w === 'langsaan') items = [{ e: '📦', x: 40, y: 60, size: 110, z: 1 }, { e: obj.e, x: 72, y: 72, size: 60, z: 2 }];
    else if (w === 'voor') items = [{ e: '📦', x: 50, y: 52, size: 110, z: 1 }, { e: obj.e, x: 54, y: 72, size: 70, z: 3 }];
    else items = [{ e: obj.e, x: 50, y: 40, size: 56, z: 1 }, { e: '📦', x: 50, y: 62, size: 110, z: 2 }];
    return {
      skill: 'posisie',
      prompt: 'Waar is die ' + obj.s + '? Die ' + obj.s + ' is ... die boks.',
      say: 'Waar is die ' + obj.s + '? Is dit bo-op, langsaan, voor, of agter die boks?',
      visual: V.stage(items, 200),
      input: { kind: 'choice', answer: w, layout: 'words', options: ['bo-op', 'langsaan', 'voor', 'agter'].map(function (x) { return { value: x, label: x }; }) },
      hint: 'Kan jy die hele ' + obj.s + ' sien, of is ’n stukkie weggesteek?',
      explain: 'Die ' + obj.s + ' is ' + w + ' die boks.'
    };
  };

  /* Simmetrie */
  function randHalf(rows, cols) {
    var m, filled;
    do {
      m = U.range(1, rows).map(function () { return U.range(1, cols).map(function () { return U.chance(0.45) ? 1 : 0; }); });
      filled = m.reduce(function (a, r) { return a + r.reduce(function (x, y) { return x + y; }, 0); }, 0);
    } while (filled < 4 || filled > rows * cols - 2);
    return m;
  }
  G.symmetryHalf = function (p) {
    var rows = 4, cols = 3, left = randHalf(rows, cols), right = mirror(left), col = pick(FILLS);
    var wrong1 = left.map(function (r) { return r.slice(); }); // nie gespieël nie
    var wrong2 = right.map(function (r) { return r.slice(); });
    var rr = rnd(0, rows - 1), cc = rnd(0, cols - 1); wrong2[rr][cc] = 1 - wrong2[rr][cc];
    var opts = [right], seen = {}; seen[mkey(right)] = 1;
    [wrong1, wrong2, mirror(randHalf(rows, cols))].forEach(function (m) { if (!seen[mkey(m)] && opts.length < 3) { seen[mkey(m)] = 1; opts.push(m); } });
    return {
      skill: 'simmetrie',
      prompt: 'Kies die ander helfte sodat albei kante presies dieselfde lyk.',
      visual: '<div class="symq">' + V.cells(left, col, { line: 'right' }) + '<div class="symblank">?</div></div>',
      input: { kind: 'choice', answer: mkey(right), layout: 'pics', options: U.shuffle(opts).map(function (m) { return { value: mkey(m), html: V.cells(m, col) }; }) },
      hint: 'Die ander helfte is soos ’n spieëlbeeld: wat naaste aan die rooi lyn is, bly naaste aan die lyn.',
      explain: 'Die regte helfte is ’n spieëlbeeld van die linkerkant.'
    };
  };

  G.isSymmetric = function (p) {
    var useEmoji = U.chance(0.5);
    if (useEmoji) {
      var sym = ['🦋', '❤️', '⭐', '🏠', '⛄', '🌼'], asym = ['🐌', '🦒', '🐿️', '🎺', '🦕', '🐊'];
      var yes = U.chance(0.5), e = pick(yes ? sym : asym);
      return {
        skill: 'simmetrie',
        prompt: 'As ons hierdie prentjie in die middel vou, lyk albei kante dieselfde?',
        visual: '<div class="symline"><span class="wpic">' + e + '</span></div>',
        input: { kind: 'choice', answer: yes ? 'ja' : 'nee', layout: 'words', options: [{ value: 'ja', label: 'ja' }, { value: 'nee', label: 'nee' }] },
        hint: 'Kyk na die linkerkant en die regterkant van die rooi lyn.',
        explain: yes ? 'Ja, dit is simmetries.' : 'Nee, die twee kante lyk anders.'
      };
    }
    var left = randHalf(4, 3), yes2 = U.chance(0.5), right = mirror(left);
    if (!yes2) { var r = rnd(0, 3), c = rnd(0, 2); right = right.map(function (x) { return x.slice(); }); right[r][c] = 1 - right[r][c]; }
    var full = left.map(function (row, i) { return row.concat(right[i]); });
    var body = V.cells(full, pick(FILLS));
    return {
      skill: 'simmetrie',
      prompt: 'Is die rooi lyn ’n simmetrielyn? Lyk albei kante presies dieselfde?',
      visual: '<div class="symline grid6">' + body + '</div>',
      input: { kind: 'choice', answer: yes2 ? 'ja' : 'nee', layout: 'words', options: [{ value: 'ja', label: 'ja' }, { value: 'nee', label: 'nee' }] },
      hint: 'Vergelyk elke ry: links en regs van die lyn.',
      explain: yes2 ? 'Ja, albei kante is presies dieselfde.' : 'Nee, een blokkie is anders.'
    };
  };
})(W.G);
