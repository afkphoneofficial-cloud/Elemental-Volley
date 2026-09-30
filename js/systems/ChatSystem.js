import { AuthSystem } from "./AuthSystem.js";
import { SaveSystem } from "./SaveSystem.js";
import { ChatFilter } from "./ChatFilter.js";
import { Friends } from "./Friends.js";
import { t } from "../i18n/I18n.js";
import { hubNavX, HUB_NAV } from "../ui/hubLayout.js";
import { Presence } from "./Presence.js";

const SHOW = new Set(["hub", "friends", "shop", "wiki", "explore", "settings", "mode", "rank", "menu", "topup", "pass"]);

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

const CHAT_CAP = 30;
const WORLD_MS = 10 * 60 * 1000;
const CHAT_PANEL_W = Math.round(268 * 1.5);
const HUB_CHAT_BTN = { w: 72, h: 72 };

function worldSince() {
  return new Date(Date.now() - WORLD_MS).toISOString();
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
  marks: {},
  unread: 0,
  channel: null,
  visible: false,
  hubScene: null,

  bindHub(scene) {
    this.hubScene = scene;
    this.paintChrome();
    this.layout();
  },

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
    Presence.on(() => this.paintChrome());
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
      Presence.tick();
      if (this.visible && this.open && Date.now() - (this.pollAt || 0) > 6000) {
        this.pollAt = Date.now();
        this.reload();
      }
    };
    setInterval(tick, 500);
    tick();
  },

  setVisible(on) {
    this.visible = Boolean(on);
    if (this.visible && !this.channel) this.listen("world");
    this.layout();
  },

  setOpen(on) {
    this.open = Boolean(on);
    if (this.open) this.unread = 0;
    const ui = els();
    if (ui.dock) ui.dock.classList.toggle("open", this.open);
    this.paintChrome();
    this.layout();
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
    const badge = this.unread > 0 && !this.open ? " · " + (this.unread > 9 ? "9+" : this.unread) : "";
    const title = t("chat.title") + badge;
    if (ui.toggle) ui.toggle.textContent = (this.open ? "▾ " : "▸ ") + title;
    if (this.hubScene && this.hubScene.paintChatBadge) this.hubScene.paintChatBadge();
    ui.tabWorld.textContent = t("chat.world");
    ui.tabFriends.textContent = t("chat.friends");
    ui.tabWorld.classList.toggle("on", this.tab === "world");
    ui.tabFriends.classList.toggle("on", this.tab === "friends");
    ui.input.placeholder = t("chat.placeholder");
    ui.pals.hidden = this.tab !== "friends";
    if (this.tab === "friends") this.paintFriends();
    const send = ui.form.querySelector("button");
    if (send) send.textContent = t("chat.send");
    const onlineLab = document.getElementById("online-label");
    if (onlineLab) onlineLab.textContent = t("hub.online", { n: Presence.n });
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
      const mark = liveSeasonMark(this.marks[row.sender_id]);
      if (mark) {
        const cyc = seasonCycleOf(mark.cycle | 0);
        const key = plateKey(mark.kind, cyc);
        if (key) {
          const img = document.createElement("img");
          img.className = "chat-mark";
          img.alt = "";
          img.src = "assets/sprites/season/" + key + ".png";
          who.appendChild(img);
        }
        if (mark.kind === "frame") who.classList.add("framed");
      }
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
        this.trimRows();
        this.loadMarks(this.rows).then(() => {
          if (!this.open || !this.visible) this.unread += 1;
          this.paintChrome();
          this.paintLog();
        });
        return;
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
    if (this.tab === "world") await sb.rpc("prune_chat");
    const me = AuthSystem.session && AuthSystem.session();
    const ch = this.tab === "world" ? "world" : (me && this.toId ? dmChannel(me.id, this.toId) : "");
    if (!ch) return;
    let q = sb.from("chat_messages")
      .select("id, channel, sender_id, sender_name, body, created_at")
      .eq("channel", ch)
      .order("created_at", { ascending: false })
      .limit(CHAT_CAP);
    if (this.tab === "world") q = q.gte("created_at", worldSince());
    const { data } = await q;
    this.rows = (data || []).slice().reverse();
    this.trimRows();
    await this.loadMarks(this.rows);
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
      this.trimRows();
      await this.loadMarks(this.rows);
      this.paintLog();
    }
  },

  async loadMarks(rows) {
    const ids = [];
    (rows || []).forEach((row) => {
      if (row && row.sender_id && ids.indexOf(row.sender_id) < 0) ids.push(row.sender_id);
    });
    const me = AuthSystem.session && AuthSystem.session();
    this.marks = {};
    if (me) this.marks[me.id] = SaveSystem.data.seasonMark;
    if (!ids.length) return;
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return;
    const { data } = await sb.rpc("public_season_marks", { p_ids: ids });
    (data || []).forEach((row) => {
      if (row && row.id) this.marks[row.id] = row.season_mark;
    });
  },

  trimRows() {
    const cut = Date.now() - WORLD_MS;
    if (this.tab === "world") {
      this.rows = this.rows.filter((row) => {
        const at = row.created_at ? Date.parse(row.created_at) : Date.now();
        return at >= cut;
      });
    }
    if (this.rows.length > CHAT_CAP) this.rows = this.rows.slice(-CHAT_CAP);
  },

  layout() {
    const ui = els();
    const box = document.getElementById("game");
    if (!ui.dock || !box) return;
    const r = box.getBoundingClientRect();
    const scale = r.height / 720;
    const onHub = Boolean(this.hubScene);
    const show = Boolean(this.visible);
    ui.dock.hidden = !show || (onHub && !this.open);
    if (ui.toggle) ui.toggle.hidden = !show || onHub;
    ui.dock.classList.toggle("on-hub", onHub);
    ui.dock.style.width = Math.round(CHAT_PANEL_W * scale) + "px";
    ui.dock.style.setProperty("--chat-scale", String(scale));
    const chip = document.getElementById("online-chip");
    if (chip) chip.hidden = !show || onHub;
    if (onHub) {
      const btnLeft = 1280 / 2 - HUB_CHAT_BTN.w / 2;
      const btnBottom = 720 - HUB_NAV.y + HUB_CHAT_BTN.h / 2;
      const gap = 12;
      const left = btnLeft - gap - CHAT_PANEL_W;
      ui.dock.style.left = (r.left + left * scale) + "px";
      ui.dock.style.bottom = (window.innerHeight - r.bottom + (720 - btnBottom) * scale) + "px";
      return;
    }
    const cx = hubNavX(0, 1280);
    ui.dock.style.left = (r.left + (cx - HUB_NAV.w / 2) * scale) + "px";
    ui.dock.style.bottom = (window.innerHeight - r.bottom + (HUB_NAV.y + HUB_NAV.h / 2 + 10) * scale) + "px";
    if (!this.open) ui.dock.style.width = Math.round(HUB_NAV.w * scale) + "px";
    if (chip && show && !onHub) {
      const gap = 12;
      const navX = hubNavX(0, 1280);
      const dockLeft = navX - HUB_NAV.w / 2;
      chip.style.left = (r.left + (dockLeft + 164 + gap) * scale) + "px";
      chip.style.bottom = (window.innerHeight - r.bottom + (HUB_NAV.y + HUB_NAV.h / 2 + 10) * scale) + "px";
      chip.style.setProperty("--chat-scale", String(scale));
    }
  }
};

window.addEventListener("ev-lang", () => ChatSystem.paintChrome());
