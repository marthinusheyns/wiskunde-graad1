/* Prente vir die vrae. Elke funksie gee 'n HTML- of SVG-string terug,
   sodat die vraaggenerators sonder 'n DOM getoets kan word. */
var W = window.W || (window.W = {});

W.V = (function () {
  var U = W.U;
  var C = {
    red: '#e53935', orange: '#fb8c00', yellow: '#fdd835', green: '#43a047', blue: '#1e88e5',
    purple: '#8e24aa', pink: '#ec407a', teal: '#00897b', grey: '#9e9e9e', ink: '#263238',
    light: '#e3f2fd', paper: '#ffffff'
  };
  var RAINBOW = [C.red, C.orange, C.yellow, C.green, C.blue, C.purple, C.pink, C.teal];

  function svg(w, h, body, cls, scale) {
    return '<svg class="vis ' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h + '" width="' + Math.round(w * (scale || 1)) + '" height="' + Math.round(h * (scale || 1)) + '" ' +
      'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img">' + body + '</svg>';
  }
  function txt(x, y, s, size, fill, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 20) + '" text-anchor="middle" ' +
      'dominant-baseline="central" fill="' + (fill || C.ink) + '" ' + (extra || '') + '>' + U.esc(s) + '</text>';
  }

  /* ---------- Voorwerpe om te tel ---------- */
  function sizeFor(n) { return n <= 5 ? 'xl' : n <= 10 ? 'lg' : n <= 15 ? 'md' : 'sm'; }

  /* layout: 'scatter' (los), 'rows' (rye van 5), 'line' (een ry) */
  function objs(emoji, n, opts) {
    opts = opts || {};
    var layout = opts.layout || 'scatter';
    var size = opts.size || sizeFor(n);
    var items = [];
    for (var i = 0; i < n; i++) {
      var e = Array.isArray(emoji) ? emoji[i] : emoji;
      var style = '';
      if (layout === 'scatter') {
        style = ' style="transform:rotate(' + U.rnd(-14, 14) + 'deg) translateY(' + U.rnd(-6, 6) + 'px)"';
      }
      var cls = 'o' + (opts.crossFrom != null && i >= opts.crossFrom ? ' crossed' : '') +
        (opts.ringTo != null && i < opts.ringTo ? ' ringed' : '');
      items.push('<span class="' + cls + '"' + style + '>' + e + '</span>');
    }
    if (layout === 'rows') {
      var rows = [];
      for (var r = 0; r < items.length; r += 5) rows.push('<div class="orow">' + items.slice(r, r + 5).join('') + '</div>');
      return '<div class="objs rows ' + size + '">' + rows.join('') + '</div>';
    }
    return '<div class="objs ' + layout + ' ' + size + '">' + items.join('') + '</div>';
  }

  function mixed(list, opts) { return objs(list, list.length, opts || { layout: 'scatter' }); }

  /* Groepe in afsonderlike raampies: 3 groepe van 2 */
  function groups(emoji, g, s, opts) {
    opts = opts || {};
    var out = [];
    for (var i = 0; i < g; i++) {
      var inner = '';
      for (var j = 0; j < s; j++) inner += '<span class="o">' + emoji + '</span>';
      out.push('<div class="grp">' + inner + '</div>');
    }
    if (opts.loose) {
      for (var k = 0; k < opts.loose; k++) out.push('<div class="grp loose"><span class="o">' + emoji + '</span></div>');
    }
    return '<div class="groups ' + (g * s > 12 ? 'sm' : '') + '">' + out.join('') + '</div>';
  }

  /* Twee groepe langs mekaar met 'n etiket (vir vergelyk) */
  function twoBoxes(leftHtml, rightHtml, leftLabel, rightLabel) {
    return '<div class="twobox"><div class="box"><div class="boxlbl">' + (leftLabel || '') + '</div>' + leftHtml +
      '</div><div class="box"><div class="boxlbl">' + (rightLabel || '') + '</div>' + rightHtml + '</div></div>';
  }

  /* ---------- Krale (soos in die werkboek) ---------- */
  /* opts.colours: lys kleure per kraal; opts.crossed: getal krale van regs af wat deurgehaal is;
     opts.gapAfter: los spasie na kraal k */
  function beads(n, opts) {
    opts = opts || {};
    var r = 18, gap = 6, x = 8 + r, body = '', w;
    var per = n > 10 ? 10 : n;
    var rows = Math.ceil(n / 10);
    w = 8 * 2 + per * (2 * r + gap) + (opts.gapAfter ? 18 : 0);
    var h = rows * (2 * r + 12) + 8;
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / 10), col = i % 10;
      var cx = 8 + r + col * (2 * r + gap) + (opts.gapAfter && col >= opts.gapAfter ? 18 : 0);
      var cy = 4 + r + row * (2 * r + 12);
      var fill = opts.colours ? (opts.colours[i] || '#fff') : '#bbdefb';
      body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" stroke="#1565c0" stroke-width="2.5"/>';
      if (opts.crossed && i >= n - opts.crossed) {
        body += '<line x1="' + (cx - r + 4) + '" y1="' + (cy + r - 2) + '" x2="' + (cx + r - 4) + '" y2="' + (cy - r + 2) + '" stroke="' + C.ink + '" stroke-width="4" stroke-linecap="round"/>';
      }
    }
    return svg(w, h, body, 'beads', 1.25);
  }

  /* ---------- Tienraam ---------- */
  function tenFrames(n, opts) {
    opts = opts || {};
    var frames = Math.max(1, Math.ceil(n / 10));
    var cell = 44, fw = cell * 5, fh = cell * 2, gap = 16, body = '';
    var w = frames * fw + (frames - 1) * gap + 8, h = fh + 8;
    for (var f = 0; f < frames; f++) {
      var ox = 4 + f * (fw + gap);
      body += '<rect x="' + ox + '" y="4" width="' + fw + '" height="' + fh + '" fill="#fff" stroke="' + C.ink + '" stroke-width="3" rx="4"/>';
      for (var i = 0; i < 10; i++) {
        var cx = ox + (i % 5) * cell, cy = 4 + Math.floor(i / 5) * cell;
        body += '<rect x="' + cx + '" y="' + cy + '" width="' + cell + '" height="' + cell + '" fill="none" stroke="' + C.ink + '" stroke-width="1.5"/>';
        var idx = f * 10 + i;
        if (idx < n) {
          var fc = opts.split != null ? (idx < opts.split ? C.red : C.blue) : (f === 0 ? C.red : C.blue);
          body += '<circle cx="' + (cx + cell / 2) + '" cy="' + (cy + cell / 2) + '" r="15" fill="' + fc + '"/>';
        }
      }
    }
    return svg(w, h, body, 'frames', 1.1);
  }

  /* ---------- Getallelyn ---------- */
  /* o: {min,max,tick (afstand tussen merke), label (watter getalle 'n nommer kry: 'all'|'ends'|stap),
         hide:[], mark:[], hops:[[van,na],...], start} */
  function numberLine(o) {
    var min = o.min, max = o.max, tick = o.tick || 1;
    var count = (max - min) / tick;
    var unit = Math.max(26, Math.min(56, 620 / count));
    var tall = (o.hops && o.hops.length) || o.start != null;
    var w = count * unit + 60, h = tall ? 120 : 76, y = tall ? 78 : 26, body = '';
    function X(v) { return 30 + (v - min) / tick * unit; }
    body += '<line x1="14" y1="' + y + '" x2="' + (w - 14) + '" y2="' + y + '" stroke="' + C.ink + '" stroke-width="3"/>';
    body += '<path d="M' + (w - 6) + ' ' + y + ' l-12 -7 v14z" fill="' + C.ink + '"/>';
    body += '<path d="M6 ' + y + ' l12 -7 v14z" fill="' + C.ink + '"/>';
    var hide = o.hide || [], mark = o.mark || [];
    for (var v = min; v <= max + 1e-9; v += tick) {
      var x = X(v);
      body += '<line x1="' + x + '" y1="' + (y - 9) + '" x2="' + x + '" y2="' + (y + 9) + '" stroke="' + C.ink + '" stroke-width="2.5"/>';
      var showLabel = o.label === 'all' || o.label == null ||
        (o.label === 'ends' && (v === min || v === max)) ||
        (typeof o.label === 'number' && v % o.label === 0);
      if (hide.indexOf(v) >= 0) {
        body += '<rect x="' + (x - 17) + '" y="' + (y + 13) + '" width="34" height="28" rx="6" fill="#fff59d" stroke="' + C.orange + '" stroke-width="2.5"/>';
        body += txt(x, y + 27, '?', 20, C.ink, 'font-weight="700"');
      } else if (showLabel) {
        var isMark = mark.indexOf(v) >= 0;
        if (isMark) body += '<circle cx="' + x + '" cy="' + (y + 27) + '" r="16" fill="#c8e6c9"/>';
        body += txt(x, y + 27, String(v), unit < 34 ? 15 : 19, C.ink, isMark ? 'font-weight="700"' : '');
      }
    }
    (o.hops || []).forEach(function (hp, i) {
      var a = X(hp[0]), b = X(hp[1]), mid = (a + b) / 2, top = y - 18 - Math.min(46, Math.abs(b - a) * 0.45);
      var col = RAINBOW[i % RAINBOW.length];
      body += '<path d="M' + a + ' ' + (y - 6) + ' Q' + mid + ' ' + top + ' ' + b + ' ' + (y - 6) + '" fill="none" stroke="' + col + '" stroke-width="3"/>';
      var dir = b > a ? -1 : 1;
      body += '<path d="M' + b + ' ' + (y - 6) + ' l' + (dir * 9) + ' -8 l' + (dir * 2) + ' 10z" fill="' + col + '"/>';
    });
    if (o.start != null) {
      body += txt(X(o.start), y - 30, '🐸', 26);
    }
    return svg(w, h, body, 'nline');
  }

  /* ---------- Getallebord ---------- */
  function numberGrid(o) {
    var cols = o.cols || 10, html = '<table class="ngrid">';
    var hide = o.hide || [], hl = o.highlight || [];
    for (var v = o.start; v <= o.end; v++) {
      if ((v - o.start) % cols === 0) html += (v === o.start ? '' : '</tr>') + '<tr>';
      var cls = hide.indexOf(v) >= 0 ? 'q' : hl.indexOf(v) >= 0 ? 'hl' : '';
      html += '<td class="' + cls + '">' + (hide.indexOf(v) >= 0 ? '?' : v) + '</td>';
    }
    return html + '</tr></table>';
  }

  /* ---------- Vorms ---------- */
  function shapeEl(type, cx, cy, s, fill, rot, stroke) {
    var st = ' fill="' + fill + '" stroke="' + (stroke || C.ink) + '" stroke-width="' + Math.max(2, s / 22) + '" stroke-linejoin="round"';
    var tr = rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '';
    var h = s / 2;
    switch (type) {
      case 'sirkel': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + h + '"' + st + '/>';
      case 'vierkant': return '<rect x="' + (cx - h) + '" y="' + (cy - h) + '" width="' + s + '" height="' + s + '"' + st + tr + '/>';
      case 'reghoek': return '<rect x="' + (cx - s * 0.75) + '" y="' + (cy - s * 0.38) + '" width="' + (s * 1.5) + '" height="' + (s * 0.76) + '"' + st + tr + '/>';
      case 'driehoek': return '<polygon points="' + cx + ',' + (cy - h) + ' ' + (cx + h * 1.1) + ',' + (cy + h * 0.85) + ' ' + (cx - h * 1.1) + ',' + (cy + h * 0.85) + '"' + st + tr + '/>';
      case 'ovaal': return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (h * 1.35) + '" ry="' + (h * 0.8) + '"' + st + tr + '/>';
      case 'ruit': return '<polygon points="' + cx + ',' + (cy - h * 1.1) + ' ' + (cx + h * 0.8) + ',' + cy + ' ' + cx + ',' + (cy + h * 1.1) + ' ' + (cx - h * 0.8) + ',' + cy + '"' + st + tr + '/>';
      case 'ster':
        var pts = [];
        for (var i = 0; i < 10; i++) {
          var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? h * 0.45 : h;
          pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
        }
        return '<polygon points="' + pts.join(' ') + '"' + st + tr + '/>';
      case 'hart':
        return '<path d="M' + cx + ' ' + (cy + h * 0.9) + ' C' + (cx - h * 1.6) + ' ' + (cy - h * 0.2) + ' ' + (cx - h * 0.6) + ' ' + (cy - h * 1.2) + ' ' + cx + ' ' + (cy - h * 0.4) +
          ' C' + (cx + h * 0.6) + ' ' + (cy - h * 1.2) + ' ' + (cx + h * 1.6) + ' ' + (cy - h * 0.2) + ' ' + cx + ' ' + (cy + h * 0.9) + 'Z"' + st + tr + '/>';
    }
    return '';
  }
  function shape(type, opts) {
    opts = opts || {};
    var s = opts.size || 80, pad = s * 0.35;
    var w = (type === 'reghoek' || type === 'ovaal' ? s * 1.6 : s) + pad, h = s * 1.15 + pad / 2;
    return svg(w, h, shapeEl(type, w / 2, h / 2, s, opts.fill || C.yellow, opts.rot || 0), 'shape');
  }
  /* 'n Prent met baie vorms deurmekaar om te tel */
  function shapeScene(list) {
    // list: [{type, fill}]
    var cols = Math.ceil(Math.sqrt(list.length * 1.6)), cell = 74;
    var rows = Math.ceil(list.length / cols), body = '';
    list.forEach(function (it, i) {
      var cx = cell / 2 + (i % cols) * cell + U.rnd(-6, 6), cy = cell / 2 + Math.floor(i / cols) * cell + U.rnd(-6, 6);
      var sz = it.type === 'reghoek' || it.type === 'ovaal' ? 36 : 46;
      body += shapeEl(it.type, cx, cy, sz, it.fill, it.rot || 0);
    });
    return svg(cols * cell, rows * cell, body, 'scene');
  }

  /* ---------- Geld ---------- */
  var COIN = {
    5: { l: '5c', r: 24, f: '#d9a441', s: '#a87b2a' }, 10: { l: '10c', r: 25, f: '#d9a441', s: '#a87b2a' },
    20: { l: '20c', r: 28, f: '#d9a441', s: '#a87b2a' }, 50: { l: '50c', r: 31, f: '#d9a441', s: '#a87b2a' },
    100: { l: 'R1', r: 30, f: '#cfd8dc', s: '#78909c' }, 200: { l: 'R2', r: 33, f: '#cfd8dc', s: '#78909c' },
    500: { l: 'R5', r: 35, f: '#cfd8dc', s: '#78909c', inner: '#e0b84d' }
  };
  var NOTE = {
    1000: { l: 'R10', f: '#66bb6a', a: '🦏' }, 2000: { l: 'R20', f: '#c9895a', a: '🐘' },
    5000: { l: 'R50', f: '#ef5350', a: '🦁' }, 10000: { l: 'R100', f: '#7e57c2', a: '🐃' },
    20000: { l: 'R200', f: '#ffa726', a: '🐆' }
  };
  function moneyLabel(cents) {
    if (cents < 100) return cents + 'c';
    return 'R' + (cents / 100);
  }
  function coinEl(cents, cx, cy) {
    var c = COIN[cents], b = '';
    b += '<circle cx="' + cx + '" cy="' + cy + '" r="' + c.r + '" fill="' + c.f + '" stroke="' + c.s + '" stroke-width="3"/>';
    if (c.inner) b += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (c.r * 0.62) + '" fill="' + c.inner + '" stroke="' + c.s + '" stroke-width="1.5"/>';
    else b += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (c.r - 5) + '" fill="none" stroke="' + c.s + '" stroke-width="1.2" stroke-dasharray="2 3"/>';
    b += txt(cx, cy + 1, c.l, c.r * 0.62, '#3e2723', 'font-weight="700"');
    return b;
  }
  function noteEl(cents, x, y) {
    var n = NOTE[cents], b = '';
    b += '<rect x="' + x + '" y="' + y + '" width="132" height="66" rx="7" fill="' + n.f + '" stroke="rgba(0,0,0,.35)" stroke-width="2"/>';
    b += '<rect x="' + (x + 5) + '" y="' + (y + 5) + '" width="122" height="56" rx="5" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5"/>';
    b += txt(x + 40, y + 34, n.l, 24, '#fff', 'font-weight="700" stroke="rgba(0,0,0,.35)" stroke-width="0.8"');
    b += txt(x + 100, y + 34, n.a, 28);
    return b;
  }
  /* 'n Ry geldstukke en note. list = bedrae in sent */
  function money(list) {
    var x = 6, body = '', h = 80;
    list.forEach(function (v) {
      if (NOTE[v]) { body += noteEl(v, x, 7); x += 140; }
      else { var r = COIN[v].r; body += coinEl(v, x + r, 40); x += 2 * r + 8; }
    });
    return svg(Math.max(x, 60), h, body, 'money');
  }

  /* ---------- Houers, skale, lengte ---------- */
  function glass(level, opts) {
    opts = opts || {};
    var w = opts.w || 80, h = opts.h || 120, body = '';
    var top = 10, bot = h - 6, lx = 10, rx = w - 10, inset = w * 0.12;
    var lvl = bot - (bot - top - 6) * level;
    if (level > 0) {
      var t = (lvl - top) / (bot - top);
      var l = lx + inset * t, r = rx - inset * t;
      body += '<path d="M' + l + ' ' + lvl + ' L' + r + ' ' + lvl + ' L' + (rx - inset) + ' ' + bot + ' L' + (lx + inset) + ' ' + bot + 'Z" fill="' + (opts.colour || '#4fc3f7') + '" opacity="0.85"/>';
    }
    body += '<path d="M' + lx + ' ' + top + ' L' + (lx + inset) + ' ' + bot + ' L' + (rx - inset) + ' ' + bot + ' L' + rx + ' ' + top + '" fill="none" stroke="' + C.ink + '" stroke-width="3.5" stroke-linejoin="round"/>';
    return svg(w, h, body, 'glass');
  }

  /* Weegskaal. tilt: -1 = links swaarder (onder), 0 = gelyk, 1 = regs swaarder */
  function balance(left, right, tilt) {
    var w = 340, h = 200, cx = 170, body = '';
    var ang = tilt * 12;
    var rad = ang * Math.PI / 180, arm = 120;
    var lx = cx - arm * Math.cos(rad), ly = 70 - arm * Math.sin(rad);
    var rx = cx + arm * Math.cos(rad), ry = 70 + arm * Math.sin(rad);
    body += '<polygon points="' + cx + ',70 ' + (cx - 26) + ',190 ' + (cx + 26) + ',190" fill="#8d6e63"/>';
    body += '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="#5d4037" stroke-width="8" stroke-linecap="round"/>';
    [[lx, ly, left], [rx, ry, right]].forEach(function (p) {
      body += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (p[1] + 40) + '" stroke="#5d4037" stroke-width="2"/>';
      body += '<path d="M' + (p[0] - 50) + ' ' + (p[1] + 40) + ' Q' + p[0] + ' ' + (p[1] + 70) + ' ' + (p[0] + 50) + ' ' + (p[1] + 40) + 'Z" fill="#ffcc80" stroke="#5d4037" stroke-width="2"/>';
      body += txt(p[0], p[1] + 20, p[2], p[2].length > 3 ? 22 : 34);
    });
    body += '<circle cx="' + cx + '" cy="70" r="7" fill="#3e2723"/>';
    return svg(w, h, body, 'balance');
  }

  /* Trein met 'n aantal waens (vir langer/korter) */
  function train(len, colour) {
    var cw = 36, body = '', w = 44 + len * (cw + 4) + 8, h = 54;
    body += '<rect x="4" y="8" width="40" height="30" rx="6" fill="' + C.ink + '"/>';
    body += '<rect x="10" y="0" width="12" height="12" fill="' + C.ink + '"/>';
    body += '<circle cx="14" cy="44" r="7" fill="#555"/><circle cx="34" cy="44" r="7" fill="#555"/>';
    for (var i = 0; i < len; i++) {
      var x = 48 + i * (cw + 4);
      body += '<rect x="' + x + '" y="12" width="' + cw + '" height="26" rx="4" fill="' + colour + '" stroke="' + C.ink + '" stroke-width="2"/>';
      body += '<circle cx="' + (x + 9) + '" cy="44" r="6" fill="#555"/><circle cx="' + (x + cw - 9) + '" cy="44" r="6" fill="#555"/>';
    }
    return svg(w, h, body, 'train');
  }

  /* Potlood/lint van 'len' eenhede met blokkies onder (om te meet) */
  function measure(len, opts) {
    opts = opts || {};
    var u = 40, w = len * u + 50, h = opts.blocks === false ? 60 : 110, body = '';
    var x0 = 10, y0 = 14;
    // potlood
    body += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (len * u - 26) + '" height="30" fill="' + (opts.colour || C.yellow) + '" stroke="' + C.ink + '" stroke-width="2"/>';
    body += '<rect x="' + x0 + '" y="' + y0 + '" width="12" height="30" fill="#f48fb1" stroke="' + C.ink + '" stroke-width="2"/>';
    body += '<polygon points="' + (x0 + len * u - 26) + ',' + y0 + ' ' + (x0 + len * u) + ',' + (y0 + 15) + ' ' + (x0 + len * u - 26) + ',' + (y0 + 30) + '" fill="#ffe0b2" stroke="' + C.ink + '" stroke-width="2"/>';
    body += '<polygon points="' + (x0 + len * u - 8) + ',' + (y0 + 11) + ' ' + (x0 + len * u) + ',' + (y0 + 15) + ' ' + (x0 + len * u - 8) + ',' + (y0 + 19) + '" fill="' + C.ink + '"/>';
    if (opts.blocks !== false) {
      for (var i = 0; i < len; i++) {
        body += '<rect x="' + (x0 + i * u + 2) + '" y="' + (y0 + 46) + '" width="' + (u - 4) + '" height="' + (u - 4) + '" rx="4" fill="' + RAINBOW[i % 6] + '" stroke="' + C.ink + '" stroke-width="1.5"/>';
      }
    }
    return svg(w, h, body, 'measure');
  }

  /* ---------- Verdubbel: skoenlapper ---------- */
  function butterfly(n, opts) {
    opts = opts || {};
    var body = '', w = 300, h = 200, cx = 150;
    var wingL = '<path d="M' + cx + ' 100 C 40 0, 0 60, 30 110 C 0 150, 60 210, ' + cx + ' 110Z" fill="#ffcc80" stroke="' + C.ink + '" stroke-width="3"/>';
    var wingR = '<path d="M' + cx + ' 100 C 260 0, 300 60, 270 110 C 300 150, 240 210, ' + cx + ' 110Z" fill="#ffcc80" stroke="' + C.ink + '" stroke-width="3"/>';
    body += wingL + wingR;
    var spots = [[95, 60], [65, 80], [110, 85], [80, 105], [55, 120], [105, 125], [75, 145], [115, 150], [90, 170], [60, 95], [120, 60], [40, 100]];
    for (var i = 0; i < n && i < spots.length; i++) {
      body += '<circle cx="' + spots[i][0] + '" cy="' + spots[i][1] + '" r="9" fill="' + C.purple + '"/>';
      if (opts.mirror !== false) body += '<circle cx="' + (2 * cx - spots[i][0]) + '" cy="' + spots[i][1] + '" r="9" fill="' + C.purple + '"/>';
    }
    body += '<ellipse cx="' + cx + '" cy="105" rx="9" ry="52" fill="' + C.ink + '"/>';
    body += '<path d="M' + (cx - 3) + ' 58 Q ' + (cx - 20) + ' 25 ' + (cx - 28) + ' 22 M' + (cx + 3) + ' 58 Q ' + (cx + 20) + ' 25 ' + (cx + 28) + ' 22" stroke="' + C.ink + '" stroke-width="3" fill="none"/>';
    return svg(w, h, body, 'bfly');
  }

  /* ---------- Prentgrafiek ---------- */
  function pictograph(rows, opts) {
    opts = opts || {};
    var html = '<table class="pgraph">';
    rows.forEach(function (r) {
      var cells = '';
      for (var i = 0; i < r.n; i++) cells += '<span>' + (opts.symbol || r.e) + '</span>';
      html += '<tr><th>' + r.e + '<small>' + U.esc(r.label) + '</small></th><td>' + cells + '</td></tr>';
    });
    html += '</table>';
    if (opts.title) html = '<div class="pgtitle">' + U.esc(opts.title) + '</div>' + html;
    if (opts.key) html += '<div class="pgkey">' + U.esc(opts.key) + '</div>';
    return html;
  }

  /* ---------- Simmetrie: blokkiesrooster ---------- */
  /* m = matriks van 0/1, colour, opts.line: 'left'|'right' om 'n stippellyn te trek */
  function cells(m, colour, opts) {
    opts = opts || {};
    var cs = 30, rows = m.length, cols = m[0].length, body = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      body += '<rect x="' + (4 + c * cs) + '" y="' + (4 + r * cs) + '" width="' + cs + '" height="' + cs + '" fill="' + (m[r][c] ? colour : '#fff') + '" stroke="#90a4ae" stroke-width="1.5"/>';
    }
    if (opts.line) {
      var lx = opts.line === 'right' ? 4 + cols * cs : 4;
      body += '<line x1="' + lx + '" y1="0" x2="' + lx + '" y2="' + (rows * cs + 8) + '" stroke="' + C.red + '" stroke-width="4" stroke-dasharray="7 5"/>';
    }
    return svg(cols * cs + 8, rows * cs + 8, body, 'cells');
  }

  /* ---------- Pyle ---------- */
  function arrow(dir, colour) {
    var rot = { regs: 0, ondertoe: 90, links: 180, boontoe: 270 }[dir];
    var body = '<g transform="rotate(' + rot + ' 50 50)"><path d="M12 40 H58 V22 L90 50 L58 78 V60 H12Z" fill="' + (colour || C.blue) + '" stroke="' + C.ink + '" stroke-width="3" stroke-linejoin="round"/></g>';
    return svg(100, 100, body, 'arrow');
  }

  /* ---------- Toneel met posisies (emoji op persentasie-posisies) ---------- */
  function stage(items, h) {
    var html = '<div class="stage" style="height:' + (h || 220) + 'px">';
    items.forEach(function (it) {
      html += '<span style="left:' + it.x + '%;top:' + it.y + '%;font-size:' + (it.size || 64) + 'px;z-index:' + (it.z || 1) +
        (it.flip ? ';transform:translate(-50%,-50%) scaleX(-1)' : '') + '">' + it.e + '</span>';
    });
    return html + '</div>';
  }

  /* Ry diere of dinge met opsionele merk-blokkies bo */
  function row(list, opts) {
    opts = opts || {};
    return '<div class="erow ' + (opts.cls || '') + '">' + list.map(function (e, i) {
      return '<span class="' + (opts.mark === i ? 'mark' : '') + '">' + e + '</span>';
    }).join('') + '</div>';
  }

  function blockRow(n, greenAt) {
    var body = '';
    for (var i = 0; i < n; i++) {
      body += '<rect x="' + (6 + i * 74) + '" y="6" width="62" height="40" rx="6" fill="' + (i === greenAt ? C.green : '#eceff1') + '" stroke="' + C.ink + '" stroke-width="2"/>';
    }
    return svg(n * 74 + 6, 52, body, 'blocks');
  }

  /* 2D-vorms of 3D-voorwerpe as kaartjies */
  function solid(type) {
    // 3D: bal, boks (kubus), blik (silinder), keël, piramide
    var body = '', w = 110, h = 110;
    switch (type) {
      case 'bal':
        body += '<circle cx="55" cy="55" r="44" fill="url(#gb)" stroke="' + C.ink + '" stroke-width="3"/>' +
          '<defs><radialGradient id="gb" cx="35%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="' + C.red + '"/></radialGradient></defs>';
        break;
      case 'boks':
        body += '<polygon points="20,40 70,40 70,95 20,95" fill="#ffb74d" stroke="' + C.ink + '" stroke-width="3"/>' +
          '<polygon points="20,40 42,18 92,18 70,40" fill="#ffe0b2" stroke="' + C.ink + '" stroke-width="3"/>' +
          '<polygon points="70,40 92,18 92,73 70,95" fill="#fb8c00" stroke="' + C.ink + '" stroke-width="3"/>';
        break;
      case 'blik':
        body += '<path d="M25 25 V85 A30 10 0 0 0 85 85 V25" fill="#81d4fa" stroke="' + C.ink + '" stroke-width="3"/>' +
          '<ellipse cx="55" cy="25" rx="30" ry="10" fill="#e1f5fe" stroke="' + C.ink + '" stroke-width="3"/>';
        break;
      case 'keel':
        body += '<path d="M55 12 L88 88 A33 10 0 0 1 22 88Z" fill="#aed581" stroke="' + C.ink + '" stroke-width="3"/>';
        break;
      case 'piramide':
        body += '<polygon points="55,12 15,90 70,98" fill="#fff176" stroke="' + C.ink + '" stroke-width="3"/>' +
          '<polygon points="55,12 70,98 98,80" fill="#fbc02d" stroke="' + C.ink + '" stroke-width="3"/>';
        break;
    }
    return svg(w, h, body, 'solid');
  }

  return {
    C: C, RAINBOW: RAINBOW, svg: svg, txt: txt, objs: objs, mixed: mixed, groups: groups, twoBoxes: twoBoxes,
    beads: beads, tenFrames: tenFrames, numberLine: numberLine, numberGrid: numberGrid,
    shape: shape, shapeEl: shapeEl, shapeScene: shapeScene, money: money, moneyLabel: moneyLabel,
    COIN: COIN, NOTE: NOTE, glass: glass, balance: balance, train: train, measure: measure,
    butterfly: butterfly, pictograph: pictograph, cells: cells, arrow: arrow, stage: stage, row: row,
    blockRow: blockRow, solid: solid
  };
})();
