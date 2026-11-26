const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");

function loadGame(seed = 1, stored = null, device = {}) {
  let value = seed;
  const math = Object.create(Math);
  math.random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const gradient = { addColorStop() {} };
  const translations = [];
  const drawing = new Proxy({}, { get: (_, key) => key === "translate" ? (...args) => translations.push(args) : key.startsWith("create") ? () => gradient : () => {} });
  const offscreenDrawing = new Proxy({}, { get: (_, key) => key.startsWith("create") ? () => gradient : () => {} });
  const elements = new Map();
  const frames = new Map();
  let nextFrame = 0, paints = 0, canvasCount = 0;
  const documentListeners = {}, windowListeners = {};
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      dataset: {}, style: { setProperty(key, value) { this[key] = value; } }, classList: { add() {}, remove() {}, toggle() {} },
      listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; },
      querySelectorAll: () => [], getContext: () => drawing, textContent: "", innerHTML: ""
    });
    return elements.get(id);
  }
  const storage = {
    value: stored, fail: false,
    getItem() { return this.value; },
    setItem(key, value) { if (this.fail) throw new Error("Storage blocked"); this.value = value; }
  };
  const context = vm.createContext({
    Math: math, console, Event, countPaint: () => paints++,
    window: { navigator: device, devicePixelRatio: device.dpr || 1, addEventListener: (name, callback) => { windowListeners[name] = callback; },
      matchMedia: () => ({ matches: device.reducedMotion || false }) },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    setInterval: () => 1, clearInterval() {},
    getComputedStyle: () => ({ paddingLeft: "20px", paddingRight: "20px", paddingTop: "30px", paddingBottom: "30px" }),
    document: { hidden: false, documentElement: element("root"), getElementById: element, querySelector: element,
      createElement: () => { const canvas = element(`canvas-${++canvasCount}`); canvas.getContext = () => offscreenDrawing; return canvas; }, dispatchEvent() {},
      addEventListener: (name, callback) => { documentListeners[name] = callback; } },
    localStorage: storage
  });
  // Expose the closure only in this in-memory test copy, not in the browser game.
  const instrumented = source.replace(
    "applyGraphics(); updateSide(); menu(); requestFrame();",
    "applyGraphics(); globalThis.api = { game, bonusMoney, config, rewards, fitScreen, render, startStage, update, throwKnife, changeRotation, pause, audio, shopItem, itemDetail, collection, startRun, selectLevel, knives, logs, tracks, themes, modifiers, activeTheme, drawKnife, drawLog, drawBackground, drawShopPreview, drawTarget, findDummyHit, dummyParts, detachLimb, dummyWorld, victory, menu, resetProfile, confirmReset, detectGraphics, changePerformance, frameRate, resizeCanvas, performanceSettings, woodTextures, logSprites, backgrounds, dummySparks, setVisualTime: time => visualTime = time, getSave: () => save };"
  );
  vm.runInContext(instrumented.replace("globalThis.api = {", "globalThis.api = { dummySkins, drawDummyPart, drawDummySkin,")
    .replace("function render() {", "function render() { globalThis.countPaint();"), context);
  context.api.audio.init = () => {};
  context.api.storage = storage;
  context.api.element = element;
  context.api.translations = translations;
  context.api.tick = time => {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  };
  context.api.pendingFrames = () => frames.size;
  context.api.hide = hidden => { context.document.hidden = hidden; documentListeners.visibilitychange(); };
  context.api.pageEvent = name => windowListeners[name]();
  context.api.getPaints = () => paints;
  return context.api;
}

const STEP = 1 / 120;
test("device detection is conservative and saved overrides survive reload and reset", () => {
  const api = loadGame();
  for (const device of [{ hardwareConcurrency: 2 }, { hardwareConcurrency: 4 }, { deviceMemory: 2 }, { hardwareConcurrency: 16, deviceMemory: 16, connection: { saveData: true } }]) {
    assert.equal(api.detectGraphics(device), "low");
  }
  assert.equal(api.detectGraphics({ hardwareConcurrency: 8, deviceMemory: 8 }), "high");
  assert.equal(api.detectGraphics({}), "medium");
  assert.equal(api.detectGraphics({ hardwareConcurrency: 16 }), "medium");
  assert.equal(api.changePerformance("graphics", "low"), true);
  assert.equal(api.frameRate(), 30);
  assert.equal(api.changePerformance("frameRate", "60"), true);
  assert.equal(api.frameRate(), 60);
  const restored = loadGame(1, api.storage.value, { hardwareConcurrency: 16, deviceMemory: 8 });
  assert.equal(restored.getSave().graphics, "low");
  assert.equal(restored.frameRate(), 60);
  restored.storage.fail = true;
  assert.equal(restored.changePerformance("graphics", "high"), false);
  assert.equal(restored.getSave().graphics, "low");
  assert.equal(restored.changePerformance("frameRate", "999"), false);
  restored.storage.fail = false; restored.resetProfile();
  assert.equal(restored.getSave().graphics, "auto");
  assert.equal(restored.frameRate(), 120);
  const corrupt = loadGame(1, JSON.stringify({ graphics: "__proto__", frameRate: -1 }));
  assert.equal(corrupt.getSave().graphics, "auto");
  assert.equal(corrupt.frameRate(), 60);
});

test("paint limits and simulation outcomes are independent of graphics and display refresh", () => {
  const outcomes = [];
  for (const [graphics, fps, refresh] of [["low", 30, 60], ["low", 30, 144], ["medium", 60, 120], ["high", 120, 144]]) {
    const api = loadGame(5, JSON.stringify({ graphics }));
    api.startRun("classic"); api.tick(0); api.throwKnife();
    for (let frame = 1; frame <= refresh * 2; frame++) api.tick(frame * 1000 / refresh);
    assert.ok(api.getPaints() <= fps * 2 + 2, `${graphics}/${refresh}: ${api.getPaints()} paints`);
    assert.ok(api.getPaints() >= fps * 2 - 2, `${graphics}/${refresh}: paint limit should not halve frame rate`);
    outcomes.push([api.game.rotation, api.game.speed, api.game.landed, api.getSave().wallet, api.game.changeIn]);
  }
  for (const outcome of outcomes.slice(1)) assert.deepEqual(outcome, outcomes[0]);
});

test("hidden and paused games stop scheduling frames and never catch up after resuming", () => {
  const api = loadGame();
  api.startRun("dummy"); api.tick(0); api.throwKnife(); api.tick(50);
  const rotation = api.game.rotation, flight = api.game.flight.time;
  api.hide(true);
  assert.equal(api.game.state, "paused");
  assert.equal(api.pendingFrames(), 0);
  const paints = api.getPaints();
  api.tick(5000); api.throwKnife();
  assert.equal(api.getPaints(), paints);
  assert.equal(api.game.flight.time, flight);
  api.hide(false); api.tick(60000);
  assert.equal(api.game.rotation, rotation);
  assert.equal(api.game.flight.time, flight);
  assert.equal(api.pendingFrames(), 0);
  api.performanceSettings(true); api.tick(61000); api.update(.2);
  assert.equal(api.game.rotation, rotation);
  assert.equal(api.game.flight.time, flight);
  api.pageEvent("pagehide");
  assert.equal(api.pendingFrames(), 0);
  api.pageEvent("pageshow"); api.tick(62000);
  assert.equal(api.pendingFrames(), 0);
});

test("screen changes respect the paint cap and still render before becoming idle", () => {
  const api = loadGame(1, JSON.stringify({ graphics: "low" }));
  api.startStage(); api.tick(0);
  api.pause(); api.tick(5);
  assert.equal(api.getPaints(), 1);
  assert.equal(api.pendingFrames(), 1);
  api.tick(35);
  assert.equal(api.getPaints(), 2);
  assert.equal(api.pendingFrames(), 0);
});

test("low and reduced-motion menus sleep until the next interaction", () => {
  for (const [graphics, reducedMotion] of [["low", false], ["high", true]]) {
    const api = loadGame(1, JSON.stringify({ graphics }), { reducedMotion });
    api.menu(); api.tick(0);
    assert.equal(api.pendingFrames(), 0);
    api.startStage();
    assert.equal(api.pendingFrames(), 1);
    api.tick(30000);
    assert.equal(api.game.elapsed, 0);
    api.tick(30050);
    assert.ok(api.game.elapsed > 0 && api.game.elapsed <= .05);
  }
});

test("low graphics reduce bounded effects and reduced motion suppresses sparks", () => {
  const low = loadGame(1, JSON.stringify({ graphics: "low" }));
  const high = loadGame(1, JSON.stringify({ graphics: "high" }));
  low.dummySparks(100, 0); high.dummySparks(100, 0);
  assert.ok(low.game.particles.length <= high.game.particles.length / 3);
  for (let n = 0; n < 100; n++) { low.dummySparks(100, 0); high.dummySparks(100, 0); }
  assert.equal(low.game.particles.length, 24);
  assert.equal(high.game.particles.length, 100);
  const reduced = loadGame(1, null, { reducedMotion: true });
  reduced.dummySparks(100, 0);
  assert.equal(reduced.game.particles.length, 0);
});

test("artwork is lazy, reused, bounded, and resized without changing collision geometry", () => {
  const api = loadGame(1, JSON.stringify({ graphics: "low" }), { dpr: 3 });
  assert.equal(api.woodTextures.size, 0);
  assert.equal(api.logSprites.size, 0);
  api.render();
  assert.equal(api.woodTextures.size, 1);
  const first = api.logSprites.values().next().value;
  api.render();
  assert.equal(api.logSprites.values().next().value, first);
  for (let n = 0; n < api.logs.length; n++) api.drawLog(api.element("game").getContext(), n, 147, 1);
  assert.ok(api.woodTextures.size <= 4);
  assert.ok(api.logSprites.size <= 6);
  assert.equal(api.woodTextures.values().next().value.width, 256);
  api.startRun("classic");
  const radius = api.game.radius, rotation = api.game.rotation;
  api.element("game").clientWidth = 1920; api.element("game").clientHeight = 1080;
  api.resizeCanvas();
  assert.equal(api.element("game").width, 540);
  assert.equal(api.element("game").height, 675);
  api.changePerformance("graphics", "high");
  assert.equal(api.element("game").width, 1440);
  assert.equal(api.element("game").height, 1800);
  assert.equal(api.game.radius, radius); assert.equal(api.game.rotation, rotation);
  assert.equal(api.woodTextures.size, 0);
});

test("20 dummy skins preview safely, purchase once, persist, and reset", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 300000 }));
  assert.equal(api.dummySkins.length, 21);
  assert.equal(new Set(api.dummySkins.map(skin => skin.name)).size, 21);
  assert.equal(new Set(api.dummySkins.map(skin => skin.limb)).size, 21);
  const original = api.storage.value;
  api.itemDetail("dummy", 20);
  assert.equal(api.storage.value, original);
  assert.equal(api.getSave().selectedDummy, 0);
  let spent = 0;
  for (let index = 1; index <= 20; index++) {
    assert.equal(api.shopItem("dummy", index).ok, true);
    spent += api.dummySkins[index].price;
    assert.equal(api.getSave().wallet, 300000 - spent);
    assert.equal(api.getSave().selectedDummy, index);
  }
  api.shopItem("dummy", 1);
  assert.equal(api.getSave().wallet, 300000 - spent);
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().selectedDummy, 1);
  assert.equal(restored.getSave().ownedDummies.length, 21);
  restored.startRun("dummy");
  const geometry = JSON.stringify(restored.dummyParts);
  dummyAim(restored, Math.atan2(-50, 85));
  assert.equal(restored.game.stagePenalty, 25);
  assert.equal(JSON.stringify(restored.dummyParts), geometry);
  restored.resetProfile();
  assert.equal(restored.getSave().selectedDummy, 0);
  assert.deepEqual(Array.from(restored.getSave().ownedDummies), [0]);
});

test("dummy skin rendering keeps orange critical modules and matches shop artwork", () => {
  const api = loadGame();
  function recording() {
    const calls = [];
    const g = new Proxy({}, {
      get: (_, key) => (...args) => { calls.push([key, ...args]); },
      set: (_, key, value) => { calls.push([key, value]); return true; }
    });
    return { g, calls };
  }
  for (let index = 0; index <= 20; index++) {
    const shop = recording(), actual = recording();
    api.drawShopPreview(shop.g, "dummy", index);
    api.drawDummySkin(actual.g, index);
    assert.deepEqual(shop.calls.slice(4, -1), actual.calls);
    for (const part of api.dummyParts.filter(part => part.core)) {
      const draw = recording();
      api.drawDummyPart(draw.g, part, false, index);
      assert.ok(draw.calls.some(([key, color]) => key === (part.name === "head" ? "fillStyle" : "strokeStyle")
        && color === (part.name === "head" ? "#ecae68" : "#efb46d")));
    }
  }
  const failed = loadGame(1, JSON.stringify({ wallet: 10000 }));
  failed.storage.fail = true;
  assert.equal(failed.shopItem("dummy", 1).ok, false);
  assert.equal(failed.getSave().wallet, 10000);
  assert.equal(failed.getSave().selectedDummy, 0);
});
test("secret settings bonus repeats, persists, and never affects round rewards", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500 }));
  api.bonusMoney();
  assert.equal(api.getSave().wallet, 500);
  for (const state of ["settings", "pause-settings"]) {
    api.game.state = state; api.bonusMoney();
  }
  assert.equal(api.getSave().wallet, 2500);
  assert.equal(loadGame(1, api.storage.value).getSave().wallet, 2500);
  assert.equal(api.game.score, 0);
  assert.equal(api.game.stagePoints, 0);
  api.storage.fail = true;
  api.bonusMoney();
  assert.equal(api.getSave().wallet, 2500);
});
test("modifiers purchase once, stack, toggle independently, persist, and apply next round", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 50000 }));
  api.startRun("classic");
  api.itemDetail("modifier", 1);
  assert.equal(api.getSave().wallet, 50000);
  assert.equal(api.game.modifier, 0);
  api.shopItem("modifier", 1);
  assert.equal(api.getSave().wallet, 38000);
  assert.equal(api.game.modifier, 0);
  api.startStage();
  assert.equal(api.game.modifier, 1);
  api.shopItem("modifier", 2);
  assert.equal(api.getSave().wallet, 24000);
  api.startStage(); api.throwKnife();
  assert.equal(api.game.flight.duration, .13);
  assert.equal(api.modifiers[api.game.modifier].width, .65);
  assert.deepEqual(Array.from(api.game.activeModifiers), [1, 2]);
  api.shopItem("modifier", 1);
  assert.equal(api.getSave().wallet, 24000);
  const restored = loadGame(1, api.storage.value);
  assert.deepEqual(Array.from(restored.getSave().activeModifiers), [2]);
  restored.shopItem("modifier", 1);
  assert.deepEqual(Array.from(restored.getSave().activeModifiers), [2, 1]);
  restored.shopItem("modifier", 0);
  assert.equal(restored.getSave().activeModifiers.length, 0);
  restored.resetProfile();
  assert.equal(restored.getSave().selectedModifier, 0);
  assert.deepEqual(Array.from(restored.getSave().ownedModifiers), [0]);
  assert.equal(restored.getSave().activeModifiers.length, 0);
});

test("new modifiers slow actual rotation, increase apple money, and reduce dummy penalties", () => {
  const normal = loadGame(10);
  const boosted = loadGame(10, JSON.stringify({ ownedModifiers: [0, 1, 2, 3, 4, 5], activeModifiers: [1, 2, 3, 4, 5, 5, 99] }));
  normal.startRun("classic"); boosted.startRun("classic");
  assert.equal(boosted.game.activeModifiers.length, 5);
  assert.ok(Math.abs(boosted.game.speed / normal.game.speed - .85) < 1e-8);
  boosted.game.speed = 0; boosted.game.targetSpeed = 0; boosted.game.changeIn = 100;
  boosted.game.rotation = 0; boosted.game.apple.angle = Math.PI / 2;
  boosted.throwKnife(); advance(boosted, .14);
  assert.equal(boosted.getSave().wallet, 55);
  boosted.startRun("dummy");
  dummyAim(boosted, Math.atan2(-50, 85));
  assert.equal(boosted.game.stagePenalty, 15);
  assert.equal(boosted.game.state, "playing");
});

test("skinny knives allow narrower gaps but still collide when overlapping in all modes", () => {
  for (const mode of ["classic", "endless", "dummy"]) {
    for (const [modifier, factor, collision] of [[0, .8, true], [1, .8, false], [1, .5, true]]) {
      const api = loadGame(1, JSON.stringify({ ownedModifiers: [0, 1], selectedModifier: modifier }));
      api.startRun(mode);
      api.game.rotation = 0;
      api.game.speed = 0; api.game.targetSpeed = 0; api.game.changeIn = 100;
      api.game.apple = null; if (mode === "dummy") api.game.dummy = new Set();
      const spacing = mode === "dummy" ? .24 : api.config(1).spacing;
      api.game.embedded = [{ angle: Math.PI / 2 + spacing * factor, knife: 0, width: api.modifiers[modifier].width }];
      api.throwKnife(); advance(api, .19);
      assert.equal(api.game.state === "gameover", collision, `${mode} modifier ${modifier}`);
    }
  }
});

test("modifier funds, ownership validation, and persistence failures are safe", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500, selectedModifier: 1, ownedModifiers: [99] }));
  assert.equal(api.getSave().selectedModifier, 0);
  assert.equal(api.shopItem("modifier", 1).ok, false);
  assert.equal(api.getSave().wallet, 500);
  const funded = loadGame(1, JSON.stringify({ wallet: 50000 }));
  funded.storage.fail = true;
  assert.equal(funded.shopItem("modifier", 1).ok, false);
  assert.equal(funded.getSave().wallet, 50000);
  assert.equal(funded.getSave().selectedModifier, 0);
  assert.deepEqual(Array.from(funded.getSave().ownedModifiers), [0]);
});
test("pausing during impact does not jitter the rendered screen", () => {
  const api = loadGame();
  api.startStage();
  api.game.shake = 12;
  api.pause();
  api.translations.length = 0; api.render();
  const first = JSON.stringify(api.translations);
  api.translations.length = 0; api.render();
  assert.equal(JSON.stringify(api.translations), first);
});
test("primary touch throws once and secondary fingers and non-left mouse buttons are ignored", () => {
  const api = loadGame();
  api.startRun("dummy");
  const pointer = api.element("game").listeners.pointerdown;
  let prevented = 0;
  const touch = { pointerType: "touch", isPrimary: true, button: 0, preventDefault: () => prevented++ };
  pointer({ ...touch, isPrimary: false });
  pointer({ ...touch, pointerType: "mouse", button: 2 });
  assert.equal(api.game.flight, null);
  pointer(touch);
  const first = api.game.flight;
  pointer(touch);
  assert.equal(api.game.flight, first);
  assert.equal(prevented, 2);
  advance(api, .19);
  assert.equal(api.game.landed, 1);
  pointer({ ...touch, isPrimary: false });
  assert.equal(api.game.flight, null);
  api.pause();
  pointer(touch);
  assert.equal(api.game.flight, null);
});

test("menu sizing accounts for safe-area padding on phone and landscape viewports", () => {
  const api = loadGame();
  const overlay = api.element("overlay"), screen = api.element("screen");
  screen.offsetWidth = 360; screen.offsetHeight = 500;
  overlay.clientWidth = 320; overlay.clientHeight = 568;
  api.fitScreen();
  assert.equal(screen.style["--screen-scale"], 280 / 360);
  overlay.clientWidth = 844; overlay.clientHeight = 390;
  api.fitScreen();
  assert.equal(screen.style["--screen-scale"], 330 / 500);
  overlay.clientWidth = 768; overlay.clientHeight = 1024;
  api.fitScreen();
  assert.equal(screen.style["--screen-scale"], 1);
});
test("theme previews are temporary, purchases persist, and reset restores the free theme", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 50000 }));
  assert.equal(api.themes.length, 8);
  const before = api.storage.value;
  api.itemDetail("theme", 1);
  assert.equal(api.activeTheme().name, "Ocean Breeze");
  assert.equal(api.getSave().selectedTheme, 0);
  assert.equal(api.storage.value, before);
  api.menu();
  assert.equal(api.activeTheme().name, "Forest Classic");
  assert.equal(api.shopItem("theme", 1).ok, true);
  assert.equal(api.getSave().wallet, 46000);
  assert.equal(api.shopItem("theme", 1).ok, true);
  assert.equal(api.getSave().wallet, 46000);
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().selectedTheme, 1);
  restored.resetProfile();
  assert.equal(restored.getSave().selectedTheme, 0);
  assert.deepEqual(Array.from(restored.getSave().ownedThemes), [0]);
  const failed = loadGame(1, JSON.stringify({ wallet: 50000 }));
  failed.storage.fail = true;
  assert.equal(failed.shopItem("theme", 1).ok, false);
  assert.equal(failed.getSave().wallet, 50000);
  assert.equal(failed.getSave().ownedThemes.length, 1);
});

test("animated skins visibly change over time and never change gameplay values", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 300000 }));
  function drawingAt(time, draw) {
    api.setVisualTime(time);
    const calls = [];
    const g = new Proxy({}, {
      get: (_, key) => (...args) => { calls.push([key, ...args]); if (key.startsWith("create")) return { addColorStop() {} }; },
      set: (_, key, value) => { if (typeof value !== "object") calls.push([key, value]); return true; }
    });
    draw(g);
    return JSON.stringify(calls);
  }
  api.startStage();
  const radius = api.game.radius, required = api.game.required;
  for (const category of ["knife", "log", "theme"]) {
    const catalog = category === "knife" ? api.knives : category === "log" ? api.logs : api.themes;
    assert.equal(catalog.filter(item => item.animation).length, 3);
    for (let index = 0; index < catalog.length; index++) {
      if (!catalog[index].animation) continue;
      const draw = g => category === "knife" ? api.drawKnife(g, index) : category === "log" ? api.drawLog(g, index, 147, 1) : api.drawBackground(g, index);
      assert.notEqual(drawingAt(0, draw), drawingAt(1, draw));
      assert.equal(api.shopItem(category, index).ok, true);
      assert.equal(api.game.radius, radius);
      assert.equal(api.game.required, required);
    }
  }
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().selected, 26);
  assert.equal(restored.getSave().selectedLog, 26);
  assert.equal(restored.getSave().selectedTheme, 7);
});

test("shop details preview without spending, selecting, or saving and disable unaffordable purchases", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500 }));
  const before = JSON.stringify(api.getSave()), storage = api.storage.value;
  for (const category of ["knife", "log", "music"]) {
    api.itemDetail(category, 1);
    assert.equal(api.game.state, "shop-detail");
    assert.ok(api.element("screen").innerHTML.includes('data-action="purchase-item" disabled'));
    assert.equal(JSON.stringify(api.getSave()), before);
    assert.equal(api.storage.value, storage);
  }
  assert.equal(api.audio.previewTrack, 1);
  api.menu();
  assert.equal(api.audio.previewTrack, null);
  assert.equal(api.getSave().selectedMusic, 0);
});

test("affordable shop details require an explicit purchase and owned items stay free", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 5000 }));
  api.itemDetail("music", 1);
  assert.ok(api.element("screen").innerHTML.includes('data-action="purchase-item" >Buy $1,200'));
  assert.equal(api.getSave().wallet, 5000);
  api.shopItem("music", 1);
  assert.equal(api.getSave().wallet, 3800);
  assert.equal(api.getSave().selectedMusic, 1);
  assert.equal(api.audio.previewTrack, null);
  api.itemDetail("music", 0);
  assert.equal(api.getSave().selectedMusic, 1);
  api.menu();
  assert.equal(api.getSave().selectedMusic, 1);
});
test("economy requires sustained play and caps high-level rewards without changing prices", () => {
  const api = loadGame();
  const first = api.rewards(1);
  assert.equal(first.throw, 5);
  assert.equal(first.completion, 30);
  const firstTotal = api.config(1).required * first.throw + first.completion;
  assert.equal(firstTotal, 60);
  assert.equal(Math.ceil(api.knives[1].price / (firstTotal + 25)), 15);
  for (let level = 1; level <= 1000; level++) {
    const reward = api.rewards(level);
    assert.ok(reward.throw >= 5 && reward.throw <= 9);
    assert.ok(reward.completion >= 30 && reward.completion <= 200);
    assert.ok(api.config(level).required * reward.throw + reward.completion + 25 <= 400);
  }
  assert.equal(api.rewards(1000).throw, api.rewards(20).throw);
  assert.equal(api.rewards(1000).completion, api.rewards(20).completion);
});

test("20 additional music tracks purchase once and preserve ownership and selection", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 200000 }));
  assert.equal(api.tracks.length, 21);
  assert.equal(new Set(api.tracks.map(track => track.name)).size, 21);
  assert.deepEqual(Array.from(api.getSave().ownedMusic), [0]);
  let spent = 0;
  for (let i = 1; i < api.tracks.length; i++) {
    assert.ok(api.tracks[i].price > 0);
    assert.equal(api.shopItem("music", i).ok, true);
    spent += api.tracks[i].price;
    assert.equal(api.getSave().selectedMusic, i);
    assert.equal(api.getSave().wallet, 200000 - spent);
  }
  assert.equal(api.shopItem("music", 1).ok, true);
  assert.equal(api.getSave().wallet, 200000 - spent);
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().selectedMusic, 1);
  assert.equal(restored.getSave().ownedMusic.length, 21);
});

test("music respects funds, corrupted selections, failed persistence, and profile reset", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500, selectedMusic: 20, ownedMusic: [-1, 99] }));
  assert.equal(api.getSave().selectedMusic, 0);
  assert.equal(api.shopItem("music", 1).ok, false);
  assert.equal(api.getSave().wallet, 500);
  const funded = loadGame(1, JSON.stringify({ wallet: 10000 }));
  funded.storage.fail = true;
  assert.equal(funded.shopItem("music", 1).ok, false);
  assert.equal(funded.getSave().wallet, 10000);
  assert.equal(funded.getSave().selectedMusic, 0);
  assert.deepEqual(Array.from(funded.getSave().ownedMusic), [0]);
  funded.storage.fail = false;
  funded.shopItem("music", 1);
  funded.resetProfile();
  const restored = loadGame(1, funded.storage.value);
  assert.equal(restored.getSave().selectedMusic, 0);
  assert.deepEqual(Array.from(restored.getSave().ownedMusic), [0]);
});

test("every song produces a distinct valid looping arrangement using music volume", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 200000 }));
  api.audio.context = { state: "running" };
  const arrangements = new Set();
  for (let i = 0; i < api.tracks.length; i++) {
    let tones = [];
    api.audio.tone = (...args) => tones.push(args);
    api.shopItem("music", i);
    tones = []; api.audio.note = 0;
    for (let step = 0; step < api.tracks[i].melody.length; step++) api.audio.musicStep();
    assert.ok(tones.length > 0);
    for (const [frequency, duration, voice, volume, , , music] of tones) {
      assert.ok(frequency > 30 && Number.isFinite(frequency));
      assert.ok(duration > 0 && volume >= 0 && volume < .1);
      assert.ok(["sine", "triangle", "square", "sawtooth"].includes(voice));
      assert.equal(music, true);
    }
    arrangements.add(JSON.stringify(tones));
    const first = tones[0];
    tones = []; api.audio.musicStep();
    assert.deepEqual(tones[0], first);
  }
  assert.equal(arrangements.size, 21);
});

test("selecting music stops the previous song voices without stopping effects", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 5000 }));
  let stopped = 0;
  api.audio.musicNodes.add({ stop: () => stopped++ });
  api.audio.note = 8;
  assert.equal(api.shopItem("music", 1).ok, true);
  assert.equal(stopped, 1);
  assert.equal(api.audio.musicNodes.size, 0);
  assert.equal(api.audio.note, 0);
});

function advance(api, seconds) {
  for (let i = 0; i < Math.round(seconds / STEP); i++) api.update(STEP);
}

test("throws land in 180 ms and repeated input cannot create extra knives", () => {
  const api = loadGame();
  api.startStage();
  api.throwKnife();
  const flight = api.game.flight;
  assert.equal(flight.duration, .18);
  api.throwKnife();
  assert.equal(api.game.flight, flight);
  advance(api, .15);
  assert.equal(api.game.landed, 0);
  advance(api, .04);
  assert.equal(api.game.landed, 1);
  assert.equal(api.game.flight, null);
});

test("pause freezes a throw and the rotation pattern", () => {
  const api = loadGame();
  api.game.level = 12;
  api.startStage();
  api.throwKnife();
  advance(api, .05);
  api.pause();
  const before = [api.game.rotation, api.game.speed, api.game.changeIn, api.game.flight.time];
  advance(api, 3);
  assert.deepEqual([api.game.rotation, api.game.speed, api.game.changeIn, api.game.flight.time], before);
  api.game.state = "playing";
  advance(api, .14);
  assert.equal(api.game.landed, 1);
});

test("advanced levels visibly slow, accelerate, and reverse smoothly", () => {
  for (const level of [3, 5, 10, 20]) {
    const api = loadGame(level);
    api.game.level = level;
    api.startStage();
    const speeds = [];
    for (let i = 0; i < 30 / STEP; i++) {
      const previous = api.game.speed;
      api.update(STEP);
      assert.ok(Math.abs(api.game.speed - previous) < .25);
      speeds.push(api.game.speed);
    }
    assert.ok(speeds.some(speed => speed > .1) && speeds.some(speed => speed < -.1), `Stage ${level} must reverse`);
    assert.ok(speeds.some(speed => Math.abs(speed) < .7), `Stage ${level} must slow down`);
    assert.ok(speeds.some(speed => Math.abs(speed) > 1.7), `Stage ${level} must speed up`);
  }
  assert.ok(loadGame().config(20).rotation.hold < loadGame().config(3).rotation.hold);
});

test("rapid clicking is unreliable above the introductory stages", t => {
  for (const level of [3, 5, 8, 12, 20]) {
    let wins = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const api = loadGame(seed);
      api.game.level = level;
      api.startStage();
      for (let i = 0; i < 8 / STEP && api.game.state === "playing"; i++) {
        api.throwKnife();
        api.update(STEP);
      }
      if (api.game.state === "finishing") wins++;
    }
    t.diagnostic(`Stage ${level}: rapid clicking won ${wins}/100 seeded runs`);
    assert.ok(wins <= 20, `Stage ${level}: spam won ${wins}/100 runs`);
  }
});

test("carefully timed throws can still complete advanced and boss stages", () => {
  for (const level of [3, 5, 12, 20]) {
    for (let seed = 1; seed <= 10; seed++) {
      const api = loadGame(seed);
      api.game.level = level;
      api.startStage();
      const c = api.config(level);
      for (let i = 0; i < 90 / STEP && api.game.state === "playing"; i++) {
        if (!api.game.flight && api.game.changeIn > .2) {
          let speed = api.game.speed, rotation = api.game.rotation;
          for (let j = 0; j < Math.ceil(.18 / STEP); j++) {
            const change = (api.game.targetSpeed - speed) * (1 - Math.exp(-c.rotation.response * STEP));
            speed += Math.max(-12 * STEP, Math.min(12 * STEP, change));
            rotation += speed * STEP;
          }
          const angle = Math.PI / 2 - rotation;
          const clear = api.game.embedded.every(k => {
            const distance = Math.abs(Math.atan2(Math.sin(k.angle - angle), Math.cos(k.angle - angle)));
            return distance > c.spacing + .015;
          });
          if (clear) api.throwKnife();
        }
        api.update(STEP);
      }
      assert.equal(api.game.state, "finishing", `Stage ${level}, seed ${seed} must be winnable with timed throws`);
    }
  }
});

test("introductory stages stay approachable and completion awards progress", () => {
  const api = loadGame();
  api.startStage();
  api.game.apple = null;
  while (api.game.state === "playing") {
    api.throwKnife();
    api.update(STEP);
  }
  assert.equal(api.game.state, "finishing");
  advance(api, 1);
  assert.equal(api.game.state, "victory");
  assert.equal(api.game.score, 60);
  assert.equal(api.getSave().wallet, 60);
  assert.equal(JSON.parse(api.storage.value).wallet, 60);
});

test("apple hits award one bonus, include wraparound, and keep normal throws required", () => {
  const api = loadGame();
  api.startStage();
  api.game.speed = 0; api.game.targetSpeed = 0; api.game.changeIn = 100;
  api.game.rotation = Math.PI / 2 + .02;
  api.game.apple.angle = Math.PI * 2 - .02;
  api.throwKnife(); advance(api, .19);
  assert.equal(api.game.score, 30);
  assert.equal(api.getSave().wallet, 30);
  assert.equal(api.game.stagePoints, 30);
  assert.equal(api.game.landed, 1);
  assert.equal(api.game.required, 6);
  assert.equal(api.game.apple, null);
  assert.equal(api.game.particles.filter(p => p.kind === "apple").length, 2);
  api.game.rotation += .5;
  api.throwKnife(); advance(api, .19);
  assert.equal(api.game.score, 35);
});

test("missing an apple leaves it available and knife collisions never award a bonus", () => {
  const api = loadGame();
  api.startStage();
  api.game.speed = 0; api.game.targetSpeed = 0; api.game.changeIn = 100;
  api.game.rotation = 0; api.game.apple.angle = 0;
  api.throwKnife(); advance(api, .19);
  assert.equal(api.game.score, 5);
  assert.ok(api.game.apple);
  api.game.apple.angle = Math.PI / 2;
  api.throwKnife(); advance(api, .19);
  assert.equal(api.game.state, "gameover");
  assert.equal(api.game.score, 5);
  assert.ok(api.game.apple);
});

test("each stage resets the apple and boss apples spawn clear of existing knives", () => {
  for (const level of [1, 5, 10, 20]) {
    for (let seed = 1; seed <= 20; seed++) {
      const api = loadGame(seed);
      api.game.level = level; api.startStage();
      assert.ok(api.game.embedded.every(k =>
        Math.abs(Math.atan2(Math.sin(k.angle - api.game.apple.angle), Math.cos(k.angle - api.game.apple.angle))) >= .4));
      api.game.apple = null;
      api.startStage();
      assert.ok(api.game.apple);
    }
  }
});

test("collision checks and open target space remain intact", () => {
  const api = loadGame();
  api.startStage();
  api.game.speed = 0;
  api.game.targetSpeed = 0;
  api.game.changeIn = 100;
  api.throwKnife();
  advance(api, .19);
  assert.equal(api.game.landed, 1);
  api.throwKnife();
  advance(api, .19);
  assert.equal(api.game.state, "gameover");
  assert.equal(api.game.landed, 1);
  for (let level = 1; level <= 1000; level++) {
    const c = api.config(level);
    assert.ok(2 * (c.required + (c.boss ? 2 : 0)) * c.spacing < Math.PI * 2);
  }
});

test("money is banked immediately and survives losses, restarts, and switching modes", () => {
  const api = loadGame();
  api.startStage();
  api.game.speed = 0; api.game.targetSpeed = 0; api.game.changeIn = 100;
  api.game.apple = null;
  api.throwKnife(); advance(api, .19);
  assert.equal(api.getSave().wallet, 5);
  assert.equal(JSON.parse(api.storage.value).wallet, 5);
  api.throwKnife(); advance(api, .19);
  assert.equal(api.game.state, "gameover");
  api.startStage();
  assert.equal(api.getSave().wallet, 5);
  api.startRun("endless");
  assert.equal(api.getSave().wallet, 5);
  assert.equal(api.game.score, 0);
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().wallet, 5);
});

test("skins require money, charge once, equip, and persist independently of stage", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 3000, classicStage: 100 }));
  assert.equal(api.getSave().ownedKnives.length, 1);
  assert.equal(api.getSave().ownedLogs.length, 1);
  assert.equal(api.shopItem("knife", 3).ok, false);
  assert.equal(api.getSave().wallet, 3000);
  assert.equal(api.shopItem("knife", 1).ok, true);
  assert.equal(api.getSave().wallet, 1800);
  assert.equal(api.getSave().selected, 1);
  assert.equal(api.shopItem("knife", 1).ok, true);
  assert.equal(api.getSave().wallet, 1800);
  assert.equal(api.shopItem("log", 1).ok, true);
  assert.equal(api.getSave().wallet, 300);
  assert.equal(api.getSave().selectedLog, 1);
  assert.equal(api.shopItem("log", 0).ok, true);
  assert.equal(api.shopItem("log", 1).ok, true);
  assert.equal(api.getSave().wallet, 300);
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().wallet, 300);
  assert.equal(restored.getSave().selected, 1);
  assert.equal(restored.getSave().selectedLog, 1);
  assert.ok(restored.getSave().ownedKnives.includes(1));
  assert.ok(restored.getSave().ownedLogs.includes(1));
});

test("failed storage rolls purchases back instead of spending unsaved money", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 2000 }));
  api.storage.fail = true;
  assert.equal(api.shopItem("knife", 1).ok, false);
  assert.equal(api.getSave().wallet, 2000);
  assert.equal(api.getSave().selected, 0);
  assert.equal(api.getSave().ownedKnives.length, 1);
});

test("legacy migration grants best earnings once and does not grant stage skins", () => {
  const api = loadGame(1, JSON.stringify({ best: 925, classicStage: 10, selected: 3 }));
  assert.equal(api.getSave().wallet, 925);
  assert.equal(api.getSave().classicStage, 10);
  assert.equal(api.getSave().selected, 0);
  api.shopItem("knife", 0);
  assert.equal(loadGame(1, api.storage.value).getSave().wallet, 925);
  const spent = loadGame(1, JSON.stringify({ best: 925, wallet: 0, ownedKnives: [0, 1], selected: 1 }));
  assert.equal(spent.getSave().wallet, 0);
  assert.equal(spent.getSave().selected, 1);
});

test("20 new skins are distinct, purchasable, renderable, and saved without changing old IDs", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 200000, ownedKnives: [0, 1], selected: 1 }));
  assert.equal(api.knives.length, 27);
  assert.equal(api.knives.filter(k => k.group === "boys").length, 10);
  assert.equal(api.knives.filter(k => k.group === "girls").length, 10);
  assert.equal(new Set(api.knives.map(k => k.name)).size, 27);
  assert.equal(new Set(api.knives.slice(4, 24).map(k => `${k.color}/${k.handle}/${k.accent}/${k.pattern}`)).size, 20);
  assert.equal(api.knives[1].name, "Copperhead");
  const renderer = new Proxy({}, { get: (_, key) => key.startsWith("create") ? () => ({ addColorStop() {} }) : () => {} });
  let total = 0;
  for (let index = 4; index < 24; index++) {
    assert.ok(api.knives[index].price > 0);
    assert.equal(api.shopItem("knife", index).ok, true);
    total += api.knives[index].price;
    assert.equal(api.getSave().wallet, 200000 - total);
    api.drawKnife(renderer, index);
  }
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().selected, 23);
  assert.equal(restored.getSave().ownedKnives.length, 22);
  assert.equal(restored.shopItem("knife", 4).ok, true);
  assert.equal(restored.getSave().wallet, 200000 - total);
});

test("20 new log skins have distinct palettes, permanent purchases, and unchanged gameplay", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 200000, ownedLogs: [0, 1], selectedLog: 1 }));
  assert.equal(api.logs.length, 27);
  assert.equal(api.logs[1].name, "Silver Birch");
  assert.equal(new Set(api.logs.map(s => s.name)).size, 27);
  assert.equal(new Set(api.logs.slice(4, 24).map(s => `${s.light}/${s.middle}/${s.dark}/${s.bark}`)).size, 20);
  const renderer = new Proxy({}, { get: (_, key) => key.startsWith("create") ? () => ({ addColorStop() {} }) : () => {} });
  api.startStage();
  const radius = api.game.radius, required = api.game.required;
  let spent = 0;
  for (let index = 4; index < 24; index++) {
    assert.equal(api.shopItem("log", index).ok, true);
    spent += api.logs[index].price;
    assert.equal(api.getSave().wallet, 200000 - spent);
    api.drawTarget(renderer);
    assert.equal(api.game.radius, radius);
    assert.equal(api.game.required, required);
  }
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().selectedLog, 23);
  assert.equal(restored.getSave().ownedLogs.length, 22);
  assert.equal(restored.shopItem("log", 4).ok, true);
  assert.equal(restored.getSave().wallet, 200000 - spent);
});

test("every shop preview uses the exact gameplay renderer and log texture", () => {
  const api = loadGame();
  function recording() {
    const calls = [];
    let gradient = 0;
    const g = new Proxy({}, {
      get: (_, key) => (...args) => {
        calls.push([key, ...args]);
        if (key.startsWith("create")) return { gradient: gradient++, addColorStop: (...stops) => calls.push(["addColorStop", ...stops]) };
      },
      set: (_, key, value) => { calls.push([key, value && value.addColorStop ? { gradient: value.gradient } : value]); return true; }
    });

    return { g, calls };
  }
  for (const category of ["knife", "log"]) {
    for (let index = 0; index < 24; index++) {
      const shop = recording(), actual = recording();
      api.drawShopPreview(shop.g, category, index);
      if (category === "knife") api.drawKnife(actual.g, index, 2);
      else api.drawLog(actual.g, index, 147, 1);
      const prefix = category === "knife" ? 3 : 4;
      assert.deepEqual(shop.calls.slice(prefix, -1), actual.calls, `${category} ${index} preview must match gameplay drawing commands`);
    }
  }
});

test("level selection replays unlocked stages without losing progress, money, or skins", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500, classicStage: 15, selected: 1, ownedKnives: [0, 1], selectedLog: 1, ownedLogs: [0, 1] }));
  api.game.mode = "endless"; api.game.score = 999;
  assert.equal(api.selectLevel(1), true);
  assert.equal(api.game.mode, "classic");
  assert.equal(api.game.level, 1);
  assert.equal(api.game.score, 0);
  assert.equal(api.getSave().wallet, 500);
  assert.equal(api.getSave().selected, 1);
  assert.equal(api.getSave().selectedLog, 1);
  api.game.apple = null;
  while (api.game.state === "playing") { api.throwKnife(); api.update(STEP); }
  advance(api, 1);
  assert.equal(api.game.state, "victory");
  assert.equal(api.getSave().classicStage, 15);
  assert.equal(api.getSave().wallet, 560);
  assert.equal(api.selectLevel(15), true);
  for (const level of [0, -1, 16, 1.5, NaN]) assert.equal(api.selectLevel(level), false);
  assert.equal(api.game.level, 15);
});

test("profile reset clears all progress, ownership, settings, and active round state persistently", () => {
  const api = loadGame(1, JSON.stringify({ best: 8000, wallet: 5000, classicStage: 20, selected: 23, selectedLog: 23, ownedKnives: [0, 1, 23], ownedLogs: [0, 1, 23], music: .1, sound: .2 }));
  api.startRun("dummy");
  api.game.stagePoints = 200; api.game.stagePenalty = 100;
  api.throwKnife();
  assert.equal(api.resetProfile(), true);
  const saved = api.getSave();
  assert.equal(saved.best, 0); assert.equal(saved.wallet, 0);
  assert.equal(saved.classicStage, 1);
  assert.equal(saved.selected, 0); assert.equal(saved.selectedLog, 0);
  assert.deepEqual(Array.from(saved.ownedKnives), [0]);
  assert.deepEqual(Array.from(saved.ownedLogs), [0]);
  assert.equal(saved.music, .35); assert.equal(saved.sound, .65);
  assert.equal(api.game.state, "menu"); assert.equal(api.game.mode, "classic");
  assert.equal(api.game.level, 1); assert.equal(api.game.score, 0);
  assert.equal(api.game.flight, null); assert.equal(api.game.dummy, null);
  assert.equal(api.game.stagePoints, 0); assert.equal(api.game.stagePenalty, 0);
  advance(api, 2);
  assert.equal(api.getSave().wallet, 0);
  const restored = loadGame(1, api.storage.value);
  assert.equal(restored.getSave().wallet, 0);
  assert.equal(restored.getSave().ownedKnives.length, 1);
  assert.equal(restored.getSave().ownedLogs.length, 1);
});

test("reset confirmation does not erase anything and failed reset preserves the profile", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 5000, classicStage: 10, ownedKnives: [0, 1], selected: 1 }));
  api.startRun("classic");
  api.confirmReset();
  assert.equal(api.getSave().wallet, 5000);
  assert.equal(api.getSave().classicStage, 10);
  api.storage.fail = true;
  assert.equal(api.resetProfile(), false);
  assert.equal(api.getSave().wallet, 5000);
  assert.equal(api.getSave().selected, 1);
  assert.equal(api.game.level, 10);
  assert.equal(api.game.state, "reset-confirm");
});

function dummyAim(api, angle) {
  api.game.speed = 0; api.game.targetSpeed = 0; api.game.changeIn = 100;
  api.game.rotation = Math.PI / 2 - angle;
  api.throwKnife(); advance(api, .19);
}

test("dummy limbs detach once, keep playing, and affect pending winnings only", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500 }));
  api.startRun("dummy");
  dummyAim(api, Math.atan2(-50, 85));
  assert.equal(api.game.state, "playing");
  assert.equal(api.game.dummy.has("right arm"), false);
  assert.equal(api.game.stagePenalty, 25);
  assert.equal(api.game.debris.length, 1);
  assert.equal(api.getSave().wallet, 500);
  assert.equal(api.game.stagePoints, 5);
  const piece = api.game.debris[0], y = piece.y, rotation = piece.rotation;
  advance(api, .3);
  assert.notEqual(piece.y, y);
  assert.notEqual(piece.rotation, rotation);
  assert.equal(api.findDummyHit(Math.atan2(-38, 118)), null);
  api.pause();
  const frozenY = piece.y;
  advance(api, 1);
  assert.equal(piece.y, frozenY);
});

test("dummy core hits fail and never deduct banked money", () => {
  for (const angle of [-Math.PI / 2, -Math.PI / 2 + .1]) {
    const api = loadGame(1, JSON.stringify({ wallet: 500 }));
    api.startRun("dummy");
    assert.ok(api.findDummyHit(angle).part.core);
    dummyAim(api, angle);
    assert.equal(api.game.state, "gameover");
    assert.equal(api.getSave().wallet, 500);
    assert.equal(api.game.stagePoints, 0);
  }
});

test("dummy fragments split at the contact point and preserve the proximal segment", () => {
  for (const name of ["left arm", "right arm", "left leg", "right leg"]) {
    const cuts = [];
    for (const fraction of [.65, .9]) {
      const api = loadGame();
      api.startRun("dummy");
      const part = api.dummyParts.find(part => part.name === name);
      const dx = part.b[0] - part.a[0], dy = part.b[1] - part.a[1];
      const length = Math.hypot(dx, dy);
      const aim = [part.a[0] + dx * fraction - dy / length * part.width,
        part.a[1] + dy * fraction + dx / length * part.width];
      const angle = Math.atan2(aim[1], aim[0]);
      const hit = { part, distance: Math.hypot(...aim) };
      api.detachLimb(hit, angle);
      const piece = api.game.debris[0];
      const expected = Math.max(0, Math.min(1, ((Math.cos(angle) * hit.distance - part.a[0]) * dx
        + (Math.sin(angle) * hit.distance - part.a[1]) * dy) / (dx * dx + dy * dy)));
      assert.deepEqual(Array.from(piece.part.a), Array.from(piece.stump.b));
      assert.deepEqual(Array.from(piece.part.b), Array.from(part.b));
      assert.deepEqual(Array.from(piece.stump.a), Array.from(part.a));
      assert.ok(Math.abs(piece.length - Math.hypot(dx, dy) * (1 - expected)) < 1e-8);
      assert.equal(piece.part.cutStart, true);
      assert.equal(piece.stump.cutEnd, true);
      cuts.push(piece.length);
    }
    assert.ok(cuts[0] > cuts[1], `${name}: different impacts must produce different fragment lengths`);
  }
});

test("unsupported proximal limbs swing under gravity and keep their shoulder or hip joint", () => {
  for (const name of ["left arm", "right arm", "left leg", "right leg"]) {
    const api = loadGame();
    api.startRun("dummy");
    api.game.rotation = 1; api.game.speed = 0; api.game.targetSpeed = 0; api.game.changeIn = 100;
    const part = api.dummyParts.find(part => part.name === name);
    const point = part.a.map((value, i) => value + (part.b[i] - value) * .7);
    api.detachLimb({ part, distance: Math.hypot(...point) }, Math.atan2(point[1], point[0]));
    const piece = api.game.debris[0];
    const initial = { ...piece.stumpTip };
    let displacement = 0;
    for (let i = 0; i < 120; i++) {
      api.update(STEP);
      displacement = Math.max(displacement, Math.hypot(piece.stumpTip.x - initial.x, piece.stumpTip.y - initial.y));
    }
    assert.ok(displacement > 2, `${name}: maximum displacement ${displacement}`);
    for (let i = 0; i < 1200; i++) {
      if (i === 300) { api.game.targetSpeed = 3; api.game.speed = 3; }
      if (i === 700) { api.game.targetSpeed = -3; api.game.speed = -3; }
      api.update(.05);
      const joint = api.dummyWorld(piece.joint);
      assert.ok(Math.abs(Math.hypot(piece.stumpTip.x - joint.x, piece.stumpTip.y - joint.y) - piece.stumpLength) < 1e-7);
      assert.ok(Number.isFinite(piece.stumpRotation));
    }
    api.pause();
    const frozen = JSON.stringify(piece);
    advance(api, 1);
    assert.equal(JSON.stringify(piece), frozen);
    api.startStage();
    assert.equal(api.game.debris.length, 0);
  }
});

test("wrist and ankle tethers stay bounded through rotation changes and never expire", () => {
  const api = loadGame(12);
  api.startRun("dummy"); api.game.level = 12; api.startStage();
  for (const part of api.dummyParts.filter(part => !part.core)) {
    const aim = part.a.map((value, index) => value + (part.b[index] - value) * .7);
    const angle = Math.atan2(aim[1], aim[0]);
    api.detachLimb(api.findDummyHit(angle), angle);
  }
  for (let i = 0; i < 60 / .05; i++) {
    api.update(.05);
    for (const piece of api.game.debris) {
      const anchor = api.dummyWorld(piece.anchor);
      assert.ok(Math.hypot(piece.wrist.x - anchor.x, piece.wrist.y - anchor.y) <= 20.001);
      assert.ok(Math.abs(Math.hypot(piece.tip.x - piece.wrist.x, piece.tip.y - piece.wrist.y) - piece.length) < .2);
      assert.ok(Number.isFinite(piece.rotation));
      assert.ok(Math.hypot(piece.x - 360, piece.y - 340) < 300);
    }
  }
  assert.equal(api.game.debris.length, 4);
  api.pause();
  const frozen = JSON.stringify(api.game.debris);
  advance(api, 2);
  assert.equal(JSON.stringify(api.game.debris), frozen);
  api.startStage();
  assert.equal(api.game.debris.length, 0);
});

test("actual incoming hit angles produce different cuts on each limb", () => {
  const api = loadGame();
  api.startRun("dummy");
  const cuts = new Map();
  for (let angle = -Math.PI; angle < Math.PI; angle += .002) {
    const hit = api.findDummyHit(angle);
    if (!hit || hit.part.core) continue;
    const { part, distance } = hit;
    const dx = part.b[0] - part.a[0], dy = part.b[1] - part.a[1];
    const fraction = Math.max(0, Math.min(1, ((Math.cos(angle) * distance - part.a[0]) * dx
      + (Math.sin(angle) * distance - part.a[1]) * dy) / (dx * dx + dy * dy)));
    if (!cuts.has(part.name)) cuts.set(part.name, []);
    cuts.get(part.name).push(fraction);
  }
  for (const part of api.dummyParts.filter(part => !part.core)) {
    const fractions = cuts.get(part.name);
    assert.ok(fractions && Math.max(...fractions) - Math.min(...fractions) > .1,
      `${part.name}: contact geometry must allow distinct cut locations`);
  }
});

test("dummy neck and torso are critical and excessive penalties never touch the wallet", () => {
  for (const name of ["neck", "torso"]) {
    const api = loadGame(1, JSON.stringify({ wallet: 500 }));
    api.startRun("dummy");
    api.game.dummy = new Set([name]);
    dummyAim(api, -Math.PI / 2);
    assert.equal(api.game.state, "gameover");
    assert.equal(api.getSave().wallet, 500);
  }
  const api = loadGame(1, JSON.stringify({ wallet: 500 }));
  api.startRun("dummy");
  api.game.stagePenalty = 400;
  api.game.state = "finishing";
  api.victory();
  assert.equal(api.getSave().wallet, 500);
  assert.equal(api.game.stagePoints, 0);
});

test("dummy completion settles net rewards once and retry restores every module", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500, classicStage: 8 }));
  api.startRun("dummy");
  dummyAim(api, Math.atan2(-38, 118));
  assert.equal(api.game.stagePenalty, 25);
  api.game.landed = api.game.required - 1;
  dummyAim(api, Math.PI);
  assert.equal(api.game.state, "finishing");
  advance(api, 1);
  assert.equal(api.game.state, "victory");
  assert.equal(api.getSave().wallet, 515);
  assert.equal(api.game.stagePoints, 15);
  assert.equal(api.getSave().classicStage, 8);
  api.startStage();
  assert.equal(api.game.dummy.size, 7);
  assert.equal(api.game.stagePenalty, 0);
  assert.equal(api.getSave().wallet, 515);
});

test("dummy results distinguish gross earnings, penalties, and net payout", () => {
  for (const [gross, penalty, total] of [[305, 300, 5], [305, 400, 0], [305, 0, 305]]) {
    const api = loadGame(1, JSON.stringify({ wallet: 500 }));
    api.startRun("dummy");
    api.game.stagePoints = gross - 30; api.game.score = gross - 30;
    api.game.stagePenalty = penalty;
    api.victory();
    const screen = api.element("screen").innerHTML;
    assert.ok(screen.includes(`EARNED $${gross}`));
    assert.ok(screen.includes(`LIMB PENALTIES -$${penalty}`));
    assert.ok(screen.includes(`TOTAL PAYOUT $${total}`));
    assert.equal(api.getSave().wallet, 500 + total);
  }
});

test("dummy HUD and failed rounds show deductions without implying a payout", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500 }));
  api.startRun("dummy");
  api.game.stagePoints = 300; api.game.score = 300; api.game.stagePenalty = 300;
  dummyAim(api, Math.PI);
  assert.equal(api.element("dummy-status").textContent, "EARNED $305 · PENALTY -$300 · TOTAL $5");
  dummyAim(api, -Math.PI / 2);
  const screen = api.element("screen").innerHTML;
  assert.ok(screen.includes("EARNED $305"));
  assert.ok(screen.includes("LIMB PENALTIES -$300"));
  assert.ok(screen.includes("AFTER PENALTIES $5"));
  assert.ok(screen.includes("TOTAL PAYOUT $0 · ROUND FAILED"));
  assert.equal(api.getSave().wallet, 500);
});

test("dummy abandonment discards only pending rewards; other modes still bank normally", () => {
  const api = loadGame(1, JSON.stringify({ wallet: 500 }));
  api.startRun("dummy");
  dummyAim(api, Math.PI);
  assert.equal(api.game.stagePoints, 5);
  api.startStage();
  assert.equal(api.getSave().wallet, 500);
  assert.equal(api.game.stagePoints, 0);
  assert.equal(api.game.score, 0);
  dummyAim(api, Math.PI);
  api.menu();
  assert.equal(api.getSave().wallet, 500);
  api.startRun("classic");
  api.game.apple = null;
  dummyAim(api, Math.PI);
  assert.equal(api.getSave().wallet, 505);
});

test("dummy stages have enough safe angular openings for timed completion", () => {
  for (const level of [1, 5, 12]) {
    const api = loadGame(level);
    api.startRun("dummy"); api.game.level = level; api.startStage();
    for (let i = 0; i < 60 / STEP && api.game.state === "playing"; i++) {
      if (!api.game.flight && api.game.changeIn > .2) {
        let speed = api.game.speed, rotation = api.game.rotation;
        for (let j = 0; j < Math.ceil(.18 / STEP); j++) {
          const change = (api.game.targetSpeed - speed) * (1 - Math.exp(-api.config(level).rotation.response * STEP));
          speed += Math.max(-12 * STEP, Math.min(12 * STEP, change)); rotation += speed * STEP;
        }
        const angle = Math.PI / 2 - rotation;
        const clear = api.game.embedded.every(k => Math.abs(Math.atan2(Math.sin(k.angle - angle), Math.cos(k.angle - angle))) > .26);
        if (clear && !api.findDummyHit(angle)) api.throwKnife();
      }
      api.update(STEP);
    }
    assert.equal(api.game.state, "finishing", `Dummy stage ${level} must be completable without hitting modules`);
  }
});
