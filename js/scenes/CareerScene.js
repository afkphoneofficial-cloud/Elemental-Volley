import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { FREE_AVATARS, avatarKey, avatarLabel } from "../data/avatars.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { formatMatchClock } from "../gameplay/MatchStats.js";
import { medalFromMmr, isCalibrating, badgeKey, RANK_CAL_GAMES, displayBadgeId } from "../data/ranks.js";

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

export class CareerScene extends Phaser.Scene {
  constructor() { super("career"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const c = SaveSystem.data.career;
    const log = SaveSystem.data.matchLog || [];
    this.pickerBits = [];

    this.add.text(W / 2, 36, t("career.title"), {
      fontFamily: UI_FONT, fontSize: "32px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    const sess = AuthSystem.session() || {};
    const mail = sess.email || "";
    const pid = sess.id ? String(sess.id).slice(0, 8) : "—";

    roundPanel(this, W / 2, 148, 1080, 168, 0xff8a3a, 0xfff6ea);
    const avId = SaveSystem.data.avatarId;
    const key = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    this.avImg = this.add.image(210, 148, key).setDisplaySize(112, 112).setDepth(8);
    this.add.circle(210, 148, 58, 0x000000, 0).setStrokeStyle(4, 0xc45a16, 0.85).setDepth(9);
    this.add.text(292, 96, AuthSystem.displayName(), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(8);
    this.add.text(292, 126, mail || "—", {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8);
    this.add.text(292, 150, t("career.idLine", { id: pid }), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#8a5a38"
    }).setOrigin(0, 0.5).setDepth(8);
    this.avName = this.add.text(292, 174, avatarLabel(avId, I18n.lang), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8);
    const rk = SaveSystem.data.rank;
    const medal = medalFromMmr(rk.mmr);
    const rankLab = isCalibrating(rk)
      ? t("rank.calShort", { n: rk.games, max: RANK_CAL_GAMES })
      : t("rank.chip", { name: t("rank.tier." + medal.id), star: medal.star || "" });
    this.add.text(292, 198, rankLab, {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0, 0.5).setDepth(8);
    const shown = displayBadgeId(rk);
    if (this.textures.exists(badgeKey(shown))) {
      this.add.image(260, 198, badgeKey(shown)).setDisplaySize(26, 26).setDepth(8);
    }
    const btnX = W - 250;
    makeButton(this, btnX, 112, 220, 40, t("career.change"), () => {
      AudioSystem.ui();
      this.openPicker();
    }, 0x7d5cff);
    makeButton(this, btnX, 160, 220, 40, t("career.rename"), () => {
      AudioSystem.ui();
      this.scene.start("shop", { tab: "items" });
    }, 0xff8ab8);
    this.add.text(btnX, 198, t("career.renameShop", { name: t("item.namestone.name") }), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#8a5a38",
      align: "center", wordWrap: { width: 240 }
    }).setOrigin(0.5).setDepth(8);

    roundPanel(this, W / 2, 262, 1080, 52, 0xff8a3a, 0xfff6ea);
    this.add.text(W / 2, 262,
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
      { fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#3a2418", align: "center", wordWrap: { width: 1000 } }
    ).setOrigin(0.5).setDepth(6);

    const leftX = 394;
    const rightX = 886;
    const colW = 548;
    const panelY = 508;
    const panelH = 392;
    const maskTop = 348;
    const viewH = 328;
    this.cols = [];

    roundPanel(this, leftX, panelY, colW, panelH, 0xffb14a, 0xfff6ea);
    this.add.text(leftX, 322, t("career.logHead", { n: Math.min(log.length, ECONOMY.matchLogMax) }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(8);
    const leftBits = [];
    if (!log.length) {
      leftBits.push(this.add.text(leftX, maskTop + 80, t("career.empty"), {
        fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30", align: "center", wordWrap: { width: 480 }
      }).setOrigin(0.5).setDepth(8));
    } else {
      log.forEach((row, i) => {
        const y = maskTop + 18 + i * 36;
        const line = t("career.row", {
          result: row.win ? t("career.win") : t("career.lose"),
          you: charName(row.you),
          foe: row.foeName || charName(row.foe),
          a: row.youScore,
          b: row.foeScore,
          mode: row.mode === "pvp" ? t("career.pvp") : row.mode === "exhibit" ? t("career.exhibit") : row.mode === "special" ? t("career.special") : t("career.bot")
        });
        leftBits.push(this.add.text(leftX, y, line, {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: row.win ? "#2a7a38" : "#7a4a30",
          wordWrap: { width: 500 }, align: "center"
        }).setOrigin(0.5).setDepth(8));
      });
    }
    this.mountCol(leftX, colW, maskTop, viewH, leftBits, Math.max(36, log.length * 36 + 36));

    roundPanel(this, rightX, panelY, colW, panelH, 0x3ad6ff, 0xfff6ea);
    this.add.text(rightX, 322, t("career.seasonHead"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(8);
    const rightBits = [];
    let ry = maskTop + 12;
    [["pvp", t("career.pvpBoard")], ["special", t("career.elemBoard")]].forEach(([board, label]) => {
      rightBits.push(this.add.text(rightX, ry, label, {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0.5).setDepth(8));
      ry += 28;
      const rows = seasonRows(board);
      if (!rows.length) {
        rightBits.push(this.add.text(rightX, ry, t("career.seasonEmpty"), {
          fontFamily: UI_FONT, fontSize: "13px", color: "#8a5a38"
        }).setOrigin(0.5).setDepth(8));
        ry += 36;
      } else {
        rows.forEach((row) => {
          const line = row.place
            ? t("career.seasonRow", { week: weekLabel(row.week), games: row.games, place: row.place, wins: row.wins })
            : t("career.seasonRowNo", { week: weekLabel(row.week), games: row.games, wins: row.wins });
          rightBits.push(this.add.text(rightX, ry, line, {
            fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: "#5a3828"
          }).setOrigin(0.5).setDepth(8));
          ry += 26;
        });
        ry += 10;
      }
    });
    this.mountCol(rightX, colW, maskTop, viewH, rightBits, ry - maskTop + 12);

    this.bindCols(maskTop, viewH);
    makeButton(this, 120, 36, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    AudioSystem.playMenu();
  }

  mountCol(x, w, top, viewH, bits, contentH) {
    const box = this.add.container(0, 0);
    bits.forEach((o) => box.add(o));
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(x - w / 2 + 8, top, w - 16, viewH);
    box.setMask(maskG.createGeometryMask());
    maskG.setVisible(false);
    const col = { x, w, top, viewH, box, scroll: 0, max: Math.max(0, contentH - viewH) };
    this.cols.push(col);
    return col;
  }

  colAt(x, y) {
    return (this.cols || []).find((col) => (
      y >= col.top && y <= col.top + col.viewH &&
      x >= col.x - col.w / 2 && x <= col.x + col.w / 2
    )) || null;
  }

  nudgeCol(col, dy) {
    if (!col) return;
    col.scroll = Phaser.Math.Clamp((col.scroll || 0) + dy, 0, col.max || 0);
    col.box.y = -col.scroll;
  }

  bindCols(maskTop, viewH) {
    this.input.on("wheel", (p, _g, _dx, dy) => {
      if (this.pickerOn) return;
      this.nudgeCol(this.colAt(p.x, p.y), dy * 0.45);
    });
    this.input.on("pointerdown", (p) => {
      if (this.pickerOn) return;
      const col = this.colAt(p.x, p.y);
      if (!col) return;
      this._drag = { y: p.y, s: col.scroll, col };
    });
    this.input.on("pointerup", () => { this._drag = null; });
    this.input.on("pointermove", (p) => {
      if (!this._drag || !p.isDown || this.pickerOn) return;
      this._drag.col.scroll = Phaser.Math.Clamp(this._drag.s + (this._drag.y - p.y), 0, this._drag.col.max || 0);
      this._drag.col.box.y = -this._drag.col.scroll;
    });
  }

  openPicker() {
    if (this.pickerOn) return;
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
