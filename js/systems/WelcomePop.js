import { WELCOME_SLIDES } from "../data/welcomePop.js?v=local247";
import { SaveSystem } from "./SaveSystem.js";
import { dayKey } from "../data/monthPass.js?v=local171";
import { I18n, t } from "../i18n/I18n.js?v=local238";

const SEEN_KEY = "ev-welcome-seen-ref";

function lang() {
  return I18n.lang === "en" ? "en" : "th";
}

function tabOf(row) {
  return lang() === "en" ? row.tabEn : row.tabTh;
}

function capOf(row) {
  return lang() === "en" ? row.capEn : row.capTh;
}

function alreadySeen() {
  try {
    if (localStorage.getItem(SEEN_KEY) === "1") return true;
  } catch (e) {}
  return false;
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch (e) {}
  const day = dayKey();
  if (SaveSystem.data && SaveSystem.data.welcomeDay !== day) {
    SaveSystem.data.welcomeDay = day;
    SaveSystem.persist();
  }
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
    document.body.appendChild(root);
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
    if (alreadySeen()) return;
    try {
      if (window.AuthSystem && window.AuthSystem.needsName && window.AuthSystem.needsName()) return;
    } catch (e) {}
    this.show();
  },

  show() {
    this.mount();
    this.slide = 0;
    this.open = true;
    this.root.hidden = false;
    this.paint();
  },

  hide() {
    if (!this.root) return;
    const wasOpen = this.open;
    this.open = false;
    this.root.hidden = true;
    if (wasOpen) markSeen();
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
