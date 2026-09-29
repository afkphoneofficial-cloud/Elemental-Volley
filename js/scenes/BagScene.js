import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { paintFighterTabs } from "../ui/sceneTabs.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";

export class BagScene extends Phaser.Scene {
  constructor() { super("bag"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintFighterTabs(this, "bag");
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start("hub");
    }, 0x7d5cff);

    this.add.text(W / 2, 96, t("bag.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 132, t("bag.sub"), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#7a4a30", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 360, 640, 280, 0xffb14a, 0xfff6ea);
    this.add.text(W / 2, 330, t("bag.empty"), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418", align: "center", wordWrap: { width: 560 }
    }).setOrigin(0.5).setDepth(8);
    this.add.text(W / 2, 390, t("bag.emptySub"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#7a4a30", align: "center", wordWrap: { width: 520 }
    }).setOrigin(0.5).setDepth(8);
    AudioSystem.playMenu();
  }
}
