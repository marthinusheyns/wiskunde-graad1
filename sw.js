/* Diensbode: hou die app vanlyn beskikbaar nadat dit een keer gelaai is. */
var CACHE = 'wiskunde-gr1-v2';
var AUDIO = 'wiskunde-gr1-audio-v1'; // stemgrepies verander nooit (die naam is 'n hash van die teks)
var SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/util.js', 'js/af.js', 'js/visuals.js', 'js/gen-number.js', 'js/gen-ops.js', 'js/gen-measure.js',
  'js/gen-space.js', 'js/gen-money-data.js', 'js/curriculum.js', 'js/store.js', 'js/audio.js', 'js/trace.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
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
  if (url.origin !== location.origin && !isFont) return;
  // Stemgrepies: kas eerste (hulle verander nooit nie)
  if (/\/audio\/[0-9a-f]{8}\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.open(AUDIO).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) { if (res.ok) c.put(e.request, res.clone()); return res; });
      });
    }));
    return;
  }
  // Netwerk eerste vir ons eie lêers (sodat opdaterings deurkom), kas as daar geen netwerk is nie
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); })
  );
});
