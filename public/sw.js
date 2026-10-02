/* Bon Prix Ruisseau — Service Worker minimal et sûr.
 * - Ne touche JAMAIS à /api/* (commandes, suivi, logins) : toujours réseau.
 * - Ne touche JAMAIS aux autres domaines (Pexels, Supabase, Wikimedia).
 * - Pages : réseau d'abord, cache en secours (marche hors-ligne partiel).
 * - Statiques + images : cache d'abord, révalidé en arrière-plan (fluide).
 * Bump CACHE à chaque gros changement pour forcer le rafraîchissement.
 */
const CACHE = "bpr-v2";
const CORE = ["/", "/vetements", "/logo.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Sécurité : que notre origine, jamais l'API.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations : réseau d'abord (toujours frais), cache en secours offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match("/"))
        )
    );
    return;
  }

  // Statiques/images : cache immédiat + révalidation silencieuse.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches
              .open(CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
