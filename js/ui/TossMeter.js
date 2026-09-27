export class TossMeter {
  constructor(scene) {
    this.scene = scene;
    this.level = 0;
    this.track = scene.add.rectangle(0, 0, 10, 58, 0x1a1018, 0.92).setStrokeStyle(1, 0xffd24a, 0.9).setDepth(30);
    this.fill = scene.add.rectangle(0, 0, 8, 4, 0xff8a3a, 1).setOrigin(0.5, 1).setDepth(31);
    this.label = scene.add.text(0, 0, "TOSS", {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "10px", color: "#ffd24a"
    }).setOrigin(0.5).setDepth(32);
    this.hide();
  }

  show() { this.setVisible(true); this.setLevel(0); }
  hide() { this.setVisible(false); }

  setVisible(v) {
    this.track.setVisible(v);
    this.fill.setVisible(v);
    this.label.setVisible(v);
  }

  setLevel(v) {
    this.level = Phaser.Math.Clamp(v, 0, 1);
    this.fill.setSize(8, 6 + this.level * 48);
  }

  follow(x, y) {
    this.track.setPosition(x - 46, y - 36);
    this.fill.setPosition(x - 46, y - 36 + 28);
    this.label.setPosition(x - 46, y - 72);
  }
}
