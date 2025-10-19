// ---- PWA Offline básico para Yeah App ----
const CACHE_VERSION = "v1.0.0"; // ⬅️ súbelo cuando cambies assets
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Rutas que NO deben pasar por SW (auth/api)
const BYPASS = [/^\/auth\//, /^\/api\//];

// Archivos estáticos "conocidos" para precache (opcional, mantiene iconos listos)
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Instalar: precache de esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (![STATIC_CACHE, RUNTIME_CACHE].includes(key)) {
          return caches.delete(key);
        }
      }))
    )
  );
  return self.clients.claim();
});

// Estrategias:
// - BYPASS: ir directo a red (auth/api)
// - Assets estáticos: Cache First
// - HTML/pages: Network First con fallback a caché si hay
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET
  if (request.method !== "GET") return;

  // Bypass rutas sensibles
  if (BYPASS.some((re) => re.test(url.pathname))) return;

  // HTML/pages -> Network First
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(event));
    return;
  }

  // Estáticos (imgs, css, js, fuentes) -> Cache First
  if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  // Resto -> Network First por defecto
  event.respondWith(networkFirst(event));
});

async function cacheFirst(event) {
  const { request } = event;
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    // sólo cachea respuestas OK
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(event) {
  const { request } = event;
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    return cached || new Response("Sin conexión y sin caché disponible.", { status: 503 });
  }
}
