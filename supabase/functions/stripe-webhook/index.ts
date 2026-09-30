import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const whsec = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!stripeKey || !whsec) return new Response("no stripe webhook secret", { status: 500 });
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia", httpClient: Stripe.createFetchHttpClient() });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    const sig = req.headers.get("stripe-signature") || "";
    event = await stripe.webhooks.constructEventAsync(raw, sig, whsec);
  } catch {
    return new Response("bad sig", { status: 400 });
  }
  if (event.type !== "payment_intent.succeeded") {
    return new Response(JSON.stringify({ ok: true, skip: true }), { headers: { "Content-Type": "application/json" } });
  }
  const pi = event.data.object as Stripe.PaymentIntent;
  const orderId = pi.metadata && pi.metadata.order_id;
  if (!orderId) return new Response(JSON.stringify({ ok: true, skip: true }), { headers: { "Content-Type": "application/json" } });
  const admin = createClient(supabaseUrl, service);
  await admin.rpc("fulfill_purchase", { p_id: orderId });
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
