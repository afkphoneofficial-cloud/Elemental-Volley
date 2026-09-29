import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { RANK_TIERS, RANK_CAL_GAMES, RANK_STAR_MMR, medalFromMmr, isCalibrating, badgeKey, displayBadgeId } from "../data/ranks.js";
import { Leaderboard } from "../systems/Leaderboard.js";
import { paintRankTabs } from "../ui/sceneTabs.js";

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

    paintRankTabs(this, "rules");
    this.add.text(W / 2, 78, t("rank.title"), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 106, t("rank.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 148, 720, 96, 0x7d5cff, 0xfff6ea);
    const shown = displayBadgeId(rank);
    if (this.textures.exists(badgeKey(shown))) {
      this.add.image(W / 2 - 280, 148, badgeKey(shown)).setDisplaySize(84, 84).setDepth(8);
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
      const x = 86 + i * 148;
      const y = 258;
      const size = 52 + i * 8;
      if (i >= 4) {
        const glow = this.add.circle(x, y, size * 0.52, row.color, 0.16 + i * 0.03).setDepth(6);
        glow.setStrokeStyle(i >= 6 ? 3 : 0, 0xffe08a, 0.35);
      }
      if (this.textures.exists(badgeKey(row.id))) {
        this.add.image(x, y, badgeKey(row.id)).setDisplaySize(size, size).setDepth(8);
      }
      const on = !cal && medal.id === row.id;
      this.add.text(x, y + size * 0.52 + 10, t("rank.tier." + row.id), {
        fontFamily: UI_FONT, fontSize: on ? "14px" : "12px", fontStyle: on ? "900" : "700",
        color: on ? "#c45a16" : "#3a2418", align: "center", wordWrap: { width: 140 }
      }).setOrigin(0.5).setDepth(8);
    });

    const body = [
      t("rank.body1", { n: RANK_CAL_GAMES }),
      t("rank.body2", { star: RANK_STAR_MMR }),
      t("rank.body3"),
      t("rank.body4"),
      t("rank.body5")
    ].join("\n");
    this.add.text(W / 2, 448, body, {
      fontFamily: UI_FONT, fontSize: "15px", color: "#5a3828", align: "center", wordWrap: { width: 1000 }, lineSpacing: 8
    }).setOrigin(0.5, 0);

    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.from === "queue" ? "queue" : this.from);
    }, 0x7d5cff);
    AudioSystem.playMenu();
  }

  openBoard() {
    Leaderboard.show();
  }
}
