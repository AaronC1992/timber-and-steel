const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");

function worker(scope = "https://example.test/timber-and-steel/") {
  const handlers = {}, stores = new Map(), requests = [];
  let online = true, claimed = false;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(batch) {
          for (const request of batch) {
            assert.equal(request.cache, "reload");
            const relative = new URL(request.url).pathname.slice(new URL(scope).pathname.length);
            assert.ok(fs.existsSync(path.join(__dirname, "..", relative)), `Precached file exists: ${relative}`);
            entries.set(request.url, new Response(`cached:${relative}`));
          }
        },
        async match(url) { return entries.get(url)?.clone(); }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };
  vm.runInNewContext(source, {
    URL, Request, caches,
    self: { registration: { scope }, clients: { claim: async () => { claimed = true; } },
      addEventListener: (name, handler) => { handlers[name] = handler; } },
    fetch: async request => {
      requests.push(request.url);
      if (!online) throw new Error("Network offline");
      return new Response("network");
    }
  });
  async function lifecycle(name) {
    let pending;
    handlers[name]({ waitUntil: promise => { pending = promise; } });
    await pending;
  }
  return {
    stores, requests, lifecycle, get claimed() { return claimed; },
    setOffline() { online = false; },
    async request(url, mode = "navigate", method = "GET") {
      let response;
      handlers.fetch({ request: { url, mode, method }, respondWith: promise => { response = promise; } });
      return response;
    },
    async ready() {
      let pending, result;
      handlers.message({ data: "offline-status", ports: [{ postMessage: message => { result = message.ready; } }],
        waitUntil: promise => { pending = promise; } });
      await pending;
      return result;
    }
  };
}

test("complete shell reopens offline at root and Pages subpath, including query URLs", async () => {
  for (const scope of ["https://example.test/", "https://example.test/timber-and-steel/"]) {
    const api = worker(scope);
    await api.lifecycle("install"); await api.lifecycle("activate");
    assert.equal(api.claimed, true);
    assert.equal(await api.ready(), true);
    api.setOffline();
    for (const url of [scope, `${scope}?source=installed`, `${scope}index.html?launch=1`]) {
      assert.equal(await (await api.request(url)).text(), "cached:index.html");
    }
    for (const asset of ["game.js", "pwa.js", "style.css", "icons/icon-192.png", "icons/icon-512.png", "manifest.webmanifest"]) {
      assert.equal(await (await api.request(`${scope}${asset}?version=1`, "cors")).text(), `cached:${asset}`);
    }
    assert.equal(api.requests.length, 0);
    const entries = [...api.stores.values()][0];
    entries.delete(`${scope}game.js`);
    assert.equal(await api.ready(), false);
  }
});

test("worker only handles its own shell and activation leaves other apps' caches untouched", async () => {
  const api = worker();
  api.stores.set("timber-and-steel:https://example.test/timber-and-steel/:old", new Map());
  api.stores.set("timber-and-steel:https://example.test/other-game/:v1", new Map());
  api.stores.set("unrelated-cache", new Map());
  await api.lifecycle("install"); await api.lifecycle("activate");
  assert.equal(api.stores.has("timber-and-steel:https://example.test/timber-and-steel/:old"), false);
  assert.equal(api.stores.has("timber-and-steel:https://example.test/other-game/:v1"), true);
  assert.equal(api.stores.has("unrelated-cache"), true);
  for (const url of ["https://other.test/game.js", "https://example.test/other-game/", "https://example.test/timber-and-steel/unknown"]) {
    assert.equal(await api.request(url), undefined);
  }
  assert.equal(await api.request("https://example.test/timber-and-steel/game.js", "cors", "POST"), undefined);
});

test("manifest launches within the deployment directory and icons have the declared PNG dimensions", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.webmanifest"), "utf8"));
  for (const scope of ["https://example.test/", "https://example.test/timber-and-steel/"]) {
    assert.equal(new URL(manifest.start_url, scope).href, scope);
    assert.equal(new URL(manifest.scope, scope).href, scope);
  }
  assert.equal(manifest.display, "standalone");
  for (const icon of [...manifest.icons, { src: "icons/apple-touch-icon.png", sizes: "180x180" }]) {
    const data = fs.readFileSync(path.join(__dirname, "..", icon.src));
    assert.equal(data.subarray(1, 4).toString(), "PNG");
    assert.equal(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`, icon.sizes);
  }
});
