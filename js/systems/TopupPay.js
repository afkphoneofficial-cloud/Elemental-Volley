import { AuthSystem } from "./AuthSystem.js";
import { SaveSystem } from "./SaveSystem.js";
import { t } from "../i18n/I18n.js";

let stripeLib = null;

async function loadStripeJs() {
  if (window.Stripe) return window.Stripe;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = resolve;
    s.onerror = () => reject(new Error("stripe_js"));
    document.head.appendChild(s);
  });
  return window.Stripe;
}

async function invoke(name, body) {
  const sb = await AuthSystem.db();
  if (!sb) throw new Error(t("topup.needLogin"));
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) throw new Error(error.message || t("topup.fail"));
  if (!data || data.ok === false) throw new Error((data && data.error) || t("topup.fail"));
  return data;
}

export const TopupPay = {
  async buyPack(packId) {
    const started = await invoke("create-topup", { packId });
    const StripeCtor = await loadStripeJs();
    const stripe = StripeCtor(started.publishableKey);
    const email = started.email || (AuthSystem.session() && AuthSystem.session().email) || "";
    const result = await stripe.confirmPromptPayPayment(started.clientSecret, {
      payment_method: {
        type: "promptpay",
        billing_details: { email }
      }
    });
    if (result.error) throw new Error(result.error.message);
    const intent = result.paymentIntent;
    if (!intent || intent.status !== "succeeded") throw new Error(t("topup.canceled"));
    await invoke("claim-topup", { orderId: started.orderId });
    if (AuthSystem.pullSave) await AuthSystem.pullSave();
    SaveSystem.recordTopup({
      kind: "pack",
      packId,
      powder: started.powder | 0,
      bonus: 0,
      thb: started.thb | 0
    });
    return started;
  }
};
