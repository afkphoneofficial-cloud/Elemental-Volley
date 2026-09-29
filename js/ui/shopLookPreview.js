import { makeButton, UI_FONT } from "./Ui.js";
import { t, I18n } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { shopLookOf, shopLookVis, shopLookLabel, SHOP_LOOK_POSES } from "../data/costumeShop.js";

export function closeLookPreview(scene) {
  if (!scene._lookPrev) return;
  scene._lookPrev.destroy(true);
  scene._lookPrev = null;
}

export function openLookPreview(scene, lookId) {
  closeLookPreview(scene);
  const row = shopLookOf(lookId);
  if (!row) return;
  const W = scene.scale.width;
  const H = scene.scale.height;
  const D = 100;
  const root = scene.add.container(0, 0).setDepth(D);
  scene._lookPrev = root;
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x3a2418, 0.5).setInteractive();
  dim.on("pointerdown", () => closeLookPreview(scene));
  const panel = scene.add.rectangle(W / 2, H / 2, 560, 520, 0xfffaf4, 1).setStrokeStyle(3, row.stroke, 0.95).setInteractive();
  const title = scene.add.text(W / 2, H / 2 - 228, shopLookLabel(row, I18n.lang) + "  ·  " + I18n.charName(row.charId), {
    fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5);
  const poseLab = scene.add.text(W / 2, H / 2 + 168, "", {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
  }).setOrigin(0.5);
  const img = scene.add.image(W / 2, H / 2 - 20, "item-shard").setDisplaySize(280, 280);
  let i = 0;
  const show = () => {
    const pose = SHOP_LOOK_POSES[i];
    const k = shopLookVis(lookId, pose.vis);
    const fall = shopLookVis(lookId, "select");
    const use = scene.textures.exists(k) ? k : (scene.textures.exists(fall) ? fall : "item-shard");
    img.setTexture(use).setDisplaySize(280, 280);
    poseLab.setText(t("shop.pose." + pose.id));
  };
  const prev = makeButton(scene, W / 2 - 210, H / 2 - 20, 52, 52, "‹", () => {
    i = (i + SHOP_LOOK_POSES.length - 1) % SHOP_LOOK_POSES.length;
    AudioSystem.ui();
    show();
  }, 0x4aa6e8, D + 4);
  const next = makeButton(scene, W / 2 + 210, H / 2 - 20, 52, 52, "›", () => {
    i = (i + 1) % SHOP_LOOK_POSES.length;
    AudioSystem.ui();
    show();
  }, 0x4aa6e8, D + 4);
  const close = makeButton(scene, W / 2, H / 2 + 220, 180, 44, t("nav.back"), () => {
    AudioSystem.ui();
    closeLookPreview(scene);
  }, 0xff8a3a, D + 4);
  root.add([dim, panel, title, poseLab, img, prev.gfx, prev.text, prev.bg, next.gfx, next.text, next.bg, close.gfx, close.text, close.bg]);
  show();
}
