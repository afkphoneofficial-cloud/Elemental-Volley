export const TICKET_CATS = [
  { id: "account", th: "บัญชี / ล็อกอิน", en: "Account / login" },
  { id: "pay", th: "การชำระเงิน / ผง", en: "Payment / powder" },
  { id: "play", th: "แมตช์ / บั๊กตอนเล่น", en: "Match / play bug" },
  { id: "item", th: "ของหาย / เซฟ", en: "Missing item / save" },
  { id: "report", th: "รายงานผู้เล่น", en: "Report a player" },
  { id: "other", th: "อื่น ๆ", en: "Other" }
];

export const TICKET_MAX_SHOTS = 3;
export const TICKET_MAX_BYTES = 5 * 1024 * 1024;

export function ticketCatLabel(id, lang) {
  const row = TICKET_CATS.find((c) => c.id === id);
  if (!row) return id || "";
  return lang === "en" ? row.en : row.th;
}
