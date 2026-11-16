import sharp from "sharp";
import { getFiles } from "./store";
import { normalizePhoto } from "./coloring/lineart";
import { randomId } from "./security/tokens";

/** Fotos privadas de un proyecto: projects/<id>/photo-<pid>.jpg (nunca públicas ni indexables). */
export const photoKey = (projectId: string, photoId: string) => `projects/${projectId}/photo-${photoId}.jpg`;

export async function storePhoto(projectId: string, raw: Buffer) {
  const data = await normalizePhoto(raw);
  const id = randomId(6);
  await getFiles().put(photoKey(projectId, id), data, "image/jpeg");
  return id;
}

export async function loadPhoto(projectId: string, photoId: string) {
  if (!/^[A-Za-z0-9_-]{4,20}$/.test(photoId)) return null;
  return (await getFiles().get(photoKey(projectId, photoId)))?.data ?? null;
}

export async function thumbnail(buf: Buffer, side = 900) {
  return sharp(buf).resize(side, side, { fit: "inside" }).jpeg({ quality: 78 }).toBuffer();
}

/** Variante de color para las plantillas del periódico. */
export async function tone(buf: Buffer, mode: "grayscale" | "color" | "sepia") {
  if (mode === "color") return buf;
  const img = sharp(buf).greyscale();
  if (mode === "sepia") return img.tint({ r: 112, g: 66, b: 20 }).modulate({ brightness: 1.05 }).jpeg({ quality: 88 }).toBuffer();
  return img.linear(1.08, -6).jpeg({ quality: 88 }).toBuffer();
}
