import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

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
    if (!auth.startsWith("Bearer ")) return json({ ok: false, error: "auth" }, 401, cors);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const userSb = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userErr } = await userSb.auth.getUser();
    if (userErr || !userData.user) return json({ ok: false, error: "auth" }, 401, cors);
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || "");
    if (!orderId) return json({ ok: false, error: "order" }, 400, cors);

    const admin = createClient(supabaseUrl, service);
    const { data: row, error } = await admin.from("purchases").select("*").eq("id", orderId).maybeSingle();
    if (error || !row || row.user_id !== userData.user.id) return json({ ok: false, error: "order" }, 404, cors);
    if (row.status === "paid") return json({ ok: true, already: true, powder: row.powder }, 200, cors);
    if (!row.stripe_pi) return json({ ok: false, error: "pi" }, 400, cors);

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia", httpClient: Stripe.createFetchHttpClient() });
    const intent = await stripe.paymentIntents.retrieve(row.stripe_pi);
    if (intent.status !== "succeeded") {
      return json({ ok: false, error: "unpaid", status: intent.status }, 409, cors);
    }
    const { data: fulfilled, error: fErr } = await admin.rpc("fulfill_purchase", { p_id: orderId });
    if (fErr) return json({ ok: false, error: fErr.message }, 500, cors);
    return json({ ok: true, ...fulfilled }, 200, cors);
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
