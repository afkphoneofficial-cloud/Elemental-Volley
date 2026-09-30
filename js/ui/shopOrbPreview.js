import { makeButton, UI_FONT } from "./Ui.js";
import { t, I18n } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { ultOrbOf } from "../data/ultOrb.js?v=local198";
import { ELEMENT_FX } from "../fx/HitFx.js?v=local198";

export function closeOrbPreview(scene) {
  if (scene._orbPrevTw && scene._orbPrevTw.stop) scene._orbPrevTw.stop();
  scene._orbPrevTw = null;
  if (scene._orbPrevWait) scene._orbPrevWait.remove(false);
  scene._orbPrevWait = null;
  if (scene._orbPrevTick) scene._orbPrevTick.remove(false);
  scene._orbPrevTick = null;
  if (scene._orbPrev) {
    scene._orbPrev.destroy(true);
    scene._orbPrev = null;
  }
}

export function openOrbPreview(scene, orbId) {
  closeOrbPreview(scene);
  const row = ultOrbOf(orbId);
  if (!row) return;
  const pal = ELEMENT_FX[row.char] || ELEMENT_FX.ignis;
  const W = scene.scale.width;
  const H = scene.scale.height;
  const D = 100;
  const cx = W / 2;
  const cy = H / 2;
  const root = scene.add.container(0, 0).setDepth(D);
  scene._orbPrev = root;

  const dim = scene.add.rectangle(cx, cy, W, H, 0x3a2418, 0.5).setInteractive();
  dim.on("pointerdown", () => closeOrbPreview(scene));
  const panel = scene.add.rectangle(cx, cy, 640, 540, 0xfffaf4, 1).setStrokeStyle(3, row.ring, 0.95).setInteractive();
  const court = scene.add.graphics();
  court.fillStyle(0xffe8c8, 1);
  court.fillRoundedRect(cx - 270, cy - 168, 540, 268, 18);
  court.lineStyle(3, 0xffb14a, 0.55);
  court.strokeRoundedRect(cx - 270, cy - 168, 540, 268, 18);
  court.lineStyle(3, 0xfff6ea, 0.95);
  court.lineBetween(cx, cy - 150, cx, cy + 80);
  court.lineStyle(2, 0xe8c8a8, 0.7);
  court.lineBetween(cx - 250, cy + 72, cx + 250, cy + 72);

  const title = scene.add.text(cx, cy - 238, t("item." + row.id + ".name"), {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5);
  const lock = scene.add.text(cx, cy - 208, t("shop.fxFor", { name: I18n.charName(row.char) }), {
    fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#c45a16"
  }).setOrigin(0.5);
  const hint = scene.add.text(cx, cy - 186, t("shop.orbPrevHint"), {
    fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#7a4a30"
  }).setOrigin(0.5);
  const modeLab = scene.add.text(cx, cy + 122, t("shop.fxUlt"), {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#0a6a88"
  }).setOrigin(0.5);

  const fxG = scene.add.graphics();
  const extra = scene.add.graphics();
  const ball = scene.add.image(cx - 200, cy + 40, "ball").setDisplaySize(70, 70);
  const faceKey = scene.textures.exists("vis_select_" + row.char) ? "vis_select_" + row.char : "vis_" + row.char;
  const face = scene.add.image(cx - 232, cy + 8, faceKey).setDisplaySize(72, 72);

  const x0 = cx - 168;
  const x1 = cx + 200;
  const yFloor = cy + 56;
  const trail = [];
  const drops = [];
  for (let i = 0; i < 6; i += 1) {
    drops.push(scene.add.circle(0, 0, 4, 0x7ae8ff, 0.8).setVisible(false));
  }

  const burst = (x, y) => {
    const ring = scene.add.circle(x, y, 22, pal.smash[0], 0).setStrokeStyle(6, pal.smash[0], 0.95).setDepth(D + 2);
    const ring2 = scene.add.circle(x, y, 16, pal.tints[1], 0).setStrokeStyle(4, pal.tints[1], 0.85).setDepth(D + 2);
    scene.tweens.add({ targets: ring, radius: 96, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
    scene.tweens.add({ targets: ring2, radius: 140, alpha: 0, duration: 560, onComplete: () => ring2.destroy() });
    root.add([ring, ring2]);
  };

  const paint = (x, y, now, impact) => {
    fxG.clear();
    extra.clear();
    trail.push({ x, y });
    if (trail.length > 16) trail.shift();
    const el = row.char;
    if (el === "ignis") {
      ball.setVisible(true).setTint(0xff6a22);
      trail.forEach((p, i) => {
        const u = (i + 1) / trail.length;
        fxG.fillStyle(0xff6a22, 0.18 + u * 0.45);
        fxG.fillCircle(p.x, p.y, (8 + u * 16) * 1.7);
        fxG.fillStyle(0xffe08a, 0.2 + u * 0.5);
        fxG.fillCircle(p.x, p.y, (4 + u * 8) * 1.7);
      });
      fxG.fillStyle(0xff3300, 0.28);
      fxG.fillCircle(x, y + 6, 28);
      fxG.fillStyle(0xfff4e8, 0.95);
      fxG.fillCircle(x, y, 16);
    } else if (el === "volt") {
      ball.setVisible(false);
      const pts = trail;
      if (pts.length >= 2) {
        fxG.lineStyle(12, 0xe8ff3a, 0.55);
        fxG.beginPath();
        fxG.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) fxG.lineTo(pts[i].x, pts[i].y);
        fxG.strokePath();
        fxG.lineStyle(3, 0xffffff, 0.95);
        fxG.beginPath();
        fxG.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) {
          fxG.lineTo(pts[i].x + Math.sin(now / 40 + i) * 10, pts[i].y + Math.cos(now / 50 + i) * 10);
        }
        fxG.strokePath();
      }
      fxG.fillStyle(0xffffcc, 1);
      fxG.fillCircle(x, y, 14);
      fxG.fillStyle(0xe8ff3a, 0.65);
      fxG.fillCircle(x, y, 26);
      fxG.lineStyle(2, 0xffffff, 0.8);
      for (let i = 0; i < 4; i += 1) {
        const ang = now / 80 + i * 1.57;
        fxG.lineBetween(x, y, x + Math.cos(ang) * 34, y + Math.sin(ang) * 34);
      }
    } else if (el === "aqua") {
      ball.setVisible(true).setTint(0x66e8ff);
      extra.lineStyle(5, 0x7ae8ff, 0.75);
      extra.strokeCircle(x, y, 28 + Math.sin(now / 120) * 10);
      extra.lineStyle(3, 0xffffff, 0.45);
      extra.strokeCircle(x, y, 48 + Math.sin(now / 90) * 8);
      extra.lineStyle(2, 0x3ad6ff, 0.35);
      extra.strokeCircle(x, y, 72);
      drops.forEach((d, i) => {
        d.setVisible(true);
        const ang = now / 160 + i * 1.25;
        d.setPosition(x + Math.cos(ang) * (28 + i * 6), y + Math.sin(ang * 1.3) * (22 + i * 4));
      });
    } else {
      ball.setVisible(true).setTint(impact ? 0xffc070 : 0xc07830);
      trail.forEach((p, i) => {
        const u = (i + 1) / trail.length;
        fxG.fillStyle(0xc07830, 0.12 + u * 0.35);
        fxG.fillCircle(p.x, p.y + 8, 6 + u * 14);
      });
      fxG.fillStyle(0xe0a24a, 0.4);
      fxG.fillCircle(x, y + 18, impact ? 36 : 18);
      fxG.fillStyle(0xfff0d0, 0.55);
      fxG.fillCircle(x - 16, y + 10, 8);
      fxG.fillCircle(x + 18, y + 14, 10);
    }
    ball.setPosition(x, y);
  };

  const play = () => {
    if (scene._orbPrevTw && scene._orbPrevTw.stop) scene._orbPrevTw.stop();
    if (scene._orbPrevWait) scene._orbPrevWait.remove(false);
    trail.length = 0;
    fxG.clear();
    extra.clear();
    drops.forEach((d) => d.setVisible(false));
    ball.clearTint();
    ball.setVisible(row.char !== "volt").setPosition(x0, yFloor);
    const dummy = { u: 0 };
    scene._orbPrevTw = scene.tweens.add({
      targets: dummy,
      u: 1,
      duration: 640,
      ease: "Cubic.easeIn",
      onUpdate: () => {
        const u = dummy.u;
        const x = x0 + (x1 - x0) * u;
        const y = yFloor - Math.sin(u * Math.PI) * 48;
        paint(x, y, scene.time.now, false);
      },
      onComplete: () => {
        const x = x1;
        const y = yFloor;
        paint(x, y, scene.time.now, true);
        burst(x, y);
        scene._orbPrevWait = scene.time.delayedCall(720, () => {
          if (scene._orbPrev) play();
        });
      }
    });
  };

  const close = makeButton(scene, cx, cy + 200, 180, 44, t("nav.back"), () => {
    AudioSystem.ui();
    closeOrbPreview(scene);
  }, 0xff8a3a, D + 4);

  root.add([
    dim, panel, court, title, lock, hint, extra, fxG, ball, face, modeLab, close.gfx, close.text, close.bg
  ].concat(drops));
  play();
}
