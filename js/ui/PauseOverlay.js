import { GAME } from "../config/gameConfig.js";
import { makeButton, makeSlider, UI_FONT } from "./Ui.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { TouchControls } from "./TouchControls.js";

export class PauseOverlay {
  constructor(scene, { onResume, onQuit }) {
    this.scene = scene;
    this.onResume = onResume;
    this.onQuit = onQuit;
    this.bits = [];
    this.build();
    this.setOpen(false);
  }

  add(obj) {
    this.bits.push(obj);
    return obj;
  }

  build() {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;
    this.add(this.scene.add.rectangle(cx, cy, GAME.width, GAME.height, 0x3a2418, 0.42).setDepth(48).setInteractive());
    const panel = this.scene.add.graphics().setDepth(49);
    panel.fillStyle(0xfff6ea, 0.96);
    panel.fillRoundedRect(cx - 280, cy - 230, 560, 460, 28);
    panel.lineStyle(4, 0xff8a3a, 0.9);
    panel.strokeRoundedRect(cx - 280, cy - 230, 560, 460, 28);
    this.add(panel);
    this.title = this.add(this.scene.add.text(cx, cy - 188, "", {
      fontFamily: UI_FONT, fontSize: "32px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(50));
    this.musicLab = this.add(this.scene.add.text(cx - 230, cy - 128, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(50));
    this.sfxLab = this.add(this.scene.add.text(cx - 230, cy - 62, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(50));
    this.musicSlide = makeSlider(this.scene, cx + 40, cy - 128, 260, AudioSystem.getMusicVol(), (v) => {
      AudioSystem.unlock();
      AudioSystem.setMusicVol(v);
    });
    this.sfxSlide = makeSlider(this.scene, cx + 40, cy - 62, 260, AudioSystem.getSfxVol(), (v) => {
      AudioSystem.setSfxVol(v);
    });
    [this.musicSlide.g, this.musicSlide.knob, this.musicSlide.zone, this.sfxSlide.g, this.sfxSlide.knob, this.sfxSlide.zone].forEach((o) => {
      o.setDepth(51);
      this.add(o);
    });
    this.resumeBtn = makeButton(this.scene, cx, cy + 24, 300, 52, "", () => this.onResume(), 0xff6a22);
    this.quitBtn = makeButton(this.scene, cx, cy + 96, 300, 48, "", () => this.onQuit(), 0xff8ab8);
    [this.resumeBtn.gfx, this.resumeBtn.text, this.resumeBtn.bg, this.quitBtn.gfx, this.quitBtn.text, this.quitBtn.bg].forEach((o) => {
      o.setDepth(52);
      this.add(o);
    });
    this.applyLang();
  }

  applyLang() {
    if (this.title) this.title.setText(t("pause.title"));
    if (this.musicLab) this.musicLab.setText(t("settings.music"));
    if (this.sfxLab) this.sfxLab.setText(t("settings.sfx"));
    if (this.resumeBtn && this.resumeBtn.text) this.resumeBtn.text.setText(t("pause.resume"));
    if (this.quitBtn && this.quitBtn.text) this.quitBtn.text.setText(t("pause.quit"));
  }

  setOpen(on) {
    this.bits.forEach((o) => {
      if (o && o.setVisible) o.setVisible(on);
    });
    if (on) TouchControls.setPlayActive(false);
    else TouchControls.setPlayActive(true);
  }

  destroy() {
    this.bits.forEach((o) => {
      try { o.destroy(); } catch (e) {}
    });
    this.bits = [];
  }
}
