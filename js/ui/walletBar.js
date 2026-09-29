import { UI_FONT } from "./Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";

const CHIPS = [
  { id: "tokens", field: "tokens", icon: "item-shard", color: 0xff6a22 },
  { id: "pvp", field: "pvp", icon: "item-stone", color: 0x7d5cff },
  { id: "coins", field: "coins", icon: "item-coin", color: 0xffb14a },
  { id: "premium", field: "premium", icon: "item-powder", color: 0x3ad6ff, go: "topup" }
];

export function paintWalletBar(scene, from) {
  const W = scene.scale.width;
  const h = 40;
  const gap = 8;
  const w = 118;
  const y = 40;
  const n = CHIPS.length;
  const total = n * w + (n - 1) * gap;
  const x0 = W - 24 - total + w / 2;
  const bag = SaveSystem.data.currencies || {};
  CHIPS.forEach((row, i) => {
    const x = x0 + i * (w + gap);
    const g = scene.add.graphics().setDepth(30);
    g.fillStyle(0xfff6ea, 0.96);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    g.lineStyle(2, row.color, 0.8);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
    const ik = scene.textures.exists(row.icon) ? row.icon : "item-shard";
    scene.add.image(x - 38, y, ik).setDisplaySize(26, 26).setDepth(31);
    scene.add.text(x + 8, y, String(bag[row.field] | 0), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(31);
    const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: Boolean(row.go) }).setDepth(32);
    if (row.go) {
      zone.on("pointerdown", () => {
        AudioSystem.ui();
        scene.scene.start("topup", { from: from || "shop" });
      });
    }
  });
}
