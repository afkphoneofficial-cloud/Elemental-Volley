import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { formatMatchClock } from "../gameplay/MatchStats.js";

export class CareerScene extends Phaser.Scene {
  constructor() { super("career"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const c = SaveSystem.data.career;
    const log = SaveSystem.data.matchLog || [];

    this.add.text(W / 2, 42, t("career.title"), {
      fontFamily: UI_FONT, fontSize: "34px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 78, t("career.sub", { name: AuthSystem.displayName() }), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 148, 1100, 88, 0xff8a3a, 0xfff6ea);
    this.add.text(W / 2, 148,
      t("career.totals", {
        m: c.matches,
        w: c.wins,
        l: c.losses,
        aces: c.aces,
        ults: c.ults,
        time: formatMatchClock(c.playMs),
        streak: c.bestStreak,
        rally: c.longestRally
      }),
      { fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#3a2418", align: "center", wordWrap: { width: 1040 } }
    ).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, 214, t("career.logHead", { n: Math.min(log.length, ECONOMY.matchLogMax) }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);

    if (!log.length) {
      this.add.text(W / 2, 360, t("career.empty"), {
        fontFamily: UI_FONT, fontSize: "18px", color: "#7a4a30"
      }).setOrigin(0.5);
    } else {
      log.slice(0, 8).forEach((row, i) => {
        const y = 252 + i * 42;
        const line = t("career.row", {
          result: row.win ? t("career.win") : t("career.lose"),
          you: charName(row.you),
          foe: charName(row.foe),
          a: row.youScore,
          b: row.foeScore,
          mode: row.mode === "pvp" ? t("career.pvp") : t("career.bot")
        });
        this.add.text(W / 2, y, line, {
          fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: row.win ? "#2a7a38" : "#7a4a30"
        }).setOrigin(0.5);
      });
      if (log.length > 8) {
        this.add.text(W / 2, 252 + 8 * 42, t("career.more", { n: log.length - 8 }), {
          fontFamily: UI_FONT, fontSize: "14px", color: "#8a5a38"
        }).setOrigin(0.5);
      }
    }

    makeButton(this, 120, 42, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    AudioSystem.playMenu();
  }
}
