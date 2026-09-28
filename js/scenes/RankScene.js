import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { RANK_TIERS, RANK_CAL_GAMES, RANK_STAR_MMR, medalFromMmr, isCalibrating, badgeKey } from "../data/ranks.js";

export class RankScene extends Phaser.Scene {
  constructor() { super("rankinfo"); }

  init(data) {
    this.from = (data && data.from) || "hub";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const rank = SaveSystem.data.rank;
    const cal = isCalibrating(rank);
    const medal = medalFromMmr(rank.mmr);

    this.add.text(W / 2, 36, t("rank.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 68, t("rank.sub"), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#7a4a30"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 148, 720, 96, 0x7d5cff, 0xfff6ea);
    if (this.textures.exists(badgeKey(medal.id))) {
      this.add.image(W / 2 - 280, 148, badgeKey(medal.id)).setDisplaySize(72, 72).setDepth(8);
    }
    this.add.text(W / 2 - 230, 132, cal
      ? t("rank.calNow", { n: rank.games, max: RANK_CAL_GAMES })
      : t("rank.youAre", { name: t("rank.tier." + medal.id), star: medal.star || t("rank.noStar") }), {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(8);
    this.add.text(W / 2 - 230, 164, t("rank.mmrLine", { n: rank.mmr, w: rank.wins, l: rank.losses }), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8);

    RANK_TIERS.forEach((row, i) => {
      const x = 90 + i * 150;
      const y = 268;
      if (this.textures.exists(badgeKey(row.id))) {
        this.add.image(x, y, badgeKey(row.id)).setDisplaySize(56, 56);
      }
      const on = !cal && medal.id === row.id;
      this.add.text(x, y + 42, t("rank.tier." + row.id), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: on ? "900" : "700",
        color: on ? "#c45a16" : "#3a2418", align: "center", wordWrap: { width: 140 }
      }).setOrigin(0.5);
    });

    const body = [
      t("rank.body1", { n: RANK_CAL_GAMES }),
      t("rank.body2", { star: RANK_STAR_MMR }),
      t("rank.body3"),
      t("rank.body4"),
      t("rank.body5")
    ].join("\n");
    this.add.text(W / 2, 430, body, {
      fontFamily: UI_FONT, fontSize: "15px", color: "#5a3828", align: "center", wordWrap: { width: 1000 }, lineSpacing: 8
    }).setOrigin(0.5, 0);

    makeButton(this, 120, 36, 140, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.from === "queue" ? "queue" : this.from);
    }, 0x7d5cff);
    AudioSystem.playMenu();
  }
}
