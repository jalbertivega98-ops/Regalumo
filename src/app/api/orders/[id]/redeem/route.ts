import { handle, json } from "@/lib/http";
import { checkOrderToken, redeemPack, type Order } from "@/lib/payments/orders";
import { getStore } from "@/lib/store";
import { HttpError, loadOwned, tokenFrom } from "@/lib/projects";

type Ctx = { params: Promise<{ id: string }> };

/** Usa un hueco del pack de 3 productos para desbloquear un proyecto. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!checkOrderToken(id, body.k)) throw new HttpError(403, "Enlace no válido");
  const order = await getStore().get<Order>("orders", id);
  if (!order) throw new HttpError(404, "Pedido no encontrado");
  const project = await loadOwned(String(body.projectId || ""), tokenFrom(req));
  await redeemPack(order, project);
  return json({ ok: true });
});
