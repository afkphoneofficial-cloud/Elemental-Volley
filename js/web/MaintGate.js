import { maintenanceNow, maintenanceUntil } from "../data/maintenance.js";
import { t } from "../i18n/I18n.js";
import { NetPlay } from "../systems/NetPlay.js?v=local258";

function overlay() {
  return document.getElementById("maint-overlay");
}

function formatLeft(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

export const MaintGate = {
  active: false,
  timer: 0,

  mount() {
    if (this._on) return this;
    this._on = true;
    window.addEventListener("ev-lang", () => this.paint());
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 15000);
    return this;
  },

  tick() {
    const on = maintenanceNow();
    if (on && !this.active) this.lock();
    else if (!on && this.active) this.unlock();
    if (this.active) this.paint();
  },

  lock() {
    this.active = true;
    try { NetPlay.stop(); } catch (e) {}
    const el = overlay();
    if (el) el.hidden = false;
    const g = window.game;
    if (g && g.scene) {
      const live = g.scene.getScenes(true)[0];
      const key = live && live.scene && live.scene.key;
      if (key === "play" || key === "queue" || key === "luck") {
        live.scene.start("hub");
      }
    }
    this.paint();
  },

  unlock() {
    this.active = false;
    const el = overlay();
    if (el) el.hidden = true;
  },

  paint() {
    const title = document.getElementById("maint-title");
    const body = document.getElementById("maint-body");
    const wait = document.getElementById("maint-wait");
    if (title) title.textContent = t("maint.title");
    if (body) body.textContent = t("maint.body");
    if (wait) wait.textContent = t("maint.wait", { t: formatLeft(maintenanceUntil()) });
  }
};
