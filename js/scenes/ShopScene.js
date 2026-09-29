import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { paintTabs } from "../ui/sceneTabs.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { ECONOMY } from "../data/economy.js";
import { CHEER_THEMES, CHEER_THEME_IDS, cheerThemeLabel } from "../data/cheers.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { itemIconKey } from "../data/items.js";
import { SHOP_TABS, SHOP_USE_GOODS, SHOP_TRADE_GOODS } from "../data/shopCatalog.js";
import { paintWalletBar } from "../ui/walletBar.js";
import { SELECT_PLATE } from "../fx/SelectHover.js";
import { openShopBuy, closeShopBuy } from "../ui/shopBuyPopup.js";

const CARD_W = 196;
const CARD_H = 236;
const CARD_GAP = 14;
const CARD_COLS = 5;

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

    this.add.text(W / 2, 136, t("shop.sub." + this.tab), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: "#9a6a48",
      align: "center", wordWrap: { width: 1100 }
    }).setOrigin(0.5);

    if (this.tab === "fighters") this.paintFighters();
    else if (this.tab === "cosmetics") this.paintCosmetics();
    else if (this.tab === "items") this.paintItems();
    else this.paintTrade();

    this.events.once("shutdown", () => closeShopBuy(this));

    this.add.text(W / 2, 688, t("shop.foot"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#8a5a38",
      wordWrap: { width: 1100 }, align: "center"
    }).setOrigin(0.5);
  }

  refresh() {
    this.scene.start("shop", { tab: this.tab });
  }

  slots(n) {
    const W = this.scale.width;
    const total = CARD_COLS * CARD_W + (CARD_COLS - 1) * CARD_GAP;
    const left = Math.max(40, (W - total) / 2);
    const top = 158;
    const out = [];
    for (let i = 0; i < n; i++) {
      const col = i % CARD_COLS;
      const row = (i / CARD_COLS) | 0;
      out.push({
        x: left + CARD_W / 2 + col * (CARD_W + CARD_GAP),
        y: top + CARD_H / 2 + row * (CARD_H + CARD_GAP)
      });
    }
    return out;
  }

  pic(key, x, y, size, alpha) {
    const k = this.textures.exists(key) ? key : "item-shard";
    return this.add.image(x, y, k).setDisplaySize(size, size).setAlpha(alpha == null ? 1 : alpha).setDepth(8);
  }

  paintCard(x, y, spec) {
    const w = CARD_W;
    const h = CARD_H;
    const idle = spec.stroke || 0xe8c8a8;
    const accent = spec.accent || 0x4aa6e8;
    const gfx = this.add.graphics().setDepth(5);
    const draw = (hot) => {
      gfx.clear();
      gfx.fillStyle(spec.dim ? 0xe4ddd8 : 0xfffaf4, 0.98);
      gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      gfx.lineStyle(hot ? 3 : 2, hot ? accent : idle, hot ? 1 : 0.88);
      gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      gfx.fillStyle(0xfff3e4, spec.dim ? 0.55 : 0.95);
      gfx.fillRoundedRect(x - 50, y - 38, 100, 100, 16);
    };
    draw(false);

    this.add.text(x, y - h / 2 + 18, spec.title, {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#6a4030",
      align: "center", wordWrap: { width: w - 18 }
    }).setOrigin(0.5).setDepth(8);

    const ix = x;
    const iy = y + 10;
    if (spec.icon) this.pic(spec.icon, ix, iy, spec.iconSize || 86, spec.dim ? 0.42 : 1);
    if (spec.paintIcon) spec.paintIcon(ix, iy);

    if (spec.hint) {
      this.add.text(x, y + 72, spec.hint, {
        fontFamily: UI_FONT, fontSize: "11px", fontStyle: "700", color: "#c49a7a",
        align: "center", wordWrap: { width: w - 18 }
      }).setOrigin(0.5).setDepth(8);
    }

    const py = y + h / 2 - 22;
    if (spec.priceIcon) {
      this.pic(spec.priceIcon, x - (spec.price != null ? 16 : 0), py, 22);
      if (spec.price != null) {
        this.add.text(x + 14, py, String(spec.price), {
          fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(0.5).setDepth(10);
      }
    } else if (spec.priceMark) {
      this.add.text(x, py, spec.priceMark, {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#2a7a38"
      }).setOrigin(0.5).setDepth(10);
    }

    if (spec.stamp) {
      this.add.text(x, iy, spec.stamp, {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "900", color: spec.stampColor || "#8a7088"
      }).setOrigin(0.5).setDepth(12).setAngle(-18).setAlpha(0.94);
    }

    const zone = this.add.zone(x, y, w, h).setDepth(14);
    if (spec.onClick) {
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => draw(true));
      zone.on("pointerout", () => draw(false));
      zone.on("pointerdown", spec.onClick);
    }
  }

  bag() {
    return SaveSystem.data.currencies || {};
  }

  paintCheerIcon(theme, x, y, depth) {
    const g = this.add.graphics().setDepth(depth == null ? 8 : depth);
    const bits = theme.bits || [theme.glow];
    bits.forEach((c, i) => {
      const a = (i / bits.length) * Math.PI * 2 - Math.PI / 2;
      g.fillStyle(c, 1);
      g.fillCircle(x + Math.cos(a) * 24, y + Math.sin(a) * 24, 9);
    });
    g.fillStyle(theme.glow, 1);
    g.fillCircle(x, y, 16);
    g.fillStyle(0xfff6ea, 0.9);
    g.fillCircle(x - 4, y - 5, 5);
    return g;
  }

  paintFighters() {
    const cells = this.slots(ROSTER_IDS.length);
    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const owned = SaveSystem.isUnlocked(id);
      const face = this.textures.exists("vis_select_" + id) ? "vis_select_" + id : "vis_" + id;
      this.paintCard(cells[i].x, cells[i].y, {
        title: I18n.charName(id),
        icon: face,
        iconSize: 90,
        hint: owned ? "" : t("shop.hintUnlock"),
        stroke: SELECT_PLATE[id] || data.colors.main,
        accent: SELECT_PLATE[id] || data.colors.main,
        dim: owned,
        stamp: owned ? t("shop.owned") : null,
        priceIcon: owned ? null : "item-shard",
        price: owned ? null : ECONOMY.unlockTokenCost,
        onClick: owned ? null : () => {
          openShopBuy(this, {
            title: I18n.charName(id),
            icon: face,
            kind: t("shop.kindFighter"),
            owned: owned ? 1 : 0,
            body: t("shop.buyUnlockBody"),
            priceIcon: "item-shard",
            unitPrice: ECONOMY.unlockTokenCost,
            have: this.bag().tokens | 0,
            stack: false,
            onConfirm: () => SaveSystem.unlockWithTokens(id, ECONOMY.unlockTokenCost),
            after: () => this.refresh()
          });
        }
      });
    });
  }

  paintCosmetics() {
    const cells = this.slots(CHEER_THEME_IDS.length);
    CHEER_THEME_IDS.forEach((id, i) => {
      const theme = CHEER_THEMES[id];
      const equipped = SaveSystem.equippedCheer() === id;
      const owned = SaveSystem.isCheerUnlocked(id);
      const locked = theme.comingSoon && !owned;
      let stamp = null;
      let priceIcon = null;
      let price = null;
      let priceMark = null;
      let onClick = null;
      if (locked) stamp = t("shop.soon");
      else if (equipped) {
        stamp = t("shop.using");
      } else if (owned) {
        priceMark = "▶";
        onClick = () => {
          SaveSystem.equipCheer(id);
          AudioSystem.ui();
          this.refresh();
        };
      } else {
        priceIcon = "item-powder";
        price = theme.price;
        onClick = () => {
          openShopBuy(this, {
            title: cheerThemeLabel(theme),
            kind: t("shop.kindCheer"),
            owned: 0,
            body: t("shop.buyCheerBody"),
            priceIcon: "item-powder",
            unitPrice: theme.price,
            have: this.bag().premium | 0,
            stack: false,
            paintIcon: (x, y, d) => this.paintCheerIcon(theme, x, y, d),
            onConfirm: () => SaveSystem.unlockCheer(id),
            after: () => this.refresh()
          });
        };
      }
      this.paintCard(cells[i].x, cells[i].y, {
        title: cheerThemeLabel(theme),
        hint: "",
        stroke: theme.stroke,
        accent: theme.glow,
        dim: locked,
        stamp,
        priceIcon,
        price,
        priceMark,
        onClick,
        paintIcon: (x, y) => this.paintCheerIcon(theme, x, y)
      });
    });
  }

  paintItems() {
    const cells = this.slots(SHOP_USE_GOODS.length);
    SHOP_USE_GOODS.forEach((good, i) => {
      this.paintCard(cells[i].x, cells[i].y, {
        title: t("item." + good.id + ".name"),
        icon: itemIconKey(good.id),
        hint: "",
        stroke: 0xffd24a,
        accent: 0xffb14a,
        priceIcon: "item-coin",
        price: good.price,
        onClick: () => {
          openShopBuy(this, {
            title: t("item." + good.id + ".name"),
            icon: itemIconKey(good.id),
            kind: t("shop.kindUse"),
            owned: SaveSystem.itemCount(good.id),
            body: t("item." + good.id + ".body"),
            priceIcon: "item-coin",
            unitPrice: good.price,
            have: this.bag().coins | 0,
            maxQty: 99,
            onConfirm: (qty) => SaveSystem.buyWithCoins(good.id, good.price, qty),
            after: () => this.refresh()
          });
        }
      });
    });
  }

  paintTrade() {
    const cells = this.slots(SHOP_TRADE_GOODS.length);
    const rate = ECONOMY.pvpPerToken | 5;
    SHOP_TRADE_GOODS.forEach((good, i) => {
      const shardCard = {
        title: t("item.shard.name"),
        icon: "item-shard",
        hint: "",
        kind: t("shop.kindTrade"),
        owned: this.bag().tokens | 0
      };
      if (good.action === "exchangeShard") {
        this.paintCard(cells[i].x, cells[i].y, {
          ...shardCard,
          stroke: 0xb8a0e8,
          accent: 0x7d5cff,
          priceIcon: "item-stone",
          price: rate,
          onClick: () => {
            openShopBuy(this, {
              title: shardCard.title,
              icon: "item-shard",
              kind: shardCard.kind,
              owned: shardCard.owned,
              body: "",
              priceIcon: "item-stone",
              unitPrice: rate,
              have: this.bag().pvp | 0,
              maxQty: 99,
              onConfirm: (qty) => ({ ok: SaveSystem.exchangePvpToTokens(qty) }),
              after: () => this.refresh()
            });
          }
        });
      } else {
        this.paintCard(cells[i].x, cells[i].y, {
          ...shardCard,
          stroke: 0x7ae8ff,
          accent: 0x3ad6ff,
          priceIcon: "item-powder",
          price: good.price,
          onClick: () => {
            openShopBuy(this, {
              title: shardCard.title,
              icon: "item-shard",
              kind: shardCard.kind,
              owned: shardCard.owned,
              body: "",
              priceIcon: "item-powder",
              unitPrice: good.price,
              have: this.bag().premium | 0,
              maxQty: 99,
              onConfirm: (qty) => ({ ok: SaveSystem.buyTokensWithPremium(good.shards * qty) }),
              after: () => this.refresh()
            });
          }
        });
      }
    });
  }
}
