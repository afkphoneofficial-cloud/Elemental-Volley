import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { Session } from "../systems/Session.js";
import { Friends } from "../systems/Friends.js";
import { ChatSystem } from "../systems/ChatSystem.js";
import { t } from "../i18n/I18n.js";
import { avatarKey } from "../data/avatars.js";
import { NetPlay } from "../systems/NetPlay.js";

function dimBtn(btn, on) {
  const a = on ? 1 : 0.4;
  btn.gfx.setAlpha(a);
  btn.text.setAlpha(on ? 1 : 0.55);
  btn.bg.setAlpha(on ? 1 : 0.55);
}

export class FriendsScene extends Phaser.Scene {
  constructor() { super("friends"); }

  init(data) {
    this.pickMode = Boolean(data && data.pick);
    this.page = 0;
    this.note = "";
    this.suggests = [];
    this.busy = false;
    this.rolling = false;
    this.listScroll = 0;
    this.listMax = 0;
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    this.draw();
    AudioSystem.playMenu();
    if (!this.inputBound) {
      this.inputBound = true;
      this.input.on("wheel", (_p, _g, _dx, dy) => this.nudgeList(dy * 0.45));
      this.input.on("pointerdown", (p) => {
        if (p.x > 620 || p.y < 318 || p.y > 678) return;
        this._drag = { y: p.y, s: this.listScroll };
      });
      this.input.on("pointerup", () => { this._drag = null; });
      this.input.on("pointermove", (p) => {
        if (!this._drag || !p.isDown) return;
        this.listScroll = Phaser.Math.Clamp(this._drag.s + (this._drag.y - p.y), 0, this.listMax || 0);
        if (this.listBox) this.listBox.y = -this.listScroll;
      });
    }
    Friends.sync().then(() => {
      if (this.sys && this.sys.isActive()) this.draw();
      this.rollSuggest();
    });
  }

  nudgeList(dy) {
    this.listScroll = Phaser.Math.Clamp((this.listScroll || 0) + dy, 0, this.listMax || 0);
    if (this.listBox) this.listBox.y = -this.listScroll;
  }

  rowVisible(y, listTop, viewH) {
    const sy = y + (this.listBox ? this.listBox.y : 0);
    return sy > listTop - 24 && sy < listTop + viewH - 24;
  }

  draw() {
    this.children.removeAll(true);
    drawGrid(this);
    const W = this.scale.width;
    const list = Friends.list();
    const slice = list;

    this.add.text(W / 2, 40, t("friends.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 74, t("friends.cap", { n: list.length, max: ECONOMY.friendMax }), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#7a4a30"
    }).setOrigin(0.5);
    if (this.pickMode) {
      this.add.text(W / 2, 100, t("friends.pickHint"), {
        fontFamily: UI_FONT, fontSize: "14px", color: "#c45a16"
      }).setOrigin(0.5);
    }

    makeButton(this, 120, 42, 140, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.hideForm();
      this.scene.start(this.pickMode ? "mode" : "hub");
    }, 0x7d5cff);
    makeButton(this, W - 330, 42, 200, 40, t("friends.suggest"), () => {
      AudioSystem.ui();
      this.rollSuggest();
    }, 0x3ad6ff);
    makeButton(this, W - 120, 42, 200, 40, t("friends.add"), () => {
      AudioSystem.ui();
      this.showForm();
    }, 0xff8ab8);

    const suggests = this.suggests || [];
    this.add.text(W / 2, 118, t("friends.suggestHead"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);
    if (this.busy) {
      roundPanel(this, W / 2, 200, 980, 120, 0x3ad6ff, 0xfff6ea);
      this.add.text(W / 2, 200, t("friends.suggestWait"), {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0.5).setDepth(6);
    } else if (suggests.length) {
      suggests.forEach((pal, i) => {
        const n = suggests.length;
        const x = W / 2 - ((n - 1) * 210) / 2 + i * 210;
        const y = 200;
        roundPanel(this, x, y, 196, 120, 0x3ad6ff, 0xfff6ea);
        const av = this.textures.exists(avatarKey(pal.avatarId)) ? avatarKey(pal.avatarId) : avatarKey("av01");
        this.add.image(x - 58, y - 8, av).setDisplaySize(52, 52).setDepth(8);
        this.add.text(x + 18, y - 22, pal.name || "—", {
          fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418", wordWrap: { width: 110 }
        }).setOrigin(0, 0.5).setDepth(8);
        makeButton(this, x, y + 36, 150, 36, Friends.pendingHas(pal.id) ? t("friends.pending") : t("friends.addOne"), async () => {
          AudioSystem.ui();
          if (Friends.pendingHas(pal.id) || Friends.has(pal.id)) return;
          const res = await Friends.invitePacked(pal);
          if (!res.ok) {
            const key = "friends.err" + (res.reason === "dup" ? "Dup" : res.reason === "full" ? "Full" : res.reason === "pending" ? "Pending" : res.reason === "self" ? "Self" : "Cloud");
            this.note = t(key);
          } else if (res.reason === "accepted") {
            this.note = t("friends.acceptedNow", { name: pal.name });
            this.suggests = this.suggests.filter((p) => p.id !== pal.id);
          } else {
            this.note = t("friends.added", { name: pal.name });
            this.suggests = this.suggests.filter((p) => p.id !== pal.id);
          }
          this.draw();
        }, Friends.pendingHas(pal.id) ? 0xffe08a : 0xff8ab8);
      });
    } else {
      roundPanel(this, W / 2, 200, 980, 120, 0xff8ab8, 0xfff6ea);
      this.add.text(W / 2, 200, this.note || t("friends.suggestNone"), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418", align: "center", wordWrap: { width: 900 }
      }).setOrigin(0.5).setDepth(6);
    }

    const leftX = 322;
    const rightX = 958;
    const colY = 498;
    roundPanel(this, leftX, colY, 596, 392, 0xff8ab8, 0xfff6ea);
    roundPanel(this, rightX, colY, 596, 392, 0x7d5cff, 0xfff6ea);
    this.add.text(leftX, 318, t("friends.listHead"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8);
    this.add.text(rightX, 318, t("friends.findTitle"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8);
    this.add.text(rightX, 360, t("friends.findBody"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7a4a30",
      align: "center", wordWrap: { width: 520 }
    }).setOrigin(0.5).setDepth(8);

    const coolLeft = Math.max(0, (NetPlay.exhibitCooldownUntil | 0) - Date.now());
    this.findWait = this.add.text(rightX, 430, coolLeft ? t("friends.findWait", { n: Math.ceil(coolLeft / 1000) }) : "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(8);
    const findOn = coolLeft <= 0;
    const find = makeButton(this, rightX, 520, 280, 56, t("friends.findMatch"), () => {
      if (!findOn) return;
      AudioSystem.ui();
      Session.mode = "exhibit";
      Session.exhibitCasual = true;
      Session.exhibitFriendId = null;
      Session.rival = null;
      Session.playerId = Session.playerId || SaveSystem.data.showcaseId || SaveSystem.data.starterId || "ignis";
      this.hideForm();
      this.scene.start("queue");
    }, findOn ? 0xff6a22 : 0xc8bdd8);
    if (!findOn) dimBtn(find, false);

    if (!list.length) {
      this.add.text(leftX, 480, t("friends.empty"), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418", align: "center", wordWrap: { width: 520 }
      }).setOrigin(0.5).setDepth(8);
      this.add.text(leftX, 530, t("friends.emptySub"), {
        fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30", align: "center", wordWrap: { width: 500 }
      }).setOrigin(0.5).setDepth(8);
    } else {
      const rowH = 92;
      const listTop = 370;
      const viewH = 300;
      this.listMax = Math.max(0, list.length * rowH - viewH);
      this.listScroll = Phaser.Math.Clamp(this.listScroll || 0, 0, this.listMax);
      this.listBox = this.add.container(0, -this.listScroll).setDepth(10);
      const mw = 572;
      const mh = viewH;
      const mx = leftX - 286;
      const my = listTop - 42;
      const rt = this.add.renderTexture(mx + mw / 2, my + mh / 2, mw, mh).setVisible(false);
      rt.fill(0xffffff, 1);
      this.listBox.setMask(rt.createBitmapMask());
      slice.forEach((pal, i) => {
        const y = listTop + i * rowH;
        const panel = this.add.graphics().setDepth(10);
        panel.fillStyle(0xffffff, 1);
        panel.fillRoundedRect(leftX - 280, y - 38, 560, 76, 16);
        panel.lineStyle(2.5, 0xff8ab8, 1);
        panel.strokeRoundedRect(leftX - 280, y - 38, 560, 76, 16);
        const av = this.textures.exists(avatarKey(pal.avatarId)) ? avatarKey(pal.avatarId) : avatarKey("av01");
        const img = this.add.image(leftX - 232, y, av).setDisplaySize(52, 52).setDepth(11);
        const ring = this.add.circle(leftX - 232, y, 30, 0x000000, 0).setStrokeStyle(3, 0xff6a9a, 1).setDepth(12);
        const nm = this.add.text(leftX - 188, y - 12, pal.name || "—", {
          fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#1a1008",
          stroke: "#fff6ea", strokeThickness: 3
        }).setOrigin(0, 0.5).setDepth(11);
        const sub = this.add.text(leftX - 188, y + 12, t("friends.rowSub"), {
          fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#5a3828"
        }).setOrigin(0, 0.5).setDepth(11);
        const ex = makeButton(this, leftX + 52, y, 108, 34, t("friends.exhibit"), () => {
          if (!this.rowVisible(y, listTop, viewH)) return;
          AudioSystem.ui();
          Session.mode = "exhibit";
          Session.exhibitCasual = false;
          Session.exhibitFriendId = pal.id;
          Session.rival = Friends.toRival(pal);
          Session.rival.live = true;
          this.hideForm();
          this.scene.start("select");
        }, 0x7d5cff);
        const ch = makeButton(this, leftX + 154, y, 78, 34, t("friends.chat"), () => {
          if (!this.rowVisible(y, listTop, viewH)) return;
          AudioSystem.ui();
          ChatSystem.openDm(pal);
        }, 0x3ad6ff);
        const rm = makeButton(this, leftX + 236, y, 70, 34, t("friends.remove"), () => {
          if (!this.rowVisible(y, listTop, viewH)) return;
          AudioSystem.ui();
          Friends.remove(pal.id).then(() => this.draw());
        }, 0xff8ab8);
        this.listBox.add([panel, img, ring, nm, sub, ex.gfx, ex.text, ex.bg, ch.gfx, ch.text, ch.bg, rm.gfx, rm.text, rm.bg]);
      });
    }
    if (this.note && (this.busy || suggests.length)) {
      this.add.text(W / 2, 278, this.note, {
        fontFamily: UI_FONT, fontSize: "14px", color: "#c45a16"
      }).setOrigin(0.5);
    }
  }

  update() {
    if (!this.findWait) return;
    const left = Math.max(0, (NetPlay.exhibitCooldownUntil | 0) - Date.now());
    if (left > 0) {
      this.findWait.setText(t("friends.findWait", { n: Math.ceil(left / 1000) }));
      this._coolOn = true;
    } else if (this._coolOn) {
      this._coolOn = false;
      this.draw();
    }
  }

  async rollSuggest() {
    if (this.rolling) return;
    this.rolling = true;
    this.busy = true;
    this.note = t("friends.suggestWait");
    this.draw();
    const res = await Friends.suggestFromServer();
    if (!this.sys || !this.sys.isActive()) {
      this.rolling = false;
      return;
    }
    this.busy = false;
    this.rolling = false;
    if (!res.ok) {
      this.note = t("friends.errCloud");
      this.suggests = [];
    } else if (!res.list.length) {
      this.note = t("friends.suggestNone");
      this.suggests = [];
    } else {
      this.suggests = res.list;
      this.note = t("friends.suggestOk", { n: res.list.length });
    }
    this.draw();
  }

  showForm() {
    const el = document.getElementById("friend-overlay");
    const msg = document.getElementById("friend-msg");
    const input = document.getElementById("friend-name");
    if (!el) return;
    el.hidden = false;
    if (msg) msg.textContent = t("friends.formHint");
    if (input) {
      input.value = "";
      input.placeholder = t("friends.formName");
      input.focus();
    }
    const add = document.getElementById("friend-add");
    const cancel = document.getElementById("friend-cancel");
    if (add) add.textContent = t("friends.add");
    if (cancel) cancel.textContent = t("nav.back");
    if (add && !add.dataset.bound) {
      add.dataset.bound = "1";
      add.addEventListener("click", () => this.submitAdd());
    }
    if (cancel && !cancel.dataset.bound) {
      cancel.dataset.bound = "1";
      cancel.addEventListener("click", () => this.hideForm());
    }
  }

  hideForm() {
    const el = document.getElementById("friend-overlay");
    if (el) el.hidden = true;
  }

  async submitAdd() {
    const input = document.getElementById("friend-name");
    const msg = document.getElementById("friend-msg");
    const res = await Friends.inviteByName(input && input.value);
    if (!res.ok) {
      const map = {
        len: t("friends.errLen"),
        full: t("friends.errFull"),
        cloud: t("friends.errCloud"),
        missing: t("friends.errMissing"),
        self: t("friends.errSelf"),
        dup: t("friends.errDup"),
        pending: t("friends.errPending")
      };
      if (msg) msg.textContent = map[res.reason] || t("friends.errCloud");
      return;
    }
    this.hideForm();
    this.note = res.reason === "accepted"
      ? t("friends.acceptedNow", { name: res.pal && res.pal.name })
      : t("friends.added", { name: res.pal && res.pal.name });
    this.draw();
  }

  shutdown() {
    this.hideForm();
  }
}
