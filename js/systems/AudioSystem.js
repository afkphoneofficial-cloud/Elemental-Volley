let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuf = null;
let themeId = null;
let accentTimer = null;
let liveNodes = [];
let musicEl = null;
let musicVol = 0.55;
let sfxVol = 1;
const VOL_KEY = "ev-music-vol";
const SFX_KEY = "ev-sfx-vol";
const BGM_SRC = {
  menu: "assets/audio/bgm-menu.mp3",
  summer: "assets/audio/bgm-summer.mp3",
  rain: "assets/audio/bgm-rain.mp3",
  spring: "assets/audio/bgm-spring.mp3",
  winter: "assets/audio/bgm-winter.mp3"
};

function readStoredVol() {
  try {
    const v = parseFloat(localStorage.getItem(VOL_KEY));
    if (!Number.isNaN(v)) musicVol = Math.max(0, Math.min(1, v));
  } catch (e) { /* keep default */ }
  try {
    const s = parseFloat(localStorage.getItem(SFX_KEY));
    if (!Number.isNaN(s)) sfxVol = Math.max(0, Math.min(1, s));
  } catch (e) { /* keep default */ }
}

function applyMusicVol() {
  if (musicEl) musicEl.volume = musicVol;
}

function applySfxVol() {
  if (sfxBus) sfxBus.gain.value = 1.15 * sfxVol;
}

function playFileTheme(id) {
  const src = BGM_SRC[id] || BGM_SRC.menu;
  if (themeId === id && musicEl && !musicEl.paused) {
    applyMusicVol();
    return true;
  }
  haltMusic();
  themeId = id;
  const el = new Audio(src);
  el.loop = true;
  el.preload = "auto";
  el.volume = musicVol;
  musicEl = el;
  const start = () => {
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  };
  el.addEventListener("error", () => {
    if (!String(el.src).endsWith(".mp3.mp3")) {
      el.src = src + ".mp3";
      start();
    }
  }, { once: true });
  start();
  return true;
}

function ensure() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    if (!master) {
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1.15 * sfxVol;
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.22;
      musicBus.connect(master);
    }
    if (!noiseBuf) {
      const n = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i += 1) {
        last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
        d[i] = (Math.random() * 2 - 1) * 0.55 + last;
      }
    }
    return ctx;
  } catch (e) {
    return null;
  }
}

function hold(node) {
  liveNodes.push(node);
  return node;
}

function osc(type, freq, t0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  return o;
}

function env(t0, peak, atk, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

function noiseBurst(t0, dur, peak, filterType, freq, q, dest) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType;
  f.frequency.setValueAtTime(freq, t0);
  f.Q.value = q;
  const g = env(t0, peak, 0.004, dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest || sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function blip(type, freq, t0, dur, peak, dest, endFreq) {
  const o = osc(type, freq, t0);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 30), t0 + dur);
  const g = env(t0, peak, 0.004, dur);
  o.connect(g);
  g.connect(dest || sfxBus);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function loopNoise(filterType, freq, q, gainVal, dest) {
  const src = hold(ctx.createBufferSource());
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gainVal;
  const lfo = hold(osc("sine", 0.08, ctx.currentTime));
  const lg = ctx.createGain();
  lg.gain.value = freq * 0.18;
  lfo.connect(lg);
  lg.connect(f.frequency);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start();
  lfo.start();
}

function haltMusic() {
  themeId = null;
  if (accentTimer) {
    clearTimeout(accentTimer);
    accentTimer = null;
  }
  liveNodes.forEach((n) => {
    try { n.stop(); } catch (e) {}
    try { n.disconnect(); } catch (e) {}
  });
  liveNodes = [];
  if (musicEl) {
    try { musicEl.pause(); } catch (e) {}
    musicEl = null;
  }
}

function sparseAccent(id) {
  if (themeId !== id) return;
  const t0 = ctx.currentTime;
  if (id === "spring") {
    blip("sine", 784, t0, 0.7, 0.018, musicBus);
    blip("sine", 1175, t0 + 0.04, 0.45, 0.01, musicBus);
  } else if (id === "winter") {
    blip("sine", 1319, t0, 0.12, 0.014, musicBus);
  } else if (id === "summer") {
    blip("sine", 196, t0, 1.4, 0.012, musicBus);
  } else if (id === "rain") {
    noiseBurst(t0, 0.05, 0.03, "highpass", 2400, 0.4, musicBus);
  }
  const wait = 5000 + Math.random() * 7000;
  accentTimer = setTimeout(() => sparseAccent(id), wait);
}

function playTheme(id) {
  if (!ensure()) return;
  if (!playFileTheme(id)) return;
}

function ballThump(t0, heavy) {
  noiseBurst(t0, heavy ? 0.07 : 0.045, heavy ? 0.14 : 0.1, "lowpass", heavy ? 280 : 420, 0.7);
  blip("sine", heavy ? 90 : 140, t0, heavy ? 0.09 : 0.055, heavy ? 0.14 : 0.1);
}

function hitIgnis(power) {
  const t0 = ctx.currentTime;
  ballThump(t0, power);
  noiseBurst(t0, power ? 0.12 : 0.07, power ? 0.12 : 0.08, "bandpass", 1800, 3);
  blip("sawtooth", power ? 520 : 420, t0, power ? 0.11 : 0.07, 0.07, sfxBus, 110);
}

function hitAqua(power) {
  const t0 = ctx.currentTime;
  ballThump(t0, power);
  noiseBurst(t0, power ? 0.14 : 0.08, 0.09, "highpass", 2200, 0.5);
  blip("sine", 880, t0, 0.05, 0.07, sfxBus, 420);
  blip("sine", 520, t0 + 0.04, 0.07, 0.05, sfxBus, 240);
}

function hitVolt(power) {
  const t0 = ctx.currentTime;
  ballThump(t0, power);
  blip("square", 2400, t0, 0.018, 0.09);
  blip("square", 1600, t0 + 0.018, 0.02, 0.08);
  blip("square", 3200, t0 + 0.036, 0.016, 0.07);
  if (power) noiseBurst(t0, 0.08, 0.08, "highpass", 4000, 0.3);
}

function hitTerra(power) {
  const t0 = ctx.currentTime;
  ballThump(t0, true);
  noiseBurst(t0, power ? 0.16 : 0.1, power ? 0.13 : 0.09, "lowpass", 180, 0.6);
  blip("sine", 55, t0, power ? 0.16 : 0.1, 0.13);
  blip("triangle", 110, t0, 0.08, 0.06);
}

function jumpIgnis() {
  const t0 = ctx.currentTime;
  noiseBurst(t0, 0.06, 0.07, "bandpass", 1400, 1.2);
  blip("sine", 220, t0, 0.08, 0.08, sfxBus, 640);
}

function jumpAqua() {
  const t0 = ctx.currentTime;
  blip("triangle", 240, t0, 0.05, 0.09, sfxBus, 520);
  blip("sine", 420, t0 + 0.05, 0.07, 0.06, sfxBus, 280);
}

function jumpVolt() {
  const t0 = ctx.currentTime;
  blip("square", 1860, t0, 0.02, 0.07);
  blip("square", 2480, t0 + 0.02, 0.025, 0.06);
  blip("sine", 740, t0, 0.05, 0.04, sfxBus, 1400);
}

function jumpTerra() {
  const t0 = ctx.currentTime;
  noiseBurst(t0, 0.05, 0.07, "lowpass", 240, 0.8);
  blip("sine", 70, t0, 0.09, 0.11);
  blip("triangle", 140, t0, 0.05, 0.05);
}

export const AudioSystem = {
  unlock() {
    ensure();
    if (musicEl && musicEl.paused) {
      const p = musicEl.play();
      if (p && p.catch) p.catch(() => {});
    }
  },

  getMusicVol() {
    return musicVol;
  },

  setMusicVol(v) {
    musicVol = Math.max(0, Math.min(1, v));
    try { localStorage.setItem(VOL_KEY, String(musicVol)); } catch (e) {}
    applyMusicVol();
  },

  getSfxVol() {
    return sfxVol;
  },

  setSfxVol(v) {
    sfxVol = Math.max(0, Math.min(1, v));
    try { localStorage.setItem(SFX_KEY, String(sfxVol)); } catch (e) {}
    applySfxVol();
  },

  mountDock() {
    readStoredVol();
    const slider = document.getElementById("vol-slider");
    const label = document.getElementById("vol-pct");
    if (!slider) return;
    slider.value = String(Math.round(musicVol * 100));
    if (label) label.textContent = slider.value + "%";
    applyMusicVol();
    applySfxVol();
    const sync = () => {
      this.unlock();
      this.setMusicVol(Number(slider.value) / 100);
      if (label) label.textContent = slider.value + "%";
    };
    slider.addEventListener("input", sync);
    slider.addEventListener("change", sync);
  },

  playMenu() {
    playTheme("menu");
  },

  playCourt(id) {
    const key = id === "rain" || id === "spring" || id === "winter" || id === "summer" ? id : "summer";
    playTheme(key);
  },

  stopMusic() {
    haltMusic();
  },

  hit(id) {
    if (!ensure()) return;
    if (id === "aqua") hitAqua(false);
    else if (id === "volt") hitVolt(false);
    else if (id === "terra") hitTerra(false);
    else hitIgnis(false);
  },

  smash(id) {
    if (!ensure()) return;
    if (id === "aqua") hitAqua(true);
    else if (id === "volt") hitVolt(true);
    else if (id === "terra") hitTerra(true);
    else hitIgnis(true);
  },

  jump(id) {
    if (!ensure()) return;
    if (id === "aqua") jumpAqua();
    else if (id === "volt") jumpVolt();
    else if (id === "terra") jumpTerra();
    else jumpIgnis();
  },

  score() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    blip("sine", 523, t0, 0.08, 0.06);
    blip("sine", 659, t0 + 0.09, 0.12, 0.07);
  },

  ui() {
    if (!ensure()) return;
    blip("sine", 880, ctx.currentTime, 0.04, 0.04);
  },

  error() {
    if (!ensure()) return;
    blip("sine", 160, ctx.currentTime, 0.09, 0.05);
  }
};
