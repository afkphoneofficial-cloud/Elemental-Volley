import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ROSTER_IDS } from "../data/roster.js";
import { STAT_IDS, GROWTH_MAX_LV, GROWTH_SPECIAL_LV } from "../data/growth.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { texSelect } from "../data/skins.js";

export class GrowthScene extends Phaser.Scene {
  constructor() { super("growth"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.charId = SaveSystem.data.showcaseId || SaveSystem.data.starterId || "ignis";
    this.hintOn = false;
    this.hintPart = 0;
    this.hintBits = [];

    this.add.text(W / 2, 32, t("growth.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.sub = this.add.text(W / 2, 62, t("growth.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);

    makeButton(this, 120, 36, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    makeButton(this, W - 120, 36, 160, 40, t("growth.hintBtn"), () => this.toggleHint(), 0x3ad6ff);

    ROSTER_IDS.forEach((id, i) => {
      const x = W / 2 - 240 + i * 160;
      makeButton(this, x, 108, 140, 40, charName(id), () => {
        this.charId = id;
        this.refresh();
        AudioSystem.ui();
      }, SaveSystem.isUnlocked(id) ? 0xffb14a : 0xc8bdd8);
    });

    this.hero = this.add.image(170, 280, "vis_select_ignis").setDisplaySize(168, 168);
    this.lvText = this.add.text(170, 390, "", {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.xpText = this.add.text(170, 418, "", {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);
    this.barBg = this.add.rectangle(170, 444, 200, 12, 0x3a2418, 0.18).setOrigin(0.5);
    this.barFill = this.add.rectangle(70, 444, 2, 12, 0xffb14a, 1).setOrigin(0, 0.5);
    this.giftText = this.add.text(170, 478, "", {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: "#c45a16",
      align: "center", wordWrap: { width: 240 }
    }).setOrigin(0.5);
    this.ptsText = this.add.text(720, 168, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.specialText = this.add.text(720, 196, "", {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7d5cff"
    }).setOrigin(0.5);

    this.rows = STAT_IDS.map((stat, i) => {
      const y = 250 + i * 72;
      roundPanel(this, 720, y, 640, 64, 0xffb14a, 0xfff6ea);
      const name = this.add.text(430, y - 10, "", {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0, 0.5);
      const val = this.add.text(430, y + 14, "", {
        fontFamily: UI_FONT, fontSize: "13px", color: "#7a4a30"
      }).setOrigin(0, 0.5);
      const plus = makeButton(this, 980, y, 72, 40, "+", () => {
        if (SaveSystem.spendGrowth(this.charId, stat)) {
          AudioSystem.ui();
          this.refresh();
        }
      }, 0x7d5cff);
      return { stat, name, val, plus };
    });

    this.respecBtn = makeButton(this, 720, 560, 280, 44, t("growth.respec"), () => {
      if (SaveSystem.respecGrowth(this.charId)) {
        AudioSystem.ui();
        this.refresh();
      }
    }, 0xff8ab8);

    this.refresh();
    AudioSystem.playMenu();
  }

  refresh() {
    const sheet = SaveSystem.growthOf(this.charId);
    const key = texSelect(this, this.charId, SaveSystem.skinOf(this.charId));
    if (this.textures.exists(key)) this.hero.setTexture(key);
    this.lvText.setText(t("growth.level", { n: sheet.level, max: GROWTH_MAX_LV }));
    this.xpText.setText(sheet.need
      ? t("growth.xp", { n: sheet.into, max: sheet.need })
      : t("growth.xpMax"));
    const ratio = sheet.need ? sheet.into / sheet.need : 1;
    this.barFill.width = Math.max(2, 200 * ratio);
    this.giftText.setText(t("growth.gift", {
      n: sheet.gift,
      stat: t("growth.stat." + sheet.giftStat)
    }));
    this.ptsText.setText(t("growth.unspent", { n: sheet.unspent }));
    this.specialText.setText(sheet.specialReady
      ? t("growth.specialOn")
      : t("growth.specialOff", { n: GROWTH_SPECIAL_LV }));
    this.rows.forEach((row) => {
      row.name.setText(t("growth.stat." + row.stat));
      row.val.setText(t("growth.statLine", {
        spent: sheet.spent[row.stat],
        gift: row.stat === sheet.giftStat ? sheet.gift : 0,
        total: sheet.totals[row.stat],
        cap: sheet.caps[row.stat]
      }));
    });
    this.respecBtn.text.setText(t("growth.respec"));
  }

  toggleHint() {
    if (this.hintOn) {
      this.closeHint();
      return;
    }
    this.hintOn = true;
    this.hintPart = 0;
    this.paintHint();
  }

  closeHint() {
    this.hintOn = false;
    this.hintBits.forEach((o) => { try { o.destroy(); } catch (e) {} });
    this.hintBits = [];
  }

  paintHint() {
    this.closeHint();
    this.hintOn = true;
    const W = this.scale.width;
    const H = this.scale.height;
    const n = this.hintPart + 1;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x3a2418, 0.45).setDepth(50).setInteractive();
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 380, 70, 760, 560, 28);
    panel.lineStyle(4, 0x7d5cff, 0.9);
    panel.strokeRoundedRect(W / 2 - 380, 70, 760, 560, 28);
    const title = this.add.text(W / 2, 110, t("growth.hint" + n + "Title"), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(52);
    const body = this.add.text(W / 2, 340, t("growth.hint" + n + "Body"), {
      fontFamily: UI_FONT, fontSize: "17px", fontStyle: "700", color: "#5a3828",
      align: "center", wordWrap: { width: 680 }, lineSpacing: 8
    }).setOrigin(0.5).setDepth(52);
    const page = this.add.text(W / 2, 540, t("growth.hintPage", { n, max: 5 }), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(52);
    const prev = makeButton(this, W / 2 - 160, 590, 140, 42, t("growth.hintPrev"), () => {
      this.hintPart = (this.hintPart + 4) % 5;
      this.paintHint();
    }, 0xffb14a, 53);
    const next = makeButton(this, W / 2 + 160, 590, 140, 42, t("growth.hintNext"), () => {
      this.hintPart = (this.hintPart + 1) % 5;
      this.paintHint();
    }, 0xffb14a, 53);
    const close = makeButton(this, W / 2, 590, 120, 42, t("growth.hintClose"), () => this.closeHint(), 0x7d5cff, 53);
    this.hintBits = [veil, panel, title, body, page, prev.gfx, prev.text, prev.bg, next.gfx, next.text, next.bg, close.gfx, close.text, close.bg];
  }
}
