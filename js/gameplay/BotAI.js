import { GAME, PHYSICS } from "../config/gameConfig.js";

export class BotAI {
  constructor(difficulty = "normal") {
    const table = {
      easy: { error: 70, jumpEarly: 0.4 },
      normal: { error: 28, jumpEarly: 0.72 },
      hard: { error: 8, jumpEarly: 0.9 }
    };
    this.profile = table[difficulty] || table.normal;
    this.holdingRecv = false;
    this.holdingSpike = false;
  }

  predictX(ball) {
    let x = ball.x;
    let y = ball.y;
    let vx = ball.body.velocity.x;
    let vy = ball.body.velocity.y;
    const dt = 1 / 60;
    for (let t = 0; t < 1.2; t += dt) {
      vy += PHYSICS.ballGravity * dt;
      x += vx * dt;
      y += vy * dt;
      if (x < GAME.netX + 10 && x > GAME.netX - 10 && y > GAME.netTop) vx *= -0.55;
      if (y >= GAME.groundY - 26) break;
    }
    return Phaser.Math.Clamp(x + this.profile.error * (Math.random() - 0.5), GAME.netX + 46, GAME.courtRight - 40);
  }

  think(bot, ball, phase, touches) {
    const idle = this.idle();
    if (phase === "serve_wait" || phase === "serve_charge") return idle;
    if (phase === "serve_toss") {
      return { ...idle, hit: true, aimDown: true };
    }

    const incoming = ball.x > GAME.netX - 40;
    const target = incoming ? this.predictX(ball) : GAME.netX + 200;
    const dx = target - bot.x;
    const dist = Phaser.Math.Distance.Between(bot.x, bot.y - 16, ball.x, ball.y);
    const near = dist < PHYSICS.receiveHit && incoming;

    if (incoming && (touches || 0) === 0) {
      if (!this.holdingRecv && dist < 340) this.holdingRecv = true;
      const release = this.holdingRecv && near;
      if (release) this.holdingRecv = false;
      return {
        ...idle,
        left: dx < -16,
        right: dx > 16,
        recvHeld: this.holdingRecv,
        recvDown: this.holdingRecv,
        recvUp: release,
        aimDown: true
      };
    }
    this.holdingRecv = false;

    if (incoming && (touches || 0) >= 1) {
      if (!this.holdingSpike && dist < 280) this.holdingSpike = true;
      const release = this.holdingSpike && near;
      if (release) this.holdingSpike = false;
      return {
        ...idle,
        left: dx < -16,
        right: dx > 16,
        spikeHeld: this.holdingSpike,
        spikeDown: this.holdingSpike,
        spikeUp: release,
        aimLeft: Math.random() > 0.55,
        aimRight: Math.random() > 0.72
      };
    }
    this.holdingSpike = false;

    return {
      ...idle,
      left: dx < -16,
      right: dx > 16
    };
  }

  idle() {
    return {
      left: false, right: false, jump: false, down: false,
      hit: false, recvHeld: false, recvDown: false, recvUp: false,
      spikeHeld: false, spikeDown: false, spikeUp: false,
      tossHeld: false, tossUp: false,
      aimLeft: false, aimRight: false, aimDown: false
    };
  }
}
