import { TextureFactory } from "../systems/TextureFactory.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { I18n } from "../i18n/I18n.js";

const IDS = ["ignis", "aqua", "volt", "terra"];
const COURTS = ["summer", "rain", "spring", "winter"];

export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    this.load.on("loaderror", () => {});
    IDS.forEach((id) => {
      this.load.image("chibi-" + id, "assets/sprites/" + id + ".png");
      this.load.image("chibi-" + id + "-left", "assets/sprites/" + id + "-left.png");
      this.load.image("chibi-" + id + "-right", "assets/sprites/" + id + "-right.png");
      this.load.image("select-" + id, "assets/sprites/select-" + id + ".png");
    });
    this.load.image("ball-art", "assets/sprites/ball.png");
    this.load.image("map-etheria", "assets/maps/etheria-island.png");
    COURTS.forEach((s) => {
      this.load.image("court-" + s, "assets/sprites/court-" + s + ".png");
      this.load.image("ref-" + s, "assets/sprites/ref-" + s + ".png");
    });
  }

  create() {
    SaveSystem.load();
    I18n.load();
    try {
      TextureFactory.build(this);
      TextureFactory.applyBall(this, "ball-art", "ball");
      COURTS.forEach((s) => TextureFactory.applyChibi(this, "ref-" + s, "vis_ref_" + s));
      IDS.forEach((id) => {
        TextureFactory.applyChibi(this, "chibi-" + id, "vis_" + id);
        TextureFactory.applyChibi(this, "chibi-" + id + "-left", "vis_" + id + "_l");
        TextureFactory.applyChibi(this, "chibi-" + id + "-right", "vis_" + id + "_r");
        TextureFactory.applyChibi(this, "select-" + id, "vis_select_" + id);
        if (!this.textures.exists("vis_" + id + "_r") && this.textures.exists("vis_" + id + "_l")) {
          TextureFactory.mirror(this, "vis_" + id + "_l", "vis_" + id + "_r", true);
        }
        if (!this.textures.exists("vis_" + id + "_l") && this.textures.exists("vis_" + id + "_r")) {
          TextureFactory.mirror(this, "vis_" + id + "_r", "vis_" + id + "_l", true);
        }
      });
    } catch (e) {
      TextureFactory.build(this);
    }
    this.scene.start("menu");
  }
}
