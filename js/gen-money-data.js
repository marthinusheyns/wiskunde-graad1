/* Vraaggenerators: geld (Suid-Afrikaanse munte en note) en data (prentgrafieke). */
var W = window.W || (window.W = {});
W.G = W.G || {};

(function (G) {
  var U = W.U, V = W.V, AF = W.AF;
  var rnd = U.rnd, pick = U.pick;
  var L = V.moneyLabel;
  function isNote(c) { return c >= 1000; }
  function kindWord(c) { return isNote(c) ? 'noot' : 'muntstuk'; }

  G.moneyName = function (p) {
    var set = p.set || [10, 20, 50, 100, 200, 500, 1000, 2000];
    var c = pick(set);
    return {
      skill: 'geld',
      prompt: 'Hoeveel is hierdie ' + kindWord(c) + ' werd?',
      visual: V.money([c]),
      input: { kind: 'choice', answer: c, layout: 'words', options: U.shuffle([c].concat(U.sample(set.filter(function (x) { return x !== c; }), 2))).map(function (v) { return { value: v, label: L(v) }; }) },
      hint: 'Kyk na die getal op die ' + kindWord(c) + '.',
      explain: 'Dit is ' + L(c) + '.'
    };
  };

  G.moneyFind = function (p) {
    var set = p.set || [10, 20, 50, 100, 200, 500, 1000, 2000];
    var opts = U.sample(set, Math.min(4, set.length)), c = pick(opts);
    return {
      skill: 'geld',
      prompt: 'Tik op die ' + L(c) + '-' + kindWord(c) + '.',
      visual: '',
      input: { kind: 'choice', answer: c, layout: 'pics', options: opts.map(function (v) { return { value: v, html: V.money([v]) }; }) },
      hint: 'Lees die getal op elke ' + 'munt en noot.',
      explain: 'Die ' + L(c) + '-' + kindWord(c) + ' het ’n ' + L(c) + ' daarop.'
    };
  };

  G.moneyMore = function (p) {
    var set = p.set || [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    var opts;
    if (p.tricky !== false && U.chance(0.35)) {
      var tr = pick([[5, 500], [20, 2000], [50, 100], [100, 200], [20, 50], [10, 1000]]);
      opts = tr;
    } else opts = U.sample(set, pick([2, 3]));
    var most = U.chance(0.7);
    var ans = most ? Math.max.apply(null, opts) : Math.min.apply(null, opts);
    return {
      skill: 'geld',
      prompt: 'Watter een is die ' + (most ? 'meeste' : 'minste') + ' werd?',
      visual: '',
      input: { kind: 'choice', answer: ans, layout: 'pics', options: U.shuffle(opts).map(function (v) { return { value: v, html: V.money([v]) }; }) },
      hint: '100 sent is dieselfde as R1. Rand is meer werd as sent.',
      explain: L(ans) + ' is die ' + (most ? 'meeste' : 'minste') + ' werd.'
    };
  };

  /* Tel munte bymekaar */
  function makeCoins(total, denoms, greedy) {
    var out = [], left = total, guard = 0;
    while (left > 0 && guard++ < 50) {
      var ok = denoms.filter(function (d) { return d <= left; });
      if (!ok.length) break;
      var d = greedy || U.chance(0.3) ? Math.max.apply(null, ok) : pick(ok);
      out.push(d); left -= d;
    }
    return out.sort(function (a, b) { return b - a; });
  }
  G.moneyTotal = function (p) {
    var cents = p.cents;
    var denoms = cents ? [5, 10, 20] : (p.denoms || [100, 200, 500]);
    var maxR = p.max || 10;
    var total = cents ? 5 * rnd(2, Math.floor((p.max || 50) / 5)) : 100 * rnd(2, maxR);
    var coins = makeCoins(total, denoms);
    if (coins.length > 7) { coins = makeCoins(total, denoms, true); }
    var step = cents ? 5 : 100;
    var opts = U.numChoices(total / step, { min: 1, max: (cents ? (p.max || 50) / 5 : maxR) + 2, n: 3, spread: 2 }).map(function (o) { return { value: o.value * step, label: L(o.value * step) }; });
    return {
      skill: 'geld',
      prompt: 'Hoeveel geld is dit altesaam?',
      visual: V.money(coins),
      input: { kind: 'choice', answer: total, layout: 'words', options: opts },
      hint: 'Begin by die grootste munt en tel verder.',
      explain: coins.map(L).join(' + ') + ' = ' + L(total) + '.'
    };
  };

  G.moneyMake = function (p) {
    var target = pick(p.targets || [1000]);
    var denoms = target <= 50 ? [5, 10, 20] : target <= 1000 ? [100, 200, 500] : [100, 200, 500, 1000];
    var smaller = denoms.filter(function (d) { return d < target; });
    var right = makeCoins(target, smaller.length ? smaller : denoms);
    var opts = [right], seen = {}; seen[right.join(',')] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 40) {
      var off = pick(denoms.slice(0, 2)) * pick([-1, 1]);
      var t2 = target + off;
      if (t2 <= 0) continue;
      var w = makeCoins(t2, denoms), k = w.join(',');
      if (!seen[k]) { seen[k] = 1; opts.push(w); }
    }
    return {
      skill: 'geld',
      prompt: 'Watter groep geld maak presies ' + L(target) + '?',
      visual: '',
      input: { kind: 'choice', answer: right.join(','), layout: 'stack', options: U.shuffle(opts).map(function (o) { return { value: o.join(','), html: V.money(o) }; }) },
      hint: 'Tel elke groep bymekaar.',
      explain: right.map(L).join(' + ') + ' = ' + L(target) + '.'
    };
  };

  G.moneySum = function (p) {
    var max = p.max || 20, sub = p.op === 'sub' || (p.op === 'both' && U.chance(0.5));
    var a, b, ans, prompt;
    if (sub) { a = rnd(3, max); b = rnd(1, a - 1); ans = a - b; prompt = 'R' + a + ' – R' + b + ' = ?'; }
    else { a = rnd(1, max - 1); b = rnd(1, max - a); ans = a + b; prompt = 'R' + a + ' + R' + b + ' = ?'; }
    return {
      skill: 'geld',
      prompt: prompt,
      visual: '',
      input: { kind: 'number', answer: ans, prefix: 'R' },
      hint: 'Werk net met die getalle: ' + a + (sub ? ' – ' : ' + ') + b + '.',
      explain: prompt.replace('?', 'R' + ans) + '.'
    };
  };

  var SHOP = [
    { e: '🍬', n: '’n pakkie lekkers' }, { e: '🍎', n: '’n appel' }, { e: '🥤', n: '’n koeldrank' },
    { e: '🍞', n: '’n brood' }, { e: '🍦', n: '’n roomys' }, { e: '⚽', n: '’n bal' },
    { e: '✏️', n: '’n potlood' }, { e: '👒', n: '’n hoed' }, { e: '🧃', n: '’n sappie' }
  ];
  G.moneyChange = function (p) {
    var have = pick(p.have || [10, 15, 20]), cost = rnd(1, have - 1), it = pick(SHOP);
    var who = pick(AF.NAMES);
    return {
      skill: 'geld',
      prompt: who + ' het R' + have + '. ' + who + ' koop ' + it.n + ' vir R' + cost + '. Hoeveel geld het ' + who + ' oor?',
      visual: '<div class="shop"><span class="emo">' + it.e + '</span><span class="tag">R' + cost + '</span></div>',
      input: { kind: 'number', answer: have - cost, prefix: 'R' },
      hint: 'R' + have + ' – R' + cost + '. Tel van ' + cost + ' tot by ' + have + '.',
      explain: 'R' + have + ' – R' + cost + ' = R' + (have - cost) + '.'
    };
  };

  G.moneyBuy = function (p) {
    var have = rnd(3, p.max || 10), items = U.sample(SHOP, 3);
    var prices = [rnd(1, have)];
    while (prices.length < 3) { var pr = rnd(have + 1, have + 8); if (prices.indexOf(pr) < 0) prices.push(pr); }
    var ok = items[0];
    var opts = items.map(function (it, i) { return { value: it.n, html: '<span class="emo">' + it.e + '</span><span class="tag">R' + prices[i] + '</span>' }; });
    return {
      skill: 'geld',
      prompt: 'Jy het R' + have + '. Watter een kan jy koop?',
      visual: V.money(makeCoins(have * 100, [100, 200, 500])),
      input: { kind: 'choice', answer: ok.n, layout: 'pics', options: U.shuffle(opts) },
      hint: 'Die prys moet dieselfde of minder as R' + have + ' wees.',
      explain: 'Jy kan ' + ok.n + ' vir R' + prices[0] + ' koop.'
    };
  };

  /* Prentgrafiek */
  var CATS = {
    vrugte: { title: 'Ons gunstelingvrugte', who: 'kinders hou van', items: [['🍎', 'appels'], ['🍌', 'piesangs'], ['🍐', 'pere'], ['🍓', 'aarbeie'], ['🍊', 'lemoene']] },
    speelgoed: { title: 'Ons speelgoed', who: 'kinders het', items: [['🪀', 'jojo’s'], ['🚚', 'vragmotors'], ['🧸', 'teddiebere'], ['🤖', 'robotte'], ['⚽', 'balle']] },
    voertuie: { title: 'Voertuie in die straat', who: '', items: [['🚗', 'motors'], ['🚌', 'busse'], ['🚲', 'fietse'], ['🚚', 'vragmotors']] }
  };
  G.pictograph = function (p) {
    var catKey = pick(Object.keys(CATS)), cat = CATS[catKey];
    var items = U.sample(cat.items.filter(function (x) { return x[0] !== '🪀'; }), pick([3, 4]));
    var counts = U.sample(U.range(1, p.max || 7), items.length); // uniek, so daar is een meeste en een minste
    var rows = items.map(function (it, i) { return { e: it[0], label: it[1], n: counts[i] }; });
    var v = rnd(0, p.diff ? 3 : 2), q, ans, opts;
    var maxI = counts.indexOf(Math.max.apply(null, counts)), minI = counts.indexOf(Math.min.apply(null, counts));
    if (v === 0) {
      var r = pick(rows);
      q = catKey === 'voertuie' ? 'Hoeveel ' + r.label + ' is daar?' : 'Hoeveel ' + cat.who + ' ' + r.label + '?';
      return {
        skill: 'data', prompt: q, visual: V.pictograph(rows, { title: cat.title }),
        input: G._numInput(r.n, { mode: 'choice' }, { min: 0, max: (p.max || 7) + 2 }),
        hint: 'Kyk na die ry met ' + r.e + ' en tel.', explain: 'Daar is ' + r.n + '.'
      };
    }
    var most = v === 1;
    if (v <= 2) {
      var tgt = rows[most ? maxI : minI];
      q = catKey === 'vrugte' ? 'Van watter vrugte hou die ' + (most ? 'meeste' : 'minste') + ' kinders?' :
        catKey === 'speelgoed' ? 'Watter speelding het die ' + (most ? 'meeste' : 'minste') + ' kinders?' :
          'Van watter voertuig is daar die ' + (most ? 'meeste' : 'minste') + '?';
      return {
        skill: 'data', prompt: q, visual: V.pictograph(rows, { title: cat.title }),
        input: { kind: 'choice', answer: tgt.label, layout: 'pics', options: rows.map(function (r) { return { value: r.label, html: '<span class="emo">' + r.e + '</span><small>' + r.label + '</small>' }; }) },
        hint: 'Watter ry is die ' + (most ? 'langste' : 'kortste') + '?', explain: 'Die ' + tgt.label + ' het ' + tgt.n + ', dit is die ' + (most ? 'meeste' : 'minste') + '.'
      };
    }
    var a = rows[maxI], b = rows[minI];
    return {
      skill: 'data', prompt: 'Hoeveel meer ' + a.label + ' as ' + b.label + ' is daar?', visual: V.pictograph(rows, { title: cat.title }),
      input: G._numInput(a.n - b.n, { mode: 'choice' }, { min: 0, max: 8 }),
      hint: a.n + ' – ' + b.n, explain: a.n + ' – ' + b.n + ' = ' + (a.n - b.n) + '.'
    };
  };
})(W.G);
