/* Vraaggenerators: getalbegrip (tel, getalname, vergelyk, volgorde, patrone, plekwaarde).
   Elke generator kry parameters uit die kurrikulum en gee 'n vraag-objek terug:
   { skill, prompt, say?, visual, input:{kind,...}, hint?, explain } */
var W = window.W || (window.W = {});
W.G = W.G || {};

(function (G) {
  var U = W.U, V = W.V, AF = W.AF;
  var rnd = U.rnd, pick = U.pick;

  function numInput(answer, p, opts) {
    opts = opts || {};
    if (p.mode === 'number' || (p.mode !== 'choice' && answer > 10 && U.chance(0.6))) {
      return { kind: 'number', answer: answer, prefix: opts.prefix || '' };
    }
    return {
      kind: 'choice', answer: answer,
      options: U.numChoices(answer, { min: opts.min == null ? 0 : opts.min, max: opts.max, n: p.choices || (answer > 10 ? 4 : 3), spread: opts.spread || 3, step: opts.step })
    };
  }
  G._numInput = numInput;

  /* Tel voorwerpe */
  G.count = function (p) {
    var n = rnd(p.min || 1, p.max || 5);
    var key = pick(p.things || AF.COUNTABLE), t = AF.thing(key);
    var layout = p.layout || (n > 10 ? 'rows' : pick(['scatter', 'scatter', 'rows']));
    return {
      skill: 'tel',
      prompt: 'Hoeveel ' + t.p + ' is daar?',
      visual: V.objs(t.e, n, { layout: layout }),
      input: numInput(n, p, { min: 1, max: (p.max || 5) + 2 }),
      hint: 'Raak aan elke ' + t.s + ' terwyl jy hardop tel.',
      explain: 'Daar is ' + AF.count(n, key) + '.'
    };
  };

  /* Tel een soort in 'n deurmekaar prent */
  G.countInScene = function (p) {
    var kinds = U.sample(p.things || AF.COUNTABLE, rnd(2, 3));
    var list = [], counts = {};
    kinds.forEach(function (k) {
      counts[k] = rnd(1, p.max || 5);
      for (var i = 0; i < counts[k]; i++) list.push(AF.thing(k).e);
    });
    var target = pick(kinds), t = AF.thing(target);
    return {
      skill: 'tel',
      prompt: 'Hoeveel ' + t.p + ' kan jy sien?',
      visual: V.mixed(U.shuffle(list)),
      input: numInput(counts[target], p, { min: 0, max: (p.max || 5) + 2 }),
      hint: 'Soek net die ' + t.p + ' ' + t.e + '. Tel hulle een vir een.',
      explain: 'Daar is ' + AF.count(counts[target], target) + '.'
    };
  };

  /* Tienraam lees */
  G.frame = function (p) {
    var n = rnd(p.min || 1, p.max || 10);
    return {
      skill: 'tel',
      prompt: 'Hoeveel kolletjies is daar?',
      visual: V.tenFrames(n),
      input: numInput(n, p, { min: 1, max: Math.max(12, n + 3) }),
      hint: n > 10 ? 'Een vol raam is 10. Tel verder vanaf 10.' : 'Een ry in die raam is 5.',
      explain: 'Daar is ' + n + ' kolletjies.'
    };
  };

  /* Kleur N in (interaktief) */
  var SHAPE_SG = { sirkel: 'sirkel', vierkant: 'vierkant', driehoek: 'driehoek', ster: 'ster', hart: 'hart', ruit: 'ruit' };
  var SHAPE_PL = { sirkel: 'sirkels', vierkant: 'vierkante', driehoek: 'driehoeke', ster: 'sterre', hart: 'harte', ruit: 'ruite' };
  G.colourN = function (p) {
    var n = rnd(p.min || 1, p.max || 5);
    var total = Math.min(n + rnd(2, 4), p.max > 10 ? 20 : 12);
    var shape = pick(Object.keys(SHAPE_PL)), col = pick(AF.COLOURS.slice(0, 7));
    return {
      skill: 'tel',
      prompt: 'Kleur ' + n + ' ' + (n === 1 ? SHAPE_SG[shape] : SHAPE_PL[shape]) + ' in.',
      visual: '',
      input: { kind: 'colour', target: n, total: total, shape: shape, colour: col.c },
      hint: 'Tik op ' + (n === 1 ? 'een vorm' : n + ' vorms') + '. Tel hardop terwyl jy kleur.',
      explain: 'Ons moes presies ' + n + ' ' + (n === 1 ? SHAPE_SG[shape] : SHAPE_PL[shape]) + ' inkleur.'
    };
  };

  /* Getal <-> getalnaam */
  G.numWord = function (p) {
    var n = rnd(p.min || 1, p.max || 5);
    var pool = U.range(Math.max(0, (p.min || 1) - 2), Math.max((p.max || 5) + 2, 6));
    if (p.dir === 'toNum' || (p.dir !== 'toWord' && U.chance(0.5))) {
      var opts = U.sample(pool.filter(function (x) { return x !== n; }), 2).concat([n]);
      return {
        skill: 'getalname',
        prompt: 'Lees die woord. Watter getal is dit?',
        visual: '<div class="bigword">' + AF.numWord(n) + '</div>',
        input: { kind: 'choice', answer: n, options: U.shuffle(opts).map(function (v) { return { value: v, label: String(v) }; }) },
        hint: 'Sê die woord stadig hardop.',
        explain: '"' + AF.numWord(n) + '" is ' + n + '.'
      };
    }
    var others = U.sample(pool.filter(function (x) { return x !== n; }), 2).concat([n]);
    return {
      skill: 'getalname',
      prompt: 'Watter woord is die getal ' + n + '?',
      visual: '<div class="bignum">' + n + '</div>',
      input: { kind: 'choice', answer: n, layout: 'words', speakOptions: false, options: U.shuffle(others).map(function (v) { return { value: v, label: AF.numWord(v) }; }) },
      hint: 'Kyk na die eerste klank van die woord.',
      explain: n + ' skryf ons as "' + AF.numWord(n) + '".'
    };
  };

  /* Een/twee meer of minder */
  G.moreLess = function (p) {
    var by = pick(p.by || [1]);
    var more = U.chance(0.5);
    var lo = (p.min || 1) + (more ? 0 : by), hi = (p.max || 10) - (more ? by : 0);
    var n = rnd(lo, Math.max(lo, hi));
    var ans = more ? n + by : n - by;
    var word = (by === 1 ? 'een' : 'twee') + (more ? ' meer' : ' minder');
    return {
      skill: 'vergelyk',
      prompt: 'Wat is ' + word + ' as ' + n + '?',
      visual: V.numberLine({ min: Math.max(0, n - 4), max: Math.max(0, n - 4) + 8, mark: [n] }),
      input: numInput(ans, p, { min: 0, max: (p.max || 10) + 2 }),
      hint: more ? 'Begin by ' + n + ' en tel ' + (by === 1 ? 'een' : 'twee') + ' vorentoe.' : 'Begin by ' + n + ' en tel ' + (by === 1 ? 'een' : 'twee') + ' terug.',
      explain: AF.cap(word) + ' as ' + n + ' is ' + ans + '.'
    };
  };

  /* Vergelyk twee groepe: meer, net soveel, minder */
  G.compareGroups = function (p) {
    var max = p.max || 5, key = pick(AF.COUNTABLE), t = AF.thing(key);
    var a = rnd(1, max), b;
    var r = U.chance(0.3) ? 0 : (U.chance(0.5) ? 1 : -1);
    b = r === 0 ? a : rnd(1, max);
    if (r !== 0 && b === a) b = a < max ? a + 1 : a - 1;
    var ans = b > a ? 'meer' : b < a ? 'minder' : 'net soveel';
    return {
      skill: 'vergelyk',
      prompt: 'Het die tweede groep meer, net soveel of minder as die eerste groep?',
      visual: V.twoBoxes(V.objs(t.e, a, { layout: 'rows', size: 'md' }), V.objs(t.e, b, { layout: 'rows', size: 'md' }), 'Eerste', 'Tweede'),
      input: { kind: 'choice', answer: ans, layout: 'words', options: ['meer', 'net soveel', 'minder'].map(function (v) { return { value: v, label: v }; }) },
      hint: 'Tel elke groep. Watter getal is groter?',
      explain: 'Die eerste groep het ' + a + ', die tweede groep het ' + b + '. Die tweede groep het ' + ans + (ans === 'net soveel' ? '.' : ' as die eerste.')
    };
  };

  /* Watter getal is die grootste/kleinste */
  G.compareNumbers = function (p) {
    var k = p.n || pick([2, 3]);
    var nums = U.sample(U.range(p.min || 1, p.max || 10), k);
    var big = U.chance(0.5);
    var ans = big ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
    var w = k === 2 ? (big ? 'groter' : 'kleiner') : (big ? 'die grootste' : 'die kleinste');
    return {
      skill: 'vergelyk',
      prompt: 'Watter getal is ' + w + '?',
      visual: '',
      input: { kind: 'choice', answer: ans, layout: 'big', options: nums.map(function (v) { return { value: v, label: String(v) }; }) },
      hint: 'Dink aan die getallelyn: groter getalle kom later.',
      explain: ans + ' is ' + w + '.'
    };
  };

  /* Ontbrekende getal in 'n ry (ook tel in tweë, vywe, tiene) */
  var STEP_WORD = { 1: '', 2: 'Tel in tweë. ', 3: 'Tel in drieë. ', 5: 'Tel in vywe. ', 10: 'Tel in tiene. ' };
  G.missing = function (p) {
    var step = pick(p.steps || [1]);
    var len = p.len || (step === 1 ? 6 : 5);
    var back = p.back && U.chance(0.35);
    var min = p.min == null ? (step === 1 ? 1 : 0) : p.min, max = p.max || 10;
    var startMax = max - (len - 1) * step;
    var start = step === 1 ? rnd(min, Math.max(min, startMax)) : step * rnd(Math.ceil(min / step), Math.max(Math.ceil(min / step), Math.floor(startMax / step)));
    var seq = U.range(0, len - 1).map(function (i) { return start + i * step; });
    if (back) seq.reverse();
    var hideIdx = rnd(1, len - 1);
    var ans = seq[hideIdx];
    var visual;
    if (!back && U.chance(0.5)) {
      visual = V.numberLine({ min: seq[0], max: seq[len - 1], tick: step, label: 'all', hide: [ans] });
    } else {
      visual = '<div class="seq">' + seq.map(function (v, i) {
        return '<span class="' + (i === hideIdx ? 'q' : '') + '">' + (i === hideIdx ? '?' : v) + '</span>';
      }).join('') + '</div>';
    }
    return {
      skill: step === 1 ? 'volgorde' : 'patrone',
      prompt: (back ? 'Tel terug. ' : STEP_WORD[step] || '') + 'Watter getal ontbreek?',
      visual: visual,
      input: numInput(ans, p, { min: Math.max(0, min - step), max: max + step, spread: 2, step: step }),
      hint: back ? 'Die getalle word elke keer ' + step + ' kleiner.' : 'Die getalle word elke keer ' + step + ' groter.',
      explain: 'Die ry is ' + seq.join(', ') + '. Die ontbrekende getal is ' + ans + '.'
    };
  };

  /* Getallebord: watter getal kom volgende in die patroon */
  G.gridPattern = function (p) {
    var step = pick(p.steps || [5]), end = p.max || 50;
    var start = 1, cols = 10;
    var mults = U.range(step, end, step);
    var k = rnd(2, mults.length - 1);
    var hide = mults[k];
    return {
      skill: 'patrone',
      prompt: 'Ons tel in ' + (step === 2 ? 'tweë' : step === 5 ? 'vywe' : 'tiene') + '. Watter getal moet ons volgende inkleur?',
      visual: V.numberGrid({ start: start, end: end, cols: cols, highlight: mults.slice(0, k), hide: [hide] }),
      input: numInput(hide, { mode: 'choice', choices: 4 }, { min: step, max: end + step, spread: 2, step: step === 10 ? 10 : 1 }),
      hint: 'Kyk na die gekleurde getalle. Tel ' + step + ' verder vanaf ' + mults[k - 1] + '.',
      explain: mults[k - 1] + ' plus ' + step + ' is ' + hide + '.'
    };
  };

  /* Spronge op die getallelyn */
  G.hops = function (p) {
    var step = pick(p.steps || [2]);
    var n = rnd(2, Math.min(p.maxHops || 5, Math.floor((p.max || 20) / step)));
    var hops = [];
    for (var i = 0; i < n; i++) hops.push([i * step, (i + 1) * step]);
    var end = Math.max(n * step + step, step * 6);
    return {
      skill: 'patrone',
      prompt: 'Die padda spring elke keer ' + step + '. Hy begin by 0 en spring ' + n + ' keer. Waar land hy?',
      visual: V.numberLine({ min: 0, max: end, tick: step <= 2 ? 1 : step, label: step <= 2 ? 'all' : 'all', hops: hops, start: 0 }),
      input: numInput(n * step, p, { min: 0, max: end, step: step, spread: 2 }),
      hint: 'Tel in ' + (step === 2 ? 'tweë' : step === 5 ? 'vywe' : step === 10 ? 'tiene' : step) + ': ' + U.range(1, Math.min(n, 3)).map(function (i) { return i * step; }).join(', ') + '...',
      explain: n + ' spronge van ' + step + ' is ' + (n * step) + '.'
    };
  };

  /* Sit getalle in volgorde */
  G.order = function (p) {
    var n = p.n || 3;
    var vals = U.sample(U.range(p.min || 1, p.max || 10), n);
    var desc = p.desc && U.chance(0.4);
    return {
      skill: 'volgorde',
      prompt: desc ? 'Sit die getalle in volgorde: van die grootste tot die kleinste.' : 'Sit die getalle in volgorde: van die kleinste tot die grootste.',
      visual: '',
      input: { kind: 'order', items: vals.map(function (v) { return { value: v, label: String(v) }; }), answer: vals.slice().sort(function (a, b) { return desc ? b - a : a - b; }) },
      hint: desc ? 'Soek eers die grootste getal.' : 'Soek eers die kleinste getal.',
      explain: 'Die regte volgorde is ' + vals.slice().sort(function (a, b) { return desc ? b - a : a - b; }).join(', ') + '.'
    };
  };

  /* Watter getal kom tussen twee getalle */
  G.between = function (p) {
    var a = rnd(p.min || 1, (p.max || 20) - 2);
    var ans = a + 1;
    return {
      skill: 'volgorde',
      prompt: 'Watter getal kom tussen ' + a + ' en ' + (a + 2) + '?',
      visual: '<div class="seq"><span>' + a + '</span><span class="q">?</span><span>' + (a + 2) + '</span></div>',
      input: numInput(ans, p, { min: Math.max(0, a - 3), max: a + 5, spread: 2 }),
      hint: 'Tel: ' + a + ', ...',
      explain: ans + ' kom tussen ' + a + ' en ' + (a + 2) + '.'
    };
  };

  /* Tiene en ene: 13 = 10 + 3 */
  G.tenAndMore = function (p) {
    var n = rnd(p.min || 11, p.max || 15);
    var key = pick(AF.COUNTABLE), t = AF.thing(key);
    var v = rnd(0, 2);
    if (v === 0) {
      return {
        skill: 'tel',
        prompt: 'Daar is ' + n + ' ' + t.p + '. Ons het 10 omkring. Hoeveel bly oor?',
        visual: V.objs(t.e, n, { layout: 'rows', ringTo: 10 }),
        input: numInput(n - 10, { mode: 'choice' }, { min: 0, max: 10 }),
        hint: 'Tel net die ' + t.p + ' wat nie omkring is nie.',
        explain: n + ' is 10 en ' + (n - 10) + '. Daar bly ' + (n - 10) + ' oor.'
      };
    }
    if (v === 1) {
      return {
        skill: 'tel',
        prompt: '10 en hoeveel maak ' + n + '?',
        visual: V.tenFrames(n),
        input: numInput(n - 10, { mode: 'choice' }, { min: 0, max: 10 }),
        hint: 'Die eerste raam is vol: dit is 10. Tel die kolletjies in die tweede raam.',
        explain: '10 en ' + (n - 10) + ' maak ' + n + '.'
      };
    }
    return {
      skill: 'tel',
      prompt: 'Hoeveel kolletjies is daar altesaam?',
      visual: V.tenFrames(n),
      input: numInput(n, p, { min: 10, max: 20 }),
      hint: 'Een vol raam is 10. Tel verder: 11, 12, ...',
      explain: '10 en ' + (n - 10) + ' is ' + n + '.'
    };
  };

  /* Plekwaarde: 10 + 4, 14 - 10, 14 = 10 + ? */
  G.placeValue = function (p) {
    var n = rnd(11, p.max || 19), u = n - 10, v = rnd(0, 2), prompt, ans;
    if (v === 0) { prompt = '10 + ' + u + ' = ?'; ans = n; }
    else if (v === 1) { prompt = n + ' – 10 = ?'; ans = u; }
    else { prompt = n + ' = 10 + ?'; ans = u; }
    return {
      skill: 'opbou',
      prompt: prompt,
      visual: '<div class="pv"><div class="pvcol"><b>Tiene</b><div class="pvten">' + V.beads(10, { colours: Array(10).fill('#ef5350') }) + '</div></div>' +
        '<div class="pvcol"><b>Ene</b>' + V.objs('🔵', u, { layout: 'rows', size: 'md' }) + '</div></div>',
      input: numInput(ans, { mode: 'number' }),
      hint: n + ' is een tien en ' + u + ' ene.',
      explain: n + ' is 10 en ' + u + '. Die antwoord is ' + ans + '.'
    };
  };

  /* Ewe of onewe */
  G.oddEven = function (p) {
    var n = rnd(p.min || 2, p.max || 20);
    var even = n % 2 === 0;
    return {
      skill: 'volgorde',
      prompt: 'Is ' + n + ' ’n ewe of ’n onewe getal?',
      visual: V.groups('🧦', Math.floor(n / 2), 2, { loose: n % 2 }),
      input: { kind: 'choice', answer: even ? 'ewe' : 'onewe', layout: 'words', options: [{ value: 'ewe', label: 'ewe' }, { value: 'onewe', label: 'onewe' }] },
      hint: 'Kan al die sokkies pare maak, of bly een alleen oor?',
      explain: n + ' is ' + (even ? 'ewe: almal het ’n maat.' : 'onewe: een bly oor.')
    };
  };

  /* Trek die getal na (interaktief) */
  G.trace = function (p) {
    var n = pick(p.nums || U.range(p.min || 1, p.max || 5));
    return {
      skill: 'skryf',
      prompt: 'Trek die getal ' + n + ' na met jou vinger.',
      say: 'Trek die getal ' + AF.numWord(n) + ' na met jou vinger.',
      visual: '',
      input: { kind: 'trace', text: String(n) },
      hint: 'Begin bo en volg die grys lyn.',
      explain: 'Goed geoefen!'
    };
  };

  /* Pas getal by prentjie: watter groep het N? */
  G.matchGroup = function (p) {
    var n = rnd(p.min || 1, p.max || 5), key = pick(AF.COUNTABLE), t = AF.thing(key);
    var vals = U.numChoices(n, { min: 1, max: (p.max || 5) + 2, n: 3 }).map(function (o) { return o.value; });
    return {
      skill: 'tel',
      prompt: 'Watter groep het ' + n + ' ' + (n === 1 ? t.s : t.p) + '?',
      visual: '<div class="bignum">' + n + '</div>',
      input: {
        kind: 'choice', answer: n, layout: 'pics',
        options: vals.map(function (v) { return { value: v, html: V.objs(t.e, v, { layout: 'rows', size: 'sm' }) }; })
      },
      hint: 'Tel die ' + t.p + ' in elke groep.',
      explain: 'Die groep met ' + AF.count(n, key) + ' is reg.'
    };
  };
})(W.G);
