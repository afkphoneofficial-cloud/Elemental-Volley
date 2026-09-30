import { makeButton, UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { ballFxOf, drawArmedBallFx } from "../data/ballFx.js?v=local195";

export function closeBallPreview(scene) {
  if (scene._ballPrevTw && scene._ballPrevTw.stop) scene._ballPrevTw.stop();
  scene._ballPrevTw = null;
  if (scene._ballPrevWait) scene._ballPrevWait.remove(false);
  scene._ballPrevWait = null;
  if (scene._ballPrev) {
    scene._ballPrev.destroy(true);
    scene._ballPrev = null;
  }
}

export function openBallPreview(scene, fxId) {
  closeBallPreview(scene);
  const row = ballFxOf(fxId);
  if (!row) return;
  const tex = scene.textures.exists(row.tex) ? row.tex : "ball";
  const W = scene.scale.width;
  const H = scene.scale.height;
  const D = 100;
  const cx = W / 2;
  const cy = H / 2;
  const root = scene.add.container(0, 0).setDepth(D);
  scene._ballPrev = root;

  const dim = scene.add.rectangle(cx, cy, W, H, 0x3a2418, 0.5).setInteractive();
  dim.on("pointerdown", () => closeBallPreview(scene));
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
  const hint = scene.add.text(cx, cy - 208, t("shop.fxPrevHint"), {
    fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
  }).setOrigin(0.5);

  const fxG = scene.add.graphics();
  const trail = scene.add.graphics();
  const ball = scene.add.image(cx - 180, cy + 40, tex).setDisplaySize(64, 64);
  const modeLab = scene.add.text(cx, cy + 122, "", {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#0a6a88"
  }).setOrigin(0.5);

  let mode = "hit";
  const pts = [];
  const x0 = cx - 200;
  const x1 = cx + 200;
  const yFloor = cy + 56;
  const size = { hit: 62, smash: 70, ult: 78 };

  const drawTrail = (x, y, pow) => {
    pts.push({ x, y });
    if (pts.length > (pow === "ult" ? 16 : 11)) pts.shift();
    trail.clear();
    for (let i = 0; i < pts.length; i++) {
      const u = (i + 1) / pts.length;
      const p = pts[i];
      trail.fillStyle(row.color, 0.04 + u * 0.22);
      trail.fillCircle(p.x, p.y, 1.2 + u * 1.4);
    }
  };

  const play = (next) => {
    mode = next;
    modeLab.setText(t("shop.fx" + next.charAt(0).toUpperCase() + next.slice(1)));
    if (scene._ballPrevTw && scene._ballPrevTw.stop) scene._ballPrevTw.stop();
    if (scene._ballPrevWait) scene._ballPrevWait.remove(false);
    pts.length = 0;
    trail.clear();
    fxG.clear();
    const s = size[mode] || 62;
    ball.setDisplaySize(s, s);
    ball.setPosition(x0, yFloor);
    ball.setAngle(0);
    const dur = mode === "ult" ? 380 : mode === "smash" ? 520 : 880;
    const peak = mode === "hit" ? 118 : mode === "smash" ? 52 : 28;
    const dummy = { u: 0 };
    scene._ballPrevTw = scene.tweens.add({
      targets: dummy,
      u: 1,
      duration: dur,
      ease: mode === "hit" ? "Sine.easeInOut" : "Cubic.easeIn",
      onUpdate: () => {
        const u = dummy.u;
        const x = x0 + (x1 - x0) * u;
        const y = yFloor - Math.sin(u * Math.PI) * peak;
        ball.setPosition(x, y);
        ball.angle += mode === "ult" ? 22 : mode === "smash" ? 14 : 7;
        drawTrail(x, y, mode);
        drawArmedBallFx(fxG, x, y, s / 2, row, scene.time.now, mode);
      },
      onComplete: () => {
        scene._ballPrevWait = scene.time.delayedCall(420, () => {
          if (scene._ballPrev) play(mode);
        });
      }
    });
  };

  const btnY = cy + 168;
  const hit = makeButton(scene, cx - 190, btnY, 160, 40, t("shop.fxHit"), () => {
    AudioSystem.ui();
    play("hit");
  }, 0x3ad6ff, D + 4);
  const smash = makeButton(scene, cx, btnY, 160, 40, t("shop.fxSmash"), () => {
    AudioSystem.ui();
    play("smash");
  }, 0xff8a3a, D + 4);
  const ult = makeButton(scene, cx + 190, btnY, 160, 40, t("shop.fxUlt"), () => {
    AudioSystem.ui();
    play("ult");
  }, 0x7d5cff, D + 4);
  const close = makeButton(scene, cx, cy + 222, 180, 44, t("nav.back"), () => {
    AudioSystem.ui();
    closeBallPreview(scene);
  }, 0xff8a3a, D + 4);

  root.add([
    dim, panel, court, title, hint, trail, fxG, ball, modeLab,
    hit.gfx, hit.text, hit.bg, smash.gfx, smash.text, smash.bg,
    ult.gfx, ult.text, ult.bg, close.gfx, close.text, close.bg
  ]);
  play("hit");
}
