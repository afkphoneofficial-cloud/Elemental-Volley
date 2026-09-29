import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ROSTER_IDS } from "../data/roster.js";
import {
  STAT_IDS, GROWTH_MAX_LV, GROWTH_SPECIAL_LV,
  copyGrowth, growthEqual, trySpend, tryUnspend, sheetFromRow
} from "../data/growth.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { texHeroSelect } from "../data/seasonLooks.js";
import { paintFighterTabs } from "../ui/sceneTabs.js";

function setBtnLive(btn, on) {
  const a = on ? 1 : 0.38;
  btn.gfx.setAlpha(a);
  btn.text.setAlpha(on ? 1 : 0.55);
  btn.bg.setAlpha(on ? 1 : 0.55);
}

export class GrowthScene extends Phaser.Scene {
  constructor() { super("growth"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.charId = SaveSystem.data.showcaseId || SaveSystem.data.starterId || "ignis";
    this.draft = null;
    this.hintOn = false;
    this.hintPart = 0;
    this.hintBits = [];

    paintFighterTabs(this, "growth");
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    makeButton(this, W - 90, 36, 150, 40, t("growth.hintBtn"), () => this.toggleHint(), 0x3ad6ff);
    this.sub = this.add.text(W / 2, 78, t("growth.sub"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#7a4a30"
    }).setOrigin(0.5);

    ROSTER_IDS.forEach((id, i) => {
      const x = W / 2 - 240 + i * 160;
      makeButton(this, x, 124, 140, 40, charName(id), () => {
        this.pickChar(id);
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
    this.ptsText = this.add.text(720, 160, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#1a1008",
      wordWrap: { width: 640 }, align: "center"
    }).setOrigin(0.5);
    this.specialText = this.add.text(720, 186, "", {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7d5cff"
    }).setOrigin(0.5);
    this.draftText = this.add.text(720, 208, "", {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#9a3a18",
      wordWrap: { width: 640 }, align: "center"
    }).setOrigin(0.5);

    this.rows = STAT_IDS.map((stat, i) => {
      const y = 236 + i * 62;
      roundPanel(this, 720, y, 640, 56, 0xffb14a, 0xfff6ea);
      const name = this.add.text(418, y - 11, "", {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: "#1a1008",
        stroke: "#fff6ea", strokeThickness: 4
      }).setOrigin(0, 0.5).setDepth(8);
      const val = this.add.text(418, y + 13, "", {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418",
        stroke: "#fff6ea", strokeThickness: 3
      }).setOrigin(0, 0.5).setDepth(8);
      const minus = makeButton(this, 900, y, 56, 36, "−", () => {
        this.nudge(stat, -1);
      }, 0xff8ab8);
      const plus = makeButton(this, 980, y, 56, 36, "+", () => {
        this.nudge(stat, 1);
      }, 0x7d5cff);
      return { stat, name, val, plus, minus };
    });

    this.confirmBtn = makeButton(this, 560, 498, 250, 40, t("growth.confirm"), () => {
      this.commitDraft();
    }, 0x3ad6ff);
    this.cancelBtn = makeButton(this, 880, 498, 250, 40, t("growth.cancelDraft"), () => {
      this.discardDraft();
    }, 0xc8bdd8);
    this.confirmBtn.text.setFontSize(15);
    this.cancelBtn.text.setFontSize(15);

    this.respecStartBtn = makeButton(this, 720, 546, 580, 40, t("growth.respecStart"), () => {
      this.discardDraft(false);
      if (SaveSystem.respecStartGrowth(this.charId)) {
        AudioSystem.ui();
        this.refresh();
      }
    }, 0xff8ab8);
    this.respecLevelBtn = makeButton(this, 720, 594, 580, 40, t("growth.respecLevel"), () => {
      this.discardDraft(false);
      const res = SaveSystem.respecLevelGrowth(this.charId);
      if (res && res.ok) {
        AudioSystem.ui();
        this.refresh();
        return;
      }
      this.showBagHint(res && res.reason);
    }, 0x7d5cff);

    this.refresh();
    AudioSystem.playMenu();
  }

  savedRow() {
    return copyGrowth(SaveSystem.data.growth[this.charId]);
  }

  viewRow() {
    return this.draft || this.savedRow();
  }

  pickChar(id) {
    this.discardDraft(false);
    this.charId = id;
    this.refresh();
    AudioSystem.ui();
  }

  nudge(stat, dir) {
    if (!SaveSystem.isUnlocked(this.charId)) return;
    const saved = this.savedRow();
    const cur = this.viewRow();
    const next = dir > 0
      ? trySpend(this.charId, cur, stat)
      : tryUnspend(this.charId, cur, saved, stat);
    if (!next) return;
    this.draft = growthEqual(next, saved) ? null : next;
    AudioSystem.ui();
    this.refresh();
  }

  commitDraft() {
    if (!this.draft) return;
    if (SaveSystem.commitGrowth(this.charId, this.draft)) {
      this.draft = null;
      AudioSystem.ui();
      this.refresh();
    }
  }

  discardDraft(sound = true) {
    if (!this.draft) return;
    this.draft = null;
    if (sound) AudioSystem.ui();
    this.refresh();
  }

  refresh() {
    const saved = this.savedRow();
    const row = this.viewRow();
    const sheet = sheetFromRow(this.charId, row);
    const dirty = !!this.draft && !growthEqual(this.draft, saved);
    const key = texHeroSelect(this, this.charId);
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
    this.ptsText.setText(t("growth.unspent", {
      n: sheet.unspent,
      start: sheet.unspentStart,
      lv: sheet.unspentLevel
    }));
    this.specialText.setText(sheet.specialReady
      ? t("growth.specialOn")
      : t("growth.specialOff", { n: GROWTH_SPECIAL_LV }));
    this.draftText.setText(dirty ? t("growth.draftNote") : "");
    this.rows.forEach((item) => {
      item.name.setText(t("growth.stat." + item.stat));
      item.val.setText(t("growth.statLine", {
        spent: sheet.spent[item.stat],
        gift: item.stat === sheet.giftStat ? sheet.gift : 0,
        total: sheet.totals[item.stat],
        cap: sheet.caps[item.stat]
      }));
    });
    this.respecStartBtn.text.setFontSize(15).setText(t("growth.respecStart"));
    this.respecLevelBtn.text.setFontSize(15).setText(sheet.freeLevelRespec ? t("growth.respecLevel") : t("growth.useFruit"));
    this.confirmBtn.text.setText(t("growth.confirm"));
    this.cancelBtn.text.setText(t("growth.cancelDraft"));
    setBtnLive(this.confirmBtn, dirty);
    setBtnLive(this.cancelBtn, dirty);
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
    const n = this.hintPart + 1;
    const veil = this.add.rectangle(W / 2, this.scale.height / 2, W, this.scale.height, 0x3a2418, 0.45).setDepth(50).setInteractive();
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

  showBagHint(reason) {
    const key = reason === "none" || reason === "needFruit" ? "growth.needFruit" : "bag.err." + (reason || "no");
    const msg = this.add.text(this.scale.width / 2, 670, t(key), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c42a4a"
    }).setOrigin(0.5).setDepth(30);
    this.time.delayedCall(1800, () => { if (msg && msg.destroy) msg.destroy(); });
  }
}
