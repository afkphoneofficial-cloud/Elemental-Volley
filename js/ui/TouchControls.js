import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { I18n } from "../i18n/I18n.js?v=local276";

const DEAD = 0.28;
const ULT_TINT = {
  ignis: "#ff6a22",
  aqua: "#3ad6ff",
  volt: "#ffe14a",
  terra: "#8dff6a"
};

function controlMode() {
  const s = SaveSystem.data && SaveSystem.data.settings;
  return (s && s.controlMode) || "auto";
}

export function preferTouch() {
  const mode = controlMode();
  if (mode === "mobile") return true;
  if (mode === "pc") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const hoverNone = window.matchMedia("(hover: none)").matches;
  const touchPts = (navigator.maxTouchPoints || 0) > 0;
  const narrow = window.matchMedia("(max-width: 1100px)").matches;
  const short = window.matchMedia("(max-height: 560px)").matches;
  return coarse || hoverNone || (touchPts && (narrow || short));
}

export const TouchControls = {
  x: 0,
  y: 0,
  hit: false,
  jump: false,
  playActive: false,
  stickId: null,
  hitId: null,
  jumpId: null,

  mount() {
    this.root = document.getElementById("touch-pad");
    this.base = document.getElementById("stick-base");
    this.knob = document.getElementById("stick-knob");
    this.hitEl = document.getElementById("hit-pad");
    this.jumpEl = document.getElementById("jump-pad");
    this.rotate = document.getElementById("rotate-hint");
    if (!this.root || !this.base || !this.hitEl) return;
    this.bindStick(this.base);
    this.bindHold(this.hitEl, "hit");
    if (this.jumpEl) this.bindHold(this.jumpEl, "jump");
    window.addEventListener("resize", () => this.sync());
    window.addEventListener("orientationchange", () => setTimeout(() => this.sync(), 180));
    document.addEventListener("fullscreenchange", () => this.sync());
    document.addEventListener("webkitfullscreenchange", () => this.sync());
    if (this.rotate) {
      this.rotate.addEventListener("click", () => {
        this.rotate.hidden = true;
        this.rotate.dataset.dismissed = "1";
      });
    }
    this.sync();
  },

  bindStick(el) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      AudioSystem.unlock();
      this.stickId = e.pointerId;
      this.moveStick(e);
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.stickId) return;
      this.moveStick(e);
    });
    const up = (e) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.x = 0;
      this.y = 0;
      this.knob.style.transform = "translate(-50%, -50%)";
      this.base.classList.remove("on");
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  },

  bindHold(el, kind) {
    const idKey = kind === "jump" ? "jumpId" : "hitId";
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      AudioSystem.unlock();
      this[idKey] = e.pointerId;
      if (kind === "jump") this.jump = true;
      else this.hit = true;
      el.classList.add("on");
    });
    const up = (e) => {
      if (e.pointerId !== this[idKey]) return;
      this[idKey] = null;
      if (kind === "jump") this.jump = false;
      else this.hit = false;
      el.classList.remove("on");
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  },

  moveStick(e) {
    const r = this.base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const max = r.width * 0.32;
    let dx = e.clientX - cx;
    if (Math.abs(dx) > max) dx = dx < 0 ? -max : max;
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
    const nx = dx / max;
    this.x = Math.abs(nx) < DEAD ? 0 : (nx > 0 ? 1 : -1);
    this.y = 0;
    this.base.classList.toggle("on", this.x !== 0);
  },

  paintUlt(frac, full, charId) {
    if (!this.hitEl) return;
    const n = Math.max(0, Math.min(1, Number(frac) || 0));
    this.hitEl.style.setProperty("--ult", String(n));
    this.hitEl.style.setProperty("--ult-color", ULT_TINT[charId] || "#c8ff3a");
    this.hitEl.classList.toggle("ult-hot", n > 0.04 && !full);
    this.hitEl.classList.toggle("ult-full", !!full);
    const lab = this.hitEl.querySelector(".pad-lab");
    if (lab) lab.textContent = I18n.t(full ? "touch.ult" : "touch.hit");
  },

  setPlayActive(on) {
    this.playActive = Boolean(on);
    if (!on) {
      this.x = 0;
      this.y = 0;
      this.hit = false;
      this.jump = false;
      this.stickId = null;
      this.hitId = null;
      this.jumpId = null;
      if (this.knob) this.knob.style.transform = "translate(-50%, -50%)";
      if (this.hitEl) this.hitEl.classList.remove("on", "ult-hot", "ult-full");
      if (this.jumpEl) this.jumpEl.classList.remove("on");
      this.paintUlt(0, false);
    }
    this.sync();
  },

  sync() {
    const touch = preferTouch();
    document.documentElement.dataset.control = touch ? "mobile" : "pc";
    const show = this.playActive && touch;
    if (this.root) this.root.hidden = !show;
    if (this.rotate) this.rotate.hidden = true;
    const stickLab = this.root && this.root.querySelector("[data-i18n='touch.move']");
    const jumpLab = this.jumpEl && this.jumpEl.querySelector(".pad-lab");
    const hitLab = this.hitEl && this.hitEl.querySelector(".pad-lab");
    if (stickLab) stickLab.textContent = I18n.t("touch.move");
    if (jumpLab) jumpLab.textContent = I18n.t("touch.jump");
    if (hitLab && !this.hitEl.classList.contains("ult-full")) hitLab.textContent = I18n.t("touch.hit");
    const rot = this.rotate && this.rotate.querySelector("[data-i18n='touch.rotate']");
    if (rot) rot.textContent = I18n.t("touch.rotate");
  },

  snapshot() {
    return {
      x: this.x,
      y: this.jump ? -1 : 0,
      hit: this.hit,
      touch: preferTouch() && this.playActive
    };
  }
};
