import { beforeAll, describe, expect, it, vi } from "vitest";

// La configuración se lee al importar los módulos: se fija antes.
await vi.hoisted(async () => {
  const { mkdtempSync } = await import("fs");
  const { tmpdir } = await import("os");
  const path = await import("path");
  process.env.LOCAL_DATA_DIR = mkdtempSync(path.join(tmpdir(), "regalumo-test-"));
  process.env.APP_SECRET = "test-secret";
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_unit_tests";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_test_secret";
  process.env.LIMIT_GLOBAL_FREE_GENERATIONS_DAY = "1000";
});

import Stripe from "stripe";
import { sign, verify } from "@/lib/security/tokens";
import { consume, LimitError } from "@/lib/security/ratelimit";
import { getStore } from "@/lib/store";
import { createProject, type Project } from "@/lib/projects";
import { fulfillOrder, checkOrderToken, orderToken, type Order } from "@/lib/payments/orders";
import { POST as webhook } from "@/app/api/webhooks/stripe/route";

async function pendingOrder(amountCents = 699): Promise<{ order: Order; project: Project }> {
  const { project } = await createProject("newspaper", { honoree: "Prueba" });
  const order: Order = {
    id: "ord_" + Math.random().toString(36).slice(2),
    sku: "newspaper",
    items: [{ product: "newspaper", projectId: project.id }],
    amountCents,
    listPriceCents: amountCents,
    currency: "eur",
    status: "pending",
    provider: "stripe",
    digitalConsentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await getStore().put("orders", order.id, order);
  return { order, project };
}

describe("tokens firmados", () => {
  it("verifica la firma, el propósito y la caducidad", () => {
    const t = sign({ o: "abc" }, "order");
    expect(verify<{ o: string }>(t, "order")?.o).toBe("abc");
    expect(verify(t, "admin")).toBeNull();
    expect(verify(t.slice(0, -2) + "xx", "order")).toBeNull();
    const forged = Buffer.from(JSON.stringify({ o: "otro" })).toString("base64url") + "." + t.split(".")[1];
    expect(verify(forged, "order")).toBeNull();
    expect(verify(sign({ exp: Date.now() - 1 }, "x"), "x")).toBeNull();
  });

  it("el enlace de un pedido no sirve para otro", () => {
    expect(checkOrderToken("a", orderToken("a"))).toBe(true);
    expect(checkOrderToken("b", orderToken("a"))).toBe(false);
  });
});

describe("límites anti-abuso", () => {
  it("bloquea al superar el límite por cliente y no afecta a otros", async () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "10.0.0.1" } });
    const other = new Request("http://x", { headers: { "x-forwarded-for": "10.0.0.2" } });
    for (let i = 0; i < 3; i++) await consume(req, "unit", 3);
    await expect(consume(req, "unit", 3)).rejects.toBeInstanceOf(LimitError);
    await expect(consume(other, "unit", 3)).resolves.toBeUndefined();
  });
});

describe("cumplimiento de pedidos", () => {
  it("es idempotente y desbloquea el proyecto", async () => {
    const { order, project } = await pendingOrder();
    const pay = { amountTotal: 699, currency: "eur", provider: "stripe" as const };
    const a = await fulfillOrder(order.id, pay);
    const b = await fulfillOrder(order.id, pay);
    expect(a.status).toBe("paid");
    expect(b.paidAt).toBe(a.paidAt);
    expect((await getStore().get<Project>("projects", project.id))?.status).toBe("paid");
  });

  it("rechaza un importe o una moneda que no coinciden", async () => {
    const { order, project } = await pendingOrder();
    await expect(fulfillOrder(order.id, { amountTotal: 1, currency: "eur", provider: "stripe" })).rejects.toThrow();
    expect((await getStore().get<Order>("orders", order.id))?.status).toBe("failed");
    expect((await getStore().get<Project>("projects", project.id))?.status).not.toBe("paid");
    const o2 = (await pendingOrder()).order;
    await expect(fulfillOrder(o2.id, { amountTotal: 699, currency: "usd", provider: "stripe" })).rejects.toThrow();
  });

  it("rechaza pagos en modo real sin autorización", async () => {
    const { order } = await pendingOrder();
    await expect(fulfillOrder(order.id, { amountTotal: 699, currency: "eur", livemode: true, provider: "stripe" })).rejects.toThrow(/autorización/);
  });
});

describe("webhook de Stripe", () => {
  const stripe = new Stripe("sk_test_dummy_for_unit_tests");
  let order: Order;
  let project: Project;
  beforeAll(async () => ({ order, project } = await pendingOrder()));

  const event = (o: Order, extra: Partial<Stripe.Checkout.Session> = {}) =>
    JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      livemode: false,
      data: { object: { id: "cs_test", object: "checkout.session", metadata: { orderId: o.id }, payment_status: "paid", amount_total: o.amountCents, currency: "eur", customer_details: { email: "a@example.com" }, payment_intent: "pi_test", ...extra } },
    });

  const call = (payload: string, signature: string) =>
    webhook(new Request("http://x/api/webhooks/stripe", { method: "POST", body: payload, headers: { "stripe-signature": signature } }));

  it("rechaza firmas no válidas sin tocar el pedido", async () => {
    const payload = event(order);
    const bad = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_otro" });
    expect((await call(payload, bad)).status).toBe(400);
    expect((await call(payload, "")).status).toBe(400);
    expect((await getStore().get<Order>("orders", order.id))?.status).toBe("pending");
  });

  it("marca el pedido como pagado con una firma válida", async () => {
    const payload = event(order);
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_unit_test_secret" });
    expect((await call(payload, sig)).status).toBe(200);
    expect((await getStore().get<Order>("orders", order.id))?.status).toBe("paid");
    expect((await getStore().get<Project>("projects", project.id))?.status).toBe("paid");
    // Reenvío del mismo evento: sigue siendo 200 y no cambia nada.
    expect((await call(payload, sig)).status).toBe(200);
  });

  it("devuelve 500 (para que Stripe reintente) si el importe no cuadra", async () => {
    const { order: o } = await pendingOrder();
    const payload = event(o, { amount_total: 5 });
    const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_unit_test_secret" });
    expect((await call(payload, sig)).status).toBe(500);
    expect((await getStore().get<Order>("orders", o.id))?.status).toBe("failed");
  });
});
