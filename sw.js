/* Daily Cooking service worker: cache the app shell and recipe data
   on first load, then serve them offline. No network calls at runtime
   except links out to Vismai Food, which the user taps. */

var CACHE = "daily-cooking-v4";
var FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./recipes.json",
  "./manifest.json",
  "./icons/icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(FILES);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var request = event.request;
  var sameOrigin = request.url.indexOf(self.location.origin) === 0;

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.ok && sameOrigin) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return cached;
      });
    })
  );
});
