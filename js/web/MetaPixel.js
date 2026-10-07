const KEY_REG = "ev-px-reg";
const KEY_MATCH = "ev-px-match";

function storeGet(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}

function storeSet(key, val) {
  try { window.localStorage.setItem(key, val); } catch (e) {}
}

function track(event, params) {
  try {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", event, params || {});
  } catch (e) {}
}

export const MetaPixel = {
  register() {
    if (storeGet(KEY_REG)) return;
    storeSet(KEY_REG, "1");
    track("CompleteRegistration", { content_name: "gmail", status: true });
  },

  firstMatch(mode) {
    if (storeGet(KEY_MATCH)) return;
    storeSet(KEY_MATCH, "1");
    track("StartTrial", {
      content_name: String(mode || "match"),
      value: 0,
      currency: "THB"
    });
  }
};
