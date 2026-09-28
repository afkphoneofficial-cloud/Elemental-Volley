import { AuthSystem } from "./AuthSystem.js";
import { ChatFilter } from "./ChatFilter.js";
import { Friends } from "./Friends.js";
import { t } from "../i18n/I18n.js";

const SHOW = new Set(["hub", "friends", "shop", "wiki", "settings", "career", "mode", "rank", "menu"]);

function els() {
  return {
    dock: document.getElementById("chat-dock"),
    toggle: document.getElementById("chat-toggle"),
    panel: document.getElementById("chat-panel"),
    log: document.getElementById("chat-log"),
    form: document.getElementById("chat-form"),
    input: document.getElementById("chat-input"),
    note: document.getElementById("chat-note"),
    pals: document.getElementById("chat-friends"),
    tabWorld: document.getElementById("chat-tab-world"),
    tabFriends: document.getElementById("chat-tab-friends")
  };
}

function dmChannel(a, b) {
  return a < b ? "dm:" + a + ":" + b : "dm:" + b + ":" + a;
}

export const ChatSystem = {
  open: false,
  tab: "world",
  toId: null,
  toName: "",
  rows: [],
  unread: 0,
  channel: null,
  visible: false,

  mount() {
    const ui = els();
    if (!ui.dock || ui.dock.dataset.bound) {
      this.layout();
      return this;
    }
    ui.dock.dataset.bound = "1";
    ui.toggle.addEventListener("click", () => this.setOpen(!this.open));
    ui.tabWorld.addEventListener("click", () => this.setTab("world"));
    ui.tabFriends.addEventListener("click", () => this.setTab("friends"));
    ui.form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.send();
    });
    window.addEventListener("resize", () => this.layout());
    window.addEventListener("ev-lang", () => this.paintChrome());
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => this.layout());
    }
    this.paintChrome();
    this.layout();
    this.watchScenes();
    return this;
  },

  watchScenes() {
    const tick = () => {
      const game = window.game;
      let key = "";
      if (game && game.scene) {
        const live = game.scene.getScenes(true)[0];
        key = live && live.sys ? live.sys.settings.key : "";
      }
      this.setVisible(SHOW.has(key) && typeof AuthSystem.canPlay === "function" && AuthSystem.canPlay());
    if (this.visible && this.open && Date.now() - (this.pollAt || 0) > 6000) {
      this.pollAt = Date.now();
      this.reload();
    }
    };
    setInterval(tick, 500);
    tick();
  },

  setVisible(on) {
    const ui = els();
    if (!ui.dock) return;
    this.visible = Boolean(on);
    ui.dock.hidden = !this.visible;
    if (this.visible) {
      this.layout();
      if (!this.channel) this.listen("world");
    }
  },

  setOpen(on) {
    this.open = Boolean(on);
    if (this.open) this.unread = 0;
    const ui = els();
    if (ui.dock) ui.dock.classList.toggle("open", this.open);
    this.paintChrome();
    if (this.open) this.reload();
  },

  setTab(tab) {
    this.tab = tab === "friends" ? "friends" : "world";
    if (this.tab === "world") this.toId = null;
    this.paintChrome();
    this.listen(this.tab === "world" ? "world" : (this.toId ? dmChannel(AuthSystem.session().id, this.toId) : null));
    this.reload();
  },

  openDm(pal) {
    if (!pal || !pal.id) return;
    this.toId = pal.id;
    this.toName = pal.name || "";
    this.tab = "friends";
    this.setVisible(true);
    this.setOpen(true);
    this.paintChrome();
    const me = AuthSystem.session && AuthSystem.session();
    if (me) this.listen(dmChannel(me.id, pal.id));
    this.reload();
  },

  paintChrome() {
    const ui = els();
    if (!ui.dock) return;
    const badge = this.unread > 0 && !this.open ? " (" + (this.unread > 9 ? "9+" : this.unread) + ")" : "";
    ui.toggle.textContent = (this.open ? "▾ " : "▸ ") + t("chat.title") + badge;
    ui.tabWorld.textContent = t("chat.world");
    ui.tabFriends.textContent = t("chat.friends");
    ui.tabWorld.classList.toggle("on", this.tab === "world");
    ui.tabFriends.classList.toggle("on", this.tab === "friends");
    ui.input.placeholder = t("chat.placeholder");
    ui.pals.hidden = this.tab !== "friends";
    if (this.tab === "friends") this.paintFriends();
    const send = ui.form.querySelector("button");
    if (send) send.textContent = t("chat.send");
  },

  paintFriends() {
    const ui = els();
    if (!ui.pals) return;
    const list = Friends.list();
    ui.pals.innerHTML = "";
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "chat-empty";
      p.textContent = t("chat.pickFriend");
      ui.pals.appendChild(p);
      return;
    }
    list.forEach((pal) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chat-pal" + (pal.id === this.toId ? " on" : "");
      b.textContent = pal.name || "—";
      b.addEventListener("click", () => this.openDm(pal));
      ui.pals.appendChild(b);
    });
  },

  paintLog() {
    const ui = els();
    if (!ui.log) return;
    ui.log.innerHTML = "";
    if (this.tab === "friends" && !this.toId) {
      const p = document.createElement("p");
      p.className = "chat-empty";
      p.textContent = t("chat.emptyDm");
      ui.log.appendChild(p);
      return;
    }
    if (!this.rows.length) {
      const p = document.createElement("p");
      p.className = "chat-empty";
      p.textContent = this.tab === "world" ? t("chat.emptyWorld") : t("chat.emptyDm");
      ui.log.appendChild(p);
      return;
    }
    const me = AuthSystem.session && AuthSystem.session();
    this.rows.forEach((row) => {
      const div = document.createElement("div");
      div.className = "chat-row" + (me && row.sender_id === me.id ? " mine" : "");
      const who = document.createElement("strong");
      who.textContent = row.sender_name || "—";
      const body = document.createElement("span");
      body.textContent = row.body || "";
      div.appendChild(who);
      div.appendChild(body);
      ui.log.appendChild(div);
    });
    ui.log.scrollTop = ui.log.scrollHeight;
  },

  note(text) {
    const ui = els();
    if (ui.note) ui.note.textContent = text || "";
  },

  async listen(ch) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return;
    if (this.channel) {
      await sb.removeChannel(this.channel);
      this.channel = null;
    }
    if (!ch) return;
    this.channel = sb.channel("ev-chat-" + ch).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: "channel=eq." + ch },
      (payload) => {
        const row = payload.new;
        if (!row || this.rows.some((r) => r.id === row.id)) return;
        this.rows.push(row);
        if (this.rows.length > 80) this.rows = this.rows.slice(-80);
        if (!this.open || !this.visible) this.unread += 1;
        this.paintChrome();
        this.paintLog();
      }
    );
    await this.channel.subscribe();
  },

  async reload() {
    const ui = els();
    if (this.tab === "friends" && !this.toId) {
      this.rows = [];
      this.paintLog();
      return;
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return;
    const me = AuthSystem.session && AuthSystem.session();
    const ch = this.tab === "world" ? "world" : (me && this.toId ? dmChannel(me.id, this.toId) : "");
    if (!ch) return;
    const { data } = await sb.from("chat_messages")
      .select("id, channel, sender_id, sender_name, body, created_at")
      .eq("channel", ch)
      .order("created_at", { ascending: false })
      .limit(80);
    this.rows = (data || []).slice().reverse();
    this.paintLog();
    if (ui.note && !ui.note.dataset.hold) ui.note.textContent = "";
  },

  async send() {
    const ui = els();
    const raw = ui.input ? ui.input.value : "";
    const cleaned = ChatFilter.clean(raw);
    if (!cleaned.ok) {
      this.note(cleaned.reason === "blocked" ? t("chat.blocked") : t("chat.empty"));
      return;
    }
    if (this.tab === "friends" && !this.toId) {
      this.note(t("chat.emptyDm"));
      return;
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) {
      this.note(t("friends.errCloud"));
      return;
    }
    const { data, error } = await sb.rpc("send_chat", {
      p_to: this.tab === "friends" ? this.toId : null,
      p_body: cleaned.body
    });
    if (error || (data && data.ok === false)) {
      const reason = data && data.reason;
      this.note(reason === "notfriend" ? t("chat.needFriend") : t("friends.errCloud"));
      return;
    }
    if (ui.input) ui.input.value = "";
    this.note("");
    if (data && data.id && !this.rows.some((r) => r.id === data.id)) {
      this.rows.push(data);
      this.paintLog();
    }
  },

  layout() {
    const ui = els();
    const box = document.getElementById("game");
    if (!ui.dock || !box) return;
    const r = box.getBoundingClientRect();
    const scale = r.height / 720;
    ui.dock.style.left = (r.left + 12 * scale) + "px";
    ui.dock.style.bottom = (window.innerHeight - r.bottom + 64 * scale) + "px";
    ui.dock.style.width = Math.round(300 * scale) + "px";
    ui.dock.style.setProperty("--chat-scale", String(scale));
  }
};

window.addEventListener("ev-lang", () => ChatSystem.paintChrome());
