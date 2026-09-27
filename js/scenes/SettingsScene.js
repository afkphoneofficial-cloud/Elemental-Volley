import { drawGrid, makeButton, makeSlider, UI_FONT } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { TouchControls } from "../ui/TouchControls.js";

const MODES = ["auto", "pc", "mobile"];

export class SettingsScene extends Phaser.Scene {
  constructor() { super("settings"); }

  init(data) {
    this.backTo = (data && data.from) || "hub";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 48, t("settings.title"), {
      fontFamily: UI_FONT, fontSize: "36px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.sub = this.add.text(W / 2, 88, t("settings.sub"), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);

    this.add.text(W / 2 - 210, 140, t("settings.lang"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    makeButton(this, W / 2 - 70, 140, 100, 42, "ไทย", () => I18n.setLang("th"), 0xff6a22);
    makeButton(this, W / 2 + 50, 140, 100, 42, "EN", () => I18n.setLang("en"), 0xff6a22);

    this.add.text(W / 2 - 240, 204, t("settings.music"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0, 0.5);
    makeSlider(this, W / 2 + 80, 204, 320, AudioSystem.getMusicVol(), (v) => {
      AudioSystem.unlock();
      AudioSystem.setMusicVol(v);
    });

    this.add.text(W / 2 - 240, 258, t("settings.sfx"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0, 0.5);
    makeSlider(this, W / 2 + 80, 258, 320, AudioSystem.getSfxVol(), (v) => {
      AudioSystem.setSfxVol(v);
    });

    this.add.text(W / 2, 312, t("settings.controls"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);

    this.modeBtns = MODES.map((id, i) => {
      const btn = makeButton(this, W / 2, 358 + i * 56, 420, 48, t("settings." + id), () => {
        AudioSystem.ui();
        if (!SaveSystem.data.settings) SaveSystem.data.settings = {};
        SaveSystem.data.settings.controlMode = id;
        SaveSystem.persist();
        TouchControls.sync();
        this.paint();
      }, 0xffe08a);
      btn.modeId = id;
      return btn;
    });

    makeButton(this, W / 2, 548, 260, 46, t("nav.back"), () => {
      const to = this.backTo === "menu" ? "menu" : "hub";
      this.scene.start(to);
    }, 0x7d5cff);
    makeButton(this, W / 2, 608, 280, 46, t("settings.logout"), () => {
      AudioSystem.ui();
      AuthSystem.logout();
    }, 0xff5a1f);
    this.paint();
    AudioSystem.playMenu();
  }

  paint() {
    const cur = (SaveSystem.data.settings && SaveSystem.data.settings.controlMode) || "auto";
    this.modeBtns.forEach((btn) => {
      const on = btn.modeId === cur;
      btn.text.setText((on ? "●  " : "○  ") + t("settings." + btn.modeId));
    });
    if (this.sub) this.sub.setText(t("settings.sub"));
  }
}
