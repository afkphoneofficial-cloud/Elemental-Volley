import { GAME } from "../config/gameConfig.js";

const FONT = "Segoe UI, Kanit, sans-serif";

export class ActionGuide {
  constructor(scene) {
    const y = GAME.height - 52;
    this.panel = scene.add.rectangle(GAME.width / 2, y, 920, 72, 0x120818, 0.88)
      .setStrokeStyle(2, 0xff8a3a, 0.65)
      .setDepth(20);
    this.title = scene.add.text(GAME.width / 2, y - 16, "", {
      fontFamily: FONT, fontSize: "13px", color: "#ffd24a"
    }).setOrigin(0.5).setDepth(21);
    this.body = scene.add.text(GAME.width / 2, y + 10, "", {
      fontFamily: FONT, fontSize: "20px", fontStyle: "700", color: "#fff4e8", align: "center"
    }).setOrigin(0.5).setDepth(21);
  }

  set(text) {
    if (this.body.text !== text) this.body.setText(text);
  }
}
