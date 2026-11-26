"use strict";

// Bump the version whenever a shipped file changes. Updates wait for all game tabs to close.
const CACHE_PREFIX = `timber-and-steel:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const ASSETS = ["index.html", "style.css", "game.js", "pwa.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"]
  .map(path => new URL(path, self.registration.scope).href);
const INDEX = ASSETS[0];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(ASSETS.map(url => new Request(url, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const canonical = url.origin + url.pathname;
  const navigation = request.mode === "navigate" && (canonical === self.registration.scope || canonical === INDEX);
  if (!navigation && !ASSETS.includes(canonical)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(navigation ? INDEX : canonical);
    return cached || fetch(request);
  })());
});

self.addEventListener("message", event => {
  if (event.data !== "offline-status" || !event.ports[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const entries = await Promise.all(ASSETS.map(url => cache.match(url)));
    event.ports[0].postMessage({ ready: entries.every(Boolean) });
  })());
});
