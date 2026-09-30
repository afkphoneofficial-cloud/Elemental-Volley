import { makeButton, UI_FONT } from "./Ui.js";
import { paintGiftIcons, giftParts } from "./giftIcons.js?v=local216";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";

export function openRewardPop(scene, opt) {
  const o = opt || {};
  const gift = o.gift || {};
  const W = scene.scale.width;
  const H = scene.scale.height;
  const Z = o.depth || 180;
  const parts = giftParts(gift);
  const n = Math.max(1, parts.length);
  const boxW = Math.min(640, Math.max(440, 160 + n * 88));
  const boxH = o.sub ? 420 : 380;
  const bits = [];
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.55).setDepth(Z).setInteractive();
  const panel = scene.add.graphics().setDepth(Z + 1);
  panel.fillStyle(0xfff6ea, 0.98);
  panel.fillRoundedRect(W / 2 - boxW / 2, H / 2 - boxH / 2, boxW, boxH, 24);
  panel.lineStyle(3, 0x3ad6ff, 0.9);
  panel.strokeRoundedRect(W / 2 - boxW / 2, H / 2 - boxH / 2, boxW, boxH, 24);
  bits.push(dim, panel);
  bits.push(scene.add.text(W / 2, H / 2 - boxH / 2 + 48, o.title || t("topup.gotTitle"), {
    fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#1a1008"
  }).setOrigin(0.5).setDepth(Z + 2));
  if (o.sub) {
    bits.push(scene.add.text(W / 2, H / 2 - boxH / 2 + 88, o.sub, {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#0a6a88",
      align: "center", wordWrap: { width: boxW - 48 }
    }).setOrigin(0.5).setDepth(Z + 2));
  }
  const iconY = H / 2 + (o.sub ? 8 : -8);
  paintGiftIcons(scene, W / 2, iconY, gift, { size: 72, gap: 92, depth: Z + 3, fontSize: "16px" }).forEach((x) => bits.push(x));
  bits.push(scene.add.text(W / 2, H / 2 + boxH / 2 - 88, t("topup.gotDone"), {
    fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#146b32"
  }).setOrigin(0.5).setDepth(Z + 2));
  const wipe = () => {
    bits.forEach((x) => { if (x && x.destroy) x.destroy(); });
    if (o.onClose) o.onClose();
  };
  dim.on("pointerdown", () => { AudioSystem.ui(); wipe(); });
  const ok = makeButton(scene, W / 2, H / 2 + boxH / 2 - 42, 180, 42, t("career.close"), () => {
    AudioSystem.ui();
    wipe();
  }, 0x3ad6ff, Z + 4);
  bits.push(ok.bg, ok.text, ok.gfx);
  return wipe;
}
