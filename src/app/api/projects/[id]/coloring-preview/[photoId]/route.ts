import { handle } from "@/lib/http";
import { HttpError, loadOwned, tokenFrom } from "@/lib/projects";
import { loadPhoto } from "@/lib/photos";
import { getFiles } from "@/lib/store";
import { STYLES, watermark, type ColoringStyle } from "@/lib/coloring/lineart";
import { AI_SHEET_COST_MICROEUR, sheet } from "@/lib/coloring/ai";
import { consume } from "@/lib/security/ratelimit";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

/** Coste estimado de CPU por muestra (en micro-euros) para el control de costes del panel. */
const PREVIEW_COST_MICROEUR = 200;

/** Muestra gratuita: resolución limitada (700 px) y marca de agua. Se cachea por foto y estilo. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id, photoId } = await params;
  const p = await loadOwned(id, tokenFrom(req));
  if (!p.photos.includes(photoId)) throw new HttpError(404, "Foto no encontrada");
  const style = new URL(req.url).searchParams.get("style") as ColoringStyle;
  if (!(style in STYLES)) throw new HttpError(400, "Estilo no válido");
  const key = `projects/${p.id}/preview-${photoId}-${style}.png`;
  let png = (await getFiles().get(key))?.data;
  if (!png) {
    await consume(req, "coloring-preview", config.limits.coloringPreviewsPerIpDay, { global: true });
    const buf = await loadPhoto(p.id, photoId);
    if (!buf) throw new HttpError(404, "Foto no encontrada");
    const r = await sheet(p.id, photoId, buf, style, 700);
    png = await watermark(r.png);
    await getFiles().put(key, png, "image/png");
    await track("free_generation", { product: "coloring" });
    await track("free_cost_microeur", { product: "coloring", by: r.fresh ? AI_SHEET_COST_MICROEUR : PREVIEW_COST_MICROEUR });
  }
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600", "X-Robots-Tag": "noindex" },
  });
});
