import { TextureFactory } from "../systems/TextureFactory.js?v=local248";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { I18n } from "../i18n/I18n.js?v=local249";
import { FREE_AVATARS } from "../data/avatars.js";
import { RANK_TIERS, RANK_CAL_ID, badgeKey } from "../data/ranks.js";
import { BootSplash } from "../web/BootSplash.js?v=local248";
import { WelcomePop } from "../systems/WelcomePop.js?v=local250";
import { SEASON_ART } from "../data/seasonCycle.js";
import { SHOP_LOOKS, SHOP_LOOK_POSES, shopLookSrc, shopLookLoadKey, shopLookVis } from "../data/costumeShop.js";
import { BALL_FX } from "../data/ballFx.js?v=local196";
import { ULT_ORBS } from "../data/ultOrb.js?v=local198";

const IDS = ["ignis", "aqua", "volt", "terra"];
const COURTS = ["summer", "rain", "spring", "winter"];

export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    try {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const tiny = Math.min(window.innerWidth, window.innerHeight) <= 540;
      TextureFactory.lightMobile = Boolean(coarse || tiny);
    } catch (e) {
      TextureFactory.lightMobile = true;
    }
    this.load.maxParallelDownloads = TextureFactory.lightMobile ? 4 : 8;
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
    this.load.image("item-stone", "assets/sprites/items/item-stone.png");
    this.load.image("item-shard", "assets/sprites/items/item-shard.png");
    this.load.image("item-coin", "assets/sprites/items/item-coin.png");
    this.load.image("item-powder", "assets/sprites/items/item-powder.png");
    this.load.image("item-ether", "assets/sprites/items/item-ether.png");
    this.load.image("item-fruit", "assets/sprites/items/item-fruit.png");
    this.load.image("item-bag", "assets/sprites/items/item-bag.png");
    this.load.image("item-pact-cube", "assets/sprites/items/item-pact-cube.png");
    this.load.image("icon-news", "assets/sprites/items/icon-news.png");
    this.load.image("icon-mirror", "assets/sprites/items/icon-mirror.png");
    this.load.image("icon-mail", "assets/sprites/items/icon-mail.png");
    this.load.image("icon-shop", "assets/sprites/items/icon-shop.png");
    this.load.image("icon-champ", "assets/sprites/items/icon-champ.png");
    this.load.image("icon-growth", "assets/sprites/items/icon-growth.png");
    this.load.image("icon-ticket", "assets/sprites/items/icon-ticket.jpg");
    this.load.image("icon-map", "assets/sprites/items/icon-map.png");
    this.load.image("icon-friends", "assets/sprites/items/icon-friends.png");
    this.load.image("icon-settings", "assets/sprites/items/icon-settings.png");
    this.load.image("icon-chat", "assets/sprites/items/icon-chat.png");
    this.load.image("icon-social", "assets/sprites/items/icon-social.png");
    this.load.image("icon-namestone", "assets/sprites/items/icon-namestone.png");
    this.load.image("item-plate-champ", "assets/sprites/items/item-plate-champ.png");
    this.load.image("item-plate-runner", "assets/sprites/items/item-plate-runner.png");
    this.load.image("item-plate-frame", "assets/sprites/items/item-plate-frame.png");
    this.load.image("item-cheer-champ", "assets/sprites/items/item-cheer-champ.png");
    SEASON_ART.forEach((id) => {
      this.load.image(id, "assets/sprites/season/" + id + ".png");
    });
    this.load.image("ball-art", "assets/sprites/ball.png");
    BALL_FX.forEach((row) => {
      this.load.image(row.tex, row.src);
    });
    ULT_ORBS.forEach((row) => {
      this.load.image(row.tex + "-art", row.src);
    });
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
    SHOP_LOOKS.forEach((row) => {
      SHOP_LOOK_POSES.forEach((pose) => {
        if (!pose.file) return;
        this.load.image(shopLookLoadKey(row.id, pose.file), shopLookSrc(row.id, pose.file));
      });
    });
  }

  create() {
    void this.finishBoot().catch(() => {
      BootSplash.ready();
      if (this.scene.isActive()) this.scene.start("auth");
    });
  }

  async finishBoot() {
    BootSplash.setProgress(0.8);
    SaveSystem.load();
    I18n.load();
    const scene = this;
    const jobs = [];
    const chibi = (src, dest, knock) => jobs.push(() => TextureFactory.applyChibi(scene, src, dest, knock));
    const maybeMirror = (src, dest) => jobs.push(() => {
      if (!scene.textures.exists(dest) && scene.textures.exists(src)) TextureFactory.mirror(scene, src, dest, true);
    });
    try {
      TextureFactory.build(this);
      TextureFactory.applyBall(this, "ball-art", "ball");
      ULT_ORBS.forEach((row) => chibi(row.tex + "-art", row.tex));
      RANK_TIERS.forEach((row) => {
        if (!this.textures.exists(badgeKey(row.id))) {
          TextureFactory.rankBadge(this, badgeKey(row.id), row.color, row.stars);
        }
      });
      if (!this.textures.exists(badgeKey(RANK_CAL_ID))) {
        TextureFactory.rankBadge(this, badgeKey(RANK_CAL_ID), 0xc8c0b8, 0);
      }
      chibi("item-pact-cube", "vis_item_pact_cube");
      chibi("icon-news", "vis_icon_news");
      chibi("icon-mirror", "vis_icon_mirror");
      chibi("icon-mail", "vis_icon_mail");
      chibi("icon-shop", "vis_icon_shop");
      chibi("icon-champ", "vis_icon_champ", true);
      chibi("icon-growth", "vis_icon_growth", true);
      chibi("icon-ticket", "vis_icon_ticket", true);
      chibi("icon-map", "vis_icon_map");
      chibi("icon-friends", "vis_icon_friends");
      chibi("icon-settings", "vis_icon_settings");
      chibi("icon-chat", "vis_icon_chat");
      chibi("icon-social", "vis_icon_social");
      chibi("icon-namestone", "icon-namestone");
      chibi("item-plate-champ", "item-plate-champ");
      chibi("item-plate-runner", "item-plate-runner");
      chibi("item-plate-frame", "item-plate-frame");
      chibi("item-cheer-champ", "item-cheer-champ");
      SEASON_ART.forEach((id) => {
        let dest = id;
        if (id.indexOf("select-champ-") === 0) {
          dest = "vis_select_champ_" + id.slice("select-champ-".length).replace("-", "_");
        } else if (id.indexOf("champ-") === 0) {
          const left = id.match(/^champ-(\w+)-(\d+)-left$/);
          const cheer = id.match(/^champ-(\w+)-(\d+)-cheer$/);
          const dive = id.match(/^champ-(\w+)-(\d+)-dive-left$/);
          if (left) dest = "vis_champ_" + left[1] + "_" + left[2] + "_l";
          else if (cheer) dest = "vis_cheer_champ_" + cheer[1] + "_" + cheer[2];
          else if (dive) dest = "vis_champ_" + dive[1] + "_" + dive[2] + "_dive_l";
        }
        chibi(id, dest);
      });
      ["ignis", "aqua", "volt", "terra"].forEach((id) => {
        [1, 2, 3].forEach((n) => {
          maybeMirror("vis_champ_" + id + "_" + n + "_l", "vis_champ_" + id + "_" + n + "_r");
          maybeMirror("vis_champ_" + id + "_" + n + "_r", "vis_champ_" + id + "_" + n + "_l");
          maybeMirror("vis_champ_" + id + "_" + n + "_dive_l", "vis_champ_" + id + "_" + n + "_dive_r");
          maybeMirror("vis_champ_" + id + "_" + n + "_dive_r", "vis_champ_" + id + "_" + n + "_dive_l");
        });
      });
      chibi("ether-art", "vis_ether");
      FREE_AVATARS.forEach((a) => chibi("av-art-" + a.id, "vis_" + a.id));
      COURTS.forEach((s) => chibi("ref-" + s, "vis_ref_" + s));
      IDS.forEach((id) => {
        chibi("chibi-" + id, "vis_" + id);
        chibi("chibi-" + id + "-left", "vis_" + id + "_l");
        chibi("chibi-" + id + "-right", "vis_" + id + "_r");
        chibi("select-" + id, "vis_select_" + id);
        chibi("dive-" + id + "-t1-l", "vis_" + id + "_dive_l");
        chibi("dive-" + id + "-t1-r", "vis_" + id + "_dive_r");
        chibi("cheer-" + id + "-t1", "vis_cheer_" + id);
        maybeMirror("vis_" + id + "_dive_l", "vis_" + id + "_dive_r");
        maybeMirror("vis_" + id + "_dive_r", "vis_" + id + "_dive_l");
        maybeMirror("vis_" + id + "_l", "vis_" + id + "_r");
        maybeMirror("vis_" + id + "_r", "vis_" + id + "_l");
        [2, 3, 4, 5].forEach((n) => {
          chibi("select-" + id + "-t" + n, "vis_select_" + id + "_" + n);
          chibi("skin-" + id + "-t" + n + "-l", "vis_" + id + "_" + n + "_l");
          chibi("skin-" + id + "-t" + n + "-r", "vis_" + id + "_" + n + "_r");
          chibi("dive-" + id + "-t" + n + "-l", "vis_" + id + "_" + n + "_dive_l");
          chibi("dive-" + id + "-t" + n + "-r", "vis_" + id + "_" + n + "_dive_r");
          chibi("cheer-" + id + "-t" + n, "vis_cheer_" + id + "_" + n);
          maybeMirror("vis_" + id + "_" + n + "_l", "vis_" + id + "_" + n + "_r");
          maybeMirror("vis_" + id + "_" + n + "_r", "vis_" + id + "_" + n + "_l");
          maybeMirror("vis_" + id + "_" + n + "_dive_l", "vis_" + id + "_" + n + "_dive_r");
          maybeMirror("vis_" + id + "_" + n + "_dive_r", "vis_" + id + "_" + n + "_dive_l");
        });
      });
      SHOP_LOOKS.forEach((row) => {
        SHOP_LOOK_POSES.forEach((pose) => {
          if (!pose.file) return;
          chibi(shopLookLoadKey(row.id, pose.file), shopLookVis(row.id, pose.vis));
        });
        maybeMirror(shopLookVis(row.id, "l"), shopLookVis(row.id, "r"));
        maybeMirror(shopLookVis(row.id, "dive_l"), shopLookVis(row.id, "dive_r"));
      });
      const chunk = TextureFactory.lightMobile ? 2 : 10;
      for (let i = 0; i < jobs.length; i += 1) {
        jobs[i]();
        if ((i + 1) % chunk === 0) {
          BootSplash.setProgress(0.8 + 0.08 * ((i + 1) / jobs.length));
          await new Promise((r) => {
            const t = window.setTimeout(r, 24);
            requestAnimationFrame(() => {
              window.clearTimeout(t);
              r();
            });
          });
        }
      }
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
    try {
      await AuthSystem.init();
    } catch (e) {}
    BootSplash.setProgress(0.96);
    I18n.load();
    if (!this.scene.isActive()) return;
    BootSplash.ready();
    if (AuthSystem.canPlay()) {
      window.setTimeout(() => WelcomePop.tryShow(), 480);
      this.scene.start(SaveSystem.hasStarter() ? "hub" : "starter");
    } else {
      this.scene.start("auth");
    }
  }
}
