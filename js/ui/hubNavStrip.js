import { UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { ChatSystem } from "../systems/ChatSystem.js";
import { HUB_NAV } from "./hubLayout.js";

const SHOW = 3;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function inBox(scene, p) {
  const b = scene.hubNavBox;
  if (!b || !p) return false;
  return p.x >= b.l && p.x <= b.r && p.y >= b.t && p.y <= b.b;
}

function keep(scene, obj) {
  if (!scene.hubNavBits) scene.hubNavBits = [];
  scene.hubNavBits.push(obj);
  return obj;
}

function wipe(scene) {
  (scene.hubNavBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
  scene.hubNavBits = [];
}

function navItems(scene) {
  return [
    { id: "chat", label: t("chat.title"), color: 0x3ad6ff, go: () => ChatSystem.setOpen(!ChatSystem.open) },
    { id: "friends", label: t("hub.navFriends"), color: 0xff8ab8, go: () => scene.scene.start("friends") },
    { id: "shop", label: t("hub.navShop"), color: 0xc8ff3a, go: () => scene.scene.start("shop") },
    { id: "map", label: t("hub.navMap"), color: 0xffb14a, go: () => scene.scene.start("wiki", { from: "hub" }) },
    { id: "set", label: t("hub.navSet"), color: 0xffe08a, go: () => scene.scene.start("settings", { from: "hub" }) }
  ];
}

function shift(scene, dir) {
  const n = navItems(scene).length;
  scene.hubNavAt = mod((scene.hubNavAt | 0) + dir, n);
  AudioSystem.ui();
  paintHubNav(scene);
}

export function mountHubNav(scene) {
  scene.hubNavAt = 0;
  scene.hubNavDrag = 0;
  scene.paintHubNav = () => paintHubNav(scene);
  scene._hubNavWheel = (pointer, _over, dx, dy) => {
    if (!scene.sys || !scene.sys.isActive() || !inBox(scene, pointer)) return;
    if (pointer.event && pointer.event.preventDefault) pointer.event.preventDefault();
    const now = Date.now();
    if (now - (scene.hubNavWheelAt || 0) < 160) return;
    const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (Math.abs(d) < 8) return;
    scene.hubNavWheelAt = now;
    shift(scene, d > 0 ? 1 : -1);
  };
  scene._hubNavDown = (p) => {
    if (!inBox(scene, p)) return;
    scene.hubNavStartX = p.x;
    scene.hubNavDrag = 0;
  };
  scene._hubNavMove = (p) => {
    if (scene.hubNavStartX == null) return;
    scene.hubNavDrag = Math.abs(p.x - scene.hubNavStartX);
  };
  scene._hubNavUp = (p) => {
    if (scene.hubNavStartX == null) return;
    const dx = p.x - scene.hubNavStartX;
    scene.hubNavStartX = null;
    if (Math.abs(dx) < 36) return;
    shift(scene, dx < 0 ? 1 : -1);
  };
  scene.input.on("wheel", scene._hubNavWheel);
  scene.input.on("pointerdown", scene._hubNavDown);
  scene.input.on("pointermove", scene._hubNavMove);
  scene.input.on("pointerup", scene._hubNavUp);
  scene.events.once("shutdown", () => {
    scene.input.off("wheel", scene._hubNavWheel);
    scene.input.off("pointerdown", scene._hubNavDown);
    scene.input.off("pointermove", scene._hubNavMove);
    scene.input.off("pointerup", scene._hubNavUp);
  });
  paintHubNav(scene);
  ChatSystem.bindHub(scene);
}

export function paintHubNav(scene) {
  wipe(scene);
  const W = scene.scale.width;
  const H = scene.scale.height;
  const items = navItems(scene);
  const n = items.length;
  const at = mod(scene.hubNavAt | 0, n);
  const bw = HUB_NAV.w;
  const bh = HUB_NAV.h;
  const gap = HUB_NAV.gap;
  const pad = 14;
  const pw = pad * 2 + SHOW * bw + (SHOW - 1) * gap;
  const ph = bh + 22;
  const x = W / 2;
  const y = H - HUB_NAV.y;
  scene.hubNavBox = { l: x - pw / 2, r: x + pw / 2, t: y - ph / 2, b: y + ph / 2 };

  const shell = keep(scene, scene.add.graphics().setDepth(18));
  shell.fillStyle(0xfff6ea, 1);
  shell.fillRoundedRect(x - pw / 2, y - ph / 2, pw, ph, 18);
  shell.lineStyle(3, 0xff6a22, 1);
  shell.strokeRoundedRect(x - pw / 2, y - ph / 2, pw, ph, 18);

  scene.chatLabel = null;
  for (let k = 0; k < SHOW; k += 1) {
    const row = items[mod(at + k, n)];
    const bx = x - pw / 2 + pad + bw / 2 + k * (bw + gap);
    const gfx = keep(scene, scene.add.graphics().setDepth(20));
    const draw = (hot) => {
      gfx.clear();
      gfx.fillStyle(hot ? 0xffe0b0 : 0xfff6ea, 0.96);
      gfx.fillRoundedRect(bx - bw / 2, y - bh / 2, bw, bh, 18);
      gfx.lineStyle(2, row.color, hot ? 1 : 0.78);
      gfx.strokeRoundedRect(bx - bw / 2, y - bh / 2, bw, bh, 18);
    };
    draw(false);
    const label = keep(scene, scene.add.text(bx, y, row.label, {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(21));
    keep(scene, scene.add.zone(bx, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(22)
      .on("pointerover", () => draw(true))
      .on("pointerout", () => draw(false))
      .on("pointerup", () => {
        if ((scene.hubNavDrag | 0) > 24) return;
        AudioSystem.ui();
        row.go();
      }));
    if (row.id === "chat") scene.chatLabel = label;
  }
  ChatSystem.bindHub(scene);
}
