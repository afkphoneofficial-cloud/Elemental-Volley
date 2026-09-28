import { t } from "../i18n/I18n.js";

export const UI_FONT = "Kanit, Segoe UI, sans-serif";

export function makeButton(scene, x, y, w, h, label, onClick, color = 0xff6a22, depth = 40) {
  const gfx = scene.add.graphics().setDepth(depth);
  const draw = (hover) => {
    gfx.clear();
    gfx.fillStyle(hover ? 0xffe0b0 : 0xfff6ea, 0.96);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, Math.min(18, h / 2));
    gfx.lineStyle(2, color, hover ? 1 : 0.78);
    gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, Math.min(18, h / 2));
    if (hover) {
      gfx.lineStyle(6, color, 0.2);
      gfx.strokeRoundedRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, Math.min(20, h / 2 + 2));
    }
  };
  draw(false);
  const text = scene.add.text(x, y, label, {
    fontFamily: UI_FONT,
    fontSize: h >= 58 ? "22px" : h >= 52 ? "20px" : "16px",
    fontStyle: "800",
    color: "#3a2418"
  }).setOrigin(0.5).setDepth(depth + 1);
  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 2);
  zone.on("pointerover", () => draw(true));
  zone.on("pointerout", () => draw(false));
  zone.on("pointerdown", onClick);
  return { bg: zone, text, gfx };
}

export function makeChoiceButton(scene, x, y, w, h, label, kind, onClick, depth = 40) {
  const yes = kind === "yes";
  const fill = yes ? 0x7af3c2 : 0xffb0c8;
  const fillHot = yes ? 0x9affd8 : 0xffc8d8;
  const line = yes ? 0x2aa87a : 0xe06a8a;
  const gfx = scene.add.graphics().setDepth(depth);
  const draw = (hover) => {
    gfx.clear();
    gfx.fillStyle(0x3a2418, 0.16);
    gfx.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 5, w, h, 22);
    gfx.fillStyle(hover ? fillHot : fill, 1);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    gfx.lineStyle(4, line, hover ? 1 : 0.88);
    gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    gfx.fillStyle(0xffffff, hover ? 0.38 : 0.28);
    gfx.fillRoundedRect(x - w / 2 + 10, y - h / 2 + 6, w - 20, 12, 8);
  };
  draw(false);
  const mark = scene.add.text(x - w / 2 + 28, y - 1, yes ? "✦" : "✕", {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: yes ? "#146048" : "#7a2040"
  }).setOrigin(0.5).setDepth(depth + 1);
  const text = scene.add.text(x + 10, y, label, {
    fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: yes ? "#146048" : "#7a2040"
  }).setOrigin(0.5).setDepth(depth + 1);
  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 2);
  zone.on("pointerover", () => draw(true));
  zone.on("pointerout", () => draw(false));
  zone.on("pointerdown", onClick);
  return { bg: zone, text, gfx, mark };
}

export function makeSlider(scene, x, y, w, value01, onChange) {
  const g = scene.add.graphics().setDepth(40);
  const knob = scene.add.circle(0, y, 13, 0xff6a22).setDepth(41);
  const paint = (v) => {
    const clamped = Math.max(0, Math.min(1, v));
    g.clear();
    g.fillStyle(0xffe8c8, 1);
    g.fillRoundedRect(x - w / 2, y - 7, w, 14, 7);
    g.fillStyle(0xff8a3a, 1);
    g.fillRoundedRect(x - w / 2, y - 7, w * clamped, 14, 7);
    knob.setPosition(x - w / 2 + w * clamped, y);
    return clamped;
  };
  paint(value01);
  const fromPx = (px) => {
    const v = paint((px - (x - w / 2)) / w);
    onChange(v);
  };
  knob.setInteractive({ useHandCursor: true, draggable: true });
  scene.input.setDraggable(knob);
  knob.on("drag", (_p, dragX) => fromPx(dragX));
  const zone = scene.add.zone(x, y, w + 24, 32).setInteractive({ useHandCursor: true }).setDepth(42);
  zone.on("pointerdown", (p) => fromPx(p.worldX));
  return { g, knob, zone, paint };
}

export function roundPanel(scene, x, y, w, h, stroke = 0xff8a3a, fill = 0x120e18) {
  const gfx = scene.add.graphics().setDepth(4);
  gfx.fillStyle(fill, 0.9);
  gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
  gfx.lineStyle(1.5, stroke, 0.55);
  gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
  return gfx;
}

export function drawGrid(scene) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  scene.add.rectangle(W / 2, H / 2, W, H, 0xfff1dc);
  const g = scene.add.graphics();
  g.fillStyle(0xff9a4a, 0.22);
  g.fillCircle(W * 0.18, -40, 260);
  g.fillStyle(0x7ad4ff, 0.2);
  g.fillCircle(W * 0.86, H + 40, 300);
  g.fillStyle(0xffe08a, 0.16);
  g.fillCircle(W * 0.5, H * 0.35, 220);
  g.lineStyle(1, 0xc45a16, 0.07);
  for (let x = 0; x <= W; x += 72) g.lineBetween(x, 0, x, H);
  for (let y = 0; y <= H; y += 72) g.lineBetween(0, y, W, y);
}

export function makeChibiPlate(scene, x, y, opts) {
  const g = scene.add.graphics().setDepth(11);
  const w = 276;
  const h = 118;
  g.fillStyle(0xffffff, 0.18);
  g.fillCircle(x - 70, y + 8, 52);
  g.fillCircle(x + 78, y + 12, 46);
  g.fillCircle(x, y - 6, 58);
  g.fillStyle(opts.fill, 0.92);
  g.fillCircle(x - 72, y + 4, 48);
  g.fillCircle(x + 76, y + 8, 42);
  g.fillCircle(x + 8, y - 10, 54);
  g.fillRoundedRect(x - w / 2, y - 28, w, 78, 32);
  g.lineStyle(5, opts.stroke, 0.85);
  g.strokeRoundedRect(x - w / 2, y - 28, w, 78, 32);
  g.fillStyle(0xffffff, 0.22);
  g.fillCircle(x - 88, y - 22, 10);

  const faceKey = opts.faceKey;
  const face = scene.add.image(x - 92, y + 4, faceKey).setDisplaySize(78, 78).setDepth(13);
  const hoop = scene.add.circle(x - 92, y + 4, 40, 0xffffff, 0).setStrokeStyle(4, opts.stroke, 0.9).setDepth(13);
  const score = scene.add.text(x + 8, y - 18, "0", {
    fontFamily: UI_FONT, fontSize: "36px", fontStyle: "900", color: "#3a2418",
    stroke: "#fff6ea", strokeThickness: 6
  }).setOrigin(0.5).setDepth(13);
  const tag = scene.add.text(x + 8, y + 14, opts.tag, {
    fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: opts.you ? "#c45a16" : "#4a6080"
  }).setOrigin(0.5).setDepth(13);
  const ready = scene.add.text(x + 8, y - 52, t("play.ultReady"), {
    fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#c45a16"
  }).setOrigin(0.5).setDepth(14).setAlpha(0);
  const pips = [];
  for (let i = 0; i < 4; i += 1) {
    const px = x - 36 + i * 26;
    const py = y + 44;
    const bg = scene.add.circle(px, py, 11, 0xfff4e8, 1).setStrokeStyle(3, opts.stroke, 0.7).setDepth(13);
    const fill = scene.add.circle(px, py, 8, opts.pip, 1).setDepth(14).setScale(0.01);
    pips.push({ bg, fill, x: px, y: py });
  }
  return { g, face, hoop, score, tag, ready, pips, x, y, wasFull: false, pipColor: opts.pip };
}

export function paintChibiPips(plate, filled, full, armed, now, burned) {
  plate.pips.forEach((p, i) => {
    const frac = Math.max(0, Math.min(1, filled - i));
    const on = frac > 0.02;
    p.fill.setScale(on ? Math.max(0.22, frac) : 0.01);
    p.fill.setAlpha(on ? 0.4 + frac * 0.6 : 0);
    if (burned) p.fill.setFillStyle(0xff6a22, 1);
    else p.fill.setFillStyle(plate.pipColor, 1);
    if (full) {
      const b = 1 + Math.sin(now / 140 + i) * 0.12;
      p.bg.setScale(b);
      p.fill.setScale(on ? b * Math.max(0.22, frac) : 0.01);
    } else {
      p.bg.setScale(1);
    }
  });
  if (full) {
    const pulse = 0.55 + Math.abs(Math.sin(now / 150)) * 0.45;
    plate.ready.setAlpha(pulse);
    plate.ready.setText(armed ? t("play.fireUlt") : t("play.ultReady"));
    plate.hoop.setStrokeStyle(4, 0xffe08a, pulse);
  } else {
    plate.ready.setAlpha(0);
    plate.hoop.setStrokeStyle(4, 0xffd6a0, 0.9);
  }
}

