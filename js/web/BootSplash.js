const LINES = {
  th: [
    "กำลังอุ่นตาข่าย…",
    "กรรมการกำลังจัดเสาเน็ต…",
    "ธาตุทั้งสี่กำลังรวมตัว…",
    "กำลังเติมเอเธอร์ลงสนาม…",
    "รอลูกแกนฤดูกาลเด้งมา…"
  ],
  en: [
    "Warming the net…",
    "The refs are setting the posts…",
    "The four elements are gathering…",
    "Filling the court with Ether…",
    "Waiting for the Season Core to bounce…"
  ]
};

function lang() {
  try {
    if (window.I18n && window.I18n.lang) return window.I18n.lang === "en" ? "en" : "th";
  } catch (e) {}
  const dock = document.querySelector("#lang-dock [data-lang].on");
  if (dock && dock.getAttribute("data-lang") === "en") return "en";
  return document.documentElement.lang === "en" ? "en" : "th";
}

export const BootSplash = {
  n: 0.04,
  locked: false,
  lineI: 0,
  hideTimer: 0,

  els() {
    return {
      root: document.getElementById("boot-splash"),
      fill: document.getElementById("boot-fill"),
      pct: document.getElementById("boot-pct"),
      line: document.getElementById("boot-line")
    };
  },

  bind() {
    this.paint();
    if (this._bound) return;
    this._bound = true;
    window.setInterval(() => {
      if (this.locked) return;
      if (this.n < 0.16) this.setProgress(this.n + 0.008);
    }, 200);
    window.setInterval(() => this.cycleLine(), 1700);
  },

  cycleLine() {
    if (this.locked) return;
    const pack = LINES[lang()] || LINES.th;
    this.lineI = (this.lineI + 1) % pack.length;
    const ui = this.els();
    if (ui.line) ui.line.textContent = pack[this.lineI];
  },

  setProgress(v) {
    this.n = Math.max(this.n, Math.min(1, v));
    if (typeof window.__evBootSet === "function") window.__evBootSet(this.n);
    this.paint();
  },

  paint() {
    const ui = this.els();
    const pct = Math.round(this.n * 100);
    if (ui.fill) ui.fill.style.width = pct + "%";
    if (ui.pct) ui.pct.textContent = pct + "%";
  },

  ready() {
    this.locked = true;
    window.__evBootLock = true;
    this.n = 1;
    this.paint();
    const ui = this.els();
    if (ui.line) ui.line.textContent = lang() === "en" ? "The court is ready." : "สนามพร้อมแล้ว";
    if (this.hideTimer) return;
    this.hideTimer = window.setTimeout(() => this.hide(), 280);
  },

  hide() {
    const ui = this.els();
    if (!ui.root || ui.root.classList.contains("out")) return;
    ui.root.classList.add("out");
    window.setTimeout(() => {
      if (ui.root) ui.root.hidden = true;
    }, 520);
  }
};
