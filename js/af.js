/* Afrikaanse taaldata: getalname, ordinaalgetalle, voorwerpe, name, lof. */
var W = window.W || (window.W = {});

W.AF = (function () {
  var UNITS = ['nul', 'een', 'twee', 'drie', 'vier', 'vyf', 'ses', 'sewe', 'agt', 'nege', 'tien',
    'elf', 'twaalf', 'dertien', 'veertien', 'vyftien', 'sestien', 'sewentien', 'agtien', 'negentien'];
  var TENS = { 2: 'twintig', 3: 'dertig', 4: 'veertig', 5: 'vyftig', 6: 'sestig', 7: 'sewentig', 8: 'tagtig', 9: 'negentig' };

  function numWord(n) {
    n = Number(n);
    if (n < 0) return 'minus ' + numWord(-n);
    if (n < 20) return UNITS[n];
    if (n === 100) return 'honderd';
    if (n > 100) return 'honderd en ' + numWord(n - 100);
    var t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return TENS[t];
    return UNITS[u] + '-en-' + TENS[t];
  }

  var ORD = ['nulde', 'eerste', 'tweede', 'derde', 'vierde', 'vyfde', 'sesde', 'sewende', 'agtste',
    'negende', 'tiende', 'elfde', 'twaalfde'];
  function ordinal(n) { return ORD[n] || (numWord(n) + 'ste'); }

  /* Voorwerpe om te tel. e = emoji, s = enkelvoud, p = meervoud */
  var THINGS = {
    appel: { e: '🍎', s: 'appel', p: 'appels' },
    piesang: { e: '🍌', s: 'piesang', p: 'piesangs' },
    lemoen: { e: '🍊', s: 'lemoen', p: 'lemoene' },
    peer: { e: '🍐', s: 'peer', p: 'pere' },
    aarbei: { e: '🍓', s: 'aarbei', p: 'aarbeie' },
    druif: { e: '🍇', s: 'tros druiwe', p: 'trosse druiwe' },
    lekker: { e: '🍬', s: 'lekker', p: 'lekkers' },
    koekie: { e: '🍪', s: 'koekie', p: 'koekies' },
    kolwyntjie: { e: '🧁', s: 'kolwyntjie', p: 'kolwyntjies' },
    wortel: { e: '🥕', s: 'wortel', p: 'wortels' },
    kat: { e: '🐱', s: 'kat', p: 'katte' },
    hond: { e: '🐶', s: 'hond', p: 'honde' },
    eend: { e: '🦆', s: 'eend', p: 'eende' },
    slak: { e: '🐌', s: 'slak', p: 'slakke' },
    vis: { e: '🐟', s: 'vis', p: 'visse' },
    voel: { e: '🐦', s: 'voël', p: 'voëls' },
    skoenlapper: { e: '🦋', s: 'skoenlapper', p: 'skoenlappers' },
    by: { e: '🐝', s: 'by', p: 'bye' },
    padda: { e: '🐸', s: 'padda', p: 'paddas' },
    skilpad: { e: '🐢', s: 'skilpad', p: 'skilpaaie' },
    hoender: { e: '🐔', s: 'hoender', p: 'hoenders' },
    koei: { e: '🐄', s: 'koei', p: 'koeie' },
    skaap: { e: '🐑', s: 'skaap', p: 'skape' },
    haas: { e: '🐰', s: 'hasie', p: 'hasies' },
    blom: { e: '🌸', s: 'blom', p: 'blomme' },
    boom: { e: '🌳', s: 'boom', p: 'bome' },
    ster: { e: '⭐', s: 'ster', p: 'sterre' },
    ballon: { e: '🎈', s: 'ballon', p: 'ballonne' },
    bal: { e: '⚽', s: 'bal', p: 'balle' },
    teddie: { e: '🧸', s: 'teddiebeer', p: 'teddiebere' },
    motor: { e: '🚗', s: 'motor', p: 'motors' },
    bus: { e: '🚌', s: 'bus', p: 'busse' },
    fiets: { e: '🚲', s: 'fiets', p: 'fietse' },
    skoen: { e: '👟', s: 'skoen', p: 'skoene' },
    hart: { e: '❤️', s: 'hart', p: 'harte' },
    potlood: { e: '✏️', s: 'potlood', p: 'potlode' },
    boek: { e: '📘', s: 'boek', p: 'boeke' },
    skulp: { e: '🐚', s: 'skulp', p: 'skulpe' },
    ruspe: { e: '🐛', s: 'ruspe', p: 'ruspes' },
    blaar: { e: '🍃', s: 'blaar', p: 'blare' }
  };
  var COUNTABLE = ['appel', 'piesang', 'lemoen', 'peer', 'aarbei', 'lekker', 'koekie', 'kolwyntjie', 'wortel',
    'kat', 'hond', 'eend', 'slak', 'vis', 'voel', 'skoenlapper', 'by', 'padda', 'skilpad', 'hoender',
    'blom', 'ster', 'ballon', 'bal', 'teddie', 'motor', 'skoen', 'hart', 'skulp', 'ruspe'];
  var ANIMALS = ['kat', 'hond', 'eend', 'slak', 'vis', 'voel', 'skoenlapper', 'by', 'padda', 'skilpad', 'hoender', 'koei', 'skaap', 'haas'];
  var FRUIT = ['appel', 'piesang', 'lemoen', 'peer', 'aarbei', 'druif'];
  var VEHICLES = ['motor', 'bus', 'fiets'];

  function thing(key) { return THINGS[key]; }
  /* "1 appel", "3 appels" */
  function count(n, key) { var t = THINGS[key]; return n + ' ' + (n === 1 ? t.s : t.p); }

  /* Diere vir rye en posisievrae (groot genoeg om te herken). */
  var ROW_ANIMALS = [
    { e: '🐘', s: 'olifant' }, { e: '🦒', s: 'kameelperd' }, { e: '🦓', s: 'sebra' },
    { e: '🐶', s: 'hond' }, { e: '🐱', s: 'kat' }, { e: '🐵', s: 'aap' }, { e: '🦁', s: 'leeu' },
    { e: '🐷', s: 'vark' }, { e: '🐮', s: 'koei' }, { e: '🐰', s: 'hasie' }, { e: '🐸', s: 'padda' },
    { e: '🐔', s: 'hoender' }, { e: '🦆', s: 'eend' }, { e: '🐢', s: 'skilpad' }
  ];

  var NAMES = ['Lisa', 'Musa', 'Sipho', 'Thandi', 'Lerato', 'Pieter', 'Annie', 'Mandla', 'Jabu',
    'Nomsa', 'Hennie', 'Sunet', 'Themba', 'Busi', 'Jana', 'Susan', 'Ruan', 'Zanele', 'Karel', 'Amahle'];

  var DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag', 'Sondag'];
  var MONTHS = ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie', 'Julie', 'Augustus',
    'September', 'Oktober', 'November', 'Desember'];

  var COLOURS = [
    { n: 'rooi', c: '#e53935' }, { n: 'blou', c: '#1e88e5' }, { n: 'groen', c: '#43a047' },
    { n: 'geel', c: '#fdd835' }, { n: 'oranje', c: '#fb8c00' }, { n: 'pers', c: '#8e24aa' },
    { n: 'pienk', c: '#f06292' }, { n: 'bruin', c: '#8d6e63' }, { n: 'swart', c: '#212121' }
  ];

  var PRAISE = ['Mooi so!', 'Uitstekend!', 'Fantasties!', 'Knap gedoen!', 'Reg so!', 'Baie goed!',
    'Jy is ’n ster!', 'Wonderlik!', 'Slim kop!', 'Pragtig!'];
  var TRY_AGAIN = ['Amper! Probeer weer.', 'Oeps, probeer nog ’n keer.', 'Nie heeltemal nie. Probeer weer.'];

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Maak teks gereed vir die spraakstem: R5 -> vyf rand, 20c -> twintig sent, + -> plus ens. */
  function speakable(text) {
    return String(text)
      .replace(/R\s?(\d+)/g, function (m, d) { return numWord(+d) + ' rand'; })
      .replace(/(\d+)\s?c\b/g, function (m, d) { return numWord(+d) + ' sent'; })
      .replace(/\s*\+\s*/g, ' plus ')
      .replace(/\s+[–−-]\s+/g, ' minus ')
      .replace(/\s*=\s*\?/g, ' is hoeveel?')
      .replace(/\s*=\s*/g, ' is ')
      .replace(/_+|□|\?\?/g, ' hoeveel ')
      .replace(/\b(\d+)\b/g, function (m, d) { return numWord(+d); })
      .replace(/\s+/g, ' ')
      .trim();
  }

  return {
    numWord: numWord, ordinal: ordinal, THINGS: THINGS, COUNTABLE: COUNTABLE, ANIMALS: ANIMALS,
    FRUIT: FRUIT, VEHICLES: VEHICLES, thing: thing, count: count, ROW_ANIMALS: ROW_ANIMALS,
    NAMES: NAMES, DAYS: DAYS, MONTHS: MONTHS, COLOURS: COLOURS, PRAISE: PRAISE, TRY_AGAIN: TRY_AGAIN,
    cap: cap, speakable: speakable
  };
})();
