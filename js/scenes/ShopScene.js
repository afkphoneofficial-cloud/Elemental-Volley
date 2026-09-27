import { drawGrid, makeButton } from "../ui/Ui.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { ECONOMY } from "../data/economy.js";
import { CHEER_THEMES, CHEER_THEME_IDS, cheerThemeLabel, cheerThemeBlurb } from "../data/cheers.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";

export class ShopScene extends Phaser.Scene {
  constructor() { super("shop"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const c = SaveSystem.data.currencies;
    const refresh = () => this.scene.restart();

    this.add.text(W / 2, 50, t("shop.title"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "34px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    this.add.text(W / 2, 96,
      t("shop.wallet", { tokens: c.tokens, pvp: c.pvp, premium: c.premium, cost: ECONOMY.unlockTokenCost }),
      { fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "16px", color: "#7a4a30" }
    ).setOrigin(0.5);

    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const x = 190 + i * 300;
      const y = 240;
      const owned = SaveSystem.isUnlocked(id);
      this.add.rectangle(x, y, 250, 250, 0x161022, 0.94).setStrokeStyle(2, data.colors.main, 0.7);
      this.add.image(x, y - 40, "vis_" + id).setDisplaySize(110, 110).setAlpha(owned ? 1 : 0.4).setDepth(6);
      this.add.text(x, y + 70, I18n.charName(id), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "20px", fontStyle: "800", color: "#fff4e8"
      }).setOrigin(0.5);
      if (owned) {
        this.add.text(x, y + 98, t("shop.owned"), {
          fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: "#c8ff3a"
        }).setOrigin(0.5);
      } else {
        makeButton(this, x, y + 108, 190, 40, t("shop.unlock"), () => {
          const res = SaveSystem.unlockWithTokens(id, ECONOMY.unlockTokenCost);
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          refresh();
        });
      }
    });

    this.add.text(W / 2, 400, t("shop.cheerHead"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "18px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);

    CHEER_THEME_IDS.forEach((id, i) => {
      const theme = CHEER_THEMES[id];
      const x = 250 + i * 390;
      const y = 490;
      this.add.rectangle(x, y, 360, 130, 0x161022, 0.94).setStrokeStyle(2, theme.stroke, 0.8);
      this.add.text(x, y - 42, cheerThemeLabel(theme), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "20px", fontStyle: "800", color: "#fff4e8"
      }).setOrigin(0.5);
      this.add.text(x, y - 14, cheerThemeBlurb(theme), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "13px", color: "#c8bdd8"
      }).setOrigin(0.5);
      const equipped = SaveSystem.equippedCheer() === id;
      const owned = SaveSystem.isCheerUnlocked(id);
      if (theme.comingSoon && !owned) {
        this.add.text(x, y + 28, t("shop.soon"), {
          fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: "#8e82a8"
        }).setOrigin(0.5);
      } else if (equipped) {
        this.add.text(x, y + 28, t("shop.using"), {
          fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: "#c8ff3a"
        }).setOrigin(0.5);
      } else if (owned) {
        makeButton(this, x, y + 32, 160, 36, t("shop.wear"), () => {
          SaveSystem.equipCheer(id);
          AudioSystem.ui();
          refresh();
        }, 0x7d5cff);
      } else {
        makeButton(this, x, y + 32, 220, 36, t("shop.buyPrem", { price: theme.price }), () => {
          const res = SaveSystem.unlockCheer(id, theme.price);
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          refresh();
        }, 0xffd24a);
      }
    });

    makeButton(this, 320, 620, 300, 44, t("shop.exchange"), () => {
      const n = Math.min(100, SaveSystem.data.currencies.pvp);
      n > 0 && SaveSystem.exchangePvpToTokens(n) ? AudioSystem.ui() : AudioSystem.error();
      refresh();
    }, 0xc8ff3a);

    makeButton(this, 640, 620, 300, 44, t("shop.topup"), () => {
      SaveSystem.addPremium(ECONOMY.premiumTopup);
      AudioSystem.ui();
      refresh();
    }, 0xffd24a);

    makeButton(this, 960, 620, 300, 44, t("shop.buyTokens"), () => {
      SaveSystem.buyTokensWithPremium(ECONOMY.tokenPack) ? AudioSystem.ui() : AudioSystem.error();
      refresh();
    });

    makeButton(this, 120, 48, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);

    this.add.text(W / 2, 688, t("shop.foot"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "13px", color: "#8e82a8",
      wordWrap: { width: 1100 }, align: "center"
    }).setOrigin(0.5);
  }
}
