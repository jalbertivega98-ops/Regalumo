import sharp, { type Sharp } from "sharp";

/**
 * Conversión determinista de foto a lámina para colorear.
 * Algoritmo: suavizado que conserva bordes → diferencia de gaussianas (DoG) →
 * umbral → limpieza de manchas pequeñas → engrosado de líneas según el estilo.
 * No usa ninguna API externa: coste por imagen ≈ unos cientos de ms de CPU.
 */
export type ColoringStyle = "infantil" | "sencillo" | "detallado";

export const STYLES: Record<ColoringStyle, { name: string; description: string }> = {
  infantil: { name: "Infantil", description: "Trazos gruesos y pocas zonas: ideal de 3 a 6 años." },
  sencillo: { name: "Sencillo", description: "Contornos claros con algo de detalle." },
  detallado: { name: "Detallado", description: "Más líneas y texturas para colorear con calma." },
};

interface Params {
  work: number; // lado mayor de la resolución de trabajo
  median: number; // suavizado previo que conserva bordes
  colors: number; // zonas de color (k-means)
  minArea: number; // fracción mínima del área total para una zona
  edges: number; // umbral DoG para detalles extra (0 = sin detalles)
  thicken: number; // grosor relativo del trazo (en ‰ del lado mayor de salida)
}

const PARAMS: Record<ColoringStyle, Params> = {
  infantil: { work: 480, median: 11, colors: 4, minArea: 0.008, edges: 0, thicken: 3.4 },
  sencillo: { work: 600, median: 9, colors: 6, minArea: 0.003, edges: 0, thicken: 2.2 },
  detallado: { work: 800, median: 7, colors: 9, minArea: 0.0011, edges: 0, thicken: 1.3 },
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

/** Generador pseudoaleatorio con semilla: mismo input, mismo resultado. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** k-means sobre colores (RGB con más peso en luminancia), con k-means++ determinista. */
function quantize(px: Uint8Array, n: number, k: number): Uint8Array {
  const rand = rng(n * 31 + k);
  const feat = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = px[i * 3], g = px[i * 3 + 1], b = px[i * 3 + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    feat[i * 3] = y * 1.6;
    feat[i * 3 + 1] = (r - g) * 0.8;
    feat[i * 3 + 2] = (b - y) * 0.8;
  }
  const sampleIdx: number[] = [];
  const step = Math.max(1, Math.floor(n / 12000));
  for (let i = 0; i < n; i += step) sampleIdx.push(i);
  const C = new Float32Array(k * 3);
  const d2 = (i: number, c: number) => {
    const a = feat[i * 3] - C[c * 3], b = feat[i * 3 + 1] - C[c * 3 + 1], d = feat[i * 3 + 2] - C[c * 3 + 2];
    return a * a + b * b + d * d;
  };
  // k-means++
  const first = sampleIdx[Math.floor(rand() * sampleIdx.length)];
  C.set(feat.subarray(first * 3, first * 3 + 3), 0);
  const best = new Float32Array(sampleIdx.length).fill(Infinity);
  for (let c = 1; c < k; c++) {
    let sum = 0;
    sampleIdx.forEach((i, j) => {
      best[j] = Math.min(best[j], d2(i, c - 1));
      sum += best[j];
    });
    let r = rand() * sum;
    let pick = sampleIdx[0];
    for (let j = 0; j < sampleIdx.length; j++) {
      r -= best[j];
      if (r <= 0) { pick = sampleIdx[j]; break; }
    }
    C.set(feat.subarray(pick * 3, pick * 3 + 3), c * 3);
  }
  for (let it = 0; it < 10; it++) {
    const acc = new Float64Array(k * 4);
    for (const i of sampleIdx) {
      let bc = 0, bd = Infinity;
      for (let c = 0; c < k; c++) { const d = d2(i, c); if (d < bd) { bd = d; bc = c; } }
      acc[bc * 4] += feat[i * 3]; acc[bc * 4 + 1] += feat[i * 3 + 1]; acc[bc * 4 + 2] += feat[i * 3 + 2]; acc[bc * 4 + 3]++;
    }
    for (let c = 0; c < k; c++) if (acc[c * 4 + 3]) for (let j = 0; j < 3; j++) C[c * 3 + j] = acc[c * 4 + j] / acc[c * 4 + 3];
  }
  const labels = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let bc = 0, bd = Infinity;
    for (let c = 0; c < k; c++) { const d = d2(i, c); if (d < bd) { bd = d; bc = c; } }
    labels[i] = bc;
  }
  return labels;
}

/** Filtro de moda 3x3: suaviza los bordes entre zonas. */
function modeFilter(L: Uint8Array, w: number, h: number, k: number) {
  const out = new Uint8Array(L);
  const cnt = new Uint16Array(k);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      cnt.fill(0);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cnt[L[(y + dy) * w + x + dx]]++;
      let bl = L[y * w + x], bc = 0;
      for (let c = 0; c < k; c++) if (cnt[c] > bc) { bc = cnt[c]; bl = c; }
      if (bc >= 5) out[y * w + x] = bl;
    }
  return out;
}

/** Une las zonas pequeñas a la zona vecina más frecuente. */
function mergeSmall(L: Uint8Array, w: number, h: number, k: number, minArea: number) {
  const comp = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  let changed = false;
  let id = 0;
  const members: number[] = [];
  const neigh = new Uint32Array(k);
  for (let s = 0; s < w * h; s++) {
    if (comp[s] !== -1) continue;
    const lab = L[s];
    let sp = 0;
    stack[sp++] = s;
    comp[s] = id;
    members.length = 0;
    neigh.fill(0);
    while (sp) {
      const p = stack[--sp];
      members.push(p);
      const x = p % w, y = (p - x) / w;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) {
        if (q < 0) continue;
        if (L[q] === lab) {
          if (comp[q] === -1) { comp[q] = id; stack[sp++] = q; }
        } else neigh[L[q]]++;
      }
    }
    if (members.length < minArea) {
      let bl = lab, bc = 0;
      for (let c = 0; c < k; c++) if (neigh[c] > bc) { bc = neigh[c]; bl = c; }
      if (bl !== lab) { for (const p of members) L[p] = bl; changed = true; }
    }
    id++;
  }
  return changed;
}

async function rawGrey(img: Sharp) {
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/**
 * Devuelve un PNG en escala de grises (contornos negros sobre blanco) con el lado mayor = outSide.
 * Las zonas quedan cerradas, que es lo que hace que una lámina se pueda colorear de verdad.
 */
export async function toLineArt(input: Buffer, style: ColoringStyle, outSide: number): Promise<Buffer> {
  const P = PARAMS[style];
  const smooth = sharp(input).rotate().resize(P.work, P.work, { fit: "inside" }).removeAlpha().normalise().median(P.median).median(P.median);
  const { data: rgb, info } = await smooth.clone().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  let L = quantize(rgb, n, P.colors);
  for (let i = 0; i < 3; i++) L = modeFilter(L, w, h, P.colors);
  const minArea = Math.max(12, Math.round(n * P.minArea));
  for (let i = 0; i < 4 && mergeSmall(L, w, h, P.colors, minArea); i++);

  const out = Buffer.alloc(n, 255);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if ((x < w - 1 && L[p] !== L[p + 1]) || (y < h - 1 && L[p] !== L[p + w])) out[p] = 0;
    }
  if (P.edges) {
    const pre = await smooth.clone().greyscale().png().toBuffer();
    const [a, b] = await Promise.all([rawGrey(sharp(pre).blur(1.0)), rawGrey(sharp(pre).blur(2.2))]);
    for (let i = 0; i < n; i++) if (b.data[i] - a.data[i] > P.edges) out[i] = 0;
  }
  // Marco limpio
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) out[y * w + x] = 255;

  const scale = outSide / Math.max(w, h);
  const W = Math.round(w * scale), H = Math.round(h * scale);
  const thick = Math.max(0.4, (P.thicken * outSide) / 1000 / 2);
  return sharp(out, { raw: { width: w, height: h, channels: 1 } })
    .resize(W, H, { kernel: "cubic" })
    .blur(thick)
    .threshold(244)
    .blur(Math.max(0.3, outSide / 2400))
    .greyscale()
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Marca de agua para las muestras gratuitas. */
export async function watermark(png: Buffer): Promise<Buffer> {
  const meta = await sharp(png).metadata();
  const w = meta.width ?? 600;
  const h = meta.height ?? 600;
  const fs = Math.round(Math.min(w, h) / 9);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <g transform="translate(${w / 2} ${h / 2}) rotate(-30)" font-family="sans-serif" font-weight="800" text-anchor="middle" fill="#FF6B4A" fill-opacity="0.35">
        <text y="${-fs}" font-size="${fs}">REGALUMO</text>
        <text y="${fs * 0.6}" font-size="${fs * 0.5}">MUESTRA GRATUITA</text>
      </g>
    </svg>`,
  );
  return sharp(png).composite([{ input: svg }]).png().toBuffer();
}
