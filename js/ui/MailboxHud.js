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
  const x = W - 162;
  const y = 118;
  const unread = Mailbox.unread | 0;
  const g = keep(scene, scene.add.graphics().setDepth(24));
  const hot = scene.mailOpen;
  g.fillStyle(hot ? 0xffe8c8 : 0xfff6ea, 0.97);
  g.fillRoundedRect(x - 134, y - 26, 268, 52, 22);
  g.lineStyle(2, 0xff8ab8, hot ? 1 : 0.78);
  g.strokeRoundedRect(x - 134, y - 26, 268, 52, 22);
  keep(scene, scene.add.text(x - 108, y, "✉", {
    fontFamily: UI_FONT, fontSize: "22px", color: "#c45a16"
  }).setOrigin(0.5).setDepth(25));
  keep(scene, scene.add.text(x - 8, y, t("mail.title"), {
    fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
  }).setOrigin(0.5).setDepth(25));
  if (unread > 0) {
    keep(scene, scene.add.circle(x + 108, y - 14, 11, 0xff4a6a, 1).setDepth(26));
    keep(scene, scene.add.text(x + 108, y - 14, unread > 9 ? "9+" : String(unread), {
      fontFamily: UI_FONT, fontSize: "11px", fontStyle: "900", color: "#fff6ea"
    }).setOrigin(0.5).setDepth(27));
  }
  const zone = keep(scene, scene.add.zone(x, y, 268, 52).setInteractive({ useHandCursor: true }).setDepth(28));
  zone.on("pointerdown", () => {
    AudioSystem.ui();
    scene.mailOpen = !scene.mailOpen;
    paintMailbox(scene);
  });

  if (!scene.mailOpen) return;

  const items = Mailbox.items || [];
  const panelH = 214;
  const pg = keep(scene, scene.add.graphics().setDepth(24));
  pg.fillStyle(0xfff6ea, 0.98);
  pg.fillRoundedRect(x - 134, y + 32, 268, panelH, 18);
  pg.lineStyle(2, 0xff8ab8, 0.7);
  pg.strokeRoundedRect(x - 134, y + 32, 268, panelH, 18);

  if (!items.length) {
    keep(scene, scene.add.text(x, y + 138, t("mail.empty"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#7a4a30",
      align: "center", wordWrap: { width: 220 }
    }).setOrigin(0.5).setDepth(25));
    return;
  }

  items.slice(0, 2).forEach((row, i) => {
    const cy = y + 86 + i * 92;
    const invite = row.kind === "friend_invite";
    const card = keep(scene, scene.add.graphics().setDepth(25));
    card.fillStyle(row.unread ? 0xffe8c8 : 0xfff1dc, 1);
    card.fillRoundedRect(x - 122, cy - 40, 244, 84, 14);
    card.lineStyle(1.5, invite ? 0xff8ab8 : 0x3ad6ff, 0.7);
    card.strokeRoundedRect(x - 122, cy - 40, 244, 84, 14);
    const avId = row.payload && row.payload.fromAvatar;
    const av = avId && scene.textures.exists(avatarKey(avId)) ? avatarKey(avId) : null;
    if (av) keep(scene, scene.add.image(x - 96, cy - 14, av).setDisplaySize(28, 28).setDepth(26));
    keep(scene, scene.add.text(x + (av ? 8 : -104), cy - 18, Mailbox.titleOf(row), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#3a2418",
      wordWrap: { width: av ? 150 : 220 }
    }).setOrigin(0, 0.5).setDepth(26));
    if (!invite) {
      keep(scene, scene.add.text(x + (av ? 8 : -104), cy + 4, Mailbox.bodyOf(row), {
        fontFamily: UI_FONT, fontSize: "11px", color: "#8a5a38",
        wordWrap: { width: av ? 150 : 220 }
      }).setOrigin(0, 0.5).setDepth(26));
    }
    if (invite) {
      const ok = makeButton(scene, x - 40, cy + 22, 88, 26, t("mail.accept"), async () => {
        AudioSystem.ui();
        const res = await Mailbox.respond(row.id, true);
        if (res.ok) await Friends.sync();
        if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
      }, 0xc8ff3a, 30);
      const no = makeButton(scene, x + 58, cy + 22, 88, 26, t("mail.decline"), async () => {
        AudioSystem.ui();
        await Mailbox.respond(row.id, false);
        if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
      }, 0xff8ab8, 30);
      scene.mailBits.push(ok.bg, ok.text, ok.gfx, no.bg, no.text, no.gfx);
    } else {
      const done = makeButton(scene, x + 58, cy + 22, 88, 26, t("mail.ok"), async () => {
        AudioSystem.ui();
        await Mailbox.archive(row.id);
        if (scene.sys && scene.sys.isActive()) paintMailbox(scene);
      }, 0x3ad6ff, 30);
      scene.mailBits.push(done.bg, done.text, done.gfx);
    }
  });
}
