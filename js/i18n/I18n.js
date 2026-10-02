import { COPY, LORE, WIKI_CAST, SECRET_CAST, CHAR_COPY } from "./copy.js?v=local268";
import { RULES } from "./rules.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { ROSTER } from "../data/roster.js";
import { paintPayChrome } from "../data/beta.js";

function lookup(tree, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), tree);
}

function fill(s, vars) {
  if (!vars) return s;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? "" : String(vars[k])));
}

export const I18n = {
  lang: "th",

  load() {
    const saved = SaveSystem.data && SaveSystem.data.settings && SaveSystem.data.settings.lang;
    this.lang = saved === "en" ? "en" : "th";
    this.syncDom();
  },

  t(key, vars) {
    const pack = COPY[this.lang] || COPY.th;
    const node = lookup(pack, key);
    if (node == null) {
      const fb = lookup(COPY.th, key);
      return fill(fb == null ? key : fb, vars);
    }
    return fill(node, vars);
  },

  lore() {
    return LORE[this.lang] || LORE.th;
  },

  wikiCast() {
    return WIKI_CAST[this.lang] || WIKI_CAST.th;
  },

  secrets() {
    return SECRET_CAST[this.lang] || SECRET_CAST.th;
  },

  rules() {
    return RULES[this.lang] || RULES.th;
  },

  charName(id) {
    const data = ROSTER[id];
    if (!data) return String(id || "—");
    return this.lang === "en" ? data.name : data.thName;
  },

  charBlurb(id) {
    const pack = CHAR_COPY[this.lang] || CHAR_COPY.th;
    return (pack[id] || pack.ignis).blurb;
  },

  courtName(id) {
    return this.t("court." + id);
  },

  courtFlavor(id) {
    return this.t("court." + id + "Flavor");
  },

  setLang(lang) {
    const next = lang === "en" ? "en" : "th";
    if (next === this.lang) {
      this.syncDom();
      return;
    }
    this.lang = next;
    if (!SaveSystem.data.settings) SaveSystem.data.settings = {};
    SaveSystem.data.settings.lang = next;
    SaveSystem.persist();
    this.syncDom();
    window.dispatchEvent(new CustomEvent("ev-lang"));
    this.refreshScenes();
  },

  syncDom() {
    document.documentElement.lang = this.lang === "en" ? "en" : "th";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", this.t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-lang") === this.lang);
    });
    paintPayChrome();
  },

  mountToggle() {
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => this.setLang(btn.getAttribute("data-lang")));
    });
    this.syncDom();
  },

  refreshScenes() {
    const game = window.game;
    if (!game || !game.scene) return;
    game.scene.getScenes(true).forEach((s) => {
      const key = s.sys.settings.key;
      if (key === "boot") return;
      if (key === "play" || key === "result" || key === "luck") {
        if (typeof s.applyLang === "function") s.applyLang();
        return;
      }
      s.scene.restart(s.sys.settings.data);
    });
    if (window.AuthSystem) {
      const el = document.getElementById("auth-overlay");
      if (el && !el.hidden) window.AuthSystem.showOverlay();
    }
  }
};

export function t(key, vars) {
  return I18n.t(key, vars);
}

export function charName(id) {
  return I18n.charName(id);
}
