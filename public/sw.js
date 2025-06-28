/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

const CACHE_NAME = "tripflow-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activation du service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourne la ressource mise en cache ou va la chercher sur le réseau
      return response || fetch(event.request);
    })
  );
});

// Notification pour l'installation
self.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  // Stocker l'événement pour l'utiliser plus tard
  window.deferredPrompt = event;
});
