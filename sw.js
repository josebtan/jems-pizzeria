// Service Worker de JEMS Gestión.
// Estrategia: "network-first" para los archivos propios de la app (así las
// actualizaciones que subimos se ven de inmediato con internet), con caché
// como respaldo para que la app abra aunque no haya señal.
// Los archivos externos (Firebase, Google Fonts) se dejan pasar directo a la red.

const CACHE_NAME = "jems-shell-v5";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css?v=7",
  "./js/app.js",
  "./js/data.js",
  "./js/firebase-config.js",
  "./js/firebase-init.js",
  "./js/insumos.js",
  "./js/recetas.js",
  "./js/ventas.js",
  "./assets/logo.png",
  "./assets/mascota-compras.webp",
  "./assets/mascota-calculadora.webp",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.warn("[SW] Error precacheando:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo manejamos GET del mismo origen (nuestros propios archivos).
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
  );
});
