import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { I18n } from "../i18n/I18n.js";

const DEAD = 0.28;

function controlMode() {
  const s = SaveSystem.data && SaveSystem.data.settings;
  return (s && s.controlMode) || "auto";
}

export function preferTouch() {
  const mode = controlMode();
  if (mode === "mobile") return true;
  if (mode === "pc") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 900px)").matches;
  const short = window.matchMedia("(max-height: 500px)").matches;
  return coarse || (narrow && (navigator.maxTouchPoints > 0 || short));
}

export const TouchControls = {
  x: 0,
  y: 0,
  hit: false,
  playActive: false,
  stickId: null,
  hitId: null,

  mount() {
    this.root = document.getElementById("touch-pad");
    this.base = document.getElementById("stick-base");
    this.knob = document.getElementById("stick-knob");
    this.hitEl = document.getElementById("hit-pad");
    this.rotate = document.getElementById("rotate-hint");
    if (!this.root || !this.base || !this.hitEl) return;
    this.bindPad(this.base, true);
    this.bindPad(this.hitEl, false);
    window.addEventListener("resize", () => this.sync());
    window.addEventListener("orientationchange", () => setTimeout(() => this.sync(), 180));
    if (this.rotate) {
      this.rotate.addEventListener("click", () => {
        this.rotate.hidden = true;
        this.rotate.dataset.dismissed = "1";
      });
    }
    this.sync();
  },

  bindPad(el, isStick) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      AudioSystem.unlock();
      if (isStick) {
        this.stickId = e.pointerId;
        this.moveStick(e);
      } else {
        this.hitId = e.pointerId;
        this.hit = true;
        this.hitEl.classList.add("on");
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!isStick || e.pointerId !== this.stickId) return;
      this.moveStick(e);
    });
    const up = (e) => {
      if (isStick) {
        if (e.pointerId !== this.stickId) return;
        this.stickId = null;
        this.x = 0;
        this.y = 0;
        this.knob.style.transform = "translate(-50%, -50%)";
        this.base.classList.remove("on");
      } else if (e.pointerId === this.hitId) {
        this.hitId = null;
        this.hit = false;
        this.hitEl.classList.remove("on");
      }
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  },

  moveStick(e) {
    const r = this.base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const max = r.width * 0.32;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / max;
    const ny = dy / max;
    this.x = Math.abs(nx) < DEAD ? 0 : (nx > 0 ? 1 : -1);
    this.y = Math.abs(ny) < DEAD ? 0 : (ny > 0 ? 1 : -1);
    this.base.classList.toggle("on", this.x !== 0 || this.y !== 0);
  },

  setPlayActive(on) {
    this.playActive = Boolean(on);
    if (!on) {
      this.x = 0;
      this.y = 0;
      this.hit = false;
      this.stickId = null;
      this.hitId = null;
      if (this.knob) this.knob.style.transform = "translate(-50%, -50%)";
      if (this.hitEl) this.hitEl.classList.remove("on");
    }
    this.sync();
  },

  sync() {
    const touch = preferTouch();
    document.documentElement.dataset.control = touch ? "mobile" : "pc";
    const show = this.playActive && touch;
    if (this.root) this.root.hidden = !show;
    const portrait = window.matchMedia("(orientation: portrait)").matches && window.innerHeight > window.innerWidth;
    if (this.rotate) {
      const hide = this.rotate.dataset.dismissed === "1" || !show || !portrait;
      this.rotate.hidden = hide;
    }
    const stickLab = this.root && this.root.querySelector("[data-i18n='touch.move']");
    const hitLab = this.root && this.root.querySelector("[data-i18n='touch.hit']");
    if (stickLab) stickLab.textContent = I18n.t("touch.move");
    if (hitLab) hitLab.textContent = I18n.t("touch.hit");
    const rot = this.rotate && this.rotate.querySelector("[data-i18n='touch.rotate']");
    if (rot) rot.textContent = I18n.t("touch.rotate");
  },

  snapshot() {
    return { x: this.x, y: this.y, hit: this.hit, touch: preferTouch() && this.playActive };
  }
};
