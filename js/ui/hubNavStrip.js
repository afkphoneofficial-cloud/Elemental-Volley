import { UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { ChatSystem } from "../systems/ChatSystem.js";
import { HUB_NAV } from "./hubLayout.js";

function keep(scene, obj) {
  if (!scene.hubNavBits) scene.hubNavBits = [];
  scene.hubNavBits.push(obj);
  return obj;
}

function wipe(scene) {
  (scene.hubNavBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
  scene.hubNavBits = [];
}

export function mountHubNav(scene) {
  scene.paintHubNav = () => paintHubNav(scene);
  paintHubNav(scene);
  ChatSystem.bindHub(scene);
}

export function paintHubNav(scene) {
  wipe(scene);
  const W = scene.scale.width;
  const H = scene.scale.height;
  const bw = HUB_NAV.w;
  const bh = HUB_NAV.h;
  const pad = 12;
  const pw = bw + pad * 2;
  const ph = bh + 18;
  const x = W / 2;
  const y = H - HUB_NAV.y;

  const shell = keep(scene, scene.add.graphics().setDepth(18));
  shell.fillStyle(0xfff6ea, 1);
  shell.fillRoundedRect(x - pw / 2, y - ph / 2, pw, ph, 18);
  shell.lineStyle(3, 0xff6a22, 1);
  shell.strokeRoundedRect(x - pw / 2, y - ph / 2, pw, ph, 18);

  const gfx = keep(scene, scene.add.graphics().setDepth(20));
  const draw = (hot) => {
    gfx.clear();
    gfx.fillStyle(hot ? 0xffe0b0 : 0xfff6ea, 0.96);
    gfx.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 18);
    gfx.lineStyle(2, 0x3ad6ff, hot ? 1 : 0.78);
    gfx.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 18);
  };
  draw(false);
  scene.chatLabel = keep(scene, scene.add.text(x, y, t("chat.title"), {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
  }).setOrigin(0.5).setDepth(21));
  keep(scene, scene.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(22)
    .on("pointerover", () => draw(true))
    .on("pointerout", () => draw(false))
    .on("pointerdown", () => {
      AudioSystem.ui();
      ChatSystem.setOpen(!ChatSystem.open);
    }));
  ChatSystem.bindHub(scene);
}
