import { t } from "../i18n/I18n.js?v=local252";
import { preferTouch } from "../ui/TouchControls.js?v=local276";

function isPortrait() {
  return window.innerHeight >= window.innerWidth;
}

async function tryFullscreen() {
  const root = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  try {
    if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: "hide" });
    else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
  } catch (e) {}
}

async function lockScreen(kind) {
  const ori = screen.orientation;
  if (!ori || typeof ori.lock !== "function") return false;
  const names = kind === "landscape"
    ? ["landscape", "landscape-primary"]
    : ["portrait", "portrait-primary"];
  for (let i = 0; i < names.length; i += 1) {
    try {
      await ori.lock(names[i]);
      return true;
    } catch (e) {}
  }
  try {
    ori.unlock();
  } catch (e) {}
  return false;
}

function setFakeLandscape(on) {
  document.documentElement.classList.toggle("ev-spin-land", Boolean(on));
}

export function placeOrientBtn() {
  const btn = document.getElementById("orient-btn");
  if (!btn) return;
  const port = isPortrait() && !document.documentElement.classList.contains("ev-spin-land");
  if (!port || btn.hidden) {
    btn.style.top = "";
    btn.style.bottom = "";
    return;
  }
  const game = document.getElementById("game");
  if (!game) return;
  const g = game.getBoundingClientRect();
  const vv = window.visualViewport;
  const screenBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const mid = (g.bottom + screenBottom) / 2;
  const h = btn.offsetHeight || 44;
  btn.style.bottom = "auto";
  btn.style.top = Math.round(mid - h / 2) + "px";
}

export function mountOrientDock(onLayout) {
  const btn = document.getElementById("orient-btn");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  const ico = btn.querySelector(".orient-ico");
  const lab = btn.querySelector(".orient-lab");

  const paint = () => {
    const touch = preferTouch();
    btn.hidden = !touch;
    if (!isPortrait() && document.documentElement.classList.contains("ev-spin-land")) {
      setFakeLandscape(false);
    }
    const port = isPortrait();
    if (document.documentElement.classList.contains("ev-spin-land")) {
      btn.setAttribute("data-mode", "land");
      if (ico) ico.textContent = "↕";
      if (lab) lab.textContent = t("web.orientPort") || "แนวตั้ง";
      placeOrientBtn();
      return;
    }
    btn.setAttribute("data-mode", port ? "port" : "land");
    if (ico) ico.textContent = port ? "↔" : "↕";
    if (lab) lab.textContent = port ? (t("web.orientLand") || "ปรับเป็นแนวนอน") : (t("web.orientPort") || "แนวตั้ง");
    placeOrientBtn();
  };

  let lock = 0;
  const go = async (ev) => {
    if (ev) ev.preventDefault();
    const now = Date.now();
    if (now - lock < 500) return;
    lock = now;
    if (document.documentElement.classList.contains("ev-spin-land")) {
      setFakeLandscape(false);
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      paint();
      if (onLayout) onLayout();
      return;
    }
    const want = isPortrait() ? "landscape" : "portrait";
    await tryFullscreen();
    const locked = await lockScreen(want);
    if (!locked && want === "landscape" && isPortrait()) {
      setFakeLandscape(true);
    } else {
      setFakeLandscape(false);
    }
    paint();
    if (onLayout) onLayout();
  };

  btn.addEventListener("click", go);
  window.addEventListener("resize", paint);
  window.addEventListener("orientationchange", () => setTimeout(paint, 200));
  window.addEventListener("ev-lang", paint);
  paint();
}
