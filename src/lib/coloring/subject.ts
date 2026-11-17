import path from "path";
import sharp from "sharp";

/**
 * Separa el sujeto (personas, mascotas, objetos principales) del fondo con U²-Net ligero,
 * ejecutado en nuestro propio servidor (sin APIs externas ni coste por uso).
 * Devuelve una máscara 0..255 (255 = sujeto) del tamaño pedido, o null si el modelo no está disponible.
 */
const S = 320;
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

type Ort = typeof import("onnxruntime-node");
let session: Promise<{ ort: Ort; s: import("onnxruntime-node").InferenceSession } | null> | null = null;

function load() {
  session ??= (async () => {
    try {
      const ort = await import("onnxruntime-node");
      const s = await ort.InferenceSession.create(path.join(process.cwd(), "assets/models/u2netp.onnx"), { intraOpNumThreads: 2 });
      return { ort, s };
    } catch (e) {
      console.error("[subject] modelo no disponible:", (e as Error).message);
      return null;
    }
  })();
  return session;
}

export async function subjectMask(input: Buffer, w: number, h: number): Promise<Uint8Array | null> {
  const m = await load();
  if (!m) return null;
  const { data } = await sharp(input).rotate().removeAlpha().resize(S, S, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let mx = 1;
  for (const v of data) if (v > mx) mx = v;
  const x = new Float32Array(3 * S * S);
  for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) x[c * S * S + i] = (data[i * 3 + c] / mx - MEAN[c]) / STD[c];
  const out = await m.s.run({ [m.s.inputNames[0]]: new m.ort.Tensor("float32", x, [1, 3, S, S]) });
  const d = out[m.s.outputNames[0]].data as Float32Array;
  let lo = Infinity, hi = -Infinity;
  for (const v of d) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const span = hi - lo || 1;
  const small = Buffer.alloc(S * S);
  for (let i = 0; i < S * S; i++) small[i] = Math.round(((d[i] - lo) / span) * 255);
  const big = await sharp(small, { raw: { width: S, height: S, channels: 1 } }).resize(w, h, { fit: "fill", kernel: "cubic" }).toColourspace("b-w").raw().toBuffer();
  return new Uint8Array(big.buffer, big.byteOffset, w * h);
}
