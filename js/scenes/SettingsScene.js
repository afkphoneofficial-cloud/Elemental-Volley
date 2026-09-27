import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { TouchControls } from "../ui/TouchControls.js";

const MODES = ["auto", "pc", "mobile"];

export class SettingsScene extends Phaser.Scene {
  constructor() { super("settings"); }

  init(data) {
    this.backTo = (data && data.from) || "hub";
  }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 88, t("settings.title"), {
      fontFamily: UI_FONT, fontSize: "40px", fontStyle: "800", color: "#fff6ea"
    }).setOrigin(0.5);
    this.sub = this.add.text(W / 2, 138, t("settings.sub"), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#cbb8e8", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);

    this.modeBtns = MODES.map((id, i) => {
      const btn = makeButton(this, W / 2, 240 + i * 78, 420, 58, t("settings." + id), () => {
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

    this.note = this.add.text(W / 2, 490, t("settings.note"), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#8e82a8", align: "center", wordWrap: { width: 640 }
    }).setOrigin(0.5);

    makeButton(this, W / 2, 580, 280, 50, t("nav.back"), () => {
      const to = this.backTo === "menu" ? "menu" : "hub";
      this.scene.start(to);
    }, 0x7d5cff);
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
    if (this.note) this.note.setText(t("settings.note"));
  }
}
