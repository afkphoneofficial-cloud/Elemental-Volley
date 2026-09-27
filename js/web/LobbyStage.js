/** Cute looping mini-rally behind the game frame. Uses existing sprite assets. */

const CHAR_IDS = ["ignis", "aqua", "volt", "terra"];
const COURTS = ["summer", "rain", "spring", "winter"];
const ULT_FX = {
  ignis: { glow: "rgba(255, 90, 31, 0.55)", rim: "#ff6a22", bits: ["#ff5a1f", "#ffd24a", "#fff4e8"] },
  aqua: { glow: "rgba(58, 214, 255, 0.5)", rim: "#3ad6ff", bits: ["#2aa0ff", "#ffffff", "#6ee7ff"] },
  volt: { glow: "rgba(200, 255, 58, 0.5)", rim: "#c8ff3a", bits: ["#e8ff00", "#ffffff", "#c8ff3a"] },
  terra: { glow: "rgba(224, 162, 74, 0.5)", rim: "#e0a24a", bits: ["#c87830", "#ffc070", "#fff0d0"] }
};

function punchChibi(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const ctx = src.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const isBg = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
    if (a < 12) return true;
    if (r >= 170 && b >= 90 && g <= 145 && (r - g) >= 40) return true;
    const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
    if (mn > 226 && mx - mn < 32) return true;
    if (r > 228 && g > 214 && b > 218 && mx - mn < 42) return true;
    return false;
  };
  const seen = new Uint8Array(w * h);
  const q = [];
  const enq = (x, y) => {
    if (x >= 0 && y >= 0 && x < w && y < h) q.push(y * w + x);
  };
  for (let x = 0; x < w; x += 1) { enq(x, 0); enq(x, h - 1); }
  for (let y = 0; y < h; y += 1) { enq(0, y); enq(w - 1, y); }
  while (q.length) {
    const p = q.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!isBg(i)) continue;
    px[i + 3] = 0;
    const x = p % w;
    const y = (p / w) | 0;
    enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
  }
  let minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (px[i + 3] > 16) {
        count += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count < 80) return null;
  ctx.putImageData(data, 0, 0);
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = 256;
  out.height = 256;
  out.getContext("2d").drawImage(src, minX, minY, maxX - minX + 1, maxY - minY + 1, 0, 0, 256, 256);
  return out;
}

function punchBall(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const ctx = src.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  let minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
      const mag = r >= 170 && b >= 90 && g <= 145 && (r - g) >= 40;
      if (mag || a < 8) px[i + 3] = 0;
      else if (a > 16) {
        count += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count < 40) return null;
  ctx.putImageData(data, 0, 0);
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const rad = Math.max(maxX - minX, maxY - minY) * 0.5;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const d = Math.hypot(x - cx, y - cy);
      if (d > rad + 1) px[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  const out = document.createElement("canvas");
  out.width = 128;
  out.height = 128;
  out.getContext("2d").drawImage(src, minX, minY, maxX - minX + 1, maxY - minY + 1, 0, 0, 128, 128);
  return out;
}

function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function mountLobbyStage() {
  const canvas = document.getElementById("lobby-bg");
  const fgCanvas = document.getElementById("lobby-fg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const fg = fgCanvas ? fgCanvas.getContext("2d") : null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const arts = {};
  await Promise.all([
    ...CHAR_IDS.flatMap((id) => [
      loadImg("assets/sprites/" + id + "-right.png").then((im) => { arts[id + "_r"] = im ? punchChibi(im) : null; }),
      loadImg("assets/sprites/" + id + "-left.png").then((im) => { arts[id + "_l"] = im ? punchChibi(im) : null; }),
      loadImg("assets/sprites/" + id + ".png").then((im) => { arts[id] = im ? punchChibi(im) : null; })
    ]),
    loadImg("assets/sprites/ball.png").then((im) => { arts.ball = im ? punchBall(im) : null; }),
    ...COURTS.map((s) => loadImg("assets/sprites/court-" + s + ".png").then((im) => { arts["court_" + s] = im; })),
    ...COURTS.map((s) => loadImg("assets/sprites/ref-" + s + ".png").then((im) => { arts["ref_" + s] = im ? punchChibi(im) : null; }))
  ]);

  const spark = Array.from({ length: 28 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    s: 1.4 + Math.random() * 2.6,
    sp: 0.08 + Math.random() * 0.18,
    hue: ["#ff8a3a", "#4ad6ff", "#c8ff3a", "#e0a24a", "#ffe8c8"][i % 5]
  }));

  let raf = 0;
  let start = performance.now();
  let lastNow = start;
  const flyer = {
    x: window.innerWidth * 0.5,
    y: 72,
    vx: 160,
    vy: 70,
    rot: 0,
    id: CHAR_IDS[(Math.random() * 4) | 0],
    nextSwap: 10,
    bits: []
  };

  function fitCanvas(node, context) {
    if (!node || !context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    node.width = Math.floor(window.innerWidth * dpr);
    node.height = Math.floor(window.innerHeight * dpr);
    node.style.width = window.innerWidth + "px";
    node.style.height = window.innerHeight + "px";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function size() {
    fitCanvas(canvas, ctx);
    fitCanvas(fgCanvas, fg);
  }
  size();
  window.addEventListener("resize", size);

  const drawSprite = (target, key, x, y, size, rot = 0, alpha = 1) => {
    const im = arts[key];
    if (!im || !target) return;
    target.save();
    target.globalAlpha = alpha;
    target.translate(x, y);
    target.rotate(rot);
    target.drawImage(im, -size / 2, -size, size, size);
    target.restore();
  };

  const pickUlt = () => {
    let id = CHAR_IDS[(Math.random() * CHAR_IDS.length) | 0];
    if (CHAR_IDS.length > 1) {
      let guard = 0;
      while (id === flyer.id && guard < 8) {
        id = CHAR_IDS[(Math.random() * CHAR_IDS.length) | 0];
        guard += 1;
      }
    }
    flyer.id = id;
  };

  const burstBits = (n) => {
    const pal = ULT_FX[flyer.id] || ULT_FX.ignis;
    for (let i = 0; i < n; i += 1) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 180;
      flyer.bits.push({
        x: flyer.x,
        y: flyer.y,
        vx: Math.cos(ang) * spd,
        vy: flyer.id === "ignis" ? -30 - Math.random() * 90 : Math.sin(ang) * spd,
        life: 0.45 + Math.random() * 0.55,
        c: pal.bits[i % pal.bits.length],
        r: 2 + Math.random() * 5
      });
    }
  };

  const loop = (now) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    ctx.clearRect(0, 0, W, H);
    if (fg) fg.clearRect(0, 0, W, H);

    const courtA = COURTS[Math.floor(t / 16) % 4];
    const courtB = COURTS[Math.floor(t / 16 + 1) % 4];
    const mix = reduced ? 0 : (t / 16) % 1;
    const drawCourt = (key, a) => {
      const im = arts["court_" + key];
      if (!im || a < 0.02) return;
      ctx.save();
      ctx.globalAlpha = 0.5 * a;
      const scale = Math.max(W / im.naturalWidth, H / im.naturalHeight);
      const dw = im.naturalWidth * scale;
      const dh = im.naturalHeight * scale;
      ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();
    };
    drawCourt(courtA, 1 - mix);
    drawCourt(courtB, mix);

    const game = document.getElementById("game");
    const g = game ? game.getBoundingClientRect() : { left: W * 0.18, right: W * 0.82, top: H * 0.12, bottom: H * 0.82, width: W * 0.64, height: H * 0.7 };
    const ground = Math.min(H - 28, g.bottom + 18);
    const leftX = g.left > 88 ? g.left - 8 : 70;
    const rightX = W - g.right > 88 ? g.right + 8 : W - 70;
    const midX = (g.left + g.right) * 0.5;
    const charSize = Math.max(100, Math.min(150, Math.max(g.left, W - g.right, 110) * 1.15));
    const hitPulse = reduced ? 0 : (Math.sin(t * 4.2) + 1) * 0.5;
    const hitL = hitPulse > 0.86;
    const hitR = hitPulse < 0.14;

    spark.forEach((p) => {
      const y = ((p.y + t * p.sp) % 1.15) - 0.08;
      ctx.fillStyle = p.hue;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(p.x * W, y * H, p.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const layer = fg || ctx;
    const bob = (k) => reduced ? 0 : Math.sin(t * 3.2 + k) * 7;
    const squashL = hitL ? 0.86 : 1;
    const squashR = hitR ? 0.86 : 1;
    const jumpL = hitL ? -18 : bob(0);
    const jumpR = hitR ? -18 : bob(1.7);

    drawSprite(layer, "volt_r", 72, ground + bob(2.2), charSize * 0.72, 0, 0.92);
    drawSprite(layer, "terra_l", W - 72, ground + bob(3.1), charSize * 0.72, 0, 0.92);
    drawSprite(layer, "ignis_r", leftX, ground + jumpL, charSize * squashL);
    drawSprite(layer, "aqua_l", rightX, ground + jumpR, charSize * squashR);
    drawSprite(layer, "ref_" + courtA, midX, Math.max(86, g.top - 6) + bob(0.4), 148, 0, 0.95);

    const box = { x0: 40, y0: 36, x1: W - 40, y1: Math.max(110, Math.min(H * 0.5, (g.top || H * 0.5) - 16)) };
    if (!reduced) {
      flyer.vx += Math.sin(t * 0.7) * 18 * dt + (Math.random() - 0.5) * 40 * dt;
      flyer.vy += Math.cos(t * 0.93) * 16 * dt + (Math.random() - 0.5) * 36 * dt;
      const spd = Math.hypot(flyer.vx, flyer.vy);
      if (spd < 90) {
        flyer.vx *= 1.04;
        flyer.vy *= 1.04;
      } else if (spd > 240) {
        flyer.vx *= 0.96;
        flyer.vy *= 0.96;
      }
      flyer.x += flyer.vx * dt;
      flyer.y += flyer.vy * dt;
      if (flyer.x < box.x0) { flyer.x = box.x0; flyer.vx = Math.abs(flyer.vx); }
      if (flyer.x > box.x1) { flyer.x = box.x1; flyer.vx = -Math.abs(flyer.vx); }
      if (flyer.y < box.y0) { flyer.y = box.y0; flyer.vy = Math.abs(flyer.vy); }
      if (flyer.y > box.y1) { flyer.y = box.y1; flyer.vy = -Math.abs(flyer.vy); }
      flyer.rot += (flyer.vx * 0.02) * dt;
      flyer.nextSwap -= dt;
      if (flyer.nextSwap <= 0) {
        pickUlt();
        burstBits(28);
        flyer.nextSwap = 10;
      }
      flyer.spawn = (flyer.spawn || 0) + dt;
      if (flyer.spawn > 0.045) {
        burstBits(2);
        flyer.spawn = 0;
      }
      if (flyer.bits.length > 90) flyer.bits.splice(0, flyer.bits.length - 90);
    }

    const pal = ULT_FX[flyer.id] || ULT_FX.ignis;
    for (let i = flyer.bits.length - 1; i >= 0; i -= 1) {
      const b = flyer.bits[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (flyer.id === "ignis") b.vy -= 40 * dt;
      if (flyer.id === "aqua") b.vy += 30 * dt;
      b.life -= dt * 1.6;
      if (b.life <= 0) flyer.bits.splice(i, 1);
      else {
        layer.globalAlpha = Math.max(0, b.life);
        layer.fillStyle = b.c;
        layer.beginPath();
        layer.arc(b.x, b.y, b.r * b.life, 0, Math.PI * 2);
        layer.fill();
      }
    }
    layer.globalAlpha = 1;

    layer.save();
    const pulse = 26 + Math.sin(t * 6) * 6;
    const glow = layer.createRadialGradient(flyer.x, flyer.y, 6, flyer.x, flyer.y, pulse + 18);
    glow.addColorStop(0, pal.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    layer.fillStyle = glow;
    layer.beginPath();
    layer.arc(flyer.x, flyer.y, pulse + 18, 0, Math.PI * 2);
    layer.fill();
    if (flyer.id === "volt" && Math.random() < 0.14) {
      layer.strokeStyle = pal.rim;
      layer.lineWidth = 2;
      layer.beginPath();
      layer.moveTo(flyer.x, flyer.y);
      let lx = flyer.x;
      let ly = flyer.y;
      for (let k = 0; k < 4; k += 1) {
        lx += (Math.random() - 0.5) * 28;
        ly += 10 + Math.random() * 16;
        layer.lineTo(lx, ly);
      }
      layer.stroke();
    }
    if (flyer.id === "aqua") {
      layer.strokeStyle = pal.rim;
      layer.lineWidth = 2;
      layer.globalAlpha = 0.55;
      layer.beginPath();
      layer.arc(flyer.x, flyer.y, 22 + (t * 40) % 18, 0, Math.PI * 2);
      layer.stroke();
      layer.globalAlpha = 1;
    }
    if (arts.ball) {
      layer.save();
      layer.translate(flyer.x, flyer.y);
      layer.rotate(flyer.rot);
      layer.drawImage(arts.ball, -28, -28, 56, 56);
      layer.beginPath();
      layer.arc(0, 0, 27, 0, Math.PI * 2);
      layer.strokeStyle = pal.rim;
      layer.lineWidth = 4;
      layer.stroke();
      layer.restore();
    }
    layer.restore();

    if (!reduced) raf = requestAnimationFrame(loop);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduced) raf = requestAnimationFrame(loop);
  });

  if (reduced) loop(performance.now());
  else raf = requestAnimationFrame(loop);
}
