import { handle, json } from "@/lib/http";
import { HttpError, loadOwned, publicProject, saveProject, tokenFrom } from "@/lib/projects";
import { loadPhoto, photoKey, thumbnail } from "@/lib/photos";
import { getFiles } from "@/lib/store";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

/** Sirve una foto privada al propietario del proyecto (nunca se indexa ni se cachea en público). */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id, photoId } = await params;
  const p = await loadOwned(id, tokenFrom(req));
  if (!p.photos.includes(photoId)) throw new HttpError(404, "Foto no encontrada");
  const buf = await loadPhoto(p.id, photoId);
  if (!buf) throw new HttpError(404, "Foto no encontrada");
  const side = Math.min(1600, Math.max(200, Number(new URL(req.url).searchParams.get("w")) || 1200));
  return new Response(new Uint8Array(await thumbnail(buf, side)), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600", "X-Robots-Tag": "noindex" },
  });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { id, photoId } = await params;
  const p = await loadOwned(id, tokenFrom(req));
  if (p.status === "paid") throw new HttpError(409, "Este proyecto ya está pagado.");
  p.photos = p.photos.filter((x) => x !== photoId);
  const d = p.data as { photos?: { id: string }[]; pages?: { photoId: string }[] };
  if (d.photos) d.photos = d.photos.filter((x) => x.id !== photoId);
  if (d.pages) d.pages = d.pages.filter((x) => x.photoId !== photoId);
  await getFiles().del(photoKey(p.id, photoId)).catch(() => undefined);
  await saveProject(p);
  return json({ project: publicProject(p) });
});
