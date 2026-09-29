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

function paintBadge(scene) {
  if (!scene.chatBadge || !scene.chatBadgeBg) return;
  const n = ChatSystem.unread | 0;
  const on = n > 0 && !ChatSystem.open;
  scene.chatBadgeBg.setVisible(on);
  scene.chatBadge.setVisible(on);
  if (on) scene.chatBadge.setText(n > 9 ? "9+" : String(n));
}

export function mountHubNav(scene) {
  scene.paintHubNav = () => paintHubNav(scene);
  scene.paintChatBadge = () => paintBadge(scene);
  paintHubNav(scene);
  ChatSystem.bindHub(scene);
}

export function paintHubNav(scene) {
  wipe(scene);
  const W = scene.scale.width;
  const H = scene.scale.height;
  const bw = 72;
  const bh = 72;
  const x = W / 2;
  const y = H - HUB_NAV.y;

  const gfx = keep(scene, scene.add.graphics().setDepth(20));
  const draw = (hot) => {
    gfx.clear();
    gfx.fillStyle(hot ? 0xffe0b0 : 0xfff6ea, 0.96);
    gfx.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 18);
    gfx.lineStyle(2, 0x3ad6ff, hot ? 1 : 0.78);
    gfx.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 18);
  };
  draw(false);
  const icon = scene.textures.exists("vis_icon_chat") ? "vis_icon_chat" : (scene.textures.exists("icon-chat") ? "icon-chat" : "");
  scene.chatLabel = null;
  if (icon) {
    keep(scene, scene.add.image(x, y, icon).setDisplaySize(44, 44).setDepth(21));
  }
  scene.chatBadgeBg = keep(scene, scene.add.circle(x + 22, y - 22, 11, 0xff4a6a, 1).setDepth(23));
  scene.chatBadge = keep(scene, scene.add.text(x + 22, y - 22, "", {
    fontFamily: "Kanit, Segoe UI, sans-serif", fontSize: "11px", fontStyle: "900", color: "#fff6ea"
  }).setOrigin(0.5).setDepth(24));
  keep(scene, scene.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(22)
    .on("pointerover", () => draw(true))
    .on("pointerout", () => draw(false))
    .on("pointerdown", () => {
      AudioSystem.ui();
      ChatSystem.setOpen(!ChatSystem.open);
    }));
  paintBadge(scene);
  ChatSystem.bindHub(scene);
}
