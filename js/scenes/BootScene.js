import { TextureFactory } from "../systems/TextureFactory.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { I18n } from "../i18n/I18n.js";
import { FREE_AVATARS } from "../data/avatars.js";
import { RANK_TIERS, RANK_CAL_ID, badgeKey } from "../data/ranks.js";
import { BootSplash } from "../web/BootSplash.js";
import { SEASON_ART } from "../data/seasonCycle.js";
import { SHOP_LOOKS, SHOP_LOOK_POSES, shopLookSrc, shopLookLoadKey, shopLookVis } from "../data/costumeShop.js";

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
    this.load.image("item-stone", "assets/sprites/items/item-stone.png");
    this.load.image("item-shard", "assets/sprites/items/item-shard.png");
    this.load.image("item-coin", "assets/sprites/items/item-coin.png");
    this.load.image("item-powder", "assets/sprites/items/item-powder.png");
    this.load.image("item-ether", "assets/sprites/items/item-ether.png");
    this.load.image("item-fruit", "assets/sprites/items/item-fruit.png");
    this.load.image("item-bag", "assets/sprites/items/item-bag.png");
    this.load.image("icon-news", "assets/sprites/items/icon-news.png");
    this.load.image("icon-mirror", "assets/sprites/items/icon-mirror.png");
    this.load.image("icon-mail", "assets/sprites/items/icon-mail.png");
    this.load.image("icon-shop", "assets/sprites/items/icon-shop.png");
    this.load.image("icon-map", "assets/sprites/items/icon-map.png");
    this.load.image("icon-friends", "assets/sprites/items/icon-friends.png");
    this.load.image("icon-settings", "assets/sprites/items/icon-settings.png");
    this.load.image("icon-chat", "assets/sprites/items/icon-chat.png");
    this.load.image("item-plate-champ", "assets/sprites/items/item-plate-champ.png");
    this.load.image("item-plate-runner", "assets/sprites/items/item-plate-runner.png");
    this.load.image("item-plate-frame", "assets/sprites/items/item-plate-frame.png");
    this.load.image("item-cheer-champ", "assets/sprites/items/item-cheer-champ.png");
    SEASON_ART.forEach((id) => {
      this.load.image(id, "assets/sprites/season/" + id + ".png");
    });
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
    SHOP_LOOKS.forEach((row) => {
      SHOP_LOOK_POSES.forEach((pose) => {
        if (!pose.file) return;
        this.load.image(shopLookLoadKey(row.id, pose.file), shopLookSrc(row.id, pose.file));
      });
    });
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
      TextureFactory.applyChibi(this, "item-cheer-champ", "item-cheer-champ");
      TextureFactory.applyChibi(this, "icon-news", "vis_icon_news");
      TextureFactory.applyChibi(this, "icon-mirror", "vis_icon_mirror");
      TextureFactory.applyChibi(this, "icon-mail", "vis_icon_mail");
      TextureFactory.applyChibi(this, "icon-shop", "vis_icon_shop");
      TextureFactory.applyChibi(this, "icon-map", "vis_icon_map");
      TextureFactory.applyChibi(this, "icon-friends", "vis_icon_friends");
      TextureFactory.applyChibi(this, "icon-settings", "vis_icon_settings");
      TextureFactory.applyChibi(this, "icon-chat", "vis_icon_chat");
      TextureFactory.applyChibi(this, "item-plate-champ", "item-plate-champ");
      TextureFactory.applyChibi(this, "item-plate-runner", "item-plate-runner");
      TextureFactory.applyChibi(this, "item-plate-frame", "item-plate-frame");
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
        TextureFactory.applyChibi(this, id, dest);
      });
      ["ignis", "aqua", "volt", "terra"].forEach((id) => {
        [1, 2, 3].forEach((n) => {
          const l = "vis_champ_" + id + "_" + n + "_l";
          const r = "vis_champ_" + id + "_" + n + "_r";
          const dl = "vis_champ_" + id + "_" + n + "_dive_l";
          const dr = "vis_champ_" + id + "_" + n + "_dive_r";
          if (!this.textures.exists(r) && this.textures.exists(l)) TextureFactory.mirror(this, l, r, true);
          if (!this.textures.exists(l) && this.textures.exists(r)) TextureFactory.mirror(this, r, l, true);
          if (!this.textures.exists(dr) && this.textures.exists(dl)) TextureFactory.mirror(this, dl, dr, true);
          if (!this.textures.exists(dl) && this.textures.exists(dr)) TextureFactory.mirror(this, dr, dl, true);
        });
      });
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
      SHOP_LOOKS.forEach((row) => {
        SHOP_LOOK_POSES.forEach((pose) => {
          if (!pose.file) return;
          TextureFactory.applyChibi(this, shopLookLoadKey(row.id, pose.file), shopLookVis(row.id, pose.vis));
        });
        const l = shopLookVis(row.id, "l");
        const r = shopLookVis(row.id, "r");
        const dl = shopLookVis(row.id, "dive_l");
        const dr = shopLookVis(row.id, "dive_r");
        if (!this.textures.exists(r) && this.textures.exists(l)) TextureFactory.mirror(this, l, r, true);
        if (!this.textures.exists(dr) && this.textures.exists(dl)) TextureFactory.mirror(this, dl, dr, true);
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
