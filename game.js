(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = id => document.getElementById(id);
  const overlay = $("overlay");
  const screen = $("screen");
  const TAU = Math.PI * 2;
  const W = 720, H = 900, CX = 360, CY = 340;
  const THROW_DURATION = .18;
  const APPLE_BONUS = 25;
  const APPLE_SIZE = 22;
  const LIMB_PENALTY = 25;
  const dummyParts = [
    { name: "head", a: [0, -110], b: [0, -110], width: 23, core: true },
    { name: "neck", a: [0, -87], b: [0, -70], width: 8, core: true },
    { name: "torso", a: [0, -70], b: [0, 12], width: 16, core: true },
    { name: "left arm", a: [-18, -60], b: [-118, -38], width: 10 },
    { name: "right arm", a: [18, -60], b: [118, -38], width: 10 },
    { name: "left leg", a: [-10, 6], b: [-74, 112], width: 11 },
    { name: "right leg", a: [10, 6], b: [74, 112], width: 11 }
  ];
  const STORAGE = "timber-and-steel-v1";
  const knives = [
    { name: "The Original", color: "#dce9e5", handle: "#805038", price: 0 },
    { name: "Copperhead", color: "#efb37e", handle: "#704039", price: 1200 },
    { name: "Moonstone", color: "#a7e4eb", handle: "#355d67", price: 3000 },
    { name: "Golden Hour", color: "#f6d579", handle: "#704d37", price: 6000 },
    { name: "Night Racer", color: "#8497ab", handle: "#202837", accent: "#55e2ff", pattern: "stripes", style: 1, group: "boys", price: 1800 },
    { name: "Thunderbolt", color: "#eee697", handle: "#313e69", accent: "#ffd943", pattern: "bolt", style: 2, group: "boys", price: 2400 },
    { name: "Lava Edge", color: "#ff946c", handle: "#583039", accent: "#ffdc8b", pattern: "stripes", style: 3, group: "boys", price: 3200 },
    { name: "Arctic Wolf", color: "#d5f6ff", handle: "#385b79", accent: "#83daff", pattern: "diamonds", style: 2, group: "boys", price: 4200 },
    { name: "Jungle Scout", color: "#aacb89", handle: "#345746", accent: "#ecdf8b", pattern: "stripes", style: 1, group: "boys", price: 5400 },
    { name: "Cosmic Ranger", color: "#b7a9ff", handle: "#34265a", accent: "#76edee", pattern: "stars", style: 3, group: "boys", price: 6800 },
    { name: "Crimson Dragon", color: "#ed8594", handle: "#612839", accent: "#ffd16b", pattern: "diamonds", style: 1, group: "boys", price: 8400 },
    { name: "Neon Circuit", color: "#75f4c4", handle: "#243a47", accent: "#b5ff58", pattern: "bolt", style: 2, group: "boys", price: 10200 },
    { name: "Storm Titan", color: "#99b8e5", handle: "#38405c", accent: "#f4f7ff", pattern: "bolt", style: 3, group: "boys", price: 12500 },
    { name: "Solar Champion", color: "#ffd575", handle: "#72422b", accent: "#fff3b6", pattern: "stars", style: 1, group: "boys", price: 15000 },
    { name: "Rose Quartz", color: "#ffc5d7", handle: "#9e5477", accent: "#ffeaf3", pattern: "diamonds", style: 3, group: "girls", price: 1800 },
    { name: "Lavender Dream", color: "#d9c7ff", handle: "#725994", accent: "#fff0b8", pattern: "stars", style: 1, group: "girls", price: 2400 },
    { name: "Peach Blossom", color: "#ffd0a9", handle: "#ba6d7c", accent: "#ffe5c8", pattern: "diamonds", style: 2, group: "girls", price: 3200 },
    { name: "Mint Melody", color: "#b0f5dc", handle: "#448c87", accent: "#fceeb4", pattern: "stripes", style: 3, group: "girls", price: 4200 },
    { name: "Berry Pop", color: "#ff96c6", handle: "#883c72", accent: "#f8c7ff", pattern: "bolt", style: 1, group: "girls", price: 5400 },
    { name: "Mermaid Tide", color: "#92e9ee", handle: "#4960a0", accent: "#e9b8ff", pattern: "diamonds", style: 2, group: "girls", price: 6800 },
    { name: "Starlight Spark", color: "#eee4ff", handle: "#7865b0", accent: "#fbe687", pattern: "stars", style: 3, group: "girls", price: 8400 },
    { name: "Sunset Bloom", color: "#ffb6a8", handle: "#a94d79", accent: "#ffdb86", pattern: "stripes", style: 1, group: "girls", price: 10200 },
    { name: "Aurora Ribbon", color: "#b9dcff", handle: "#667bb1", accent: "#f8bcf4", pattern: "bolt", style: 2, group: "girls", price: 12500 },
    { name: "Diamond Empress", color: "#e6fbff", handle: "#8b558c", accent: "#f8cee8", pattern: "diamonds", style: 3, group: "girls", price: 15000 }
  ];
  const logs = [
    { name: "Classic Oak", price: 0, light: "#e5bf89", middle: "#c98f59", dark: "#9f603a", bark: "#5f3928", rim: "#7e4b30", grain: "#804b302b", highlight: "#f7d9a53b" },
    { name: "Silver Birch", price: 1500, light: "#f1e4c5", middle: "#d0b88d", dark: "#a58d6e", bark: "#e1dfd1", rim: "#b8b5a5", grain: "#78675438", highlight: "#fff9df60" },
    { name: "Cherrywood", price: 3500, light: "#f4b4a0", middle: "#bd7566", dark: "#82463e", bark: "#4b2931", rim: "#7f4148", grain: "#71392e48", highlight: "#ffd3b442" },
    { name: "Midnight Timber", price: 6500, light: "#a4cecd", middle: "#5c9199", dark: "#335463", bark: "#20303f", rim: "#3b5967", grain: "#24404c55", highlight: "#c3f0e854" },
    logSkin("Obsidian Forge", 1800, ["#a5a9b6", "#626977", "#343846", "#252731"], "◆"),
    logSkin("Thunder Oak", 2400, ["#f4df9a", "#b99743", "#645b38", "#323e59"], "ϟ"),
    logSkin("Lava Core", 3200, ["#ffce83", "#e88448", "#9c4635", "#4c3032"], "✦"),
    logSkin("Glacier Pine", 4200, ["#e0f8ff", "#94cbdc", "#528395", "#345264"], "❄"),
    logSkin("Jungle Totem", 5400, ["#d7e39e", "#85a96b", "#486c4d", "#354835"], "◆"),
    logSkin("Galaxy Cedar", 6800, ["#cfb6ff", "#8970bb", "#51416f", "#332c4c"], "✦"),
    logSkin("Dragon Ember", 8400, ["#f7b085", "#c66054", "#803d43", "#4e2935"], "ϟ"),
    logSkin("Neon Reactor", 10200, ["#c6ffd1", "#61bf9c", "#35726d", "#263f50"], "✳"),
    logSkin("Storm Fortress", 12500, ["#c4d8fb", "#7f99c4", "#4d5b85", "#30364e"], "ϟ"),
    logSkin("Solar Crown", 15000, ["#fff0ac", "#e3ba56", "#aa7933", "#644631"], "✦"),
    logSkin("Rose Garden", 1800, ["#ffe0df", "#dfa0ab", "#a56a80", "#774659"], "✿"),
    logSkin("Lavender Grove", 2400, ["#ede0ff", "#bda2dc", "#8972aa", "#635075"], "✦"),
    logSkin("Peach Petal", 3200, ["#ffe4bb", "#e6b08c", "#b07b70", "#845769"], "✿"),
    logSkin("Mint Macaron", 4200, ["#e0ffe5", "#a0d3ba", "#699b8f", "#507375"], "◆"),
    logSkin("Berry Blossom", 5400, ["#ffcfeb", "#d785bc", "#a05391", "#693e6d"], "✿"),
    logSkin("Pearl Lagoon", 6800, ["#e0fbf4", "#99d6d9", "#639ba9", "#4c6a8b"], "◆"),
    logSkin("Starlight Willow", 8400, ["#f9ecff", "#c4aee3", "#947aac", "#6d557f"], "✦"),
    logSkin("Sunset Orchard", 10200, ["#ffe2bf", "#ebaaa0", "#bc768a", "#844f70"], "✿"),
    logSkin("Aurora Meadow", 12500, ["#d7fbe9", "#a2c5da", "#848ebe", "#625e96"], "✳"),
    logSkin("Crystal Palace", 15000, ["#f3fbff", "#c7daef", "#a0accd", "#8973a5"], "◆")
  ];
  function logSkin(name, price, colors, emblem) {
    const [light, middle, dark, bark] = colors;
    return { name, price, light, middle, dark, bark, rim: dark, grain: `${dark}55`, highlight: `${light}66`, emblem };
  }
  knives.push(
    { name: "Prismatic Pulse", price: 18000, color: "#c5b9ff", handle: "#443666", accent: "#e1baff", style: 3, pattern: "stars", animation: "rainbow" },
    { name: "Plasma Runner", price: 20000, color: "#a0ffef", handle: "#214d57", accent: "#69ffe1", style: 2, pattern: "bolt", animation: "pulse" },
    { name: "Solar Sweep", price: 22000, color: "#ffdf9b", handle: "#704225", accent: "#fff0ae", style: 1, pattern: "stripes", animation: "sweep" }
  );
  logs.push(
    { ...logSkin("Prismatic Rings", 18000, ["#dfc8ff", "#8e79b5", "#564373", "#302641"], "✦"), animation: "rainbow" },
    { ...logSkin("Plasma Heart", 20000, ["#caffed", "#66baa5", "#347769", "#213d40"], "✳"), animation: "pulse" },
    { ...logSkin("Solar Orbit", 22000, ["#ffeab8", "#cf9d51", "#936432", "#553722"], "✦"), animation: "sweep" }
  );
  const themes = [
    { name: "Forest Classic", price: 0, top: "#294740", bottom: "#172d2c", accent: "#f0b16d", panel: "#263b39", text: "#f6ead0" },
    { name: "Ocean Breeze", price: 4000, top: "#245975", bottom: "#102937", accent: "#78dfe8", panel: "#21475b", text: "#e5faff" },
    { name: "Rose Twilight", price: 6000, top: "#64364e", bottom: "#2a1c35", accent: "#ffb3d2", panel: "#4b2c48", text: "#fff0f7" },
    { name: "Royal Violet", price: 8000, top: "#4b3979", bottom: "#211b3f", accent: "#d2b4ff", panel: "#382b59", text: "#f5efff" },
    { name: "Golden Dusk", price: 10000, top: "#6b4932", bottom: "#2c2523", accent: "#ffd080", panel: "#49372c", text: "#fff5df" },
    { name: "Aurora Waves", price: 24000, top: "#24474d", bottom: "#18223d", accent: "#9eeed9", panel: "#26394d", text: "#edfaff", animation: "rainbow" },
    { name: "Neon Fireflies", price: 26000, top: "#273747", bottom: "#121e2b", accent: "#96ffc8", panel: "#233444", text: "#effff6", animation: "pulse" },
    { name: "Solar Streams", price: 28000, top: "#593d45", bottom: "#291e35", accent: "#ffd69a", panel: "#453043", text: "#fff5eb", animation: "sweep" }
  ];
  const modifiers = [
    { name: "Standard Knives", price: 0, width: 1, flight: THROW_DURATION, description: "Normal blade width and 180 ms flight. No modifier active." },
    { name: "Skinny Knives", price: 12000, width: .65, flight: .18, description: "35% narrower knives and knife collision spacing. Easier to fit between blades. Flight speed stays normal." },
    { name: "Quick Throw", price: 14000, width: 1, flight: .13, description: "130 ms flight instead of 180 ms. Combines with Skinny Knives." },
    { name: "Steady Spin", price: 16000, width: 1, flight: THROW_DURATION, description: "Target rotation is 15% slower. Speed changes and reversals still occur." },
    { name: "Golden Apples", price: 18000, width: 1, flight: THROW_DURATION, description: "Apples award $50 instead of $25. Applies in Classic and Endless; Dummy rounds have no apples." },
    { name: "Dummy Padding", price: 10000, width: 1, flight: THROW_DURATION, description: "Dummy limb penalties drop from $25 to $15. Critical core hits still fail. Dummy mode only." }
  ];
  const dummySkins = [
    { name: "Training Original", price: 0, limb: "#a2dfe6", frame: "#243a44", accent: "#80f3ec", pattern: 0 },
    ...[
      ["Night Pilot", "#82a9db", "#253653", "#b6edff"], ["Jungle Ranger", "#a6c878", "#304535", "#e9f6a0"],
      ["Crimson Racer", "#ed879d", "#4e2938", "#ffd59e"], ["Arctic Explorer", "#cff1ff", "#365772", "#9bdcff"],
      ["Thunder Scout", "#e7de87", "#424464", "#fff6bd"], ["Cosmic Captain", "#aa98ee", "#392955", "#a5f9ff"],
      ["Steel Guardian", "#bbc9cf", "#34454f", "#a0f8c1"], ["Ocean Striker", "#77c5e5", "#22445e", "#c8f6ff"],
      ["Neon Rider", "#8df0b4", "#2b3f46", "#d3ff80"], ["Solar Knight", "#eed79b", "#675033", "#fff6d1"],
      ["Rose Dancer", "#f4b5d7", "#69415c", "#ffe7f3"], ["Lavender Star", "#d5bdf6", "#53406f", "#fff0b6"],
      ["Peach Dream", "#ffd2bc", "#7b5167", "#fff3db"], ["Mint Fairy", "#b4efdb", "#3c6b68", "#e6ffef"],
      ["Berry Spark", "#eb94d4", "#683b69", "#fbd8ff"], ["Pearl Mermaid", "#b2e7f4", "#49658e", "#eed6ff"],
      ["Starlight Princess", "#e4d4ff", "#6a558d", "#fff4af"], ["Sunset Blossom", "#fbbbc9", "#885168", "#ffe2b0"],
      ["Aurora Queen", "#b5d6f9", "#566387", "#f9d2ff"], ["Crystal Empress", "#e6fbf7", "#72829b", "#ffd7f1"]
    ].map(([name, limb, frame, accent], index) => ({ name, limb, frame, accent, price: 3000 + (index % 10) * 1500, pattern: index % 3 + 1 }))
  ];
  const shopCatalog = category => ({ knife: knives, log: logs, music: tracks, theme: themes, modifier: modifiers, dummy: dummySkins })[category];
  const shopKeys = category => ({
    knife: ["ownedKnives", "selected"], log: ["ownedLogs", "selectedLog"],
    music: ["ownedMusic", "selectedMusic"], theme: ["ownedThemes", "selectedTheme"], modifier: ["ownedModifiers", "selectedModifier"], dummy: ["ownedDummies", "selectedDummy"]
  })[category];
  const tracks = [
    { name: "Forest Afterglow", price: 0, bpm: 120, root: 57, melody: [0, null, 7, null, 4, null, 7, null, -2, null, 5, null, 2, null, 5, null], bass: [-12, -14], voice: "sine", style: "Original mellow woodland loop" },
    { name: "Neon Sprint", price: 1200, bpm: 140, root: 60, melody: [0, 7, 12, 7, 3, 10, 15, 10, 5, 12, 17, 12, 7, 10, 14, 10], bass: [-12, -9, -7, -5], voice: "square", style: "Bright arcade synth" },
    { name: "Moonlit Pines", price: 1600, bpm: 84, root: 62, melody: [0, null, 3, 7, null, 10, 7, null, 5, null, 8, 12, null, 10, 7, null], bass: [-12, -7, -9, -5], voice: "sine", style: "Dreamy night-time keys" },
    { name: "Copper Groove", price: 2000, bpm: 106, root: 55, melody: [0, null, 3, 5, 7, null, 10, 7, 5, 3, null, 0, -2, 3, 5, null], bass: [-12, -12, -7, -9], voice: "triangle", style: "Warm syncopated groove" },
    { name: "Pixel Parade", price: 2400, bpm: 132, root: 64, melody: [0, 4, 7, 12, 11, 7, 4, 2, 5, 9, 12, 14, 12, 9, 7, 4], bass: [-12, -7, -5, -12], voice: "square", style: "Cheerful retro chiptune" },
    { name: "Rain on Cedar", price: 2800, bpm: 76, root: 59, melody: [0, null, 7, 2, null, 5, null, 9, 4, null, 7, null, 2, 0, null, -3], bass: [-12, -10, -8, -7], voice: "sine", style: "Soft reflective ambience" },
    { name: "Ember Engine", price: 3200, bpm: 148, root: 57, melody: [0, 0, 7, 3, 0, 10, 7, 3, 5, 5, 12, 8, 7, 3, 2, 0], bass: [-12, -9, -7, -12], voice: "sawtooth", style: "Driving electric pulse" },
    { name: "Cherry Blossom", price: 3600, bpm: 96, root: 65, melody: [0, 2, 4, null, 7, 9, 7, null, 4, 2, 0, null, -3, 2, 4, null], bass: [-12, -5, -8, -7], voice: "triangle", style: "Gentle pentatonic melody" },
    { name: "Midnight Circuit", price: 4000, bpm: 118, root: 54, melody: [0, null, 12, 7, 3, null, 10, 7, -2, null, 10, 5, 2, null, 7, 5], bass: [-12, -9, -14, -10], voice: "sawtooth", style: "Deep late-night synth" },
    { name: "Sunshine Shuffle", price: 4400, bpm: 112, root: 60, melody: [0, 4, null, 7, 9, 7, null, 4, 5, 9, null, 12, 11, 7, null, 2], bass: [-12, -8, -5, -7], voice: "triangle", style: "Bouncy sunny rhythm" },
    { name: "Glacier Echo", price: 4800, bpm: 88, root: 67, melody: [0, null, 7, null, 12, 10, null, 7, 3, null, 10, null, 15, 12, null, 10], bass: [-24, -21, -19, -22], voice: "sine", style: "Crystalline spacious bells" },
    { name: "Boss Rush", price: 5200, bpm: 156, root: 52, melody: [0, 3, 7, 12, 7, 3, 0, 2, 3, 7, 10, 15, 14, 10, 7, 2], bass: [-12, -9, -5, -7], voice: "square", style: "High-energy battle theme" },
    { name: "Velvet Grove", price: 5600, bpm: 92, root: 58, melody: [0, 3, null, 7, 10, null, 9, 7, 5, 8, null, 12, 10, null, 7, 3], bass: [-12, -9, -7, -5], voice: "triangle", style: "Laid-back woodland lounge" },
    { name: "Starlight Waltz", price: 6000, bpm: 102, root: 63, melody: [0, 4, 7, 12, 7, 4, 5, 9, 12, 14, 12, 9], bass: [-12, -7, -5, -7], voice: "sine", style: "Flowing three-beat dance", beats: 3 },
    { name: "Thunder Trail", price: 6500, bpm: 144, root: 55, melody: [0, 7, 0, 3, 10, 7, 3, 0, 5, 12, 5, 8, 15, 12, 8, 7], bass: [-12, -9, -7, -5], voice: "sawtooth", style: "Punchy storm-chasing rhythm" },
    { name: "Bubblegum Bounce", price: 7000, bpm: 128, root: 69, melody: [0, 4, 7, null, 12, 11, 9, 7, 5, 9, 12, null, 14, 12, 9, 4], bass: [-24, -20, -19, -17], voice: "square", style: "Playful candy-colored pop" },
    { name: "Desert Caravan", price: 7500, bpm: 108, root: 57, melody: [0, 1, 4, 5, 7, null, 8, 7, 5, 4, 1, null, -1, 1, 4, null], bass: [-12, -11, -7, -8], voice: "triangle", style: "Winding desert melody" },
    { name: "Aurora Drift", price: 8000, bpm: 80, root: 66, melody: [0, null, 4, 7, null, 11, 14, null, 9, null, 7, 4, null, 2, 4, null], bass: [-24, -20, -17, -19], voice: "sine", style: "Floating northern-light ambience" },
    { name: "Timber Disco", price: 8500, bpm: 124, root: 60, melody: [0, null, 7, 10, 12, null, 10, 7, 5, null, 12, 15, 17, null, 15, 12], bass: [-12, -9, -7, -5], voice: "triangle", style: "Retro dance-floor groove" },
    { name: "Royal Victory", price: 9000, bpm: 116, root: 62, melody: [0, 4, 7, 12, null, 11, 9, 7, 5, 9, 12, 17, null, 14, 12, 7], bass: [-12, -8, -5, -7], voice: "square", style: "Triumphant arcade anthem" },
    { name: "Cosmic Canopy", price: 10000, bpm: 136, root: 61, melody: [0, 7, 14, 11, 4, 11, 16, 14, 2, 9, 16, 12, 5, 12, 19, 16], bass: [-24, -20, -22, -19], voice: "sine", style: "Sparkling space arpeggios" }
  ];
  const defaults = { best: 0, wallet: 0, classicStage: 1, selected: 0, selectedLog: 0, selectedMusic: 0, selectedTheme: 0, selectedModifier: 0, selectedDummy: 0, activeModifiers: [], ownedKnives: [0], ownedLogs: [0], ownedMusic: [0], ownedThemes: [0], ownedModifiers: [0], ownedDummies: [0], music: 0.35, sound: 0.65 };
  let save = { ...defaults };
  let shopCategory = "knife";
  let shopPage = 0;
  let shopDetail = null;
  let visualTime = 0;
  let previewFrame = 0;
  const reducedMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const SHOP_PAGE_SIZE = 4;
  let levelPage = 0;
  let resetFromPause = false;
  const LEVEL_PAGE_SIZE = 12;
  let storageAvailable = true;
  function ownedItems(value, catalog) {
    return [...new Set([0, ...(Array.isArray(value) ? value.filter(i => Number.isInteger(i) && i >= 0 && i < catalog.length) : [])])];
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (stored && typeof stored === "object") {
      save.best = Number.isSafeInteger(stored.best) ? Math.max(0, stored.best) : 0;
      // Legacy saves receive their personal best once as starter cash.
      save.wallet = stored.wallet === undefined ? save.best : (Number.isSafeInteger(stored.wallet) ? Math.max(0, stored.wallet) : 0);
      save.classicStage = Number.isFinite(stored.classicStage) ? Math.max(1, Math.floor(stored.classicStage)) : 1;
      save.ownedKnives = ownedItems(stored.ownedKnives, knives);
      save.ownedLogs = ownedItems(stored.ownedLogs, logs);
      save.ownedMusic = ownedItems(stored.ownedMusic, tracks);
      save.ownedThemes = ownedItems(stored.ownedThemes, themes);
      save.ownedModifiers = ownedItems(stored.ownedModifiers, modifiers);
      save.ownedDummies = ownedItems(stored.ownedDummies, dummySkins);
      save.selectedDummy = save.ownedDummies.includes(stored.selectedDummy) ? stored.selectedDummy : 0;
      save.selected = save.ownedKnives.includes(stored.selected) ? stored.selected : 0;
      save.selectedLog = save.ownedLogs.includes(stored.selectedLog) ? stored.selectedLog : 0;
      save.selectedMusic = save.ownedMusic.includes(stored.selectedMusic) ? stored.selectedMusic : 0;
      save.selectedTheme = save.ownedThemes.includes(stored.selectedTheme) ? stored.selectedTheme : 0;
      save.selectedModifier = save.ownedModifiers.includes(stored.selectedModifier) ? stored.selectedModifier : 0;
      save.activeModifiers = [...new Set((Array.isArray(stored.activeModifiers) ? stored.activeModifiers : [save.selectedModifier])
        .filter(index => index > 0 && save.ownedModifiers.includes(index)))];
      save.music = Number.isFinite(stored.music) ? Math.max(0, Math.min(1, stored.music)) : defaults.music;
      save.sound = Number.isFinite(stored.sound) ? Math.max(0, Math.min(1, stored.sound)) : defaults.sound;
    }
  } catch (error) {
    console.warn("Saved progress could not be read:", error);
    storageAvailable = false;
  }
  function persist() {
    try { localStorage.setItem(STORAGE, JSON.stringify(save)); storageAvailable = true; }
    catch (error) { console.warn("Progress could not be saved:", error); storageAvailable = false; }
    updateSide();
    return storageAvailable;
  }
  const money = amount => `$${amount.toLocaleString("en-US")}`;
  function modifierEffects(active = game.activeModifiers) {
    return { width: active.includes(1) ? .65 : 1, flight: active.includes(2) ? .13 : THROW_DURATION,
      spin: active.includes(3) ? .85 : 1, apple: active.includes(4) ? 50 : APPLE_BONUS,
      penalty: active.includes(5) ? 15 : LIMB_PENALTY };
  }
  function activeTheme() {
    return themes[game.state === "shop-detail" && shopDetail?.category === "theme" ? shopDetail.index : save.selectedTheme];
  }
  function applyTheme() {
    const theme = activeTheme();
    const style = document.documentElement.style;
    for (const key of ["top", "bottom", "accent", "panel", "text"]) style.setProperty(`--theme-${key}`, theme[key]);
    document.documentElement.classList.toggle("custom-theme", (game.state === "shop-detail" && shopDetail?.category === "theme" ? shopDetail.index : save.selectedTheme) !== 0);
  }
  function animatedColor(skin) {
    return skin.animation === "rainbow" ? `hsl(${(visualTime * 35) % 360}, 85%, 75%)` : skin.accent || skin.light;
  }
  function rewards(level) {
    const difficulty = Math.min(20, level);
    return { throw: 5 + Math.floor(difficulty / 5), completion: 25 + difficulty * 5 + (isBoss(level) ? 75 : 0) };
  }
  function earn(amount) {
    game.score += amount; game.stagePoints += amount;
    if (game.mode === "dummy") { updateHud(); return; }
    save.wallet += amount;
    save.best = Math.max(save.best, game.score);
    if (!persist()) announce("Storage unavailable: money isn't saved");
  }
  function shopItem(category, index) {
    const catalog = shopCatalog(category);
    if (!catalog || !Number.isInteger(index) || !catalog[index]) {
      console.warn("Invalid shop item:", category, index);
      return { ok: false, message: "That item is unavailable." };
    }
    const item = catalog[index];
    const [ownedKey, selectedKey] = shopKeys(category);
    const owned = save[ownedKey].includes(index);
    if (!owned && save.wallet < item.price) {
      return { ok: false, message: `You need ${money(item.price - save.wallet)} more for ${item.name}.` };
    }
    const before = { ...save, activeModifiers: [...save.activeModifiers], ownedKnives: [...save.ownedKnives], ownedLogs: [...save.ownedLogs], ownedMusic: [...save.ownedMusic], ownedThemes: [...save.ownedThemes], ownedModifiers: [...save.ownedModifiers], ownedDummies: [...save.ownedDummies] };
    if (!owned) { save.wallet -= item.price; save[ownedKey] = [...save[ownedKey], index]; }
    save[selectedKey] = index;
    if (category === "modifier") {
      save.activeModifiers = index === 0 ? [] : save.activeModifiers.includes(index)
        ? save.activeModifiers.filter(active => active !== index) : [...save.activeModifiers, index];
      save.selectedModifier = 0;
    }
    if (!persist()) {
      save = before; updateSide();
      return { ok: false, message: "Purchase not saved. No money spent. Enable browser storage and try again." };
    }
    if (category === "music") audio.switchTrack();
    if (category === "theme") applyTheme();
    return { ok: true, message: category === "modifier" ? `${item.name}: ${index === 0 ? "all modifiers off" : save.activeModifiers.includes(index) ? "active" : "inactive"}. Applies next round.` : `${item.name} ${category === "music" ? (owned ? "selected" : "purchased and selected") : (owned ? "equipped" : "purchased and equipped")}!` };
  }

  const audio = {
    context: null, musicTimer: null, note: 0, musicNodes: new Set(), previewTrack: null,
    init() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context = new AudioContext();
      }
      if (this.context.state === "suspended") this.context.resume().catch(error => console.warn("Audio could not start:", error));
      if (!this.musicTimer) this.switchTrack();
    },
    switchTrack(preview = null) {
      this.previewTrack = preview;
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = null; this.note = 0;
      this.musicNodes.forEach(node => node.stop());
      this.musicNodes.clear();
      if (!this.context) return;
      this.musicTimer = setInterval(() => this.musicStep(), 30000 / tracks[this.previewTrack ?? save.selectedMusic].bpm);
      this.musicStep();
    },
    tone(freq, duration, type, volume, slide = 1, delay = 0, music = false) {
      if (!this.context || this.context.state !== "running" || volume <= 0) return;
      const t = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, t);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + duration);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      oscillator.connect(gain); gain.connect(this.context.destination);
      if (music) this.musicNodes.add(oscillator);
      oscillator.onended = () => { this.musicNodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(t); oscillator.stop(t + duration + 0.02);
    },
    effect(name) {
      const v = save.sound;
      if (name === "button") this.tone(620, .08, "sine", .08 * v, 1.2);
      if (name === "throw") { this.tone(440, .13, "sine", .13 * v, 2.2); this.tone(170, .11, "triangle", .06 * v, 2); }
      if (name === "wood") { this.tone(125, .13, "triangle", .27 * v, .45); this.tone(680, .06, "square", .035 * v, .35); }
      if (name === "crash") { this.tone(210, .36, "sawtooth", .12 * v, .35); this.tone(830, .22, "square", .045 * v, .32); }
      if (name === "apple") { this.tone(880, .12, "sine", .12 * v, 1.5); this.tone(1320, .18, "sine", .09 * v, 1, .07); }
      if (name === "win") [440, 554, 659, 880].forEach((f, i) => this.tone(f, .28, "sine", .11 * v, 1, i * .09));
    },
    musicStep() {
      if (!this.context || this.context.state !== "running") return;
      const index = this.previewTrack ?? save.selectedMusic;
      const track = tracks[index], n = this.note++ % track.melody.length;
      const frequency = offset => 440 * 2 ** ((track.root + offset - 69) / 12);
      const duration = 30 / track.bpm;
      const play = (offset, length, voice, volume) => this.tone(frequency(offset), length, voice, volume * save.music, 1, 0, true);
      if (track.melody[n] !== null) play(track.melody[n], duration * 2.6, track.voice, track.voice === "sine" ? .045 : .018);
      const bar = (track.beats || 4) * 2;
      if (n % 4 === 0) play(index === 0 ? (n < 8 ? -12 : -14) : track.bass[Math.floor(n / 4) % track.bass.length], duration * 4, "triangle", .025);
      if (index !== 0 && n % 2 === 0) {
        this.tone(n % bar === 0 ? 90 : 170, .09, "triangle", .045 * save.music, .4, 0, true);
        if (n % bar !== 0) this.tone(1700, .035, "square", .004 * save.music, .5, 0, true);
      }
    }
  };

  const game = {
    state: "menu", mode: "classic", level: 1, score: 0,
    modifier: 0, activeModifiers: [],
    required: 6, landed: 0, rotation: 0, speed: .8, targetSpeed: .8, changeIn: 4,
    rotationPhase: 0, changesSinceReverse: 0,
    radius: 145, embedded: [], apple: null, flight: null, particles: [], shake: 0,
    timer: 0, elapsed: 0, lastTime: 0, stagePoints: 0, stagePenalty: 0, dummy: null, debris: []
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const isBoss = level => level % 5 === 0;
  function config(level) {
    const boss = isBoss(level);
    const required = 6 + Math.min(3, Math.floor((level - 1) / 4)) + ((level - 1) % 3)
      + (boss ? 1 : 0) - (!boss && level > 1 && level % 5 === 1 ? 1 : 0);
    const radius = boss ? 164 : Math.max(122, 147 - Math.floor((level - 1) / 3) * 4);
    const difficulty = Math.min(level - 1, 18);
    const rotation = {
      cruise: 1.25 + difficulty * .085,
      slow: Math.max(.22, .85 - difficulty * .06),
      fast: 1.65 + difficulty * .12 + (boss ? .35 : 0),
      hold: Math.max(.55, 1.65 - difficulty * .075 - (boss ? .2 : 0)),
      response: 2 + difficulty * .2 + (boss ? .6 : 0),
      reverseChance: level < 3 ? 0 : Math.min(.65, .25 + difficulty * .025)
    };
    return { boss, required, radius, spacing: Math.min(.205, 24 / radius), rotation };
  }
  function changeRotation() {
    const pattern = config(game.level).rotation;
    game.rotationPhase++;
    game.changesSinceReverse++;
    const reverse = game.level >= 3
      && (game.changesSinceReverse >= 3 || Math.random() < pattern.reverseChance);
    const direction = Math.sign(game.targetSpeed) * (reverse ? -1 : 1);
    if (reverse) game.changesSinceReverse = 0;
    const speed = game.rotationPhase % 2 ? pattern.slow : pattern.fast;
    game.targetSpeed = direction * speed * (.85 + Math.random() * .3) * modifierEffects().spin;
    game.changeIn = pattern.hold + Math.random() * .45;
  }
  function updateSide() {
    $("best-side").textContent = money(save.wallet);
    $("progress-side").textContent = String(save.classicStage).padStart(2, "0");
    $("progress-fill").style.width = `${((save.classicStage - 1) % 5 + 1) * 20}%`;
  }
  function updateHud() {
    $("mode-label").textContent = game.mode === "dummy" ? "DUMMY CHALLENGE" : game.mode === "classic" ? "CLASSIC MODE" : "ENDLESS MODE";
    $("level-label").textContent = `STAGE ${String(game.level).padStart(2, "0")}`;
    $("stage-kind").textContent = isBoss(game.level) ? "BOSS ENCOUNTER" : game.level === 1 ? "THE WARM UP" : "FIND YOUR RHYTHM";
    $("score-label").textContent = money(save.wallet);
    $("remaining-label").innerHTML = `${String(game.required - game.landed).padStart(2, "0")} <small>/ ${String(game.required).padStart(2, "0")}</small>`;
    $("pause-button").style.visibility = game.state === "playing" ? "visible" : "hidden";
    $("throw-hint").style.visibility = game.state === "playing" ? "visible" : "hidden";
    $("dummy-status").hidden = game.mode !== "dummy" || !["playing", "paused", "finishing"].includes(game.state);
    $("dummy-status").textContent = `EARNED ${money(game.stagePoints)} · PENALTY -${money(game.stagePenalty)} · TOTAL ${money(Math.max(0, game.stagePoints - game.stagePenalty))}`;
  }
  function showScreen(html) {
    screen.className = game.state === "collection" ? "screen shop-screen" : game.state === "shop-detail" ? "screen detail-screen" : game.state === "level-select" ? "screen level-screen" : "screen";
    screen.classList.toggle("menu-screen", game.state === "menu");
    overlay.classList.toggle("item-detail", game.state === "shop-detail");
    screen.innerHTML = html;
    overlay.classList.remove("hidden");
    screen.scrollTop = 0;
    fitScreen();
    updateHud();
  }
  function fitScreen() {
    if (!overlay.clientHeight || !screen.offsetHeight) return;
    const padding = getComputedStyle(overlay);
    const horizontal = parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight);
    const vertical = parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom);
    const scale = Math.min(1, (overlay.clientWidth - horizontal) / screen.offsetWidth, (overlay.clientHeight - vertical) / screen.offsetHeight);
    screen.style.setProperty("--screen-scale", Math.max(0, scale));
  }
  function hideScreen() { overlay.classList.add("hidden"); updateHud(); }
  function button(label, action, primary = false) {
    return `<button class="button${primary ? " primary" : ""}" data-action="${action}">${label}</button>`;
  }
  function menu() {
    if (audio.previewTrack !== null) audio.switchTrack();
    shopDetail = null;
    applyTheme();
    abandonDummyRound();
    game.state = "menu"; game.flight = null; game.particles = []; game.dummy = null; game.debris = [];
    showScreen(`<div class="menu-ornament">✳</div><div class="overline">WELCOME TO THE THROWING CLUB</div>
      <h2>Timber <em>&</em><br>Steel<span style="color:#f0b16d">.</span></h2>
      <p class="subtitle">A little game of timing, timber, and very sharp things.</p>
      <div class="menu-buttons">${button("Play classic &nbsp; →", "classic", true)}${button("Level select", "levels")}${button("Endless mode &nbsp; ↗", "endless")}${button("Training dummy", "dummy")}${button("Skin shop", "collection")}${button("Settings", "settings")}</div>
      <div class="menu-meta"><div>YOUR MONEY<strong>${money(save.wallet)}</strong></div><div>CLASSIC STAGE<strong>${String(save.classicStage).padStart(2, "0")}</strong></div></div>
      ${storageAvailable ? "" : '<p class="subtitle">Progress could not be saved in this browser.</p>'}`);
  }
  function startRun(mode) {
    abandonDummyRound(); game.stagePoints = 0;
    game.mode = mode; game.level = mode === "classic" ? save.classicStage : 1;
    game.score = 0; startStage();
  }
  function dummyIntro() {
    game.state = "dummy-intro";
    showScreen(`<div class="overline">PRECISION TRAINING</div><h2>Mind the <em>machine.</em></h2>
      <p class="subtitle">A mechanical dummy is tied at its wrists and ankles. Hit blue limbs and the loose section swings from its rope. Aim for clear wood.</p>
      <div class="reward-line">BLUE LIMBS: SPLIT & -${money(modifierEffects(save.activeModifiers).penalty)}<br><br>ORANGE HEAD / NECK / TORSO: ROUND FAILED<br><br>Knives already in the log still cause collisions.</div>
      <p class="subtitle">Round winnings are banked only after completion. Failure or restart forfeits this round's pending money, never your saved wallet.</p>
      <div class="menu-buttons">${button("Start challenge", "start-dummy", true)}${button("Main menu", "menu")}</div>`);
  }
  function abandonDummyRound() {
    if (game.mode !== "dummy") return;
    if (game.state !== "victory") game.score -= game.stagePoints;
    game.stagePoints = 0; game.stagePenalty = 0;
  }
  function selectLevel(level) {
    if (!Number.isInteger(level) || level < 1 || level > save.classicStage) {
      console.warn("Cannot start a locked or invalid level:", level);
      announce("Complete earlier stages to unlock this level");
      return false;
    }
    game.mode = "classic"; game.level = level; game.score = 0;
    startStage();
    return true;
  }
  function levelSelect() {
    game.state = "level-select"; game.flight = null;
    const pages = Math.ceil((save.classicStage + 1) / LEVEL_PAGE_SIZE);
    levelPage = Math.max(0, Math.min(levelPage, pages - 1));
    const first = levelPage * LEVEL_PAGE_SIZE + 1;
    const levels = Array.from({ length: Math.min(LEVEL_PAGE_SIZE, save.classicStage + 2 - first) }, (_, i) => {
      const level = first + i, locked = level > save.classicStage;
      return `<button class="level-card${isBoss(level) ? " boss" : ""}" data-level="${level}" ${locked ? "disabled" : ""} aria-label="Level ${level}${locked ? ", locked" : ""}"><strong>${String(level).padStart(2, "0")}</strong><small>${locked ? "LOCKED" : isBoss(level) ? "BOSS" : level === save.classicStage ? "LATEST" : "REPLAY"}</small></button>`;
    }).join("");
    showScreen(`<div class="overline">CLASSIC MODE</div><h2>Choose your <em>stage.</em></h2>
      <p class="subtitle">Replay any unlocked level. Your money and skins stay yours.</p>
      <div class="level-grid">${levels}</div>
      <div class="shop-pagination"><button class="button" data-level-page="-1" ${levelPage === 0 ? "disabled" : ""} aria-label="Previous levels">‹</button><span>PAGE ${levelPage + 1} / ${pages}</span><button class="button" data-level-page="1" ${levelPage === pages - 1 ? "disabled" : ""} aria-label="Next levels">›</button></div>
      <div class="menu-buttons level-nav">${button("Back to menu", "menu", true)}</div>`);
  }
  function startStage() {
    game.activeModifiers = [...save.activeModifiers];
    game.modifier = game.activeModifiers.includes(1) ? 1 : 0;
    abandonDummyRound();
    const c = config(game.level);
    game.required = game.mode === "dummy" ? Math.min(9, c.required) : c.required;
    game.radius = game.mode === "dummy" ? 156 : c.radius; game.landed = 0;
    game.stagePoints = 0;
    game.rotation = Math.random() * TAU;
    game.speed = (Math.random() < .5 ? -1 : 1) * c.rotation.cruise;
    game.speed *= modifierEffects().spin;
    game.targetSpeed = game.speed;
    game.rotationPhase = 0; game.changesSinceReverse = 0;
    game.changeIn = game.level < 3 ? 1.7 : .45 + Math.random() * .35;
    game.elapsed = 0; game.flight = null; game.particles = []; game.shake = 0;
    game.embedded = c.boss ? [{ angle: 0, knife: 0, obstacle: true }, { angle: Math.PI, knife: 0, obstacle: true }] : [];
    const appleAngle = (game.rotation + Math.PI / 3) % TAU;
    const blocked = game.embedded.some(k => angleDistance(k.angle, appleAngle) < .4);
    game.apple = { angle: blocked ? appleAngle + Math.PI / 2 : appleAngle };
    game.dummy = game.mode === "dummy" ? new Set(dummyParts.map(part => part.name)) : null;
    game.debris = []; game.stagePenalty = 0;
    if (game.mode === "dummy") { game.embedded = []; game.apple = null; }
    game.state = "playing";
    hideScreen(); updateHud();
    announce(`${c.boss ? "Boss encounter!" : `Stage ${game.level}`}${game.activeModifiers.length ? ` · ${game.activeModifiers.length} modifiers active` : ""}`);
  }
  function announce(text) {
    const el = $("announcement"); el.textContent = text; el.classList.remove("show");
    void el.offsetWidth; el.classList.add("show");
  }
  function pause() {
    if (game.state !== "playing") return;
    game.state = "paused";
    showScreen(`<div class="menu-ornament">Ⅱ</div><div class="overline">TAKE A BREATHER</div><h2>On <em>pause.</em></h2>
      <p class="subtitle">Your target isn't going anywhere.</p><div class="menu-buttons">${button("Resume", "resume", true)}${button("Restart stage", "restart")}${button("Sound settings", "pause-settings")}${button("Main menu", "menu", false)}</div>`);
  }
  function settings(fromPause) {
    game.state = fromPause ? "pause-settings" : "settings";
    showScreen(`<div class="overline">MAKE YOURSELF AT HOME</div><h2>Sound <em>check<button class="secret-period" data-action="bonus-money" aria-label="Period">.</button></em></h2>
      <p class="subtitle">Set the mood for your next throw.</p>
      <label class="settings-row">MUSIC <span id="music-value">${Math.round(save.music * 100)}%</span><input type="range" min="0" max="100" value="${Math.round(save.music * 100)}" data-volume="music" aria-label="Music volume"></label>
      <label class="settings-row">SOUND EFFECTS <span id="sound-value">${Math.round(save.sound * 100)}%</span><input type="range" min="0" max="100" value="${Math.round(save.sound * 100)}" data-volume="sound" aria-label="Sound effects volume"></label>
      <div class="menu-buttons">${button("Back", fromPause ? "back-pause" : "menu", true)}<button class="button danger" data-action="reset-profile">Reset profile</button></div>`);
  }
  function bonusMoney() {
    if (game.state !== "settings" && game.state !== "pause-settings") return;
    if (!Number.isSafeInteger(save.wallet + 1000)) {
      console.warn("Bonus exceeds wallet limit.");
      announce("Wallet limit reached."); return;
    }
    const before = save.wallet;
    save.wallet += 1000;
    if (!persist()) {
      save.wallet = before; updateSide();
      announce("Bonus not saved. Your money is unchanged."); return;
    }
    updateHud(); announce("Secret bonus! +$1,000");
  }
  function confirmReset(message = "") {
    game.state = "reset-confirm";
    showScreen(`<div class="overline">START FRESH</div><h2>Reset your <em>profile?</em></h2>
      <p class="subtitle">This permanently clears all money, best earnings, level progress, purchased skins, themes, and music tracks. It also restores default sound settings and ends the current run.</p>
      <div class="reward-line">WALLET: $0<br><br>PROGRESS: LEVEL 1<br><br>FREE STARTER SKINS & ORIGINAL MUSIC ONLY</div>
      ${message ? `<p class="shop-message" role="alert">${message}</p>` : ""}
      <div class="menu-buttons">${button("Cancel", "cancel-reset", true)}<button class="button danger" data-action="confirm-reset">Reset everything</button></div>`);
  }
  function resetProfile() {
    const before = save;
    save = { ...defaults, activeModifiers: [], ownedKnives: [0], ownedLogs: [0], ownedMusic: [0], ownedThemes: [0], ownedModifiers: [0], ownedDummies: [0] };
    if (!persist()) {
      save = before; updateSide();
      confirmReset("Reset could not be saved. Your profile is unchanged. Enable browser storage and try again.");
      return false;
    }
    game.mode = "classic"; game.level = 1; game.score = 0;
    game.modifier = 0; game.activeModifiers = [];
    game.stagePoints = 0; game.stagePenalty = 0; game.landed = 0;
    game.required = config(1).required; game.radius = config(1).radius;
    game.embedded = []; game.apple = null; game.flight = null;
    game.dummy = null; game.debris = []; game.particles = []; game.shake = 0;
    game.timer = 0; game.elapsed = 0; game.lastTime = 0;
    game.speed = .8; game.targetSpeed = .8; game.changeIn = 4;
    game.rotationPhase = 0; game.changesSinceReverse = 0;
    shopCategory = "knife"; shopPage = 0; levelPage = 0;
    audio.switchTrack(); menu(); announce("Profile reset. Fresh start!");
    return true;
  }
  function collection(message = "") {
    if (audio.previewTrack !== null) audio.switchTrack();
    shopDetail = null;
    game.state = "collection";
    applyTheme();
    const isKnife = shopCategory === "knife";
    const isMusic = shopCategory === "music";
    const [ownedKey, selectedKey] = shopKeys(shopCategory);
    const owned = save[ownedKey], selected = save[selectedKey];
    const items = shopCatalog(shopCategory).map((item, index) => ({ item, index }));
    const pages = Math.ceil(items.length / SHOP_PAGE_SIZE);
    shopPage = Math.max(0, Math.min(shopPage, pages - 1));
    const cards = items.slice(shopPage * SHOP_PAGE_SIZE, (shopPage + 1) * SHOP_PAGE_SIZE).map(({ item, index }) => {
      const unlocked = owned.includes(index);
      const active = shopCategory === "modifier" ? (index === 0 ? save.activeModifiers.length === 0 : save.activeModifiers.includes(index)) : selected === index;
      const knifePreview = isKnife || shopCategory === "modifier";
      const preview = isMusic ? `<div class="music-preview" aria-hidden="true">&#9835;</div><small>${item.style} · ${item.bpm} BPM</small>` : `<canvas class="${knifePreview ? "knife-preview" : "log-preview"}" width="${knifePreview ? 320 : 128}" height="${knifePreview ? 100 : 128}" data-preview="${index}" aria-hidden="true"></canvas>`;
      const label = unlocked ? (active ? (shopCategory === "modifier" ? "ACTIVE" : isMusic ? "SELECTED" : "EQUIPPED") : "VIEW OWNED") : `VIEW · ${money(item.price)}`;
      return `<button class="knife-card${active ? " selected" : ""}${unlocked ? "" : " locked"}" data-category="${shopCategory}" data-item="${index}">${preview}<strong>${item.name.toUpperCase()}</strong>${item.animation ? '<small>ANIMATED PACK</small>' : ""}<small>${label}</small>${!unlocked && save.wallet < item.price ? `<small>NEED ${money(item.price - save.wallet)} MORE</small>` : ""}</button>`;
    }).join("");
    showScreen(`<div class="overline">EARN IT. MAKE IT YOURS.</div><h2>Skin <em>shop.</em></h2>
      <div class="shop-wallet">YOUR MONEY <strong>${money(save.wallet)}</strong></div>
      <div class="shop-tabs" role="group" aria-label="Shop category">${[["knife", "Knives"], ["log", "Logs"], ["music", "Music"], ["theme", "Themes"], ["modifier", "Modifiers"], ["dummy", "Dummies"]].map(([category, label]) => `<button class="button${shopCategory === category ? " primary" : ""}" data-shop-tab="${category}" aria-pressed="${shopCategory === category}">${label}</button>`).join("")}</div>
      <div class="collection-grid">${cards}</div>
      ${pages > 1 ? `<div class="shop-pagination"><button class="button" data-shop-page="-1" ${shopPage === 0 ? "disabled" : ""} aria-label="Previous skins">‹</button><span>PAGE ${shopPage + 1} / ${pages}</span><button class="button" data-shop-page="1" ${shopPage === pages - 1 ? "disabled" : ""} aria-label="Next skins">›</button></div>` : ""}
      <p class="shop-message" role="status">${message || (storageAvailable ? (shopCategory === "modifier" ? `${save.activeModifiers.length} ACTIVE. Toggle any owned modifiers together; applies next round.` : isMusic ? `NOW PLAYING: ${tracks[save.selectedMusic].name}. Original + 20 purchasable songs.` : "Preview before buying. Animated packs are cosmetic only.") : "Browser storage unavailable. Purchases cannot be saved.")}</p>
      <div class="menu-buttons">${button("Back to menu", "menu", true)}</div>`);
    screen.querySelectorAll("[data-preview]").forEach(preview => {
      drawShopPreview(preview.getContext("2d"), shopCategory, Number(preview.dataset.preview));
    });
  }
  function itemDetail(category, index, message = "") {
    const catalog = shopCatalog(category);
    if (!catalog || !Number.isInteger(index) || !catalog[index]) {
      console.warn("Invalid shop preview:", category, index);
      collection("That item is unavailable."); return;
    }
    shopDetail = { category, index };
    game.state = "shop-detail";
    applyTheme();
    const item = catalog[index], isMusic = category === "music";
    const [ownedKey, selectedKey] = shopKeys(category);
    const owned = save[ownedKey].includes(index);
    const selected = category === "modifier" ? (index === 0 ? save.activeModifiers.length === 0 : save.activeModifiers.includes(index)) : save[selectedKey] === index;
    if (isMusic && audio.previewTrack !== index) audio.switchTrack(index);
    const disabled = !owned && save.wallet < item.price;
    const label = category === "modifier" && owned ? (index === 0 ? "Disable all modifiers" : selected ? "Deactivate modifier" : "Activate modifier") : owned ? (selected ? (isMusic ? "Selected" : "Equipped") : (isMusic ? "Select music" : "Equip skin")) : `Buy ${money(item.price)}`;
    showScreen(`<div class="overline">${isMusic ? "LISTEN BEFORE YOU BUY" : item.animation ? "ANIMATED PACK · LIVE PREVIEW" : "UP CLOSE"}</div><h2>${item.name}</h2>
      ${isMusic ? `<div class="detail-music" aria-hidden="true">&#9835;</div><p class="subtitle">${item.style} · ${item.bpm} BPM<br>Preview only. Your selected song is unchanged.${save.music === 0 ? "<br>Music is muted in Settings." : ""}</p>` : `<canvas id="detail-preview" width="640" height="400" aria-label="${item.name} gameplay skin preview"></canvas>`}
      ${category === "modifier" ? `<p class="subtitle">${item.description}<br>Combines with other owned modifiers. Applies next round.</p>` : ""}
      ${category === "dummy" ? '<p class="subtitle">Cosmetic mechanical dummy skin. Orange core stays critical; physics and hitboxes are unchanged.</p>' : ""}
      <div class="shop-wallet">YOUR MONEY <strong>${money(save.wallet)}</strong></div>
      <p class="shop-message" role="status">${message || (disabled ? `You need ${money(item.price - save.wallet)} more.` : owned ? "Already owned. No additional charge." : "Only the Buy button spends money.")}</p>
      <div class="menu-buttons"><button class="button primary" data-action="purchase-item" ${disabled || (owned && selected && category !== "modifier") ? "disabled" : ""}>${label}</button>${button("Back", "back-shop")}</div>`);
    if (!isMusic) {
      drawDetailPreview();
    }
  }
  function drawDetailPreview() {
      if (!shopDetail || shopDetail.category === "music") return;
      const { category, index } = shopDetail;
      const g = $("detail-preview").getContext("2d");
      g.save(); g.clearRect(0, 0, 640, 400);
      if (category === "theme") { g.scale(640 / W, 400 / H); drawBackground(g, index); }
      else {
        g.translate(320, 200);
        if (category === "knife" || category === "modifier") { g.translate(-220, 0); drawKnife(g, category === "knife" ? index : save.selected, 4, category === "modifier" ? modifiers[index].width : modifierEffects(save.activeModifiers).width); }
        else if (category === "dummy") { g.scale(1.25, 1.25); drawDummySkin(g, index); }
        else drawLog(g, index, 147, 1);
      }
      g.restore();
  }
  function drawShopPreview(g, category, index) {
    g.save();
    if (category === "knife" || category === "modifier") {
      g.clearRect(0, 0, 320, 100); g.translate(64, 45);
      drawKnife(g, category === "knife" ? index : save.selected, 2, category === "modifier" ? modifiers[index].width : modifierEffects(save.activeModifiers).width);
    } else if (category === "theme") {
      g.clearRect(0, 0, 128, 128); g.scale(128 / W, 128 / H); drawBackground(g, index);
    } else if (category === "dummy") {
      g.clearRect(0, 0, 128, 128); g.translate(64, 64); g.scale(.43, .43); drawDummySkin(g, index);
    } else {
      g.clearRect(0, 0, 128, 128); g.translate(64, 60); g.scale(.32, .32);
      drawLog(g, index, 147, 1);
    }
    g.restore();
  }
  function victory() {
    game.state = "victory";
    const completed = game.level;
    const bonus = rewards(completed).completion;
    const next = completed + 1;
    if (game.mode === "classic") save.classicStage = Math.max(save.classicStage, next);
    earn(bonus); audio.effect("win");
    const grossEarnings = game.stagePoints;
    if (game.mode === "dummy") {
      const deduction = Math.min(game.stagePoints, game.stagePenalty);
      game.score -= deduction; game.stagePoints -= deduction;
      save.wallet += game.stagePoints;
      save.best = Math.max(save.best, game.score); persist();
    }
    showScreen(`<div class="menu-ornament">✦</div><div class="overline">${isBoss(completed) ? "BOSS DEFEATED" : "BEAUTIFULLY DONE"}</div><h2>Nice <em>work.</em></h2>
      <p class="subtitle">Stage ${completed} is in the books. You've got a good eye.</p>
      <div class="reward-line">EARNED ${money(grossEarnings)} ${isBoss(completed) ? " &nbsp; · &nbsp; BOSS BONUS!" : ""}${game.mode === "dummy" ? `<br><br>LIMB PENALTIES -${money(game.stagePenalty)}<br><br>TOTAL PAYOUT ${money(game.stagePoints)}` : ""}<br><br>WALLET ${money(save.wallet)}</div>
      <div class="menu-buttons">${button("Continue to stage " + next + " &nbsp; →", "continue", true)}${button("Skin shop", "collection")}${button("Main menu", "menu")}</div>`);
  }
  function gameOver(reason = "Two blades can't share the same spot. Give it another go.") {
    const grossEarnings = game.stagePoints, penalty = game.stagePenalty;
    abandonDummyRound();
    game.state = "gameover"; save.best = Math.max(save.best, game.score); persist(); audio.effect("crash");
    showScreen(`<div class="menu-ornament">✕</div><div class="overline">SO CLOSE</div><h2>That's a <em>wrap.</em></h2>
      <p class="subtitle">${reason}</p>
      <div class="reward-line">${game.mode === "dummy" ? `EARNED ${money(grossEarnings)}<br><br>LIMB PENALTIES -${money(penalty)}<br><br>AFTER PENALTIES ${money(Math.max(0, grossEarnings - penalty))}<br><br>TOTAL PAYOUT $0 · ROUND FAILED` : `RUN EARNINGS ${money(game.score)} &nbsp; · &nbsp; STAGE ${game.level}`}<br><br>WALLET ${money(save.wallet)} · ${game.mode === "dummy" ? "SAVED MONEY SAFE; ROUND WINNINGS LOST" : "MONEY KEPT!"}</div>
      <div class="menu-buttons">${button("Retry stage &nbsp; ↻", "restart", true)}${button("Skin shop", "collection")}${button("Main menu", "menu")}</div>`);
  }
  function throwKnife() {
    if (game.state !== "playing" || game.flight) return;
    audio.init(); audio.effect("throw");
    game.flight = { y: 765, from: 765, to: CY + (game.mode === "dummy" ? 100 : game.radius), time: 0, duration: modifierEffects().flight };
  }
  function rayCapsule(angle, part) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const [ax, ay] = part.a, [bx, by] = part.b;
    const hits = [];
    for (const [x, y] of [part.a, part.b]) {
      const projection = x * dx + y * dy;
      const discriminant = part.width ** 2 - (x * x + y * y - projection ** 2);
      if (discriminant >= 0) hits.push(projection + Math.sqrt(discriminant));
    }
    const length = Math.hypot(bx - ax, by - ay);
    if (length > 0) {
      const ux = (bx - ax) / length, uy = (by - ay) / length;
      const nx = -uy, ny = ux, denominator = dx * nx + dy * ny;
      if (Math.abs(denominator) > 1e-8) {
        for (const side of [-1, 1]) {
          const distance = (ax * nx + ay * ny + side * part.width) / denominator;
          const along = (dx * distance - ax) * ux + (dy * distance - ay) * uy;
          if (along >= 0 && along <= length) hits.push(distance);
        }
      }
    }
    return Math.max(0, ...hits.filter(distance => distance >= 80 && distance <= 180));
  }
  function findDummyHit(angle) {
    const hits = dummyParts.filter(part => game.dummy.has(part.name))
      .map(part => ({ part, distance: rayCapsule(angle, part) }))
      .filter(hit => hit.distance > 0);
    hits.sort((a, b) => b.distance - a.distance);
    return hits[0] || null;
  }
  function dummySparks(distance, angle) {
    const world = angle + game.rotation;
    for (let i = 0; i < 18; i++) game.particles.push({
      x: CX + Math.cos(world) * distance, y: CY + Math.sin(world) * distance,
      vx: (Math.random() - .5) * 260, vy: -Math.random() * 200,
      life: .65, max: .65, size: 2 + Math.random() * 4, color: i % 2 ? "#ffe79b" : "#9de6ed"
    });
  }
  function detachLimb(hit, angle) {
    const part = hit.part;
    game.dummy.delete(part.name); game.stagePenalty += modifierEffects().penalty;
    const dx = part.b[0] - part.a[0], dy = part.b[1] - part.a[1];
    const fraction = clamp(((Math.cos(angle) * hit.distance - part.a[0]) * dx
      + (Math.sin(angle) * hit.distance - part.a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    const cut = [part.a[0] + dx * fraction, part.a[1] + dy * fraction];
    const loose = { ...part, a: cut, cutStart: true };
    const wrist = dummyWorld(part.b), tip = dummyWorld(cut);
    const velocity = point => ({
      x: -game.speed * (point.y - CY),
      y: game.speed * (point.x - CX)
    });
    const wristVelocity = velocity(wrist), tipVelocity = velocity(tip);
    game.debris.push({ part: loose, stump: { ...part, b: cut, cutEnd: true },
      joint: [...part.a], stumpTip: { ...tip },
      stumpVelocity: { x: tipVelocity.x + Math.cos(angle + game.rotation) * 50, y: tipVelocity.y - 70 },
      stumpLength: Math.hypot(dx, dy) * fraction, stumpRotation: game.rotation,
      anchor: dummyAnchor(part), wrist, tip,
      wristVelocity, tipVelocity: { x: tipVelocity.x + Math.cos(angle + game.rotation) * 80, y: tipVelocity.y - 110 },
      length: Math.hypot(dx, dy) * (1 - fraction),
      x: (wrist.x + tip.x) / 2, y: (wrist.y + tip.y) / 2, rotation: game.rotation });
    dummySparks(hit.distance, angle); audio.effect("crash"); updateHud();
  }
  function dummyAnchor(part) {
    const distance = Math.hypot(...part.b);
    return part.b.map(value => value * (1 + 20 / distance));
  }
  function dummyWorld(point) {
    const c = Math.cos(game.rotation), s = Math.sin(game.rotation);
    return { x: CX + point[0] * c - point[1] * s, y: CY + point[0] * s + point[1] * c };
  }
  function updateTether(piece, dt) {
    const steps = Math.max(1, Math.ceil(dt * 120)), step = dt / steps;
    if (!step) return;
    for (let i = 0; i < steps; i++) {
      const rotation = game.rotation - game.speed * dt * (1 - (i + 1) / steps);
      const anchor = {
        x: CX + piece.anchor[0] * Math.cos(rotation) - piece.anchor[1] * Math.sin(rotation),
        y: CY + piece.anchor[0] * Math.sin(rotation) + piece.anchor[1] * Math.cos(rotation)
      };
      const joint = {
        x: CX + piece.joint[0] * Math.cos(rotation) - piece.joint[1] * Math.sin(rotation),
        y: CY + piece.joint[0] * Math.sin(rotation) + piece.joint[1] * Math.cos(rotation)
      };
      const previousStump = { ...piece.stumpTip };
      piece.stumpVelocity.x *= Math.exp(-1.2 * step);
      piece.stumpVelocity.y = piece.stumpVelocity.y * Math.exp(-1.2 * step) + 400 * step;
      piece.stumpTip.x += piece.stumpVelocity.x * step;
      piece.stumpTip.y += piece.stumpVelocity.y * step;
      // The proximal section is a rigid pendulum attached only at the shoulder/hip.
      const sx = piece.stumpTip.x - joint.x, sy = piece.stumpTip.y - joint.y;
      const stumpDistance = Math.hypot(sx, sy);
      if (stumpDistance > 1e-8) {
        piece.stumpTip.x = joint.x + sx * piece.stumpLength / stumpDistance;
        piece.stumpTip.y = joint.y + sy * piece.stumpLength / stumpDistance;
      } else {
        piece.stumpTip.x = joint.x; piece.stumpTip.y = joint.y + piece.stumpLength;
      }
      piece.stumpVelocity.x = (piece.stumpTip.x - previousStump.x) / step;
      piece.stumpVelocity.y = (piece.stumpTip.y - previousStump.y) / step;
      const previous = [ { ...piece.wrist }, { ...piece.tip } ];
      for (const [point, velocity] of [[piece.wrist, piece.wristVelocity], [piece.tip, piece.tipVelocity]]) {
        velocity.x *= Math.exp(-1.2 * step); velocity.y *= Math.exp(-1.2 * step);
        velocity.y += 400 * step;
        point.x += velocity.x * step; point.y += velocity.y * step;
      }
      // Solve the rigid fragment and its wrist rope together against the moving log anchor.
      for (let iteration = 0; iteration < 16; iteration++) {
        const dx = piece.tip.x - piece.wrist.x, dy = piece.tip.y - piece.wrist.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 1e-8) {
          const correction = (distance - piece.length) / distance * .5;
          piece.tip.x -= dx * correction; piece.tip.y -= dy * correction;
          piece.wrist.x += dx * correction; piece.wrist.y += dy * correction;
        }
        const rx = piece.wrist.x - anchor.x, ry = piece.wrist.y - anchor.y;
        const ropeDistance = Math.hypot(rx, ry);
        if (ropeDistance > 20) {
          piece.wrist.x = anchor.x + rx * 20 / ropeDistance;
          piece.wrist.y = anchor.y + ry * 20 / ropeDistance;
        }
      }
      [[piece.wrist, piece.wristVelocity], [piece.tip, piece.tipVelocity]].forEach(([point, velocity], index) => {
        velocity.x = (point.x - previous[index].x) / step;
        velocity.y = (point.y - previous[index].y) / step;
      });
    }
    piece.x = (piece.wrist.x + piece.tip.x) / 2; piece.y = (piece.wrist.y + piece.tip.y) / 2;
    const joint = dummyWorld(piece.joint);
    if (piece.stumpLength > 1e-8) piece.stumpRotation = Math.atan2(piece.stumpTip.y - joint.y, piece.stumpTip.x - joint.x)
      - Math.atan2(piece.stump.b[1] - piece.stump.a[1], piece.stump.b[0] - piece.stump.a[0]);
    if (piece.length > 1e-8) piece.rotation = Math.atan2(piece.wrist.y - piece.tip.y, piece.wrist.x - piece.tip.x)
      - Math.atan2(piece.part.b[1] - piece.part.a[1], piece.part.b[0] - piece.part.a[0]);
  }
  function drawDummyRope(g, anchor, wrist) {
    g.lineCap = "round"; g.strokeStyle = "#5d4030"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(...anchor); g.lineTo(...wrist); g.stroke();
    g.strokeStyle = "#dcc49a"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#e8c58a";
    g.beginPath(); g.arc(...anchor, 5, 0, TAU); g.fill();
    g.strokeStyle = "#dcc49a"; g.lineWidth = 4;
    g.beginPath(); g.arc(...wrist, 12, 0, TAU); g.stroke();
  }
  function drawDummySkin(g, index) {
    dummyParts.forEach(part => drawDummyPart(g, part, false, index));
    dummyParts.filter(part => !part.core).forEach(part => drawDummyRope(g, dummyAnchor(part), part.b));
  }
  function drawDummyPart(g, part, centered = false, index = save.selectedDummy) {
    const skin = dummySkins[index];
    g.save();
    if (centered) g.translate(-(part.a[0] + part.b[0]) / 2, -(part.a[1] + part.b[1]) / 2);
    if (part.cutStart || part.cutEnd) {
      const original = dummyParts.find(item => item.name === part.name);
      const direction = Math.atan2(original.b[1] - original.a[1], original.b[0] - original.a[0]);
      const cut = part.cutStart ? part.a : part.b;
      g.translate(...cut); g.rotate(direction);
      g.beginPath(); g.rect(part.cutStart ? 0 : -400, -100, 400, 200); g.clip();
      g.rotate(-direction); g.translate(-cut[0], -cut[1]);
    }
    g.lineCap = "round"; g.strokeStyle = skin.frame; g.lineWidth = part.width * 2 + 5;
    g.beginPath(); g.moveTo(...part.a); g.lineTo(...part.b);
    if (part.name === "head") { g.arc(...part.a, part.width, 0, TAU); g.fillStyle = "#ecae68"; g.fill(); }
    else { g.stroke(); g.strokeStyle = part.core ? "#efb46d" : skin.limb; g.lineWidth = part.width * 2; g.stroke(); }
    if (!part.core && skin.pattern) {
      g.save();
      const dx = part.b[0] - part.a[0], dy = part.b[1] - part.a[1];
      const length = Math.hypot(dx, dy);
      g.translate(...part.a); g.rotate(Math.atan2(dy, dx));
      g.fillStyle = skin.accent;
      for (const fraction of [.3, .55, .8]) {
        const x = fraction * length;
        if (skin.pattern === 1) g.fillRect(x - 2, -part.width + 2, 4, part.width * 2 - 4);
        else if (skin.pattern === 2) { g.beginPath(); g.arc(x, 0, 3, 0, TAU); g.fill(); }
        else { g.beginPath(); g.moveTo(x, -5); g.lineTo(x + 4, 0); g.lineTo(x, 5); g.lineTo(x - 4, 0); g.closePath(); g.fill(); }
      }
      g.restore();
    }
    g.fillStyle = index === 0 ? "#edf6dc" : skin.accent;
    for (const [x, y] of [part.a, part.b]) {
      g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
    }
    if (part.name === "head") {
      g.fillStyle = skin.frame; g.fillRect(-14, -118, 28, 9);
      g.fillStyle = skin.accent; g.fillRect(-10, -116, 7, 4); g.fillRect(3, -116, 7, 4);
    }
    g.restore();
  }
  function drawDummy(g) {
    dummyParts.filter(part => game.dummy.has(part.name)).forEach(part => drawDummyPart(g, part));
    game.debris.forEach(piece => {
      const joint = dummyWorld(piece.joint);
      g.save();
      g.rotate(-game.rotation);
      g.translate((joint.x + piece.stumpTip.x) / 2 - CX, (joint.y + piece.stumpTip.y) / 2 - CY);
      g.rotate(piece.stumpRotation);
      drawDummyPart(g, piece.stump, true);
      g.restore();
    });
    dummyParts.filter(part => !part.core && game.dummy.has(part.name))
      .forEach(part => drawDummyRope(g, dummyAnchor(part), part.b));
    g.strokeStyle = "#5d4030"; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-24, -52); g.lineTo(24, -52); g.moveTo(-24, -5); g.lineTo(24, -5); g.stroke();
    g.strokeStyle = "#dcc49a"; g.lineWidth = 3; g.stroke();
  }
  function impact() {
    const angle = Math.PI / 2 - game.rotation;
    const width = modifierEffects().width;
    const collision = game.embedded.some(k => angleDistance(k.angle, angle) < (game.mode === "dummy" ? .24 : config(game.level).spacing) * (width + (k.width || 1)) / 2);
    game.flight = null; game.shake = collision ? 12 : 5;
    for (let i = 0; i < (collision ? 22 : 13); i++) {
      game.particles.push({ x: CX, y: CY + game.radius, vx: (Math.random() - .5) * 240, vy: -Math.random() * 160 + 30,
        life: .35 + Math.random() * .5, max: .85, size: 2 + Math.random() * 6, color: collision ? (i % 2 ? "#fff0bc" : "#f4a458") : (i % 2 ? "#e9c18a" : "#9b5b36") });
    }
    if (collision) { gameOver(); return; }
    const dummyHit = game.dummy ? findDummyHit(angle) : null;
    if (dummyHit && dummyHit.part.core) {
      dummySparks(dummyHit.distance, angle);
      gameOver("Critical module hit! Avoid the orange head, neck, and torso.");
      return;
    }
    if (dummyHit) detachLimb(dummyHit, angle);
    game.embedded.push({ angle, knife: save.selected, width, radius: game.mode === "dummy" ? 100 : null });
    const appleHit = game.apple && angleDistance(game.apple.angle, angle)
      < APPLE_SIZE / (targetRadius(game.radius, game.apple.angle) + APPLE_SIZE);
    const points = rewards(game.level).throw + (appleHit ? modifierEffects().apple : 0);
    if (appleHit) {
      const worldAngle = game.apple.angle + game.rotation;
      const distance = targetRadius(game.radius, game.apple.angle) + APPLE_SIZE;
      const x = CX + Math.cos(worldAngle) * distance, y = CY + Math.sin(worldAngle) * distance;
      const fruitRandom = random(Math.floor((game.apple.angle + TAU) * 10000));
      for (const half of [-1, 1]) {
        game.particles.push({ x, y, vx: half * 130, vy: -95, life: .9, max: .9,
          size: APPLE_SIZE, kind: "apple", half });
      }
      for (let i = 0; i < 12; i++) game.particles.push({ x, y, vx: (fruitRandom() - .5) * 220,
        vy: -fruitRandom() * 180, life: .5, max: .5, size: 3 + fruitRandom() * 4,
        color: i % 2 ? "#ffe7af" : "#f76653" });
      game.apple = null;
      audio.effect("apple");
    }
    game.landed++; earn(points);
    audio.effect("wood"); updateHud();
    if (storageAvailable) announce(dummyHit ? `Module detached! -${money(modifierEffects().penalty)}` : appleHit ? `Apple! +${money(modifierEffects().apple)} bonus` : `+${money(points)}`);
    if (game.landed === game.required) {
      game.state = "finishing"; game.timer = .85;
      if (isBoss(game.level)) {
        for (let i = 0; i < 50; i++) game.particles.push({ x: CX, y: CY, vx: (Math.random() - .5) * 480, vy: (Math.random() - .5) * 460, life: .8 + Math.random(), max: 1.8, size: 3 + Math.random() * 6, color: ["#ffd890", "#f5a85c", "#e7edd1"][i % 3] });
      }
    }
  }

  function random(seed) {
    let value = seed;
    return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
  }
  function makeWood(skin) {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d"), rnd = random(52342);
    const grad = g.createRadialGradient(220, 180, 5, 256, 256, 300);
    grad.addColorStop(0, skin.light); grad.addColorStop(.55, skin.middle); grad.addColorStop(1, skin.dark);
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 20; i++) {
      g.beginPath(); g.strokeStyle = i % 2 ? skin.grain : skin.highlight; g.lineWidth = 2 + rnd() * 5;
      const r = 18 + i * 12; g.ellipse(255 + rnd() * 12, 255 + rnd() * 12, r, r * (.88 + rnd() * .12), rnd() * .3, 0, TAU); g.stroke();
    }
    for (let i = 0; i < 230; i++) {
      const x = rnd() * 512, y = rnd() * 512;
      g.beginPath(); g.strokeStyle = rnd() > .5 ? skin.grain : skin.highlight; g.lineWidth = .5 + rnd() * 2;
      g.moveTo(x, y); g.bezierCurveTo(x + 5, y + 8, x - 5, y + 18, x + rnd() * 8, y + 25 + rnd() * 35); g.stroke();
    }
    return c;
  }
  const woodTextures = logs.map(makeWood);
  function drawApple(g, half = 0) {
    g.save();
    if (half) {
      g.beginPath(); g.rect(half < 0 ? -30 : 0, -35, 30, 65); g.clip();
    }
    g.shadowColor = "#091a1580"; g.shadowBlur = 8; g.shadowOffsetY = 4;
    const red = g.createRadialGradient(-8, -9, 2, 0, 0, 28);
    red.addColorStop(0, "#ff9a69"); red.addColorStop(.45, "#ef554b"); red.addColorStop(1, "#ab273a");
    g.fillStyle = red; g.strokeStyle = "#8c2631"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -17);
    g.bezierCurveTo(-24, -30, -31, 6, -12, 21);
    g.quadraticCurveTo(-5, 25, 0, 20);
    g.quadraticCurveTo(5, 25, 12, 21);
    g.bezierCurveTo(31, 6, 24, -30, 0, -17); g.fill(); g.stroke();
    g.shadowColor = "transparent";
    g.strokeStyle = "#795336"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, -17); g.quadraticCurveTo(-2, -24, 4, -29); g.stroke();
    g.fillStyle = "#9dc768"; g.beginPath(); g.ellipse(11, -24, 10, 4, -.45, 0, TAU); g.fill();
    g.fillStyle = "#ffe2ba8c"; g.beginPath(); g.ellipse(-10, -8, 3, 7, .4, 0, TAU); g.fill();
    if (half) {
      g.fillStyle = "#ffe7af"; g.beginPath(); g.ellipse(half * 5, 2, 6, 16, 0, 0, TAU); g.fill();
      g.fillStyle = "#805335"; g.beginPath(); g.ellipse(half * 4, 3, 1.5, 3, half * .3, 0, TAU); g.fill();
    }
    g.restore();
  }
  function drawKnife(g, skin, scale = 1, width = modifierEffects().width) {
    const k = knives[skin] || knives[0];
    const style = k.style || skin;
    g.save(); g.scale(scale, scale * width);
    g.shadowColor = "#071511aa"; g.shadowBlur = 7; g.shadowOffsetY = 4;
    const metal = g.createLinearGradient(0, -11, 0, 11);
    metal.addColorStop(0, "#f7ffff"); metal.addColorStop(.36, k.color); metal.addColorStop(.55, "#9eafad"); metal.addColorStop(1, "#edf5ee");
    g.fillStyle = metal; g.strokeStyle = "#586a68"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-20, 0);
    if (style === 1) { g.quadraticCurveTo(-3, -9, 15, -9); g.lineTo(58, -9); g.lineTo(70, -5); }
    else if (style === 2) { g.lineTo(4, -7); g.lineTo(14, -9); g.lineTo(59, -9); g.lineTo(70, -5); }
    else if (style === 3) { g.quadraticCurveTo(-4, -10, 12, -9); g.lineTo(55, -9); g.lineTo(70, -6); }
    else { g.lineTo(7, -9); g.lineTo(63, -9); g.lineTo(70, -6); }
    g.lineTo(70, 6); g.lineTo(63, 9); g.lineTo(7, 9); g.closePath(); g.fill(); g.stroke();
    g.shadowColor = "transparent"; g.strokeStyle = "#ffffff9c"; g.lineWidth = 1; g.beginPath(); g.moveTo(-9, -1); g.lineTo(62, -5); g.stroke();
    if (skin === 2 || skin === 3) { g.strokeStyle = skin === 2 ? "#467b86" : "#b47f37"; g.lineWidth = 1; g.beginPath(); g.moveTo(20, 2); g.lineTo(60, 2); g.stroke(); }
    if (k.accent) {
      g.fillStyle = k.accent;
      knifeDecorations(k).forEach(shape => {
        g.beginPath(); shape.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
      });
    }
    g.fillStyle = k.accent || "#c9ae83"; g.fillRect(66, -12, 7, 24);
    const handle = g.createLinearGradient(0, -10, 0, 10); handle.addColorStop(0, k.accent || "#c18757"); handle.addColorStop(.4, k.handle); handle.addColorStop(1, "#3d302a");
    g.fillStyle = handle; g.beginPath(); g.roundRect(73, -9, 40, 18, 5); g.fill(); g.strokeStyle = "#2d2822"; g.stroke();
    g.fillStyle = "#e7c894"; [82, 103].forEach(x => { g.beginPath(); g.arc(x, 0, 2, 0, TAU); g.fill(); });
    if (k.animation) {
      g.strokeStyle = animatedColor(k); g.lineWidth = 2;
      g.globalAlpha = .55 + .25 * Math.sin(visualTime * 2);
      g.beginPath(); g.moveTo(-6, 0); g.lineTo(62, 0); g.stroke();
      const x = 6 + ((visualTime * 24) % 52);
      g.fillStyle = animatedColor(k); g.beginPath(); g.arc(x, 0, 3, 0, TAU); g.fill();
    }
    g.restore();
  }
  function knifeDecorations(knife) {
    if (!knife.pattern) return [];
    if (knife.pattern === "bolt") return [[[32, -6], [45, -6], [39, -1], [50, -1], [32, 7], [36, 1], [26, 1]]];
    return [23, 38, 53].map(x => {
      if (knife.pattern === "stripes") return [[x, -6], [x + 4, -6], [x - 1, 6], [x - 5, 6]];
      if (knife.pattern === "diamonds") return [[x, -5], [x + 4, 0], [x, 5], [x - 4, 0]];
      return [[x, -5], [x + 1.5, -1.5], [x + 5, 0], [x + 1.5, 1.5], [x, 5], [x - 1.5, 1.5], [x - 5, 0], [x - 1.5, -1.5]];
    });
  }
  function drawBackground(g, themeIndex = null) {
    const theme = themeIndex === null ? activeTheme() : themes[themeIndex];
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, theme.top); bg.addColorStop(1, theme.bottom);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(CX, CY, 40, CX, CY, 430); glow.addColorStop(0, "#9db48c35"); glow.addColorStop(1, "#1c393300");
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#d5e0bb14"; g.lineWidth = 1;
    g.strokeRect(18, 18, W - 36, H - 36);
    g.setLineDash([2, 9]); g.beginPath(); g.arc(CX, CY, 232, 0, TAU); g.stroke(); g.setLineDash([]);
    g.strokeStyle = "#c7d6b512"; g.beginPath(); g.moveTo(CX, 100); g.lineTo(CX, 785); g.stroke();
    g.fillStyle = "#d4dfbc22";
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16; g.beginPath(); g.arc(CX + Math.cos(a) * 232, CY + Math.sin(a) * 232, i % 4 ? 1.5 : 3, 0, TAU); g.fill(); }
    g.fillStyle = "#d0ddc233"; g.font = "bold 10px Arial"; g.textAlign = "center"; g.letterSpacing = "2px";
    g.fillText("AIM TRUE", CX, 135); g.fillText("✦", CX, 690);
    if (theme.animation) {
      g.fillStyle = animatedColor(theme); g.globalAlpha = .15;
      for (let i = 0; i < 24; i++) {
        const x = (i * 137 + Math.sin(visualTime * .35 + i) * 45 + W) % W;
        const y = (i * 89 - visualTime * (theme.animation === "sweep" ? 40 : 15) % H + H * 10) % H;
        g.beginPath(); g.arc(x, y, theme.animation === "rainbow" ? 28 : 4 + 2 * Math.sin(visualTime + i), 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
    }
  }
  function targetRadius(radius, angle, level = game.level) {
    if (level < 4) return radius;
    const lobes = isBoss(level) ? 12 : 8;
    return radius * (1 + .025 * Math.cos(lobes * angle));
  }
  function targetPath(g, radius, level = game.level) {
    g.beginPath();
    if (level < 4) { g.arc(0, 0, radius, 0, TAU); return; }
    for (let i = 0; i <= 144; i++) {
      const a = i * TAU / 144, r = targetRadius(radius, a, level);
      if (i === 0) g.moveTo(r, 0);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  }
  function drawLog(g, index, r, level) {
    const skin = logs[index];
    g.save();
    g.shadowColor = "#07151299"; g.shadowBlur = 25; g.shadowOffsetY = 17;
    g.fillStyle = skin.bark; targetPath(g, r + 12, level); g.fill();
    g.shadowColor = "transparent";
    g.strokeStyle = skin.rim; g.lineWidth = 18; targetPath(g, r + 3, level); g.stroke();
    for (let i = 0; i < 54; i++) {
      const a = i * TAU / 54;
      const edge = targetRadius(r, a, level);
      g.strokeStyle = i % 3 ? skin.dark : skin.light; g.lineWidth = 3 + i % 4;
      g.beginPath(); g.moveTo(Math.cos(a) * (edge - 3), Math.sin(a) * (edge - 3)); g.lineTo(Math.cos(a + .015) * (edge + 11), Math.sin(a + .015) * (edge + 11)); g.stroke();
    }
    g.save(); targetPath(g, r - 3, level); g.clip(); g.drawImage(woodTextures[index], -r - 5, -r - 5, (r + 5) * 2, (r + 5) * 2); g.restore();
    g.strokeStyle = "#f5d2a06b"; g.lineWidth = 2; targetPath(g, r - 6, level); g.stroke();
    g.fillStyle = "#76503750"; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill();
    if (skin.emblem) {
      g.fillStyle = skin.light; g.globalAlpha = .7; g.font = "34px Georgia"; g.textAlign = "center";
      g.fillText(skin.emblem, 0, 12); g.globalAlpha = 1;
    }
    if (isBoss(level)) { g.strokeStyle = "#fbe4ad99"; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r * .55, 0, TAU); g.stroke(); g.fillStyle = "#fff0c288"; g.font = "28px Georgia"; g.textAlign = "center"; g.fillText("✦", 0, 10); }
    if (skin.animation) {
      g.strokeStyle = animatedColor(skin); g.lineWidth = 3;
      g.globalAlpha = .5 + .2 * Math.sin(visualTime * 2);
      for (let i = 0; i < 3; i++) {
        const angle = visualTime * (skin.animation === "sweep" ? 1 : .4) + i * TAU / 3;
        g.beginPath(); g.arc(0, 0, r * (.4 + i * .22), angle, angle + 1.5); g.stroke();
      }
    }
    g.restore();
  }
  function drawTarget(g) {
    const r = game.radius;
    g.save(); g.translate(CX, CY); g.rotate(game.rotation);
    drawLog(g, save.selectedLog, r, game.level);
    if (game.dummy) drawDummy(g);
    if (game.apple) {
      g.save(); g.rotate(game.apple.angle);
      g.translate(targetRadius(r, game.apple.angle) + APPLE_SIZE, 0);
      g.rotate(Math.PI / 2); drawApple(g); g.restore();
    }
    game.embedded.forEach(k => { g.save(); g.rotate(k.angle); g.translate(k.radius || targetRadius(r, k.angle), 0); drawKnife(g, k.knife, 1, k.width || 1); g.restore(); });
    g.restore();
  }
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (game.shake > .1 && !["paused", "pause-settings", "reset-confirm"].includes(game.state)) {
      ctx.translate((Math.random() - .5) * game.shake, (Math.random() - .5) * game.shake);
    }
    drawBackground(ctx); drawTarget(ctx);
    if (game.state === "playing" || game.state === "paused" || game.state === "pause-settings" || game.state === "finishing") {
      if (game.flight) { ctx.save(); ctx.translate(CX, game.flight.y); ctx.rotate(Math.PI / 2); drawKnife(ctx, save.selected, 1.08); ctx.restore(); }
      else if (game.state !== "finishing") { ctx.save(); ctx.translate(CX, 750); ctx.rotate(Math.PI / 2); drawKnife(ctx, save.selected, 1.08); ctx.restore(); }
    }
    if (game.state === "playing" && game.apple) {
      ctx.fillStyle = "#d9c89f"; ctx.font = "bold 11px Arial"; ctx.textAlign = "center";
      ctx.fillText(`SLICE THE APPLE  +${money(modifierEffects().apple)}`, CX, 625);
    }
    game.particles.forEach(p => {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.x * .02);
      if (p.kind === "apple") drawApple(ctx, p.half);
      else { ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .6); }
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    game.debris.forEach(piece => {
      const anchor = dummyWorld(piece.anchor);
      ctx.save();
      ctx.translate(piece.x, piece.y); ctx.rotate(piece.rotation); drawDummyPart(ctx, piece.part, true); ctx.restore();
      drawDummyRope(ctx, [anchor.x, anchor.y], [piece.wrist.x, piece.wrist.y]);
    });
    ctx.restore();
  }
  function update(dt) {
    const moving = game.state === "playing" || game.state === "finishing" || game.state === "menu" || game.state === "collection" || game.state === "settings";
    if (moving) {
      game.elapsed += dt; game.changeIn -= dt;
      if (game.changeIn <= 0) changeRotation();
      const response = config(game.level).rotation.response;
      const speedChange = (game.targetSpeed - game.speed) * (1 - Math.exp(-response * dt));
      game.speed += clamp(speedChange, -12 * dt, 12 * dt);
      game.rotation += game.speed * dt;
    }
    if (game.state === "playing" && game.flight) {
      game.flight.time += dt;
      const t = clamp(game.flight.time / game.flight.duration, 0, 1);
      game.flight.y = game.flight.from + (game.flight.to - game.flight.from) * (1 - (1 - t) * (1 - t));
      if (t >= 1) impact();
    }
    if (game.state === "finishing") { game.timer -= dt; if (game.timer <= 0) victory(); }
    if (game.state !== "paused" && game.state !== "pause-settings" && game.state !== "reset-confirm") {
      game.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; });
      game.particles = game.particles.filter(p => p.life > 0);
      game.debris.forEach(piece => updateTether(piece, dt));
      game.shake *= Math.pow(.01, dt);
    }
  }
  function loop(time) {
    const dt = game.lastTime ? Math.min((time - game.lastTime) / 1000, .05) : 0;
    game.lastTime = time;
    if (!reducedMotion.matches && !["paused", "pause-settings", "reset-confirm"].includes(game.state)) visualTime += dt;
    update(dt); render();
    if (time - previewFrame > 66) {
      previewFrame = time;
      if (game.state === "shop-detail") drawDetailPreview();
      else if (game.state === "collection") screen.querySelectorAll("[data-preview]").forEach(preview => {
        const index = Number(preview.dataset.preview);
        if (shopCatalog(shopCategory)[index].animation) drawShopPreview(preview.getContext("2d"), shopCategory, index);
      });
    }
    requestAnimationFrame(loop);
  }
  screen.addEventListener("click", event => {
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    audio.init(); audio.effect("button");
    if (target.dataset.shopTab) { shopCategory = target.dataset.shopTab; shopPage = 0; collection(); return; }
    if (target.dataset.shopPage) { shopPage += Number(target.dataset.shopPage); collection(); return; }
    if (target.dataset.levelPage) { levelPage += Number(target.dataset.levelPage); levelSelect(); return; }
    if (target.dataset.level) { selectLevel(Number(target.dataset.level)); return; }
    if (target.dataset.item !== undefined) {
      itemDetail(target.dataset.category, Number(target.dataset.item)); return;
    }
    switch (target.dataset.action) {
      case "bonus-money": bonusMoney(); break;
      case "back-shop": collection(); break;
      case "purchase-item": {
        if (!shopDetail) break;
        const { category, index } = shopDetail;
        const result = shopItem(category, index);
        if (result.ok) collection(result.message);
        else itemDetail(category, index, result.message);
        break;
      }
      case "classic": startRun("classic"); break;
      case "levels": levelPage = 0; levelSelect(); break;
      case "endless": startRun("endless"); break;
      case "dummy": dummyIntro(); break;
      case "start-dummy": startRun("dummy"); break;
      case "collection": collection(); break;
      case "settings": settings(false); break;
      case "pause-settings": settings(true); break;
      case "reset-profile": resetFromPause = game.state === "pause-settings"; confirmReset(); break;
      case "cancel-reset": settings(resetFromPause); break;
      case "confirm-reset": resetProfile(); break;
      case "back-pause": game.state = "playing"; pause(); break;
      case "resume": game.state = "playing"; hideScreen(); break;
      case "restart": startStage(); break;
      case "continue": game.level++; startStage(); break;
      case "menu": menu(); break;
    }
  });
  screen.addEventListener("input", event => {
    const key = event.target.dataset.volume;
    if (key !== "music" && key !== "sound") return;
    save[key] = Number(event.target.value) / 100;
    $(key + "-value").textContent = `${event.target.value}%`; persist();
  });
  canvas.addEventListener("pointerdown", event => {
    if (event.isPrimary === false || (event.button !== 0 && event.pointerType === "mouse")) return;
    event.preventDefault(); throwKnife();
  });
  $("pause-button").addEventListener("click", event => { event.stopPropagation(); audio.init(); audio.effect("button"); pause(); });
  document.addEventListener("keydown", event => {
    if (event.code === "Space" && game.state === "playing") { event.preventDefault(); if (!event.repeat) throwKnife(); }
    else if (event.code === "Escape" && game.state === "playing") { event.preventDefault(); pause(); }
    else if (event.code === "Escape" && game.state === "paused") { event.preventDefault(); game.state = "playing"; hideScreen(); }
    else if (event.code === "Escape" && game.state === "shop-detail") { event.preventDefault(); collection(); }
  });
  document.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); audio.init(); audio.effect("button"); menu(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && game.state === "playing") pause(); game.lastTime = 0; });
  if (typeof ResizeObserver !== "undefined") {
    const menuResize = new ResizeObserver(fitScreen);
    menuResize.observe(overlay); menuResize.observe(screen);
  }
  updateSide(); menu(); requestAnimationFrame(loop);
})();
