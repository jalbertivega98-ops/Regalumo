import { handle, json } from "@/lib/http";
import { checkOrderToken, downloadExpired, orderToken, paymentsMode, type Order } from "@/lib/payments/orders";
import { getStore } from "@/lib/store";
import { HttpError, type Project } from "@/lib/projects";
import { PRODUCTS } from "@/lib/products/catalog";
import { playUrl } from "@/lib/escape/play";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const k = new URL(req.url).searchParams.get("k") || "";
  if (!checkOrderToken(id, k)) throw new HttpError(403, "Enlace no válido");
  const order = await getStore().get<Order>("orders", id);
  if (!order) throw new HttpError(404, "Pedido no encontrado");
  const expired = downloadExpired(order);
  const items = await Promise.all(
    order.items.map(async (it) => {
      const p = it.projectId ? await getStore().get<Project>("projects", it.projectId) : null;
      return {
        product: it.product,
        name: PRODUCTS[it.product].name,
        editorPath: PRODUCTS[it.product].editorPath,
        projectId: it.projectId,
        ready: order.status === "paid" && !!p && p.status === "paid",
        downloadUrl: order.status === "paid" && p && !expired ? `/api/download/${order.id}/${p.id}?k=${encodeURIComponent(orderToken(order.id))}` : null,
        // El panel de juego no caduca con la descarga: el juego puede jugarse más adelante.
        playUrl: order.status === "paid" && p && p.status === "paid" && it.product === "escape" ? playUrl(p.id).replace(/^https?:\/\/[^/]+/, "") : null,
      };
    }),
  );
  return json({
    id: order.id,
    sku: order.sku,
    status: order.status,
    amountCents: order.amountCents,
    paidAt: order.paidAt,
    expired,
    provider: order.provider,
    mode: paymentsMode(),
    items,
  });
});
