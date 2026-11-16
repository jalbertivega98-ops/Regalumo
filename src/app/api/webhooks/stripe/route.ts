import type Stripe from "stripe";
import { config } from "@/lib/config";
import { fulfillOrder, stripe, type Order } from "@/lib/payments/orders";
import { getStore } from "@/lib/store";
import { logError } from "@/lib/errors";

/**
 * Webhook de Stripe: ÚNICA fuente de verdad para marcar un pedido como pagado.
 * Se verifica la firma con STRIPE_WEBHOOK_SECRET sobre el cuerpo sin procesar.
 */
export async function POST(req: Request) {
  if (!config.stripe.webhookSecret) return new Response("Webhook no configurado", { status: 503 });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, config.stripe.webhookSecret);
  } catch {
    return new Response("Firma no válida", { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = s.metadata?.orderId;
      if (orderId && s.payment_status === "paid") {
        await fulfillOrder(orderId, {
          amountTotal: s.amount_total ?? -1,
          currency: s.currency ?? "",
          email: s.customer_details?.email ?? undefined,
          paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id,
          livemode: event.livemode,
          provider: "stripe",
        });
      }
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = s.metadata?.orderId;
      const order = orderId ? await getStore().get<Order>("orders", orderId) : null;
      if (order && order.status === "pending") await getStore().put("orders", order.id, { ...order, status: "failed" });
    } else if (event.type === "charge.refunded") {
      const ch = event.data.object as Stripe.Charge;
      const orderId = ch.metadata?.orderId;
      const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
      const orders = orderId ? [await getStore().get<Order>("orders", orderId)] : (await getStore().list<Order>("orders")).filter((o) => o.paymentIntent === pi);
      for (const o of orders) if (o) await getStore().put("orders", o.id, { ...o, status: "refunded" });
    }
  } catch (e) {
    await logError(e, "webhook:" + event.type);
    // 500 para que Stripe reintente.
    return new Response("Error procesando el evento", { status: 500 });
  }
  return new Response("ok");
}
