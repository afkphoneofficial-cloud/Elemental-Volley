import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { wantFx } from "../systems/GameSettings.js";
import { t } from "../i18n/I18n.js";
import { RANK_TIERS, RANK_CAL_GAMES, RANK_STAR_MMR, medalFromMmr, isCalibrating, badgeKey, displayBadgeId } from "../data/ranks.js";
import { Leaderboard, boardRankLabel } from "../systems/Leaderboard.js";
import { paintRankTabs } from "../ui/sceneTabs.js";
import { avatarKey } from "../data/avatars.js";
import { liveSeasonMark, plateKey, seasonCycleOf } from "../data/seasonCycle.js";

export class RankScene extends Phaser.Scene {
  constructor() { super("rankinfo"); }

  init(data) {
    this.from = (data && data.from) || "hub";
    this.tab = (data && data.tab) || "pvp";
    if (this.tab !== "special" && this.tab !== "rules") this.tab = "pvp";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    this.listScroll = 0;
    this.listMax = 0;
    this.listBox = null;

    paintRankTabs(this, this.tab);
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      const dest = this.from === "queue" ? "queue" : this.from;
      this.scene.start(dest);
    }, 0x7d5cff);
    makeButton(this, this.scale.width - 118, 36, 196, 40, t("career.season"), () => {
      AudioSystem.ui();
      this.scene.start("season", { from: "rankinfo", via: this.from, tab: this.tab === "special" ? "special" : "pvp" });
    }, 0xc8ff3a);

    if (this.tab === "special") this.paintEpicSkin(W, H);
    if (this.tab === "rules") this.paintRules(W, H);
    else this.paintBoard(W, H);

    this.input.on("wheel", (_p, _g, _dx, dy) => this.nudgeList(dy * 0.5));
    this.input.on("pointerdown", (p) => {
      if (p.y < this.listTop || p.y > this.listTop + this.viewH) return;
      this._drag = { y: p.y, s: this.listScroll };
    });
    this.input.on("pointerup", () => { this._drag = null; });
    this.input.on("pointermove", (p) => {
      if (!this._drag || !p.isDown) return;
      this.listScroll = Phaser.Math.Clamp(this._drag.s + (this._drag.y - p.y), 0, this.listMax || 0);
      if (this.listBox) this.listBox.y = -this.listScroll;
    });
    AudioSystem.playMenu();
  }

  paintEpicSkin(W, H) {
    const top = 62;
    const w = W - 36;
    const h = H - top - 10;
    const x = W / 2;
    const y = top + h / 2;
    this.epicBox = { x, y, w, h };

    const n = 3;
    const gap = 10;
    const tabW = Math.min(210, Math.max(100, Math.floor((W - 48) / n) - gap));
    const total = n * tabW + (n - 1) * gap;
    const x0 = W / 2 - total / 2 + tabW / 2;
    this.epicTab = { x: x0 + tabW + gap, y: 36, w: tabW, h: 36 };

    const halo = this.add.graphics().setDepth(1);
    halo.fillStyle(0x7d5cff, 0.2);
    halo.fillRoundedRect(x - w / 2 - 16, y - h / 2 - 16, w + 32, h + 32, 28);
    halo.fillStyle(0xffd24a, 0.12);
    halo.fillRoundedRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, 24);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.55, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    const panel = this.add.graphics().setDepth(2);
    panel.fillStyle(0x1a1033, 0.94);
    panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    panel.lineStyle(5, 0xffd24a, 1);
    panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    panel.lineStyle(2, 0x3ad6ff, 0.95);
    panel.strokeRoundedRect(x - w / 2 + 7, y - h / 2 + 7, w - 14, h - 14, 18);
    panel.fillStyle(0xffffff, 0.08);
    panel.fillRoundedRect(x - w / 2 + 18, y - h / 2 + 12, w - 36, 28, 12);

    const tabHalo = this.add.graphics().setDepth(3);
    const tx = this.epicTab.x;
    const ty = this.epicTab.y;
    const tw = this.epicTab.w;
    const th = this.epicTab.h;
    tabHalo.fillStyle(0x7d5cff, 0.22);
    tabHalo.fillRoundedRect(tx - tw / 2 - 10, ty - th / 2 - 10, tw + 20, th + 20, 18);
    tabHalo.fillStyle(0xffd24a, 0.16);
    tabHalo.fillRoundedRect(tx - tw / 2 - 4, ty - th / 2 - 4, tw + 8, th + 8, 16);
    this.tweens.add({
      targets: tabHalo,
      alpha: { from: 0.5, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    this.fxRing = this.add.graphics().setDepth(4);

    if (wantFx() && this.textures.exists("dot")) {
      try {
        const spark = this.add.particles(x, y, "dot", {
          lifespan: 1600,
          speed: { min: 8, max: 42 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.95, end: 0 },
          tint: [0xffe08a, 0x7d5cff, 0x3ad6ff, 0xff6a22],
          blendMode: "ADD",
          quantity: 1,
          frequency: 28,
          emitZone: {
            type: "edge",
            source: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
            quantity: 28
          }
        });
        spark.setDepth(3);
        const tabSpark = this.add.particles(tx, ty, "dot", {
          lifespan: 1400,
          speed: { min: 6, max: 24 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.9, end: 0 },
          tint: [0xffe08a, 0x7d5cff, 0x3ad6ff],
          blendMode: "ADD",
          quantity: 1,
          frequency: 40,
          emitZone: {
            type: "edge",
            source: new Phaser.Geom.Rectangle(-tw / 2, -th / 2, tw, th),
            quantity: 16
          }
        });
        tabSpark.setDepth(5);
      } catch (e) {}
    }
  }

  update(now) {
    if (!this.fxRing || !this.epicBox) return;
    const t = now * 0.001;
    const g = this.fxRing;
    g.clear();
    const boxes = [this.epicBox];
    if (this.epicTab) boxes.push(this.epicTab);
    boxes.forEach((box, bi) => {
      const { x, y, w, h } = box;
      const n = bi ? 6 : 8;
      for (let i = 0; i < n; i += 1) {
        const a = t * (i % 2 === 0 ? 1.4 : -1.1) + i * (6.28 / n);
        const rx = x + Math.cos(a) * (w * 0.52);
        const ry = y + Math.sin(a) * (h * 0.52);
        const r = (bi ? 3.5 : 5) + Math.sin(t * 4 + i) * 2;
        g.fillStyle(i % 2 ? 0xffd24a : 0x3ad6ff, 0.85);
        g.fillCircle(rx, ry, r);
      }
      const pulse = (bi ? 6 : 10) + Math.sin(t * 3) * (bi ? 3 : 6);
      g.lineStyle(3, 0xffd24a, 0.35 + Math.sin(t * 2) * 0.15);
      g.strokeRoundedRect(x - w / 2 - pulse, y - h / 2 - pulse, w + pulse * 2, h + pulse * 2, bi ? 18 : 26);
    });
  }

  nudgeList(dy) {
    this.listScroll = Phaser.Math.Clamp((this.listScroll || 0) + dy, 0, this.listMax || 0);
    if (this.listBox) this.listBox.y = -this.listScroll;
  }

  paintBoard(W, H) {
    const special = this.tab === "special";
    this.add.text(W / 2, 82, t(special ? "board.specialTitle" : "board.title"), {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900",
      color: special ? "#ffe08a" : "#3a2418",
      stroke: special ? "#3a1870" : undefined,
      strokeThickness: special ? 5 : 0
    }).setOrigin(0.5).setDepth(8);
    this.add.text(W / 2, 108, t(special ? "board.specialSub" : "board.sub"), {
      fontFamily: UI_FONT, fontSize: "13px", color: special ? "#c8b8ff" : "#7a4a30"
    }).setOrigin(0.5).setDepth(8);

    if (special) {
      const you = this.add.graphics().setDepth(6);
      you.fillStyle(0x120e1c, 0.88);
      you.fillRoundedRect(W / 2 - 520, 122, 1040, 52, 16);
      you.lineStyle(3, 0xffd24a, 0.95);
      you.strokeRoundedRect(W / 2 - 520, 122, 1040, 52, 16);
      you.lineStyle(1.5, 0x3ad6ff, 0.7);
      you.strokeRoundedRect(W / 2 - 514, 128, 1028, 40, 12);
    } else {
      roundPanel(this, W / 2, 148, 1040, 52, 0x7d5cff, 0xfff6ea);
    }
    this.youText = this.add.text(W / 2, 148, t("board.loading"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800",
      color: special ? "#fff6ea" : "#3a2418"
    }).setOrigin(0.5).setDepth(8);

    this.listTop = 188;
    this.viewH = H - this.listTop - 16;
    this.statusText = this.add.text(W / 2, this.listTop + 80, t("board.loading"), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800",
      color: special ? "#ffe08a" : "#7a4a30"
    }).setOrigin(0.5).setDepth(8);

    Leaderboard.load(this.tab).then(() => {
      if (!this.sys || !this.sys.isActive()) return;
      this.drawRows(W);
    });
  }

  drawRows(W) {
    const special = this.tab === "special";
    const rows = Leaderboard.rows || [];
    const sess = AuthSystem.session && AuthSystem.session();
    const youId = sess && sess.id;
    this.paintYouBar(special);
    if (this.statusText) {
      if (Leaderboard.fail) this.statusText.setText(t("board.fail"));
      else if (!rows.length) this.statusText.setText(t(special ? "board.specialEmpty" : "board.empty"));
      else this.statusText.setText("");
    }
    if (!rows.length) return;

    const rowH = 58;
    this.listMax = Math.max(0, rows.length * rowH - this.viewH);
    this.listScroll = 0;
    this.listBox = this.add.container(0, 0).setDepth(6);
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(W / 2 - 530, this.listTop, 1060, this.viewH);
    this.listBox.setMask(maskG.createGeometryMask());
    maskG.setVisible(false);

    rows.forEach((row, i) => {
      const y = this.listTop + 28 + i * rowH;
      const place = row.place | 0;
      const stroke = place === 1 ? 0xe8b84a : place === 2 ? 0xb8c0cc : place === 3 ? 0xd08a58 : (special ? 0x7d5cff : 0xffb14a);
      const mine = youId && row.id === youId;
      let panel;
      if (special) {
        panel = this.add.graphics().setDepth(6);
        panel.fillStyle(0x120e1c, 0.78);
        panel.fillRoundedRect(W / 2 - 520, y - 26, 1040, 52, 14);
        panel.lineStyle(2, mine ? 0xff6a22 : stroke, 0.9);
        panel.strokeRoundedRect(W / 2 - 520, y - 26, 1040, 52, 14);
      } else {
        panel = roundPanel(this, W / 2, y, 1040, 52, mine ? 0xff6a22 : stroke, 0xfff6ea);
      }
      const ink = special ? "#fff6ea" : "#3a2418";
      const muted = special ? "#c8b8ff" : "#7a4a30";
      const gold = special ? "#ffe08a" : "#c45a16";
      const avKey = this.textures.exists(avatarKey(row.avatar_id)) ? avatarKey(row.avatar_id) : avatarKey("av01");
      const av = this.add.image(W / 2 - 460, y, avKey).setDisplaySize(40, 40).setDepth(8);
      const badgeId = displayBadgeId({ mmr: row.mmr, games: row.games });
      const badge = this.textures.exists(badgeKey(badgeId))
        ? this.add.image(W / 2 - 410, y, badgeKey(badgeId)).setDisplaySize(40, 40).setDepth(8)
        : this.add.text(W / 2 - 410, y, "").setDepth(8);
      const placeTx = this.add.text(W / 2 - 500, y, String(place), {
        fontFamily: UI_FONT, fontSize: place <= 3 ? "22px" : "18px", fontStyle: "900",
        color: place === 1 ? gold : ink
      }).setOrigin(0.5).setDepth(8);
      const name = this.add.text(W / 2 - 380, y - 10, row.display_name || "—", {
        fontFamily: UI_FONT, fontSize: "17px", fontStyle: "900", color: ink
      }).setOrigin(0, 0.5).setDepth(8);
      const chip = this.add.text(W / 2 - 380, y + 12, boardRankLabel(row.mmr, row.games), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: muted
      }).setOrigin(0, 0.5).setDepth(8);
      const mmr = this.add.text(W / 2 + 280, y, String(row.mmr | 0), {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: special ? gold : "#3a2418"
      }).setOrigin(0.5).setDepth(8);
      const rowBits = [panel, av, badge, placeTx, name, chip, mmr];
      const sess = AuthSystem.session && AuthSystem.session();
      const mark = liveSeasonMark(row.season_mark) || (sess && row.id === sess.id ? liveSeasonMark(SaveSystem.data.seasonMark) : null);
      if (mark) {
        const cyc = seasonCycleOf(mark.cycle | 0);
        const key = plateKey(mark.kind, cyc);
        if (key && this.textures.exists(key)) {
          if (mark.kind === "frame") {
            rowBits.push(this.add.image(W / 2 - 300, y - 10, key).setDisplaySize(52, 36).setDepth(7));
          } else {
            rowBits.push(this.add.image(W / 2 - 380 + name.width + 22, y - 10, key).setDisplaySize(30, 30).setDepth(8));
          }
        }
      }
      this.listBox.add(rowBits);
    });
  }

  paintYouBar(special) {
    if (!this.youText) return;
    const local = SaveSystem.data.rank || {};
    const me = Leaderboard.me;
    const mmr = (me && me.mmr) || local.mmr | 0;
    const games = (me && me.games) || local.games | 0;
    const wins = (me && me.wins) || local.wins | 0;
    const losses = (me && me.losses) || local.losses | 0;
    const place = me && me.place;
    const on = me ? me.on_board : games > 0;
    const name = AuthSystem.displayName() || "—";
    let status = t(special ? "board.specialOff" : "board.youOff");
    if (!special && on && place) {
      status = place <= 100 ? t("board.youPlace", { n: place }) : t("board.youOut", { n: place });
    }
    this.youText.setText(status + "  ·  " + name + "  ·  " + boardRankLabel(mmr, games) + "  ·  " + mmr + "  ·  " + t("board.wl", { w: wins, l: losses }));
  }

  paintRules(W, H) {
    this.listTop = 78;
    this.viewH = H - this.listTop - 16;
    this.listBox = this.add.container(0, 0).setDepth(6);
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(20, this.listTop, W - 40, this.viewH);
    this.listBox.setMask(maskG.createGeometryMask());
    maskG.setVisible(false);

    const bits = [];
    const title = this.add.text(W / 2, 108, t("rank.title"), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    bits.push(title);

    const rank = SaveSystem.data.rank;
    const cal = isCalibrating(rank);
    const medal = medalFromMmr(rank.mmr);
    const youPanel = roundPanel(this, W / 2, 178, 720, 88, 0x7d5cff, 0xfff6ea);
    bits.push(youPanel);
    const shown = displayBadgeId(rank);
    if (this.textures.exists(badgeKey(shown))) {
      bits.push(this.add.image(W / 2 - 280, 178, badgeKey(shown)).setDisplaySize(72, 72).setDepth(8));
    }
    bits.push(this.add.text(W / 2 - 230, 164, cal
      ? t("rank.calNow", { n: rank.games, max: RANK_CAL_GAMES })
      : t("rank.youAre", { name: t("rank.tier." + medal.id), star: medal.star || t("rank.noStar") }), {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(8));
    bits.push(this.add.text(W / 2 - 230, 194, t("rank.mmrLine", { n: rank.mmr, w: rank.wins, l: rank.losses }), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8));

    RANK_TIERS.forEach((row, i) => {
      const x = 86 + i * 148;
      const y = 288;
      const size = 52 + i * 8;
      if (i >= 4) {
        const glow = this.add.circle(x, y, size * 0.52, row.color, 0.16 + i * 0.03).setDepth(6);
        glow.setStrokeStyle(i >= 6 ? 3 : 0, 0xffe08a, 0.35);
        bits.push(glow);
      }
      if (this.textures.exists(badgeKey(row.id))) {
        bits.push(this.add.image(x, y, badgeKey(row.id)).setDisplaySize(size, size).setDepth(8));
      }
      const on = !cal && medal.id === row.id;
      bits.push(this.add.text(x, y + size * 0.52 + 10, t("rank.tier." + row.id), {
        fontFamily: UI_FONT, fontSize: on ? "14px" : "12px", fontStyle: on ? "900" : "700",
        color: on ? "#c45a16" : "#3a2418", align: "center", wordWrap: { width: 140 }
      }).setOrigin(0.5).setDepth(8));
    });

    const body = [
      t("rank.body1", { n: RANK_CAL_GAMES }),
      t("rank.body2", { star: RANK_STAR_MMR }),
      t("rank.body3"),
      t("rank.body4"),
      t("rank.body5")
    ].join("\n");
    const bodyTx = this.add.text(W / 2, 430, body, {
      fontFamily: UI_FONT, fontSize: "15px", color: "#5a3828", align: "center", wordWrap: { width: 1000 }, lineSpacing: 8
    }).setOrigin(0.5, 0);
    bits.push(bodyTx);
    this.listBox.add(bits);
    const bottom = 430 + bodyTx.height;
    this.listMax = Math.max(0, bottom - (this.listTop + this.viewH) + 24);
  }
}
