import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";

export class HubScene extends Phaser.Scene {
  constructor() { super("hub"); }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    const save = SaveSystem.data;
    const c = save.currencies;

    this.add.text(W / 2, 64, t("hub.title"), {
      fontFamily: UI_FONT, fontSize: "40px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 128, 420, 48, 0xff8a3a, 0xfff6ea);
    this.add.text(W / 2, 128,
      t("hub.stats", {
        name: charName(save.starterId),
        n: save.unlocked.length,
        tokens: c.tokens,
        pvp: c.pvp
      }),
      { fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#3a2418" }
    ).setOrigin(0.5).setDepth(6);

    makeButton(this, W / 2, 230, 400, 64, t("hub.play"), () => {
      AudioSystem.ui();
      this.scene.start("select");
    });
    makeButton(this, W / 2, 314, 360, 50, t("hub.shop"), () => {
      AudioSystem.ui();
      this.scene.start("shop");
    }, 0xc8ff3a);
    makeButton(this, W / 2, 380, 360, 50, t("hub.wiki"), () => {
      AudioSystem.ui();
      this.scene.start("wiki", { from: "hub" });
    }, 0xffb14a);
    makeButton(this, W / 2, 446, 360, 50, t("hub.settings"), () => {
      AudioSystem.ui();
      this.scene.start("settings", { from: "hub" });
    }, 0xffe08a);

    const back = this.add.text(W / 2, 540, t("hub.home"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#7a4a30"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start("menu"));

    AudioSystem.playMenu();
  }
}
