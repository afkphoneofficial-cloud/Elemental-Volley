import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { Session } from "../systems/Session.js";
import { Friends } from "../systems/Friends.js";
import { t } from "../i18n/I18n.js";
import { avatarKey } from "../data/avatars.js";

export class FriendsScene extends Phaser.Scene {
  constructor() { super("friends"); }

  init(data) {
    this.pickMode = Boolean(data && data.pick);
    this.page = 0;
    this.note = "";
    this.suggests = [];
    this.busy = false;
    this.rolling = false;
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    this.draw();
    AudioSystem.playMenu();
    Friends.sync().then(() => {
      if (this.sys && this.sys.isActive()) this.draw();
      this.rollSuggest();
    });
  }

  draw() {
    this.children.removeAll(true);
    drawGrid(this);
    const W = this.scale.width;
    const list = Friends.list();
    const per = 4;
    const pages = Math.max(1, Math.ceil(list.length / per));
    if (this.page >= pages) this.page = pages - 1;
    const slice = list.slice(this.page * per, this.page * per + per);

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
    const listY = 300;
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

    if (!list.length) {
      roundPanel(this, W / 2, 430, 640, 160, 0xff8ab8, 0xfff6ea);
      this.add.text(W / 2, 410, t("friends.empty"), {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#3a2418", align: "center", wordWrap: { width: 560 }
      }).setOrigin(0.5).setDepth(6);
      this.add.text(W / 2, 450, t("friends.emptySub"), {
        fontFamily: UI_FONT, fontSize: "15px", color: "#7a4a30", align: "center", wordWrap: { width: 520 }
      }).setOrigin(0.5).setDepth(6);
    } else {
      slice.forEach((pal, i) => {
        const y = listY + i * 112;
        roundPanel(this, W / 2, y, 980, 96, 0xffb14a, 0xfff6ea);
        const av = this.textures.exists(avatarKey(pal.avatarId)) ? avatarKey(pal.avatarId) : avatarKey("av01");
        this.add.image(W / 2 - 420, y, av).setDisplaySize(72, 72).setDepth(8);
        this.add.circle(W / 2 - 420, y, 40, 0x000000, 0).setStrokeStyle(3, 0xff8ab8, 0.8).setDepth(9);
        this.add.text(W / 2 - 360, y - 16, pal.name || "—", {
          fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(0, 0.5).setDepth(8);
        this.add.text(W / 2 - 360, y + 16, t("friends.rowSub"), {
          fontFamily: UI_FONT, fontSize: "13px", color: "#8a5a38"
        }).setOrigin(0, 0.5).setDepth(8);
        makeButton(this, W / 2 + 250, y, 200, 44, t("friends.exhibit"), () => {
          AudioSystem.ui();
          Session.mode = "exhibit";
          Session.rival = Friends.toRival(pal);
          this.hideForm();
          this.scene.start("select");
        }, 0x7d5cff);
        makeButton(this, W / 2 + 420, y, 120, 44, t("friends.remove"), () => {
          AudioSystem.ui();
          Friends.remove(pal.id).then(() => this.draw());
        }, 0xff8ab8);
      });
      if (pages > 1) {
        makeButton(this, W / 2 - 80, 650, 100, 40, "‹", () => {
          this.page = Math.max(0, this.page - 1);
          this.draw();
        }, 0xffe08a);
        this.add.text(W / 2, 650, (this.page + 1) + " / " + pages, {
          fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
        }).setOrigin(0.5);
        makeButton(this, W / 2 + 80, 650, 100, 40, "›", () => {
          this.page = Math.min(pages - 1, this.page + 1);
          this.draw();
        }, 0xffe08a);
      }
    }
    if (this.note && (this.busy || suggests.length)) {
      this.add.text(W / 2, 268, this.note, {
        fontFamily: UI_FONT, fontSize: "14px", color: "#c45a16"
      }).setOrigin(0.5);
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
