import { handle, json } from "@/lib/http";
import { deleteProject, HttpError, loadOwned, publicProject, saveProject, tokenFrom } from "@/lib/projects";
import { parseData } from "@/lib/products/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: Request, { params }: Ctx) => {
  const p = await loadOwned((await params).id, tokenFrom(req));
  return json({ project: publicProject(p) });
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const p = await loadOwned((await params).id, tokenFrom(req));
  if (p.status === "paid") throw new HttpError(409, "Este proyecto ya está pagado y no se puede modificar. Puedes duplicarlo para crear otro.");
  const body = await req.json().catch(() => ({}));
  const data = parseData(p.product, body.data) as Record<string, unknown>;
  // Solo se admiten fotos que pertenezcan al proyecto.
  const own = new Set(p.photos);
  if (Array.isArray(data.photos)) data.photos = (data.photos as { id: string }[]).filter((x) => own.has(x.id));
  if (Array.isArray(data.pages)) data.pages = (data.pages as { photoId: string }[]).filter((x) => own.has(x.photoId));
  p.data = data;
  await saveProject(p);
  return json({ project: publicProject(p) });
});

/** Derecho de supresión: borra el proyecto y todas sus fotos al instante. */
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const p = await loadOwned((await params).id, tokenFrom(req));
  await deleteProject(p.id);
  return json({ ok: true });
});
