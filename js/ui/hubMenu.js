import { UI_FONT } from "./Ui.js";
import { t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { Mailbox } from "../systems/Mailbox.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { avatarKey } from "../data/avatars.js";
import { hubMenuY, HUB_MENU } from "./hubLayout.js?v=local170";

const D = 92;

function keep(scene, obj) {
  if (!scene.hubMenuBits) scene.hubMenuBits = [];
  scene.hubMenuBits.push(obj);
  return obj;
}

function wipe(scene) {
  (scene.hubMenuBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
  scene.hubMenuBits = [];
}

function setOpen(scene, open) {
  scene.hubMenuOpen = Boolean(open);
  if (!open) scene.mailOpen = false;
  paintHubMenu(scene);
  if (scene.paintMailbox) scene.paintMailbox();
}

function pic(scene, x, y, key, size) {
  const k = scene.textures.exists(key) ? key : "";
  if (!k) return null;
  return keep(scene, scene.add.image(x, y, k).setDisplaySize(size, size).setDepth(D + 3));
}

function drawMenuGlyph(g, x, y, hot) {
  const s = 13;
  const gap = 5;
  const r = 5;
  const fill = hot ? 0xff8a3a : 0xff6a22;
  g.fillStyle(fill, 1);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([cx, cy]) => {
    g.fillRoundedRect(x + cx * (s + gap) / 2 - s / 2, y + cy * (s + gap) / 2 - s / 2, s, s, r);
  });
}

export function mountHubMenu(scene) {
  scene.hubMenuOpen = false;
  scene.hubMailSkipChip = true;
  scene.paintHubMenu = () => paintHubMenu(scene);
  paintHubMenu(scene);
}

export function paintHubMenu(scene) {
  wipe(scene);
  const open = Boolean(scene.hubMenuOpen);
  const bx = HUB_MENU.x;
  const by = hubMenuY();
  const tabW = HUB_MENU.w;
  const tabH = HUB_MENU.h;

  const tab = keep(scene, scene.add.graphics().setDepth(D));
  const drawTab = (hot) => {
    tab.clear();
    tab.fillStyle(hot || open ? 0xffe8c8 : 0xfff6ea, 1);
    tab.fillRoundedRect(bx - tabW / 2, by - tabH / 2, tabW, tabH, 16);
    tab.lineStyle(3, 0xff6a22, 1);
    tab.strokeRoundedRect(bx - tabW / 2, by - tabH / 2, tabW, tabH, 16);
    drawMenuGlyph(tab, bx, by - 10, hot || open);
  };
  drawTab(false);
  keep(scene, scene.add.text(bx, by + 22, t("hub.menuFold"), {
    fontFamily: UI_FONT, fontSize: "12px", fontStyle: "900", color: "#3a2418"
  }).setOrigin(0.5).setDepth(D + 2));
  const unread = Mailbox.unread | 0;
  if (unread > 0) {
    keep(scene, scene.add.circle(bx + tabW / 2 - 8, by - tabH / 2 + 8, 8, 0xff4a6a, 1).setDepth(D + 4));
    keep(scene, scene.add.text(bx + tabW / 2 - 8, by - tabH / 2 + 8, unread > 9 ? "9+" : String(unread), {
      fontFamily: UI_FONT, fontSize: "10px", fontStyle: "900", color: "#fff6ea"
    }).setOrigin(0.5).setDepth(D + 5));
  }
  keep(scene, scene.add.zone(bx, by, tabW, tabH).setInteractive({ useHandCursor: true }).setDepth(D + 6)
    .on("pointerover", () => drawTab(true))
    .on("pointerout", () => drawTab(false))
    .on("pointerdown", () => {
      AudioSystem.ui();
      setOpen(scene, !open);
    }));

  scene.hubMail = { x: 220, y: 130, w: 200, h: 42 };
  if (!open) return;

  const save = SaveSystem.data;
  const avId = save.avatarId;
  const entries = [
    { label: t("hub.navNews"), icon: "vis_icon_news", go: () => scene.scene.start("news") },
    { label: unread ? t("mail.title") + " " + unread : t("mail.title"), icon: "vis_icon_mail", go: () => {
      scene.mailOpen = !scene.mailOpen;
      if (scene.paintMailbox) scene.paintMailbox();
    } },
    { label: t("career.title"), icon: avatarKey(avId), go: () => scene.scene.start("career") },
    { label: t("hub.navGrowth"), icon: "item-fruit", go: () => scene.scene.start("growth") },
    { label: t("hub.navBag"), icon: "item-bag", go: () => scene.scene.start("bag") },
    { label: t("hub.navDress"), icon: "vis_icon_mirror", go: () => scene.scene.start("dress") },
    { label: t("hub.navShop"), icon: "vis_icon_shop", go: () => scene.scene.start("shop") },
    { label: t("hub.navMap"), icon: "vis_icon_map", go: () => scene.scene.start("wiki", { from: "hub" }) },
    { label: t("hub.navFriends"), icon: "vis_icon_friends", go: () => scene.scene.start("friends") },
    { label: t("hub.navSet"), icon: "vis_icon_settings", go: () => scene.scene.start("settings", { from: "hub" }) }
  ];

  const cols = 2;
  const cellW = 92;
  const cellH = 92;
  const gap = 8;
  const pad = 12;
  const rows = Math.ceil(entries.length / cols);
  const pw = pad * 2 + cols * cellW + (cols - 1) * gap;
  const ph = pad * 2 + rows * cellH + (rows - 1) * gap;
  const px = 16 + pw / 2;
  const py = by + tabH / 2 + 10 + ph / 2;

  const panel = keep(scene, scene.add.graphics().setDepth(D));
  panel.fillStyle(0xfff6ea, 1);
  panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
  panel.lineStyle(3, 0xff6a22, 1);
  panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);

  scene.hubMail = { x: px + pw / 2 + 148, y: py - ph / 2 + 48, w: 240, h: 42 };

  entries.forEach((row, i) => {
    const col = i % cols;
    const r = Math.floor(i / cols);
    const x = px - pw / 2 + pad + cellW / 2 + col * (cellW + gap);
    const y = py - ph / 2 + pad + cellH / 2 + r * (cellH + gap);
    const g = keep(scene, scene.add.graphics().setDepth(D + 1));
    const draw = (hot) => {
      g.clear();
      g.fillStyle(hot ? 0xffe0b0 : 0xfff3e4, 1);
      g.fillRoundedRect(x - cellW / 2, y - cellH / 2, cellW, cellH, 16);
      g.lineStyle(2, hot ? 0xff6a22 : 0xe8c8a8, 1);
      g.strokeRoundedRect(x - cellW / 2, y - cellH / 2, cellW, cellH, 16);
    };
    draw(false);
    pic(scene, x, y - 12, row.icon, 40);
    keep(scene, scene.add.text(x, y + 28, row.label, {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#3a2418",
      align: "center", wordWrap: { width: cellW - 8 }
    }).setOrigin(0.5).setDepth(D + 3));
    keep(scene, scene.add.zone(x, y, cellW, cellH).setInteractive({ useHandCursor: true }).setDepth(D + 4)
      .on("pointerover", () => draw(true))
      .on("pointerout", () => draw(false))
      .on("pointerdown", () => {
        AudioSystem.ui();
        row.go();
      }));
  });
}
