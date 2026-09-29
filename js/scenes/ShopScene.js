import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
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

  paintFighters() {
    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const x = 190 + i * 300;
      const y = 360;
      const owned = SaveSystem.isUnlocked(id);
      this.add.rectangle(x, y, 250, 280, 0x161022, 0.94).setStrokeStyle(2, data.colors.main, 0.7);
      const face = this.textures.exists("vis_select_" + id) ? "vis_select_" + id : "vis_" + id;
      this.add.image(x, y - 48, face).setDisplaySize(120, 120).setAlpha(owned ? 1 : 0.4).setDepth(6);
      this.add.text(x, y + 62, I18n.charName(id), {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#fff4e8"
      }).setOrigin(0.5);
      if (owned) {
        this.add.text(x, y + 98, t("shop.owned"), {
          fontFamily: UI_FONT, fontSize: "14px", color: "#c8ff3a"
        }).setOrigin(0.5);
      } else {
        makeButton(this, x, y + 108, 200, 40, t("shop.unlock"), () => {
          const res = SaveSystem.unlockWithTokens(id, ECONOMY.unlockTokenCost);
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        });
      }
    });
  }

  paintCosmetics() {
    CHEER_THEME_IDS.forEach((id, i) => {
      const theme = CHEER_THEMES[id];
      const x = 250 + i * 390;
      const y = 380;
      this.add.rectangle(x, y, 360, 280, 0x161022, 0.94).setStrokeStyle(2, theme.stroke, 0.8);
      this.add.text(x, y - 100, cheerThemeLabel(theme), {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#fff4e8"
      }).setOrigin(0.5);
      this.add.text(x, y - 58, cheerThemeBlurb(theme), {
        fontFamily: UI_FONT, fontSize: "14px", color: "#c8bdd8", align: "center", wordWrap: { width: 320 }
      }).setOrigin(0.5);
      const equipped = SaveSystem.equippedCheer() === id;
      const owned = SaveSystem.isCheerUnlocked(id);
      if (theme.comingSoon && !owned) {
        this.add.text(x, y + 50, t("shop.soon"), {
          fontFamily: UI_FONT, fontSize: "16px", color: "#8e82a8"
        }).setOrigin(0.5);
      } else if (equipped) {
        this.add.text(x, y + 50, t("shop.using"), {
          fontFamily: UI_FONT, fontSize: "16px", color: "#c8ff3a"
        }).setOrigin(0.5);
      } else if (owned) {
        makeButton(this, x, y + 58, 180, 40, t("shop.wear"), () => {
          SaveSystem.equipCheer(id);
          AudioSystem.ui();
          this.refresh();
        }, 0x7d5cff);
      } else {
        makeButton(this, x, y + 58, 240, 40, t("shop.buyPowder", { price: theme.price }), () => {
          const res = SaveSystem.unlockCheer(id);
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        }, 0x3ad6ff);
      }
    });
  }

  paintItems() {
    const W = this.scale.width;
    SHOP_USE_GOODS.forEach((good, i) => {
      const x = W / 2 - 220 + i * 440;
      const y = 380;
      this.add.rectangle(x, y, 400, 260, 0x161022, 0.94).setStrokeStyle(2, 0x3ad6ff, 0.75);
      const ik = itemIconKey(good.id);
      if (this.textures.exists(ik)) this.add.image(x, y - 70, ik).setDisplaySize(72, 72);
      this.add.text(x, y + 8, t("item." + good.id + ".name"), {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#fff4e8"
      }).setOrigin(0.5);
      this.add.text(x, y + 44, t("shop.priceCoins", { n: good.price }), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#ffe08a"
      }).setOrigin(0.5);
      makeButton(this, x, y + 92, 220, 44, t("shop.buy"), () => {
        const res = SaveSystem.buyWithCoins(good.id, good.price);
        res.ok ? AudioSystem.ui() : AudioSystem.error();
        this.refresh();
      }, 0xffb14a);
    });
  }

  paintTrade() {
    const W = this.scale.width;
    SHOP_TRADE_GOODS.forEach((good, i) => {
      const x = W / 2 - 220 + i * 440;
      const y = 380;
      this.add.rectangle(x, y, 400, 260, 0x161022, 0.94).setStrokeStyle(2, 0xc8ff3a, 0.75);
      if (good.action === "exchangeShard") {
        if (this.textures.exists("item-stone")) this.add.image(x - 36, y - 70, "item-stone").setDisplaySize(56, 56);
        if (this.textures.exists("item-shard")) this.add.image(x + 36, y - 70, "item-shard").setDisplaySize(56, 56);
        this.add.text(x, y + 8, t("shop.exchange"), {
          fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#fff4e8",
          align: "center", wordWrap: { width: 340 }
        }).setOrigin(0.5);
        makeButton(this, x, y + 92, 220, 44, t("shop.tradeStone"), () => {
          const res = SaveSystem.useItem("stone");
          res.ok ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        }, 0xc8ff3a);
      } else {
        if (this.textures.exists("item-powder")) this.add.image(x - 36, y - 70, "item-powder").setDisplaySize(56, 56);
        if (this.textures.exists("item-shard")) this.add.image(x + 36, y - 70, "item-shard").setDisplaySize(56, 56);
        this.add.text(x, y + 8, t("shop.buyTokens"), {
          fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#fff4e8",
          align: "center", wordWrap: { width: 340 }
        }).setOrigin(0.5);
        makeButton(this, x, y + 92, 240, 44, t("shop.buyPowder", { price: good.price }), () => {
          SaveSystem.buyTokensWithPremium(good.shards) ? AudioSystem.ui() : AudioSystem.error();
          this.refresh();
        }, 0x3ad6ff);
      }
    });
  }
}
