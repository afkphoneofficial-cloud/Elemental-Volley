import { makeButton, UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";

function squareBtn(scene, x, y, label, onClick, depth) {
  const w = 44;
  const h = 44;
  const gfx = scene.add.graphics().setDepth(depth);
  const draw = (hot) => {
    gfx.clear();
    gfx.fillStyle(hot ? 0xb8dcff : 0x8ec8ff, 1);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    gfx.lineStyle(2, 0x3a7ad4, hot ? 1 : 0.85);
    gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  };
  draw(false);
  const text = scene.add.text(x, y - 1, label, {
    fontFamily: UI_FONT, fontSize: label.length > 1 ? "16px" : "22px", fontStyle: "900", color: "#1a3a78"
  }).setOrigin(0.5).setDepth(depth + 1);
  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 2);
  zone.on("pointerover", () => draw(true));
  zone.on("pointerout", () => draw(false));
  zone.on("pointerdown", onClick);
  return [gfx, text, zone];
}

function dropQtyInput(scene) {
  if (scene._shopQtyPlace) {
    window.removeEventListener("resize", scene._shopQtyPlace);
    if (window.visualViewport) window.visualViewport.removeEventListener("resize", scene._shopQtyPlace);
    if (scene.scale && scene.scale.off) scene.scale.off("resize", scene._shopQtyPlace);
    scene._shopQtyPlace = null;
  }
  if (scene._shopQtyInput) {
    scene._shopQtyInput.remove();
    scene._shopQtyInput = null;
  }
}

export function closeShopBuy(scene) {
  dropQtyInput(scene);
  if (!scene._shopBuy) return;
  scene._shopBuy.destroy(true);
  scene._shopBuy = null;
}

function placeQtyInput(scene, el, gx, gy, gw, gh) {
  const canvas = scene.game && scene.game.canvas;
  if (!canvas || !el) return;
  const r = canvas.getBoundingClientRect();
  const sx = r.width / scene.scale.width;
  const sy = r.height / scene.scale.height;
  el.style.left = (r.left + gx * sx) + "px";
  el.style.top = (r.top + gy * sy) + "px";
  el.style.width = (gw * sx) + "px";
  el.style.height = (gh * sy) + "px";
  el.style.fontSize = Math.max(14, Math.round(22 * sy)) + "px";
}

export function openShopBuy(scene, spec) {
  closeShopBuy(scene);
  const W = scene.scale.width;
  const H = scene.scale.height;
  const cx = W / 2;
  const cy = H / 2;
  const stack = spec.stack !== false;
  const unit = Math.max(1, spec.unitPrice | 0);
  const have = Math.max(0, spec.have | 0);
  const cap = Math.max(1, spec.maxQty | 0);
  const maxQty = stack ? Math.max(1, Math.min(cap, Math.max(1, Math.floor(have / unit) || 1))) : 1;
  let qty = 1;
  const D = 90;
  const root = scene.add.container(0, 0).setDepth(D);
  scene._shopBuy = root;

  const dim = scene.add.rectangle(cx, cy, W, H, 0x3a2418, 0.46).setInteractive().setDepth(D);
  dim.on("pointerdown", () => closeShopBuy(scene));
  const pw = 560;
  const ph = stack ? 448 : 400;
  const panel = scene.add.rectangle(cx, cy, pw, ph, 0xfffaf4, 1).setStrokeStyle(3, 0xe8c8a8, 0.95).setInteractive().setDepth(D);
  const bits = [dim, panel];

  const ix = cx - pw / 2 + 86;
  const iy = cy - ph / 2 + 86;
  const well = scene.add.graphics().setDepth(D);
  well.fillStyle(0xfff3e4, 1);
  well.fillRoundedRect(ix - 56, iy - 56, 112, 112, 16);
  bits.push(well);
  if (spec.icon && scene.textures.exists(spec.icon)) {
    bits.push(scene.add.image(ix, iy, spec.icon).setDisplaySize(96, 96).setDepth(D));
  }
  if (spec.paintIcon) {
    const extra = spec.paintIcon(ix, iy, D + 1);
    if (extra) bits.push(extra);
  }

  bits.push(scene.add.text(cx - pw / 2 + 160, cy - ph / 2 + 36, spec.title, {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a6aaa"
  }).setOrigin(0, 0.5).setDepth(D));
  bits.push(scene.add.text(cx - pw / 2 + 160, cy - ph / 2 + 72, t("shop.buyType"), {
    fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#8aa4c8"
  }).setOrigin(0, 0.5).setDepth(D));
  bits.push(scene.add.text(cx - pw / 2 + 250, cy - ph / 2 + 72, spec.kind || "-", {
    fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
  }).setOrigin(0, 0.5).setDepth(D));
  bits.push(scene.add.text(cx + pw / 2 - 150, cy - ph / 2 + 72, t("shop.buyOwned"), {
    fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#8aa4c8"
  }).setOrigin(0, 0.5).setDepth(D));
  bits.push(scene.add.text(cx + pw / 2 - 36, cy - ph / 2 + 72, String(spec.owned | 0), {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5).setDepth(D));

  bits.push(scene.add.text(cx, cy - ph / 2 + 168, spec.body || "", {
    fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#4a6a9a",
    align: "left", wordWrap: { width: pw - 64 }
  }).setOrigin(0.5, 0).setDepth(D));

  const qtyY = cy + (stack ? 36 : 52);
  const qtyLabel = scene.add.text(cx - 168, qtyY, t("shop.buyQty"), {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
  }).setOrigin(0.5).setDepth(D);
  bits.push(qtyLabel);
  const fieldW = 78;
  const fieldH = 44;
  const fieldX = cx + 8;
  const field = scene.add.graphics().setDepth(D);
  field.fillStyle(0xfff6ea, 1);
  field.fillRoundedRect(fieldX - fieldW / 2, qtyY - fieldH / 2, fieldW, fieldH, 10);
  field.lineStyle(2, 0xe8c8a8, 0.95);
  field.strokeRoundedRect(fieldX - fieldW / 2, qtyY - fieldH / 2, fieldW, fieldH, 10);
  bits.push(field);
  const qtyNum = scene.add.text(fieldX, qtyY, "1", {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5).setDepth(D);
  qtyNum.setVisible(!stack);
  bits.push(qtyNum);

  const payY = qtyY + 52;
  bits.push(scene.add.text(cx - 168, payY, t("shop.buyPay"), {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
  }).setOrigin(0.5).setDepth(D));
  const payIcon = spec.priceIcon && scene.textures.exists(spec.priceIcon)
    ? scene.add.image(cx - 28, payY, spec.priceIcon).setDisplaySize(28, 28).setDepth(D)
    : null;
  if (payIcon) bits.push(payIcon);
  const payNum = scene.add.text(cx + 18, payY, String(unit), {
    fontFamily: UI_FONT, fontSize: "20px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0, 0.5).setDepth(D);
  bits.push(payNum);

  const paintQty = (fromInput) => {
    qtyNum.setText(String(qty));
    if (scene._shopQtyInput && !fromInput) scene._shopQtyInput.value = String(qty);
    const total = unit * qty;
    payNum.setText(String(total));
    payNum.setColor(have >= total ? "#3a2418" : "#c43a3a");
  };

  const applyTyped = (raw, clampEmpty) => {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) {
      if (clampEmpty) {
        qty = 1;
        paintQty();
      } else {
        payNum.setText("—");
        payNum.setColor("#c43a3a");
      }
      return digits;
    }
    qty = Math.max(1, Math.min(maxQty, parseInt(digits, 10) || 1));
    paintQty(true);
    if (scene._shopQtyInput && String(qty) !== digits) scene._shopQtyInput.value = String(qty);
    return String(qty);
  };

  if (stack) {
    bits.push(...squareBtn(scene, cx - 64, qtyY, "−", () => {
      qty = Math.max(1, qty - 1);
      paintQty();
      AudioSystem.ui();
    }, D));
    bits.push(...squareBtn(scene, cx + 80, qtyY, "+", () => {
      qty = Math.min(maxQty, qty + 1);
      paintQty();
      AudioSystem.ui();
    }, D));
    bits.push(...squareBtn(scene, cx + 132, qtyY, "↑", () => {
      qty = maxQty;
      paintQty();
      AudioSystem.ui();
    }, D));
    const input = document.createElement("input");
    input.id = "shop-qty-input";
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = 3;
    input.value = "1";
    input.setAttribute("aria-label", t("shop.buyQty"));
    document.body.appendChild(input);
    scene._shopQtyInput = input;
    const place = () => placeQtyInput(scene, input, fieldX - fieldW / 2, qtyY - fieldH / 2, fieldW, fieldH);
    scene._shopQtyPlace = place;
    place();
    window.addEventListener("resize", place);
    scene.scale.on("resize", place);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", place);
    input.addEventListener("pointerdown", (e) => e.stopPropagation());
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        applyTyped(input.value, true);
        okZone();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeShopBuy(scene);
      }
    });
    input.addEventListener("input", () => {
      input.value = applyTyped(input.value, false);
    });
    input.addEventListener("blur", () => applyTyped(input.value, true));
    setTimeout(() => input.select(), 0);
  }

  const finishBuy = () => {
    applyTyped(scene._shopQtyInput ? scene._shopQtyInput.value : String(qty), true);
    const res = spec.onConfirm(qty);
    if (res && res.ok === false) {
      AudioSystem.error();
      return;
    }
    if (res === false) {
      AudioSystem.error();
      return;
    }
    AudioSystem.ui();
    closeShopBuy(scene);
    if (spec.after) spec.after(qty, res);
  };
  const okZone = finishBuy;
  const cancel = makeButton(scene, cx - 110, cy + ph / 2 - 40, 180, 48, t("shop.buyCancel"), () => {
    AudioSystem.ui();
    closeShopBuy(scene);
  }, 0xff8a3a, D + 4);
  const ok = makeButton(scene, cx + 110, cy + ph / 2 - 40, 180, 48, t("shop.buyOk"), finishBuy, 0x4aa6e8, D + 4);
  bits.push(cancel.gfx, cancel.text, cancel.bg, ok.gfx, ok.text, ok.bg);
  root.add(bits);
  paintQty();
}

export function shopNote(scene, text, ok) {
  if (!scene || !text) return;
  const W = scene.scale.width;
  const H = scene.scale.height;
  const msg = scene.add.text(W / 2, H - 56, text, {
    fontFamily: UI_FONT,
    fontSize: "18px",
    fontStyle: "800",
    color: ok === false ? "#c45a16" : "#1a7a48",
    backgroundColor: "#fff6ea",
    padding: { x: 18, y: 10 },
    align: "center",
    wordWrap: { width: Math.min(920, W - 80) }
  }).setOrigin(0.5).setDepth(80);
  scene.time.delayedCall(2200, () => { if (msg && msg.destroy) msg.destroy(); });
}
