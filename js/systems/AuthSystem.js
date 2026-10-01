import { BACKEND, backendReady } from "../config/backend.js";
import { SaveSystem } from "./SaveSystem.js";
import { Session } from "./Session.js";
import { t } from "../i18n/I18n.js?v=local240";
import { BETA } from "../data/beta.js";
import { dayKey } from "../data/monthPass.js?v=local190";

let supabase = null;
let session = null;
let profile = null;
let pushTimer = null;
let googleReady = false;
const GUEST_OK = { auth: 1, wiki: 1, select: 1, queue: 1, luck: 1, play: 1, result: 1 };

function isAnonUser(user) {
  if (!user) return false;
  if (user.is_anonymous) return true;
  return !String(user.email || "").trim();
}

function bootGuestSave() {
  SaveSystem.bootEmpty();
  SaveSystem.data.starterId = "ignis";
  SaveSystem.data.unlocked = ["ignis", "aqua", "volt", "terra"];
}

function decodeJwt(token) {
  try {
    const mid = token.split(".")[1];
    const json = atob(mid.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function isGmail(email) {
  const e = String(email || "").toLowerCase();
  return e.endsWith("@gmail.com") || e.endsWith("@googlemail.com");
}

async function getSb() {
  if (supabase) return supabase;
  if (!backendReady()) return null;
  const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  supabase = mod.createClient(BACKEND.supabaseUrl, BACKEND.supabaseAnonKey);
  return supabase;
}

function overlay() {
  return document.getElementById("auth-overlay");
}

function setAuthMsg(text, bad) {
  const el = document.getElementById("auth-msg");
  if (!el) return;
  el.textContent = text || "";
  el.style.color = bad ? "#ff8aa8" : "#cbb8e8";
}

function showPanel(which) {
  const g = document.getElementById("auth-google-panel");
  const form = document.getElementById("auth-name-form");
  if (g) g.hidden = which !== "google";
  if (form) form.hidden = which !== "name";
}

export const AuthSystem = {
  session: () => session,
  profile: () => profile,
  displayName: () => (profile && profile.display_name) || "",
  backendUrl: () => BACKEND.supabaseUrl,
  db: () => getSb(),
  wantRegister: false,

  isGuest() {
    return Boolean(session && session.guest);
  },

  isLoggedIn() {
    return Boolean(session && session.id && session.email && !session.guest);
  },

  canPlay() {
    return this.cloudOn() && this.isLoggedIn() && !this.needsName();
  },

  lobbyKey() {
    return this.isGuest() ? "auth" : "hub";
  },

  guard(scene) {
    if (this.canPlay()) return true;
    const key = scene && scene.scene && scene.scene.key;
    if (this.isGuest() && key && GUEST_OK[key]) {
      if (key === "select" || key === "queue" || key === "luck" || key === "play" || key === "result") {
        Session.mode = "exhibit";
        Session.exhibitCasual = true;
        Session.exhibitFriendId = null;
      }
      return true;
    }
    if (scene && scene.scene) scene.scene.start("auth");
    return false;
  },

  needsName() {
    return this.isLoggedIn() && !this.displayName();
  },

  cloudOn() {
    return backendReady();
  },

  async init() {
    const sb = await getSb();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data && data.session && data.session.user) {
        await this.adoptUser(data.session.user, data.session);
      }
    }
    this.prepareGoogle();
    const form = document.getElementById("auth-name-form");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "1";
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const input = document.getElementById("auth-name-input");
        this.submitName(input && input.value).catch((err) => setAuthMsg(err.message, true));
      });
    }
    return this;
  },

  prepareGoogle() {
    const boot = () => {
      if (googleReady || !window.google || !window.google.accounts) return;
      googleReady = true;
      window.google.accounts.id.initialize({
        client_id: BACKEND.googleClientId,
        callback: (res) => {
          this.handleGoogle(res.credential).catch((err) => {
            setAuthMsg(err.message || t("web.authFail"), true);
          });
        },
        auto_select: false,
        ux_mode: "popup",
        itp_support: true
      });
      const host = document.getElementById("google-btn");
      if (host) {
        host.innerHTML = "";
        window.google.accounts.id.renderButton(host, {
          theme: "filled_black",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 320,
          locale: "th"
        });
      }
    };
    if (window.google && window.google.accounts) boot();
    else window.addEventListener("load", boot, { once: true });
    const t = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(t);
        boot();
      }
    }, 200);
    setTimeout(() => clearInterval(t), 8000);
  },

  showOverlay() {
    const el = overlay();
    if (el) el.hidden = false;
    this.prepareGoogle();
    if (!backendReady()) {
      showPanel("google");
      const host = document.getElementById("google-btn");
      if (host) host.innerHTML = "";
      setAuthMsg(t("web.authNoBackend"), true);
      return;
    }
    if (this.needsName()) {
      showPanel("name");
      setAuthMsg(t(SaveSystem.justLiveWipe || SaveSystem.liveWiped() ? "web.authLiveName" : "web.authSetName"), false);
    } else {
      showPanel("google");
      setAuthMsg(backendReady()
        ? t("web.authGmailOnly")
        : t("web.authNoBackend"), false);
    }
  },

  hideOverlay() {
    const el = overlay();
    if (el) el.hidden = true;
  },

  async handleGoogle(credential) {
    const payload = decodeJwt(credential) || {};
    const email = payload.email || "";
    if (!isGmail(email)) {
      throw new Error(t("web.authBadMail"));
    }
    const sb = await getSb();
    if (!sb) throw new Error(t("web.authNoBackend"));
    if (this.isGuest()) {
      await sb.auth.signOut();
      session = null;
      profile = null;
      SaveSystem.bootEmpty();
    }
    const { data, error } = await sb.auth.signInWithIdToken({
      provider: "google",
      token: credential
    });
    if (error) throw new Error(error.message);
    await this.adoptUser(data.user, data.session);
    if (this.needsName()) {
      showPanel("name");
      setAuthMsg(t(SaveSystem.justLiveWipe || SaveSystem.liveWiped() ? "web.authLiveName" : "web.authWelcome"), false);
    } else {
      this.hideOverlay();
      this.onAuthed();
    }
  },

  async adoptUser(user, sess) {
    if (isAnonUser(user)) {
      session = {
        email: "",
        id: user.id,
        access_token: sess && sess.access_token,
        guest: true
      };
      profile = { display_name: t("auth.guest") };
      bootGuestSave();
      try {
        const { NetPlay } = await import("./NetPlay.js");
        NetPlay.ensure();
      } catch (e) {}
      return;
    }
    session = {
      email: user.email,
      id: user.id,
      access_token: sess && sess.access_token
    };
    const sb = await getSb();
    if (!sb) return;
    const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw new Error(error.message);
    SaveSystem.attachAccount(user.id);
    profile = data || { id: user.id, email: user.email, display_name: "", save_data: {} };
    if (data && data.banned) {
      session = null;
      profile = null;
      SaveSystem.bootEmpty();
      await sb.auth.signOut();
      throw new Error(t("web.authBanned"));
    }
    if (!data) {
      await sb.from("profiles").insert({
        id: user.id,
        email: String(user.email).toLowerCase()
      });
      this.schedulePush();
    } else if (data.save_data && typeof data.save_data === "object") {
      SaveSystem.applyCloud(data.save_data);
    } else if (SaveSystem.hasStarter()) {
      this.schedulePush();
    }
    await this.syncLiveWipe();
    await sb.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    try {
      const { NetPlay } = await import("./NetPlay.js");
      NetPlay.ensure();
    } catch (e) {}
  },

  cleanName(name) {
    const clean = String(name || "").trim().replace(/\s+/g, " ");
    if (clean.length < 2 || clean.length > 12) {
      throw new Error(t("web.authNameLen"));
    }
    if (!/^[\u0E00-\u0E7Fa-zA-Z0-9_ ]+$/.test(clean)) {
      throw new Error(t("web.authNameChars"));
    }
    return clean;
  },

  async changeName(name) {
    const clean = this.cleanName(name);
    const sb = await getSb();
    if (!sb || !session || !session.id) throw new Error(t("web.authNoBackend"));
    const { error } = await sb.from("profiles").update({
      display_name: clean,
      display_name_set_at: new Date().toISOString()
    }).eq("id", session.id);
    if (error) {
      if (error.code === "23505" || /duplicate/i.test(error.message || "")) {
        throw new Error(t("web.authNameTaken"));
      }
      throw new Error(error.message);
    }
    profile = { ...(profile || {}), display_name: clean, email: session && session.email };
    return clean;
  },

  async submitName(name) {
    await this.changeName(name);
    this.hideOverlay();
    this.onAuthed();
  },

  onAuthed() {
    const g = window.game;
    if (!g || !g.scene) return;
    const auth = g.scene.getScene("auth");
    if (auth && auth.scene.isActive()) auth.enterGame();
  },

  async startGuestPlay() {
    if (this.isGuest() && session && session.access_token) {
      bootGuestSave();
      return;
    }
    const sb = await getSb();
    if (!sb) throw new Error(t("auth.guestFail"));
    const { data, error } = await sb.auth.signInAnonymously();
    if (error || !data || !data.user) throw new Error(t("auth.guestFail"));
    await this.adoptUser(data.user, data.session);
    if (!this.isGuest()) throw new Error(t("auth.guestFail"));
  },

  async endGuestForRegister() {
    this.wantRegister = true;
    try {
      const { NetPlay } = await import("./NetPlay.js");
      NetPlay.stop();
    } catch (e) {}
    const sb = await getSb();
    if (sb) await sb.auth.signOut();
    session = null;
    profile = null;
    SaveSystem.bootEmpty();
  },

  schedulePush() {
    if (!backendReady() || !session || !session.id || session.guest) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => this.pushSave(), 700);
  },

  async pullSave() {
    const sb = await getSb();
    if (!sb || !session || !session.id || session.guest) return null;
    const { data, error } = await sb.from("profiles").select("save_data").eq("id", session.id).maybeSingle();
    if (error || !data || !data.save_data) return null;
    SaveSystem.applyCloud(data.save_data);
    await this.syncLiveWipe();
    return data.save_data;
  },

  async syncLiveWipe() {
    if (dayKey() < BETA.live) return;
    const sb = await getSb();
    if (!sb || !session || !session.id || session.guest) return;
    await sb.rpc("claim_live_wipe");
    if (SaveSystem.justLiveWipe) {
      await sb.from("profiles").update({
        display_name: null,
        display_name_set_at: null
      }).eq("id", session.id);
      profile = { ...(profile || {}), display_name: "" };
      await this.pushSave();
    }
  },

  async pushSave() {
    const sb = await getSb();
    if (!sb || !session || !session.id || session.guest) return;
    const { data, error } = await sb.rpc("push_save", { p_save: SaveSystem.data });
    if (error) return;
    const prem = data && data.premium;
    if (prem != null && SaveSystem.data && SaveSystem.data.currencies) {
      SaveSystem.data.currencies.premium = prem | 0;
    }
  },

  async claimBetaShopPowder() {
    const sb = await getSb();
    if (!sb || !session || !session.id || session.guest) return { ok: false };
    const { data, error } = await sb.rpc("claim_beta_shop_powder");
    if (error) return { ok: false, reason: error.message };
    return data && typeof data === "object" ? data : { ok: false };
  },

  async claimBetaRestGift() {
    const sb = await getSb();
    if (!sb || !session || !session.id || session.guest) return { ok: false };
    const { data, error } = await sb.rpc("claim_beta_rest_gift");
    if (error) return { ok: false, reason: error.message };
    return data && typeof data === "object" ? data : { ok: false };
  },

  async logout() {
    try {
      const { NetPlay } = await import("./NetPlay.js");
      NetPlay.stop();
    } catch (e) {}
    const sb = await getSb();
    if (sb) await sb.auth.signOut();
    session = null;
    profile = null;
    SaveSystem.bootEmpty();
    this.hideOverlay();
    const g = window.game;
    if (g && g.scene) {
      const live = g.scene.getScenes(true)[0];
      if (live) live.scene.start("auth");
    }
  }
};

window.AuthSystem = AuthSystem;
