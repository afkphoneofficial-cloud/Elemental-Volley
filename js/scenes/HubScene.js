import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { formatEtherWait } from "../systems/Ether.js";
import { avatarKey } from "../data/avatars.js";
import { medalFromMmr, isCalibrating, badgeKey } from "../data/ranks.js";
import { ROSTER_IDS } from "../data/roster.js";
import { mountMailboxHud } from "../ui/MailboxHud.js";
import { Mailbox } from "../systems/Mailbox.js";
import { Friends } from "../systems/Friends.js";
import { hubNavX, HUB_NAV } from "../ui/hubLayout.js";
import { ChatSystem } from "../systems/ChatSystem.js";
import { NetPlay } from "../systems/NetPlay.js";
import { Leaderboard } from "../systems/Leaderboard.js";

function chip(scene, x, y, w, color, onClick) {
  const h = 48;
  const g = scene.add.graphics().setDepth(20);
  const draw = (hot) => {
    g.clear();
    g.fillStyle(hot ? 0xffe8c8 : 0xfff6ea, 0.96);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 24);
    g.lineStyle(2, color, hot ? 1 : 0.7);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 24);
  };
  draw(false);
  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(22);
  zone.on("pointerover", () => draw(true));
  zone.on("pointerout", () => draw(false));
  zone.on("pointerdown", onClick);
  return { g, zone, x, y, w, h };
}

export class HubScene extends Phaser.Scene {
  constructor() { super("hub"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    NetPlay.ensure();
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const save = SaveSystem.data;
    const cur = save.currencies;
    SaveSystem.etherNow();
    this.infoBits = [];

    const PAD = 28;
    const TOP = 48;
    const CH = 48;
    const GAP = 14;
    const pw = 228;
    const fx = PAD + pw + GAP + 59;
    const mx = W - PAD - 54;
    const pvx = mx - 54 - GAP - 59;
    const tx = pvx - 59 - GAP - 62;
    const ex = tx - 62 - GAP - 82;
    this.hubMail = { x: mx, y: TOP, w: 108, h: CH };

    const avId = save.avatarId;
    const avKey = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    const profileX = PAD + pw / 2;
    const pg = this.add.graphics().setDepth(19);
    pg.fillStyle(0xfff6ea, 0.96);
    pg.fillRoundedRect(PAD, TOP - CH / 2, pw, CH, 24);
    pg.lineStyle(2, 0xff6a22, 0.75);
    pg.strokeRoundedRect(PAD, TOP - CH / 2, pw, CH, 24);
    const profileBox = this.add.container(profileX, TOP).setDepth(21);
    const name = (AuthSystem.displayName() || "—").slice(0, 12);
    const nm = this.add.text(0, 0, name, {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5);
    const av = 40;
    const gap = 8;
    const inner = av + gap + nm.width;
    const avX = -inner / 2 + av / 2;
    const face = this.add.image(avX, 0, avKey).setDisplaySize(av, av);
    nm.setPosition(avX + av / 2 + gap, 0);
    profileBox.add([face, nm]);
    const rk = SaveSystem.data.rank;
    const medal = medalFromMmr(rk.mmr);
    if (!isCalibrating(rk) && this.textures.exists(badgeKey(medal.id))) {
      profileBox.add(this.add.image(avX + 14, 14, badgeKey(medal.id)).setDisplaySize(22, 22));
    }
    this.add.zone(profileX, TOP, pw, CH).setInteractive({ useHandCursor: true }).setDepth(23)
      .on("pointerdown", () => {
        AudioSystem.ui();
        this.scene.start("career");
      });
    chip(this, fx, TOP, 118, 0xff8ab8, () => {
      AudioSystem.ui();
      this.scene.start("friends");
    });
    this.add.text(fx, TOP, t("hub.navFriends"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(21);

    const etherKey = this.textures.exists("vis_ether") ? "vis_ether" : "ether-art";
    chip(this, ex, TOP, 164, 0x3ad6ff, () => this.openInfo("ether"));
    this.etherBox = this.add.container(ex, TOP).setDepth(21);
    this.etherIcon = this.textures.exists(etherKey)
      ? this.add.image(0, 0, etherKey).setDisplaySize(30, 30)
      : null;
    this.etherText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5);
    this.etherHint = this.add.text(0, 0, "?", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "900", color: "#1a7a98"
    }).setOrigin(0.5);
    if (this.etherIcon) this.etherBox.add(this.etherIcon);
    this.etherBox.add([this.etherText, this.etherHint]);

    chip(this, tx, TOP, 124, 0xffb14a, () => this.openInfo("tokens"));
    this.add.text(tx, TOP, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(21).setText(t("hub.chipToken", { n: cur.tokens }));

    chip(this, pvx, TOP, 118, 0x7d5cff, () => this.openInfo("pvp"));
    this.add.text(pvx, TOP, t("hub.chipPvp", { n: cur.pvp }), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(21);

    const heroId = save.showcaseId || save.starterId || "ignis";
    const heroKey = this.textures.exists("vis_select_" + heroId)
      ? "vis_select_" + heroId
      : "vis_" + heroId;
    const heroY = 292;
    this.add.circle(W / 2, heroY, 136, 0xffffff, 0.32).setDepth(5);
    this.add.circle(W / 2, heroY, 136, 0x000000, 0).setStrokeStyle(4, 0xff6a22, 0.32).setDepth(5);
    this.heroImg = this.add.image(W / 2, heroY - 6, heroKey).setDisplaySize(252, 252).setDepth(6);
    this.heroName = this.add.text(W / 2, 424, charName(heroId), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 448, t("hub.showcaseHint"), {
      fontFamily: UI_FONT, fontSize: "12px", color: "#8a5a38"
    }).setOrigin(0.5);
    this.add.zone(W / 2, heroY, 268, 268).setInteractive({ useHandCursor: true }).setDepth(7)
      .on("pointerdown", () => this.cycleShowcase(1));
    makeButton(this, W / 2 - 198, heroY, 52, 52, "‹", () => this.cycleShowcase(-1), 0xffe08a);
    makeButton(this, W / 2 + 198, heroY, 52, 52, "›", () => this.cycleShowcase(1), 0xffe08a);

    makeButton(this, W / 2, 508, 348, 56, t("hub.play"), () => {
      AudioSystem.ui();
      this.scene.start("mode");
    });
    makeButton(this, W / 2, 572, 280, 44, t("hub.navBoard"), () => {
      AudioSystem.ui();
      Leaderboard.show();
    }, 0xffb14a);

    const navY = H - HUB_NAV.y;
    const chatBtn = makeButton(this, hubNavX(0, W), navY, HUB_NAV.w, HUB_NAV.h, t("chat.title"), () => {
      AudioSystem.ui();
      ChatSystem.setOpen(!ChatSystem.open);
    }, 0x3ad6ff);
    this.chatLabel = chatBtn.text;
    ChatSystem.bindHub(this);
    const nav = [
      [hubNavX(1, W), t("hub.navShop"), 0xc8ff3a, () => this.scene.start("shop")],
      [hubNavX(2, W), t("hub.navMap"), 0xffb14a, () => this.scene.start("wiki", { from: "hub" })],
      [hubNavX(3, W), t("hub.navSet"), 0xffe08a, () => this.scene.start("settings", { from: "hub" })]
    ];
    nav.forEach(([x, label, col, fn]) => {
      makeButton(this, x, navY, HUB_NAV.w, HUB_NAV.h, label, () => {
        AudioSystem.ui();
        fn();
      }, col);
    });

    this.paintEther();
    mountMailboxHud(this);
    Friends.sync();
    AudioSystem.playMenu();
  }

  cycleShowcase(dir) {
    const owned = ROSTER_IDS.filter((id) => SaveSystem.isUnlocked(id));
    if (!owned.length) return;
    const cur = SaveSystem.data.showcaseId || SaveSystem.data.starterId || owned[0];
    let i = owned.indexOf(cur);
    if (i < 0) i = 0;
    const next = owned[(i + dir + owned.length) % owned.length];
    SaveSystem.setShowcase(next);
    AudioSystem.ui();
    const key = this.textures.exists("vis_select_" + next) ? "vis_select_" + next : "vis_" + next;
    if (this.heroImg) this.heroImg.setTexture(key).setDisplaySize(252, 252);
    if (this.heroName) this.heroName.setText(charName(next));
  }

  paintEther() {
    if (!this.etherText) return;
    const st = SaveSystem.etherNow();
    this.etherText.setText(st.n + "/" + ECONOMY.etherMax);
    const gap = 6;
    const iconW = this.etherIcon ? 30 : 0;
    const qW = 14;
    const tw = this.etherText.width;
    const total = iconW + (iconW ? gap : 0) + tw + gap + qW;
    let x = -total / 2;
    if (this.etherIcon) {
      this.etherIcon.setPosition(x + iconW / 2, 0);
      x += iconW + gap;
    }
    this.etherText.setPosition(x, 0);
    x += tw + gap;
    if (this.etherHint) this.etherHint.setPosition(x + qW / 2, 0);
  }

  openInfo(kind) {
    this.closeInfo();
    const W = this.scale.width;
    const H = this.scale.height;
    const st = SaveSystem.etherNow();
    const wait = st.full ? t("hub.etherFull") : t("hub.etherWait", { t: formatEtherWait(st.nextMs) });
    const title = t("hub.info." + kind + "Title");
    const body = kind === "ether"
      ? t("hub.info.etherBody", { wait, max: ECONOMY.etherMax })
      : t("hub.info." + kind + "Body");
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.5).setDepth(70).setInteractive();
    const card = this.add.graphics().setDepth(71);
    card.fillStyle(0xfff6ea, 0.98);
    card.fillRoundedRect(W / 2 - 280, H / 2 - 150, 560, 300, 22);
    card.lineStyle(3, 0xff6a22, 0.8);
    card.strokeRoundedRect(W / 2 - 280, H / 2 - 150, 560, 300, 22);
    const t1 = this.add.text(W / 2, H / 2 - 110, title, {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(72);
    const t2 = this.add.text(W / 2, H / 2 - 20, body, {
      fontFamily: UI_FONT, fontSize: "16px", color: "#5a3828", align: "center", wordWrap: { width: 480 }
    }).setOrigin(0.5).setDepth(72);
    const close = makeButton(this, W / 2, H / 2 + 100, 180, 44, t("hub.infoClose"), () => {
      AudioSystem.ui();
      this.closeInfo();
    }, 0xff6a22, 80);
    dim.on("pointerdown", () => this.closeInfo());
    this.infoBits = [dim, card, t1, t2, close.bg, close.text, close.gfx];
  }

  closeInfo() {
    this.infoBits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.infoBits = [];
  }

  update() {
    this.paintEther();
    if (this.time.now - (this.syncAt || 0) > 12000) {
      this.syncAt = this.time.now;
      Friends.sync();
    }
    if (this.mailOpen) return;
    if (!this.mailAt) this.mailAt = 0;
    if (this.time.now - this.mailAt < 10000) return;
    this.mailAt = this.time.now;
    Mailbox.refresh().then(() => {
      if (this.sys && this.sys.isActive() && this.paintMailbox) this.paintMailbox();
    });
  }

  shutdown() {
    ChatSystem.bindHub(null);
    Leaderboard.hide();
  }
}
