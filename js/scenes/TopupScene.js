import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { t } from "../i18n/I18n.js";
import { TOPUP_PACKS } from "../data/shopCatalog.js";
import { paintWalletBar } from "../ui/walletBar.js";
import { PASS } from "../data/monthPass.js";
import { TopupPay } from "../systems/TopupPay.js?v=local186";

export class TopupScene extends Phaser.Scene {
  constructor() { super("topup"); }

  init(data) {
    this.from = (data && data.from) || "shop";
    this.payNote = (data && data.note) || "";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    SaveSystem.grantTryPowder();
    drawGrid(this);
    const W = this.scale.width;
    paintWalletBar(this, "topup");
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.from === "hub" ? "hub" : this.from === "pass" ? "pass" : "shop");
    }, 0x7d5cff);
    makeButton(this, 268, 40, 156, 40, t("pass.short"), () => {
      AudioSystem.ui();
      this.scene.start("pass", { from: "topup" });
    }, 0xff8ab8);

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

    const passBox = this.add.graphics();
    passBox.fillStyle(0xfff6ea, 0.96);
    passBox.fillRoundedRect(W / 2 - 460, 214, 920, 72, 18);
    passBox.lineStyle(2, 0xff8ab8, 0.8);
    passBox.strokeRoundedRect(W / 2 - 460, 214, 920, 72, 18);
    this.add.text(W / 2 - 200, 250, t("pass.title") + "  ·  " + t("pass.buy", { n: PASS.thb }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#1a1008"
    }).setOrigin(0.5);
    makeButton(this, W / 2 + 280, 250, 200, 40, t("topup.pass"), () => {
      AudioSystem.ui();
      this.scene.start("pass", { from: "topup" });
    }, 0xff8ab8);
    this.add.zone(W / 2, 250, 920, 72).setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      AudioSystem.ui();
      this.scene.start("pass", { from: "topup" });
    });

    TOPUP_PACKS.forEach((pack, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = W / 2 - 310 + col * 310;
      const y = 398 + row * 148;
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
      const zone = this.add.zone(x, y, 280, 140).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.buyPack(pack));
    });
    if (this.payNote) {
      this.add.text(W / 2, 688, this.payNote, {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#146b32"
      }).setOrigin(0.5).setDepth(40);
    }
  }

  async buyPack(pack) {
    if (this.payLock) return;
    this.payLock = true;
    AudioSystem.ui();
    const W = this.scale.width;
    const note = this.add.text(W / 2, 690, t("topup.waitPay"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#0a6a88"
    }).setOrigin(0.5).setDepth(40);
    try {
      await TopupPay.buyPack(pack.id);
      this.scene.start("topup", { from: this.from, note: t("topup.paid", { n: pack.powder }) });
    } catch (err) {
      const msg = (err && err.message) || t("topup.fail");
      note.setColor("#c45a16");
      note.setText(msg);
      this.time.delayedCall(2800, () => { if (note && note.destroy) note.destroy(); });
    }
    this.payLock = false;
  }
}
