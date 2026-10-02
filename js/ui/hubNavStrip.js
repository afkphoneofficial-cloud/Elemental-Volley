import { AudioSystem } from "../systems/AudioSystem.js";
import { ChatSystem } from "../systems/ChatSystem.js?v=local269";
import { Presence } from "../systems/Presence.js?v=local269";
import { t } from "../i18n/I18n.js";
import { UI_FONT } from "./Ui.js";
import { HUB_NAV, HUB_CHAT, HUB_ONLINE_W, HUB_ONLINE_H } from "./hubLayout.js?v=local179";

function keep(scene, obj) {
  if (!scene.hubNavBits) scene.hubNavBits = [];
  scene.hubNavBits.push(obj);
  return obj;
}

function wipe(scene) {
  if (scene.onlineGlow) scene.tweens.killTweensOf(scene.onlineGlow);
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

function paintOnlineLabel(scene) {
  if (!scene.onlineText || !scene.sys || !scene.sys.isActive()) return;
  scene.onlineText.setText(t("hub.online", { n: Presence.shown() }));
}

export function mountHubNav(scene) {
  scene.paintHubNav = () => paintHubNav(scene);
  scene.paintChatBadge = () => paintBadge(scene);
  if (!scene._onOnline) {
    scene._onOnline = () => paintOnlineLabel(scene);
    Presence.on(scene._onOnline);
  }
  paintHubNav(scene);
  ChatSystem.bindHub(scene);
  Presence.poll();
}

export function paintHubNav(scene) {
  wipe(scene);
  const W = scene.scale.width;
  const H = scene.scale.height;
  const bw = HUB_CHAT.w;
  const bh = HUB_CHAT.h;
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
    fontFamily: UI_FONT, fontSize: "11px", fontStyle: "900", color: "#fff6ea"
  }).setOrigin(0.5).setDepth(24));
  keep(scene, scene.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(22)
    .on("pointerover", () => draw(true))
    .on("pointerout", () => draw(false))
    .on("pointerdown", () => {
      AudioSystem.ui();
      ChatSystem.setOpen(!ChatSystem.open);
    }));

  const ow = HUB_ONLINE_W;
  const oh = HUB_ONLINE_H;
  const ox = x + bw / 2 + HUB_CHAT.gap + ow / 2;
  const oy = y + (bh - oh) / 2;
  const glow = keep(scene, scene.add.graphics().setDepth(19));
  glow.lineStyle(8, 0x8cff7a, 0.28);
  glow.strokeRoundedRect(ox - ow / 2 - 4, oy - oh / 2 - 4, ow + 8, oh + 8, 16);
  glow.lineStyle(4, 0xb8ff9a, 0.45);
  glow.strokeRoundedRect(ox - ow / 2 - 1, oy - oh / 2 - 1, ow + 2, oh + 2, 13);
  scene.onlineGlow = glow;
  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.4, to: 1 },
    duration: 1100,
    yoyo: true,
    repeat: -1
  });
  const og = keep(scene, scene.add.graphics().setDepth(20));
  og.lineStyle(2, 0x9dff88, 0.95);
  og.strokeRoundedRect(ox - ow / 2, oy - oh / 2, ow, oh, 12);
  const oIcon = scene.textures.exists("vis_icon_online") ? "vis_icon_online" : (scene.textures.exists("vis_icon_friends") ? "vis_icon_friends" : "");
  if (oIcon) {
    keep(scene, scene.add.image(ox - ow / 2 + 16, oy, oIcon).setDisplaySize(20, 20).setTint(0x3dcc6a).setDepth(21));
  }
  scene.onlineText = keep(scene, scene.add.text(ox - ow / 2 + 30, oy, t("hub.online", { n: Presence.shown() }), {
    fontFamily: UI_FONT, fontSize: "11px", fontStyle: "800", color: "#1a7a3a"
  }).setOrigin(0, 0.5).setDepth(21));

  paintBadge(scene);
  ChatSystem.bindHub(scene);
}
