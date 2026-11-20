/* Daily Cooking service worker: cache the app shell and recipe data
   on first load, then serve them offline. No network calls at runtime
   except links out to Vismai Food, which the user taps. */
var CACHE = "daily-cooking-v1";
var FILES = ["./", "./index.html", "./styles.css", "./app.js", "./recipes.json", "./manifest.json", "./icons/icon.svg"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        if (response && response.ok && event.request.url.indexOf(self.location.origin) === 0) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () { return cached; });
    })
  );
});
