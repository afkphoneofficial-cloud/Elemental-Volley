import { UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { wantFx } from "../systems/GameSettings.js?v=local260";
import { Leaderboard } from "../systems/Leaderboard.js?v=local274";
import { AuthSystem } from "../systems/AuthSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { TitleSystem } from "../systems/TitleSystem.js?v=local267";
import { avatarKey } from "../data/avatars.js";
import { badgeKey, displayBadgeId } from "../data/ranks.js";

export function mountHubBoardWidgets(scene) {
  const W = scene.scale.width;
  const w = 236;
  const h = 520;
  const y = 118 + h / 2;
  scene.hubBoards = [
    paintWidget(scene, 28 + w / 2, y, w, h, "pvp"),
    paintWidget(scene, W - 28 - w / 2, y, w, h, "special")
  ];
  scene.hubBoardFx = scene.add.graphics().setDepth(9);
}

function paintWidget(scene, x, y, w, h, kind) {
  const epic = kind === "special";
  const shell = scene.add.graphics().setDepth(8);
  if (epic) {
    shell.fillStyle(0x07060c, 0.94);
    shell.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    shell.lineStyle(4, 0xffd24a, 0.95);
    shell.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    shell.lineStyle(2, 0x3ad6ff, 0.8);
    shell.strokeRoundedRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, 18);
  } else {
    shell.fillStyle(0xfff6ea, 0.96);
    shell.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    shell.lineStyle(3, 0x9b86ff, 0.7);
    shell.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    shell.lineStyle(1.5, 0xc8b8ff, 0.55);
    shell.strokeRoundedRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, 18);
  }

  const halo = scene.add.graphics().setDepth(7);
  if (epic) {
    halo.fillStyle(0x7d5cff, 0.16);
    halo.fillRoundedRect(x - w / 2 - 14, y - h / 2 - 14, w + 28, h + 28, 28);
    halo.fillStyle(0xffd24a, 0.1);
    halo.fillRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 24);
  } else {
    halo.fillStyle(0xa898ff, 0.14);
    halo.fillRoundedRect(x - w / 2 - 10, y - h / 2 - 10, w + 20, h + 20, 26);
  }
  scene.tweens.add({
    targets: halo,
    alpha: epic ? { from: 0.55, to: 1 } : { from: 0.4, to: 0.75 },
    duration: epic ? 900 : 1600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut"
  });

  const titleY = y - h / 2 + 28;
  scene.add.text(x, titleY, t(epic ? "hub.playSpecial" : "hub.playPvp"), {
    fontFamily: UI_FONT,
    fontSize: epic ? "17px" : "16px",
    fontStyle: "900",
    color: epic ? "#ffe08a" : "#3a2418",
    stroke: epic ? "#3a1870" : "#fff6ea",
    strokeThickness: epic ? 4 : 0,
    align: "center",
    wordWrap: { width: w - 24 }
  }).setOrigin(0.5).setDepth(11);

  const status = scene.add.text(x, titleY + 36, t("board.loading"), {
    fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700",
    color: epic ? "#c8b8ff" : "#5a3828",
    align: "center", wordWrap: { width: w - 28 }
  }).setOrigin(0.5).setDepth(11);

  scene.add.text(x, y + h / 2 - 28, t("hub.widgetMore"), {
    fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800",
    color: epic ? "#ffe08a" : "#3a2418"
  }).setOrigin(0.5).setDepth(11);

  scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(12)
    .on("pointerdown", () => {
      AudioSystem.ui();
      scene.scene.start("rankinfo", { from: "hub", tab: kind === "special" ? "special" : "pvp" });
    });

  if (wantFx() && scene.textures.exists("dot")) {
    try {
      const spark = scene.add.particles(x, y, "dot", {
        lifespan: epic ? 1600 : 2200,
        speed: epic ? { min: 6, max: 28 } : { min: 2, max: 12 },
        scale: { start: epic ? 0.55 : 0.32, end: 0 },
        alpha: { start: epic ? 0.85 : 0.4, end: 0 },
        tint: epic ? [0xffe08a, 0x7d5cff, 0x3ad6ff] : [0xc8b8ff, 0xe8e0ff],
        blendMode: "ADD",
        quantity: 1,
        frequency: epic ? 40 : 110,
        emitZone: {
          type: "edge",
          source: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
          quantity: epic ? 22 : 14
        }
      });
      spark.setDepth(10);
    } catch (e) {}
  }

  Leaderboard.peekTop(kind, 5).then((res) => {
    if (!scene.sys || !scene.sys.isActive()) return;
    fillRows(scene, x, y, w, h, kind, res, status);
  });

  return { x, y, w, h, kind };
}

function fillRows(scene, x, y, w, h, kind, res, status) {
  const epic = kind === "special";
  const rows = (res && res.rows) || [];
  if (res && res.fail) {
    status.setText(t("board.fail"));
    return;
  }
  if (!rows.length) {
    status.setText(t(epic ? "board.specialEmpty" : "board.empty"));
    return;
  }
  status.setText("");
  const top = y - h / 2 + 78;
  rows.slice(0, 5).forEach((row, i) => {
    const ry = top + i * 76;
    const place = row.place | 0;
    const g = scene.add.graphics().setDepth(11);
    g.fillStyle(epic ? 0x120e1c : 0xffe8c8, epic ? 0.72 : 0.72);
    g.fillRoundedRect(x - w / 2 + 16, ry - 32, w - 32, 64, 14);
    const stroke = place === 1 ? 0xe8b84a : place === 2 ? 0xb8c0cc : place === 3 ? 0xd08a58 : (epic ? 0x7d5cff : 0x9b86ff);
    g.lineStyle(2, stroke, 0.8);
    g.strokeRoundedRect(x - w / 2 + 16, ry - 32, w - 32, 64, 14);
    scene.add.text(x - w / 2 + 34, ry, String(place), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900",
      color: place === 1 ? (epic ? "#ffe08a" : "#c45a16") : (epic ? "#fff6ea" : "#3a2418")
    }).setOrigin(0.5).setDepth(12);
    const avKey = scene.textures.exists(avatarKey(row.avatar_id)) ? avatarKey(row.avatar_id) : avatarKey("av01");
    scene.add.image(x - w / 2 + 62, ry, avKey).setDisplaySize(32, 32).setDepth(12);
    const badgeId = displayBadgeId({ mmr: row.mmr, games: row.games });
    if (scene.textures.exists(badgeKey(badgeId))) {
      scene.add.image(x - w / 2 + 92, ry, badgeKey(badgeId)).setDisplaySize(28, 28).setDepth(12);
    }
    const youId = AuthSystem.session && AuthSystem.session() && AuthSystem.session().id;
    const titleRow = TitleSystem.boardWorn(row, youId, SaveSystem.data);
    const name = String(row.display_name || "—").slice(0, 10);
    scene.add.text(x - w / 2 + 110, ry - 10, name, {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: epic ? "#fff6ea" : "#3a2418"
    }).setOrigin(0, 0.5).setDepth(12);
    if (titleRow) {
      scene.add.text(x - w / 2 + 110, ry + 12, TitleSystem.label(titleRow) + " · " + (row.mmr | 0), {
        fontFamily: UI_FONT, fontSize: "11px", fontStyle: "800", color: TitleSystem.colorOf(titleRow)
      }).setOrigin(0, 0.5).setDepth(12);
    } else {
      scene.add.text(x - w / 2 + 110, ry + 12, String(row.mmr | 0), {
        fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: epic ? "#ffe08a" : "#7d5cff"
      }).setOrigin(0, 0.5).setDepth(12);
    }
  });
}

export function paintHubBoardFx(scene, now) {
  if (!scene.hubBoardFx || !scene.hubBoards) return;
  const g = scene.hubBoardFx;
  const t = now * 0.001;
  g.clear();
  scene.hubBoards.forEach((box) => {
    const { x, y, w, h, kind } = box;
    const epic = kind === "special";
    if (epic) {
      for (let i = 0; i < 8; i += 1) {
        const a = t * (i % 2 === 0 ? 1.3 : -1) + i * 0.785;
        const rx = x + Math.cos(a) * (w * 0.52);
        const ry = y + Math.sin(a) * (h * 0.5);
        g.fillStyle(i % 2 ? 0xffd24a : 0x3ad6ff, 0.8);
        g.fillCircle(rx, ry, 4 + Math.sin(t * 4 + i) * 1.5);
      }
      const pulse = 8 + Math.sin(t * 3) * 5;
      g.lineStyle(3, 0xffd24a, 0.28 + Math.sin(t * 2) * 0.12);
      g.strokeRoundedRect(x - w / 2 - pulse, y - h / 2 - pulse, w + pulse * 2, h + pulse * 2, 26);
      return;
    }
    for (let i = 0; i < 4; i += 1) {
      const a = t * 0.5 + i * 1.57;
      g.fillStyle(0xb8a8ff, 0.32);
      g.fillCircle(x + Math.cos(a) * (w * 0.5), y + Math.sin(a) * (h * 0.5), 3);
    }
    const pulse = 4 + Math.sin(t * 1.3) * 2.5;
    g.lineStyle(2, 0x9b86ff, 0.14 + Math.sin(t * 1.1) * 0.07);
    g.strokeRoundedRect(x - w / 2 - pulse, y - h / 2 - pulse, w + pulse * 2, h + pulse * 2, 24);
  });
}
