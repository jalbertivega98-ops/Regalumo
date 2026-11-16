import { handle, json } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { getStore } from "@/lib/store";
import { normalizeCode, type Promo } from "@/lib/settings";
import { HttpError } from "@/lib/projects";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const b = await req.json().catch(() => ({}));
  const code = normalizeCode(String(b.code || ""));
  const percentOff = Math.round(Number(b.percentOff));
  if (!code || !(percentOff >= 1 && percentOff <= 90)) throw new HttpError(400, "Código y descuento (1-90 %) obligatorios");
  const existing = await getStore().get<Promo>("promos", code);
  const promo: Promo = {
    code,
    percentOff,
    active: b.active !== false,
    maxUses: Number(b.maxUses) > 0 ? Math.round(Number(b.maxUses)) : undefined,
    expiresAt: b.expiresAt ? new Date(b.expiresAt).toISOString() : undefined,
    uses: existing?.uses ?? 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await getStore().put("promos", code, promo);
  return json({ promo });
});
