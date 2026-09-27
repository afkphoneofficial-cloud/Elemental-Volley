import { drawGrid, makeButton } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";

export class ResultScene extends Phaser.Scene {
  constructor() { super("result"); }

  init(data) {
    this.payload = data || { winner: 1, score: { p1: 0, p2: 0 } };
  }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    const win = this.payload.winner === 1;
    let pvp = win ? ECONOMY.pvpWin : ECONOMY.pvpLoss;
    SaveSystem.addPvp(pvp);
    let bonus = 0;
    if (win) bonus = SaveSystem.takeFirstWinBonus(ECONOMY.firstWinBonus);

    this.add.text(W / 2, 140, win ? "VICTORY" : "DEFEAT", {
      fontFamily: "Segoe UI, Kanit, sans-serif",
      fontSize: "64px",
      fontStyle: "800",
      color: win ? "#c8ff3a" : "#ff6a6a"
    }).setOrigin(0.5);

    this.add.text(W / 2, 230, `${this.payload.score.p1}  -  ${this.payload.score.p2}`, {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "36px", color: "#fff4e8"
    }).setOrigin(0.5);

    this.add.text(W / 2, 310, t("result.pvp", {
      pvp,
      bonus: bonus ? t("result.firstWin", { n: bonus }) : ""
    }), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "18px", color: "#c8bdd8"
    }).setOrigin(0.5);

    this.add.text(W / 2, 350, t("result.total", {
      pvp: SaveSystem.data.currencies.pvp,
      tokens: SaveSystem.data.currencies.tokens
    }), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "16px", color: "#8e82a8"
    }).setOrigin(0.5);

    AudioSystem.score();
    AudioSystem.playMenu();
    makeButton(this, W / 2, 450, 280, 52, t("result.again"), () => this.scene.start("select"));
    makeButton(this, W / 2, 520, 280, 52, t("result.shop"), () => this.scene.start("shop"), 0xc8ff3a);
    makeButton(this, W / 2, 590, 280, 52, t("result.hub"), () => this.scene.start("hub"), 0x7d5cff);
  }
}
