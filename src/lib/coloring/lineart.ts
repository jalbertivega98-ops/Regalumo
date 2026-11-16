import sharp, { type Sharp } from "sharp";

/**
 * Conversión determinista de foto a lámina para colorear.
 * Algoritmo: suavizado que conserva bordes → zonas de color (k-means) con bordes
 * redondeados (filtro de moda 5x5) y fusión de zonas pequeñas → detalles (ojos,
 * boca, pliegues) por diferencia de gaussianas, descartando trazos sueltos cortos →
 * engrosado de líneas según el estilo.
 * No usa ninguna API externa: coste por imagen ≈ unos cientos de ms de CPU.
 */
export type ColoringStyle = "infantil" | "sencillo" | "detallado";

export const STYLES: Record<ColoringStyle, { name: string; description: string }> = {
  infantil: { name: "Infantil", description: "Trazos gruesos y pocas zonas: ideal de 3 a 6 años." },
  sencillo: { name: "Sencillo", description: "Contornos claros con algo de detalle." },
  detallado: { name: "Detallado", description: "Más líneas y texturas para colorear con calma." },
};

interface Params {
  work: number;
  median: number;
  colors: number;
  minArea: number;
  modeR: number;
  modePasses: number;
  edges: number; // umbral DoG (0 = sin detalles)
  minStroke: number; // fracción del lado mayor: trazos de detalle más cortos se descartan
  thicken: number;
}

const PARAMS: Record<ColoringStyle, Params> = {
  infantil: { work: 420, median: 9, colors: 4, minArea: 0.012, modeR: 2, modePasses: 4, edges: 11, minStroke: 0.12, thicken: 3.6 },
  sencillo: { work: 560, median: 9, colors: 5, minArea: 0.005, modeR: 2, modePasses: 3, edges: 9, minStroke: 0.08, thicken: 2.3 },
  detallado: { work: 760, median: 7, colors: 7, minArea: 0.002, modeR: 2, modePasses: 2, edges: 7, minStroke: 0.05, thicken: 1.4 },
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

/** Filtro de moda de radio r: redondea los bordes entre zonas. */
function modeFilter(L: Uint8Array, w: number, h: number, k: number, r: number) {
  const out = new Uint8Array(L);
  const cnt = new Uint16Array(k);
  const need = Math.ceil(((2 * r + 1) ** 2) / 2);
  for (let y = r; y < h - r; y++)
    for (let x = r; x < w - r; x++) {
      cnt.fill(0);
      for (let dy = -r; dy <= r; dy++) { const row = (y + dy) * w + x; for (let dx = -r; dx <= r; dx++) cnt[L[row + dx]]++; }
      let bl = L[y * w + x], bc = 0;
      for (let c = 0; c < k; c++) if (cnt[c] > bc) { bc = cnt[c]; bl = c; }
      if (bc >= need) out[y * w + x] = bl;
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

async function rawGrey(img: Sharp) {
  const { data, info } = await img.extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/**
 * Devuelve un PNG en escala de grises (contornos negros sobre blanco) con el lado mayor = outSide.
 * Las zonas quedan cerradas, que es lo que hace que una lámina se pueda colorear de verdad.
 */
export async function toLineArt(input: Buffer, style: ColoringStyle, outSide: number): Promise<Buffer> {
  const P = PARAMS[style];
  const smooth = sharp(input).rotate().resize(P.work, P.work, { fit: "inside" }).removeAlpha().normalise()
    .median(P.median).median(P.median).median(P.median);
  const { data: rgb, info } = await smooth.clone().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  let L = quantize(rgb, n, P.colors);
  for (let i = 0; i < P.modePasses; i++) L = modeFilter(L, w, h, P.colors, P.modeR);
  const minArea = Math.max(12, Math.round(n * P.minArea));
  for (let i = 0; i < 5 && mergeSmall(L, w, h, P.colors, minArea); i++);
  for (let i = 0; i < 2; i++) L = modeFilter(L, w, h, P.colors, 1);

  const out = Buffer.alloc(n, 255);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if ((x < w - 1 && L[p] !== L[p + 1]) || (y < h - 1 && L[p] !== L[p + w])) out[p] = 0;
    }

  if (P.edges) {
    const pre = await smooth.clone().greyscale().png().toBuffer();
    const [a, b] = await Promise.all([rawGrey(sharp(pre).blur(1.2)), rawGrey(sharp(pre).blur(2.6))]);
    const det = new Uint8Array(n).fill(255);
    for (let i = 0; i < n; i++) if (b.data[i] - a.data[i] > P.edges) det[i] = 0;
    dropShortStrokes(det, w, h, Math.round(Math.max(w, h) * P.minStroke));
    for (let i = 0; i < n; i++) if (det[i] === 0) out[i] = 0;
  }
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
