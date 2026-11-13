/* Tutor-data: die vaardigheidskaart (klein vaardighede + wat hulle vooraf nodig het),
   die katalogus van bekende foute, en die kritieke pad van elke vraagtipe.
   Hierdie lêer is die bron vir docs/SKILL-MAP.md (tools/skillmap-doc.js) wat 'n onderwyser nagaan. */
var W = window.W || (window.W = {});

W.SKILLMAP = {
  // --- Getalbegrip ---
  herken: { g: 'getal', name: 'Herken getalle (syfers)', pre: [] },
  tel: { g: 'getal', name: 'Tel een vir een', pre: [] },
  kyk: { g: 'getal', name: 'Sien hoeveel in ’n tienraam', pre: ['tel'] },
  naam: { g: 'getal', name: 'Lees getalname', pre: ['herken'] },
  ry: { g: 'getal', name: 'Getalvolgorde: voor, ná en tussen', pre: ['tel', 'herken'] },
  meerminder: { g: 'getal', name: 'Een of twee meer of minder', pre: ['ry', 'w-meer'] },
  vergelyk: { g: 'getal', name: 'Vergelyk hoeveelhede en getalle', pre: ['tel', 'w-meer'] },
  spring: { g: 'getal', name: 'Tel in sprongetjies (2, 5, 10)', pre: ['ry'] },
  tiene: { g: 'getal', name: 'Tiene en ene (11 tot 20)', pre: ['kyk', 'ry'] },
  // --- Bewerkings ---
  optel: { g: 'bewerk', name: 'Optel: sit bymekaar', pre: ['tel'] },
  telaan: { g: 'bewerk', name: 'Tel aan vanaf ’n getal', pre: ['optel', 'ry'] },
  aftrek: { g: 'bewerk', name: 'Aftrek: vat weg', pre: ['tel'] },
  telterug: { g: 'bewerk', name: 'Tel terug', pre: ['aftrek', 'ry'] },
  bind5: { g: 'bewerk', name: 'Getalbindings tot 5', pre: ['optel'] },
  bind10: { g: 'bewerk', name: 'Getalbindings tot 10', pre: ['bind5'] },
  brug10: { g: 'bewerk', name: 'Brug oor 10 (maak eers 10)', pre: ['bind10', 'tiene'] },
  dubbel: { g: 'bewerk', name: 'Verdubbel', pre: ['optel', 'w-dubbel'] },
  helfte: { g: 'bewerk', name: 'Halveer', pre: ['deel', 'w-dubbel'] },
  groepe: { g: 'bewerk', name: 'Groepe van ewe veel', pre: ['tel'] },
  herhaal: { g: 'bewerk', name: 'Tel in groepe (herhaalde optelling)', pre: ['groepe', 'spring'] },
  deel: { g: 'bewerk', name: 'Deel gelykop', pre: ['tel'] },
  woordsom: { g: 'bewerk', name: 'Woordsomme: kies plus of minus', pre: ['telaan', 'telterug', 'w-altesaam'] },
  // --- Geld ---
  geldwaarde: { g: 'geld', name: 'Ken munte en note se waarde', pre: ['herken'] },
  geldtel: { g: 'geld', name: 'Tel geld bymekaar', pre: ['geldwaarde', 'telaan'] },
  kleingeld: { g: 'geld', name: 'Werk kleingeld uit', pre: ['geldwaarde', 'telterug'] },
  // --- Woorde (taal) ---
  'w-meer': { g: 'woord', name: 'Woorde: meer, minder, net soveel', pre: [] },
  'w-groot': { g: 'woord', name: 'Woorde: grootste, kleinste, groter, kleiner', pre: [] },
  'w-dubbel': { g: 'woord', name: 'Woorde: dubbel en helfte', pre: [] },
  'w-altesaam': { g: 'woord', name: 'Woorde: altesaam, oor, elkeen', pre: [] }
};

W.SKILLGROUPS = { getal: 'Getalbegrip', bewerk: 'Bewerkings', geld: 'Geld', woord: 'Woorde (taal)' };

/* Bekende foute. node: watter vaardigheid dit aandui (lys = eerste een wat op die vraag se pad is).
   child: kort wenk vir die kind ná die eerste fout (hoogstens 8 woorde; die vraag se eie wenk volg daarna). tutor: Juffrou Padda se eerste sin in die les.
   parent: verduideliking vir ouers. home: iets om tuis te doen. */
W.MIS = {
  'tel-glip': {
    node: ['tel'],
    child: 'Tel elkeen net een keer.',
    tutor: 'Kom ons tel saam, een vir een.',
    parent: 'Tel een te veel of een te min: slaan een oor, of tel een twee keer.',
    home: 'Laat jou kind knope of lekkers tel en elkeen eenkant skuif sodra dit getel is.'
  },
  'telaan-begin': {
    node: ['telaan', 'geldtel'],
    child: 'Moenie die eerste getal weer tel nie.',
    tutor: 'Ek dink jy het die eerste getal twee keer getel. Kyk hoe spring die padda.',
    parent: 'Tel die begingetal saam wanneer daar aangetel word: by 8 + 5 sê die kind 8, 9, 10, 11, 12.',
    home: 'Speel spring op die getallelyn: begin op ’n getal en sê net die getalle waarop jy land.'
  },
  'plus-minus': {
    node: ['optel'],
    child: 'Kyk na die teken: plus maak meer.',
    tutor: 'Plus beteken ons sit bymekaar. Kom ons kyk.',
    parent: 'Trek af waar daar opgetel moet word: verwar die tekens plus en minus.',
    home: 'Sit regte voorwerpe bymekaar en vat weg, en sê elke keer die woord plus of minus.'
  },
  'minus-plus': {
    node: ['aftrek'],
    child: 'Kyk na die teken: minus maak minder.',
    tutor: 'Minus beteken ons vat weg. Kom ons kyk.',
    parent: 'Tel op waar daar afgetrek moet word: verwar die tekens minus en plus.',
    home: 'Sit regte voorwerpe bymekaar en vat weg, en sê elke keer die woord plus of minus.'
  },
  'net-een': {
    node: ['optel'],
    child: 'Tel albei getalle bymekaar.',
    tutor: 'Ons sit albei groepe bymekaar. Kom ons kyk.',
    parent: 'Gee een van die getalle as antwoord in plaas van die twee bymekaar.',
    home: 'Maak twee hopies speelgoed en vra: hoeveel is daar altesaam?'
  },
  'telterug-begin': {
    node: ['telterug', 'kleingeld'],
    child: 'Moenie die eerste getal saamtel nie.',
    tutor: 'Ek dink jy het die eerste getal saamgetel. Kom ons tel saam terug.',
    parent: 'Tel die begingetal saam wanneer daar teruggetel word: by 9 – 3 sê die kind 9, 8, 7.',
    home: 'Tel saam trappe af: begin bo en sê die getal van elke trap waarop jy trap.'
  },
  'meer-minder': {
    node: ['w-meer'],
    child: 'Meer is groter. Minder is kleiner.',
    tutor: 'Kom ons kyk na die woorde meer en minder op die getallelyn.',
    parent: 'Verwar die woorde meer en minder. Dit is dikwels ’n taalprobleem, nie ’n wiskundeprobleem nie.',
    home: 'Gebruik die woorde meer, minder en net soveel elke dag, bv. by die etenstafel.'
  },
  'groot-klein': {
    node: ['w-groot'],
    child: 'Die grootste getal kom laaste as ons tel.',
    tutor: 'Kom ons kyk waar die getalle op die getallelyn lê.',
    parent: 'Verwar die woorde grootste en kleinste (of groter en kleiner).',
    home: 'Vergelyk twee getalle op ’n kalender of huisnommers: watter een is groter?'
  },
  'omgeruil': {
    node: ['tiene'],
    child: 'Die eerste syfer wys hoeveel tiene.',
    tutor: 'Kom ons bou die getal met ’n tien en ene.',
    parent: 'Ruil die syfers om, bv. 31 in plaas van 13.',
    home: 'Maak bondels van tien rietjies met ’n rekkie en bou getalle tot 20.'
  },
  'tiene-totaal': {
    node: ['tiene'],
    child: 'Ons het klaar 10. Hoeveel is daar nog?',
    tutor: 'Kom ons kyk: een vol tienraam, en dan die res.',
    parent: 'Sien nog nie 13 as 10 en 3 nie.',
    home: 'Gebruik ’n eierkarton van 10: maak dit vol en tel die ekstra eiers.'
  },
  'brug-opbreek': {
    node: ['brug10'],
    child: 'Maak eers 10, sit dan die res by.',
    tutor: 'Kom ons maak eers 10, en tel dan die res by.',
    parent: 'Sukkel om ’n getal op te breek om eers 10 te maak: 8 + 5 = 8 + 2 + 3.',
    home: 'Speel met ’n eierkarton van 10: maak dit vol en kyk hoeveel oorbly.'
  },
  'bind-totaal': {
    node: ['bind5', 'bind10'],
    child: 'Hoeveel moet ons nog bysit?',
    tutor: 'Kom ons kyk hoeveel ontbreek.',
    parent: 'Tel die getalle bymekaar in plaas daarvan om die ontbrekende deel te soek: 3 en ? is 5 word 8.',
    home: 'Versteek ’n paar van 5 knope onder ’n koppie: hoeveel is weggesteek?'
  },
  'dubbel-woord': {
    node: ['w-dubbel'],
    child: 'Dubbel is dieselfde getal twee keer.',
    tutor: 'Dubbel beteken twee keer dieselfde. Kyk na die skoenlapper.',
    parent: 'Verstaan nog nie die woord dubbel nie (gee 4 + 1, of net 4).',
    home: 'Speel spieëlbeeld: wys ’n paar vingers, jou kind wys dieselfde. Hoeveel altesaam?'
  },
  'helfte-woord': {
    node: ['w-dubbel'],
    child: 'Helfte beteken twee gelyke groepe.',
    tutor: 'Kom ons deel in twee gelyke groepe.',
    parent: 'Verwar helfte en dubbel.',
    home: 'Deel ’n pakkie lekkers gelykop tussen twee mense: een vir jou, een vir my.'
  },
  'groepe-plus': {
    node: ['herhaal'],
    child: 'Tel alles in al die groepe.',
    tutor: 'Kom ons tel die groepe in sprongetjies.',
    parent: 'Tel die getal groepe en die grootte van ’n groep bymekaar (3 groepe van 2 word 5).',
    home: 'Pak sokkies in pare en tel in tweë; tel vingers in vywe.'
  },
  'groepe-net': {
    node: ['groepe'],
    child: 'Tel die dinge, nie die groepe nie.',
    tutor: 'Kom ons tel elke groep se voorwerpe.',
    parent: 'Tel net hoeveel groepe daar is, en nie hoeveel voorwerpe altesaam nie.',
    home: 'Maak bordjies met elk 3 koekies: hoeveel borde, en hoeveel koekies altesaam?'
  },
  'spring-ene': {
    node: ['spring'],
    child: 'Kyk hoe groot elke sprong is.',
    tutor: 'Kom ons kyk hoe groot elke sprong is.',
    parent: 'Tel in ene waar daar in tweë, vywe of tiene getel moet word.',
    home: 'Tel saam in tweë met sokkies, in vywe met vingers en in tiene met bondels.'
  },
  'ry-glip': {
    node: ['ry'],
    child: 'Sê die getalle hardop, een vir een.',
    tutor: 'Kom ons loop saam met die padda op die getallelyn.',
    parent: 'Is nog onseker oor die getalvolgorde: watter getal kom voor of ná.',
    home: 'Tel saam vorentoe en agteruit terwyl julle stap, of met huisnommers.'
  },
  'geld-munte': {
    node: ['geldtel'],
    child: 'Lees die getal op elke munt.',
    tutor: 'Kom ons lees die getal op elke munt en tel aan.',
    parent: 'Tel hoeveel munte daar is, in plaas van wat die munte werd is.',
    home: 'Speel winkel met regte munte: R5 en R2 en R1. Hoeveel geld is dit?'
  },
  'sent-rand': {
    node: ['geldwaarde'],
    child: 'Rand is meer werd as sent.',
    tutor: 'Kom ons kyk na rand en sent.',
    parent: 'Verwar sent en rand, bv. dink 5c is meer as R2 omdat 5 groter as 2 is.',
    home: 'Wys regte munte en sê altyd sent of rand saam met die getal.'
  },
  'deel-totaal': {
    node: ['deel'],
    child: 'Deel een vir een uit.',
    tutor: 'Kom ons deel een vir een uit.',
    parent: 'Gee die totaal of die getal kinders as antwoord, in plaas van wat elkeen kry.',
    home: 'Laat jou kind lekkers uitdeel: een vir jou, een vir my, totdat dit klaar is.'
  },
  'woordsom-bewerking': {
    node: ['woordsom'],
    child: 'Luister weer: word dit meer of minder?',
    tutor: 'Kom ons teken die storie.',
    parent: 'Kies plus waar minus nodig is (of andersom) by woordsomme: luister- en leesbegrip.',
    home: 'Vertel kort storietjies met speelgoed en vra: word dit meer of minder?'
  },
  'kleingeld-plus': {
    node: ['kleingeld'],
    child: 'As jy koop, het jy minder geld oor.',
    tutor: 'Kom ons kyk hoeveel geld oorbly.',
    parent: 'Tel die prys by die geld in plaas daarvan om dit af te trek.',
    home: 'Speel winkel: jy het R10, die lekker kos R3. Hoeveel het jy oor?'
  }
};

W.Tutor = W.Tutor || {};

/* Die kritieke pad van ’n vraag: die vaardighede in volgorde. */
W.Tutor.path = function (gen, q) {
  var d = (q && q.data) || {};
  switch (gen) {
    case 'count': case 'countInScene': case 'colourN': return ['tel'];
    case 'frame': return ['kyk'];
    case 'matchGroup': return ['herken', 'tel'];
    case 'numWord': return ['naam'];
    case 'moreLess': return ['w-meer', 'ry', 'meerminder'];
    case 'compareGroups': return ['w-meer', 'tel', 'vergelyk'];
    case 'compareNumbers': return ['w-groot', 'herken', 'vergelyk'];
    case 'missing': return d.step > 1 ? ['ry', 'spring'] : ['ry'];
    case 'gridPattern': case 'hops': return ['ry', 'spring'];
    case 'order': return ['ry', 'vergelyk'];
    case 'between': return ['ry'];
    case 'tenAndMore': return ['kyk', 'tiene'];
    case 'placeValue': return ['tiene'];
    case 'oddEven': return ['groepe'];
    case 'add': case 'add3': return ['herken', 'optel', 'telaan'];
    case 'sub': return ['herken', 'aftrek', 'telterug'];
    case 'bond': case 'pairs': return d.n > 10 ? ['bind10', 'tiene'] : d.n > 5 ? ['bind5', 'bind10'] : ['optel', 'bind5'];
    case 'bridge10': return d.op === 'sub' ? ['telterug', 'tiene', 'brug10'] : ['bind10', 'tiene', 'brug10'];
    case 'countOn': return d.back ? ['ry', 'telterug'] : ['ry', 'telaan'];
    case 'wordProblem': return ['w-altesaam', 'woordsom', d.kind === 'add' ? 'telaan' : 'telterug'];
    case 'double': case 'nearDouble': return ['w-dubbel', 'dubbel'];
    case 'half': return ['w-dubbel', 'deel', 'helfte'];
    case 'groups': case 'repeatedAdd': return ['groepe', 'herhaal'];
    case 'share': return ['deel'];
    case 'moneyName': case 'moneyFind': case 'moneyMore': return ['geldwaarde'];
    case 'moneyTotal': case 'moneyMake': return ['geldwaarde', 'geldtel'];
    case 'moneyBuy': return ['geldwaarde', 'vergelyk'];
    case 'moneySum': return d.sub ? ['geldwaarde', 'telterug'] : ['geldwaarde', 'telaan'];
    case 'moneyChange': return ['geldwaarde', 'kleingeld'];
  }
  return [];
};

/* Watter vaardigheid kry die skuld vir ’n bekende fout op hierdie pad? */
W.Tutor.misNode = function (misId, path) {
  var m = W.MIS[misId];
  if (!m) return null;
  for (var i = 0; i < m.node.length; i++) if (path.indexOf(m.node[i]) >= 0) return m.node[i];
  return m.node[0];
};

/* ---------- Foute wat ons uit 'n verkeerde antwoord kan herken ---------- */
(function (T) {
  function rev(n) {
    var s = String(n);
    return s.length === 2 && s[1] !== '0' && s[0] !== s[1] ? +(s[1] + s[0]) : null;
  }
  /* Lys van [verkeerde antwoord, fout-id], in volgorde van belangrikheid. */
  function candidates(gen, q) {
    var d = q.data;
    switch (gen) {
      case 'count': case 'countInScene': case 'frame':
        return [[d.n + 1, 'tel-glip'], [d.n - 1, 'tel-glip']];
      case 'matchGroup':
        return [[d.n + 1, 'tel-glip'], [d.n - 1, 'tel-glip'], [d.n + 2, 'tel-glip'], [d.n - 2, 'tel-glip']];
      case 'add':
        return [[d.s - 1, 'telaan-begin'], [Math.abs(d.a - d.b), 'plus-minus'], [Math.max(d.a, d.b), 'net-een'], [d.s + 1, 'tel-glip']];
      case 'add3':
        return [[d.s - 1, 'telaan-begin'], [d.a + d.b, 'net-een']];
      case 'sub':
        return [[d.d + 1, 'telterug-begin'], [d.a + d.b, 'minus-plus'], [d.d - 1, 'tel-glip']];
      case 'bond':
        return [[d.n + d.k, 'bind-totaal'], [d.n, 'bind-totaal'], [d.ans + 1, 'tel-glip'], [d.ans - 1, 'tel-glip']];
      case 'bridge10':
        return d.op === 'add'
          ? [[10 + d.need, 'brug-opbreek'], [d.s - 1, 'telaan-begin'], [Math.abs(d.x - d.y), 'plus-minus']]
          : [[10 - d.u, 'brug-opbreek'], [d.d + 1, 'telterug-begin'], [d.a + d.b, 'minus-plus']];
      case 'countOn':
        return d.back ? [[d.ans + 1, 'telterug-begin'], [d.a + d.b, 'minus-plus']] : [[d.ans - 1, 'telaan-begin'], [d.a - d.b, 'plus-minus']];
      case 'wordProblem':
        if (d.kind === 'add') return [[Math.abs(d.a - d.b), 'woordsom-bewerking'], [d.ans - 1, 'telaan-begin']];
        if (d.kind === 'sub') return [[d.a + d.b, 'woordsom-bewerking'], [d.ans + 1, 'telterug-begin']];
        if (d.kind === 'compare') return [[d.a + d.b, 'woordsom-bewerking'], [d.a, 'woordsom-bewerking']];
        return [[d.s + d.b, 'woordsom-bewerking']];
      case 'double':
        return [[d.n + 1, 'dubbel-woord'], [d.n, 'dubbel-woord'], [2 * d.n + 1, 'tel-glip'], [2 * d.n - 1, 'tel-glip']];
      case 'half':
        return [[2 * d.m, 'helfte-woord'], [d.m, 'helfte-woord'], [d.n + 1, 'tel-glip'], [d.n - 1, 'tel-glip']];
      case 'groups':
        return d.v === 0 ? [[d.g + d.s, 'groepe-plus'], [d.g, 'groepe-net'], [d.s, 'groepe-net']] : [];
      case 'repeatedAdd':
        return [[d.g + d.s, 'groepe-plus'], [d.g, 'groepe-net']];
      case 'share':
        return d.askRem ? [] : [[d.total, 'deel-totaal'], [d.k, 'deel-totaal']];
      case 'missing':
        if (d.step > 1) { var prev = d.seq[d.idx - 1]; return [[d.back ? prev - 1 : prev + 1, 'spring-ene']]; }
        return [[d.ans + 1, 'ry-glip'], [d.ans - 1, 'ry-glip']];
      case 'gridPattern':
        return [[d.prev + 1, 'spring-ene']];
      case 'hops':
        return [[d.n, 'spring-ene']];
      case 'between':
        return [[d.a, 'ry-glip'], [d.a + 2, 'ry-glip']];
      case 'moreLess':
        return [[d.more ? d.n - d.by : d.n + d.by, 'meer-minder'], [d.n, 'ry-glip']];
      case 'compareGroups':
        if (d.ans === 'meer') return [['minder', 'meer-minder'], ['net soveel', 'tel-glip']];
        if (d.ans === 'minder') return [['meer', 'meer-minder'], ['net soveel', 'tel-glip']];
        return [['meer', 'tel-glip'], ['minder', 'tel-glip']];
      case 'compareNumbers':
        return [[d.big ? Math.min.apply(null, d.nums) : Math.max.apply(null, d.nums), 'groot-klein']];
      case 'tenAndMore':
        if (d.v === 0) return [[d.n, 'tiene-totaal'], [10, 'tiene-totaal']];
        if (d.v === 1) return [[d.n, 'tiene-totaal']];
        return [[rev(d.n), 'omgeruil'], [d.n - 10, 'tiene-totaal'], [d.n + 1, 'tel-glip'], [d.n - 1, 'tel-glip']];
      case 'placeValue':
        return d.v === 0 ? [[rev(d.n), 'omgeruil'], [d.u, 'tiene-totaal']] : [[d.n, 'tiene-totaal']];
      case 'moneyTotal':
        return d.cents ? [] : [[d.coins.length * 100, 'geld-munte']];
      case 'moneyMore':
        var mixed = d.opts.some(function (v) { return v < 100; }) && d.opts.some(function (v) { return v >= 100; });
        return mixed ? d.opts.map(function (v) { return [v, 'sent-rand']; }) : [];
      case 'moneySum':
        return d.sub ? [[d.ans + 1, 'telterug-begin'], [d.a + d.b, 'minus-plus']] : [[d.ans - 1, 'telaan-begin'], [Math.abs(d.a - d.b), 'plus-minus']];
      case 'moneyChange':
        return [[d.have + d.cost, 'kleingeld-plus'], [d.ans + 1, 'telterug-begin']];
    }
    return [];
  }

  /* Voeg q.mis by (antwoord -> fout) en sit die fout-antwoorde tussen die keuses. */
  T.enrich = function (gen, q) {
    if (!q || !q.data) return q;
    var inp = q.input, ans = inp.answer, map = {}, keys = [];
    candidates(gen, q).forEach(function (c) {
      var v = c[0];
      if (v == null || (typeof v === 'number' && (!isFinite(v) || v < 0))) return;
      if (gen === 'moneyTotal' && v <= 0) return;
      if (String(v) === String(ans) || String(v) in map) return;
      map[String(v)] = c[1];
      keys.push(String(v)); // volgorde van belangrikheid (Object.keys sorteer getalle)
    });
    q.mis = map;
    if (inp.kind !== 'choice' || !keys.length) return q;
    // Net as die keuses gewone etikette het (nie prentjies nie) kan ons nuwe keuses maak
    var plain = inp.options.every(function (o) { return o.html == null && o.label === String(o.value); });
    var money = gen === 'moneyTotal' && inp.options.every(function (o) { return o.html == null; });
    if (!plain && !money) return q;
    var numeric = typeof ans === 'number' && inp.options.every(function (o) { return typeof o.value === 'number'; });
    var vals = numeric && FREE[gen] ? freeOptions(gen, q, keys) : fixedOptions(inp, keys, numeric);
    var same = !numeric && vals.length === inp.options.length && inp.options.every(function (o) { return vals.indexOf(o.value) >= 0; });
    if (same) return q; // woord-keuses (meer / minder / net soveel) bly in hul vaste volgorde
    inp.options = W.U.shuffle(vals).map(function (v) {
      return { value: v, label: money ? W.V.moneyLabel(v) : String(v) };
    });
    return q;
  };

  /* Vraagtipes waar enige getal 'n moontlike antwoord is (nie 'n keuse uit getalle in die vraag nie). */
  var FREE = {
    add: 1, add3: 1, sub: 1, bond: 1, bridge10: 1, countOn: 1, wordProblem: 1, double: 1, nearDouble: 1, half: 1,
    groups: 1, repeatedAdd: 1, share: 1, count: 1, countInScene: 1, frame: 1, missing: 1, gridPattern: 1, hops: 1,
    between: 1, moreLess: 1, tenAndMore: 1, placeValue: 1, moneyTotal: 1, moneySum: 1, moneyChange: 1
  };
  var ZERO_OK = { sub: 1, bond: 1, countOn: 1, moreLess: 1, between: 1, missing: 1, tenAndMore: 1, placeValue: 1, bridge10: 1 };

  /* Die antwoord kry 'n toevallige plek in grootte-volgorde (kleinste, middel of grootste), sodat
     "kies die grootste" by plus of "kies die kleinste" by minus nie werk nie. Hoogstens een fout-keuse
     (twee by vier keuses), gekies uit die belangrikste; die res is getalle naby die antwoord. */
  function freeOptions(gen, q, keys) {
    var inp = q.input, ans = inp.answer, d = q.data || {}, n = inp.options.length;
    var step = gen === 'moneyTotal' ? (ans >= 100 ? 100 : ans % 10 === 0 ? 10 : 5) :
      (gen === 'missing' || gen === 'gridPattern' || gen === 'hops') && d.step > 1 ? d.step : 1;
    var lo = ZERO_OK[gen] ? 0 : Math.min(step, ans);
    var below = Math.max(0, Math.floor((ans - lo) / step));
    var r = Math.min(W.U.rnd(0, n - 1), below), needLo = r, needHi = n - 1 - r;
    var vals = [ans], used = 0, kMax = n >= 4 ? 2 : 1;
    var pool = keys.map(Number).filter(function (v) { return v >= lo && v !== ans; });
    pool = W.U.shuffle(pool.slice(0, 2)).concat(pool.slice(2)); // nie altyd dieselfde fout eerste nie
    pool.forEach(function (v) {
      if (used >= kMax || vals.indexOf(v) >= 0) return;
      if (v < ans && needLo > 0) { vals.push(v); needLo--; used++; } else if (v > ans && needHi > 0) { vals.push(v); needHi--; used++; }
    });
    for (var k = 1; (needLo > 0 || needHi > 0) && k < 60; k++) {
      var a = ans - k * step, b = ans + k * step;
      if (needLo > 0 && a >= lo && vals.indexOf(a) < 0) { vals.push(a); needLo--; }
      if (needHi > 0 && vals.indexOf(b) < 0) { vals.push(b); needHi--; }
    }
    return vals;
  }
  /* Keuses uit 'n vaste stel (bv. "watter getal is die grootste?"): die fout-keuses eerste, dan die oorspronklikes. */
  function fixedOptions(inp, keys, numeric) {
    var n = inp.options.length, vals = [inp.answer];
    keys.forEach(function (k) { if (vals.length < n) vals.push(numeric ? +k : k); });
    inp.options.forEach(function (o) {
      if (vals.length < n && vals.map(String).indexOf(String(o.value)) < 0) vals.push(o.value);
    });
    return vals;
  }

  /* Elke generator gaan voortaan deur enrich (ook in die toetse en die stemopname). */
  Object.keys(W.G).forEach(function (g) {
    if (g.charAt(0) === '_' || W.G[g].__tutor) return;
    var orig = W.G[g];
    W.G[g] = function (p) { return T.enrich(g, orig(p)); };
    W.G[g].__tutor = true;
  });
})(W.Tutor);
