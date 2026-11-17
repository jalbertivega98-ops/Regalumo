import sharp from "sharp";
import { watermarkSvg } from "../brand/watermark";

/**
 * Conversión determinista de foto a lámina para colorear.
 * Algoritmo: luminancia normalizada → suavizado que conserva bordes (filtro de Kuwahara,
 * borra texturas como pelo o madera pero respeta contornos) → líneas por diferencia de
 * gaussianas extendida (XDoG), que sigue los contornos reales de la foto (ojos, nariz,
 * bordes) → se descartan trazos sueltos muy cortos → engrosado según el estilo.
 * El resultado se parece a la foto porque las líneas salen de sus propios bordes.
 * No usa ninguna API externa: coste por imagen ≈ unos cientos de ms de CPU.
 */
export type ColoringStyle = "infantil" | "sencillo" | "detallado";

export const STYLES: Record<ColoringStyle, { name: string; description: string }> = {
  infantil: { name: "Infantil", description: "Trazos gruesos y menos detalles: ideal de 3 a 6 años." },
  sencillo: { name: "Sencillo", description: "Contornos claros con algo de detalle." },
  detallado: { name: "Detallado", description: "Más líneas y texturas para colorear con calma." },
};

interface Params {
  work: number; // lado mayor de trabajo (px)
  kr: number; // radio del filtro de Kuwahara
  passes: number; // pasadas del filtro
  sigma: number; // escala de las líneas (mayor = solo contornos grandes)
  ink: number; // proporción de píxeles que pueden ser línea antes de limpiar (se adapta a cada foto)
  floor: number; // umbral mínimo de contraste (evita dibujar ruido en fotos muy planas)
  minPx: number; // trazos más pequeños se descartan
  thicken: number; // grosor final relativo
}

const PARAMS: Record<ColoringStyle, Params> = {
  infantil: { work: 900, kr: 3, passes: 1, sigma: 1.3, ink: 0.09, floor: -0.8, minPx: 170, thicken: 3 },
  sencillo: { work: 900, kr: 3, passes: 1, sigma: 1.3, ink: 0.1, floor: -0.8, minPx: 140, thicken: 2.2 },
  detallado: { work: 1000, kr: 2, passes: 1, sigma: 1.2, ink: 0.14, floor: -0.5, minPx: 50, thicken: 1.3 },
};

export class ImageInputError extends Error {}

/** Normaliza una foto subida: valida, orienta, elimina metadatos (incl. GPS) y limita tamaño. */
export async function normalizePhoto(input: Buffer, maxSide = 2400): Promise<Buffer> {
  let meta;
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new ImageInputError("El archivo no es una imagen válida.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "heif", "avif", "gif", "tiff"].includes(meta.format)) {
    throw new ImageInputError("Formato no admitido. Usa JPG, PNG, WEBP o HEIC.");
  }
  return sharp(input, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer(); // sharp no copia EXIF/GPS salvo que se pida con withMetadata()
}

/** Quita de la máscara (0 = trazo) los componentes de trazo con menos de minPx píxeles. */
function dropShortStrokes(mask: Uint8Array, w: number, h: number, minPx: number) {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const members: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (mask[s] !== 0 || seen[s]) continue;
    let sp = 0;
    stack[sp++] = s;
    seen[s] = 1;
    members.length = 0;
    while (sp) {
      const p = stack[--sp];
      members.push(p);
      const x = p % w, y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (mask[q] === 0 && !seen[q]) { seen[q] = 1; stack[sp++] = q; }
        }
    }
    if (members.length < minPx) for (const p of members) mask[p] = 255;
  }
}

/** Filtro de Kuwahara (con imágenes integrales): suaviza texturas y conserva bordes. */
function kuwahara(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const W = w + 1;
  const S = new Float64Array(W * (h + 1));
  const S2 = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let a = 0, b = 0;
    for (let x = 0; x < w; x++) {
      const v = src[y * w + x];
      a += v;
      b += v * v;
      S[(y + 1) * W + x + 1] = S[y * W + x + 1] + a;
      S2[(y + 1) * W + x + 1] = S2[y * W + x + 1] + b;
    }
  }
  const box = (A: Float64Array, x0: number, y0: number, x1: number, y1: number) => A[(y1 + 1) * W + x1 + 1] - A[y0 * W + x1 + 1] - A[(y1 + 1) * W + x0] + A[y0 * W + x0];
  const out = new Uint8Array(w * h);
  const Q = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let best = Infinity, mean = src[y * w + x];
      for (const [dx, dy] of Q) {
        const x0 = Math.max(0, Math.min(x, x + dx * r)), x1 = Math.min(w - 1, Math.max(x, x + dx * r));
        const y0 = Math.max(0, Math.min(y, y + dy * r)), y1 = Math.min(h - 1, Math.max(y, y + dy * r));
        const n = (x1 - x0 + 1) * (y1 - y0 + 1);
        const m = box(S, x0, y0, x1, y1) / n;
        const v = box(S2, x0, y0, x1, y1) / n - m * m;
        if (v < best) { best = v; mean = m; }
      }
      out[y * w + x] = mean;
    }
  return out;
}

const grey = (buf: Uint8Array, w: number, h: number) => sharp(Buffer.from(buf), { raw: { width: w, height: h, channels: 1 } });

/**
 * Devuelve un PNG en escala de grises (contornos negros sobre blanco) con el lado mayor = outSide.
 */
export async function toLineArt(input: Buffer, style: ColoringStyle, outSide: number, tune?: Partial<Params>): Promise<Buffer> {
  const P = { ...PARAMS[style], ...tune };
  const { data, info } = await sharp(input)
    .rotate()
    .resize(P.work, P.work, { fit: "inside" })
    .removeAlpha()
    .greyscale()
    .toColourspace("b-w")
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  let g: Uint8Array = new Uint8Array(data.buffer, data.byteOffset, n);
  for (let i = 0; i < P.passes; i++) g = kuwahara(g, w, h, P.kr);

  const blur = (s: number) => grey(g, w, h).blur(s).toColourspace("b-w").raw().toBuffer();
  const [a, b] = await Promise.all([blur(P.sigma), blur(P.sigma * 1.6)]);
  // Umbral adaptativo: cada foto tiene distinto contraste, así que se fija la cantidad de
  // tinta (percentil) en lugar de un valor absoluto, con un mínimo para no dibujar ruido.
  const D = new Float32Array(n);
  for (let i = 0; i < n; i++) D[i] = a[i] - 0.98 * b[i];
  const sorted = Float32Array.from(D).sort();
  const eps = Math.min(P.floor, sorted[Math.floor(n * P.ink)]);
  const out = new Uint8Array(n).fill(255);
  for (let i = 0; i < n; i++) if (D[i] < eps) out[i] = 0;
  dropShortStrokes(out, w, h, P.minPx);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) out[y * w + x] = 255;

  const scale = outSide / Math.max(w, h);
  const W = Math.round(w * scale), H = Math.round(h * scale);
  const thick = Math.max(0.4, (P.thicken * outSide) / 1000 / 2);
  // Cada paso en su propia canalización: sharp aplica las operaciones en un orden fijo
  // (y solo un blur), así que encadenarlas en una sola daría un resultado distinto.
  const raw1 = (b: Buffer, ww: number, hh: number) => sharp(b, { raw: { width: ww, height: hh, channels: 1 } });
  const up = await grey(out, w, h).resize(W, H, { kernel: "cubic" }).toColourspace("b-w").raw().toBuffer();
  const thickened = await raw1(up, W, H).blur(thick).toColourspace("b-w").raw().toBuffer();
  for (let i = 0; i < thickened.length; i++) thickened[i] = thickened[i] < 244 ? 0 : 255;
  const smooth = await raw1(thickened, W, H).blur(Math.max(0.3, outSide / 2400)).toColourspace("b-w").raw().toBuffer();
  for (let i = 0; i < smooth.length; i++) if (smooth[i] > 247) smooth[i] = 255; // papel blanco puro al imprimir
  return raw1(smooth, W, H).png({ compressionLevel: 9 }).toBuffer();
}

/** Marca de agua para las muestras gratuitas: «REGALUMO» repetido por toda la lámina. */
export async function watermark(png: Buffer): Promise<Buffer> {
  const meta = await sharp(png).metadata();
  const svg = Buffer.from(watermarkSvg(meta.width ?? 600, meta.height ?? 600, 0.32));
  return sharp(png).composite([{ input: svg }]).png().toBuffer();
}
