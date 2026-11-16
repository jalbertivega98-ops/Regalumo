import { config } from "@/lib/config";
import { handle, json } from "@/lib/http";
import { checkOrderToken, fulfillOrder, type Order } from "@/lib/payments/orders";
import { getStore } from "@/lib/store";
import { HttpError } from "@/lib/projects";

/** Pago SIMULADO para desarrollo y pruebas automáticas. Desactivado siempre en producción. */
export const POST = handle(async (req: Request) => {
  if (!config.mockPayments) throw new HttpError(404, "No disponible");
  const body = await req.json().catch(() => ({}));
  if (!checkOrderToken(body.orderId, body.k)) throw new HttpError(403, "Sin acceso");
  const order = await getStore().get<Order>("orders", body.orderId);
  if (!order || order.provider !== "mock") throw new HttpError(404, "Pedido no encontrado");
  await fulfillOrder(order.id, { amountTotal: order.amountCents, currency: "eur", email: order.email || "prueba@example.com", provider: "mock" });
  return json({ ok: true });
});
