import { handle, json } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { getStore } from "@/lib/store";

/**
 * Pone a cero las estadísticas (visitas, origen, embudo, pruebas). No toca pedidos, ventas,
 * proyectos ni los límites de uso: las ventas del panel salen de los pedidos.
 */
export const DELETE = handle(async () => {
  await requireAdmin();
  await getStore().delCounters("stat:");
  return json({ ok: true });
});
