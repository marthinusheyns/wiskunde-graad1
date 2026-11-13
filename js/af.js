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
      .replace(/\(?\b[23]D\)?/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Vaste sinne wat die app self sê (nie uit die vraaggenerators nie). */
  var PHRASES = {
    results3: 'Fantasties! Jy het dit bemeester!',
    results2: 'Baie goed gedoen!',
    results1: 'Goed geoefen! Probeer weer vir meer sterre.',
    test: 'Hallo! Kom ons oefen wiskunde. Een, twee, drie, vier, vyf.',
    traceAll: 'Trek oor die hele getal, van bo tot onder.',
    traceInside: 'Bly binne die grys lyne.',
    traceFirst: 'Trek eers met jou vinger oor die grys getal.',
    colourLess: 'Tik op ’n gekleurde vorm om dit weer wit te maak.',
    showme: 'Kyk hoe ek ’n soortgelyke een doen. Dan probeer jy.',
    yourTurn: 'Nou probeer jy!',
    learn: 'Hallo! Ek is Juffrou Padda. Kom ons leer saam.'
  };
  function colourHint(n, target) {
    return 'Jy het ' + n + ' ingekleur. Ons soek ' + target + '. ' + (n > target ? PHRASES.colourLess : 'Kleur nog ' + (target - n) + ' in.');
  }

  /* Opgeneemde stem: breek teks op in stukkies (sinne, name en getalle) sodat elke stukkie
     een keer opgeneem kan word en die app sinne daaruit kan saamstel.
     Hierdie funksie word deur die app en deur tools/build-audio.js gebruik. */
  var TOKEN_RE = new RegExp('\\bR\\s?(\\d+)|(\\d+)\\s?c\\b|(\\d+)|\\b(' + NAMES.join('|') + ')\\b', 'g');
  var EMOJI_RE = /[←-⇿⌀-➿⬀-⯿️‍◀▶]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g;
  function cleanChunk(s) {
    return s.replace(EMOJI_RE, ' ')
      .replace(/["“”]/g, '')
      .replace(/\s*\+\s*/g, ' plus ')
      .replace(/(^|\s)[–−-](?=\s|$)/g, '$1minus')
      .replace(/\s*=\s*/g, ' is ')
      .replace(/\.\.\.|…/g, ' ');
  }
  function cleanPiece(p) {
    return p.replace(/^[\s,;:.\-–]+/, '').replace(/[\s,;:\-–]+$/, '').replace(/\s+/g, ' ').replace(/\s+([.!?])/g, '$1').trim();
  }
  // '?' wat los staan is 'n plekhouer ("3 en ? is 5"); '?' wat aan 'n woord vas is, is net 'n vraagteken
  function prep(text) {
    return String(text || '').replace(/\s*\(?\b[23]D\)?/g, '')
      .replace(/(^|\s)\?(?=\s|$)/g, '$1hoeveel').replace(/hoeveel$/, 'hoeveel?');
  }
  function segments(text) {
    var out = [], last = 0, m;
    var s = prep(text);
    function pushText(chunk) {
      cleanChunk(chunk).replace(/([.!?])\s+/g, '$1\n').split('\n').forEach(function (p) {
        p = cleanPiece(p);
        if (p && /[a-zA-ZÀ-ſ]/.test(p)) out.push(p);
      });
    }
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(s))) {
      pushText(s.slice(last, m.index));
      if (m[1]) { out.push(numWord(+m[1])); out.push('rand'); }
      else if (m[2]) { out.push(numWord(+m[2])); out.push('sent'); }
      else if (m[3]) out.push(numWord(+m[3]));
      else out.push(m[4]);
      last = TOKEN_RE.lastIndex;
    }
    pushText(s.slice(last));
    return out;
  }
  /* Hele sinne, vir sinne wat in hul geheel opgeneem is (bv. "Ons begin by agt."). Dan klink die
     toon reg, sonder 'n breuk by elke getal. raw: die sin soos geskryf (vir segments as daar nie 'n
     opname van die hele sin is nie); say: die uitgespelde teks wat opgeneem word. 'n Sin sonder
     getalle of name is presies een stukkie, so dit deel dieselfde opname. */
  function spell(s) {
    return s.replace(/\bR\s?(\d+)/g, function (m, d) { return numWord(+d) + ' rand'; })
      .replace(/(\d+)\s?c\b/g, function (m, d) { return numWord(+d) + ' sent'; })
      .replace(/\d+/g, function (d) { return numWord(+d); });
  }
  function sentences(text) {
    var out = [];
    cleanChunk(prep(text)).replace(/([.!?])\s+/g, '$1\n').split('\n').forEach(function (raw) {
      var say = cleanPiece(spell(raw));
      if (say && /[a-zA-ZÀ-ſ]/.test(say)) out.push({ raw: raw, say: say });
    });
    return out;
  }
  /* Kort, stabiele lêernaam vir 'n stukkie (FNV-1a, 32 bis). */
  function hash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8);
  }

  return {
    numWord: numWord, ordinal: ordinal, THINGS: THINGS, COUNTABLE: COUNTABLE, ANIMALS: ANIMALS,
    FRUIT: FRUIT, VEHICLES: VEHICLES, thing: thing, count: count, ROW_ANIMALS: ROW_ANIMALS,
    NAMES: NAMES, DAYS: DAYS, MONTHS: MONTHS, COLOURS: COLOURS, PRAISE: PRAISE, TRY_AGAIN: TRY_AGAIN,
    cap: cap, speakable: speakable, PHRASES: PHRASES, colourHint: colourHint, segments: segments, sentences: sentences, hash: hash
  };
})();
