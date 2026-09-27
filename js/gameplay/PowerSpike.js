import { MATCH } from "../config/gameConfig.js";

/**
 * Character power-spike minigames share the same ±150ms window.
 * Input style differs; difficulty does not.
 */
export class PowerSpikeDirector {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.result = null;
    this.elapsed = 0;
    this.holdMs = 0;
    this.needle = 0;
    this.dirLit = false;
    this.ringT = 0;
    this.overlay = [];
  }

  start(character) {
    this.clear();
    this.active = true;
    this.result = null;
    this.elapsed = 0;
    this.holdMs = 0;
    this.needle = 0;
    this.ringT = 0;
    this.character = character;
    this.scene.time.timeScale = 0.35;
    this.drawChrome(character);
  }

  drawChrome(character) {
    const { width: W } = this.scene.scale;
    const f = "Segoe UI, Kanit, sans-serif";
    this.overlay.push(this.scene.add.rectangle(W / 2, 160, 640, 86, 0x100814, 0.78));
    this.overlay.push(this.scene.add.text(W / 2, 132, character.spikeLabel, {
      fontFamily: f, fontSize: "16px", color: "#fff4e8"
    }).setOrigin(0.5));
    this.hint = this.scene.add.rectangle(W / 2, 172, 220, 18, 0x3a2040);
    this.overlay.push(this.hint);
  }

  update(dt, input) {
    if (!this.active) return null;
    this.elapsed += dt;
    const windowStart = 280;
    const windowEnd = windowStart + MATCH.timingWindowMs;
    const inWindow = this.elapsed >= windowStart && this.elapsed <= windowEnd;
    this.hint.setFillStyle(inWindow ? 0x7dff8a : 0x3a2040);

    const type = this.character.spikeInput;
    let success = false;
    let perfect = false;

    if (type === "hold_release") {
      if (input.action2) this.holdMs += dt;
      if (!input.action2 && this.holdMs > 80) {
        success = inWindow;
        perfect = inWindow;
        this.finish(success, perfect);
      }
    } else if (type === "direction_tap") {
      if (input.left || input.right || input.jump) {
        success = inWindow;
        perfect = inWindow;
        this.finish(success, perfect);
      }
    } else if (type === "ring_tap") {
      this.ringT += dt;
      if (input.action2Pressed) {
        success = inWindow;
        perfect = inWindow;
        this.finish(success, perfect);
      }
    } else if (type === "gauge_stop") {
      if (input.action2Pressed) {
        success = inWindow;
        perfect = inWindow;
        this.finish(success, perfect);
      }
    }

    if (this.elapsed > 900) this.finish(false, false);
    return this.result;
  }

  finish(success, perfect) {
    if (!this.active) return;
    this.active = false;
    this.result = { success, perfect };
    this.scene.time.timeScale = 1;
    this.clear();
  }

  clear() {
    this.overlay.forEach((o) => o.destroy());
    this.overlay = [];
  }
}
