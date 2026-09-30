import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ROSTER_IDS } from "../data/roster.js";
import {
  STAT_IDS, STAT_CAP, GIFT_LOCK, GROWTH_MAX_LV,
  copyGrowth, growthEqual, trySpend, tryUnspend, sheetFromRow
} from "../data/growth.js?v=local206";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { texHeroSelect } from "../data/seasonLooks.js";

function bindHold(scene, zone, fn) {
  let wait = null;
  let tick = null;
  const stop = () => {
    if (wait) wait.remove(false);
    if (tick) tick.remove(false);
    wait = null;
    tick = null;
  };
  zone.on("pointerdown", () => {
    stop();
    wait = scene.time.delayedCall(280, () => {
      tick = scene.time.addEvent({
        delay: 60,
        loop: true,
        callback: () => fn(true)
      });
    });
  });
  zone.on("pointerup", stop);
  zone.on("pointerout", stop);
  scene.events.once("shutdown", stop);
}

function paintStatBar(g, x, y, w, h, spent, lock, giftN) {
  const r = 9;
  const spentW = w * Math.max(0, Math.min(1, (spent | 0) / STAT_CAP));
  const lockW = w * Math.max(0, Math.min(1, (lock | 0) / STAT_CAP));
  const giftW = w * Math.max(0, Math.min(1, (giftN | 0) / STAT_CAP));
  g.clear();
  g.fillStyle(0x3a2418, 0.14);
  g.fillRoundedRect(x, y - h / 2, w, h, r);
  if (spentW > 0.5) {
    g.fillStyle(0xffb14a, 1);
    g.fillRoundedRect(x, y - h / 2, spentW, h, r);
  }
  if (lockW > 0.5) {
    g.fillStyle(0xff8ab8, 0.38);
    g.fillRoundedRect(x + w - lockW, y - h / 2, lockW, h, r);
  }
  if (giftW > 0.5) {
    g.fillStyle(0xff8ab8, 1);
    g.fillRoundedRect(x + w - giftW, y - h / 2, giftW, h, r);
  }
  g.lineStyle(2, 0xff8ab8, 0.55);
  g.strokeRoundedRect(x, y - h / 2, w, h, r);
}

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

    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    makeButton(this, W - 90, 36, 150, 40, t("growth.hintBtn"), () => this.toggleHint(), 0x3ad6ff);
    this.add.text(W / 2, 36, t("growth.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    this.ptsText = this.add.text(720, 186, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c45a16"
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
    this.draftText = this.add.text(720, 518, "", {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#9a3a18",
      wordWrap: { width: 640 }, align: "center"
    }).setOrigin(0.5);

    this.rows = STAT_IDS.map((stat, i) => {
      const y = 236 + i * 62;
      roundPanel(this, 720, y, 640, 56, 0xffb14a, 0xfff6ea);
      const name = this.add.text(418, y, "", {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#1a1008",
        stroke: "#fff6ea", strokeThickness: 4
      }).setOrigin(0, 0.5).setDepth(8);
      const barG = this.add.graphics().setDepth(8);
      const barLabel = this.add.text(700, y, "", {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "900", color: "#1a1008",
        stroke: "#fff6ea", strokeThickness: 4
      }).setOrigin(0.5).setDepth(9);
      const minus = makeButton(this, 912, y, 56, 36, "−", () => {
        this.nudge(stat, -1);
      }, 0xff8ab8);
      const plus = makeButton(this, 990, y, 56, 36, "+", () => {
        this.nudge(stat, 1);
      }, 0x7d5cff);
      bindHold(this, minus.bg, () => this.nudge(stat, -1, true));
      bindHold(this, plus.bg, () => this.nudge(stat, 1, true));
      return { stat, name, barG, barLabel, plus, minus };
    });

    this.giftAsk = makeButton(this, 418, 486, 36, 32, "?", () => {
      this.hintPart = 2;
      this.paintHint();
    }, 0xff8ab8);
    this.giftAsk.text.setFontSize(16);
    this.giftHint = this.add.text(446, 486, "", {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#9a3a58",
      wordWrap: { width: 560 }
    }).setOrigin(0, 0.5);

    this.confirmBtn = makeButton(this, 560, 560, 250, 40, t("growth.confirm"), () => {
      this.commitDraft();
    }, 0x3ad6ff);
    this.cancelBtn = makeButton(this, 880, 560, 250, 40, t("growth.cancelDraft"), () => {
      this.discardDraft();
    }, 0xc8bdd8);
    this.confirmBtn.text.setFontSize(15);
    this.cancelBtn.text.setFontSize(15);

    this.respecStartBtn = makeButton(this, 720, 610, 580, 40, t("growth.respecStart"), () => {
      this.discardDraft(false);
      if (SaveSystem.respecStartGrowth(this.charId)) {
        AudioSystem.ui();
        this.refresh();
      }
    }, 0xff8ab8);
    this.respecLevelBtn = makeButton(this, 720, 658, 580, 40, t("growth.respecLevel"), () => {
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

  nudge(stat, dir, quiet) {
    if (!SaveSystem.isUnlocked(this.charId)) return;
    const saved = this.savedRow();
    const cur = this.viewRow();
    const next = dir > 0
      ? trySpend(this.charId, cur, stat)
      : tryUnspend(this.charId, cur, saved, stat);
    if (!next) return;
    this.draft = growthEqual(next, saved) ? null : next;
    if (!quiet) AudioSystem.ui();
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
    this.ptsText.setText(t("growth.leftPts", { n: sheet.unspent }));
    this.draftText.setText(dirty ? t("growth.draftNote") : "");
    this.rows.forEach((item) => {
      const lock = item.stat === sheet.giftStat ? GIFT_LOCK : 0;
      const spent = sheet.spent[item.stat] | 0;
      const total = sheet.totals[item.stat] | 0;
      item.name.setText(t("growth.stat." + item.stat));
      paintStatBar(item.barG, 530, item.barLabel.y, 340, 20, spent, lock, lock ? (sheet.gift | 0) : 0);
      item.barLabel.setText(t("growth.statFill", { n: total, max: STAT_CAP }));
    });
    this.giftHint.setText(t("growth.giftBarHint"));
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
    const msg = this.add.text(this.scale.width / 2, 702, t(key), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c42a4a"
    }).setOrigin(0.5).setDepth(30);
    this.time.delayedCall(1800, () => { if (msg && msg.destroy) msg.destroy(); });
  }
}
