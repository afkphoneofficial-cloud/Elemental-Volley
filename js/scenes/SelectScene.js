import { drawGrid, makeButton } from "../ui/Ui.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";

export class SelectScene extends Phaser.Scene {
  constructor() { super("select"); }

  create() {
    this.input.setTopOnly(false);
    drawGrid(this);
    const W = this.scale.width;
    this.pick = SaveSystem.data.starterId;
    this.diff = "normal";

    this.add.text(W / 2, 48, t("select.title"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "28px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const x = 190 + i * 300;
      const y = 280;
      const unlocked = SaveSystem.isUnlocked(id);
      const card = this.add.rectangle(x, y, 250, 300, 0x161022, 0.94)
        .setStrokeStyle(2, unlocked ? data.colors.main : 0x443850, 0.8)
        .setDepth(5);
      this.add.image(x, y - 40, "vis_" + id)
        .setDisplaySize(120, 120)
        .setAlpha(unlocked ? 1 : 0.28)
        .setDepth(6);
      this.add.text(x, y + 70, I18n.charName(id), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "22px", fontStyle: "800", color: unlocked ? "#3a2418" : "#8a7a90"
      }).setOrigin(0.5);
      this.add.text(x, y + 102, unlocked ? t("select.ready") : t("select.locked"), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: unlocked ? "#c8ff3a" : "#ff8a6a"
      }).setOrigin(0.5);
      if (unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => {
          this.pick = id;
          this.refreshPick();
          AudioSystem.ui();
        });
      }
    });

    this.pickText = this.add.text(W / 2, 470, "", {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(20);
    this.refreshPick();

    [
      ["easy", "select.botEasy"],
      ["normal", "select.botNormal"],
      ["hard", "select.botHard"]
    ].forEach(([d, key], i) => {
      makeButton(this, 420 + i * 220, 530, 180, 46, t(key), () => {
        this.diff = d;
        this.refreshPick();
        AudioSystem.ui();
      }, d === "hard" ? 0xff5a1f : 0x7d5cff);
    });

    makeButton(this, W / 2, 620, 280, 52, t("select.start"), () => {
      if (!SaveSystem.isUnlocked(this.pick)) return;
      Session.playerId = this.pick;
      const lockedPool = ROSTER_IDS.filter((id) => id !== this.pick);
      Session.botId = Phaser.Utils.Array.GetRandom(lockedPool);
      Session.difficulty = this.diff;
      Session.youSide = Math.random() < 0.5 ? 1 : 2;
      AudioSystem.ui();
      this.scene.start("luck");
    });

    makeButton(this, 120, 48, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
  }

  refreshPick() {
    this.pickText.setText(t("select.pick", {
      name: I18n.charName(this.pick),
      diff: t("select.diff" + this.diff[0].toUpperCase() + this.diff.slice(1))
    }));
  }
}
