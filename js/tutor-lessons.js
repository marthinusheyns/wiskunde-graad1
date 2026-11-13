/* "Wys my hoe": Juffrou Padda se lesse. Elke les is 'n lys rame { html, say, ms? }:
   'n prentjie en een gesproke sin. Die lesse volg die klaskamermetodes: tel aan op die
   getallelyn, bindings met krale, maak eers 10 met die tienraam, tel in groepe, deel een vir een,
   tel geld volgens waarde. Suiwer funksies (geen DOM nie), sodat dit in Node getoets kan word. */
var W = window.W || (window.W = {});

W.LESSONS = (function () {
  var U = W.U, V = W.V, AF = W.AF;
  var N = AF.numWord;
  var STEPW = { 2: 'tweë', 3: 'drieë', 4: 'viere', 5: 'vywe', 10: 'tiene' };
  function F(html, say, ms) { return { html: html, say: say, ms: ms || 0 }; }
  var FAST = 650;

  /* ---------- klein prentjie-helpers ---------- */
  function counted(e, n, k) { // n voorwerpe, die eerste k het nommers
    var rows = [], items = [];
    for (var i = 0; i < n; i++) {
      items.push('<span class="o' + (i === k - 1 ? ' cur' : '') + '">' + e + (i < k ? '<b class="badge">' + (i + 1) + '</b>' : '') + '</span>');
    }
    for (var r = 0; r < items.length; r += 5) rows.push('<div class="orow">' + items.slice(r, r + 5).join('') + '</div>');
    return '<div class="objs rows ' + (n > 10 ? 'md' : 'lg') + ' counted">' + rows.join('') + '</div>';
  }
  function pairRows(e, a, b) {
    var cols = Math.max(a, b), top = '', bot = '';
    for (var i = 0; i < cols; i++) {
      var pair = i < a && i < b;
      top += '<span class="pc' + (i < a ? (pair ? '' : ' extra') : ' empty') + '">' + (i < a ? e : '') + '</span>';
      bot += '<span class="pc' + (i < b ? (pair ? '' : ' extra') : ' empty') + '">' + (i < b ? e : '') + '</span>';
    }
    return '<div class="pairs"><div class="prow">' + top + '</div><div class="plinks">' +
      U.range(1, Math.min(a, b)).map(function () { return '<i></i>'; }).join('') + '</div><div class="prow">' + bot + '</div></div>';
  }
  function shareBoxes(k, r, e, left) {
    var boxes = '';
    for (var i = 0; i < k; i++) {
      boxes += '<div class="kidbox"><span class="kid">' + ['🧒', '👧', '👦', '🧒', '👧'][i % 5] + '</span><div class="kidgot">' +
        U.range(1, r).map(function () { return e; }).join('') + '</div></div>';
    }
    return (left > 0 ? '<div class="pile">' + V.objs(e, left, { layout: 'line', size: 'sm' }) + '</div>' : '<div class="pile empty"></div>') +
      '<div class="kidsrow">' + boxes + '</div>';
  }
  function line(lo, hi, o) {
    o = o || {};
    if (hi - lo < 8) hi = lo + 8;
    return V.numberLine({ min: lo, max: hi, label: 'all', hops: o.hops, mark: o.mark, start: o.at });
  }
  function windowFor(a, b) {
    var lo = Math.max(0, Math.min(a, b) - 1), hi = Math.max(a, b) + 1;
    if (hi - lo < 10) hi = lo + 10;
    return [lo, hi];
  }

  /* ---------- lesboustene ---------- */
  function countLesson(e, n, intro) {
    var f = [F(counted(e, n, 0), intro || 'Kom ons tel saam. Ons raak aan elkeen net een keer.')];
    for (var i = 1; i <= n; i++) f.push(F(counted(e, n, i), N(i), FAST));
    f.push(F(counted(e, n, n), 'Die laaste getal wat ons sê, is hoeveel daar is. Daar is ' + n + '.'));
    return f;
  }

  function hopLesson(a, b, back, intro, finale) {
    var end = back ? a - b : a + b, w = windowFor(a, end), hops = [], f = [];
    f.push(F(line(w[0], w[1], { mark: [a], at: a }), intro || (back ? 'Kom ons tel terug op die getallelyn.' : 'Kom ons tel aan op die getallelyn.')));
    f.push(F(line(w[0], w[1], { mark: [a], at: a }), 'Ons begin by ' + a + '.'));
    for (var i = 1; i <= b; i++) {
      var pos = back ? a - i : a + i;
      hops.push(back ? [pos + 1, pos] : [pos - 1, pos]);
      f.push(F(line(w[0], w[1], { hops: hops.slice(), mark: [a], at: pos }), N(pos), FAST));
    }
    f.push(F(line(w[0], w[1], { hops: hops, mark: [a, end], at: end }), finale || (a + (back ? ' minus ' : ' plus ') + b + ' is ' + end + '.')));
    return f;
  }

  function bigJumpLesson(a, b, back, unit, intro) {
    var end = back ? a - b : a + b, lo = 0, hi = Math.max(20, a + 1, end + 1);
    var u = function (n) { return unit === 'R' ? 'R' + n : String(n); };
    return [
      F(line(lo, hi, { mark: [a], at: a }), intro || 'Kom ons kyk op die getallelyn.'),
      F(line(lo, hi, { mark: [a], at: a }), 'Ons begin by ' + u(a) + '.'),
      F(line(lo, hi, { hops: [[a, end]], mark: [a, end], at: end }), (back ? 'Ons spring ' + b + ' terug.' : 'Ons spring ' + b + ' vorentoe.')),
      F(line(lo, hi, { hops: [[a, end]], mark: [a, end], at: end }), u(a) + (back ? ' minus ' : ' plus ') + u(b) + ' is ' + u(end) + '.')
    ];
  }

  function beadsTakeAway(a, b, intro) {
    var d = a - b, f = [F(V.beads(a), intro || 'Ons het ' + a + '. Ons vat ' + b + ' weg.')];
    for (var i = 1; i <= b; i++) f.push(F(V.beads(a, { crossed: i }), N(a - i), FAST));
    f.push(F(V.beads(a, { crossed: b }), 'Daar bly ' + d + ' oor. ' + a + ' minus ' + b + ' is ' + d + '.'));
    return f;
  }

  function bondLesson(n, k, intro) {
    var ans = n - k, f = [];
    function pic(i) {
      if (n <= 10) {
        var c = [];
        for (var j = 0; j < n; j++) c.push(j < k ? V.C.green : j < k + i ? V.C.orange : '#fff');
        return V.beads(n, { colours: c });
      }
      return V.tenFrames(k + i, { split: k });
    }
    f.push(F(pic(0), intro || 'Ons het ' + k + '. Ons wil ' + n + ' maak.'));
    f.push(F(pic(0), 'Ons sit een vir een by en tel hoeveel ons bysit.'));
    for (var i = 1; i <= ans; i++) f.push(F(pic(i), N(i), FAST));
    f.push(F(pic(ans), k + ' en ' + ans + ' maak ' + n + '.'));
    return f;
  }

  function bridgeAdd(x, y, need, intro) {
    var s = x + y, rest = y - need;
    return [
      F(V.tenFrames(x), intro || 'Kom ons maak eers 10.'),
      F(V.tenFrames(x), 'Ons het ' + x + '. Ons het nog ' + need + ' nodig om 10 te maak.'),
      F(V.tenFrames(10, { split: x }), x + ' plus ' + need + ' is 10.'),
      F(V.tenFrames(10, { split: x }), y + ' is ' + need + ' en ' + rest + '.'),
      F(V.tenFrames(s, { split: x }), 'Nou sit ons die ander ' + rest + ' by. 10 plus ' + rest + ' is ' + s + '.'),
      F(V.tenFrames(s, { split: x }), x + ' plus ' + y + ' is ' + s + '.')
    ];
  }
  function bridgeSub(a, b, u, intro) {
    var d = a - b, more = b - u;
    return [
      F(V.tenFrames(a), intro || 'Ons het ' + a + '. Ons vat ' + b + ' weg.'),
      F(V.tenFrames(10), 'Eers vat ons ' + u + ' weg. ' + a + ' minus ' + u + ' is 10.'),
      F(V.tenFrames(10), b + ' is ' + u + ' en ' + more + '. Ons moet nog ' + more + ' wegvat.'),
      F(V.tenFrames(d), '10 minus ' + more + ' is ' + d + '.'),
      F(V.tenFrames(d), a + ' minus ' + b + ' is ' + d + '.')
    ];
  }

  function doubleLesson(n, intro, tail) {
    var pic1 = n <= 12 ? V.butterfly(n, { mirror: false }) : V.objs('🔴', n, { layout: 'rows', size: 'sm' });
    var pic2 = n <= 12 ? V.butterfly(n) : V.twoBoxes(V.objs('🔴', n, { layout: 'rows', size: 'sm' }), V.objs('🔴', n, { layout: 'rows', size: 'sm' }));
    var f = [
      F(pic1, intro || 'Dubbel beteken twee keer dieselfde getal.'),
      F(pic1, n <= 12 ? 'Die een vlerk het ' + n + ' kolle.' : 'Hier is ' + n + '.'),
      F(pic2, n <= 12 ? 'Die ander vlerk het ook ' + n + '.' : 'En nog ' + n + '.'),
      F(pic2, n + ' plus ' + n + ' is ' + (2 * n) + '. Dubbel ' + n + ' is ' + (2 * n) + '.')
    ];
    if (tail) f.push(F(pic2, tail));
    return f;
  }

  function halfLesson(m, e, intro) {
    var n = m / 2, f = [];
    function pic(r) { return '<div class="halfdeal">' + shareBoxes(2, r, e, m - 2 * r) + '</div>'; }
    f.push(F(pic(0), intro || 'Ons deel in twee gelyke groepe: een vir hierdie kant, een vir daardie kant.'));
    for (var r = 1; r <= n; r++) f.push(F(pic(r), N(r), FAST));
    f.push(F(pic(n), 'Elke groep het ' + n + '. Die helfte van ' + m + ' is ' + n + '.'));
    return f;
  }

  function groupLesson(g, s, e, intro) {
    var f = [F(V.groups(e, 1, s), intro || 'Kom ons tel in ' + (STEPW[s] || s) + '.')];
    for (var k = 1; k <= g; k++) f.push(F(V.groups(e, k, s), N(k * s), 800));
    f.push(F(V.groups(e, g, s), g + (g === 1 ? ' groep' : ' groepe') + ' van ' + s + ' is ' + (g * s) + '.'));
    return f;
  }
  function makeGroupsLesson(total, s, e, intro) {
    var g = Math.floor(total / s), r = total - g * s, f = [];
    f.push(F(V.objs(e, total, { layout: 'scatter', size: total > 12 ? 'sm' : 'md' }), intro || 'Kom ons maak groepe van ' + s + '.'));
    for (var k = 1; k <= g; k++) f.push(F(V.groups(e, k, s, { loose: total - k * s }), N(k), 800));
    f.push(F(V.groups(e, g, s, { loose: r }), total + ' is ' + g + (g === 1 ? ' groep' : ' groepe') + ' van ' + s + (r ? ', en ' + r + ' bly oor.' : '.')));
    return f;
  }
  function repeatLesson(g, s, e, intro) {
    var f = [F(V.objs(e, 1, { layout: 'line', size: 'lg' }), intro || 'Elkeen het ' + s + '. Kom ons tel in ' + (STEPW[s] || s) + '.')];
    for (var k = 1; k <= g; k++) {
      f.push(F(V.objs(e, k, { layout: 'line', size: 'lg' }) + '<div class="steps">' + U.range(1, k).map(function () { return s; }).join(' + ') + ' = ' + (k * s) + '</div>', N(k * s), 800));
    }
    f.push(F(V.objs(e, g, { layout: 'line', size: 'lg' }), U.range(1, g).map(function () { return s; }).join(' plus ') + ' is ' + (g * s) + '.'));
    return f;
  }

  function shareLesson(k, total, e, intro) {
    var each = Math.floor(total / k), rem = total - each * k, f = [];
    f.push(F(shareBoxes(k, 0, e, total), intro || 'Kom ons deel een vir een uit: een vir elke kind.'));
    for (var r = 1; r <= each; r++) f.push(F(shareBoxes(k, r, e, total - r * k), N(r), 800));
    f.push(F(shareBoxes(k, each, e, rem), 'Elke kind kry ' + each + '.' + (rem ? ' En ' + rem + ' bly oor.' : ' Niks bly oor nie.')));
    return f;
  }

  function skipLesson(step, from, to, intro) {
    var span = Math.max(to - from, step * 3), lo = from, hi = from + span;
    var f = [], hops = [];
    function pic(at) { return V.numberLine({ min: lo, max: hi, tick: step, label: 'all', hops: hops.slice(), mark: [from], start: at }); }
    f.push(F(pic(from), intro || 'Kom ons kyk hoe groot elke sprong is.'));
    f.push(F(pic(from), 'Ons spring elke keer ' + step + '. Ons begin by ' + from + '.'));
    for (var v = from + step; v <= to; v += step) { hops.push([v - step, v]); f.push(F(pic(v), N(v), 750)); }
    f.push(F(pic(to), 'Ons tel in ' + (STEPW[step] || step) + '. Die antwoord is ' + to + '.'));
    return f;
  }
  function walkLesson(seq, idx, intro) {
    var lo = Math.min.apply(null, seq), hi = Math.max.apply(null, seq), f = [];
    var back = seq[0] > seq[seq.length - 1];
    f.push(F(line(lo, hi, { at: seq[0] }), intro || 'Kom ons loop saam met die padda op die getallelyn.'));
    for (var i = 0; i <= idx; i++) f.push(F(line(lo, hi, { at: seq[i], mark: [seq[i]] }), N(seq[i]), 700));
    f.push(F(line(lo, hi, { at: seq[idx], mark: [seq[idx]] }), 'Die ontbrekende getal is ' + seq[idx] + '.' + (back ? ' Ons het teruggetel.' : '')));
    return f;
  }

  function moreLessLesson(n, by, more, intro) {
    var ans = more ? n + by : n - by, word = (by === 1 ? 'Een' : 'Twee') + (more ? ' meer' : ' minder');
    var f = hopLesson(n, by, !more, intro || (more ? 'Meer beteken die getal word groter. Ons spring vorentoe.' : 'Minder beteken die getal word kleiner. Ons spring terug.'),
      word + ' as ' + n + ' is ' + ans + '.');
    return f;
  }

  function compareLesson(a, b, e, intro) {
    var res = b > a ? (b - a) + ' meer' : b < a ? (a - b) + ' minder' : 'net soveel';
    return [
      F(V.twoBoxes(V.objs(e, a, { layout: 'rows', size: 'md' }), V.objs(e, b, { layout: 'rows', size: 'md' }), 'Eerste', 'Tweede'), intro || 'Kom ons vergelyk die twee groepe.'),
      F(pairRows(e, a, b), 'Ons sit hulle in pare: een van bo saam met een van onder.'),
      F(pairRows(e, a, b), a === b ? 'Almal het ’n maat. Die groepe het net soveel.' : 'Kyk na die een sonder ’n maat. Die tweede groep het ' + res + '.')
    ];
  }

  function compareNumbersLesson(nums, big, intro) {
    var lo = 0, hi = Math.max.apply(null, nums) + 1, ans = big ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
    return [
      F(line(lo, hi, { mark: nums }), intro || 'Kom ons kyk waar die getalle op die getallelyn lê.'),
      F(line(lo, hi, { mark: nums }), 'Hoe verder ons tel, hoe groter word die getalle.'),
      F(line(lo, hi, { mark: [ans], at: ans }), 'Die ' + (big ? 'grootste' : 'kleinste') + ' getal is ' + ans + '.')
    ];
  }

  function tensLesson(n, intro, finale) {
    var u = n - 10;
    return [
      F(V.tenFrames(10), intro || 'Hier is een vol tienraam. Dit is 10.'),
      F(V.tenFrames(n), 'En hier is nog ' + u + '.'),
      F(V.tenFrames(n), '10 en ' + u + ' maak ' + n + '. Die 1 in ' + n + ' staan vir een tien.'),
      F(V.tenFrames(n), finale || ('Die antwoord is ' + n + '.'))
    ];
  }

  function moneyLesson(coins, intro) {
    var f = [F(V.money(coins), intro || 'Ons begin by die grootste munt en tel die waardes aan.')], t = 0;
    var sorted = coins.slice().sort(function (a, b) { return b - a; });
    sorted.forEach(function (c, i) {
      t += c;
      f.push(F(V.money(sorted.slice(0, i + 1)), V.moneyLabel(t), 900));
    });
    f.push(F(V.money(sorted), 'Altesaam is dit ' + V.moneyLabel(t) + '.'));
    return f;
  }

  function storyLesson(d, intro) {
    var e = d.e, f = [];
    if (d.kind === 'add') {
      f.push(F(V.objs(e, d.a, { layout: 'rows', size: 'md' }), intro || 'Kom ons teken die storie.'));
      f.push(F(V.objs(e, d.a, { layout: 'rows', size: 'md' }), 'Eers is daar ' + d.a + '.'));
      f.push(F('<div class="sum">' + V.objs(e, d.a, { layout: 'rows', size: 'md' }) + '<b>+</b>' + V.objs(e, d.b, { layout: 'rows', size: 'md' }) + '</div>', 'Dan kom daar ' + d.b + ' by. Dit word meer, so ons tel op.'));
      f.push(F('<div class="sum">' + V.objs(e, d.a, { layout: 'rows', size: 'md' }) + '<b>+</b>' + V.objs(e, d.b, { layout: 'rows', size: 'md' }) + '</div>', d.a + ' plus ' + d.b + ' is ' + d.ans + '.'));
    } else if (d.kind === 'sub') {
      f.push(F(V.objs(e, d.a, { layout: 'rows', size: 'md' }), intro || 'Kom ons teken die storie.'));
      f.push(F(V.objs(e, d.a, { layout: 'rows', size: 'md' }), 'Eers is daar ' + d.a + '.'));
      f.push(F(V.objs(e, d.a, { layout: 'rows', size: 'md', crossFrom: d.a - d.b }), 'Dan gaan daar ' + d.b + ' weg. Dit word minder, so ons trek af.'));
      f.push(F(V.objs(e, d.a, { layout: 'rows', size: 'md', crossFrom: d.a - d.b }), d.a + ' minus ' + d.b + ' is ' + d.ans + '.'));
    } else if (d.kind === 'compare') {
      f.push(F(pairRows(e, d.a, d.b), intro || 'Kom ons sit hulle in pare.'));
      f.push(F(pairRows(e, d.a, d.b), 'Die een sonder ’n maat is ekstra.'));
      f.push(F(pairRows(e, d.a, d.b), d.a + ' minus ' + d.b + ' is ' + d.ans + '. Daar is ' + d.ans + ' meer.'));
    } else {
      f = hopLesson(d.s, d.b, true, intro || 'Ons weet hoeveel daar aan die einde was. Kom ons tel terug.',
        d.s + ' minus ' + d.b + ' is ' + d.ans + '. Eers was daar ' + d.ans + '.');
    }
    return f;
  }

  /* ---------- per vraagtipe ---------- */
  var L = {
    count: function (q, i) { return countLesson(q.data.e, q.data.n, i); },
    countInScene: function (q, i) { return countLesson(q.data.e, q.data.n, i || 'Kom ons tel net hierdie een, een vir een.'); },
    matchGroup: function (q, i) { return countLesson(q.data.e, q.data.n, i); },
    frame: function (q, i) {
      var n = q.data.n;
      return n > 10 ? tensLesson(n, i) : countLesson('🔴', n, i || 'Een ry in die raam is 5. Kom ons tel.');
    },
    add: function (q, i) {
      var d = q.data, big = Math.max(d.a, d.b), small = Math.min(d.a, d.b);
      return hopLesson(big, small, false, i || (d.a < d.b ? 'Ons begin by die groter getal, ' + big + ', en tel aan.' : null), d.a + ' plus ' + d.b + ' is ' + d.s + '.');
    },
    add3: function (q, i) {
      var d = q.data;
      return hopLesson(d.a + d.b, d.c, false, i || ('Eers ' + d.a + ' plus ' + d.b + ' is ' + (d.a + d.b) + '. Nou tel ons nog ' + d.c + ' aan.'));
    },
    sub: function (q, i) {
      var d = q.data;
      return d.a <= 10 ? beadsTakeAway(d.a, d.b, i) : hopLesson(d.a, d.b, true, i);
    },
    countOn: function (q, i) { var d = q.data; return hopLesson(d.a, d.b, d.back, i); },
    bond: function (q, i) { return bondLesson(q.data.n, q.data.k, i); },
    pairs: function (q, i) {
      var parts = String(q.input.answer).split(' en ').map(Number);
      return bondLesson(q.data.n, parts[0], i || 'Kom ons kyk watter twee getalle saam ' + q.data.n + ' maak.');
    },
    bridge10: function (q, i) {
      var d = q.data;
      return d.op === 'add' ? bridgeAdd(d.x, d.y, d.need, i) : bridgeSub(d.a, d.b, d.u, i);
    },
    double: function (q, i) { return doubleLesson(q.data.n, i); },
    nearDouble: function (q, i) {
      var d = q.data;
      return doubleLesson(d.n, i, 'Nou nog ' + (d.plus ? 'een by' : 'een af') + ': ' + (2 * d.n) + (d.plus ? ' plus 1 is ' : ' minus 1 is ') + d.ans + '.');
    },
    half: function (q, i) { return halfLesson(q.data.m, q.data.e, i); },
    groups: function (q, i) {
      var d = q.data;
      if (d.v === 0) return groupLesson(d.g, d.s, d.e, i);
      return makeGroupsLesson(d.v === 1 ? d.g * d.s : d.g * d.s + d.r, d.s, d.e, i);
    },
    repeatedAdd: function (q, i) { var d = q.data; return repeatLesson(d.g, d.s, d.e, i); },
    share: function (q, i) { var d = q.data; return shareLesson(d.k, d.total, d.e, i); },
    missing: function (q, i) {
      var d = q.data;
      if (d.step > 1 && !d.back) return skipLesson(d.step, d.seq[0], d.ans, i);
      return walkLesson(d.seq, d.idx, i);
    },
    gridPattern: function (q, i) { var d = q.data; return skipLesson(d.step, Math.max(0, d.prev - 2 * d.step), d.ans, i); },
    hops: function (q, i) { var d = q.data; return skipLesson(d.step, 0, d.ans, i); },
    moreLess: function (q, i) { var d = q.data; return moreLessLesson(d.n, d.by, d.more, i); },
    compareGroups: function (q, i) { var d = q.data; return compareLesson(d.a, d.b, d.e, i); },
    compareNumbers: function (q, i) { var d = q.data; return compareNumbersLesson(d.nums, d.big, i); },
    tenAndMore: function (q, i) {
      var d = q.data;
      return tensLesson(d.n, i, d.v === 2 ? 'Daar is ' + d.n + ' kolletjies.' : '10 en ' + (d.n - 10) + ' maak ' + d.n + '. Die antwoord is ' + (d.n - 10) + '.');
    },
    placeValue: function (q, i) {
      var d = q.data;
      return tensLesson(d.n, i, 'Die antwoord is ' + d.ans + '.');
    },
    moneyTotal: function (q, i) { return moneyLesson(q.data.coins, i); },
    moneySum: function (q, i) { var d = q.data; return bigJumpLesson(d.a, d.b, d.sub, 'R', i); },
    moneyChange: function (q, i) {
      var d = q.data;
      return bigJumpLesson(d.have, d.cost, true, 'R', i || 'As ons iets koop, betaal ons geld uit. Dan het ons minder.');
    },
    wordProblem: function (q, i) { return storyLesson(q.data, i); }
  };

  /* Die getalle van 'n optel- of aftreksom uit enige vraagtipe (vir lesse wat by die fout pas). */
  function addends(gen, d) {
    switch (gen) {
      case 'add': case 'moneySum': return !d.sub ? [d.a, d.b] : null;
      case 'add3': return [d.a + d.b, d.c];
      case 'bridge10': return d.op === 'add' ? [d.x, d.y] : null;
      case 'countOn': return d.back ? null : [d.a, d.b];
      case 'wordProblem': return d.kind === 'add' ? [d.a, d.b] : null;
    }
    return null;
  }
  function takeAway(gen, d) {
    switch (gen) {
      case 'sub': return [d.a, d.b];
      case 'moneySum': return d.sub ? [d.a, d.b] : null;
      case 'moneyChange': return [d.have, d.cost];
      case 'bridge10': return d.op === 'sub' ? [d.a, d.b] : null;
      case 'countOn': return d.back ? [d.a, d.b] : null;
      case 'wordProblem': return d.kind === 'sub' ? [d.a, d.b] : null;
    }
    return null;
  }
  /* Kies die les volgens die gebreekte vaardigheid: 'n tel-aan-fout kry die getallelyn, ook by 'n tienraam-som. */
  L.forMistake = function (misId, gen, q, intro) {
    var d = q.data || {}, nums;
    if (misId === 'telaan-begin' && (nums = addends(gen, d))) {
      var big = Math.max(nums[0], nums[1]), small = Math.min(nums[0], nums[1]);
      if (small <= 12) return hopLesson(big, small, false, intro, nums[0] + ' plus ' + nums[1] + ' is ' + (nums[0] + nums[1]) + '.');
    }
    if (misId === 'telterug-begin' && (nums = takeAway(gen, d)) && nums[1] <= 12) {
      return hopLesson(nums[0], nums[1], true, intro);
    }
    return L[gen](q, intro);
  };
  return L;
})();
