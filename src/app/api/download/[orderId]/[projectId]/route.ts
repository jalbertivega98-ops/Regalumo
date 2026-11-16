import { handle } from "@/lib/http";
import { checkOrderToken, downloadExpired, type Order } from "@/lib/payments/orders";
import { getStore } from "@/lib/store";
import { HttpError, type Project } from "@/lib/projects";
import { finalFile } from "@/lib/products/generators";

type Ctx = { params: Promise<{ orderId: string; projectId: string }> };

export const maxDuration = 120;

/** Descarga protegida: solo con enlace firmado, pedido pagado (confirmado por webhook) y dentro del plazo. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { orderId, projectId } = await params;
  if (!checkOrderToken(orderId, new URL(req.url).searchParams.get("k") || "")) throw new HttpError(403, "Enlace no válido");
  const order = await getStore().get<Order>("orders", orderId);
  if (!order || order.status !== "paid") throw new HttpError(402, "El pago de este pedido no está confirmado.");
  if (downloadExpired(order)) throw new HttpError(410, "El enlace de descarga ha caducado. Escríbenos y te ayudamos.");
  if (!order.items.some((i) => i.projectId === projectId)) throw new HttpError(404, "Archivo no encontrado");
  const project = await getStore().get<Project>("projects", projectId);
  if (!project || project.status !== "paid") throw new HttpError(404, "Archivo no encontrado");
  const { data, filename } = await finalFile(project);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
});
