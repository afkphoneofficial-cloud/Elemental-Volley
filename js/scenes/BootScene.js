import { TextureFactory } from "../systems/TextureFactory.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { I18n } from "../i18n/I18n.js";
import { FREE_AVATARS } from "../data/avatars.js";
import { RANK_TIERS, RANK_CAL_ID, badgeKey } from "../data/ranks.js";
import { BootSplash } from "../web/BootSplash.js";

const IDS = ["ignis", "aqua", "volt", "terra"];
const COURTS = ["summer", "rain", "spring", "winter"];

export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    this.load.on("loaderror", () => {});
    this.load.on("progress", (v) => BootSplash.setProgress(0.16 + v * 0.62));
    IDS.forEach((id) => {
      this.load.image("chibi-" + id, "assets/sprites/" + id + ".png");
      this.load.image("chibi-" + id + "-left", "assets/sprites/" + id + "-left.png");
      this.load.image("chibi-" + id + "-right", "assets/sprites/" + id + "-right.png");
      this.load.image("select-" + id, "assets/sprites/select-" + id + ".png");
      [1, 2, 3, 4, 5].forEach((n) => {
        this.load.image("dive-" + id + "-t" + n + "-l", "assets/sprites/skins/" + id + "-t" + n + "-dive-left.png");
        this.load.image("dive-" + id + "-t" + n + "-r", "assets/sprites/skins/" + id + "-t" + n + "-dive-right.png");
        this.load.image("cheer-" + id + "-t" + n, "assets/sprites/skins/" + id + "-t" + n + "-cheer.png");
      });
      [2, 3, 4, 5].forEach((n) => {
        this.load.image("select-" + id + "-t" + n, "assets/sprites/skins/select-" + id + "-t" + n + ".png");
        this.load.image("skin-" + id + "-t" + n + "-l", "assets/sprites/skins/" + id + "-t" + n + "-left.png");
        this.load.image("skin-" + id + "-t" + n + "-r", "assets/sprites/skins/" + id + "-t" + n + "-right.png");
      });
    });
    this.load.image("ether-art", "assets/sprites/ether.png");
    this.load.image("ball-art", "assets/sprites/ball.png");
    this.load.image("map-etheria", "assets/maps/etheria-island.png");
    COURTS.forEach((s) => {
      this.load.image("court-" + s, "assets/sprites/court-" + s + ".png");
      this.load.image("ref-" + s, "assets/sprites/ref-" + s + ".png");
    });
    FREE_AVATARS.forEach((a) => {
      this.load.image("av-art-" + a.id, "assets/sprites/avatars/" + a.id + ".png");
    });
    RANK_TIERS.forEach((row) => {
      this.load.image(badgeKey(row.id), "assets/sprites/ranks/" + row.id + ".png");
    });
    this.load.image(badgeKey(RANK_CAL_ID), "assets/sprites/ranks/" + RANK_CAL_ID + ".png");
  }

  create() {
    BootSplash.setProgress(0.8);
    SaveSystem.load();
    I18n.load();
    try {
      TextureFactory.build(this);
      RANK_TIERS.forEach((row) => {
        if (!this.textures.exists(badgeKey(row.id))) {
          TextureFactory.rankBadge(this, badgeKey(row.id), row.color, row.stars);
        }
      });
      if (!this.textures.exists(badgeKey(RANK_CAL_ID))) {
        TextureFactory.rankBadge(this, badgeKey(RANK_CAL_ID), 0xc8c0b8, 0);
      }
      TextureFactory.applyBall(this, "ball-art", "ball");
      TextureFactory.applyChibi(this, "ether-art", "vis_ether");
      FREE_AVATARS.forEach((a) => TextureFactory.applyChibi(this, "av-art-" + a.id, "vis_" + a.id));
      COURTS.forEach((s) => TextureFactory.applyChibi(this, "ref-" + s, "vis_ref_" + s));
      IDS.forEach((id) => {
        TextureFactory.applyChibi(this, "chibi-" + id, "vis_" + id);
        TextureFactory.applyChibi(this, "chibi-" + id + "-left", "vis_" + id + "_l");
        TextureFactory.applyChibi(this, "chibi-" + id + "-right", "vis_" + id + "_r");
        TextureFactory.applyChibi(this, "select-" + id, "vis_select_" + id);
        TextureFactory.applyChibi(this, "dive-" + id + "-t1-l", "vis_" + id + "_dive_l");
        TextureFactory.applyChibi(this, "dive-" + id + "-t1-r", "vis_" + id + "_dive_r");
        TextureFactory.applyChibi(this, "cheer-" + id + "-t1", "vis_cheer_" + id);
        if (!this.textures.exists("vis_" + id + "_dive_r") && this.textures.exists("vis_" + id + "_dive_l")) {
          TextureFactory.mirror(this, "vis_" + id + "_dive_l", "vis_" + id + "_dive_r", true);
        }
        if (!this.textures.exists("vis_" + id + "_dive_l") && this.textures.exists("vis_" + id + "_dive_r")) {
          TextureFactory.mirror(this, "vis_" + id + "_dive_r", "vis_" + id + "_dive_l", true);
        }
        if (!this.textures.exists("vis_" + id + "_r") && this.textures.exists("vis_" + id + "_l")) {
          TextureFactory.mirror(this, "vis_" + id + "_l", "vis_" + id + "_r", true);
        }
        if (!this.textures.exists("vis_" + id + "_l") && this.textures.exists("vis_" + id + "_r")) {
          TextureFactory.mirror(this, "vis_" + id + "_r", "vis_" + id + "_l", true);
        }
        [2, 3, 4, 5].forEach((n) => {
          TextureFactory.applyChibi(this, "select-" + id + "-t" + n, "vis_select_" + id + "_" + n);
          TextureFactory.applyChibi(this, "skin-" + id + "-t" + n + "-l", "vis_" + id + "_" + n + "_l");
          TextureFactory.applyChibi(this, "skin-" + id + "-t" + n + "-r", "vis_" + id + "_" + n + "_r");
          TextureFactory.applyChibi(this, "dive-" + id + "-t" + n + "-l", "vis_" + id + "_" + n + "_dive_l");
          TextureFactory.applyChibi(this, "dive-" + id + "-t" + n + "-r", "vis_" + id + "_" + n + "_dive_r");
          TextureFactory.applyChibi(this, "cheer-" + id + "-t" + n, "vis_cheer_" + id + "_" + n);
          if (!this.textures.exists("vis_" + id + "_" + n + "_r") && this.textures.exists("vis_" + id + "_" + n + "_l")) {
            TextureFactory.mirror(this, "vis_" + id + "_" + n + "_l", "vis_" + id + "_" + n + "_r", true);
          }
          if (!this.textures.exists("vis_" + id + "_" + n + "_l") && this.textures.exists("vis_" + id + "_" + n + "_r")) {
            TextureFactory.mirror(this, "vis_" + id + "_" + n + "_r", "vis_" + id + "_" + n + "_l", true);
          }
          if (!this.textures.exists("vis_" + id + "_" + n + "_dive_r") && this.textures.exists("vis_" + id + "_" + n + "_dive_l")) {
            TextureFactory.mirror(this, "vis_" + id + "_" + n + "_dive_l", "vis_" + id + "_" + n + "_dive_r", true);
          }
          if (!this.textures.exists("vis_" + id + "_" + n + "_dive_l") && this.textures.exists("vis_" + id + "_" + n + "_dive_r")) {
            TextureFactory.mirror(this, "vis_" + id + "_" + n + "_dive_r", "vis_" + id + "_" + n + "_dive_l", true);
          }
        });
      });
    } catch (e) {
      TextureFactory.build(this);
      RANK_TIERS.forEach((row) => {
        if (!this.textures.exists(badgeKey(row.id))) {
          TextureFactory.rankBadge(this, badgeKey(row.id), row.color, row.stars);
        }
      });
      if (!this.textures.exists(badgeKey(RANK_CAL_ID))) {
        TextureFactory.rankBadge(this, badgeKey(RANK_CAL_ID), 0xc8c0b8, 0);
      }
    }
    BootSplash.setProgress(0.88);
    AuthSystem.init().then(() => {
      BootSplash.setProgress(0.96);
      I18n.load();
      if (!this.scene.isActive()) return;
      BootSplash.ready();
      if (AuthSystem.canPlay()) {
        this.scene.start(SaveSystem.hasStarter() ? "hub" : "starter");
      } else {
        this.scene.start("auth");
      }
    }).catch(() => {
      BootSplash.ready();
      if (this.scene.isActive()) this.scene.start("auth");
    });
  }
}
