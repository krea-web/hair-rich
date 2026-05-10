/**
 * Hair Rich · Service Worker
 *
 * Strategia:
 * - HTML: network-first con fallback offline (per pages già visitate o offline.html)
 * - Asset statici (CSS/JS/font/img): cache-first con stale-while-revalidate
 * - API/dynamic: network-only
 *
 * Versione cache: cambia il valore di CACHE_NAME quando vuoi invalidare.
 */
const CACHE_NAME = "hairrich-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [
    "/",
    "/offline",
    "/manifest.webmanifest",
    "/hairrich-logoesteso.png",
    "/logo-icona.png",
    "/icon-192.png",
    "/icon-512.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // skip cross-origin

    // Skip /admin and /profilo (sensibili, sempre fresh)
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/profilo")) return;

    const isHTML = req.mode === "navigate" || req.destination === "document";

    if (isHTML) {
        // Network-first
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                    return res;
                })
                .catch(async () => {
                    const cached = await caches.match(req);
                    if (cached) return cached;
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // Static assets: cache-first + revalidate
    event.respondWith(
        caches.match(req).then((cached) => {
            const networkPromise = fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === "basic") {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || networkPromise;
        })
    );
});

// Push notifications opt-in (placeholder per future booking reminders)
self.addEventListener("push", (event) => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || "Hair Rich", {
            body: data.body || "",
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            data: data.url || "/",
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event.notification.data || "/"));
});
