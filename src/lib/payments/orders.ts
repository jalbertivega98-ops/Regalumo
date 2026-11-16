import Stripe from "stripe";
import { config } from "../config";
import { getStore } from "../store";
import { HttpError, saveProject, type Project } from "../projects";
import { PACK, PRODUCTS, PRODUCT_IDS, formatEur, type ProductId, type SkuId } from "../products/catalog";
import { getPrices, findPromo, type Promo } from "../settings";
import { randomId, sign, verify } from "../security/tokens";
import { track } from "../analytics";
import { purchaseEmail, sendEmail } from "../email/send";

export interface OrderItem {
  product: ProductId;
  projectId: string | null;
}

export interface Order {
  id: string;
  sku: SkuId;
  items: OrderItem[];
  amountCents: number;
  listPriceCents: number;
  currency: "eur";
  promoCode?: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: "stripe" | "mock";
  stripeSessionId?: string;
  paymentIntent?: string;
  email?: string;
  /** Consentimiento expreso para el suministro inmediato de contenido digital (art. 103.m TRLGDCU). */
  digitalConsentAt: string;
  createdAt: string;
  paidAt?: string;
  livemode?: boolean;
}

export const DOWNLOAD_DAYS = 30;

/** Token de acceso al pedido (firmado, no se guarda en la base de datos). */
export const orderToken = (orderId: string) => sign({ o: orderId }, "order");
export const checkOrderToken = (orderId: string, token: string) => verify<{ o: string }>(token, "order")?.o === orderId;

export function orderUrl(orderId: string) {
  return `${config.siteUrl}/pedido/${orderId}?k=${encodeURIComponent(orderToken(orderId))}`;
}

let stripeClient: Stripe | null = null;
export function stripe() {
  if (!config.stripe.secretKey) throw new HttpError(503, "Los pagos todavía no están configurados.");
  if (config.stripe.secretKey.startsWith("sk_live_") && !config.stripe.allowLive) {
    // Salvaguarda: nunca cobrar de verdad sin autorización explícita del propietario.
    throw new HttpError(503, "Los cobros reales están desactivados. Usa una clave de prueba (sk_test_).");
  }
  stripeClient ??= new Stripe(config.stripe.secretKey);
  return stripeClient;
}

export function paymentsMode(): "stripe-test" | "stripe-live" | "mock" | "off" {
  const k = config.stripe.secretKey;
  if (k.startsWith("sk_test_")) return "stripe-test";
  if (k.startsWith("sk_live_")) return config.stripe.allowLive ? "stripe-live" : "off";
  return config.mockPayments ? "mock" : "off";
}

export async function quote(sku: SkuId, promoCode?: string) {
  const prices = await getPrices();
  const list = prices[sku];
  let promo: Promo | null = null;
  if (promoCode) {
    promo = await findPromo(promoCode);
    if (!promo) throw new HttpError(400, "El código promocional no es válido o ha caducado.");
  }
  const amount = promo ? Math.max(50, Math.round((list * (100 - promo.percentOff)) / 100)) : list;
  return { list, amount, promo };
}

/** Crea el pedido y la sesión de pago. Devuelve la URL a la que redirigir. */
export async function startCheckout(opts: { project: Project; sku: SkuId; promoCode?: string; email?: string; consent: boolean }) {
  const { project, sku } = opts;
  if (!opts.consent) throw new HttpError(400, "Debes aceptar el suministro inmediato del contenido digital para continuar.");
  if (project.status === "paid") throw new HttpError(409, "Este proyecto ya está pagado.");
  if (sku !== "pack" && sku !== project.product) throw new HttpError(400, "Producto no válido para este proyecto.");
  const mode = paymentsMode();
  if (mode === "off") throw new HttpError(503, "Los pagos todavía no están configurados. Vuelve pronto.");

  const { list, amount, promo } = await quote(sku, opts.promoCode);
  const items: OrderItem[] =
    sku === "pack" ? PRODUCT_IDS.map((p) => ({ product: p, projectId: p === project.product ? project.id : null })) : [{ product: sku, projectId: project.id }];
  const id = "ord_" + randomId(10);
  const order: Order = {
    id,
    sku,
    items,
    amountCents: amount,
    listPriceCents: list,
    currency: "eur",
    promoCode: promo?.code,
    status: "pending",
    provider: mode === "mock" ? "mock" : "stripe",
    email: opts.email,
    digitalConsentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const successUrl = orderUrl(id);
  const name = sku === "pack" ? PACK.name : PRODUCTS[sku].name;

  if (mode === "mock") {
    await getStore().put("orders", id, order);
    await track("checkout_start", { product: sku });
    return { url: `${config.siteUrl}/pedido/${id}/simular?k=${encodeURIComponent(orderToken(id))}`, orderId: id };
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    locale: "es",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: { name: `REGALUMO · ${name}`, description: "Producto digital personalizado (PDF descargable)" },
        },
      },
    ],
    customer_email: opts.email || undefined,
    customer_creation: "if_required",
    success_url: successUrl,
    cancel_url: `${config.siteUrl}${PRODUCTS[project.product].editorPath}?p=${project.id}&cancelado=1`,
    metadata: { orderId: id, projectId: project.id, sku },
    payment_intent_data: { metadata: { orderId: id } },
  });
  order.stripeSessionId = session.id;
  await getStore().put("orders", id, order);
  await track("checkout_start", { product: sku });
  if (!session.url) throw new Error("Stripe no devolvió URL de pago");
  return { url: session.url, orderId: id };
}

/**
 * Marca el pedido como pagado y desbloquea los proyectos. Idempotente:
 * Stripe puede reenviar el mismo webhook varias veces.
 */
export async function fulfillOrder(orderId: string, payment: { amountTotal: number; currency: string; email?: string; paymentIntent?: string; livemode?: boolean; provider: "stripe" | "mock" }) {
  const store = getStore();
  const order = await store.get<Order>("orders", orderId);
  if (!order) throw new Error(`Pedido ${orderId} no encontrado`);
  if (order.status === "paid") return order;
  if (payment.amountTotal !== order.amountCents || payment.currency.toLowerCase() !== "eur") {
    order.status = "failed";
    await store.put("orders", order.id, order);
    throw new Error(`Importe inesperado en ${orderId}: ${payment.amountTotal} ${payment.currency}`);
  }
  if (payment.livemode && !config.stripe.allowLive) throw new Error("Pago en modo real recibido sin autorización");
  order.status = "paid";
  order.paidAt = new Date().toISOString();
  order.email = payment.email || order.email;
  order.paymentIntent = payment.paymentIntent;
  order.livemode = !!payment.livemode;
  await store.put("orders", order.id, order);

  for (const it of order.items) {
    if (!it.projectId) continue;
    const p = await store.get<Project>("projects", it.projectId);
    if (p) {
      p.status = "paid";
      p.orderId = order.id;
      await saveProject(p);
    }
  }
  if (order.promoCode) {
    const promo = await store.get<Promo>("promos", order.promoCode);
    if (promo) await store.put("promos", promo.code, { ...promo, uses: promo.uses + 1 });
  }
  await track("purchase", { product: order.sku });
  await track("revenue_cents", { product: order.sku, by: order.amountCents });

  if (order.email) {
    const items = order.sku === "pack" ? [PACK.name] : [PRODUCTS[order.sku].name];
    await sendEmail(order.email, "Tu regalo de REGALUMO está listo", purchaseEmail({ orderUrl: orderUrl(order.id), items, total: formatEur(order.amountCents) }));
  }
  return order;
}

/** Asigna un proyecto a un hueco libre de un pack pagado. */
export async function redeemPack(order: Order, project: Project) {
  if (order.status !== "paid" || order.sku !== "pack") throw new HttpError(400, "Este pedido no es un pack pagado.");
  if (project.status === "paid") throw new HttpError(409, "Este proyecto ya está desbloqueado.");
  const slot = order.items.find((i) => i.product === project.product && !i.projectId);
  if (!slot) throw new HttpError(409, "Ya has usado el hueco de este producto en tu pack.");
  slot.projectId = project.id;
  await getStore().put("orders", order.id, order);
  project.status = "paid";
  project.orderId = order.id;
  await saveProject(project);
  return order;
}

export function downloadExpired(order: Order) {
  return !order.paidAt || Date.now() - Date.parse(order.paidAt) > DOWNLOAD_DAYS * 86400000;
}
