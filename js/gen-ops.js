/* Vraaggenerators: optel, aftrek, opbou en afbreek, verdubbel/halveer, groepe, deel. */
var W = window.W || (window.W = {});
W.G = W.G || {};

(function (G) {
  var U = W.U, V = W.V, AF = W.AF;
  var rnd = U.rnd, pick = U.pick, numInput = G._numInput;
  var STEPW = { 1: 'ene', 2: 'tweë', 3: 'drieë', 4: 'viere', 5: 'vywe', 10: 'tiene' };

  function fill(n, a, colA, colB) {
    var c = [];
    for (var i = 0; i < n; i++) c.push(i < a ? colA : colB);
    return c;
  }
  function sentence(a, op, b, style) {
    if (style === 'words') return a + (op === '+' ? pick([' en ', ' plus ']) : ' minus ') + b + ' is ?';
    return a + (op === '+' ? ' + ' : ' – ') + b + ' = ?';
  }

  /* Optel. p: {max, min, visual: 'beads'|'objs'|'frames'|'line'|'none', words} */
  G.add = function (p) {
    var max = p.max || 5, a, b, s;
    s = rnd(Math.max(2, p.min || 2), max);
    a = rnd(p.zero ? 0 : 1, p.zero ? s : s - 1); b = s - a;
    if (p.bigFirst && a < b) { var t = a; a = b; b = t; }
    var vis = p.visual || (max <= 10 ? pick(['beads', 'objs']) : pick(['frames', 'line', 'none']));
    var visual = '';
    if (vis === 'beads') visual = V.beads(s, { colours: fill(s, a, V.C.green, V.C.orange) });
    else if (vis === 'objs') {
      var key = pick(AF.COUNTABLE), e = AF.thing(key).e;
      visual = '<div class="sum">' + V.objs(e, a, { layout: 'rows', size: s > 10 ? 'sm' : 'md' }) + '<b>+</b>' + V.objs(e, b, { layout: 'rows', size: s > 10 ? 'sm' : 'md' }) + '</div>';
    } else if (vis === 'frames') visual = V.tenFrames(s, { split: a });
    else if (vis === 'line') {
      var hops = [];
      for (var i = 0; i < b; i++) hops.push([a + i, a + i + 1]);
      visual = V.numberLine({ min: 0, max: Math.max(10, Math.min(20, s + 2)), hops: b <= 10 ? hops : [], mark: [a], start: a });
    }
    return {
      skill: 'optel',
      data: { a: a, b: b, s: s },
      prompt: sentence(a, '+', b, p.words ? 'words' : (max <= 5 ? 'words' : pick(['words', 'sym', 'sym']))),
      visual: visual,
      input: numInput(s, p, { min: 0, max: max + 3 }),
      hint: a >= b ? 'Begin by ' + a + ' en tel ' + b + ' verder.' : 'Begin by die groter getal, ' + b + ', en tel ' + a + ' verder.',
      explain: a + ' + ' + b + ' = ' + s + '.'
    };
  };

  /* Aftrek */
  G.sub = function (p) {
    var max = p.max || 5;
    var a = p.from || rnd(Math.max(2, p.min || 2), max);
    var b = rnd(1, a - (p.zero ? 0 : 1));
    if (p.zero && U.chance(0.15)) b = U.chance(0.5) ? 0 : a;
    var d = a - b;
    var vis = p.visual || (a <= 10 ? pick(['beads', 'objs']) : pick(['line', 'none', 'frames']));
    var visual = '';
    if (vis === 'beads') visual = V.beads(a, { crossed: b });
    else if (vis === 'objs') visual = V.objs(AF.thing(pick(AF.COUNTABLE)).e, a, { layout: 'rows', crossFrom: a - b, size: a > 10 ? 'sm' : 'md' });
    else if (vis === 'frames') visual = V.tenFrames(a, { split: d });
    else if (vis === 'line') {
      var hops = [];
      for (var i = 0; i < b; i++) hops.push([a - i, a - i - 1]);
      visual = V.numberLine({ min: 0, max: Math.max(10, Math.min(20, a + 2)), hops: b <= 10 ? hops : [], mark: [a], start: a });
    }
    return {
      skill: 'aftrek',
      data: { a: a, b: b, d: d },
      prompt: sentence(a, '-', b, p.words ? 'words' : (max <= 5 ? 'words' : pick(['words', 'sym', 'sym']))),
      visual: visual,
      input: numInput(d, p, { min: 0, max: max + 2 }),
      hint: 'Begin by ' + a + ' en tel ' + b + ' terug.',
      explain: a + ' – ' + b + ' = ' + d + '.'
    };
  };

  /* Opbou en afbreek: 3 en ? is 5 */
  G.bond = function (p) {
    var n = p.total ? pick([].concat(p.total)) : rnd(p.min || 3, p.max || 5);
    var a = rnd(p.zero ? 0 : 1, n - 1), b = n - a;
    var form = rnd(0, 2), prompt;
    if (form === 0) prompt = a + ' en ? is ' + n;
    else if (form === 1) prompt = '? + ' + b + ' = ' + n;
    else prompt = 'Hoeveel moet ons by ' + a + ' tel om ' + n + ' te maak?';
    var ans = form === 1 ? a : b;
    return {
      skill: 'opbou',
      data: { n: n, k: form === 1 ? b : a, ans: ans },
      prompt: prompt,
      visual: n <= 10 ? V.beads(n, { colours: fill(n, form === 1 ? b : a, V.C.green, '#fff') }) : V.tenFrames(form === 1 ? b : a),
      input: numInput(ans, p, { min: 0, max: n }),
      hint: n <= 10 ? 'Tel die wit krale.' : 'Tel van ' + (form === 1 ? b : a) + ' tot by ' + n + '.',
      explain: (form === 1 ? a + ' + ' + b : a + ' en ' + b) + ' maak ' + n + '.'
    };
  };

  /* Watter paar getalle maak saam N */
  G.pairs = function (p) {
    var n = p.total ? pick([].concat(p.total)) : rnd(p.min || 5, p.max || 10);
    var a = rnd(1, n - 1), right = a + ' en ' + (n - a);
    var opts = [{ value: right, label: right }], used = {}; used[right] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 50) {
      var x = rnd(1, n - 1), y = n - x + pick([-2, -1, 1, 2]);
      var lbl = x + ' en ' + y;
      if (y >= 1 && !used[lbl]) { used[lbl] = 1; opts.push({ value: lbl, label: lbl }); }
    }
    return {
      skill: 'opbou',
      data: { n: n },
      prompt: 'Watter twee getalle maak saam ' + n + '?',
      visual: V.beads(Math.min(n, 20)),
      input: { kind: 'choice', answer: right, layout: 'words', options: U.shuffle(opts) },
      hint: 'Tel elke paar bymekaar.',
      explain: right + ' maak ' + n + '.'
    };
  };

  /* Drie getalle bymekaar */
  G.add3 = function (p) {
    var max = p.max || 6, a = rnd(1, Math.floor(max / 3)), b = rnd(1, Math.floor(max / 3)), c = rnd(1, Math.max(1, max - a - b));
    var s = a + b + c;
    return {
      skill: 'optel',
      data: { a: a, b: b, c: c, s: s },
      prompt: a + ' + ' + b + ' + ' + c + ' = ?',
      visual: V.beads(s, { colours: U.range(0, s - 1).map(function (i) { return i < a ? V.C.green : i < a + b ? V.C.orange : V.C.blue; }) }),
      input: numInput(s, p, { min: 1, max: max + 3 }),
      hint: 'Tel eers ' + a + ' en ' + b + ' bymekaar, dan nog ' + c + '.',
      explain: a + ' + ' + b + ' = ' + (a + b) + ', en ' + (a + b) + ' + ' + c + ' = ' + s + '.'
    };
  };

  /* Brug oor 10: 8 + 5 = 8 + 2 + 3 en 15 - 7 = 15 - 5 - 2 */
  G.bridge10 = function (p) {
    var max = p.max || 20;
    if (p.op === 'sub' || (p.op === 'both' && U.chance(0.5))) {
      var a = rnd(11, Math.min(18, max)), u = a - 10, b = rnd(u + 1, Math.min(9, a - 1)), d = a - b;
      return {
        skill: 'aftrek',
        data: { op: 'sub', a: a, b: b, u: u, d: d },
        prompt: a + ' – ' + b + ' = ?',
        visual: V.tenFrames(a, { split: d }) + '<div class="steps">' + a + ' – ' + u + ' = 10 &nbsp;→&nbsp; 10 – ' + (b - u) + ' = ?</div>',
        input: numInput(d, { mode: 'number' }),
        hint: 'Trek eers ' + u + ' af om by 10 te kom. Trek dan nog ' + (b - u) + ' af.',
        explain: a + ' – ' + u + ' = 10, en 10 – ' + (b - u) + ' = ' + d + '.'
      };
    }
    var x = rnd(5, 9), need = 10 - x, y = rnd(need + 1, Math.min(9, max - x)), s = x + y;
    return {
      skill: 'optel',
      data: { op: 'add', x: x, y: y, need: need, s: s },
      prompt: x + ' + ' + y + ' = ?',
      visual: V.tenFrames(s, { split: x }) + '<div class="steps">' + x + ' + ' + need + ' = 10 &nbsp;→&nbsp; 10 + ' + (y - need) + ' = ?</div>',
      input: numInput(s, { mode: 'number' }),
      hint: 'Maak eers 10: ' + x + ' + ' + need + ' = 10. Tel dan nog ' + (y - need) + ' by.',
      explain: x + ' + ' + need + ' = 10, en 10 + ' + (y - need) + ' = ' + s + '.'
    };
  };

  /* Tel aan / tel terug op die getallelyn */
  G.countOn = function (p) {
    var max = p.max || 10, back = p.back && U.chance(0.5);
    var b = rnd(1, Math.min(5, max - 2)), a = back ? rnd(b + 1, max) : rnd(1, max - b);
    var ans = back ? a - b : a + b, hops = [];
    for (var i = 0; i < b; i++) hops.push(back ? [a - i, a - i - 1] : [a + i, a + i + 1]);
    var lo = 0, hi = Math.max(10, Math.min(20, max));
    return {
      skill: back ? 'aftrek' : 'optel',
      data: { a: a, b: b, back: back, ans: ans },
      prompt: 'Die padda begin by ' + a + ' en spring ' + b + ' keer ' + (back ? 'terug' : 'vorentoe') + '. Waar land hy?',
      visual: V.numberLine({ min: lo, max: hi, hops: hops, mark: [a], start: a }),
      input: numInput(ans, p, { min: 0, max: hi }),
      hint: 'Tel die spronge een vir een vanaf ' + a + '.',
      explain: a + (back ? ' – ' : ' + ') + b + ' = ' + ans + '.'
    };
  };

  /* Woordprobleme */
  var WP_THINGS = [
    { s: 'appel', p: 'appels', e: '🍎' }, { s: 'peer', p: 'pere', e: '🍐' }, { s: 'lekker', p: 'lekkers', e: '🍬' },
    { s: 'albaster', p: 'albasters', e: '🔵' }, { s: 'blom', p: 'blomme', e: '🌸' }, { s: 'koekie', p: 'koekies', e: '🍪' },
    { s: 'ballon', p: 'ballonne', e: '🎈' }, { s: 'potlood', p: 'potlode', e: '✏️' }, { s: 'lemoen', p: 'lemoene', e: '🍊' }
  ];
  function cnt(n, t) { return n + ' ' + (n === 1 ? t.s : t.p); }
  G.wordProblem = function (p) {
    var max = p.max || 10, t = pick(WP_THINGS), names = U.sample(AF.NAMES, 2), A = names[0], B = names[1];
    var kind = pick(p.ops || ['add', 'sub']), a, b, ans, text, expl, skill = 'woordsomme';
    if (kind === 'add') {
      a = rnd(1, max - 1); b = rnd(1, max - a); ans = a + b;
      text = pick([
        A + ' het ' + cnt(a, t) + '. ' + B + ' gee vir ' + A + ' nog ' + b + '. Hoeveel ' + t.p + ' het ' + A + ' nou?',
        A + ' het ' + cnt(a, t) + '. ' + B + ' het ' + cnt(b, t) + '. Hoeveel ' + t.p + ' het hulle altesaam?',
        'Daar was ' + cnt(a, t) + ' op die tafel. Ma sit nog ' + b + ' neer. Hoeveel ' + t.p + ' is daar nou?'
      ]);
      expl = a + ' + ' + b + ' = ' + ans + '.';
    } else if (kind === 'sub') {
      a = rnd(2, max); b = rnd(1, a - 1); ans = a - b;
      var edible = ['appel', 'peer', 'lekker', 'koekie', 'lemoen'].indexOf(t.s) >= 0;
      text = pick([
        A + ' het ' + cnt(a, t) + '. ' + A + ' gee ' + b + ' vir ' + B + '. Hoeveel ' + t.p + ' het ' + A + ' oor?',
        'Daar was ' + cnt(a, t) + ' in die mandjie. ' + A + (edible ? ' eet ' + b + ' op.' : ' vat ' + b + ' uit.') + ' Hoeveel ' + t.p + ' is nog in die mandjie?',
        A + ' het ' + cnt(a, t) + ' gehad en ' + b + ' verloor. Hoeveel ' + t.p + ' het ' + A + ' oor?'
      ]);
      expl = a + ' – ' + b + ' = ' + ans + '.';
    } else if (kind === 'compare') {
      a = rnd(3, max); b = rnd(1, a - 1); ans = a - b;
      text = A + ' het ' + cnt(a, t) + '. ' + B + ' het ' + cnt(b, t) + '. Hoeveel meer ' + t.p + ' het ' + A + ' as ' + B + '?';
      expl = a + ' – ' + b + ' = ' + ans + '. ' + A + ' het ' + ans + ' meer.';
    } else { // missing: X has some, gets b, now has s
      var s = rnd(3, max); b = rnd(1, s - 1); ans = s - b;
      text = A + ' het ’n paar ' + t.p + '. ' + B + ' gee nog ' + b + '. Nou het ' + A + ' ' + cnt(s, t) + '. Hoeveel ' + t.p + ' het ' + A + ' eers gehad?';
      expl = '? + ' + b + ' = ' + s + ', so die antwoord is ' + ans + '.';
      a = ans;
    }
    return {
      skill: skill,
      data: { kind: kind, a: a, b: b, ans: ans, e: t.e, tp: t.p, s: kind === 'missing' ? a + b : null },
      prompt: text,
      visual: '<div class="wpic">' + t.e + '</div>',
      input: numInput(ans, { mode: max > 10 ? 'number' : p.mode }, { min: 0, max: max + 2 }),
      hint: 'Teken die ' + t.p + ' met kolletjies op papier as dit help.',
      explain: expl
    };
  };

  /* Verdubbel */
  G.double = function (p) {
    var n = rnd(p.min || 1, p.max || 5), word = pick(['Dubbel ' + n + ' is ?', n + ' verdubbel is ?', n + ' + ' + n + ' = ?']);
    return {
      skill: 'verdubbel',
      data: { n: n },
      prompt: word,
      visual: n <= 10 ? V.butterfly(n) : V.twoBoxes(V.objs('🔴', n, { layout: 'rows', size: 'sm' }), V.objs('🔴', n, { layout: 'rows', size: 'sm' })),
      input: numInput(2 * n, p, { min: 0, max: 2 * (p.max || 5) + 2, spread: 2 }),
      hint: 'Verdubbel beteken: dieselfde getal twee keer. ' + n + ' + ' + n + '.',
      explain: 'Dubbel ' + n + ' is ' + n + ' + ' + n + ' = ' + (2 * n) + '.'
    };
  };

  /* Halveer */
  G.half = function (p) {
    var n = rnd(p.min || 1, p.max || 5), m = 2 * n;
    var key = pick(AF.COUNTABLE), t = AF.thing(key);
    return {
      skill: 'verdubbel',
      data: { m: m, n: n, e: t.e },
      prompt: pick(['Die helfte van ' + m + ' is ?', m + ' halveer is ?']),
      visual: '<div class="halves">' + V.objs(t.e, m, { layout: 'rows', size: m > 10 ? 'sm' : 'md' }) + '</div>',
      input: numInput(n, p, { min: 0, max: m, spread: 2 }),
      hint: 'Deel die ' + t.p + ' in twee gelyke groepe.',
      explain: 'Die helfte van ' + m + ' is ' + n + ', want ' + n + ' + ' + n + ' = ' + m + '.'
    };
  };

  /* Byna-dubbels: 7 verdubbel + 1 */
  G.nearDouble = function (p) {
    var n = rnd(p.min || 3, p.max || 9), plus = U.chance(0.6);
    var ans = 2 * n + (plus ? 1 : -1);
    return {
      skill: 'verdubbel',
      data: { n: n, plus: plus, ans: ans },
      prompt: n + ' + ' + n + (plus ? ' + 1' : ' – 1') + ' = ?',
      visual: '<div class="steps">' + n + ' verdubbel is ' + (2 * n) + ' &nbsp;→&nbsp; ' + (2 * n) + (plus ? ' + 1' : ' – 1') + ' = ?</div>',
      input: numInput(ans, { mode: 'number' }),
      hint: 'Verdubbel eers ' + n + '. Dit is ' + (2 * n) + '.',
      explain: (2 * n) + (plus ? ' + 1' : ' – 1') + ' = ' + ans + '.'
    };
  };

  /* Groepe van s */
  G.groups = function (p) {
    var s = pick([].concat(p.size || 2)), max = p.max || 10;
    var g = rnd(1, Math.max(1, Math.floor(max / s)));
    var key = pick(AF.COUNTABLE), t = AF.thing(key);
    var v = rnd(0, p.rem ? 2 : 1);
    if (v === 0) {
      return {
        skill: 'groepe',
        data: { v: 0, g: g, s: s, e: t.e, ans: g * s },
        prompt: g + (g === 1 ? ' groep' : ' groepe') + ' van ' + s + ' is ?',
        visual: V.groups(t.e, g, s),
        input: numInput(g * s, p, { min: 0, max: max + s, step: s, spread: 2 }),
        hint: 'Tel in ' + STEPW[s] + ': ' + U.range(1, Math.min(g, 3)).map(function (i) { return i * s; }).join(', ') + (g > 3 ? '...' : ''),
        explain: g + (g === 1 ? ' groep' : ' groepe') + ' van ' + s + ' is ' + (g * s) + '.'
      };
    }
    if (v === 1) {
      g = Math.max(2, g);
      return {
        skill: 'groepe',
        data: { v: 1, g: g, s: s, e: t.e, ans: g },
        prompt: 'Daar is ' + (g * s) + ' ' + t.p + '. Hoeveel groepe van ' + s + ' kan jy maak?',
        visual: V.objs(t.e, g * s, { layout: 'scatter', size: g * s > 12 ? 'sm' : 'md' }),
        input: numInput(g, { mode: 'choice' }, { min: 1, max: Math.floor(max / s) + 2 }),
        hint: 'Omkring ' + s + ' ' + t.p + ' op ’n slag in jou kop, en tel die groepe.',
        explain: (g * s) + ' is ' + g + ' groepe van ' + s + '.'
      };
    }
    var r = rnd(1, s - 1), total = g * s + r;
    if (total > max) { g = Math.max(1, g - 1); total = g * s + r; }
    return {
      skill: 'groepe',
      data: { v: 2, g: g, s: s, e: t.e, r: r, ans: r },
      prompt: 'Maak groepe van ' + s + ' met ' + total + ' ' + t.p + '. Hoeveel bly oor?',
      visual: V.objs(t.e, total, { layout: 'scatter', size: total > 12 ? 'sm' : 'md' }),
      input: numInput(r, { mode: 'choice' }, { min: 0, max: s }),
      hint: 'Hoeveel groepe van ' + s + ' pas in ' + total + '? Wat is oor?',
      explain: total + ' is ' + g + ' groepe van ' + s + ' en ' + r + ' bly oor.'
    };
  };

  /* Herhaalde optelling met konteks */
  var CONTEXTS = {
    2: [{ e: '🐔', who: 'hoenders', what: 'bene' }, { e: '🙂', who: 'gesiggies', what: 'oë', sing: 'gesiggie' }, { e: '🚲', who: 'fietse', what: 'wiele' }, { e: '🦆', who: 'eende', what: 'voete' }],
    3: [{ e: '☘️', who: 'klawers', what: 'blaartjies' }, { e: '🔺', who: 'driehoeke', what: 'hoeke' }],
    4: [{ e: '🐕', who: 'honde', what: 'pote' }, { e: '🐄', who: 'koeie', what: 'bene' }, { e: '🍀', who: 'geluksklawers', what: 'blaartjies' }, { e: '🚗', who: 'motors', what: 'wiele' }],
    5: [{ e: '✋', who: 'hande', what: 'vingers' }, { e: '⭐', who: 'sterre', what: 'punte' }],
    10: [{ e: '🙌', who: 'pare hande', what: 'vingers' }]
  };
  G.repeatedAdd = function (p) {
    var s = pick([].concat(p.size || 2)), max = p.max || 10;
    var g = rnd(2, Math.max(2, Math.floor(max / s)));
    var ctx = pick(CONTEXTS[s] || [{ e: '🔵', who: 'groepe', what: 'kolletjies' }]);
    var sum = U.range(1, g).map(function () { return s; }).join(' + ');
    var sing = { hoenders: 'hoender', eende: 'eend', fietse: 'fiets', honde: 'hond', koeie: 'koei', motors: 'motor', hande: 'hand', sterre: 'ster', klawers: 'klawer', driehoeke: 'driehoek', geluksklawers: 'geluksklawer' }[ctx.who] || ctx.sing || ctx.who;
    return {
      skill: 'groepe',
      data: { g: g, s: s, e: ctx.e, ans: g * s },
      prompt: 'Elke ' + sing + ' het ' + s + ' ' + ctx.what + '. Hoeveel ' + ctx.what + ' het ' + g + ' ' + ctx.who + ' altesaam?',
      visual: V.objs(ctx.e, g, { layout: 'line', size: 'lg' }) + '<div class="steps">' + sum + ' = ?</div>',
      input: numInput(g * s, p, { min: 0, max: max + s, step: s, spread: 2 }),
      hint: 'Tel in ' + STEPW[s] + ': ' + U.range(1, Math.min(g, 3)).map(function (i) { return i * s; }).join(', ') + '...',
      explain: sum + ' = ' + (g * s) + '.'
    };
  };

  /* Deel gelykop */
  G.share = function (p) {
    var k = pick(p.k || [2]), max = p.max || 10;
    var each = rnd(1, Math.max(1, Math.floor(max / k)));
    var rem = p.rem && U.chance(0.5) ? rnd(1, k - 1) : 0;
    var total = each * k + rem;
    if (total > max) { rem = 0; total = each * k; }
    var key = pick(['lekker', 'appel', 'koekie', 'piesang', 'lemoen', 'wortel', 'ballon']), t = AF.thing(key);
    var kids = U.range(1, k).map(function () { return pick(['🧒', '👧', '👦']); }).join(' ');
    var askRem = rem > 0 && U.chance(0.5);
    return {
      skill: 'verdeel',
      data: { k: k, total: total, each: each, rem: rem, askRem: askRem, e: t.e, ans: askRem ? rem : each },
      prompt: 'Verdeel ' + total + ' ' + t.p + ' gelykop tussen ' + k + ' kinders. ' + (askRem ? 'Hoeveel bly oor?' : 'Hoeveel kry elke kind?'),
      visual: '<div class="kids">' + kids + '</div>' + V.objs(t.e, total, { layout: 'scatter', size: total > 12 ? 'sm' : 'md' }),
      input: numInput(askRem ? rem : each, { mode: 'choice' }, { min: 0, max: Math.max(6, each + 3) }),
      hint: 'Gee vir elke kind een ' + t.s + ' op ’n slag, totdat jy nie meer gelykop kan gee nie.',
      explain: 'Elke kind kry ' + each + (rem ? ' en ' + rem + ' bly oor.' : '. Niks bly oor nie.')
    };
  };
})(W.G);
