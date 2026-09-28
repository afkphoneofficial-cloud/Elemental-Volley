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
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const save = SaveSystem.data;
    const cur = save.currencies;
    SaveSystem.etherNow();
    this.infoBits = [];

    const avId = save.avatarId;
    const avKey = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    const pg = this.add.graphics().setDepth(19);
    pg.fillStyle(0xfff6ea, 0.96);
    pg.fillRoundedRect(28, 24, 268, 56, 28);
    pg.lineStyle(2, 0xff6a22, 0.75);
    pg.strokeRoundedRect(28, 24, 268, 56, 28);
    this.add.image(60, 52, avKey).setDisplaySize(44, 44).setDepth(21);
    const rk = SaveSystem.data.rank;
    const medal = medalFromMmr(rk.mmr);
    if (!isCalibrating(rk) && this.textures.exists(badgeKey(medal.id))) {
      this.add.image(88, 70, badgeKey(medal.id)).setDisplaySize(28, 28).setDepth(22);
    }
    this.add.text(92, 52, AuthSystem.displayName() || "—", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(21);
    this.add.zone(162, 52, 268, 56).setInteractive({ useHandCursor: true }).setDepth(23)
      .on("pointerdown", () => {
        AudioSystem.ui();
        this.scene.start("career");
      });
    makeButton(this, 360, 52, 120, 44, t("hub.navFriends"), () => {
      AudioSystem.ui();
      this.scene.start("friends");
    }, 0xff8ab8);

    const etherKey = this.textures.exists("vis_ether") ? "vis_ether" : "ether-art";
    chip(this, W - 430, 52, 188, 0x3ad6ff, () => this.openInfo("ether"));
    if (this.textures.exists(etherKey)) {
      this.add.image(W - 500, 52, etherKey).setDisplaySize(34, 34).setDepth(21);
    }
    this.etherText = this.add.text(W - 476, 52, "", {
      fontFamily: UI_FONT, fontSize: "17px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(21);
    this.add.text(W - 352, 52, "?", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#1a7a98"
    }).setOrigin(0.5).setDepth(21);

    chip(this, W - 250, 52, 140, 0xffb14a, () => this.openInfo("tokens"));
    this.add.text(W - 250, 52, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(21).setText(t("hub.chipToken", { n: cur.tokens }));

    chip(this, W - 92, 52, 132, 0x7d5cff, () => this.openInfo("pvp"));
    this.add.text(W - 92, 52, t("hub.chipPvp", { n: cur.pvp }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(21);

    const heroId = save.showcaseId || save.starterId || "ignis";
    const heroKey = this.textures.exists("vis_select_" + heroId)
      ? "vis_select_" + heroId
      : "vis_" + heroId;
    this.add.circle(W / 2, 318, 168, 0xffffff, 0.35).setDepth(5);
    this.add.circle(W / 2, 318, 168, 0x000000, 0).setStrokeStyle(5, 0xff6a22, 0.35).setDepth(5);
    this.heroImg = this.add.image(W / 2, 312, heroKey).setDisplaySize(300, 300).setDepth(6);
    this.heroName = this.add.text(W / 2, 478, charName(heroId), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 506, t("hub.showcaseHint"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#8a5a38"
    }).setOrigin(0.5);
    this.add.zone(W / 2, 318, 320, 320).setInteractive({ useHandCursor: true }).setDepth(7)
      .on("pointerdown", () => this.cycleShowcase(1));
    makeButton(this, W / 2 - 250, 318, 56, 56, "‹", () => this.cycleShowcase(-1), 0xffe08a);
    makeButton(this, W / 2 + 250, 318, 56, 56, "›", () => this.cycleShowcase(1), 0xffe08a);

    makeButton(this, W / 2, 558, 380, 64, t("hub.play"), () => {
      AudioSystem.ui();
      this.scene.start("mode");
    });

    const nav = [
      [W / 2 - 220, t("hub.navShop"), 0xc8ff3a, () => this.scene.start("shop")],
      [W / 2, t("hub.navMap"), 0xffb14a, () => this.scene.start("wiki", { from: "hub" })],
      [W / 2 + 220, t("hub.navSet"), 0xffe08a, () => this.scene.start("settings", { from: "hub" })]
    ];
    nav.forEach(([x, label, col, fn]) => {
      makeButton(this, x, H - 52, 180, 44, label, () => {
        AudioSystem.ui();
        fn();
      }, col);
    });

    this.paintEther();
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
    if (this.heroImg) this.heroImg.setTexture(key).setDisplaySize(300, 300);
    if (this.heroName) this.heroName.setText(charName(next));
  }

  paintEther() {
    if (!this.etherText) return;
    const st = SaveSystem.etherNow();
    this.etherText.setText(st.n + "/" + ECONOMY.etherMax);
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
  }
}
