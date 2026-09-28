import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { formatEtherWait } from "../systems/Ether.js";
import { avatarKey } from "../data/avatars.js";

export class HubScene extends Phaser.Scene {
  constructor() { super("hub"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const save = SaveSystem.data;
    const cur = save.currencies;
    SaveSystem.etherNow();

    this.add.text(W / 2, 48, t("hub.title"), {
      fontFamily: UI_FONT, fontSize: "36px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 108, 860, 52, 0xff8a3a, 0xfff6ea);
    const avId = save.avatarId;
    const avKey = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    const av = this.add.image(W / 2 - 380, 108, avKey).setDisplaySize(46, 46).setDepth(8).setInteractive({ useHandCursor: true });
    av.on("pointerdown", () => this.scene.start("career"));
    this.add.text(W / 2 + 18, 108,
      t("hub.stats", {
        account: AuthSystem.displayName(),
        name: charName(save.starterId),
        n: save.unlocked.length,
        tokens: cur.tokens,
        pvp: cur.pvp
      }),
      { fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#3a2418" }
    ).setOrigin(0.5).setDepth(6);

    const etherKey = this.textures.exists("vis_ether") ? "vis_ether" : (this.textures.exists("ether-art") ? "ether-art" : null);
    if (etherKey) {
      this.add.image(W / 2 - 210, 162, etherKey).setDisplaySize(42, 42).setDepth(8);
    } else {
      this.add.circle(W / 2 - 210, 162, 16, 0x3ad6ff, 1).setStrokeStyle(3, 0xffe08a, 0.9).setDepth(8);
    }
    this.etherText = this.add.text(W / 2 - 182, 162, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(8);
    this.etherHint = this.add.text(W / 2 + 20, 162, "", {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8);
    this.paintEther();

    makeButton(this, W / 2, 228, 400, 58, t("hub.play"), () => {
      AudioSystem.ui();
      this.scene.start("select");
    });
    makeButton(this, W / 2, 292, 360, 46, t("hub.career"), () => {
      AudioSystem.ui();
      this.scene.start("career");
    }, 0x7d5cff);
    makeButton(this, W / 2, 348, 360, 46, t("hub.shop"), () => {
      AudioSystem.ui();
      this.scene.start("shop");
    }, 0xc8ff3a);
    makeButton(this, W / 2, 404, 360, 46, t("hub.wiki"), () => {
      AudioSystem.ui();
      this.scene.start("wiki", { from: "hub" });
    }, 0xffb14a);
    makeButton(this, W / 2, 460, 360, 46, t("hub.settings"), () => {
      AudioSystem.ui();
      this.scene.start("settings", { from: "hub" });
    }, 0xffe08a);

    const back = this.add.text(W / 2, 530, t("hub.home"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#7a4a30"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start("menu"));

    AudioSystem.playMenu();
  }

  paintEther() {
    const st = SaveSystem.etherNow();
    this.etherText.setText(t("hub.ether", { n: st.n, max: ECONOMY.etherMax }));
    const wait = st.full ? t("hub.etherFull") : t("hub.etherWait", { t: formatEtherWait(st.nextMs) });
    this.etherHint.setText(wait + "  ·  " + t("hub.etherBot"));
  }

  update() {
    if (this.etherText) this.paintEther();
  }
}
