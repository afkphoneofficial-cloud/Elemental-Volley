import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { I18n, t } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { ROSTER } from "../data/roster.js";

export class WikiScene extends Phaser.Scene {
  constructor() { super("wiki"); }

  init(data) {
    this.from = (data && data.from) || "hub";
  }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 34, t("wiki.title"), {
      fontFamily: UI_FONT, fontSize: "34px", fontStyle: "800", color: "#fff6ea"
    }).setOrigin(0.5);
    this.add.text(W / 2, 66, t("wiki.sub"), {
      fontFamily: UI_FONT, fontSize: "18px", color: "#cbb8e8"
    }).setOrigin(0.5);

    makeButton(this, 198, 110, 150, 44, t("wiki.tabRules"), () => this.show("rules"), 0xff8a3a);
    makeButton(this, 360, 110, 150, 44, t("wiki.tabStory"), () => this.show("story"), 0xffb14a);
    makeButton(this, 522, 110, 150, 44, t("wiki.tabCast"), () => this.show("cast"), 0x7d5cff);
    makeButton(this, 684, 110, 150, 44, t("wiki.tabSecret"), () => this.show("secret"), 0xff5a6a);
    makeButton(this, 110, 36, 148, 40, t("nav.back"), () => {
      if (this.from === "auth") AuthSystem.showOverlay();
      this.scene.start(this.from);
    }, 0x7d5cff);

    this.body = this.add.container(0, 0);
    this.tab = "rules";
    this.show("rules");
    AudioSystem.playMenu();
  }

  clearBody() {
    this.body.removeAll(true);
  }

  addBody(obj) {
    this.body.add(obj);
    return obj;
  }

  show(tab) {
    this.clearBody();
    if (tab !== this.tab) AudioSystem.ui();
    this.tab = tab;
    if (tab === "rules") this.drawRules();
    else if (tab === "story") this.drawStory();
    else if (tab === "cast") this.drawCast();
    else this.drawSecrets();
  }

  drawRules() {
    const W = this.scale.width;
    const pack = I18n.rules();
    this.addBody(roundPanel(this, W / 2, 418, 1200, 528, 0xffc07a, 0x120e18));
    this.addBody(this.add.text(W / 2, 168, pack.title, {
      fontFamily: UI_FONT, fontSize: "32px", fontStyle: "800", color: "#fff6ea"
    }).setOrigin(0.5).setDepth(8));
    this.addBody(this.add.text(W / 2, 204, pack.kicker, {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#ffb56a"
    }).setOrigin(0.5).setDepth(8));
    pack.groups.forEach((g, i) => {
      const x = 70 + i * 390;
      const y = 250;
      this.addBody(this.add.text(x, y, g.h, {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#ffe08a",
        wordWrap: { width: 360 }
      }).setOrigin(0, 0).setDepth(8));
      this.addBody(this.add.text(x, y + 40, g.items.map((line) => "•  " + line).join("\n"), {
        fontFamily: UI_FONT, fontSize: "17px", color: "#f4ecf8",
        wordWrap: { width: 360 },
        lineSpacing: 8
      }).setOrigin(0, 0).setDepth(8));
    });
  }

  drawStory() {
    const W = this.scale.width;
    const lore = I18n.lore();
    this.addBody(roundPanel(this, W / 2, 414, 1140, 520, 0xffc07a, 0x120e18));
    this.addBody(this.add.text(W / 2, 166, lore.kicker, {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "700", color: "#ffb56a"
    }).setOrigin(0.5).setDepth(8));
    this.addBody(this.add.text(W / 2, 202, lore.title, {
      fontFamily: UI_FONT, fontSize: "34px", fontStyle: "800", color: "#fff6ea"
    }).setOrigin(0.5).setDepth(8));
    lore.story.forEach((p, i) => {
      this.addBody(this.add.text(W / 2, 238 + i * 72, p, {
        fontFamily: UI_FONT, fontSize: "20px", color: "#f2e8f8", align: "center",
        wordWrap: { width: 1020 }
      }).setOrigin(0.5, 0).setDepth(8));
    });
    this.addBody(this.add.text(W / 2, 580, lore.ball, {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "600", color: "#ffe08a", align: "center",
      wordWrap: { width: 1000 }
    }).setOrigin(0.5).setDepth(8));
    this.addBody(this.add.text(W / 2, 646, lore.howTo, {
      fontFamily: UI_FONT, fontSize: "17px", color: "#d0c4dc", align: "center",
      wordWrap: { width: 1000 }
    }).setOrigin(0.5).setDepth(8));
  }

  drawCast() {
    I18n.wikiCast().forEach((c, i) => {
      const col = i % 2;
      const row = (i / 2) | 0;
      const x = 340 + col * 600;
      const y = 322 + row * 258;
      const data = ROSTER[c.id];
      const hex = "#" + data.colors.main.toString(16).padStart(6, "0");
      this.addBody(roundPanel(this, x, y, 572, 246, data.colors.main, 0x141018));
      const imgKey = this.textures.exists("vis_" + c.id) ? "vis_" + c.id : "vis_ignis";
      this.addBody(this.add.image(x - 204, y - 4, imgKey).setDisplaySize(122, 122).setDepth(8));
      this.addBody(this.add.text(x - 108, y - 102, c.title, {
        fontFamily: UI_FONT, fontSize: "28px", fontStyle: "800", color: hex
      }).setOrigin(0, 0.5).setDepth(8));
      this.addBody(this.add.text(x - 108, y - 74, c.tag + "   ·   " + c.ult, {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#ffe08a"
      }).setOrigin(0, 0.5).setDepth(8));
      this.addBody(this.add.text(x - 108, y - 54, c.origin, {
        fontFamily: UI_FONT, fontSize: "15px", color: "#eee4f4", wordWrap: { width: 392 }
      }).setOrigin(0, 0).setDepth(8));
      this.addBody(this.add.text(x - 108, y + 12, c.abilities.join("\n"), {
        fontFamily: UI_FONT, fontSize: "15px", color: "#d8ffdc", wordWrap: { width: 392 },
        lineSpacing: 3
      }).setOrigin(0, 0).setDepth(8));
    });
  }

  drawSecrets() {
    const W = this.scale.width;
    this.addBody(this.add.text(W / 2, 164, t("wiki.secretHead"), {
      fontFamily: UI_FONT, fontSize: "20px", color: "#ff8aa8"
    }).setOrigin(0.5).setDepth(8));
    I18n.secrets().forEach((s, i) => {
      const x = 340 + i * 600;
      const y = 414;
      this.addBody(roundPanel(this, x, y, 572, 400, 0x6a3048, 0x100814));
      this.addBody(this.add.circle(x, y - 96, 58, 0x1a1018, 0.95).setStrokeStyle(2, 0xff8aa8, 0.7).setDepth(8));
      this.addBody(this.add.text(x, y - 96, "?", {
        fontFamily: UI_FONT, fontSize: "52px", fontStyle: "900", color: "#ff8aa8"
      }).setOrigin(0.5).setDepth(9));
      this.addBody(this.add.text(x, y - 18, s.code + "   ·   " + s.alias, {
        fontFamily: UI_FONT, fontSize: "24px", fontStyle: "800", color: "#fff0f4"
      }).setOrigin(0.5).setDepth(8));
      this.addBody(this.add.text(x, y + 18, s.th + "   ·   " + t("wiki.from", { mark: s.mark }), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#ffb0c8"
      }).setOrigin(0.5).setDepth(8));
      this.addBody(this.add.text(x, y + 58, s.rumor, {
        fontFamily: UI_FONT, fontSize: "18px", color: "#f0e4f2", align: "center",
        wordWrap: { width: 500 }
      }).setOrigin(0.5, 0).setDepth(8));
      this.addBody(this.add.text(x, y + 178, s.hint, {
        fontFamily: UI_FONT, fontSize: "16px", color: "#b8a8c0"
      }).setOrigin(0.5).setDepth(8));
    });
  }
}
