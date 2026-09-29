import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { TOPUP_PACKS } from "../data/shopCatalog.js";
import { paintWalletBar } from "../ui/walletBar.js";

export class TopupScene extends Phaser.Scene {
  constructor() { super("topup"); }

  init(data) {
    this.from = (data && data.from) || "shop";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintWalletBar(this, "topup");
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.from === "hub" ? "hub" : "shop");
    }, 0x7d5cff);

    this.add.text(W / 2, 40, t("topup.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 86, t("topup.sub"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#7a4a30",
      align: "center", wordWrap: { width: 920 }
    }).setOrigin(0.5);

    const box = this.add.graphics();
    box.fillStyle(0xfff6ea, 0.96);
    box.fillRoundedRect(W / 2 - 460, 118, 920, 88, 18);
    box.lineStyle(2, 0x3ad6ff, 0.7);
    box.strokeRoundedRect(W / 2 - 460, 118, 920, 88, 18);
    this.add.text(W / 2, 162, t("topup.rate"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#3a2418",
      align: "center", wordWrap: { width: 860 }
    }).setOrigin(0.5);

    TOPUP_PACKS.forEach((pack, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = W / 2 - 310 + col * 310;
      const y = 300 + row * 168;
      const g = this.add.graphics();
      g.fillStyle(0xfff6ea, 0.96);
      g.fillRoundedRect(x - 140, y - 70, 280, 140, 20);
      g.lineStyle(3, 0x7d5cff, 0.75);
      g.strokeRoundedRect(x - 140, y - 70, 280, 140, 20);
      if (this.textures.exists("item-powder")) {
        this.add.image(x - 88, y - 18, "item-powder").setDisplaySize(48, 48);
      }
      this.add.text(x + 24, y - 28, t("topup.powder", { n: pack.powder }), {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0, 0.5);
      this.add.text(x + 24, y + 4, pack.bonus ? t("topup.bonus", { n: pack.bonus }) : t("topup.noBonus"), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: pack.bonus ? "#1a7a48" : "#8a5a38"
      }).setOrigin(0, 0.5);
      this.add.text(x, y + 42, t("topup.thb", { n: pack.thb }), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0.5);
    });

    this.add.text(W / 2, 668, t("topup.foot"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#8a5a38",
      align: "center", wordWrap: { width: 1000 }
    }).setOrigin(0.5);
  }
}
