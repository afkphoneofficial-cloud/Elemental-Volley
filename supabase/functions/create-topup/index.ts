import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

const TOPUP_PACKS: Record<string, { thb: number; powder: number }> = {
  p29: { thb: 29, powder: 60 },
  p59: { thb: 59, powder: 130 },
  p149: { thb: 149, powder: 350 },
  p299: { thb: 299, powder: 750 },
  p499: { thb: 499, powder: 1350 },
  p999: { thb: 999, powder: 3000 },
  pass: { thb: 59, powder: 0 }
};

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return json({ ok: false, error: "auth" }, 401, cors);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const pk = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || "";
    if (!stripeKey) return json({ ok: false, error: "stripe_key" }, 500, cors);

    const userSb = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userErr } = await userSb.auth.getUser();
    if (userErr || !userData.user) return json({ ok: false, error: "auth" }, 401, cors);
    const user = userData.user;
    const body = await req.json().catch(() => ({}));
    const packId = String(body.packId || "");
    const pack = TOPUP_PACKS[packId];
    if (!pack) return json({ ok: false, error: "pack" }, 400, cors);

    const admin = createClient(supabaseUrl, service);
    const { data: order, error: insErr } = await admin.from("purchases").insert({
      user_id: user.id,
      sku: packId,
      amount_cents: pack.thb * 100,
      currency: "THB",
      provider: "stripe",
      status: "pending",
      powder: pack.powder
    }).select("id").single();
    if (insErr || !order) return json({ ok: false, error: "order" }, 500, cors);

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia", httpClient: Stripe.createFetchHttpClient() });
    const intent = await stripe.paymentIntents.create({
      amount: pack.thb * 100,
      currency: "thb",
      payment_method_types: ["promptpay"],
      metadata: { order_id: order.id, user_id: user.id, pack_id: packId }
    });
    await admin.from("purchases").update({ stripe_pi: intent.id }).eq("id", order.id);

    return json({
      ok: true,
      orderId: order.id,
      clientSecret: intent.client_secret,
      publishableKey: pk,
      email: user.email || "",
      thb: pack.thb,
      powder: pack.powder
    }, 200, cors);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message ? e.message : e) }, 500, cors);
  }
});

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" }
  });
}
