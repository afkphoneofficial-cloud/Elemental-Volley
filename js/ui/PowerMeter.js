export class PowerMeter {
  constructor(scene, color) {
    this.scene = scene;
    this.value = 0;
    this.dir = 1;
    this.active = false;
    this.track = scene.add.rectangle(0, 0, 52, 8, 0x1a1018, 0.9).setStrokeStyle(1, color, 0.85).setDepth(30);
    this.fill = scene.add.rectangle(0, 0, 18, 6, 0x2ecc71, 1).setDepth(31);
    this.needle = scene.add.rectangle(0, 0, 3, 12, 0xffffff, 1).setDepth(32);
    this.hide();
  }

  show() { this.active = true; this.setVisible(true); }
  hide() { this.active = false; this.setVisible(false); }

  setVisible(v) {
    this.track.setVisible(v);
    this.fill.setVisible(v);
    this.needle.setVisible(v);
  }

  follow(x, y) {
    this.track.setPosition(x + 48, y - 42);
    this.fill.setPosition(x + 48, y - 42);
    this.needle.setPosition(x + 48 - 22 + this.value * 44, y - 42);
  }

  update(dt) {
    if (!this.active) return;
    this.value += this.dir * dt * 0.00105;
    if (this.value >= 1) { this.value = 1; this.dir = -1; }
    if (this.value <= 0) { this.value = 0; this.dir = 1; }
  }

  quality() {
    const v = this.value;
    if (v >= 0.42 && v <= 0.58) return "perfect";
    if (v >= 0.28 && v <= 0.72) return "good";
    if (v < 0.28) return "early";
    return "late";
  }
}
