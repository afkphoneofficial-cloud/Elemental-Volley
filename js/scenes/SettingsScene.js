import { drawGrid, makeButton, makeSlider, UI_FONT } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import {
  BGM_PAGES,
  isFullscreen,
  patchSettings,
  setBgmMode,
  settings,
  toggleBgmPage,
  toggleFullscreen
} from "../systems/GameSettings.js";
import { I18n, t } from "../i18n/I18n.js";
import { TouchControls } from "../ui/TouchControls.js";
import { paintSettingsTabs } from "../ui/sceneTabs.js";
import { TIME_ZONES } from "../data/timeZones.js";

const MODES = ["auto", "pc", "mobile"];
const TABS = ["general", "video", "audio", "controls"];

function mark(on, label) {
  return (on ? "●  " : "○  ") + label;
}

export class SettingsScene extends Phaser.Scene {
  constructor() { super("settings"); }

  init(data) {
    this.backTo = (data && data.from) || "hub";
    this.tab = (data && data.tab) || "general";
    if (TABS.indexOf(this.tab) < 0) this.tab = "general";
    this.sys.settings.data = { from: this.backTo, tab: this.tab };
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintSettingsTabs(this, this.tab);
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.backTo === "menu" ? "menu" : "hub");
    }, 0x7d5cff);

    this.add.text(W / 2, 82, t("settings.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 108, t("settings.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30", align: "center", wordWrap: { width: 820 }
    }).setOrigin(0.5);

    if (this.tab === "video") this.paintVideo(W);
    else if (this.tab === "audio") this.paintAudio(W);
    else if (this.tab === "controls") this.paintControls(W);
    else this.paintGeneral(W);

    AudioSystem.playMenu();
  }

  paintGeneral(W) {
    this.add.text(W / 2, 148, t("settings.lang"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    makeButton(this, W / 2 - 70, 198, 120, 46, mark(I18n.lang === "th", "ไทย"), () => {
      AudioSystem.ui();
      I18n.setLang("th");
    }, 0xff6a22);
    makeButton(this, W / 2 + 70, 198, 120, 46, mark(I18n.lang === "en", "EN"), () => {
      AudioSystem.ui();
      I18n.setLang("en");
    }, 0xff6a22);

    this.add.text(W / 2, 256, t("settings.tzTitle"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.add.text(W / 2, 282, t("settings.tzHint"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#8a5a38", align: "center", wordWrap: { width: 760 }
    }).setOrigin(0.5);
    const s = settings();
    TIME_ZONES.forEach((row, i) => {
      const col = i % 3;
      const r = Math.floor(i / 3);
      const x = W / 2 - 220 + col * 220;
      const y = 338 + r * 52;
      const on = s.timeZone === row.id;
      makeButton(this, x, y, 200, 42, mark(on, t("settings.tz." + row.id)), () => {
        AudioSystem.ui();
        patchSettings({ timeZone: row.id });
        this.scene.restart({ from: this.backTo, tab: "general" });
      }, on ? 0x3ad6ff : 0xe8dcc8);
    });

    makeButton(this, W / 2, 540, 300, 50, t("settings.logout"), () => {
      AudioSystem.ui();
      AuthSystem.logout();
    }, 0xff5a1f);
  }

  paintVideo(W) {
    const s = settings();
    const row = (y, key, on, fn) => {
      makeButton(this, W / 2, y, 560, 48, mark(on, t(key)), () => {
        AudioSystem.ui();
        fn();
        this.scene.restart({ from: this.backTo, tab: "video" });
      }, on ? 0xffb14a : 0xe8dcc8);
    };
    row(168, "settings.reducedFx", s.reducedFx, () => patchSettings({ reducedFx: !s.reducedFx }));
    row(228, "settings.cameraShake", s.cameraShake, () => patchSettings({ cameraShake: !s.cameraShake }));
    row(288, "settings.lobbyMotion", s.lobbyMotion, () => patchSettings({ lobbyMotion: !s.lobbyMotion }));
    row(348, "settings.fullscreen", isFullscreen(), () => {
      toggleFullscreen().then(() => {
        if (this.sys && this.sys.isActive()) this.scene.restart({ from: this.backTo, tab: "video" });
      });
    });
    this.add.text(W / 2, 420, t("settings.videoHint"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);
  }

  paintAudio(W) {
    const s = settings();
    this.add.text(W / 2 - 280, 156, t("settings.music"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0, 0.5);
    makeSlider(this, W / 2 + 90, 156, 340, AudioSystem.getMusicVol(), (v) => {
      AudioSystem.unlock();
      AudioSystem.setMusicVol(v);
    });

    this.add.text(W / 2 - 280, 210, t("settings.sfx"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0, 0.5);
    makeSlider(this, W / 2 + 90, 210, 340, AudioSystem.getSfxVol(), (v) => {
      AudioSystem.setSfxVol(v);
    });

    this.add.text(W / 2, 258, t("settings.bgmMode"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);

    ["all", "off", "custom"].forEach((id, i) => {
      const on = s.bgmMode === id;
      makeButton(this, W / 2 - 220 + i * 220, 304, 200, 44, mark(on, t("settings.bgm" + id[0].toUpperCase() + id.slice(1))), () => {
        AudioSystem.ui();
        setBgmMode(id);
        AudioSystem.refreshBgm();
        this.scene.restart({ from: this.backTo, tab: "audio" });
      }, on ? 0x3ad6ff : 0xe8dcc8);
    });

    this.add.text(W / 2, 356, t("settings.bgmPages"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);

    BGM_PAGES.forEach((id, i) => {
      const on = s.bgmMode !== "off" && s.bgmPages[id] !== false;
      const col = i < 3 ? i : i - 3;
      const row = i < 3 ? 0 : 1;
      makeButton(
        this,
        W / 2 - 220 + col * 220,
        408 + row * 56,
        200,
        46,
        mark(on, t("settings.page" + id[0].toUpperCase() + id.slice(1))),
        () => {
          AudioSystem.ui();
          toggleBgmPage(id);
          AudioSystem.refreshBgm();
          this.scene.restart({ from: this.backTo, tab: "audio" });
        },
        on ? 0xffe08a : 0xc8bdd8
      );
    });

    this.add.text(W / 2, 540, t("settings.audioHint"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#7a4a30", align: "center", wordWrap: { width: 780 }
    }).setOrigin(0.5);
  }

  paintControls(W) {
    this.add.text(W / 2, 154, t("settings.controls"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);

    const cur = (SaveSystem.data.settings && SaveSystem.data.settings.controlMode) || "auto";
    MODES.forEach((id, i) => {
      const on = id === cur;
      makeButton(this, W / 2, 208 + i * 58, 480, 50, mark(on, t("settings." + id)), () => {
        AudioSystem.ui();
        patchSettings({ controlMode: id });
        TouchControls.sync();
        this.scene.restart({ from: this.backTo, tab: "controls" });
      }, on ? 0xffe08a : 0xe8dcc8);
    });

    this.add.text(W / 2, 400, t("settings.note"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);
    this.add.text(W / 2, 468, t("settings.keys"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#3a2418", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);
  }
}
