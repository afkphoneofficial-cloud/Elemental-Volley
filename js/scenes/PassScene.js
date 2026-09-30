import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { paintWalletBar } from "../ui/walletBar.js";
import { shopLookVis, shopLookLabel } from "../data/costumeShop.js";
import { paintGiftIcons } from "../ui/giftIcons.js?v=local171";
import { PASS, monthId, passLookOf, msUntilMonthEnd, formatRemain, vialDaysLabel, passInstantGift } from "../data/monthPass.js?v=local171";

export class PassScene extends Phaser.Scene {
  constructor() { super("pass"); }

  init(data) {
    this.from = (data && data.from) || "shop";
    this.note = (data && data.note) || "";
    this.lock = false;
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintWalletBar(this, "pass");
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.from === "topup" ? "topup" : this.from === "hub" ? "hub" : "shop", { from: this.from === "topup" ? "shop" : this.from, tab: "cosmetics" });
    }, 0x7d5cff);
    this.add.text(W / 2, 40, t("pass.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8);

    const id = monthId();
    const look = passLookOf(id);
    const bought = SaveSystem.hasMonthPass(id);
    const row = SaveSystem.passRow(id);

    this.add.text(W / 2, 82, t("pass.month", { id }) + "   ·   " + t("pass.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#4a2810",
      align: "center", wordWrap: { width: 880 }
    }).setOrigin(0.5).setDepth(8);

    roundPanel(this, 340, 390, 520, 500, 0xff8ab8, 0xfff6ea);
    roundPanel(this, 940, 390, 520, 500, 0x7d5cff, 0xfff6ea);

    this.add.text(340, 168, t("pass.look"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(8);
    const icon = look && this.textures.exists(shopLookVis(look.id, "select"))
      ? shopLookVis(look.id, "select")
      : (look ? "vis_select_" + look.charId : "item-powder");
    this.add.image(340, 330, icon).setDisplaySize(220, 220).setDepth(8);
    this.add.text(340, 470, look ? shopLookLabel(look, I18n.lang) : "—", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(8);
    this.add.text(340, 504, look ? t("pass.forChar", { name: charName(look.charId) }) : "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#4a2810"
    }).setOrigin(0.5).setDepth(8);
    if (look && SaveSystem.ownedShopLook(look.id) && !bought) {
      this.add.text(340, 538, t("pass.ownedLook", { n: PASS.ownedLookPowder }), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#146b32",
        align: "center", wordWrap: { width: 460 }
      }).setOrigin(0.5).setDepth(8);
    } else if (bought && row.lookAsPowder) {
      this.add.text(340, 538, t("pass.ownedLook", { n: PASS.ownedLookPowder }), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#146b32",
        align: "center", wordWrap: { width: 460 }
      }).setOrigin(0.5).setDepth(8);
    }

    this.add.text(940, 168, t("pass.instant"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(8);
    paintGiftIcons(this, 940, 222, passInstantGift(), { size: 48, gap: 64, depth: 8, fontSize: "16px" });
    this.add.text(940, 292, t("pass.daily"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(8);
    paintGiftIcons(this, 940, 348, { powder: PASS.dailyPowder, stones: PASS.dailyStone, vial: PASS.vialN }, { size: 42, gap: 78, depth: 8, fontSize: "15px" });
    this.add.text(940, 408, t("pass.dailyVial", { days: vialDaysLabel() }), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#4a2810",
      align: "center", wordWrap: { width: 440 }
    }).setOrigin(0.5).setDepth(8);

    this.leftTx = this.add.text(940, 438, t("pass.left", { t: formatRemain(msUntilMonthEnd()) }), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(8);

    if (!bought) {
      makeButton(this, 940, 500, 280, 48, t("pass.buy", { n: PASS.thb }), () => {
        if (this.lock) return;
        AudioSystem.ui();
        this.openBuy();
      }, 0xff6a22);
    } else {
      this.add.text(940, 470, t("pass.bought"), {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#146b32"
      }).setOrigin(0.5).setDepth(8);
      if (SaveSystem.passClaimedToday()) {
        makeButton(this, 940, 518, 280, 44, t("pass.claimed"), () => {}, 0xe8dcc8);
      } else {
        makeButton(this, 940, 518, 280, 44, t("pass.claim"), () => {
          if (this.lock) return;
          AudioSystem.ui();
          const res = SaveSystem.claimPassDay();
          this.scene.start("pass", {
            from: this.from,
            note: res.ok
              ? (res.vial ? t("pass.claimVial") : t("pass.claimOk"))
              : t("pass.claimed")
          });
        }, 0x3ad6ff);
      }
    }

    this.add.text(W / 2, 668, this.note || t("pass.mock"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#4a2810",
      align: "center", wordWrap: { width: 1100 }
    }).setOrigin(0.5).setDepth(8);
    this.add.text(W / 2, 696, t("pass.footer"), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#4a2810",
      align: "center", wordWrap: { width: 1100 }
    }).setOrigin(0.5).setDepth(8);
  }

  update() {
    if (!this.leftTx || !this.leftTx.active) return;
    this.leftTx.setText(t("pass.left", { t: formatRemain(msUntilMonthEnd()) }));
  }

  openBuy() {
    if (this.lock) return;
    this.lock = true;
    const W = this.scale.width;
    const H = this.scale.height;
    const bits = [];
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.55).setDepth(50).setInteractive();
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 280, 200, 560, 300, 22);
    panel.lineStyle(3, 0xff6a22, 0.85);
    panel.strokeRoundedRect(W / 2 - 280, 200, 560, 300, 22);
    const title = this.add.text(W / 2, 250, t("pass.buy", { n: PASS.thb }), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(52);
    const body = this.add.text(W / 2, 310, t("pass.mock"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#4a2810",
      align: "center", wordWrap: { width: 480 }
    }).setOrigin(0.5).setDepth(52);
    bits.push(dim, panel, title, body);
    const wipe = () => {
      bits.forEach((o) => { if (o && o.destroy) o.destroy(); });
      this.lock = false;
    };
    const ok = makeButton(this, W / 2 - 110, 430, 200, 44, t("pass.mockOk"), () => {
      AudioSystem.ui();
      const res = SaveSystem.buyMonthPass();
      wipe();
      this.scene.start("pass", {
        from: this.from,
        note: res.dup ? t("pass.dup", { n: res.powder }) : t("pass.grant", { id: monthId() })
      });
    }, 0xff6a22, 54);
    const no = makeButton(this, W / 2 + 110, 430, 200, 44, t("pass.mockNo"), () => {
      AudioSystem.ui();
      wipe();
    }, 0xe8dcc8, 54);
    bits.push(ok.bg, ok.text, ok.gfx, no.bg, no.text, no.gfx);
  }
}
