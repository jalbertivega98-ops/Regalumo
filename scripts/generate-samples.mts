/**
 * Genera las imágenes de ejemplo de la web (antes/después) con el mismo algoritmo
 * que usa el producto. Uso: npx tsx scripts/generate-samples.mts
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import sharp from "sharp";
import { toLineArt } from "../src/lib/coloring/lineart";

mkdirSync("public/samples", { recursive: true });
for (const name of ["chelsea", "coffee"]) {
  const src = readFileSync(`assets/samples/${name}.png`);
  await sharp(src).resize(900, 900, { fit: "inside" }).webp({ quality: 82 }).toFile(`public/samples/${name}.webp`);
  for (const style of ["infantil", "sencillo", "detallado"] as const) {
    const png = await toLineArt(src, style, 900);
    writeFileSync(`public/samples/${name}-${style}.png`, png);
    await sharp(png).webp({ quality: 85 }).toFile(`public/samples/${name}-${style}.webp`);
  }
}
console.log("ok");
