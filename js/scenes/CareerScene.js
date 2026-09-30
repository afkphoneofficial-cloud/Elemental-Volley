import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { FREE_AVATARS, avatarKey, avatarLabel } from "../data/avatars.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { formatMatchClock } from "../gameplay/MatchStats.js";
import { medalFromMmr, isCalibrating, badgeKey, RANK_CAL_GAMES, displayBadgeId } from "../data/ranks.js";

const PAD = 72;
const GAP = 24;
const INNER = 1280 - PAD * 2;
const COL_W = (INNER - GAP) / 2;
const LEFT_X = PAD + COL_W / 2;
const RIGHT_X = LEFT_X + COL_W + GAP;
const HEAD_TOP = 80;
const HEAD_H = 146;
const HEAD_Y = HEAD_TOP + HEAD_H / 2;
const COL_TOP = HEAD_TOP + HEAD_H + GAP;
const COL_BOT = 720 - PAD;
const COL_H = COL_BOT - COL_TOP;
const COL_Y = COL_TOP + COL_H / 2;
const TAB_Y = COL_TOP + 32;
const MASK_TOP = COL_TOP + 62;
const MASK_H = COL_BOT - 20 - MASK_TOP;

function weekLabel(weekId) {
  const p = String(weekId || "").split("-");
  if (p.length < 3) return weekId || "—";
  return p[2] + "/" + p[1] + "/" + p[0];
}

function seasonRows(board) {
  const map = {};
  (SaveSystem.data.matchLog || []).forEach((m) => {
    if (m.mode !== board || !m.week) return;
    if (!map[m.week]) map[m.week] = { week: m.week, games: 0, wins: 0, place: 0 };
    map[m.week].games += 1;
    if (m.win) map[m.week].wins += 1;
  });
  (SaveSystem.data.seasonBadges || []).forEach((b) => {
    if (b.board !== board || !b.week) return;
    if (!map[b.week]) map[b.week] = { week: b.week, games: 0, wins: 0, place: 0 };
    if (b.place) map[b.week].place = b.place | 0;
  });
  const snap = (SaveSystem.data.seasonSnap || {})[board];
  if (snap && snap.week) {
    if (!map[snap.week]) map[snap.week] = { week: snap.week, games: snap.games | 0, wins: 0, place: snap.place | 0 };
    else {
      if (snap.place) map[snap.week].place = snap.place | 0;
      if ((snap.games | 0) > map[snap.week].games) map[snap.week].games = snap.games | 0;
    }
  }
  return Object.keys(map).sort().reverse().map((k) => map[k]);
}

function payStamp(at) {
  const n = Number(at);
  const d = new Date(n);
  if (!n || isNaN(d.getTime())) return "—";
  const p = (v) => (v < 10 ? "0" + v : "" + v);
  return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + "  " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function payLine(row) {
  const powder = (row.powder | 0) + (row.bonus | 0);
  return t("career.payRow", { date: payStamp(row.at), powder, thb: row.thb | 0 });
}

function payKind(row) {
  if (!row || row.kind === "try") return t("career.payTry");
  return t("career.payPack", { thb: row.thb | 0 });
}

const PAY_PREVIEW = 3;
const PAY_PAGE = 7;

function pairTabs(scene, cx, y, items, active) {
  const tw = 168;
  const gap = 10;
  const bits = [];
  items.forEach((it, i) => {
    const on = it.id === active;
    const x = cx - (tw + gap) / 2 + i * (tw + gap);
    const btn = makeButton(scene, x, y, tw, 34, it.label, () => {
      if (on) return;
      AudioSystem.ui();
      it.go();
    }, on ? it.color : 0xe8dcc8);
    bits.push(btn.bg, btn.text, btn.gfx);
  });
  return bits;
}

export class CareerScene extends Phaser.Scene {
  constructor() { super("career"); }

  init(data) {
    this.leftTab = (data && data.leftTab) || "sum";
    this.rightTab = (data && data.rightTab) || "pvp";
    if (this.leftTab !== "games") this.leftTab = "sum";
    if (this.rightTab !== "special") this.rightTab = "pvp";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.pickerBits = [];
    this.cols = [];

    makeButton(this, PAD + 70, 38, 132, 36, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    this.add.text(W / 2, 40, t("career.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    const sess = AuthSystem.session() || {};
    const mail = sess.email || "";
    const pid = sess.id ? String(sess.id).slice(0, 8) : "—";
    const avId = SaveSystem.data.avatarId;
    const key = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    const left = LEFT_X - COL_W / 2;
    const avX = left + 56;
    const infoX = avX + 68;
    const btnW = 148;
    const btnX = LEFT_X + COL_W / 2 - 18 - btnW / 2;
    const infoW = btnX - btnW / 2 - infoX - 10;

    roundPanel(this, LEFT_X, HEAD_Y, COL_W, HEAD_H, 0xff8a3a, 0xfff6ea);
    this.avImg = this.add.image(avX, HEAD_Y, key).setDisplaySize(76, 76).setDepth(8);
    this.add.circle(avX, HEAD_Y, 40, 0x000000, 0).setStrokeStyle(3, 0xc45a16, 0.85).setDepth(9);
    this.add.text(infoX, HEAD_Y - 42, AuthSystem.displayName(), {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(8);
    this.add.text(infoX, HEAD_Y - 18, mail || "—", {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#7a4a30",
      wordWrap: { width: Math.max(120, infoW) }
    }).setOrigin(0, 0.5).setDepth(8);
    this.add.text(infoX, HEAD_Y + 4, t("career.idLine", { id: pid }), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#8a5a38"
    }).setOrigin(0, 0.5).setDepth(8);
    this.avName = this.add.text(infoX, HEAD_Y + 24, avatarLabel(avId, I18n.lang), {
      fontFamily: UI_FONT, fontSize: "12px", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8);
    const rk = SaveSystem.data.rank;
    const medal = medalFromMmr(rk.mmr);
    const rankLab = isCalibrating(rk)
      ? t("rank.calShort", { n: rk.games, max: RANK_CAL_GAMES })
      : t("rank.chip", { name: t("rank.tier." + medal.id), star: medal.star || "" });
    const shown = displayBadgeId(rk);
    if (this.textures.exists(badgeKey(shown))) {
      this.add.image(infoX + 10, HEAD_Y + 46, badgeKey(shown)).setDisplaySize(18, 18).setDepth(8);
      this.add.text(infoX + 24, HEAD_Y + 46, rankLab, {
        fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0, 0.5).setDepth(8);
    } else {
      this.add.text(infoX, HEAD_Y + 46, rankLab, {
        fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0, 0.5).setDepth(8);
    }
    makeButton(this, btnX, HEAD_Y - 28, btnW, 32, t("career.change"), () => {
      AudioSystem.ui();
      this.openPicker();
    }, 0x7d5cff);
    makeButton(this, btnX, HEAD_Y + 10, btnW, 32, t("career.rename"), () => {
      AudioSystem.ui();
      this.scene.start("shop", { tab: "items" });
    }, 0xff8ab8);
    this.add.text(btnX, HEAD_Y + 48, t("career.renameShop", { name: t("item.namestone.name") }), {
      fontFamily: UI_FONT, fontSize: "10px", fontStyle: "700", color: "#8a5a38",
      align: "center", wordWrap: { width: btnW }
    }).setOrigin(0.5).setDepth(8);

    this.paintPayPreview();

    roundPanel(this, LEFT_X, COL_Y, COL_W, COL_H, 0xffb14a, 0xfff6ea);
    roundPanel(this, RIGHT_X, COL_Y, COL_W, COL_H, 0x3ad6ff, 0xfff6ea);
    this.tabBits = [];
    this.paintLists();
    this.bindCols();
    AudioSystem.playMenu();
  }

  paintLists() {
    this.wipeCols();
    this.tabBits = []
      .concat(pairTabs(this, LEFT_X, TAB_Y, [
        { id: "sum", label: t("career.tabSum"), color: 0xffb14a, go: () => { this.leftTab = "sum"; this.paintLists(); } },
        { id: "games", label: t("career.tabGames"), color: 0xff8ab8, go: () => { this.leftTab = "games"; this.paintLists(); } }
      ], this.leftTab))
      .concat(pairTabs(this, RIGHT_X, TAB_Y, [
        { id: "pvp", label: t("career.pvpBoard"), color: 0x7d5cff, go: () => { this.rightTab = "pvp"; this.paintLists(); } },
        { id: "special", label: t("career.elemBoard"), color: 0x3ad6ff, go: () => { this.rightTab = "special"; this.paintLists(); } }
      ], this.rightTab));
    this.mountLeft();
    this.mountRight();
  }

  mountLeft() {
    const bits = [];
    const log = SaveSystem.data.matchLog || [];
    if (this.leftTab === "sum") {
      const c = SaveSystem.data.career || {};
      const matches = c.matches | 0;
      const wins = c.wins | 0;
      const rate = matches ? Math.round((wins / matches) * 100) + "%" : "—";
      const cells = [
        [t("career.sumMatch"), String(matches)],
        [t("career.sumWin"), String(wins)],
        [t("career.sumLose"), String(c.losses | 0)],
        [t("career.sumRate"), rate],
        [t("career.sumAce"), String(c.aces | 0)],
        [t("career.sumUlt"), String(c.ults | 0)],
        [t("career.sumTime"), formatMatchClock(c.playMs)],
        [t("career.sumStreak"), String(c.bestStreak | 0)],
        [t("career.sumRally"), String(c.longestRally | 0)]
      ];
      const colGap = 176;
      const rowGap = 86;
      cells.forEach((cell, i) => {
        const col = i % 3;
        const row = (i / 3) | 0;
        const x = LEFT_X + (col - 1) * colGap;
        const y = MASK_TOP + 48 + row * rowGap;
        this.sumCell(bits, x, y, cell[0], cell[1]);
      });
      this.mountCol(LEFT_X, COL_W, bits, 48 + 3 * rowGap);
      return;
    }
    if (!log.length) {
      bits.push(this.add.text(LEFT_X, MASK_TOP + 90, t("career.empty"), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#3a2418", align: "center", wordWrap: { width: COL_W - 48 }
      }).setOrigin(0.5).setDepth(8));
      this.mountCol(LEFT_X, COL_W, bits, 140);
      return;
    }
    log.forEach((row, i) => {
      const y = MASK_TOP + 22 + i * 40;
      const line = t("career.row", {
        result: row.win ? t("career.win") : t("career.lose"),
        you: charName(row.you),
        foe: row.foeName || charName(row.foe),
        a: row.youScore,
        b: row.foeScore,
        mode: row.mode === "pvp" ? t("career.pvp") : row.mode === "exhibit" ? t("career.exhibit") : row.mode === "special" ? t("career.special") : t("career.bot")
      });
      bits.push(this.add.text(LEFT_X, y, line, {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: row.win ? "#156b2a" : "#5a2018",
        wordWrap: { width: COL_W - 48 }, align: "center"
      }).setOrigin(0.5).setDepth(8));
    });
    this.mountCol(LEFT_X, COL_W, bits, 22 + log.length * 40 + 12);
  }

  sumCell(bits, x, y, label, value) {
    bits.push(this.add.text(x, y - 14, label, {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#4a2810"
    }).setOrigin(0.5).setDepth(8).setResolution(2));
    bits.push(this.add.text(x, y + 12, value, {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(8).setResolution(2));
  }

  mountRight() {
    const bits = [];
    const rows = seasonRows(this.rightTab);
    if (!rows.length) {
      bits.push(this.add.text(RIGHT_X, MASK_TOP + 90, t("career.seasonEmpty"), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#3a2418", align: "center", wordWrap: { width: COL_W - 48 }
      }).setOrigin(0.5).setDepth(8));
      this.mountCol(RIGHT_X, COL_W, bits, 140);
      return;
    }
    rows.forEach((row, i) => {
      const y = MASK_TOP + 24 + i * 44;
      const line = row.place
        ? t("career.seasonRow", { week: weekLabel(row.week), games: row.games, place: row.place, wins: row.wins })
        : t("career.seasonRowNo", { week: weekLabel(row.week), games: row.games, wins: row.wins });
      bits.push(this.add.text(RIGHT_X, y, line, {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#2a1810",
        wordWrap: { width: COL_W - 48 }, align: "center"
      }).setOrigin(0.5).setDepth(8));
    });
    this.mountCol(RIGHT_X, COL_W, bits, 24 + rows.length * 44 + 12);
  }

  wipeCols() {
    (this.tabBits || []).forEach((o) => { if (o && o.active && o.destroy) o.destroy(); });
    this.tabBits = [];
    (this.listBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.listBits = [];
    this.cols = [];
  }

  keepList(obj) {
    if (!this.listBits) this.listBits = [];
    this.listBits.push(obj);
    return obj;
  }

  mountCol(x, w, bits, contentH) {
    bits.forEach((o) => {
      if (o && typeof o.setResolution === "function") o.setResolution(2);
      if (o) o._baseY = o.y;
      this.keepList(o);
    });
    this.cols.push({
      x, w, top: MASK_TOP, viewH: MASK_H, bits,
      scroll: 0, max: Math.max(0, contentH - MASK_H)
    });
    this.applyCol(this.cols[this.cols.length - 1]);
  }

  colAt(x, y) {
    return (this.cols || []).find((col) => (
      y >= col.top && y <= col.top + col.viewH &&
      x >= col.x - col.w / 2 && x <= col.x + col.w / 2
    )) || null;
  }

  applyCol(col) {
    if (!col) return;
    const top = col.top;
    const bot = col.top + col.viewH;
    (col.bits || []).forEach((o) => {
      if (!o || !o.setY) return;
      o.y = (o._baseY || 0) - (col.scroll || 0);
      if (o.setVisible) o.setVisible(o.y > top - 18 && o.y < bot + 18);
    });
  }

  nudgeCol(col, dy) {
    if (!col) return;
    col.scroll = Phaser.Math.Clamp((col.scroll || 0) + dy, 0, col.max || 0);
    this.applyCol(col);
  }

  bindCols() {
    if (this._colsBound) return;
    this._colsBound = true;
    this.input.on("wheel", (p, _g, _dx, dy) => {
      if (this.pickerOn || this.ledgerOn) return;
      this.nudgeCol(this.colAt(p.x, p.y), dy * 0.45);
    });
    this.input.on("pointerdown", (p) => {
      if (this.pickerOn || this.ledgerOn) return;
      const col = this.colAt(p.x, p.y);
      if (!col) return;
      this._drag = { y: p.y, s: col.scroll, col };
    });
    this.input.on("pointerup", () => { this._drag = null; });
    this.input.on("pointermove", (p) => {
      if (!this._drag || !p.isDown || this.pickerOn || this.ledgerOn) return;
      this._drag.col.scroll = Phaser.Math.Clamp(this._drag.s + (this._drag.y - p.y), 0, this._drag.col.max || 0);
      this.applyCol(this._drag.col);
    });
  }

  paintPayPreview() {
    (this.payBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.payBits = [];
    const keep = (o) => { this.payBits.push(o); return o; };
    roundPanel(this, RIGHT_X, HEAD_Y, COL_W, HEAD_H, 0x7d5cff, 0xfff6ea);
    keep(this.add.text(RIGHT_X, HEAD_Y - 52, t("career.payHead"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8));
    const log = SaveSystem.data.topupLog || [];
    const preview = log.slice(0, PAY_PREVIEW);
    if (!preview.length) {
      keep(this.add.text(RIGHT_X, HEAD_Y - 6, t("career.payEmpty"), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#3a2418",
        align: "center", wordWrap: { width: COL_W - 48 }
      }).setOrigin(0.5).setDepth(8));
    } else {
      preview.forEach((row, i) => {
        keep(this.add.text(RIGHT_X, HEAD_Y - 24 + i * 22, payLine(row), {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#2a1810",
          wordWrap: { width: COL_W - 40 }, align: "center"
        }).setOrigin(0.5).setDepth(8));
      });
    }
    const all = makeButton(this, RIGHT_X, HEAD_Y + 50, 220, 32, t("career.payAll"), () => {
      AudioSystem.ui();
      this.openLedger();
    }, 0x7d5cff);
    this.payBits.push(all.bg, all.text, all.gfx);
  }

  openLedger() {
    if (this.ledgerOn) return;
    if (this.pickerOn) this.closePicker();
    this.ledgerOn = true;
    this.ledgerPage = 0;
    this.ledgerBits = [];
    const W = this.scale.width;
    const H = this.scale.height;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.55).setDepth(50).setInteractive();
    dim.on("pointerdown", () => {
      AudioSystem.ui();
      this.closeLedger();
    });
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 360, 70, 720, 560, 24);
    panel.lineStyle(3, 0x7d5cff, 0.8);
    panel.strokeRoundedRect(W / 2 - 360, 70, 720, 560, 24);
    const swallow = this.add.rectangle(W / 2, 350, 720, 560, 0x000000, 0).setDepth(51).setInteractive();
    this.ledgerBits.push(dim, panel, swallow);
    const title = this.add.text(W / 2, 98, t("career.payTitle"), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(52);
    this.ledgerBits.push(title);
    this.ledgerRows = [];
    this.paintLedgerPage();
    const close = makeButton(this, W / 2, 590, 180, 40, t("career.close"), () => {
      AudioSystem.ui();
      this.closeLedger();
    }, 0xff6a22, 54);
    this.ledgerBits.push(close.bg, close.text, close.gfx);
  }

  paintLedgerPage() {
    (this.ledgerRows || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.ledgerRows = [];
    const keep = (o) => { this.ledgerRows.push(o); return o; };
    const W = this.scale.width;
    const log = SaveSystem.data.topupLog || [];
    const pages = Math.max(1, Math.ceil(log.length / PAY_PAGE));
    this.ledgerPage = Phaser.Math.Clamp(this.ledgerPage | 0, 0, pages - 1);
    keep(this.add.text(W / 2, 128, t("career.payPage", { n: this.ledgerPage + 1, m: pages }), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(52));
    const slice = log.slice(this.ledgerPage * PAY_PAGE, this.ledgerPage * PAY_PAGE + PAY_PAGE);
    if (!slice.length) {
      keep(this.add.text(W / 2, 300, t("career.payNone"), {
        fontFamily: UI_FONT, fontSize: "16px", color: "#8a5a38", align: "center", wordWrap: { width: 620 }
      }).setOrigin(0.5).setDepth(52));
    } else {
      slice.forEach((row, i) => {
        const y = 162 + i * 44;
        keep(this.add.text(W / 2 - 310, y, payStamp(row.at), {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#4a2810"
        }).setOrigin(0, 0.5).setDepth(52));
        keep(this.add.text(W / 2 + 20, y, payKind(row), {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#3a2418"
        }).setOrigin(0.5).setDepth(52));
        const extra = row.bonus ? "  " + t("career.payBonus", { n: row.bonus | 0 }) : "";
        keep(this.add.text(W / 2 + 310, y, "+" + ((row.powder | 0) + (row.bonus | 0)) + "  ·  ฿" + (row.thb | 0) + extra, {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#146b32"
        }).setOrigin(1, 0.5).setDepth(52));
      });
    }
    const prev = makeButton(this, W / 2 - 150, 540, 140, 36, t("career.payPrev"), () => {
      if (this.ledgerPage <= 0) return;
      AudioSystem.ui();
      this.ledgerPage -= 1;
      this.paintLedgerPage();
    }, this.ledgerPage <= 0 ? 0xe8dcc8 : 0x7d5cff, 54);
    const next = makeButton(this, W / 2 + 150, 540, 140, 36, t("career.payNext"), () => {
      if (this.ledgerPage >= pages - 1) return;
      AudioSystem.ui();
      this.ledgerPage += 1;
      this.paintLedgerPage();
    }, this.ledgerPage >= pages - 1 ? 0xe8dcc8 : 0x7d5cff, 54);
    this.ledgerRows.push(prev.bg, prev.text, prev.gfx, next.bg, next.text, next.gfx);
  }

  closeLedger() {
    (this.ledgerRows || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
    (this.ledgerBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.ledgerRows = [];
    this.ledgerBits = [];
    this.ledgerOn = false;
  }

  openPicker() {
    if (this.pickerOn) return;
    if (this.ledgerOn) this.closeLedger();
    this.pickerOn = true;
    const W = this.scale.width;
    const H = this.scale.height;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.55).setDepth(40).setInteractive();
    const panel = this.add.graphics().setDepth(41);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 430, 70, 860, 560, 24);
    panel.lineStyle(3, 0xc45a16, 0.8);
    panel.strokeRoundedRect(W / 2 - 430, 70, 860, 560, 24);
    const title = this.add.text(W / 2, 98, t("career.pickTitle"), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(42);
    const note = this.add.text(W / 2, 128, t("career.freeNote"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(42);
    this.pickerBits.push(dim, panel, title, note);

    FREE_AVATARS.forEach((a, i) => {
      const col = i % 5;
      const row = (i / 5) | 0;
      const x = W / 2 - 320 + col * 160;
      const y = 210 + row * 96;
      const key = this.textures.exists(avatarKey(a.id)) ? avatarKey(a.id) : "av-art-" + a.id;
      const img = this.add.image(x, y, this.textures.exists(key) ? key : avatarKey("av01"))
        .setDisplaySize(72, 72)
        .setDepth(43)
        .setInteractive({ useHandCursor: true });
      const ring = this.add.circle(x, y, 38, 0x000000, 0).setDepth(44);
      const paint = () => {
        const on = SaveSystem.data.avatarId === a.id;
        ring.setStrokeStyle(on ? 4 : 2, on ? 0xff6a22 : 0xc45a16, on ? 1 : 0.45);
      };
      paint();
      img.on("pointerdown", () => {
        SaveSystem.equipAvatar(a.id);
        AudioSystem.ui();
        this.refreshAvatar();
        this.pickerBits.forEach((b) => {
          if (b && b.paint) b.paint();
        });
      });
      img.aid = a.id;
      img.paint = paint;
      this.pickerBits.push(img, ring);
      ring.aid = a.id;
      ring.paint = paint;
    });

    const close = makeButton(this, W / 2, 590, 200, 42, t("career.close"), () => {
      AudioSystem.ui();
      this.closePicker();
    }, 0xff6a22);
    this.pickerBits.push(close.bg, close.text, close.gfx);
  }

  closePicker() {
    this.pickerBits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.pickerBits = [];
    this.pickerOn = false;
  }

  refreshAvatar() {
    const avId = SaveSystem.data.avatarId;
    const key = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    if (this.avImg) this.avImg.setTexture(key);
    if (this.avName) this.avName.setText(avatarLabel(avId, I18n.lang));
  }
}
