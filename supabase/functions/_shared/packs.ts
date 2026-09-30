export const CARD_MIN_THB = 299;

export const TOPUP_PACKS: Record<string, { thb: number; powder: number; bonus: number }> = {
  p29: { thb: 29, powder: 60, bonus: 0 },
  p59: { thb: 59, powder: 130, bonus: 12 },
  p149: { thb: 149, powder: 350, bonus: 52 },
  p299: { thb: 299, powder: 750, bonus: 152 },
  p499: { thb: 499, powder: 1350, bonus: 352 },
  p999: { thb: 999, powder: 3000, bonus: 1002 }
};

export function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}
