import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Icono PNG para iPhone y para los resultados de Google (el SVG ya cubre el resto). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const svg = await readFile(join(process.cwd(), "public/icon.svg"));
  return new ImageResponse(
    <img alt="" width={180} height={180} src={`data:image/svg+xml;base64,${svg.toString("base64")}`} />,
    size,
  );
}
