import { getFiles } from "../store";
import type { Project } from "../projects";
import { loadPhoto, tone } from "../photos";
import { newspaperSchema } from "../newspaper/model";
import { THEMES as PAPER_THEMES } from "../newspaper/theme";
import { renderNewspaperPdf } from "../newspaper/pdf";
import { generateGame } from "../escape/generator";
import { renderEscapePdf } from "../escape/pdf";
import { coloringSchema } from "../coloring/model";
import { toLineArt } from "../coloring/lineart";
import { renderColoringPdf } from "../coloring/pdf";
import type { ProductId } from "./catalog";

function slug(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "regalo"
  );
}

/** Genera el archivo final (sin marcas de agua, alta calidad) de un proyecto pagado. */
export const FINAL: Record<ProductId, (p: Project) => Promise<{ data: Buffer; filename: string }>> = {
  async newspaper(p) {
    const d = newspaperSchema.parse(p.data);
    const mode = PAPER_THEMES[d.template].photo;
    const photos: Record<string, Buffer> = {};
    for (const ph of d.photos) {
      const buf = await loadPhoto(p.id, ph.id);
      if (buf) photos[ph.id] = await tone(buf, mode);
    }
    const data = await renderNewspaperPdf(d, photos);
    return { data, filename: `periodico-${slug(d.honoree || d.paperName)}.pdf` };
  },
  async escape(p) {
    const g = generateGame(p.data);
    return { data: await renderEscapePdf(g), filename: `escape-room-${slug(g.title)}.pdf` };
  },
  async coloring(p) {
    const d = coloringSchema.parse(p.data);
    const pages: Buffer[] = [];
    for (const pg of d.pages) {
      const buf = await loadPhoto(p.id, pg.photoId);
      if (buf) pages.push(await toLineArt(buf, pg.style ?? d.style, 3200));
    }
    if (!pages.length) throw new Error("El libro no tiene páginas");
    const first = await loadPhoto(p.id, d.pages[0].photoId);
    const cover = first ? await toLineArt(first, "infantil", 1600) : undefined;
    const data = await renderColoringPdf({ title: d.title, dedication: d.dedication, pages, cover });
    return { data, filename: `libro-colorear-${slug(d.title)}.pdf` };
  },
};

/** Devuelve el PDF final, generándolo y guardándolo en privado la primera vez. */
export async function finalFile(p: Project) {
  const key = `projects/${p.id}/final-${Date.parse(p.updatedAt) || 0}.pdf`;
  const cached = await getFiles().get(key);
  const { data, filename } = cached ? { data: cached.data, filename: "" } : await FINAL[p.product](p);
  if (!cached) await getFiles().put(key, data, "application/pdf");
  return { data, filename: filename || `regalumo-${p.product}.pdf` };
}
