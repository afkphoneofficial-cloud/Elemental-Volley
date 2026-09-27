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
      fontFamily: UI_FONT, fontSize: "40px", fontStyle: "800", color: "#fff6ea"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 128, 380, 48, 0xffc07a, 0x141018);
    this.add.text(W / 2, 128,
      t("hub.stats", {
        name: charName(save.starterId),
        n: save.unlocked.length,
        tokens: c.tokens,
        pvp: c.pvp
      }),
      { fontFamily: UI_FONT, fontSize: "15px", fontStyle: "600", color: "#e8dcc8" }
    ).setOrigin(0.5).setDepth(6);

    makeButton(this, W / 2, 236, 380, 54, t("hub.play"), () => {
      AudioSystem.ui();
      this.scene.start("select");
    });
    makeButton(this, W / 2, 306, 380, 54, t("hub.shop"), () => {
      AudioSystem.ui();
      this.scene.start("shop");
    }, 0xc8ff3a);
    makeButton(this, W / 2, 376, 380, 54, t("hub.wiki"), () => {
      AudioSystem.ui();
      this.scene.start("wiki", { from: "hub" });
    }, 0xffb14a);
    makeButton(this, W / 2, 446, 380, 54, t("hub.settings"), () => {
      AudioSystem.ui();
      this.scene.start("settings", { from: "hub" });
    }, 0xffe08a);
    makeButton(this, W / 2, 516, 380, 54, t("hub.home"), () => this.scene.start("menu"), 0x7d5cff);

    AudioSystem.playMenu();
  }
}
