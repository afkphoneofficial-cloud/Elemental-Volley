import { makeButton, UI_FONT } from "./Ui.js";
import { t, I18n } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { shopLookOf, shopLookLabel, shopLookPoseTexture, SHOP_LOOK_POSES } from "../data/costumeShop.js";

export function closeLookPreview(scene) {
  if (!scene._lookPrev) return;
  scene._lookPrev.destroy(true);
  scene._lookPrev = null;
}

export function openLookPreview(scene, lookId) {
  closeLookPreview(scene);
  const row = shopLookOf(lookId);
  if (!row) return;
  const poses = SHOP_LOOK_POSES.filter((pose) => shopLookPoseTexture(scene, lookId, pose));
  if (!poses.length) return;
  const W = scene.scale.width;
  const H = scene.scale.height;
  const D = 100;
  const cx = W / 2;
  const cy = H / 2;
  const root = scene.add.container(0, 0).setDepth(D);
  scene._lookPrev = root;
  const dim = scene.add.rectangle(cx, cy, W, H, 0x3a2418, 0.5).setInteractive();
  dim.on("pointerdown", () => closeLookPreview(scene));
  const panel = scene.add.rectangle(cx, cy, 560, 520, 0xfffaf4, 1).setStrokeStyle(3, row.stroke, 0.95).setInteractive();
  const title = scene.add.text(cx, cy - 228, shopLookLabel(row, I18n.lang) + "  ·  " + I18n.charName(row.charId), {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5);
  const poseLab = scene.add.text(cx, cy + 168, "", {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
  }).setOrigin(0.5);
  let img = scene.add.image(cx, cy - 20, poses[0] ? shopLookPoseTexture(scene, lookId, poses[0]) : "item-shard");
  img.setDisplaySize(280, 280);
  let i = 0;
  const show = () => {
    const pose = poses[i];
    const use = shopLookPoseTexture(scene, lookId, pose) || "item-shard";
    const nextImg = scene.add.image(cx, cy - 20, use);
    nextImg.setDisplaySize(280, 280);
    const at = root.getIndex(img);
    root.addAt(nextImg, at < 0 ? root.length : at);
    img.destroy();
    img = nextImg;
    poseLab.setText(t("shop.pose." + pose.id) + "  ·  " + (i + 1) + "/" + poses.length);
  };
  const prev = makeButton(scene, cx - 210, cy - 20, 52, 52, "‹", () => {
    i = (i + poses.length - 1) % poses.length;
    AudioSystem.ui();
    show();
  }, 0x4aa6e8, D + 4);
  const next = makeButton(scene, cx + 210, cy - 20, 52, 52, "›", () => {
    i = (i + 1) % poses.length;
    AudioSystem.ui();
    show();
  }, 0x4aa6e8, D + 4);
  const close = makeButton(scene, cx, cy + 220, 180, 44, t("nav.back"), () => {
    AudioSystem.ui();
    closeLookPreview(scene);
  }, 0xff8a3a, D + 4);
  root.add([dim, panel, title, poseLab, img, prev.gfx, prev.text, prev.bg, next.gfx, next.text, next.bg, close.gfx, close.text, close.bg]);
  show();
}
