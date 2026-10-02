const CACHE = "evolley-shell-1";

self.addEventListener("install", (ev) => {
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;
  let path = "";
  try { path = new URL(ev.request.url).pathname || ""; } catch (e) { return; }
  if (path.indexOf("/assets/") === 0) return;
  ev.respondWith(fetch(ev.request));
});
