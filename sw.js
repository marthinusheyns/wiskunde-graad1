/* Diensbode: hou die app vanlyn beskikbaar nadat dit een keer gelaai is. */
var VERSION = '1.16'; // = W.VERSION in js/util.js: verhoog altwee by elke uitgawe
var CACHE = 'wiskunde-gr1-' + VERSION;
var AUDIO = 'wiskunde-gr1-audio-v1'; // stemgrepies verander nooit (die naam is 'n hash van die teks)
var SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/util.js', 'js/af.js', 'js/visuals.js', 'js/gen-number.js', 'js/gen-ops.js', 'js/gen-measure.js',
  'js/gen-space.js', 'js/gen-money-data.js', 'js/curriculum.js', 'js/tutor-data.js', 'js/tutor-lessons.js',
  'js/store.js', 'js/audio.js', 'js/trace.js', 'js/tutor.js', 'js/install.js', 'js/notes.js', 'js/update.js', 'js/stats.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

/* GitHub Pages se CDN hou elke lêer tot 10 minute lank, en elkeen verval op 'n ander tyd. Net ná 'n uitgawe kon
   "Laai dit" dus 'n nuwe util.js maar 'n ou app.js kry. Daarom vra ons ons eie lêers met die weergawe in die adres
   (js/app.js?v=1.15): elke weergawe het eie adresse, wat die CDN nog nie het nie, so dit kom vars van die bediener.
   Die weergawe kom van die bladsy se adres (ná "Laai dit": ./?v=1.15, sien js/update.js), anders van hierdie lêer. */
function versioned(path, v) { return path + (path.indexOf('?') < 0 ? '?' : '&') + 'v=' + encodeURIComponent(v); }
function pageVersion(req) {
  try { return new URL(req.referrer).searchParams.get('v') || VERSION; } catch (e) { return VERSION; }
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (f) {
      return fetch(new Request(versioned(f, VERSION), { cache: 'no-cache' })).then(function (res) {
        if (!res.ok) throw new Error(f);
        return c.put(f, res);
      });
    }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== AUDIO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  var isStem = url.hostname === 'wiskunde-stem.azurewebsites.net' && url.pathname === '/api/say' && url.searchParams.has('t');
  if (url.origin !== location.origin && !isFont && !isStem) return;
  // Stemgrepies, ook dié van die stembediener: kas eerste (hulle verander nooit nie)
  if (isStem || /\/audio\/[0-9a-f]{8}\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.open(AUDIO).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) { if (res.ok) c.put(e.request, res.clone()); return res; });
      });
    }));
    return;
  }
  // Netwerk eerste vir ons eie lêers (sodat opdaterings deurkom), kas as daar geen netwerk is nie.
  // 'no-cache': vra die bediener elke keer of 'n lêer verander het (goedkoop, meestal "304 onveranderd"),
  // anders kan die blaaier 'n ou lêer tot 10 minute lank uit sy eie kas gee. Met die weergawe in die adres (sien bo).
  var own = url.origin === location.origin && e.request.mode !== 'navigate';
  var fresh = !own ? fetch(e.request)
    : fetch(new Request(url.search ? url.href : versioned(url.href, pageVersion(e.request)), { cache: 'no-cache', credentials: 'same-origin' }));
  e.respondWith(
    fresh.then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); })
  );
});
