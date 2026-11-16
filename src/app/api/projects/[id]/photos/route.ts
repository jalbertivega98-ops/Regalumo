import { handle, json } from "@/lib/http";
import { HttpError, loadOwned, publicProject, saveProject, tokenFrom } from "@/lib/projects";
import { storePhoto } from "@/lib/photos";
import { config } from "@/lib/config";
import { consume } from "@/lib/security/ratelimit";
import { ImageInputError } from "@/lib/coloring/lineart";
import { track } from "@/lib/analytics";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const p = await loadOwned((await params).id, tokenFrom(req));
  if (p.status === "paid") throw new HttpError(409, "Este proyecto ya está pagado.");
  const max = p.product === "coloring" ? config.limits.maxPagesColoring : config.limits.maxPhotosNewspaper;
  if (p.product === "escape") throw new HttpError(400, "Este producto no usa fotos.");
  if (p.photos.length >= max + 2) throw new HttpError(400, `Puedes subir un máximo de ${max} fotos.`);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No se ha recibido ninguna imagen.");
  if (file.size > config.limits.maxUploadBytes) throw new HttpError(413, `La imagen supera el tamaño máximo (${Math.round(config.limits.maxUploadBytes / 1048576)} MB).`);
  await consume(req, "uploads", config.limits.uploadsPerIpDay);
  let id: string;
  try {
    id = await storePhoto(p.id, Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    if (e instanceof ImageInputError) throw new HttpError(400, e.message);
    throw e;
  }
  p.photos.push(id);
  await saveProject(p);
  await track("upload", { product: p.product });
  return json({ photoId: id, project: publicProject(p) }, 201);
});
