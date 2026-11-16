import { handle, json } from "@/lib/http";
import { loadOwned, saveProject, tokenFrom } from "@/lib/projects";
import { getStore } from "@/lib/store";
import { clean } from "@/lib/security/text";
import { track } from "@/lib/analytics";

type Ctx = { params: Promise<{ id: string }> };

/** Valoración del resultado antes de comprar (1-5) con comentario opcional. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const p = await loadOwned((await params).id, tokenFrom(req));
  const body = await req.json().catch(() => ({}));
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 0)));
  p.rating = rating;
  await saveProject(p);
  await getStore().put("feedback", p.id, { projectId: p.id, product: p.product, rating, comment: clean(body.comment, 500), at: new Date().toISOString() });
  await track("rating", { product: `${p.product}-${rating}` });
  return json({ ok: true });
});
