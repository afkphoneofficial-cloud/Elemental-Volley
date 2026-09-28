import { EN_BOUND, EN_FRAG, TH_FRAG } from "../data/chatBan.js";

const LEET = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g",
  "@": "a", "$": "s", "!": "i", "+": "t", "*": "",
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i"
};

function fold(raw) {
  let s = String(raw || "").normalize("NFKC").toLowerCase();
  s = s.replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "");
  s = s.replace(/[áàâäãåā]/g, "a").replace(/[éèêëē]/g, "e").replace(/[íìîïī]/g, "i");
  s = s.replace(/[óòôöõō]/g, "o").replace(/[úùûüū]/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n");
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    out += LEET[ch] != null ? LEET[ch] : ch;
  }
  out = out.replace(/([a-z])[\s._\-*/\\|,:;~^]+(?=[a-z])/g, "$1");
  out = out.replace(/([\u0e00-\u0e7f])[\s._\-*/\\|,:;~^]+(?=[\u0e00-\u0e7f])/g, "$1");
  out = out.replace(/(.)\1{2,}/g, "$1$1");
  return out;
}

function hasBound(hay, word) {
  return new RegExp("(^|[^a-z])" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)").test(hay);
}

export const ChatFilter = {
  fold,

  inspect(raw) {
    const text = String(raw || "");
    const folded = fold(text);
    const hits = [];
    EN_FRAG.forEach((w) => {
      if (w && folded.includes(w)) hits.push(w);
    });
    EN_BOUND.forEach((w) => {
      if (w && hasBound(folded, w)) hits.push(w);
    });
    TH_FRAG.forEach((w) => {
      if (w && folded.includes(fold(w))) hits.push(w);
    });
    return { folded, hits };
  },

  clean(raw) {
    const text = String(raw || "").replace(/\s+/g, " ").trim();
    if (!text) return { ok: false, reason: "empty", body: "" };
    if (text.length > 180) return { ok: false, reason: "len", body: "" };
    const { hits } = this.inspect(text);
    if (hits.length) return { ok: false, reason: "blocked", body: "", hits };
    return { ok: true, body: text };
  }
};
