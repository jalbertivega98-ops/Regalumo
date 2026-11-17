import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import sharp from "sharp";
import { toLineArt, watermark } from "@/lib/coloring/lineart";
import { subjectMask } from "@/lib/coloring/subject";

const coffee = readFileSync("assets/samples/coffee.png");

async function stats(png: Buffer) {
  const { data, info } = await sharp(png).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  let white = 0, ink = 0;
  for (const v of data) { if (v === 255) white++; if (v < 64) ink++; }
  return { w: info.width, h: info.height, white: white / data.length, ink: ink / data.length };
}

describe("láminas para colorear", () => {
  it("el modelo propio separa el sujeto (la taza) del fondo", async () => {
    const m = await subjectMask(coffee, 200, 150);
    expect(m).not.toBeNull();
    let fg = 0;
    for (const v of m!) if (v > 128) fg++;
    const r = fg / m!.length;
    expect(r).toBeGreaterThan(0.15);
    expect(r).toBeLessThan(0.85);
    // el centro de la foto es la taza; la esquina superior izquierda, la mesa
    expect(m![75 * 200 + 100]).toBeGreaterThan(128);
    expect(m![5 * 200 + 5]).toBeLessThan(128);
  });

  it("los tres estilos dan líneas negras sobre papel blanco puro, con el tamaño pedido", async () => {
    const ink: Record<string, number> = {};
    for (const s of ["infantil", "sencillo", "detallado"] as const) {
      const st = await stats(await toLineArt(coffee, s, 1200));
      expect(Math.max(st.w, st.h)).toBe(1200);
      expect(st.white).toBeGreaterThan(0.75);
      expect(st.ink).toBeGreaterThan(0.01);
      ink[s] = st.ink;
    }
    // cada estilo da un resultado distinto (Infantil: trazo grueso; Detallado: más fino)
    expect(new Set(Object.values(ink)).size).toBe(3);
  });

  it("la muestra lleva la marca de agua", async () => {
    const png = await toLineArt(coffee, "sencillo", 700);
    const wm = await watermark(png);
    const { data } = await sharp(wm).raw().toBuffer({ resolveWithObject: true });
    let coral = 0;
    for (let i = 0; i < data.length; i += 3) if (data[i] > 200 && data[i + 1] < 220 && data[i + 2] < 210 && data[i] - data[i + 2] > 30) coral++;
    expect(coral).toBeGreaterThan(500);
  });
});

import { maskToPaths } from "@/lib/coloring/vector";

describe("trazos vectoriales", () => {
  it("una línea gruesa en cruz da trazos continuos y descarta una mota suelta", () => {
    const w = 120, h = 120, m = new Uint8Array(w * h).fill(255);
    for (let y = 20; y < 100; y++) for (let x = 57; x < 63; x++) m[y * w + x] = 0; // vertical
    for (let x = 20; x < 100; x++) for (let y = 57; y < 63; y++) m[y * w + x] = 0; // horizontal
    for (let y = 10; y < 13; y++) for (let x = 10; x < 13; x++) m[y * w + x] = 0; // mota
    const paths = maskToPaths(m, w, h, 1, 10);
    // los cuatro brazos se unen de dos en dos a través del cruce
    expect(paths.length).toBe(2);
    for (const d of paths) expect(d).toMatch(/^M[\d.]+ [\d.]+C/);
  });
});
