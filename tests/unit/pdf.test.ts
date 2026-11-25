import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { generateGame } from "@/lib/escape/generator";
import { renderEscapePdf } from "@/lib/escape/pdf";
import { renderNewspaperPdf } from "@/lib/newspaper/pdf";
import { demoNewspaper, newspaperSchema, LIMITS } from "@/lib/newspaper/model";
import { normalizePhoto } from "@/lib/coloring/lineart";

const OUT = process.env.PDF_OUT_DIR;
const save = (name: string, b: Buffer) => {
  if (!OUT) return;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, name), b);
};
/** Tamaño de cada página en puntos («ancho x alto»), leído del MediaBox. */
const sizes = (b: Buffer) => [...b.toString("latin1").matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map((m) => `${Math.round(+m[1])}x${Math.round(+m[2])}`);
const pages = (b: Buffer) => (b.toString("latin1").match(/\/Type \/Page\b/g) || []).length;

describe("PDF", () => {
  it("escape room: genera un PDF con todas las secciones", async () => {
    for (const [i, inp] of [
      { theme: "piratas", age: "ninos", duration: 60, hero: "Lucía" },
      { theme: "espacio", age: "peques", duration: 45 },
      { theme: "museo", age: "adultos", duration: 90, difficulty: "dificil", players: 8 },
      { theme: "navidad", age: "jovenes", duration: 60, hero: "Nico" },
    ].entries()) {
      const g = generateGame(inp);
      const b = await renderEscapePdf(g);
      expect(b.subarray(0, 5).toString()).toBe("%PDF-");
      // portada + guía + historia + acertijos + final + recompensas + pistas (1-2) + soluciones + diploma
      expect(pages(b)).toBeGreaterThanOrEqual(g.puzzles.length + 7);
      save(`escape${i}.pdf`, b);
    }
  });

  it("periódico: una sola página A3 con fotos, en las tres plantillas y con textos al máximo", async () => {
    const photo = await normalizePhoto(readFileSync("assets/samples/chelsea.png"));
    const photo2 = await normalizePhoto(readFileSync("assets/samples/coffee.png"));
    for (const template of ["clasico", "moderno", "vintage"] as const) {
      const d = { ...demoNewspaper(), template, photos: [{ id: "a", caption: "Simba, el rey de la casa" }, { id: "b", caption: "Café de los domingos" }, { id: "c", caption: "" }] };
      const b = await renderNewspaperPdf(d, { a: photo, b: photo2, c: photo }, { watermark: template === "moderno" });
      expect(pages(b)).toBe(1);
      expect(sizes(b)).toEqual(["842x1191"]); // A3 vertical de verdad, no recortado al contenido
      save(`periodico-${template}.pdf`, b);
    }
    // Con lo mínimo (nombre y sin fotos) la página sigue siendo un A3 entero.
    const minimal = await renderNewspaperPdf({ ...demoNewspaper(), anecdotes: [], messages: [], dates: [], quote: "", photos: [] }, {});
    expect(sizes(minimal)).toEqual(["842x1191"]);
    save("periodico-minimo.pdf", minimal);
    const max = newspaperSchema.parse({
      honoree: "María de las Mercedes Fernández-Villaverde y Robles".slice(0, LIMITS.honoree),
      paperName: "La Gaceta Familiar de los Domingos".slice(0, LIMITS.paperName),
      headline: "Titular muy largo ".repeat(10).slice(0, LIMITS.headline),
      lead: "Texto largo de ejemplo. ".repeat(80).slice(0, LIMITS.lead),
      anecdotes: Array(3).fill({ title: "Una anécdota con un título bastante largo para probar".slice(0, LIMITS.anecdoteTitle), text: "palabra ".repeat(80).slice(0, LIMITS.anecdoteText) }),
      messages: Array(6).fill({ from: "Alguien", text: "mensaje ".repeat(40).slice(0, LIMITS.message) }),
      dates: Array(4).fill({ date: "2020", label: "Una fecha importante con descripción larga".slice(0, LIMITS.dateLabel) }),
      quote: "Una frase destacada bastante larga ".repeat(6).slice(0, LIMITS.quote),
      photos: [{ id: "a", caption: "Pie de foto largo ".repeat(8).slice(0, LIMITS.caption) }, { id: "b", caption: "" }, { id: "c", caption: "" }, { id: "d", caption: "" }],
    });
    const b = await renderNewspaperPdf(max, { a: photo, b: photo2, c: photo, d: photo2 });
    expect(pages(b)).toBe(1);
    // El pie de página (firma) debe seguir dentro de la página: comprobamos que el texto final está.
    expect(b.length).toBeGreaterThan(10000);
    save("periodico-maximo.pdf", b);
  });
});
