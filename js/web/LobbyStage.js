/** Cute looping mini-rally behind the game frame. Uses existing sprite assets. */

const CHAR_IDS = ["ignis", "aqua", "volt", "terra"];
const COURTS = ["summer", "rain", "spring", "winter"];

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
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
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

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  const drawSprite = (key, x, y, size, rot = 0, alpha = 1) => {
    const im = arts[key];
    if (!im) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(im, -size / 2, -size, size, size);
    ctx.restore();
  };

  const loop = (now) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, W, H);

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
    const leftX = g.left > 88 ? g.left - 6 : 70;
    const rightX = W - g.right > 88 ? g.right + 6 : W - 70;
    const midX = (leftX + rightX) * 0.5;
    const charSize = Math.max(100, Math.min(150, Math.max(g.left, W - g.right, 110) * 1.15));
    const rally = reduced ? 0.5 : (t % 2.35) / 2.35;
    const goingRight = Math.floor(t / 2.35) % 2 === 0;
    const u = goingRight ? rally : 1 - rally;
    const ballX = leftX + (rightX - leftX) * u;
    const topBand = Math.max(52, g.top);
    const ballY = topBand - 8 - Math.sin(u * Math.PI) * Math.min(42, Math.max(18, topBand * 0.42));
    const hitL = (!goingRight && rally < 0.14) || (goingRight && rally > 0.86);
    const hitR = (goingRight && rally < 0.14) || (!goingRight && rally > 0.86);

    spark.forEach((p) => {
      const y = ((p.y + t * p.sp) % 1.15) - 0.08;
      ctx.fillStyle = p.hue;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(p.x * W, y * H, p.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (g.top > 70) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 246, 234, 0.4)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(midX, 18);
      ctx.lineTo(midX, g.top - 8);
      ctx.stroke();
      ctx.restore();
    }

    const bob = (k) => reduced ? 0 : Math.sin(t * 3.2 + k) * 7;
    const squashL = hitL ? 0.86 : 1;
    const squashR = hitR ? 0.86 : 1;
    const jumpL = hitL ? -18 : bob(0);
    const jumpR = hitR ? -18 : bob(1.7);

    drawSprite("volt_r" , 72, ground + bob(2.2), charSize * 0.72, 0, 0.92);
    drawSprite("terra_l", W - 72, ground + bob(3.1), charSize * 0.72, 0, 0.92);
    drawSprite("ignis_r", leftX, ground + jumpL, charSize * squashL);
    drawSprite("aqua_l", rightX, ground + jumpR, charSize * squashR);

    const season = courtA;
    drawSprite("ref_" + season, midX, Math.max(86, g.top - 6) + bob(0.4), 86, 0, 0.95);

    const ball = arts.ball;
    if (ball) {
      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(t * 4.2 * (goingRight ? 1 : -1));
      ctx.drawImage(ball, -28, -28, 56, 56);
      ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(ballX, ground - 6, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduced) raf = requestAnimationFrame(loop);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduced) raf = requestAnimationFrame(loop);
  });

  if (reduced) loop(performance.now());
  else raf = requestAnimationFrame(loop);
}
