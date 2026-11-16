import { handle, json } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { getStore } from "@/lib/store";
import { HttpError } from "@/lib/projects";

export const PATCH = handle(async (req: Request) => {
  await requireAdmin();
  const b = await req.json().catch(() => ({}));
  const r = await getStore().get<Record<string, unknown>>("requests", String(b.id || ""));
  if (!r) throw new HttpError(404, "Solicitud no encontrada");
  await getStore().put("requests", String(r.id), { ...r, status: b.status === "resuelta" ? "resuelta" : "pendiente" });
  return json({ ok: true });
});
