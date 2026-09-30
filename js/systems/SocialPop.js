import { I18n, t } from "../i18n/I18n.js?v=local236";
import { AudioSystem } from "./AudioSystem.js";

export const SOCIAL_FB = "https://www.facebook.com/profile.php?id=61594561187685";

function lang() {
  return I18n.lang === "en" ? "en" : "th";
}

export const SocialPop = {
  open: false,
  root: null,

  mount() {
    if (this.root) return this;
    const root = document.createElement("div");
    root.id = "social-overlay";
    root.hidden = true;
    root.innerHTML =
      '<div class="social-shell" role="dialog" aria-modal="true">' +
        '<button type="button" class="welcome-close" id="social-close"></button>' +
        '<p class="social-kicker" id="social-kicker"></p>' +
        '<h2 id="social-title"></h2>' +
        '<p class="social-sub" id="social-sub"></p>' +
        '<div class="social-row">' +
          '<a class="social-btn fb" id="social-fb" href="' + SOCIAL_FB + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="social-mark" aria-hidden="true">f</span>' +
            '<span class="social-btn-lab" id="social-fb-lab"></span>' +
          "</a>" +
          '<button type="button" class="social-btn discord" id="social-dc" disabled>' +
            '<span class="social-mark" aria-hidden="true">d</span>' +
            '<span class="social-btn-copy">' +
              '<span class="social-btn-lab" id="social-dc-lab"></span>' +
              '<span class="social-soon" id="social-soon"></span>' +
            "</span>" +
          "</button>" +
        "</div>" +
      "</div>";
    const host = document.getElementById("wrap") || document.body;
    host.appendChild(root);
    this.root = root;
    document.getElementById("social-close").addEventListener("click", () => this.hide());
    root.addEventListener("click", (ev) => {
      if (ev.target === root) this.hide();
    });
    document.getElementById("social-fb").addEventListener("click", () => {
      if (AudioSystem.ui) AudioSystem.ui();
    });
    window.addEventListener("ev-lang", () => {
      if (this.open) this.paint();
    });
    return this;
  },

  paint() {
    const close = document.getElementById("social-close");
    const kicker = document.getElementById("social-kicker");
    const title = document.getElementById("social-title");
    const sub = document.getElementById("social-sub");
    const fb = document.getElementById("social-fb-lab");
    const dc = document.getElementById("social-dc-lab");
    const soon = document.getElementById("social-soon");
    if (close) close.textContent = t("hub.welcomeClose");
    if (kicker) kicker.textContent = t("hub.navSocial");
    if (title) title.textContent = t("hub.socialTitle");
    if (sub) sub.textContent = t("hub.socialSub");
    if (fb) fb.textContent = "Facebook";
    if (dc) dc.textContent = "Discord";
    if (soon) soon.textContent = t("hub.socialSoon");
    const shell = this.root && this.root.querySelector(".social-shell");
    if (shell) shell.setAttribute("lang", lang());
  },

  show() {
    this.mount();
    this.open = true;
    this.root.hidden = false;
    this.paint();
  },

  hide() {
    this.open = false;
    if (this.root) this.root.hidden = true;
  }
};
