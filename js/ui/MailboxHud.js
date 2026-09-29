import { makeButton, UI_FONT } from "./Ui.js";
import { Mailbox } from "../systems/Mailbox.js";
import { Friends } from "../systems/Friends.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { avatarKey } from "../data/avatars.js";

function wipe(scene) {
  (scene.mailBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
  scene.mailBits = [];
}

function keep(scene, obj) {
  scene.mailBits.push(obj);
  return obj;
}

export function mountMailboxHud(scene) {
  scene.mailOpen = false;
  scene.mailBits = [];
  scene.mailAt = 0;
  scene.paintMailbox = () => paintMailbox(scene);
  paintMailbox(scene);
  Mailbox.refresh().then(() => {
    if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
  });
}

export function paintMailbox(scene) {
  wipe(scene);
  const W = scene.scale.width;
  const anchor = scene.hubMail || { x: W - 82, y: 48, w: 108, h: 48 };
  const x = anchor.x;
  const y = anchor.y;
  const w = anchor.w || 108;
  const h = anchor.h || 48;
  const unread = Mailbox.unread | 0;
  if (!scene.hubMailSkipChip) {
    const g = keep(scene, scene.add.graphics().setDepth(24));
    const hot = scene.mailOpen;
    g.fillStyle(hot ? 0xffe8c8 : 0xfff6ea, 0.97);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 24);
    g.lineStyle(2, 0xff8ab8, hot ? 1 : 0.78);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 24);
    keep(scene, scene.add.text(x - 26, y, "✉", {
      fontFamily: UI_FONT, fontSize: "18px", color: "#c45a16"
    }).setOrigin(0.5).setDepth(25));
    keep(scene, scene.add.text(x + 12, y, t("mail.title"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(25));
    if (unread > 0) {
      keep(scene, scene.add.circle(x + w / 2 - 10, y - h / 2 + 8, 9, 0xff4a6a, 1).setDepth(26));
      keep(scene, scene.add.text(x + w / 2 - 10, y - h / 2 + 8, unread > 9 ? "9+" : String(unread), {
        fontFamily: UI_FONT, fontSize: "10px", fontStyle: "900", color: "#fff6ea"
      }).setOrigin(0.5).setDepth(27));
    }
    const zone = keep(scene, scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(28));
    zone.on("pointerdown", () => {
      AudioSystem.ui();
      scene.mailOpen = !scene.mailOpen;
      paintMailbox(scene);
    });
  }

  if (!scene.mailOpen) return;

  const items = Mailbox.items || [];
  const panelW = 268;
  const panelX = Math.max(28 + panelW / 2, Math.min(x, scene.scale.width - 28 - panelW / 2));
  const panelH = 232;
  const pg = keep(scene, scene.add.graphics().setDepth(24));
  pg.fillStyle(0xfff6ea, 0.98);
  pg.fillRoundedRect(panelX - panelW / 2, y + 32, panelW, panelH, 18);
  pg.lineStyle(2, 0xff8ab8, 0.7);
  pg.strokeRoundedRect(panelX - panelW / 2, y + 32, panelW, panelH, 18);

  if (!items.length) {
    keep(scene, scene.add.text(panelX, y + 138, t("mail.empty"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7a4a30",
      align: "center", wordWrap: { width: 220 }
    }).setOrigin(0.5).setDepth(25));
    return;
  }

  items.slice(0, 2).forEach((row, i) => {
    const cy = y + 86 + i * 92;
    const invite = row.kind === "friend_invite";
    const season = row.kind === "season";
    const card = keep(scene, scene.add.graphics().setDepth(25));
    card.fillStyle(row.unread ? 0xffe8c8 : 0xfff1dc, 1);
    card.fillRoundedRect(panelX - 122, cy - 40, 244, 84, 14);
    card.lineStyle(1.5, invite ? 0xff8ab8 : 0x3ad6ff, 0.7);
    card.strokeRoundedRect(panelX - 122, cy - 40, 244, 84, 14);
    const avId = row.payload && row.payload.fromAvatar;
    const av = avId && scene.textures.exists(avatarKey(avId)) ? avatarKey(avId) : null;
    if (av) keep(scene, scene.add.image(panelX - 96, cy - 14, av).setDisplaySize(28, 28).setDepth(26));
    keep(scene, scene.add.text(panelX + (av ? 8 : -104), cy - 18, Mailbox.titleOf(row), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#3a2418",
      wordWrap: { width: av ? 150 : 220 }
    }).setOrigin(0, 0.5).setDepth(26));
    if (!invite) {
      keep(scene, scene.add.text(panelX + (av ? 8 : -104), cy + 4, Mailbox.bodyOf(row), {
        fontFamily: UI_FONT, fontSize: "11px", color: "#8a5a38",
        wordWrap: { width: av ? 150 : 220 }
      }).setOrigin(0, 0.5).setDepth(26));
    }
    if (invite) {
      const ok = makeButton(scene, panelX - 40, cy + 22, 88, 26, t("mail.accept"), async () => {
        AudioSystem.ui();
        const res = await Mailbox.respond(row.id, true);
        if (res.ok) await Friends.sync();
        if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
      }, 0xc8ff3a, 30);
      const no = makeButton(scene, panelX + 58, cy + 22, 88, 26, t("mail.decline"), async () => {
        AudioSystem.ui();
        await Mailbox.respond(row.id, false);
        if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
      }, 0xff8ab8, 30);
      scene.mailBits.push(ok.bg, ok.text, ok.gfx, no.bg, no.text, no.gfx);
    } else {
      const done = makeButton(scene, panelX + 58, cy + 22, 88, 26, season ? t("mail.claim") : t("mail.ok"), async () => {
        AudioSystem.ui();
        const res = await Mailbox.archive(row.id);
        if (!res.ok && res.reason === "full") {
          const hint = scene.add.text(panelX, y + 248, t("mail.etherHint"), {
            fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#c45a16",
            align: "center", wordWrap: { width: 240 }
          }).setOrigin(0.5).setDepth(30);
          scene.mailBits.push(hint);
          scene.time.delayedCall(2200, () => { if (hint && hint.destroy) hint.destroy(); });
          return;
        }
        if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
      }, season ? 0xc8ff3a : 0x3ad6ff, 30);
      scene.mailBits.push(done.bg, done.text, done.gfx);
    }
  });
}
