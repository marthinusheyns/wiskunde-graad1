/* Die kurrikulum: elke werkblad in Wiskunde in Afrikaans Graad 1, Boek 1 (Kwartaal 1 & 2)
   en Boek 2 (Kwartaal 3 & 4), met die vraagtipes wat daardie werkblad oefen.
   ex = [[generatornaam, parameters], ...] */
var W = window.W || (window.W = {});

W.CURRICULUM = (function () {
  function numberSheet(n) {
    return [
      ['count', { min: Math.max(1, n - 2), max: n + 1 }],
      ['colourN', { min: n, max: n }],
      ['trace', { nums: [n] }],
      ['numWord', { min: n, max: n }],
      ['matchGroup', { min: n, max: n }]
    ];
  }
  function teenSheet(n) {
    return [
      ['tenAndMore', { min: n, max: n }],
      ['count', { min: n - 1, max: n + 1, layout: 'rows' }],
      ['numWord', { min: n, max: n }],
      ['moreLess', { min: n - 2, max: n + 2, by: n >= 16 ? [1, 2] : [1] }],
      ['trace', { nums: [n] }],
      ['bond', { total: [n] }]
    ];
  }
  var ANIMALS = ['kat', 'hond', 'eend', 'slak', 'vis', 'voel', 'skoenlapper', 'padda', 'hoender'];

  var list = [
    // ---------------- KWARTAAL 1 ----------------
    ['1', 'Hersiening: Opsporing en pas', [['sameAs', { emoji: true }], ['sameAs', {}], ['gridMove', {}]]],
    ['2', 'Hersiening: Sorteer kleure en trek patrone na', [['colourName', {}], ['colourMatch', {}], ['pattern', { kinds: ['colour'], units: [2] }]]],
    ['3', 'Hersiening: Kleure en patrone', [['colourMatch', {}], ['pattern', { kinds: ['colour', 'emoji'], units: [2, 3] }], ['colourName', {}]]],
    ['4', 'Hersiening: Sorteer en pas vorms', [['findShape', { set: ['sirkel', 'vierkant', 'driehoek', 'ruit'] }], ['shapeName', { set: ['sirkel', 'vierkant', 'driehoek', 'ruit'] }], ['sameAs', {}]]],
    ['5', 'Hersiening: Soek en tel', [['countInScene', { max: 5, things: ANIMALS }], ['count', { min: 1, max: 5, mode: 'choice' }]]],
    ['6', 'Hersiening: Posisies', [['positionMatch', {}]]],
    ['7', 'Hersiening: Tyd', [['timeLonger', {}]]],
    ['8', 'Hersiening: Vorms, groottes en kleure', [['sizeCompare', {}], ['colourName', {}], ['findShape', {}]]],
    ['9', 'Een', numberSheet(1)],
    ['10', 'Twee', numberSheet(2)],
    ['11', 'Drie', numberSheet(3)],
    ['12a', 'Lengte en posisie', [['lengthCompare', {}], ['positionWords', {}]]],
    ['12b', 'Lengte', [['lengthCompare', {}], ['sizeCompare', {}]]],
    ['13', 'Vergelyk getal 1-3', [['compareGroups', { max: 3 }], ['compareNumbers', { min: 1, max: 3, n: 2 }], ['moreLess', { min: 1, max: 4, by: [1] }]]],
    ['14', 'Vier', numberSheet(4)],
    ['15', 'Tel by en trek af tot by 4', [['add', { max: 4, visual: 'objs', words: true }], ['sub', { max: 4, visual: 'beads', words: true }], ['bond', { total: [4] }]]],
    ['16', 'Tyd', [['sequence', {}], ['timeLonger', {}]]],
    ['17', 'Vyf', numberSheet(5)],
    ['18', 'Hersien getalle 1 tot 5', [['count', { min: 1, max: 5 }], ['numWord', { min: 1, max: 5 }], ['trace', { nums: [1, 2, 3, 4, 5] }], ['order', { min: 1, max: 5, n: 3 }]]],
    ['19', 'Tel op tot by 5', [['add', { max: 5, visual: 'objs', words: true }], ['add', { max: 5, visual: 'beads', words: true }], ['wordProblem', { max: 5, ops: ['add'] }]]],
    ['20', 'Trek af van 5 en tel tot by 5', [['sub', { from: 5, max: 5, visual: 'beads', words: true }], ['countOn', { max: 5, back: true }], ['sub', { max: 5, visual: 'line' }]]],
    ['21', 'Tel op en trek af tot by 5', [['add', { max: 5, words: true }], ['sub', { max: 5, words: true }], ['wordProblem', { max: 5, ops: ['add', 'sub'] }]]],
    ['22', 'Optelling en aftrekking 1 tot 5', [['bond', { total: [5] }], ['sub', { from: 5, max: 5, visual: 'beads', words: true }], ['add', { max: 5, visual: 'line' }]]],
    ['23', 'Balle en blokkies', [['solid3D', { only: 0 }], ['sizeCompare', {}], ['solid3D', { only: 1 }]]],
    ['24a', 'Links en regs', [['leftRight', {}]]],
    ['24b', 'Rigting', [['arrowDir', {}], ['gridMove', {}]]],
    ['25', 'Die opbou en afbreek van getalle', [['bond', { min: 3, max: 6 }], ['add3', { max: 6 }], ['pairs', { min: 4, max: 6 }]]],
    ['26', 'Verdubbeling', [['double', { min: 1, max: 5 }]]],
    ['27', 'Groter en kleiner', [['sizeCompare', {}]]],
    ['28', 'Sorteer voorwerpe', [['oddOneOut', {}], ['colourCount', { max: 5 }]]],
    ['29', 'Kom ons verdeel gelykop', [['share', { k: [2], max: 10 }]]],
    ['30', 'Gelyke verdeling', [['share', { k: [2, 3], max: 10, rem: true }]]],
    ['31', 'Bou met voorwerpe', [['solid3D', { only: 2 }], ['solid3D', { only: 1 }]]],
    ['32', 'Lees hoe laat dit is (dae en maande)', [['daysMonths', {}]]],
    // ---------------- KWARTAAL 2 ----------------
    ['33', 'Ses', numberSheet(6)],
    ['34', 'Sewe', numberSheet(7)],
    ['35', 'Agt', numberSheet(8)],
    ['36', 'Nege', numberSheet(9)],
    ['37', 'Vol en leeg', [['fullEmpty', {}], ['capacity', {}]]],
    ['38', 'Tien', numberSheet(10)],
    ['39', 'Nommer van 1 tot 10', [['frame', { min: 1, max: 10 }], ['count', { min: 1, max: 10 }], ['trace', { nums: [6, 7, 8, 9, 10] }]]],
    ['40', 'Inhoudsmaat en volume', [['capacity', {}], ['holdsMost', {}]]],
    ['41', 'Getalle van 1 tot 10', [['order', { min: 1, max: 10, n: 4 }], ['moreLess', { min: 1, max: 10, by: [1, 2] }], ['missing', { min: 1, max: 10 }], ['compareNumbers', { min: 1, max: 10 }]]],
    ['42', 'Meer, net soveel en minder', [['compareGroups', { max: 10 }], ['compareNumbers', { min: 1, max: 10 }]]],
    ['43', 'Tel die lekkers op', [['add', { max: 10, visual: 'objs' }], ['add', { max: 10 }]]],
    ['44', 'Versamel en organiseer', [['colourCount', { max: 6 }], ['oddOneOut', {}], ['pictograph', { max: 5 }]]],
    ['45', 'Optelling tot by 10: tel aan', [['countOn', { max: 10 }], ['wordProblem', { max: 10, ops: ['add'] }], ['add', { max: 10, visual: 'line', bigFirst: true }]]],
    ['46', 'Optelling: bou en breek af tot by 10', [['bond', { min: 6, max: 10 }], ['pairs', { total: [10] }], ['bond', { total: [10] }]]],
    ['47', 'Verdubbeling en halvering', [['double', { max: 5 }], ['half', { max: 5 }]]],
    ['48a', 'Vorms', [['shapeName', {}], ['findShape', {}]]],
    ['48b', 'Nog 2-D vorms', [['shapeCount', { max: 5 }]]],
    ['49', 'Groepe van twee tot 10', [['groups', { size: 2, max: 10 }]]],
    ['50', 'Herhaalde optelling van twees tot by 10', [['repeatedAdd', { size: 2, max: 10 }], ['groups', { size: 2, max: 10 }]]],
    ['51', 'Patrone: 2 tot 20', [['missing', { steps: [2], min: 0, max: 20 }], ['hops', { steps: [2], max: 20 }]]],
    ['52', 'Groepe van drie tot by 10', [['groups', { size: 3, max: 10 }]]],
    ['53', 'Herhaalde optelling van drieë tot by 10', [['repeatedAdd', { size: 3, max: 10 }], ['groups', { size: 3, max: 10 }]]],
    ['54', 'Groepe van vier tot by 10', [['groups', { size: 4, max: 10 }]]],
    ['55', 'Herhaalde optelling van viere tot by 10', [['repeatedAdd', { size: 4, max: 12 }], ['groups', { size: 4, max: 10 }]]],
    ['56', 'Groepe van vyf tot by 10', [['groups', { size: 5, max: 10 }]]],
    ['57', 'Herhaalde optelling van vywe tot by 10', [['repeatedAdd', { size: 5, max: 10 }], ['groups', { size: 5, max: 10 }]]],
    ['58', 'Patrone: 5 tot 20', [['missing', { steps: [5], min: 0, max: 20, len: 5 }], ['hops', { steps: [5], max: 20 }]]],
    ['59', 'Patrone: Tiene', [['missing', { steps: [10], min: 0, max: 100, len: 5 }], ['gridPattern', { steps: [10], max: 100 }]]],
    ['60a', 'Geld', [['moneyName', { set: [100, 200, 500, 1000, 2000, 5000, 10000] }], ['moneyFind', { set: [100, 200, 500, 1000, 2000, 5000, 10000] }]]],
    ['60b', 'Geld (vervolg)', [['moneyFind', { set: [5, 10, 20, 50, 1000, 2000] }], ['moneyMore', {}], ['moneyMake', { targets: [20, 2000] }]]],
    ['61', 'Geld en kleingeld', [['moneyTotal', { max: 10 }], ['moneyBuy', { max: 10 }]]],
    ['62', 'Nog geld en kleingeld', [['moneyTotal', { cents: true, max: 50 }], ['moneySum', { max: 10, op: 'sub' }]]],
    ['63', 'Vorm, oriëntasie en posisie', [['sameAs', {}], ['rowPosition', {}]]],
    ['64a', 'Patrone met meetkundige vorms', [['pattern', { kinds: ['shape', 'shapecolour'], units: [2, 3] }]]],
    ['64b', '2D-vorms en 3D-voorwerpe', [['solid3D', { only: 3 }], ['shapeName', {}], ['solid3D', { only: 0 }]]],
    // ---------------- KWARTAAL 3 ----------------
    ['65', 'Verstaan die getal 11', teenSheet(11)],
    ['66', 'Verstaan die getal 12', teenSheet(12)],
    ['67', 'Verstaan die getal 13', teenSheet(13)],
    ['68', 'Verstaan die getal 14', teenSheet(14)],
    ['69', 'Verstaan die getal 15', teenSheet(15)],
    ['70', 'Optelling tot by 20 – ons tel verder', [['countOn', { max: 20 }], ['wordProblem', { max: 20, ops: ['add', 'sub'] }], ['add', { max: 20, visual: 'line', bigFirst: true }]]],
    ['71', 'Optelling – getalle tot by 10 opbou en afbreek', [['bond', { min: 5, max: 10 }], ['pairs', { min: 6, max: 10 }], ['add', { max: 10 }]]],
    ['72', 'Optelling – opbou en afbreek van getalle tot by 20', [['bridge10', { op: 'add' }], ['bond', { min: 11, max: 20 }], ['pairs', { min: 11, max: 20 }]]],
    ['73', 'Optelling en aftrekking – opbou en afbreek', [['bridge10', { op: 'both' }], ['sub', { min: 11, max: 20 }]]],
    ['74', 'Lengte', [['lengthCompare', {}], ['measure', { max: 8 }]]],
    ['75', 'Geld en kleingeld', [['moneyMake', { targets: [1000, 2000] }], ['moneyMore', {}], ['moneyTotal', { max: 20, denoms: [100, 200, 500, 1000] }]]],
    ['76', 'Geld en kleingeld (2)', [['moneySum', { max: 20, op: 'add' }], ['moneyChange', { have: [15] }], ['moneyTotal', { max: 15 }]]],
    ['77', 'Geld: Optelling en aftrekking', [['moneySum', { max: 20, op: 'both' }], ['moneyChange', { have: [10, 15, 20] }]]],
    ['78', 'Data', [['pictograph', { max: 6 }], ['countInScene', { things: ['motor', 'bus', 'fiets'], max: 6 }]]],
    ['79', 'Data en tyd', [['sequence', {}], ['pictograph', { max: 6 }], ['daysMonths', {}]]],
    ['80', 'Groepe van 5 tot by 15', [['groups', { size: 5, max: 15 }]]],
    ['81', 'Vywe: herhaalde optelling tot by 15', [['repeatedAdd', { size: 5, max: 15 }], ['groups', { size: 5, max: 15 }]]],
    ['82', 'Vywe tot by 15', [['missing', { steps: [5], min: 0, max: 15, len: 4 }], ['groups', { size: 5, max: 15, rem: true }]]],
    ['83', 'Getalpatrone van vywe tot by 50', [['gridPattern', { steps: [5], max: 50 }], ['missing', { steps: [5], min: 0, max: 50 }], ['hops', { steps: [5], max: 50, maxHops: 6 }]]],
    ['84', 'Getalpatrone van vywe tot by 80', [['gridPattern', { steps: [5], max: 80 }], ['missing', { steps: [5], min: 0, max: 80 }]]],
    ['85', 'Verdubbel', [['double', { min: 1, max: 10 }], ['nearDouble', { min: 2, max: 9 }]]],
    ['86', 'Die helfte', [['half', { min: 1, max: 10 }]]],
    ['87', '3D-voorwerpe', [['sizeCompare', {}], ['solid3D', { only: 2 }], ['solid3D', { only: 0 }]]],
    ['88', '3D-voorwerpe – Gly en rol', [['solid3D', { only: 1 }], ['solid3D', { only: 0 }]]],
    ['89', 'Geometriese patrone', [['pattern', { kinds: ['shape', 'shapecolour', 'colour'], units: [2, 3] }], ['shapeName', {}]]],
    ['90', 'Groepe van twee tot by 15', [['groups', { size: 2, max: 15, rem: true }]]],
    ['91', 'Herhaalde optelling in tweë tot by 15', [['repeatedAdd', { size: 2, max: 14 }], ['groups', { size: 2, max: 14 }]]],
    ['92', 'Tweë tot by 15', [['missing', { steps: [2], min: 0, max: 16 }], ['share', { k: [2], max: 15 }]]],
    ['93', 'Getalpatrone 2 tot 50', [['gridPattern', { steps: [2], max: 50 }], ['missing', { steps: [2], min: 0, max: 50 }], ['hops', { steps: [2], max: 20 }]]],
    ['94', 'Simmetrie', [['symmetryHalf', {}], ['isSymmetric', {}]]],
    ['95', 'Getalle en plekwaarde', [['placeValue', { max: 19 }], ['tenAndMore', { min: 11, max: 19 }]]],
    ['96', 'Lengte (2)', [['measure', { max: 10 }], ['lengthCompare', {}]]],
    // ---------------- KWARTAAL 4 ----------------
    ['97', 'Getal 16', teenSheet(16)],
    ['98', 'Getal 17', teenSheet(17).concat([['oddEven', { min: 10, max: 20 }]])],
    ['99', 'Getal 18', teenSheet(18)],
    ['100', 'Getal 19', teenSheet(19).concat([['oddEven', { min: 10, max: 20 }]])],
    ['101', 'Getal 20', teenSheet(20).filter(function (e) { return e[0] !== 'moreLess'; }).concat([['moreLess', { min: 17, max: 21, by: [1] }]])],
    ['102', 'Optelling', [['add', { max: 20, bigFirst: true }], ['add3', { max: 15 }], ['compareNumbers', { min: 1, max: 20, n: 3 }]]],
    ['103', 'Aftrekking', [['sub', { max: 20 }], ['bridge10', { op: 'sub' }]]],
    ['104', 'Optelling en aftrekking', [['wordProblem', { max: 20, ops: ['add', 'sub', 'compare'] }], ['between', { min: 10, max: 99 }], ['moreLess', { min: 20, max: 99, by: [1, 2] }]]],
    ['105', 'Ordinaalgetalle', [['ordinal', {}]]],
    ['106', 'Voorwerpe en vorms', [['solid3D', { only: 1 }], ['shapeCount', { set: ['driehoek', 'sirkel', 'vierkant'], max: 6 }]]],
    ['107', 'Geld', [['moneyMake', { targets: [1000, 1500, 2000] }], ['moneySum', { max: 20, op: 'sub' }]]],
    ['108', 'Meer oor geld', [['moneyMore', {}], ['moneySum', { max: 20 }], ['moneyChange', { have: [10, 20] }]]],
    ['109', '2D-vorms', [['findShape', {}], ['shapeName', {}], ['colourCount', { max: 6 }]]],
    ['110', '2D-vorms – reguit en ronde sye', [['shapeSides', {}]]],
    ['111', 'Nog 2D-vorms', [['shapeName', { set: ['sirkel', 'vierkant', 'driehoek', 'reghoek', 'ovaal'] }], ['shapeCount', {}]]],
    ['112', 'Groepe van vyf tot by 20', [['groups', { size: 5, max: 20 }]]],
    ['113', 'Vywe – herhaalde optelling tot by 20', [['repeatedAdd', { size: 5, max: 20 }], ['groups', { size: 5, max: 20 }]]],
    ['114', 'Verdeling tot by 20', [['share', { k: [5], max: 20, rem: true }], ['share', { k: [2], max: 20 }]]],
    ['115', 'Getalpatrone – vywe tot by 100', [['gridPattern', { steps: [5], max: 100 }], ['missing', { steps: [5], min: 0, max: 100 }]]],
    ['116', 'Posisie en aansig', [['positionWords', {}], ['sameAs', {}], ['arrowDir', {}]]],
    ['117', 'Groepe van twee tot by 20', [['groups', { size: 2, max: 20 }]]],
    ['118', 'Tweë – herhaalde optelling tot by 20', [['repeatedAdd', { size: 2, max: 20 }], ['groups', { size: 2, max: 20 }]]],
    ['119', 'Getalpatrone – tweë tot by 100', [['gridPattern', { steps: [2], max: 100 }], ['missing', { steps: [2], min: 0, max: 100 }]]],
    ['120', 'Getalpatrone – tweë tot by 100 (2)', [['hops', { steps: [2], max: 20 }], ['missing', { steps: [2], min: 20, max: 100, back: true }], ['oddEven', { min: 2, max: 20 }]]],
    ['121', 'Massa (gewig)', [['mass', {}], ['mass', { blocks: true, max: 20 }]]],
    ['122', 'Verdubbeling', [['double', { min: 1, max: 12 }], ['nearDouble', {}]]],
    ['123', 'Halvering', [['half', { min: 1, max: 12 }]]],
    ['124', 'Data', [['shapeCount', { max: 6 }], ['colourCount', { max: 6 }]]],
    ['125', 'Meer data', [['pictograph', { max: 8, diff: true }]]],
    ['126', 'Kapasiteit', [['holdsMost', {}], ['fullEmpty', { half: true }], ['capacity', {}]]],
    ['127', 'Geometriese patrone', [['pattern', { kinds: ['shape', 'shapecolour', 'colour', 'emoji'], units: [2, 3, 4] }]]],
    ['128', 'Simmetrie', [['symmetryHalf', {}], ['isSymmetric', {}]]]
  ];

  var SPLIT = [12, 24, 48, 60, 64];
  return list.map(function (row, i) {
    var id = row[0], num = parseInt(id, 10), suffix = id.replace(/\d+/, '');
    var book = num <= 64 ? 1 : 2;
    var term = num <= 32 ? 1 : num <= 64 ? 2 : num <= 96 ? 3 : 4;
    var bl;
    if (book === 1) {
      var k = SPLIT.filter(function (m) { return m < num; }).length;
      bl = 2 * num + 2 * k + (suffix === 'b' ? 2 : 0);
    } else bl = 2 * (num - 64);
    return { id: id, num: num, idx: i, title: row[1], ex: row[2], book: book, term: term, bl: bl };
  });
})();

W.SKILLS = {
  tel: 'Tel', getalname: 'Getalname lees', skryf: 'Getalle skryf', vergelyk: 'Vergelyk getalle',
  volgorde: 'Getalvolgorde', patrone: 'Patrone en tel in sprongetjies', optel: 'Optel', aftrek: 'Aftrek',
  opbou: 'Opbou en afbreek', woordsomme: 'Woordsomme', verdubbel: 'Verdubbel en halveer',
  groepe: 'Groepe en herhaalde optelling', verdeel: 'Deel gelykop', geld: 'Geld', meet: 'Meet',
  tyd: 'Tyd', vorms: 'Vorms en voorwerpe', posisie: 'Posisie en rigting', data: 'Sorteer en data',
  simmetrie: 'Simmetrie'
};
