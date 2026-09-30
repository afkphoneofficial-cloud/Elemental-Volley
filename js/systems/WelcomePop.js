import { WELCOME_SLIDES } from "../data/welcomePop.js?v=local234";
import { SaveSystem } from "./SaveSystem.js";
import { dayKey } from "../data/monthPass.js?v=local171";
import { I18n, t } from "../i18n/I18n.js";

function lang() {
  return I18n.lang === "en" ? "en" : "th";
}

function tabOf(row) {
  return lang() === "en" ? row.tabEn : row.tabTh;
}

function capOf(row) {
  return lang() === "en" ? row.capEn : row.capTh;
}

export const WelcomePop = {
  open: false,
  slide: 0,
  root: null,
  img: null,
  cap: null,
  tabs: null,
  closeBtn: null,

  mount() {
    if (this.root) return this;
    const root = document.createElement("div");
    root.id = "welcome-overlay";
    root.hidden = true;
    root.innerHTML =
      '<div class="welcome-shell" role="dialog" aria-modal="true">' +
        '<div class="welcome-tabs" id="welcome-tabs"></div>' +
        '<div class="welcome-stage">' +
          '<img id="welcome-art" alt="" />' +
          '<p id="welcome-cap"></p>' +
        "</div>" +
        '<button type="button" id="welcome-close" class="welcome-close"></button>' +
      "</div>";
    const host = document.getElementById("wrap") || document.body;
    host.appendChild(root);
    this.root = root;
    this.img = document.getElementById("welcome-art");
    this.cap = document.getElementById("welcome-cap");
    this.tabs = document.getElementById("welcome-tabs");
    this.closeBtn = document.getElementById("welcome-close");
    this.closeBtn.addEventListener("click", () => this.hide());
    root.addEventListener("click", (ev) => {
      if (ev.target === root) this.hide();
    });
    window.addEventListener("ev-lang", () => {
      if (this.open) this.paint();
    });
    return this;
  },

  tryShow() {
    this.mount();
    if (this.open) return;
    const save = SaveSystem.data;
    if (!save) return;
    const today = dayKey();
    if (save.welcomeDay === today) return;
    this.show(today);
  },

  show(today) {
    this.mount();
    this.slide = 0;
    this.open = true;
    this.root.hidden = false;
    this.paint();
    const day = today || dayKey();
    if (SaveSystem.data && SaveSystem.data.welcomeDay !== day) {
      SaveSystem.data.welcomeDay = day;
      SaveSystem.persist();
    }
  },

  hide() {
    if (!this.root) return;
    this.open = false;
    this.root.hidden = true;
  },

  setSlide(i) {
    const n = WELCOME_SLIDES.length;
    this.slide = ((i % n) + n) % n;
    this.paint();
  },

  paint() {
    if (!this.root) return;
    const row = WELCOME_SLIDES[this.slide] || WELCOME_SLIDES[0];
    if (this.img) {
      this.img.src = row.img;
      this.img.alt = capOf(row);
    }
    if (this.cap) this.cap.textContent = capOf(row);
    if (this.closeBtn) this.closeBtn.textContent = t("hub.welcomeClose");
    if (!this.tabs) return;
    this.tabs.innerHTML = "";
    WELCOME_SLIDES.forEach((slide, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "welcome-tab" + (i === this.slide ? " on" : "");
      btn.textContent = tabOf(slide);
      btn.addEventListener("click", () => this.setSlide(i));
      this.tabs.appendChild(btn);
    });
  }
};
