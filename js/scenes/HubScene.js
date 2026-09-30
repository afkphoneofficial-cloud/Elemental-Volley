import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { I18n, t, charName } from "../i18n/I18n.js";
import { formatEtherWait } from "../systems/Ether.js";
import { ROSTER_IDS } from "../data/roster.js";
import { texHeroSelect, champAuraTier } from "../data/seasonLooks.js";
import { paintSkinAura } from "../fx/SkinAura.js";
import { mountMailboxHud } from "../ui/MailboxHud.js";
import { Mailbox } from "../systems/Mailbox.js";
import { Friends } from "../systems/Friends.js";
import { ChatSystem } from "../systems/ChatSystem.js";
import { NetPlay } from "../systems/NetPlay.js";
import { Leaderboard } from "../systems/Leaderboard.js";
import { mountHubBoardWidgets, paintHubBoardFx } from "../ui/hubBoards.js";
import { mountHubMenu } from "../ui/hubMenu.js";
import { mountHubNav } from "../ui/hubNavStrip.js";
import { wantFx, settings } from "../systems/GameSettings.js";
import { timeZoneOf, formatZoneParts } from "../data/timeZones.js";
import { HUB_BAR_TOP, HUB_PASS_H, HUB_MENU } from "../ui/hubLayout.js?v=local171";
import { PASS, monthId, passLookOf, dayKey } from "../data/monthPass.js?v=local171";
import { shopLookVis, shopLookLabel } from "../data/costumeShop.js";
import { DAILY_GIFTS, dailyGiftOf, dailyIndex } from "../data/dailyLogin.js?v=local171";
import { paintGiftIcons } from "../ui/giftIcons.js?v=local171";

function chip(scene, x, y, w, color, onClick) {
  const h = 48;
  const g = scene.add.graphics().setDepth(20);
  const draw = (hot) => {
    g.clear();
    g.fillStyle(hot ? 0xffe8c8 : 0xfff6ea, 0.96);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 24);
    g.lineStyle(2, color, hot ? 1 : 0.7);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 24);
  };
  draw(false);
  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(22);
  zone.on("pointerover", () => draw(true));
  zone.on("pointerout", () => draw(false));
  zone.on("pointerdown", onClick);
  return { g, zone, x, y, w, h };
}

export class HubScene extends Phaser.Scene {
  constructor() { super("hub"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    SaveSystem.grantTryPowder();
    NetPlay.ensure();
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const save = SaveSystem.data;
    const cur = save.currencies;
    SaveSystem.etherNow();
    this.infoBits = [];

    const PAD = 28;
    const TOP = 48;
    const GAP = 12;
    const pvpW = 108;
    const tokW = 96;
    const etherW = 108;
    const coinW = 108;
    const pvx = W - PAD - pvpW / 2;
    const tx = pvx - pvpW / 2 - GAP - tokW / 2;
    const ex = tx - tokW / 2 - GAP - etherW / 2;
    const cxn = ex - etherW / 2 - GAP - coinW / 2;

    const etherKey = this.textures.exists("item-ether") ? "item-ether" : (this.textures.exists("vis_ether") ? "vis_ether" : "ether-art");
    chip(this, cxn, TOP, coinW, 0xffd24a, () => this.openInfo("coins"));
    this.coinBox = this.add.container(cxn, TOP).setDepth(21);
    this.coinIcon = this.textures.exists("item-coin") ? this.add.image(0, 0, "item-coin").setDisplaySize(28, 28) : null;
    this.coinText = this.add.text(0, 0, String(cur.coins | 0), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5);
    if (this.coinIcon) this.coinBox.add(this.coinIcon);
    this.coinBox.add(this.coinText);

    chip(this, ex, TOP, etherW, 0x3ad6ff, () => this.openInfo("ether"));
    this.etherBox = this.add.container(ex, TOP).setDepth(21);
    this.etherIcon = this.textures.exists(etherKey)
      ? this.add.image(0, 0, etherKey).setDisplaySize(30, 30)
      : null;
    this.etherText = this.add.text(0, 0, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5);
    this.etherHint = null;
    if (this.etherIcon) this.etherBox.add(this.etherIcon);
    this.etherBox.add(this.etherText);

    chip(this, tx, TOP, tokW, 0xffb14a, () => this.openInfo("tokens"));
    this.tokenBox = this.add.container(tx, TOP).setDepth(21);
    this.tokenIcon = this.textures.exists("item-shard") ? this.add.image(0, 0, "item-shard").setDisplaySize(28, 28) : null;
    this.tokenText = this.add.text(0, 0, String(cur.tokens | 0), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5);
    if (this.tokenIcon) this.tokenBox.add(this.tokenIcon);
    this.tokenBox.add(this.tokenText);

    chip(this, pvx, TOP, pvpW, 0x7d5cff, () => this.openInfo("pvp"));
    this.stoneBox = this.add.container(pvx, TOP).setDepth(21);
    this.stoneIcon = this.textures.exists("item-stone") ? this.add.image(0, 0, "item-stone").setDisplaySize(28, 28) : null;
    this.stoneText = this.add.text(0, 0, String(cur.pvp | 0), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0, 0.5);
    if (this.stoneIcon) this.stoneBox.add(this.stoneIcon);
    this.stoneBox.add(this.stoneText);

    const heroId = save.showcaseId || save.starterId || "ignis";
    const heroKey = texHeroSelect(this, heroId);
    const heroX = W / 2;
    const heroY = 292;
    this.add.circle(heroX, heroY, 136, 0xffffff, 0.32).setDepth(5);
    this.add.circle(heroX, heroY, 136, 0x000000, 0).setStrokeStyle(4, 0xff6a22, 0.32).setDepth(5);
    this.heroAura = this.add.graphics().setDepth(5);
    this.heroId = heroId;
    this.heroSkin = SaveSystem.skinOf(heroId);
    this.heroY = heroY;
    this.heroImg = this.add.image(heroX, heroY - 6, heroKey).setDisplaySize(252, 252).setDepth(6);
    this.heroName = this.add.text(heroX, 424, charName(heroId), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(heroX, 448, t("hub.showcaseHint"), {
      fontFamily: UI_FONT, fontSize: "12px", color: "#8a5a38"
    }).setOrigin(0.5);
    this.add.zone(heroX, heroY, 268, 268).setInteractive({ useHandCursor: true }).setDepth(7)
      .on("pointerdown", () => this.cycleShowcase(1));
    makeButton(this, heroX - 198, heroY, 52, 52, "‹", () => this.cycleShowcase(-1), 0xffe08a);
    makeButton(this, heroX + 198, heroY, 52, 52, "›", () => this.cycleShowcase(1), 0xffe08a);

    this.mountPlay(W);

    this.paintEther();
    this.layoutChip(this.coinBox, this.coinIcon, this.coinText);
    this.layoutChip(this.tokenBox, this.tokenIcon, this.tokenText);
    this.layoutChip(this.stoneBox, this.stoneIcon, this.stoneText);
    this.mountClock(W);
    this.mountPassBanner(W);
    this.mountDailyLogin();
    mountHubMenu(this);
    mountMailboxHud(this);
    mountHubBoardWidgets(this);
    mountHubNav(this);
    Friends.sync();
    AudioSystem.playMenu();
    SaveSystem.notePlayDay();
    this.hubDay = dayKey();
    this._onVis = () => {
      if (document.visibilityState !== "visible") return;
      SaveSystem.notePlayDay();
      this.paintDailyChip();
    };
    document.addEventListener("visibilitychange", this._onVis);
  }

  mountPlay(W) {
    const x = W / 2;
    const y = 512;
    const bw = 220;
    const bh = 56;
    const r = 22;
    this.playGlow = this.add.graphics().setDepth(8);
    const drawGlow = (pulse) => {
      this.playGlow.clear();
      this.playGlow.fillStyle(0xffe08a, 0.22 + pulse * 0.16);
      this.playGlow.fillRoundedRect(x - bw / 2 - 14, y - bh / 2 - 10, bw + 28, bh + 20, r + 8);
    };
    drawGlow(0);
    this.playDraw = drawGlow;
    const go = () => {
      AudioSystem.ui();
      this.scene.start("mode");
    };
    const gfx = this.add.graphics().setDepth(40);
    const drawBtn = (hot) => {
      gfx.clear();
      gfx.fillStyle(hot ? 0xff8a3a : 0xff6a22, 1);
      gfx.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, r);
      gfx.lineStyle(3, 0xffe08a, hot ? 1 : 0.95);
      gfx.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, r);
    };
    drawBtn(false);
    this.add.text(x, y, t("hub.play"), {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#fff6ea"
    }).setOrigin(0.5).setDepth(41);
    const zone = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true }).setDepth(42);
    zone.on("pointerover", () => drawBtn(true));
    zone.on("pointerout", () => drawBtn(false));
    zone.on("pointerdown", go);
    if (wantFx() && this.textures.exists("dot")) {
      try {
        this.playBurst = this.add.particles(x, y, "dot", {
          lifespan: { min: 500, max: 1100 },
          speed: { min: 20, max: 90 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.7, end: 0 },
          tint: [0xff6a22, 0xffe08a, 0xffffff, 0xff8ab8],
          blendMode: "ADD",
          frequency: 70,
          quantity: 1,
          emitZone: { type: "edge", source: new Phaser.Geom.Ellipse(0, 0, 232, 64), quantity: 16 }
        }).setDepth(7);
      } catch (e) { this.playBurst = null; }
    }
  }

  mountClock(W) {
    const x = W / 2;
    const y = 40;
    const w = 200;
    const h = 54;
    this.clockGfx = this.add.graphics().setDepth(24);
    const draw = (hot) => {
      const g = this.clockGfx;
      g.clear();
      const left = x - w / 2;
      const top = y - 22;
      const bodyH = 44;
      g.fillStyle(hot ? 0x24385a : 0x17243a, 0.97);
      g.fillRoundedRect(left, top, w, bodyH, 16);
      g.fillTriangle(x - 11, top + bodyH - 1, x + 11, top + bodyH - 1, x, top + bodyH + 10);
      g.lineStyle(2.4, 0xffd24a, hot ? 1 : 0.92);
      g.strokeRoundedRect(left, top, w, bodyH, 16);
      g.lineStyle(1.4, 0x3ad6ff, 0.75);
      g.strokeRoundedRect(left + 4, top + 4, w - 8, bodyH - 8, 12);
    };
    draw(false);
    this.clockKicker = this.add.text(x, y - 10, t("hub.serverTag"), {
      fontFamily: UI_FONT, fontSize: "11px", fontStyle: "800", color: "#ffe08a"
    }).setOrigin(0.5).setDepth(25);
    this.clockText = this.add.text(x, y + 8, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#fff6ea"
    }).setOrigin(0.5).setDepth(25);
    this.clockDot = this.add.circle(x - 58, y - 10, 3.4, 0x3ad6ff).setDepth(26);
    this.tweens.add({
      targets: this.clockDot,
      alpha: { from: 1, to: 0.25 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(27);
    zone.on("pointerover", () => draw(true));
    zone.on("pointerout", () => draw(false));
    zone.on("pointerdown", () => {
      AudioSystem.ui();
      this.scene.start("settings", { from: "hub", tab: "general" });
    });
    this.paintClock();
  }

  mountPassBanner(W) {
    const clockLeft = W / 2 - 100;
    const w = 248;
    const h = HUB_PASS_H;
    const x = clockLeft - 14 - w / 2;
    const y = HUB_BAR_TOP + h / 2;
    const look = passLookOf(monthId());
    const bought = SaveSystem.hasMonthPass();
    const claim = bought && !SaveSystem.passClaimedToday();
    const icon = look && this.textures.exists(shopLookVis(look.id, "select"))
      ? shopLookVis(look.id, "select")
      : (this.textures.exists("item-powder") ? "item-powder" : "item-shard");
    const g = this.add.graphics().setDepth(28);
    const draw = (hot) => {
      g.clear();
      g.fillStyle(hot ? 0xffe0b0 : 0xfff6ea, 0.98);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      g.lineStyle(3, claim ? 0x3ad6ff : 0xff8ab8, hot ? 1 : 0.92);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    };
    draw(false);
    this.add.image(x - 74, y, icon).setDisplaySize(66, 66).setDepth(29);
    this.add.text(x + 36, y - 16, t("pass.short"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(29);
    this.add.text(x + 36, y + 6, look ? shopLookLabel(look, I18n.lang) : t("pass.title"), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#4a2810"
    }).setOrigin(0.5).setDepth(29);
    this.add.text(x + 36, y + 24, claim ? t("pass.claim") : (bought ? t("pass.bought") : t("pass.buy", { n: PASS.thb })), {
      fontFamily: UI_FONT, fontSize: "11px", fontStyle: "800", color: claim ? "#0a6a88" : "#c45a16"
    }).setOrigin(0.5).setDepth(29);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(30);
    zone.on("pointerover", () => draw(true));
    zone.on("pointerout", () => draw(false));
    zone.on("pointerdown", () => {
      AudioSystem.ui();
      this.scene.start("pass", { from: "hub" });
    });
  }

  mountDailyLogin() {
    this.dailyBits = [];
    this.paintDailyChip();
  }

  wipeDaily() {
    (this.dailyBits || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.dailyBits = [];
  }

  paintDailyChip() {
    this.wipeDaily();
    const keep = (o) => { this.dailyBits.push(o); return o; };
    const menuRight = HUB_MENU.x + HUB_MENU.w / 2;
    const passLeft = this.scale.width / 2 - 100 - 14 - 248;
    const gap = 10;
    const w = Math.max(120, passLeft - gap - (menuRight + gap));
    const h = HUB_PASS_H;
    const x = menuRight + gap + w / 2;
    const y = HUB_BAR_TOP + h / 2;
    const ready = SaveSystem.dailyReady();
    const streak = SaveSystem.dailyStreakNow();
    const gift = dailyGiftOf(streak);
    const g = keep(this.add.graphics().setDepth(28));
    const draw = (hot) => {
      g.clear();
      g.fillStyle(hot ? 0xffe0b0 : 0xfff6ea, 0.98);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      g.lineStyle(3, ready ? 0xffb14a : 0xc8bdd8, hot ? 1 : 0.9);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    };
    draw(false);
    keep(this.add.text(x, y - 26, t("daily.short"), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(29));
    paintGiftIcons(this, x, y + 2, gift, { size: 26, gap: 38, depth: 29, fontSize: "11px" }).forEach(keep);
    keep(this.add.text(x, y + 28, ready ? t("daily.take") : t("daily.done"), {
      fontFamily: UI_FONT, fontSize: "11px", fontStyle: "800", color: ready ? "#c45a16" : "#146b32"
    }).setOrigin(0.5).setDepth(29));
    const zone = keep(this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(30));
    zone.on("pointerover", () => draw(true));
    zone.on("pointerout", () => draw(false));
    zone.on("pointerdown", () => {
      AudioSystem.ui();
      this.openDaily();
    });
    this.dailyChip = { x, y, w, h };
  }

  openDaily() {
    if (this.dailyLock) return;
    this.dailyLock = true;
    const bits = [];
    const W = this.scale.width;
    const H = this.scale.height;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.55).setDepth(50).setInteractive();
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 430, 150, 860, 400, 24);
    panel.lineStyle(3, 0xffb14a, 0.9);
    panel.strokeRoundedRect(W / 2 - 430, 150, 860, 400, 24);
    bits.push(dim, panel);
    bits.push(this.add.text(W / 2, 186, t("daily.title"), {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0.5).setDepth(52));
    bits.push(this.add.text(W / 2, 220, t("daily.body"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#4a2810",
      align: "center", wordWrap: { width: 760 }
    }).setOrigin(0.5).setDepth(52));
    const ready = SaveSystem.dailyReady();
    const streak = SaveSystem.dailyStreakNow();
    const todayI = dailyIndex(streak);
    DAILY_GIFTS.forEach((gift, i) => {
      const x = W / 2 - 330 + i * 110;
      const y = 320;
      const on = i === todayI;
      const g = this.add.graphics().setDepth(52);
      g.fillStyle(on ? 0xffe0b0 : 0xfff3e4, 1);
      g.fillRoundedRect(x - 48, y - 58, 96, 116, 14);
      g.lineStyle(2, on ? 0xff6a22 : 0xe8c8a8, 1);
      g.strokeRoundedRect(x - 48, y - 58, 96, 116, 14);
      bits.push(g);
      bits.push(this.add.text(x, y - 42, t("daily.day", { n: i + 1 }), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "900", color: "#1a1008"
      }).setOrigin(0.5).setDepth(53));
      paintGiftIcons(this, x, y + 6, gift, { size: 30, gap: 36, depth: 53, fontSize: "12px" }).forEach((o) => bits.push(o));
    });
    const wipe = () => {
      bits.forEach((o) => { if (o && o.destroy) o.destroy(); });
      this.dailyLock = false;
    };
    dim.on("pointerdown", () => { AudioSystem.ui(); wipe(); });
    if (ready) {
      const ok = makeButton(this, W / 2 - 110, 480, 200, 44, t("daily.take"), () => {
        AudioSystem.ui();
        const res = SaveSystem.claimDaily();
        wipe();
        this.paintDailyChip();
        this.layoutChip(this.coinBox, this.coinIcon, this.coinText);
        this.layoutChip(this.tokenBox, this.tokenIcon, this.tokenText);
        this.layoutChip(this.stoneBox, this.stoneIcon, this.stoneText);
        this.paintEther();
        if (res.ok) this.openGiftNote(res.gift);
      }, 0xff6a22, 54);
      bits.push(ok.bg, ok.text, ok.gfx);
    } else {
      bits.push(this.add.text(W / 2, 470, t("daily.done"), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#146b32"
      }).setOrigin(0.5).setDepth(52));
    }
    const no = makeButton(this, W / 2 + 110, 480, 200, 44, t("career.close"), () => {
      AudioSystem.ui();
      wipe();
    }, 0xe8dcc8, 54);
    bits.push(no.bg, no.text, no.gfx);
  }

  openGiftNote(gift) {
    if (!gift) return;
    const W = this.scale.width;
    const bg = this.add.rectangle(W / 2, 128, 220, 72, 0xfff6ea, 0.98).setDepth(59);
    bg.setStrokeStyle(2, 0xffb14a, 0.9);
    const bits = [bg, ...paintGiftIcons(this, W / 2, 120, gift, { size: 34, gap: 52, depth: 60, fontSize: "14px" })];
    this.time.delayedCall(1800, () => bits.forEach((o) => { if (o && o.destroy) o.destroy(); }));
  }

  openInfoNote(text) {
    if (!text) return;
    const W = this.scale.width;
    const note = this.add.text(W / 2, 132, text, {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#1a1008",
      backgroundColor: "#fff6ea", padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(60);
    this.time.delayedCall(1800, () => { if (note && note.destroy) note.destroy(); });
  }

  paintClock() {
    if (!this.clockText) return;
    const zone = timeZoneOf(settings().timeZone);
    const parts = formatZoneParts(zone.tz, I18n.lang);
    this.clockText.setText((parts.weekday + "  " + parts.time).trim());
    if (this.clockKicker) this.clockKicker.setText(t("settings.tz." + zone.id));
  }

  cycleShowcase(dir) {
    const owned = ROSTER_IDS.filter((id) => SaveSystem.isUnlocked(id));
    if (!owned.length) return;
    const cur = SaveSystem.data.showcaseId || SaveSystem.data.starterId || owned[0];
    let i = owned.indexOf(cur);
    if (i < 0) i = 0;
    const next = owned[(i + dir + owned.length) % owned.length];
    SaveSystem.setShowcase(next);
    AudioSystem.ui();
    const key = texHeroSelect(this, next);
    if (this.heroImg) this.heroImg.setTexture(key).setDisplaySize(252, 252);
    if (this.heroName) this.heroName.setText(charName(next));
    this.heroId = next;
    this.heroSkin = SaveSystem.skinOf(next);
  }

  update(now) {
    if (this.heroAura && this.heroImg) {
      paintSkinAura(this.heroAura, this.heroImg.x, this.heroY, this.heroId, champAuraTier(this.heroId, this.heroSkin), now, 118);
    }
    paintHubBoardFx(this, now);
    this.paintEther();
    if (this.time.now - (this.clockAt || 0) > 1000) {
      this.clockAt = this.time.now;
      this.paintClock();
      const today = dayKey();
      if (today !== this.hubDay) {
        this.hubDay = today;
        SaveSystem.notePlayDay();
        this.paintDailyChip();
      }
    }
    if (this.playDraw) {
      const pulse = (Math.sin(now / 380) + 1) / 2;
      this.playDraw(pulse);
    }
    if (this.time.now - (this.syncAt || 0) > 12000) {
      this.syncAt = this.time.now;
      Friends.sync();
    }
    if (this.mailOpen) return;
    if (!this.mailAt) this.mailAt = 0;
    if (this.time.now - this.mailAt < 10000) return;
    this.mailAt = this.time.now;
    Mailbox.refresh().then(() => {
      if (this.sys && this.sys.isActive() && this.paintMailbox) this.paintMailbox();
    });
  }

  shutdown() {
    if (this._onVis) document.removeEventListener("visibilitychange", this._onVis);
    ChatSystem.bindHub(null);
    Leaderboard.hide();
  }

  layoutChip(box, icon, text) {
    if (!box || !text) return;
    const gap = 6;
    const iconW = icon ? 28 : 0;
    const total = iconW + (iconW ? gap : 0) + text.width;
    let x = -total / 2;
    if (icon) {
      icon.setPosition(x + iconW / 2, 0);
      x += iconW + gap;
    }
    text.setPosition(x, 0);
  }

  paintEther() {
    if (!this.etherText) return;
    const st = SaveSystem.etherNow();
    this.etherText.setText(st.n + "/" + ECONOMY.etherMax);
    this.layoutChip(this.etherBox, this.etherIcon, this.etherText);
  }

  openInfo(kind) {
    this.closeInfo();
    const W = this.scale.width;
    const H = this.scale.height;
    const st = SaveSystem.etherNow();
    const wait = st.full ? t("hub.etherFull") : t("hub.etherWait", { t: formatEtherWait(st.nextMs) });
    const title = t("hub.info." + kind + "Title");
    const body = kind === "ether"
      ? t("hub.info.etherBody", { wait, max: ECONOMY.etherMax })
      : t("hub.info." + kind + "Body");
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.5).setDepth(70).setInteractive();
    const card = this.add.graphics().setDepth(71);
    card.fillStyle(0xfff6ea, 0.98);
    card.fillRoundedRect(W / 2 - 280, H / 2 - 150, 560, 300, 22);
    card.lineStyle(3, 0xff6a22, 0.8);
    card.strokeRoundedRect(W / 2 - 280, H / 2 - 150, 560, 300, 22);
    const t1 = this.add.text(W / 2, H / 2 - 110, title, {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(72);
    const t2 = this.add.text(W / 2, H / 2 - 20, body, {
      fontFamily: UI_FONT, fontSize: "16px", color: "#5a3828", align: "center", wordWrap: { width: 480 }
    }).setOrigin(0.5).setDepth(72);
    const close = makeButton(this, W / 2, H / 2 + 100, 180, 44, t("hub.infoClose"), () => {
      AudioSystem.ui();
      this.closeInfo();
    }, 0xff6a22, 80);
    dim.on("pointerdown", () => this.closeInfo());
    this.infoBits = [dim, card, t1, t2, close.bg, close.text, close.gfx];
  }

  closeInfo() {
    this.infoBits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.infoBits = [];
  }
}
