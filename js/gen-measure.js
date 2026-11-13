/* Vraaggenerators: meting (grootte, lengte, inhoud, massa) en tyd. */
var W = window.W || (window.W = {});
W.G = W.G || {};

(function (G) {
  var U = W.U, V = W.V, AF = W.AF;
  var rnd = U.rnd, pick = U.pick, numInput = G._numInput;

  /* Grootste / kleinste */
  G.sizeCompare = function (p) {
    var key = pick(AF.ANIMALS.concat(['bal', 'ballon', 'appel', 'boom', 'motor', 'blom'])), t = AF.thing(key);
    var sizes = U.sample([34, 50, 68, 88, 108], pick([3, 4]));
    var big = U.chance(0.5);
    var ans = big ? Math.max.apply(null, sizes) : Math.min.apply(null, sizes);
    return {
      skill: 'meet',
      prompt: 'Tik op die ' + (big ? 'grootste' : 'kleinste') + ' ' + t.s + '.',
      visual: '',
      input: {
        kind: 'choice', answer: ans, layout: 'pics',
        options: U.shuffle(sizes).map(function (s) { return { value: s, html: '<span class="emo" style="font-size:' + s + 'px">' + t.e + '</span>' }; })
      },
      hint: 'Vergelyk hulle met mekaar.',
      explain: 'Kyk na die ' + (big ? 'grootste' : 'kleinste') + ' een.'
    };
  };

  /* Langste / kortste / hoogste */
  G.lengthCompare = function (p) {
    var v = rnd(0, 2), lens = U.sample([2, 3, 4, 5, 6, 7], 3), longest = U.chance(0.5);
    var ans = longest ? Math.max.apply(null, lens) : Math.min.apply(null, lens);
    var colours = U.shuffle([V.C.red, V.C.blue, V.C.green, V.C.orange, V.C.purple]);
    if (v === 0) {
      return {
        skill: 'meet',
        prompt: 'Tik op die ' + (longest ? 'langste' : 'kortste') + ' trein.',
        visual: '',
        input: { kind: 'choice', answer: ans, layout: 'stack', options: lens.map(function (l, i) { return { value: l, html: V.train(l, colours[i]) }; }) },
        hint: 'Kyk waar elke trein eindig.',
        explain: 'Die ' + (longest ? 'langste' : 'kortste') + ' trein het ' + ans + ' waens.'
      };
    }
    if (v === 1) {
      return {
        skill: 'meet',
        prompt: 'Tik op die ' + (longest ? 'langste' : 'kortste') + ' potlood.',
        visual: '',
        input: { kind: 'choice', answer: ans, layout: 'stack', options: lens.map(function (l, i) { return { value: l, html: V.measure(l, { blocks: false, colour: colours[i] }) }; }) },
        hint: 'Al die potlode begin op dieselfde plek. Kyk waar hulle eindig.',
        explain: 'Kyk na die ' + (longest ? 'langste' : 'kortste') + ' potlood.'
      };
    }
    // torings: hoogste / laagste
    return {
      skill: 'meet',
      prompt: 'Tik op die ' + (longest ? 'hoogste' : 'laagste') + ' toring.',
      visual: '',
      input: {
        kind: 'choice', answer: ans, layout: 'pics',
        options: lens.map(function (l, i) {
          var body = '';
          for (var k = 0; k < l; k++) body += '<rect x="6" y="' + (8 + (7 - k - 1) * 24) + '" width="44" height="22" rx="3" fill="' + colours[i] + '" stroke="#263238" stroke-width="2"/>';
          return { value: l, html: V.svg(56, 180, body, 'tower') };
        })
      },
      hint: 'Tel die blokke in elke toring.',
      explain: 'Die ' + (longest ? 'hoogste' : 'laagste') + ' toring het ' + ans + ' blokke.'
    };
  };

  /* Meet met blokkies */
  G.measure = function (p) {
    var len = rnd(p.min || 2, p.max || 8);
    return {
      skill: 'meet',
      prompt: 'Hoeveel blokkies lank is die potlood?',
      visual: V.measure(len, { colour: pick([V.C.yellow, V.C.green, V.C.blue, V.C.orange]) }),
      input: numInput(len, p, { min: 1, max: (p.max || 8) + 2 }),
      hint: 'Tel die blokkies onder die potlood.',
      explain: 'Die potlood is ' + len + ' blokkies lank.'
    };
  };

  /* Vol, leeg (en halfvol) */
  G.fullEmpty = function (p) {
    var opts = p.half ? ['vol', 'leeg', 'halfvol'] : ['vol', 'leeg'];
    var ans = pick(opts), lvl = { vol: 0.95, leeg: 0, halfvol: 0.5 }[ans];
    return {
      skill: 'meet',
      prompt: p.half ? 'Is die glas vol, leeg of halfvol?' : 'Is die glas vol of leeg?',
      visual: V.glass(lvl, { w: 120, h: 170, colour: pick(['#4fc3f7', '#ffb74d', '#ef9a9a', '#a5d6a7']) }),
      input: { kind: 'choice', answer: ans, layout: 'words', options: opts.map(function (o) { return { value: o, label: o }; }) },
      hint: 'Kyk hoeveel sap in die glas is.',
      explain: 'Die glas is ' + ans + '.'
    };
  };

  /* Watter glas het meer / minder; of meer as/minder as/dieselfde as */
  G.capacity = function (p) {
    var v = rnd(0, 1);
    if (v === 0) {
      var lv = U.sample([0.2, 0.35, 0.5, 0.65, 0.8, 0.95], 3), more = U.chance(0.5);
      var ans = more ? Math.max.apply(null, lv) : Math.min.apply(null, lv);
      return {
        skill: 'meet',
        prompt: 'Watter glas het die ' + (more ? 'meeste' : 'minste') + ' water?',
        visual: '',
        input: { kind: 'choice', answer: ans, layout: 'pics', options: lv.map(function (l) { return { value: l, html: V.glass(l, { w: 90, h: 130 }) }; }) },
        hint: 'Kyk hoe hoog die water in elke glas is.',
        explain: 'Die glas met die ' + (more ? 'hoogste' : 'laagste') + ' water het die ' + (more ? 'meeste' : 'minste') + '.'
      };
    }
    var a = pick([0.3, 0.5, 0.7, 0.9]), r = rnd(-1, 1), b = r === 0 ? a : U.clamp(a + r * 0.25, 0.1, 0.98);
    if (b === a) r = 0;
    var answ = r > 0 ? 'meer as' : r < 0 ? 'minder as' : 'dieselfde as';
    return {
      skill: 'meet',
      prompt: 'Die blou glas het ... die rooi glas.',
      say: 'Het die blou glas meer as, minder as, of dieselfde as die rooi glas?',
      visual: '<div class="twobox">' + '<div class="box"><div class="boxlbl">rooi</div>' + V.glass(a, { colour: '#ef5350', w: 90, h: 130 }) + '</div>' +
        '<div class="box"><div class="boxlbl">blou</div>' + V.glass(b, { colour: '#42a5f5', w: 90, h: 130 }) + '</div></div>',
      input: { kind: 'choice', answer: answ, layout: 'words', options: ['meer as', 'minder as', 'dieselfde as'].map(function (o) { return { value: o, label: o }; }) },
      hint: 'Vergelyk hoe hoog die sap in die twee glase is.',
      explain: 'Die blou glas het ' + answ + ' die rooi glas.'
    };
  };

  /* Watter houer hou die meeste */
  var HOLDERS = [{ e: '🥄', n: 'lepel', v: 1 }, { e: '☕', n: 'koppie', v: 2 }, { e: '🍲', n: 'pot', v: 3 }, { e: '🛁', n: 'bad', v: 4 }];
  G.holdsMost = function (p) {
    var set = U.sample(HOLDERS, 3), most = U.chance(0.5);
    var best = set.reduce(function (a, b) { return (most ? b.v > a.v : b.v < a.v) ? b : a; });
    return {
      skill: 'meet',
      prompt: 'Watter een hou die ' + (most ? 'meeste' : 'minste') + ' water?',
      visual: '',
      input: { kind: 'choice', answer: best.n, layout: 'pics', options: set.map(function (h) { return { value: h.n, html: '<span class="emo">' + h.e + '</span><small>' + h.n + '</small>' }; }) },
      hint: 'Dink hoe groot elke houer regtig is.',
      explain: 'Die ' + best.n + ' hou die ' + (most ? 'meeste' : 'minste') + '.'
    };
  };

  /* Massa: watter kant is swaarder/ligter */
  var MASS = [{ e: '🍃', n: 'blaar', v: 1 }, { e: '🍎', n: 'appel', v: 2 }, { e: '📘', n: 'boek', v: 3 }, { e: '🍉', n: 'waatlemoen', v: 4 }];
  G.mass = function (p) {
    if (p.blocks || U.chance(p.blocksChance || 0)) {
      var a = rnd(3, p.max || 20), b = rnd(3, p.max || 20);
      if (a === b) b = a > 3 ? a - rnd(1, 2) : a + rnd(1, 2);
      var v = rnd(0, 1);
      if (v === 0) {
        var heavy = U.chance(0.5);
        var ansSide = heavy ? (a > b ? 'links' : 'regs') : (a < b ? 'links' : 'regs');
        return {
          skill: 'meet',
          prompt: 'Watter kant is ' + (heavy ? 'swaarder' : 'ligter') + '?',
          visual: V.balance(String(a), String(b), a > b ? -1 : 1) + '<div class="caption">Die getalle wys hoeveel blokkies op elke kant is.</div>',
          input: { kind: 'choice', answer: ansSide, layout: 'words', options: [{ value: 'links', label: 'links' }, { value: 'regs', label: 'regs' }] },
          hint: 'Die swaar kant sak af.',
          explain: (heavy ? 'Die kant met ' + Math.max(a, b) + ' blokkies is swaarder.' : 'Die kant met ' + Math.min(a, b) + ' blokkies is ligter.')
        };
      }
      var lo = Math.min(a, b), hi = Math.max(a, b);
      return {
        skill: 'meet',
        prompt: 'Een kant het ' + lo + ' blokkies, die ander kant het ' + hi + '. Hoeveel blokkies moet ons byvoeg sodat die skaal gelyk is?',
        visual: V.balance(String(a), String(b), a > b ? -1 : 1),
        input: numInput(hi - lo, { mode: 'number' }),
        hint: 'Tel van ' + lo + ' tot by ' + hi + '.',
        explain: hi + ' – ' + lo + ' = ' + (hi - lo) + '.'
      };
    }
    var two = U.sample(MASS, 2), heavyQ = U.chance(0.5);
    var L = two[0], R = two[1];
    var ans = heavyQ ? (L.v > R.v ? L : R) : (L.v < R.v ? L : R);
    return {
      skill: 'meet',
      prompt: 'Wat is ' + (heavyQ ? 'swaarder' : 'ligter') + '?',
      visual: V.balance(L.e, R.e, L.v > R.v ? -1 : 1),
      input: { kind: 'choice', answer: ans.n, layout: 'pics', options: [L, R].map(function (m) { return { value: m.n, html: '<span class="emo">' + m.e + '</span><small>' + m.n + '</small>' }; }) },
      hint: 'Die swaarder kant van die skaal sak af.',
      explain: 'Die ' + ans.n + ' is ' + (heavyQ ? 'swaarder' : 'ligter') + '.'
    };
  };

  /* Wat neem langer om te doen */
  var ACTS = [
    { e: '🥪', t: '’n Toebroodjie maak', d: 1 }, { e: '🎂', t: '’n Koek bak', d: 3 },
    { e: '🏠', t: '’n Huis verf', d: 5 }, { e: '🖍️', t: '’n Prentjie teken', d: 2 },
    { e: '🚶', t: 'Skool toe loop', d: 2 }, { e: '🚗', t: 'Na die see toe ry', d: 4 },
    { e: '😴', t: '’n Hele nag slaap', d: 4 }, { e: '👟', t: 'Skoene aantrek', d: 1 },
    { e: '⚽', t: '’n Sokkerwedstryd speel', d: 3 }, { e: '🌳', t: '’n Boom laat groei', d: 6 },
    { e: '👏', t: 'Hande klap', d: 0 }, { e: '🏫', t: '’n Skooldag', d: 4 }
  ];
  G.timeLonger = function (p) {
    var a = pick(ACTS), b;
    do { b = pick(ACTS); } while (Math.abs(a.d - b.d) < 2);
    var longer = U.chance(0.5), ans = longer ? (a.d > b.d ? a : b) : (a.d < b.d ? a : b);
    return {
      skill: 'tyd',
      prompt: longer ? 'Wat neem langer om te doen?' : 'Wat is vinniger klaar?',
      visual: '',
      input: { kind: 'choice', answer: ans.t, layout: 'pics', options: [a, b].map(function (x) { return { value: x.t, html: '<span class="emo">' + x.e + '</span><small>' + x.t + '</small>' }; }) },
      hint: 'Dink hoe lank jy elkeen moet doen.',
      explain: ans.t + ' ' + (longer ? 'neem langer.' : 'is vinniger klaar.')
    };
  };

  /* Dae van die week en maande van die jaar */
  G.daysMonths = function (p) {
    var v = rnd(0, p.months === false ? 2 : 5);
    var D = AF.DAYS, M = AF.MONTHS, i, ans;
    if (v === 0 || v === 1) {
      i = rnd(0, 5); var after = v === 0;
      if (!after) i = rnd(1, 6);
      ans = after ? D[i + 1] : D[i - 1];
      return {
        skill: 'tyd',
        prompt: 'Watter dag kom ' + (after ? 'ná ' : 'voor ') + D[i] + '?',
        visual: '<div class="cal">📅</div>',
        input: { kind: 'choice', answer: ans, layout: 'words', options: U.listChoices(ans, D, 3) },
        hint: 'Sê die dae van die week: Maandag, Dinsdag, Woensdag...',
        explain: ans + ' kom ' + (after ? 'ná ' : 'voor ') + D[i] + '.'
      };
    }
    if (v === 2) {
      i = rnd(0, 6); var gister = U.chance(0.5);
      ans = gister ? D[(i + 6) % 7] : D[(i + 1) % 7];
      return {
        skill: 'tyd',
        prompt: 'As vandag ' + D[i] + ' is, watter dag ' + (gister ? 'was dit gister?' : 'is dit môre?'),
        visual: '<div class="cal">📅</div>',
        input: { kind: 'choice', answer: ans, layout: 'words', options: U.listChoices(ans, D, 3) },
        hint: gister ? 'Gister is die dag voor vandag.' : 'Môre is die dag ná vandag.',
        explain: (gister ? 'Gister was ' : 'Môre is ') + ans + '.'
      };
    }
    if (v === 3 || v === 4) {
      i = rnd(1, 10); var aft = v === 3;
      ans = aft ? M[i + 1] : M[i - 1];
      return {
        skill: 'tyd',
        prompt: 'Watter maand kom ' + (aft ? 'ná ' : 'voor ') + M[i] + '?',
        visual: '<div class="cal">🗓️</div>',
        input: { kind: 'choice', answer: ans, layout: 'words', options: U.listChoices(ans, M, 3) },
        hint: 'Sê die maande: Januarie, Februarie, Maart...',
        explain: ans + ' kom ' + (aft ? 'ná ' : 'voor ') + M[i] + '.'
      };
    }
    var qs = [['Hoeveel dae is daar in ’n week?', 7], ['Hoeveel maande is daar in ’n jaar?', 12], ['Hoeveel dae is daar in twee weke?', 14]];
    var q = pick(p.twoWeeks ? qs : qs.slice(0, 2));
    return {
      skill: 'tyd',
      prompt: q[0],
      visual: '<div class="cal">📅</div>',
      input: numInput(q[1], { mode: 'choice', choices: 3 }, { min: 4, max: 16 }),
      hint: 'Tel die dae of maande op jou vingers.',
      explain: 'Die antwoord is ' + q[1] + '.'
    };
  };

  /* Volgorde van gebeure */
  var SEQS = [
    { items: ['😴', '🥣', '🎒', '🏫'], name: 'oggend' },
    { items: ['🥚', '🐣', '🐥', '🐔'], name: 'kuiken' },
    { items: ['🌱', '🌿', '🌳'], name: 'boom' },
    { items: ['🌅', '☀️', '🌇', '🌙'], name: 'dag' },
    { items: ['🐛', '🦋'], name: 'ruspe' }
  ];
  G.sequence = function (p) {
    var s = pick(SEQS.filter(function (x) { return x.items.length >= 3; }));
    var v = rnd(0, 1);
    if (v === 0) {
      return {
        skill: 'tyd',
        prompt: 'Sit die prentjies in die regte volgorde. Wat gebeur eerste?',
        visual: '',
        input: { kind: 'order', items: U.shuffle(s.items).map(function (e) { return { value: e, label: e }; }), answer: s.items.slice() },
        hint: 'Wat kom heel eerste? Wat kom heel laaste?',
        explain: 'Die regte volgorde is ' + s.items.join(' ') + '.'
      };
    }
    var k = s.items.length - 1;
    return {
      skill: 'tyd',
      prompt: 'Wat kom volgende?',
      visual: '<div class="seq emo">' + s.items.slice(0, k).map(function (e) { return '<span>' + e + '</span>'; }).join('') + '<span class="q">?</span></div>',
      input: { kind: 'choice', answer: s.items[k], layout: 'pics', options: U.shuffle(s.items).map(function (e) { return { value: e, html: '<span class="emo">' + e + '</span>' }; }) },
      hint: 'Kyk hoe dit elke keer verander.',
      explain: 'Ná ' + s.items[k - 1] + ' kom ' + s.items[k] + '.'
    };
  };
})(W.G);
