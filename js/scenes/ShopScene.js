import { drawGrid, makeButton, makeIconCircle, UI_FONT } from "../ui/Ui.js";
import { paintTabs } from "../ui/sceneTabs.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { ECONOMY } from "../data/economy.js";
import { CHEER_THEMES, CHEER_THEME_IDS, cheerThemeLabel, cheerThemeBlurb } from "../data/cheers.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { itemIconKey } from "../data/items.js";
import { SHOP_TABS, SHOP_USE_GOODS, SHOP_TRADE_GOODS } from "../data/shopCatalog.js";
import { paintWalletBar } from "../ui/walletBar.js";
import { SELECT_PLATE } from "../fx/SelectHover.js";

export class ShopScene extends Phaser.Scene {
  constructor() { super("shop"); }

  init(data) {
    this.tab = (data && data.tab) || "fighters";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintWalletBar(this, "shop");
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    this.add.text(280, 40, t("shop.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    paintTabs(this, 96, SHOP_TABS.map((row) => ({
      id: row.id,
      label: t("shop.tab." + row.id),
      color: row.color,
      go: () => this.scene.start("shop", { tab: row.id })
    })), this.tab);

    this.add.text(W / 2, 138, t("shop.sub." + this.tab), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#7a4a30",
      align: "center", wordWrap: { width: 1100 }
    }).setOrigin(0.5);

    if (this.tab === "fighters") this.paintFighters();
    else if (this.tab === "cosmetics") this.paintCosmetics();
    else if (this.tab === "items") this.paintItems();
    else this.paintTrade();

    this.add.text(W / 2, 688, t("shop.foot"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#8a5a38",
      wordWrap: { width: 1100 }, align: "center"
    }).setOrigin(0.5);
  }

  refresh() {
    this.scene.start("shop", { tab: this.tab });
  }

  plate(x, y, r, stroke) {
    this.add.circle(x, y, r + 10, 0xffffff, 0.32).setDepth(5);
    this.add.circle(x, y, r, 0xfff6ea, 1).setStrokeStyle(5, stroke, 0.92).setDepth(5);
  }

  pic(key, x, y, size, alpha) {
    const k = this.textures.exists(key) ? key : "item-shard";
    return this.add.image(x, y, k).setDisplaySize(size, size).setAlpha(alpha == null ? 1 : alpha).setDepth(8);
  }

  priceDisc(x, y, r, color, icon, n, onClick) {
    makeIconCircle(this, x, y, r, color, onClick, 12);
    this.pic(icon, x - (n != null ? 14 : 0), y, 22);
    if (n != null) {
      this.add.text(x + 14, y, String(n), {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0.5).setDepth(14);
    }
  }

  paintFighters() {
    const r = 112;
    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const x = 190 + i * 300;
      const y = 392;
      const owned = SaveSystem.isUnlocked(id);
      const stroke = SELECT_PLATE[id] || data.colors.main;
      this.plate(x, y, r, stroke);
      const face = this.textures.exists("vis_select_" + id) ? "vis_select_" + id : "vis_" + id;
      this.add.image(x, y - 40, face).setDisplaySize(124, 124).setAlpha(owned ? 1 : 0.42).setDepth(8);
      this.add.text(x, y + r + 22, I18n.charName(id), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0.5);
      const discY = y + 70;
      if (owned) {
        makeIconCircle(this, x, discY, 28, 0x2a7a38, null, 12);
        this.add.text(x, discY, "✓", {
          fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#2a7a38"
        }).setOrigin(0.5).setDepth(14);
      } else {
        this.priceDisc(x, discY, 32, 0xff6a22, "item-shard", ECONOMY.unlockTokenCost, () => {
          const res = SaveSystem.unlockWithTokens(id, ECONOMY.unlockTokenCost);
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        });
      }
    });
  }

  paintCosmetics() {
    const r = 128;
    CHEER_THEME_IDS.forEach((id, i) => {
      const theme = CHEER_THEMES[id];
      const x = 250 + i * 390;
      const y = 400;
      this.plate(x, y, r, theme.stroke);
      this.add.text(x, y - 78, cheerThemeLabel(theme), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0.5).setDepth(8);
      this.add.text(x, y - 48, cheerThemeBlurb(theme), {
        fontFamily: UI_FONT, fontSize: "13px", color: "#7a4a30", align: "center", wordWrap: { width: 200 }
      }).setOrigin(0.5).setDepth(8);
      const equipped = SaveSystem.equippedCheer() === id;
      const owned = SaveSystem.isCheerUnlocked(id);
      const discY = y + 70;
      if (theme.comingSoon && !owned) {
        makeIconCircle(this, x, discY, 28, 0xc8bdd8, null, 12);
        this.add.text(x, discY, "🔒", {
          fontFamily: UI_FONT, fontSize: "18px", color: "#7a4a30"
        }).setOrigin(0.5).setDepth(14);
      } else if (equipped) {
        makeIconCircle(this, x, discY, 28, 0x2a7a38, null, 12);
        this.add.text(x, discY, "✓", {
          fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#2a7a38"
        }).setOrigin(0.5).setDepth(14);
      } else if (owned) {
        makeIconCircle(this, x, discY, 32, 0x7d5cff, () => {
          SaveSystem.equipCheer(id);
          AudioSystem.ui();
          this.refresh();
        }, 12);
        this.add.text(x, discY, "▶", {
          fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(0.5).setDepth(14);
      } else {
        this.priceDisc(x, discY, 34, 0x3ad6ff, "item-powder", theme.price, () => {
          const res = SaveSystem.unlockCheer(id);
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        });
      }
    });
  }

  paintItems() {
    const W = this.scale.width;
    const r = 124;
    SHOP_USE_GOODS.forEach((good, i) => {
      const x = W / 2 - 220 + i * 440;
      const y = 400;
      this.plate(x, y, r, 0x3ad6ff);
      const ik = itemIconKey(good.id);
      this.pic(ik, x, y - 28, 88);
      this.add.text(x, y + 28, t("item." + good.id + ".name"), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0.5).setDepth(8);
      this.priceDisc(x, y + 72, 34, 0xffb14a, "item-coin", good.price, () => {
        const res = SaveSystem.buyWithCoins(good.id, good.price);
        res.ok ? AudioSystem.ui() : AudioSystem.error();
        this.refresh();
      });
    });
  }

  paintTrade() {
    const W = this.scale.width;
    const r = 124;
    const rate = ECONOMY.pvpPerToken | 5;
    SHOP_TRADE_GOODS.forEach((good, i) => {
      const x = W / 2 - 220 + i * 440;
      const y = 400;
      this.plate(x, y, r, 0xc8ff3a);
      if (good.action === "exchangeShard") {
        this.pic("item-stone", x - 36, y - 28, 52);
        this.pic("item-shard", x + 36, y - 28, 52);
        this.add.text(x, y + 18, rate + " : 1", {
          fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(0.5).setDepth(8);
        this.priceDisc(x, y + 72, 34, 0xc8ff3a, "item-stone", rate, () => {
          const res = SaveSystem.useItem("stone");
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        });
      } else {
        this.pic("item-powder", x - 36, y - 28, 52);
        this.pic("item-shard", x + 36, y - 28, 52);
        this.add.text(x, y + 18, "100 : 100", {
          fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(0.5).setDepth(8);
        this.priceDisc(x, y + 72, 34, 0x3ad6ff, "item-powder", good.price, () => {
          SaveSystem.buyTokensWithPremium(good.shards) ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        });
      }
    });
  }
}
