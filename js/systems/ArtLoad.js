import { TextureFactory } from "./TextureFactory.js?v=local254";
import { SaveSystem } from "./SaveSystem.js";
import { clampSkin } from "../data/skins.js";
import { champSetOf } from "../data/seasonLooks.js";
import { SEASON_ART } from "../data/seasonCycle.js";
import { SHOP_LOOKS, SHOP_LOOK_POSES, shopLookSrc, shopLookLoadKey, shopLookVis, shopLooksInTier } from "../data/costumeShop.js";

const IDS = ["ignis", "aqua", "volt", "terra"];
const cooks = [];
let flushLock = Promise.resolve();

function bagN(bag) {
  if (!bag) return 0;
  if (typeof bag.size === "number") return bag.size | 0;
  if (typeof bag.length === "number") return bag.length | 0;
  return 0;
}

function pendingCount(loader) {
  if (!loader) return 0;
  return bagN(loader.list) + bagN(loader.queue) + bagN(loader.inflight);
}

function yieldFrame() {
  return new Promise((resolve) => {
    const t = window.setTimeout(resolve, 32);
    requestAnimationFrame(() => {
      window.clearTimeout(t);
      resolve();
    });
  });
}

function seasonDest(id) {
  if (String(id).indexOf("select-champ-") === 0) {
    return "vis_select_champ_" + id.slice("select-champ-".length).replace("-", "_");
  }
  if (String(id).indexOf("champ-") === 0) {
    const left = id.match(/^champ-(\w+)-(\d+)-left$/);
    const cheer = id.match(/^champ-(\w+)-(\d+)-cheer$/);
    const dive = id.match(/^champ-(\w+)-(\d+)-dive-left$/);
    if (left) return "vis_champ_" + left[1] + "_" + left[2] + "_l";
    if (cheer) return "vis_cheer_champ_" + cheer[1] + "_" + cheer[2];
    if (dive) return "vis_champ_" + dive[1] + "_" + dive[2] + "_dive_l";
  }
  return id;
}

function want(scene, key, url, dest, knock) {
  const vis = dest || key;
  if (scene.textures.exists(vis)) return;
  if (url && !scene.textures.exists(key)) scene.load.image(key, url);
  cooks.push({ src: key, dest: vis, knock: Boolean(knock) });
}

function waitLoad(scene) {
  return new Promise((resolve) => {
    const loader = scene.load;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const pending = pendingCount(loader);
    if (!loader.isLoading() && pending <= 0) {
      finish();
      return;
    }
    loader.once("complete", finish);
    loader.once("loaderror", () => {
      if (!loader.isLoading() && pendingCount(loader) <= 0) finish();
    });
    if (!loader.isLoading()) loader.start();
    window.setTimeout(finish, 10000);
  });
}

async function cookQueued(scene) {
  const jobs = cooks.splice(0, cooks.length);
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    if (!scene.textures.exists(job.dest) && scene.textures.exists(job.src)) {
      TextureFactory.applyChibi(scene, job.src, job.dest, job.knock);
    }
    if ((i & 1) === 1) await yieldFrame();
  }
}

function mirrorIf(scene, src, dest) {
  if (!scene.textures.exists(dest) && scene.textures.exists(src)) TextureFactory.mirror(scene, src, dest, true);
}

function wantSkin(scene, id, tier) {
  const n = clampSkin(tier);
  if (n <= 1) return;
  want(scene, "select-" + id + "-t" + n, "assets/sprites/skins/select-" + id + "-t" + n + ".png", "vis_select_" + id + "_" + n);
  want(scene, "skin-" + id + "-t" + n + "-l", "assets/sprites/skins/" + id + "-t" + n + "-left.png", "vis_" + id + "_" + n + "_l");
  want(scene, "skin-" + id + "-t" + n + "-r", "assets/sprites/skins/" + id + "-t" + n + "-right.png", "vis_" + id + "_" + n + "_r");
  want(scene, "dive-" + id + "-t" + n + "-l", "assets/sprites/skins/" + id + "-t" + n + "-dive-left.png", "vis_" + id + "_" + n + "_dive_l");
  want(scene, "dive-" + id + "-t" + n + "-r", "assets/sprites/skins/" + id + "-t" + n + "-dive-right.png", "vis_" + id + "_" + n + "_dive_r");
  want(scene, "cheer-" + id + "-t" + n, "assets/sprites/skins/" + id + "-t" + n + "-cheer.png", "vis_cheer_" + id + "_" + n);
}

function finishSkin(scene, id, tier) {
  const n = clampSkin(tier);
  if (n <= 1) return;
  mirrorIf(scene, "vis_" + id + "_" + n + "_l", "vis_" + id + "_" + n + "_r");
  mirrorIf(scene, "vis_" + id + "_" + n + "_r", "vis_" + id + "_" + n + "_l");
  mirrorIf(scene, "vis_" + id + "_" + n + "_dive_l", "vis_" + id + "_" + n + "_dive_r");
  mirrorIf(scene, "vis_" + id + "_" + n + "_dive_r", "vis_" + id + "_" + n + "_dive_l");
}

function wantLook(scene, lookId) {
  SHOP_LOOK_POSES.forEach((pose) => {
    if (!pose.file) return;
    want(scene, shopLookLoadKey(lookId, pose.file), shopLookSrc(lookId, pose.file), shopLookVis(lookId, pose.vis));
  });
}

function finishLook(scene, lookId) {
  mirrorIf(scene, shopLookVis(lookId, "l"), shopLookVis(lookId, "r"));
  mirrorIf(scene, shopLookVis(lookId, "dive_l"), shopLookVis(lookId, "dive_r"));
}

function wantChamp(scene, charId, set) {
  const n = set | 0;
  if (n < 1 || n > 3) return;
  const id = charId + "-" + n;
  want(scene, "select-champ-" + id, "assets/sprites/season/select-champ-" + id + ".png", "vis_select_champ_" + charId + "_" + n);
  want(scene, "champ-" + id + "-left", "assets/sprites/season/champ-" + id + "-left.png", "vis_champ_" + charId + "_" + n + "_l");
  want(scene, "champ-" + id + "-cheer", "assets/sprites/season/champ-" + id + "-cheer.png", "vis_cheer_champ_" + charId + "_" + n);
  want(scene, "champ-" + id + "-dive-left", "assets/sprites/season/champ-" + id + "-dive-left.png", "vis_champ_" + charId + "_" + n + "_dive_l");
}

function finishChamp(scene, charId, set) {
  const n = set | 0;
  if (n < 1 || n > 3) return;
  mirrorIf(scene, "vis_champ_" + charId + "_" + n + "_l", "vis_champ_" + charId + "_" + n + "_r");
  mirrorIf(scene, "vis_champ_" + charId + "_" + n + "_r", "vis_champ_" + charId + "_" + n + "_l");
  mirrorIf(scene, "vis_champ_" + charId + "_" + n + "_dive_l", "vis_champ_" + charId + "_" + n + "_dive_r");
  mirrorIf(scene, "vis_champ_" + charId + "_" + n + "_dive_r", "vis_champ_" + charId + "_" + n + "_dive_l");
}

function wantChar(scene, charId, skin, champ, lookId) {
  if (!charId) return;
  wantSkin(scene, charId, skin);
  wantChamp(scene, charId, champ);
  if (lookId) wantLook(scene, lookId);
}

function finishChar(scene, charId, skin, champ, lookId) {
  if (!charId) return;
  finishSkin(scene, charId, skin);
  finishChamp(scene, charId, champ);
  if (lookId) finishLook(scene, lookId);
}

export const ArtLoad = {
  async flush(scene) {
    const prev = flushLock;
    let release = () => {};
    flushLock = new Promise((resolve) => { release = resolve; });
    await prev.catch(() => {});
    try {
      await waitLoad(scene);
      await cookQueued(scene);
    } finally {
      release();
    }
  },

  async ensureWorn(scene, charId) {
    if (!scene || !charId) return;
    const skin = SaveSystem.skinOf(charId);
    const champ = champSetOf(charId);
    const look = SaveSystem.wornShopLook ? SaveSystem.wornShopLook(charId) : "";
    wantChar(scene, charId, skin, champ, look);
    await this.flush(scene);
    finishChar(scene, charId, skin, champ, look);
  },

  async ensureMatch(scene, youId, foeId, youSkin, foeSkin, youChamp, foeChamp) {
    if (!scene) return;
    const youLook = youId && SaveSystem.wornShopLook ? SaveSystem.wornShopLook(youId) : "";
    wantChar(scene, youId, youSkin, youChamp, youLook);
    wantChar(scene, foeId, foeSkin, foeChamp, "");
    await this.flush(scene);
    finishChar(scene, youId, youSkin, youChamp, youLook);
    finishChar(scene, foeId, foeSkin, foeChamp, "");
  },

  async ensureSkinSet(scene, charId) {
    if (!scene || !charId) return;
    [2, 3, 4, 5].forEach((n) => wantSkin(scene, charId, n));
    await this.flush(scene);
    [2, 3, 4, 5].forEach((n) => finishSkin(scene, charId, n));
  },

  async ensureShopTier(scene, tierId) {
    if (!scene) return;
    const rows = shopLooksInTier(tierId);
    rows.forEach((row) => wantLook(scene, row.id));
    await this.flush(scene);
    rows.forEach((row) => finishLook(scene, row.id));
  },

  async ensureChampLooks(scene) {
    if (!scene) return;
    SEASON_ART.forEach((id) => {
      want(scene, id, "assets/sprites/season/" + id + ".png", seasonDest(id));
    });
    await this.flush(scene);
    IDS.forEach((id) => {
      [1, 2, 3].forEach((n) => finishChamp(scene, id, n));
    });
  }
};
