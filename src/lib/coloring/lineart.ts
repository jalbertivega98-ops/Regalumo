import sharp from "sharp";
import { watermarkSvg } from "../brand/watermark";
import { subjectMask } from "./subject";
import { maskToPaths, svgDoc } from "./vector";

/**
 * Conversión determinista de foto a lámina para colorear.
 * Algoritmo: luminancia normalizada → suavizado que conserva bordes (filtro de Kuwahara,
 * borra texturas como pelo o madera pero respeta contornos) → líneas por diferencia de
 * gaussianas extendida (XDoG), que sigue los contornos reales de la foto (ojos, nariz,
 * bordes) → se descartan trazos sueltos muy cortos → engrosado según el estilo.
 * Además se detecta el sujeto (subject.ts) para dibujar su silueta cerrada y simplificar el fondo,
 * y se añaden zonas de tono (manchas, pelaje, ropa). Ver toLineArt.
 * El resultado se parece a la foto porque las líneas salen de sus propios bordes.
 * No usa ninguna API externa: todo corre en nuestro servidor, ≈1-3 s de CPU por imagen.
 */
export type ColoringStyle = "infantil" | "sencillo" | "detallado";

export const STYLES: Record<ColoringStyle, { name: string; description: string }> = {
  infantil: { name: "Infantil", description: "Solo la persona o mascota, con trazo grueso y sin fondo: ideal de 3 a 6 años." },
  sencillo: { name: "Sencillo", description: "Contornos claros y el fondo simplificado." },
  detallado: { name: "Detallado", description: "Más detalle y zonas de color para colorear con calma." },
};

export interface Params {
  work: number; // lado mayor de trabajo (px)
  kr: number; // radio del filtro de Kuwahara
  passes: number; // pasadas del filtro
  sigma: number; // escala de las líneas (mayor = solo contornos grandes)
  ink: number; // proporción de píxeles que pueden ser línea antes de limpiar (se adapta a cada foto)
  floor: number; // umbral mínimo de contraste (evita dibujar ruido en fotos muy planas)
  minPx: number; // trazos más pequeños se descartan
  thicken: number; // grosor final relativo
  toneN: number; // niveles de tono para las zonas de color (0 = sin zonas)
  bg: "none" | "simple"; // si se dibuja el fondo (simplificado) cuando se detecta un sujeto
  minStroke: number; // trazos sueltos más cortos que esta fracción del lado mayor se quitan
}

export const PARAMS: Record<ColoringStyle, Params> = {
  infantil: { work: 900, kr: 3, passes: 1, sigma: 1.3, ink: 0.09, floor: -0.8, minPx: 170, thicken: 3, toneN: 0, bg: "none", minStroke: 0.01 },
  sencillo: { work: 900, kr: 3, passes: 1, sigma: 1.3, ink: 0.1, floor: -0.8, minPx: 140, thicken: 2.2, toneN: 3, bg: "simple", minStroke: 0.01 },
  detallado: { work: 1000, kr: 2, passes: 1, sigma: 1.2, ink: 0.13, floor: -0.5, minPx: 70, thicken: 1.6, toneN: 4, bg: "simple", minStroke: 0.008 },
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
export function kuwahara(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
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

/** Máscara de líneas XDoG (0 = línea) a la resolución de trabajo. */
export async function xdogMask(input: Buffer, P: Params) {
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
  return { mask: out, w, h };
}

/** Pasa una máscara de líneas (0 = línea) a PNG final: limpia, escala, engrosa y suaviza. */
export async function renderMask(out: Uint8Array, w: number, h: number, outSide: number, minPx: number, thicken: number) {
  dropShortStrokes(out, w, h, minPx);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) out[y * w + x] = 255;

  const scale = outSide / Math.max(w, h);
  const W = Math.round(w * scale), H = Math.round(h * scale);
  const thick = Math.max(0.4, (thicken * outSide) / 1000 / 2);
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

/** Componentes 4-conexos de una máscara binaria (1 = dentro). Devuelve etiquetas y tamaños. */
function components(m: Uint8Array, w: number, h: number) {
  const n = w * h, lab = new Int32Array(n).fill(-1), stack = new Int32Array(n), sizes: number[] = [], border: boolean[] = [];
  for (let st = 0; st < n; st++) {
    if (lab[st] >= 0) continue;
    const id = sizes.length, v = m[st];
    let sp = 0, cnt = 0, b = false;
    stack[sp++] = st; lab[st] = id;
    while (sp) {
      const p = stack[--sp]; cnt++;
      const x = p % w, y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) b = true;
      if (x > 0 && lab[p - 1] < 0 && m[p - 1] === v) { lab[p - 1] = id; stack[sp++] = p - 1; }
      if (x < w - 1 && lab[p + 1] < 0 && m[p + 1] === v) { lab[p + 1] = id; stack[sp++] = p + 1; }
      if (y > 0 && lab[p - w] < 0 && m[p - w] === v) { lab[p - w] = id; stack[sp++] = p - w; }
      if (y < h - 1 && lab[p + w] < 0 && m[p + w] === v) { lab[p + w] = id; stack[sp++] = p + w; }
    }
    sizes.push(cnt); border.push(b);
  }
  return { lab, sizes, border };
}

/**
 * Sujeto principal como máscara binaria limpia (1 = sujeto): contorno suavizado, sin islas
 * pequeñas ni agujeros. null si no hay un sujeto claro (paisajes, fotos llenas de cosas…).
 */
async function cleanSubject(input: Buffer, w: number, h: number): Promise<Uint8Array | null> {
  const raw = await subjectMask(input, w, h);
  if (!raw) return null;
  const sm = await grey(raw, w, h).blur(Math.max(1.5, w / 160)).toColourspace("b-w").raw().toBuffer();
  const n = w * h, m = new Uint8Array(n);
  for (let i = 0; i < n; i++) m[i] = sm[i] >= 128 ? 1 : 0;
  const { lab, sizes, border } = components(m, w, h);
  for (let i = 0; i < n; i++) {
    const c = lab[i];
    if (m[i] === 1 && sizes[c] < n * 0.015) m[i] = 0; // islas pequeñas
    else if (m[i] === 0 && !border[c] && sizes[c] < n * 0.02) m[i] = 1; // agujeros
  }
  let area = 0;
  for (let i = 0; i < n; i++) area += m[i];
  return area > n * 0.04 && area < n * 0.92 ? m : null;
}

/** Dilata (r > 0) o erosiona (r < 0) una máscara binaria con un disco aproximado. */
async function morph(m: Uint8Array, w: number, h: number, r: number) {
  const b = await grey(m.map((v) => (v ? 255 : 0)), w, h).blur(Math.abs(r) / 2 + 0.3).toColourspace("b-w").raw().toBuffer();
  const out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = r > 0 ? (b[i] > 20 ? 1 : 0) : b[i] > 235 ? 1 : 0;
  return out;
}

/**
 * Zonas de tono: la luminancia muy suavizada se divide en N niveles y se dibujan los bordes
 * entre niveles donde el cambio es claro. Así aparecen manchas, rayas del pelaje, el cuello
 * de una camisa… que el detector de contornos no ve, y quedan zonas cerradas para colorear.
 */
async function toneMask(input: Buffer, w: number, h: number, N: number) {
  const { data } = await sharp(input).rotate().resize(w, h, { fit: "fill" }).removeAlpha().greyscale().toColourspace("b-w").normalise().raw().toBuffer({ resolveWithObject: true });
  const n = w * h;
  let g: Uint8Array = new Uint8Array(data.buffer, data.byteOffset, n);
  g = kuwahara(kuwahara(g, w, h, 5), w, h, 5);
  const s = await grey(g, w, h).blur(6 * (Math.max(w, h) / 900)).toColourspace("b-w").raw().toBuffer();
  const sorted = Uint8Array.from(s).sort();
  const cuts = Array.from({ length: N - 1 }, (_, i) => sorted[Math.floor((n * (i + 1)) / N)]);
  const lv = new Uint8Array(n);
  for (let i = 0; i < n; i++) { let l = 0; while (l < cuts.length && s[i] > cuts[l]) l++; lv[i] = l; }
  // Las zonas muy pequeñas se funden con el nivel vecino más frecuente.
  const minArea = n * 0.015;
  for (let level = 0; level < N; level++) {
    const mm = new Uint8Array(n);
    for (let i = 0; i < n; i++) mm[i] = lv[i] === level ? 1 : 0;
    const { lab, sizes } = components(mm, w, h);
    const fix = new Map<number, Map<number, number>>();
    for (let p = 0; p < n; p++) {
      if (!mm[p] || sizes[lab[p]] >= minArea) continue;
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
        if (q < 0 || q >= n || lv[q] === level) continue;
        const c = fix.get(lab[p]) ?? new Map<number, number>();
        c.set(lv[q], (c.get(lv[q]) ?? 0) + 1);
        fix.set(lab[p], c);
      }
    }
    const to = new Map<number, number>();
    for (const [c, cnt] of fix) { let best = level, bc = 0; for (const [k, v] of cnt) if (v > bc) { bc = v; best = k; } to.set(c, best); }
    for (let p = 0; p < n; p++) if (mm[p] && to.has(lab[p])) lv[p] = to.get(lab[p])!;
  }
  const out = new Uint8Array(n).fill(255);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (lv[p + 1] === lv[p] && lv[p + w] === lv[p]) continue;
      const gx = s[p + 1] - s[p - 1], gy = s[p + w] - s[p - w];
      if (Math.hypot(gx, gy) / 2 >= 2) out[p] = 0; // en degradados muy suaves no se dibuja
    }
  return out;
}

/**
 * Devuelve un PNG en escala de grises (contornos negros sobre blanco) con el lado mayor = outSide.
 *
 * 1. Se separa el sujeto del fondo (U²-Net, en nuestro servidor) y se dibuja su silueta como
 *    una línea continua y cerrada: la persona o la mascota queda bien delimitada.
 * 2. Dentro del sujeto: contornos de la foto (XDoG: ojos, boca, ropa) y zonas de tono.
 * 3. El fondo se simplifica según el estilo (Infantil: sin fondo; Sencillo: solo líneas largas;
 *    Detallado: completo), con trazo más fino para que el sujeto destaque.
 * Si no hay un sujeto claro (un paisaje), se dibuja la foto entera.
 */
export async function toLineArt(input: Buffer, style: ColoringStyle, outSide: number, tune?: Partial<Params>): Promise<Buffer> {
  const P = { ...PARAMS[style], ...tune };
  const { mask: xd, w, h } = await xdogMask(input, P);
  const n = w * h;
  const fg = await cleanSubject(input, w, h);
  const tone = P.toneN > 1 ? await toneMask(input, w, h, P.toneN) : null;
  const layers: Layer[] = [];

  if (!fg) {
    layers.push({ mask: xd, minPx: P.minPx, width: 1 });
    if (tone) layers.push({ mask: tone, minPx: P.minPx * 2, width: 0.55 });
    return renderLayers(layers, w, h, outSide, P.thicken, P.minStroke);
  }

  const near = await morph(fg, w, h, Math.max(3, w / 150)); // sujeto + un margen
  const inner = await morph(fg, w, h, -Math.max(4, w / 100));
  const subj = new Uint8Array(n).fill(255);
  const toneL = new Uint8Array(n).fill(255);
  const back = new Uint8Array(n).fill(255);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      // silueta: borde del sujeto, a ambos lados (2 px) para que sea el trazo principal
      if ((x > 0 && fg[p - 1] !== fg[p]) || (x < w - 1 && fg[p + 1] !== fg[p]) || (y > 0 && fg[p - w] !== fg[p]) || (y < h - 1 && fg[p + w] !== fg[p])) subj[p] = 0;
      if (xd[p] === 0) {
        if (inner[p]) subj[p] = 0;
        else if (!near[p] && P.bg !== "none") back[p] = 0;
      }
      if (tone && tone[p] === 0 && inner[p]) toneL[p] = 0;
    }
  layers.push({ mask: subj, minPx: Math.round(P.minPx * 0.6), width: 1 });
  // Zonas de tono con trazo más fino: detalle secundario que no compite con los contornos.
  if (tone) layers.push({ mask: toneL, minPx: P.minPx * 2, width: 0.55 });
  // Fondo más fino y solo con trazos largos para que el sujeto destaque.
  if (P.bg !== "none") layers.push({ mask: back, minPx: Math.round(560 * (P.work / 900)), width: 0.6 });
  return renderLayers(layers, w, h, outSide, P.thicken, P.minStroke);
}

type Layer = { mask: Uint8Array; minPx: number; width: number };

/**
 * Dibuja las capas como trazos vectoriales lisos de grosor uniforme (vector.ts) y las rasteriza
 * al tamaño final: líneas nítidas a cualquier resolución de impresión.
 */
async function renderLayers(layers: Layer[], w: number, h: number, outSide: number, thicken: number, minStroke: number) {
  const s = outSide / Math.max(w, h);
  const W = Math.round(w * s), H = Math.round(h * s);
  const base = (thicken * outSide) / 1000 * 2.3; // grosor del trazo principal en px de salida
  const vec = layers.map((l) => {
    dropShortStrokes(l.mask, w, h, l.minPx);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) l.mask[y * w + x] = 255;
    return { paths: maskToPaths(l.mask, w, h, s, minStroke * Math.max(w, h)), width: Math.max(1.5, base * l.width) };
  });
  const { data, info } = await sharp(Buffer.from(svgDoc(W, H, vec))).greyscale().toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i++) if (data[i] > 247) data[i] = 255; // papel blanco puro al imprimir
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } }).png({ compressionLevel: 9 }).toBuffer();
}

/** Marca de agua para las muestras gratuitas: «REGALUMO» repetido por toda la lámina. */
export async function watermark(png: Buffer): Promise<Buffer> {
  const meta = await sharp(png).metadata();
  const svg = Buffer.from(watermarkSvg(meta.width ?? 600, meta.height ?? 600, 0.32));
  return sharp(png).composite([{ input: svg }]).png().toBuffer();
}
