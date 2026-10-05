import { t } from "../i18n/I18n.js?v=local253";
import { dayKey } from "../data/monthPass.js?v=local190";
import { preferTouch } from "../ui/TouchControls.js?v=local276";

const DAY_KEY = "ev-install-ask-day";
let deferred = null;
let shown = false;

window.addEventListener("beforeinstallprompt", (ev) => {
  ev.preventDefault();
  deferred = ev;
});

window.addEventListener("appinstalled", () => {
  deferred = null;
  markToday();
  InstallPop.hide();
});

function isStandalone() {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  } catch (e) {}
  return Boolean(window.navigator.standalone);
}

function isIos() {
  const ua = String(navigator.userAgent || "");
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
}

function wantInstallPrompt() {
  if (isStandalone()) return false;
  try {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return false;
  } catch (e) {}
  return preferTouch();
}

function askedToday() {
  try {
    return localStorage.getItem(DAY_KEY) === dayKey();
  } catch (e) {
    return false;
  }
}

function markToday() {
  try {
    localStorage.setItem(DAY_KEY, dayKey());
  } catch (e) {}
}

export const InstallPop = {
  open: false,
  root: null,

  mount() {
    if (this.root) return this;
    const root = document.createElement("div");
    root.id = "install-overlay";
    root.hidden = true;
    root.innerHTML =
      '<div class="install-card" role="dialog" aria-modal="true">' +
        '<p class="install-kicker">PWA</p>' +
        '<h2 id="install-title"></h2>' +
        '<p id="install-body"></p>' +
        '<p id="install-ios" class="install-ios" hidden></p>' +
        '<div class="install-actions">' +
          '<button type="button" id="install-ok"></button>' +
          '<button type="button" id="install-later"></button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(root);
    this.root = root;
    document.getElementById("install-ok").addEventListener("click", () => this.accept());
    document.getElementById("install-later").addEventListener("click", () => this.later());
    root.addEventListener("click", (ev) => {
      if (ev.target === root) this.later();
    });
    window.addEventListener("ev-lang", () => {
      if (this.open) this.paint();
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return this;
  },

  paint() {
    const title = document.getElementById("install-title");
    const body = document.getElementById("install-body");
    const ios = document.getElementById("install-ios");
    const ok = document.getElementById("install-ok");
    const later = document.getElementById("install-later");
    if (title) title.textContent = t("web.installTitle") || "ติดตั้งแอปบนมือถือ";
    if (body) body.textContent = t("web.installBody") || "";
    if (later) later.textContent = t("web.installLater") || "ไว้ก่อน";
    const iosOn = isIos() && !deferred;
    if (ios) {
      ios.hidden = !iosOn;
      ios.textContent = t("web.installIos") || "";
    }
    if (ok) {
      ok.hidden = iosOn;
      ok.textContent = t("web.installOk") || "ติดตั้งเลย";
    }
  },

  tryShow() {
    this.mount();
    if (this.open || shown) return false;
    if (!wantInstallPrompt()) return false;
    if (askedToday()) return false;
    shown = true;
    this.open = true;
    this.root.hidden = false;
    this.paint();
    window.setTimeout(() => this.paint(), 1200);
    return true;
  },

  later() {
    markToday();
    this.hide();
  },

  async accept() {
    markToday();
    if (deferred && typeof deferred.prompt === "function") {
      try {
        deferred.prompt();
        await deferred.userChoice;
      } catch (e) {}
      deferred = null;
    }
    this.hide();
  },

  hide() {
    this.open = false;
    if (this.root) this.root.hidden = true;
    try { window.dispatchEvent(new Event("ev-install-done")); } catch (e) {}
  }
};
