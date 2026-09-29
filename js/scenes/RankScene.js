import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { RANK_TIERS, RANK_CAL_GAMES, RANK_STAR_MMR, medalFromMmr, isCalibrating, badgeKey, displayBadgeId } from "../data/ranks.js";
import { Leaderboard, boardRankLabel } from "../systems/Leaderboard.js";
import { paintRankTabs } from "../ui/sceneTabs.js";
import { avatarKey } from "../data/avatars.js";

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

  nudgeList(dy) {
    this.listScroll = Phaser.Math.Clamp((this.listScroll || 0) + dy, 0, this.listMax || 0);
    if (this.listBox) this.listBox.y = -this.listScroll;
  }

  paintBoard(W, H) {
    const special = this.tab === "special";
    this.add.text(W / 2, 82, t(special ? "board.specialTitle" : "board.title"), {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 108, t(special ? "board.specialSub" : "board.sub"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#7a4a30"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 148, 1040, 52, special ? 0xffd24a : 0x7d5cff, 0xfff6ea);
    this.youText = this.add.text(W / 2, 148, t("board.loading"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8);

    this.listTop = 188;
    this.viewH = H - this.listTop - 16;
    this.statusText = this.add.text(W / 2, this.listTop + 80, t("board.loading"), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#7a4a30"
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
      const stroke = place === 1 ? 0xe8b84a : place === 2 ? 0xb8c0cc : place === 3 ? 0xd08a58 : 0xffb14a;
      const mine = youId && row.id === youId;
      const panel = roundPanel(this, W / 2, y, 1040, 52, mine ? 0xff6a22 : stroke, 0xfff6ea);
      const avKey = this.textures.exists(avatarKey(row.avatar_id)) ? avatarKey(row.avatar_id) : avatarKey("av01");
      const av = this.add.image(W / 2 - 460, y, avKey).setDisplaySize(40, 40).setDepth(8);
      const badgeId = displayBadgeId({ mmr: row.mmr, games: row.games });
      const badge = this.textures.exists(badgeKey(badgeId))
        ? this.add.image(W / 2 - 410, y, badgeKey(badgeId)).setDisplaySize(40, 40).setDepth(8)
        : this.add.text(W / 2 - 410, y, "").setDepth(8);
      const placeTx = this.add.text(W / 2 - 500, y, String(place), {
        fontFamily: UI_FONT, fontSize: place <= 3 ? "22px" : "18px", fontStyle: "900",
        color: place === 1 ? "#c45a16" : "#3a2418"
      }).setOrigin(0.5).setDepth(8);
      const name = this.add.text(W / 2 - 380, y - 10, row.display_name || "—", {
        fontFamily: UI_FONT, fontSize: "17px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0, 0.5).setDepth(8);
      const chip = this.add.text(W / 2 - 380, y + 12, boardRankLabel(row.mmr, row.games), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: "#7a4a30"
      }).setOrigin(0, 0.5).setDepth(8);
      const mmr = this.add.text(W / 2 + 280, y - 8, String(row.mmr | 0), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(0.5).setDepth(8);
      const wl = this.add.text(W / 2 + 280, y + 14, t("board.wl", { w: row.wins | 0, l: row.losses | 0 }), {
        fontFamily: UI_FONT, fontSize: "13px", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(8);
      this.listBox.add([panel, av, badge, placeTx, name, chip, mmr, wl]);
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
    const title = this.add.text(W / 2, 100, t("rank.title"), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    const sub = this.add.text(W / 2, 128, t("rank.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);
    bits.push(title, sub);

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
