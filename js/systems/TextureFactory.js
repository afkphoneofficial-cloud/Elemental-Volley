export const TextureFactory = {
  build(scene) {
    this.dot(scene);
    this.ball(scene);
    this.weatherBits(scene);
    this.jumpForms(scene);
    ["ignis", "aqua", "volt", "terra"].forEach((id) => this.fighter(scene, id));
    ["summer", "rain", "spring", "winter"].forEach((s) => this.refFallback(scene, s));
  },

  dot(scene) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture("dot", 12, 12);
    g.destroy();
  },

  ball(scene) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xf4d7a4, 1);
    g.fillCircle(28, 28, 24);
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(28, 28, 24);
    g.lineStyle(2, 0xe08a3a, 1);
    g.beginPath();
    g.moveTo(28, 6);
    g.lineTo(28, 50);
    g.moveTo(8, 28);
    g.lineTo(48, 28);
    g.strokePath();
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(20, 18, 5);
    g.generateTexture("ball", 56, 56);
    g.destroy();
  },

  fighter(scene, id) {
    const pal = {
      ignis: { body: 0xff6a32, ear: 0xffd24a, blush: 0xff8aa8 },
      aqua: { body: 0x4ad6ff, ear: 0xb8f0ff, blush: 0xff9ac8 },
      volt: { body: 0xd8ff3a, ear: 0x7dfff0, blush: 0xff9ac8 },
      terra: { body: 0xe0a24a, ear: 0xffe0a0, blush: 0xff9ac8 }
    }[id];
    const g = scene.make.graphics({ add: false });
    g.fillStyle(pal.ear, 1);
    g.fillEllipse(28, 22, 18, 36);
    g.fillEllipse(68, 22, 18, 36);
    g.fillStyle(pal.body, 1);
    g.fillCircle(48, 58, 34);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 52, 8);
    g.fillCircle(56, 52, 8);
    g.fillStyle(0x1a1020, 1);
    g.fillCircle(41, 53, 4);
    g.fillCircle(57, 53, 4);
    g.fillStyle(pal.blush, 0.7);
    g.fillCircle(30, 62, 5);
    g.fillCircle(66, 62, 5);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(36, 44, 8);
    g.generateTexture("vis_" + id, 96, 96);
    g.destroy();
  },

  refFallback(scene, season) {
    const pal = {
      summer: 0xff9a32,
      rain: 0x4ec8ff,
      spring: 0xff8ab8,
      winter: 0xe8f4ff
    }[season] || 0xff9a32;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(pal, 1);
    g.fillCircle(48, 52, 28);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 46, 7);
    g.fillCircle(56, 46, 7);
    g.fillStyle(0x1a1020, 1);
    g.fillCircle(41, 47, 3);
    g.fillCircle(57, 47, 3);
    g.fillStyle(0xffd24a, 1);
    g.fillCircle(48, 22, 8);
    g.generateTexture("vis_ref_" + season, 96, 96);
    g.destroy();
  },

  applyChibi(scene, srcKey, destKey) {
    if (!scene.textures.exists(srcKey)) return;
    try {
      const img = scene.textures.get(srcKey).getSourceImage();
      if (!img || !img.width) return;
      const w = img.width;
      const h = img.height;
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
        const sat = mx - mn;
        if (mn > 226 && sat < 32) return true;
        if (r > 228 && g > 214 && b > 218 && sat < 42) return true;
        if (sat <= 24 && mx >= 160 && mx <= 252) return true;
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
      if (count < 400) return;
      ctx.putImageData(data, 0, 0);
      const pad = 10;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(w - 1, maxX + pad);
      maxY = Math.min(h - 1, maxY + pad);
      const cw = maxX - minX + 1;
      const ch = maxY - minY + 1;
      const out = document.createElement("canvas");
      out.width = 256;
      out.height = 256;
      out.getContext("2d").drawImage(src, minX, minY, cw, ch, 0, 0, 256, 256);
      if (scene.textures.exists(destKey)) scene.textures.remove(destKey);
      scene.textures.addCanvas(destKey, out);
    } catch (e) {
      /* keep vis_ fallback */
    }
  },

  applyBall(scene, srcKey, destKey) {
    if (!scene.textures.exists(srcKey)) return;
    try {
      const img = scene.textures.get(srcKey).getSourceImage();
      if (!img || !img.width) return;
      const w = img.width;
      const h = img.height;
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
          if (mag || a < 8) {
            px[i + 3] = 0;
          } else if (a > 16) {
            count += 1;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (count < 200) return;
      ctx.putImageData(data, 0, 0);
      const cx = (minX + maxX) * 0.5;
      const cy = (minY + maxY) * 0.5;
      const rad = Math.max(maxX - minX, maxY - minY) * 0.49;
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4;
          const dx = x - cx, dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > rad + 1.5) px[i + 3] = 0;
          else if (d > rad - 1.2) {
            const t = 1 - (d - (rad - 1.2)) / 2.7;
            px[i + 3] = Math.max(0, Math.min(255, (px[i + 3] * t) | 0));
          }
        }
      }
      ctx.putImageData(data, 0, 0);
      const pad = 6;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(w - 1, maxX + pad);
      maxY = Math.min(h - 1, maxY + pad);
      const out = document.createElement("canvas");
      out.width = 256;
      out.height = 256;
      out.getContext("2d").drawImage(src, minX, minY, maxX - minX + 1, maxY - minY + 1, 0, 0, 256, 256);
      if (scene.textures.exists(destKey)) scene.textures.remove(destKey);
      scene.textures.addCanvas(destKey, out);
    } catch (e) { /* keep drawn ball */ }
  },

  copyCanvas(scene, srcKey, destKey) {
    if (!scene.textures.exists(srcKey)) return;
    try {
      const img = scene.textures.get(srcKey).getSourceImage();
      if (!img) return;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      if (scene.textures.exists(destKey)) scene.textures.remove(destKey);
      scene.textures.addCanvas(destKey, c);
    } catch (e) { /* skip */ }
  },

  mirror(scene, srcKey, destKey, overwrite = false) {
    if (!scene.textures.exists(srcKey)) return;
    if (scene.textures.exists(destKey)) {
      if (!overwrite) return;
      scene.textures.remove(destKey);
    }
    try {
      const img = scene.textures.get(srcKey).getSourceImage();
      if (!img) return;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      scene.textures.addCanvas(destKey, c);
    } catch (e) { /* skip */ }
  },

  detectFacing(scene, key) {
    if (!scene.textures.exists(key)) return "left";
    try {
      const img = scene.textures.get(key).getSourceImage();
      if (!img || !img.width) return "left";
      const w = img.width;
      const h = img.height;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, w, h).data;
      let leftEye = 0;
      let rightEye = 0;
      const y0 = (h * 0.16) | 0;
      const y1 = (h * 0.52) | 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4;
          if (d[i + 3] > 90 && d[i] < 72 && d[i + 1] < 72 && d[i + 2] < 72) {
            if (x < w / 2) leftEye += 1;
            else rightEye += 1;
          }
        }
      }
      if (leftEye + rightEye >= 10) return leftEye >= rightEye ? "left" : "right";

      let minX = w;
      let maxX = 0;
      let sumX = 0;
      let n = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = 0; x < w; x += 1) {
          if (d[(y * w + x) * 4 + 3] > 48) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            sumX += x;
            n += 1;
          }
        }
      }
      if (n < 20) return "left";
      const cx = sumX / n;
      const leftSpan = cx - minX;
      const rightSpan = maxX - cx;
      return rightSpan > leftSpan * 1.12 ? "right" : "left";
    } catch (e) {
      return "left";
    }
  },

  makeNetFacing(scene, id) {
    const src = "vis_" + id;
    const faceRight = "vis_" + id + "_r";
    const faceLeft = "vis_" + id + "_l";
    const face = this.detectFacing(scene, src);
    if (face === "right") {
      this.copyCanvas(scene, src, faceRight);
      this.mirror(scene, src, faceLeft, true);
    } else {
      this.copyCanvas(scene, src, faceLeft);
      this.mirror(scene, src, faceRight, true);
    }
  },

  weatherBits(scene) {
    const drop = scene.make.graphics({ add: false });
    drop.fillStyle(0xa8e8ff, 0.9);
    drop.fillRect(0, 0, 2, 10);
    drop.generateTexture("wx-drop", 2, 10);
    drop.destroy();
    const flake = scene.make.graphics({ add: false });
    flake.fillStyle(0xffffff, 0.95);
    flake.fillCircle(4, 4, 3);
    flake.generateTexture("wx-flake", 8, 8);
    flake.destroy();
    const petal = scene.make.graphics({ add: false });
    petal.fillStyle(0xff9ac8, 0.95);
    petal.fillEllipse(5, 4, 8, 5);
    petal.generateTexture("wx-petal", 10, 8);
    petal.destroy();
    const heat = scene.make.graphics({ add: false });
    heat.fillStyle(0xffe08a, 0.35);
    heat.fillEllipse(6, 10, 10, 18);
    heat.generateTexture("wx-heat", 12, 20);
    heat.destroy();
  },

  jumpForms(scene) {
    const fire = scene.make.graphics({ add: false });
    fire.fillStyle(0xff3300, 1);
    fire.fillEllipse(24, 28, 36, 44);
    fire.fillStyle(0xff8a1a, 1);
    fire.fillEllipse(24, 26, 24, 32);
    fire.fillStyle(0xffe08a, 1);
    fire.fillEllipse(24, 22, 12, 16);
    fire.fillStyle(0xfff6d0, 0.9);
    fire.fillCircle(20, 18, 4);
    fire.generateTexture("jump-fire", 48, 48);
    fire.destroy();
    const water = scene.make.graphics({ add: false });
    water.fillStyle(0x1aa0e0, 1);
    water.fillEllipse(24, 28, 28, 36);
    water.fillCircle(24, 14, 12);
    water.fillStyle(0x7ae8ff, 1);
    water.fillEllipse(24, 26, 18, 24);
    water.fillStyle(0xffffff, 0.7);
    water.fillCircle(18, 16, 5);
    water.generateTexture("jump-water", 48, 48);
    water.destroy();
  }
};
