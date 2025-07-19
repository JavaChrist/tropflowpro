/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

const CACHE_NAME = "tropflow-pro-v2";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installation en cours...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Cache ouvert");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("[SW] Installation terminée");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Erreur lors de l'installation:", error);
      })
  );
});

// Activation du service worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation en cours...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Suppression du cache obsolète:", cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => {
        console.log("[SW] Activation terminée");
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("[SW] Erreur lors de l'activation:", error);
      })
  );
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== "GET") {
    return;
  }

  // Ignorer les requêtes vers des domaines externes
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("[SW] Réponse depuis le cache:", event.request.url);
        return response;
      }

      console.log("[SW] Récupération depuis le réseau:", event.request.url);
      return fetch(event.request)
        .then((response) => {
          // Vérifier si la réponse est valide
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Cloner la réponse pour la mettre en cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error("[SW] Erreur de récupération:", error);
          // Retourner une réponse par défaut si disponible
          return caches.match("/");
        });
    })
  );
});
