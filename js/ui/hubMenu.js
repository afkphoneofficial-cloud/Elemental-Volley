import { makeButton, UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { Mailbox } from "../systems/Mailbox.js";
import { wantFx, settings, patchSettings } from "../systems/GameSettings.js";

export const HUB_MENU_LEFT = 276;

function keep(scene, obj) {
  if (!scene.hubMenuBits) scene.hubMenuBits = [];
  scene.hubMenuBits.push(obj);
  return obj;
}

function wipe(scene) {
  scene.playDraw = null;
  scene.playGlow = null;
  scene.playBurst = null;
  (scene.hubMenuBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
  scene.hubMenuBits = [];
}

function setOpen(scene, open) {
  scene.hubMenuOpen = Boolean(open);
  patchSettings({ hubMenuOpen: scene.hubMenuOpen });
  if (!open) scene.mailOpen = false;
  paintHubMenu(scene);
  if (scene.paintMailbox) scene.paintMailbox();
}

function row(scene, x, y, w, label, color, go) {
  const btn = makeButton(scene, x, y, w, 42, label, () => {
    AudioSystem.ui();
    go();
  }, color, 16);
  keep(scene, btn.gfx);
  keep(scene, btn.text);
  keep(scene, btn.bg);
}

export function mountHubMenu(scene) {
  scene.hubMenuOpen = settings().hubMenuOpen !== false;
  scene.hubMailSkipChip = true;
  scene.paintHubMenu = () => paintHubMenu(scene);
  paintHubMenu(scene);
}

export function paintHubMenu(scene) {
  wipe(scene);
  const open = scene.hubMenuOpen !== false;
  const h = 520;
  const w = open ? 252 : 58;
  const x = HUB_MENU_LEFT + w / 2;
  const y = 118 + h / 2;
  const shell = keep(scene, scene.add.graphics().setDepth(14));
  shell.fillStyle(0xfff6ea, 0.97);
  shell.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
  shell.lineStyle(3, 0xff8ab8, 0.78);
  shell.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);

  if (!open) {
    keep(scene, scene.add.text(x, y, t("hub.menuFold"), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setAngle(-90).setDepth(16));
    const unread = Mailbox.unread | 0;
    if (unread > 0) {
      keep(scene, scene.add.circle(x + 16, y - h / 2 + 22, 9, 0xff4a6a, 1).setDepth(17));
      keep(scene, scene.add.text(x + 16, y - h / 2 + 22, unread > 9 ? "9+" : String(unread), {
        fontFamily: UI_FONT, fontSize: "10px", fontStyle: "900", color: "#fff6ea"
      }).setOrigin(0.5).setDepth(18));
    }
    keep(scene, scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(19)
      .on("pointerdown", () => {
        AudioSystem.ui();
        setOpen(scene, true);
      }));
    scene.hubMail = { x, y: y - h / 2 + 40, w, h: 40 };
    return;
  }

  const bw = w - 28;
  keep(scene, scene.add.text(x, y - h / 2 + 28, t("hub.menuFold") + "   ∧", {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5).setDepth(16));
  keep(scene, scene.add.zone(x, y - h / 2 + 28, bw, 40).setInteractive({ useHandCursor: true }).setDepth(19)
    .on("pointerdown", () => {
      AudioSystem.ui();
      setOpen(scene, false);
    }));

  mountPlayIn(scene, x, y - h / 2 + 92);

  let ry = y - h / 2 + 148;
  const step = 48;
  row(scene, x, ry, bw, t("hub.navFighter"), 0xff8ab8, () => scene.scene.start("dress"));
  ry += step;
  row(scene, x, ry, bw, t("hub.navNews"), 0x3ad6ff, () => scene.scene.start("news"));
  ry += step;
  row(scene, x, ry, bw, t("hub.navBoard"), 0xffb14a, () => scene.scene.start("rankinfo", { from: "hub", tab: "pvp" }));
  ry += step;
  row(scene, x, ry, bw, t("hub.navBag"), 0xffd24a, () => scene.scene.start("bag"));
  ry += step;

  const unread = Mailbox.unread | 0;
  const mailLabel = unread ? t("mail.title") + "  " + unread : t("mail.title");
  scene.hubMail = { x, y: ry, w: bw, h: 42 };
  row(scene, x, ry, bw, mailLabel, 0xff8ab8, () => {
    scene.mailOpen = !scene.mailOpen;
    if (scene.paintMailbox) scene.paintMailbox();
  });
  ry += step;

  const name = (AuthSystem.displayName() || "—").slice(0, 12);
  row(scene, x, ry, bw, name || t("career.title"), 0xff6a22, () => scene.scene.start("career"));
}

function mountPlayIn(scene, x, y) {
  const bw = 212;
  const bh = 52;
  const r = 20;
  scene.playGlow = keep(scene, scene.add.graphics().setDepth(15));
  const drawGlow = (pulse) => {
    if (!scene.playGlow) return;
    scene.playGlow.clear();
    scene.playGlow.fillStyle(0xffe08a, 0.22 + pulse * 0.16);
    scene.playGlow.fillRoundedRect(x - bw / 2 - 10, y - bh / 2 - 8, bw + 20, bh + 16, r + 6);
  };
  drawGlow(0);
  scene.playDraw = drawGlow;
  const gfx = keep(scene, scene.add.graphics().setDepth(16));
  const drawBtn = (hot) => {
    gfx.clear();
    gfx.fillStyle(hot ? 0xff8a3a : 0xff6a22, 1);
    gfx.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, r);
    gfx.lineStyle(3, 0xffe08a, hot ? 1 : 0.95);
    gfx.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, r);
  };
  drawBtn(false);
  keep(scene, scene.add.text(x, y, t("hub.play"), {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#fff6ea"
  }).setOrigin(0.5).setDepth(17));
  const zone = keep(scene, scene.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(18));
  zone.on("pointerover", () => drawBtn(true));
  zone.on("pointerout", () => drawBtn(false));
  zone.on("pointerdown", () => {
    AudioSystem.ui();
    scene.scene.start("mode");
  });
  if (wantFx() && scene.textures.exists("dot")) {
    try {
      scene.playBurst = scene.add.particles(x, y, "dot", {
        lifespan: { min: 500, max: 1100 },
        speed: { min: 20, max: 90 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.7, end: 0 },
        tint: [0xff6a22, 0xffe08a, 0xffffff, 0xff8ab8],
        blendMode: "ADD",
        frequency: 70,
        quantity: 1,
        emitZone: { type: "edge", source: new Phaser.Geom.Ellipse(0, 0, 220, 58), quantity: 16 }
      }).setDepth(15);
      keep(scene, scene.playBurst);
    } catch (e) { scene.playBurst = null; }
  }
}
