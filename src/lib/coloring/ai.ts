import sharp from "sharp";
import { config } from "../config";
import { getFiles } from "../store";
import { toLineArt, type ColoringStyle } from "./lineart";

/**
 * Láminas con IA (FLUX.2 [klein] 4B Edit en fal.ai, ≈0,01 $ por megapíxel de salida).
 * Solo se usa si IMAGE_AI_PROVIDER=fal y IMAGE_AI_API_KEY están definidos. Sin ellos, o si la IA
 * falla, se usa el método propio (lineart.ts), que no tiene coste.
 *
 * La lámina "maestra" de la IA se guarda por foto y estilo: la muestra gratuita y el PDF final
 * salen de la misma imagen, así el cliente recibe exactamente lo que vio.
 */
const ENDPOINT = "https://fal.run/fal-ai/flux-2/klein/4b/edit";
const MASTER_LONG_SIDE = 1536;

const BASE =
  "Turn this photo into a printable coloring book page. Pure black line art on a pure white background. " +
  "No shading, no gray tones, no color, no hatching, no fills, no text, no border. " +
  "Keep exactly the same subject, pose, composition, proportions and facial features, so the person or animal is clearly recognisable. " +
  "Close all outlines so every area can be colored.";
const STYLE_PROMPT: Record<ColoringStyle, string> = {
  infantil: "Very thick, bold, smooth outlines. Simplified, rounded shapes and only the main details, for children aged 3 to 6. Simplify the background to a few large shapes.",
  sencillo: "Clean medium-weight outlines with a moderate amount of detail. Keep the main background elements, simplified.",
  detallado: "Fine, precise outlines with rich detail: hair strands, fabric folds, textures and background elements, for older children and adults.",
};

/** Coste estimado de una lámina IA (en micro-euros) para el panel de costes. */
export const AI_SHEET_COST_MICROEUR = 20_000;

export function aiEnabled() {
  return config.imageAi.provider === "fal" && !!config.imageAi.apiKey;
}

/** Tamaño de salida con el mismo formato que la foto (múltiplos de 16, lado mayor 1536). */
function outSize(w: number, h: number) {
  const s = MASTER_LONG_SIDE / Math.max(w, h);
  const r16 = (v: number) => Math.max(512, Math.round((v * s) / 16) * 16);
  return { width: r16(w), height: r16(h) };
}

async function callFal(photo: Buffer, style: ColoringStyle): Promise<Buffer> {
  const img = sharp(photo).rotate().resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" });
  const jpeg = await img.jpeg({ quality: 88 }).toBuffer({ resolveWithObject: true });
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Key ${config.imageAi.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${BASE} ${STYLE_PROMPT[style]}`,
      image_urls: [`data:image/jpeg;base64,${jpeg.data.toString("base64")}`],
      image_size: outSize(jpeg.info.width, jpeg.info.height),
      output_format: "png",
      num_images: 1,
      enable_safety_checker: true,
      seed: 7,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const out = (await res.json()) as { images?: { url: string }[]; has_nsfw_concepts?: boolean[] };
  if (out.has_nsfw_concepts?.[0]) throw new Error("fal: imagen marcada por el filtro de seguridad");
  const url = out.images?.[0]?.url;
  if (!url) throw new Error("fal: respuesta sin imagen");
  const img2 = url.startsWith("data:")
    ? Buffer.from(url.slice(url.indexOf(",") + 1), "base64")
    : Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(30_000) })).arrayBuffer());
  return sharp(img2).greyscale().toColourspace("b-w").png().toBuffer();
}

/**
 * Pasa la lámina de la IA a blanco y negro limpio para imprimir: grises claros → papel blanco,
 * grises oscuros → tinta negra, conservando un borde suave (antialiasing) en las líneas.
 */
export async function cleanSheet(master: Buffer, outSide: number): Promise<Buffer> {
  const { data, info } = await sharp(master)
    .resize(outSide, outSide, { fit: "inside", kernel: "lanczos3" })
    .greyscale()
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const LO = 90, HI = 190;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    data[i] = v <= LO ? 0 : v >= HI ? 255 : Math.round(((v - LO) / (HI - LO)) * 255);
  }
  const m = 2; // margen blanco por si la IA dibuja un marco
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < m || y < m || x >= w - m || y >= h - m) data[y * w + x] = 255;
  return sharp(data, { raw: { width: w, height: h, channels: 1 } }).png({ compressionLevel: 9 }).toBuffer();
}

/** Lámina maestra IA guardada (o generada ahora). Devuelve null si la IA no está activa o falla. */
export async function aiMaster(projectId: string, photoId: string, photo: Buffer, style: ColoringStyle): Promise<{ png: Buffer; fresh: boolean } | null> {
  if (!aiEnabled()) return null;
  const key = `projects/${projectId}/ai-${photoId}-${style}.png`;
  const cached = (await getFiles().get(key))?.data;
  if (cached) return { png: cached, fresh: false };
  try {
    const png = await callFal(photo, style);
    await getFiles().put(key, png, "image/png");
    return { png, fresh: true };
  } catch (e) {
    console.error("[coloring-ai]", (e as Error).message);
    return null;
  }
}

/** Lámina final: IA si está activa, si no (o si falla) el método propio. */
export async function sheet(projectId: string, photoId: string, photo: Buffer, style: ColoringStyle, outSide: number) {
  const m = await aiMaster(projectId, photoId, photo, style);
  return { png: m ? await cleanSheet(m.png, outSide) : await toLineArt(photo, style, outSide), ai: !!m, fresh: !!m?.fresh };
}
