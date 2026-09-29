import { SaveSystem } from "./SaveSystem.js";

export const BGM_PAGES = ["lobby", "login", "play", "hangout", "match"];

const PAGE_SCENES = {
  lobby: ["hub"],
  login: ["auth", "menu"],
  play: ["mode", "select", "queue", "luck", "starter"],
  match: ["play"],
  hangout: [
    "settings", "shop", "friends", "wiki", "rankinfo",
    "career", "growth", "dress", "bag", "result"
  ]
};

export function defaultSettings() {
  return {
    lang: "th",
    controlMode: "auto",
    bgmMode: "all",
    bgmPages: {
      lobby: true,
      login: true,
      play: true,
      hangout: true,
      match: true
    },
    reducedFx: false,
    cameraShake: true,
    lobbyMotion: true
  };
}

export function mergeSettings(raw) {
  const base = defaultSettings();
  const next = { ...base, ...(raw || {}) };
  next.bgmPages = { ...base.bgmPages, ...((raw && raw.bgmPages) || {}) };
  if (next.bgmMode !== "off" && next.bgmMode !== "custom") next.bgmMode = "all";
  if (next.controlMode !== "pc" && next.controlMode !== "mobile") next.controlMode = "auto";
  next.reducedFx = Boolean(next.reducedFx);
  next.cameraShake = next.cameraShake !== false;
  next.lobbyMotion = next.lobbyMotion !== false;
  return next;
}

function bag() {
  if (!SaveSystem.data.settings) SaveSystem.data.settings = defaultSettings();
  SaveSystem.data.settings = mergeSettings(SaveSystem.data.settings);
  return SaveSystem.data.settings;
}

export function settings() {
  return bag();
}

export function patchSettings(partial) {
  const cur = bag();
  const next = mergeSettings({ ...cur, ...(partial || {}) });
  if (partial && partial.bgmPages) {
    next.bgmPages = { ...cur.bgmPages, ...partial.bgmPages };
  }
  SaveSystem.data.settings = next;
  SaveSystem.persist();
  try { window.dispatchEvent(new CustomEvent("ev-settings")); } catch (e) {}
  return next;
}

export function sceneBgmPage(key) {
  const id = String(key || "");
  for (let i = 0; i < BGM_PAGES.length; i += 1) {
    const page = BGM_PAGES[i];
    if ((PAGE_SCENES[page] || []).indexOf(id) >= 0) return page;
  }
  return "hangout";
}

export function bgmAllowed(page) {
  const s = bag();
  if (s.bgmMode === "off") return false;
  if (s.bgmMode === "all") return true;
  return s.bgmPages[page] !== false;
}

export function sceneAllowsBgm(key) {
  return bgmAllowed(sceneBgmPage(key));
}

export function setBgmMode(mode) {
  const next = mode === "off" || mode === "custom" ? mode : "all";
  const s = bag();
  if (next === "all") {
    const pages = {};
    BGM_PAGES.forEach((id) => { pages[id] = true; });
    patchSettings({ bgmMode: "all", bgmPages: pages });
  } else if (next === "off") {
    const pages = {};
    BGM_PAGES.forEach((id) => { pages[id] = false; });
    patchSettings({ bgmMode: "off", bgmPages: pages });
  } else {
    patchSettings({ bgmMode: "custom", bgmPages: s.bgmPages });
  }
}

export function toggleBgmPage(page) {
  if (BGM_PAGES.indexOf(page) < 0) return;
  const s = bag();
  const pages = { ...s.bgmPages };
  if (s.bgmMode === "all") {
    BGM_PAGES.forEach((id) => { pages[id] = true; });
    pages[page] = false;
    patchSettings({ bgmMode: "custom", bgmPages: pages });
    return;
  }
  if (s.bgmMode === "off") {
    BGM_PAGES.forEach((id) => { pages[id] = false; });
    pages[page] = true;
    patchSettings({ bgmMode: "custom", bgmPages: pages });
    return;
  }
  pages[page] = pages[page] === false;
  const onCount = BGM_PAGES.filter((id) => pages[id] !== false).length;
  if (onCount === BGM_PAGES.length) {
    patchSettings({ bgmMode: "all", bgmPages: pages });
    return;
  }
  if (onCount === 0) {
    patchSettings({ bgmMode: "off", bgmPages: pages });
    return;
  }
  patchSettings({ bgmMode: "custom", bgmPages: pages });
}

export function wantFx() {
  return !bag().reducedFx;
}

export function wantShake() {
  return bag().cameraShake !== false && wantFx();
}

export function wantLobbyMotion() {
  if (!bag().lobbyMotion || bag().reducedFx) return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  } catch (e) {}
  return true;
}

export function shakeCam(cam, dur, pow) {
  if (!cam || !wantShake()) return;
  cam.shake(dur, pow);
}

export async function toggleFullscreen() {
  const root = document.getElementById("game") || document.documentElement;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (root.requestFullscreen) await root.requestFullscreen();
  } catch (e) {}
}

export function isFullscreen() {
  return Boolean(document.fullscreenElement);
}
