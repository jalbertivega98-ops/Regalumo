import { config } from "./config";
import { getStore } from "./store";
import { sha256, sign, verify } from "./security/tokens";
import { PACK, PRODUCTS, formatEur } from "./products/catalog";
import { DOWNLOAD_DAYS, downloadExpired, orderToken, type Order } from "./payments/orders";

/**
 * "Mis pedidos" sin cuentas ni contraseñas: el cliente pide un enlace mágico con
 * su correo y ve todos sus pedidos pagados. Solo se guarda un índice por hash del correo.
 */
export const MAGIC_LINK_HOURS = 24;
/** Pedidos que se revisan además del índice (pedidos anteriores a esta función). */
const SCAN_LIMIT = 1000;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isEmail = (email: string) => email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const customerKey = (email: string) => sha256("customer:" + normalizeEmail(email)).slice(0, 40);

interface CustomerIndex {
  key: string;
  orderIds: string[];
  updatedAt: string;
}

/** Apunta un pedido pagado en el índice del cliente. Idempotente. */
export async function linkOrderToCustomer(order: Pick<Order, "id" | "email">) {
  if (!order.email || !isEmail(normalizeEmail(order.email))) return;
  const store = getStore();
  const key = customerKey(order.email);
  const idx = (await store.get<CustomerIndex>("customers", key)) ?? { key, orderIds: [], updatedAt: "" };
  if (idx.orderIds.includes(order.id)) return;
  idx.orderIds.push(order.id);
  idx.updatedAt = new Date().toISOString();
  await store.put("customers", key, idx);
}

const visible = (o: Order | null): o is Order => !!o && (o.status === "paid" || o.status === "refunded");

/** Pedidos pagados (o reembolsados) de un cliente, del más reciente al más antiguo. */
export async function ordersForCustomer(key: string): Promise<Order[]> {
  const store = getStore();
  const idx = await store.get<CustomerIndex>("customers", key);
  const byId = new Map<string, Order>();
  for (const id of idx?.orderIds ?? []) {
    const o = await store.get<Order>("orders", id);
    if (visible(o) && o.email && customerKey(o.email) === key) byId.set(o.id, o);
  }
  for (const o of await store.list<Order>("orders", SCAN_LIMIT)) {
    if (visible(o) && o.email && customerKey(o.email) === key) byId.set(o.id, o);
  }
  return [...byId.values()].sort((a, b) => (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt));
}

/** El token lleva solo el hash del correo, nunca el correo en claro. */
export const accessToken = (email: string, now = Date.now()) =>
  sign({ c: customerKey(email), exp: now + MAGIC_LINK_HOURS * 3600000 }, "my-orders");
export const readAccessToken = (token: string | null | undefined) => verify<{ c: string }>(token, "my-orders")?.c ?? null;
export const myOrdersUrl = (email: string) => `${config.siteUrl}/mis-pedidos?t=${encodeURIComponent(accessToken(email))}`;

export function orderSummary(o: Order) {
  return {
    id: o.id,
    name: o.sku === "pack" ? PACK.name : PRODUCTS[o.sku].name,
    total: formatEur(o.amountCents),
    date: o.paidAt || o.createdAt,
    status: o.status,
    expired: downloadExpired(o),
    path: `/pedido/${o.id}?k=${encodeURIComponent(orderToken(o.id))}`,
  };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function magicLinkEmail(url: string) {
  return `<!doctype html><html><body style="margin:0;background:#FFF8EF;font-family:Arial,sans-serif;color:#1E1633">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="font-size:22px;font-weight:800;margin:0 0 24px">REGALUMO</p>
    <h1 style="font-size:24px;margin:0 0 12px">Tus pedidos de REGALUMO</h1>
    <p>Pulsa el botón para ver todos tus pedidos y descargar tus regalos. No necesitas contraseña.</p>
    <p style="margin:24px 0"><a href="${esc(url)}" style="background:#FF6B4A;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">Ver mis pedidos</a></p>
    <p style="font-size:13px;color:#5E5873">El botón funciona durante ${MAGIC_LINK_HOURS} horas. Cada descarga está disponible ${DOWNLOAD_DAYS} días desde la compra. Si no has pedido este correo, puedes ignorarlo: nadie más puede entrar sin él.</p>
  </div></body></html>`;
}
