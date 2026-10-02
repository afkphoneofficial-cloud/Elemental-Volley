const CACHE = "evolley-shell-1";

self.addEventListener("install", (ev) => {
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    fetch(ev.request).catch(() => caches.match(ev.request).then((hit) => hit || Response.error()))
  );
});
