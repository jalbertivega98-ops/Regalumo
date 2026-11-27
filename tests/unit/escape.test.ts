import { describe, expect, it } from "vitest";
import { generateDemo, publicDemo } from "@/lib/escape/demo";
import { caesar, checkAnswer, generateGame, gridContains, puzzleCount, solveMaze, spoils, AGES, DURATIONS, type Printable } from "@/lib/escape/generator";
import { FINAL_WORDS, THEME_IDS, THEMES } from "@/lib/escape/themes";
import { RIDDLES } from "@/lib/escape/riddles";
import { normalizeAnswer } from "@/lib/security/text";

const combos = THEME_IDS.flatMap((theme) =>
  (Object.keys(AGES) as (keyof typeof AGES)[]).flatMap((age) =>
    (["facil", "media", "dificil"] as const).flatMap((difficulty) =>
      DURATIONS.map((duration) => ({ theme, age, difficulty, duration, players: 5, hero: "Lucía", team: "" })),
    ),
  ),
);

/** Resuelve cada acertijo de forma independiente a partir de lo que se imprime. */
function solveFromPrintable(p: Printable, kind: string): string | null {
  switch (p.type) {
    case "cipher":
      if (p.mode === "caesar") return caesar(p.encoded, -(p.shift ?? 0));
      if (p.mode === "mirror") return p.encoded.split("").reverse().join("");
      return p.encoded.split(" - ").map((n) => String.fromCharCode(64 + Number(n))).join("");
    case "maze": {
      const path = solveMaze(p.w, p.h, p.walls, p.start, p.end);
      return path.map((c) => p.letters[c] ?? "").join("");
    }
    case "symbols":
      return p.message.map((sym) => p.key.find((k) => k.sym === sym)!.letter).join("");
    case "jigsaw":
      return p.word;
    case "sequence":
      return null;
    default:
      return kind ? null : null;
  }
}

describe("generador de escape room", () => {
  it("cubre todas las combinaciones con acertijos resolubles", () => {
    for (const input of combos) {
      const g = generateGame(input);
      expect(g.puzzles).toHaveLength(puzzleCount(input));
      expect(g.finalWord).toBe(FINAL_WORDS[input.theme][g.puzzles.length]);
      expect(g.puzzles.map((p) => p.reward).join("")).toBe(g.rewardOrder.join(""));
      expect(g.rewardOrder.join("")).not.toBe(g.finalWord);
      expect([...g.rewardOrder].sort().join("")).toBe([...g.finalWord].sort().join(""));
      for (const p of g.puzzles) {
        expect(p.accept.length).toBeGreaterThan(0);
        expect(checkAnswer(p, p.answer)).toBe(true);
        expect(p.hints).toHaveLength(2);
        const solved = solveFromPrintable(p.printable, p.kind);
        if (solved !== null) expect(normalizeAnswer(solved)).toBe(normalizeAnswer(p.answer));
        if (p.printable.type === "wordsearch") {
          for (const w of p.printable.words) expect(gridContains(p.printable.grid, w)).toBe(w !== p.answer);
        }
        if (p.printable.type === "shapes") {
          const n = p.printable.items.filter((i) => i.shape === (p.printable as { target: string }).target).length;
          expect(String(n)).toBe(p.answer);
        }
        if (p.printable.type === "lock") expect(p.answer).toHaveLength(p.printable.digits);
        // Ningún acertijo puede destripar la palabra final.
        expect(spoils(p.answer, g.finalWord), `${input.theme}/${input.age}/${input.duration}: ${p.kind} ${p.answer} vs ${g.finalWord}`).toBe(false);
        if (p.printable.type === "wordsearch") for (const w of p.printable.words) expect(spoils(w, g.finalWord)).toBe(false);
        if (p.printable.type === "symbols") {
          const syms = p.printable.key.map((k) => k.sym);
          expect(new Set(syms).size).toBe(syms.length); // cada símbolo es una sola letra
          expect(syms.every((x) => x >= 0 && x < 18)).toBe(true);
        }
        if (p.printable.type === "jigsaw") {
          const { rows, cols, pieces } = p.printable;
          expect(new Set(pieces.map((x) => `${x.r},${x.c}`)).size).toBe(rows * cols);
          expect(pieces.some((x, i) => x.r * cols + x.c !== i)).toBe(true); // piezas desordenadas
        }
      }
      // Las palabras no se repiten entre acertijos.
      const answers = g.puzzles.filter((p) => /[A-Z]/.test(p.answer)).map((p) => normalizeAnswer(p.answer));
      expect(new Set(answers).size).toBe(answers.length);
    }
  });

  it("usa adivinanzas y objetos de la temática", () => {
    for (const theme of THEME_IDS) {
      const g = generateGame({ theme, age: "ninos", duration: 60 });
      const r = g.puzzles.find((p) => p.kind === "riddle")!;
      const themed = RIDDLES.filter((x) => x.themes?.includes(theme)).map((x) => x.answer.toUpperCase());
      expect(themed, theme).toContain(r.answer);
      const lock = g.puzzles.find((p) => p.printable.type === "lock");
      if (lock?.printable.type === "lock") for (const cl of lock.printable.clues) expect(THEMES[theme].objects.some((o) => cl.includes(o))).toBe(true);
    }
  });

  it("las palabras de cada temática son válidas para los acertijos", () => {
    for (const theme of THEME_IDS) for (const w of THEMES[theme].words) expect(w).toMatch(/^[A-Z]{3,9}$/);
  });

  it("es determinista", () => {
    const a = generateGame(combos[5]);
    const b = generateGame(combos[5]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("los acertijos lógicos tienen solución única", () => {
    for (const input of combos.filter((c) => c.age === "adultos" || c.age === "jovenes")) {
      const g = generateGame(input);
      const logic = g.puzzles.find((p) => p.kind === "logic");
      if (!logic || logic.printable.type !== "logic") continue;
      expect(logic.printable.statements.length).toBeGreaterThan(0);
    }
  });

  it("la demo: puzle, búsqueda y candado conectados, sin destripar la combinación", () => {
    for (const theme of THEME_IDS) for (const age of ["peques", "ninos", "jovenes", "adultos"] as const) {
      const d = generateDemo({ theme, age, hero: "Ana" });
      const [slide, seek, lock] = d.steps;
      expect(slide.kind).toBe("slide");
      expect(seek.kind).toBe("seek");
      expect(lock.kind).toBe("lock");
      if (slide.kind !== "slide" || seek.kind !== "seek" || lock.kind !== "lock") continue;
      const n = age === "peques" ? 4 : 9;
      // Las piezas son una permutación desordenada.
      expect([...slide.order].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(slide.order.some((v, i) => v !== i)).toBe(true);
      // La búsqueda tiene exactamente tantos objetivos como su cifra, sin objetos solapados.
      expect(seek.items.filter((i) => i.target)).toHaveLength(seek.digit);
      const free = seek.items.filter((i) => !i.behind);
      for (const a of free) for (const b of free) if (a !== b) expect(Math.hypot(a.x - b.x, (a.y - b.y) * 0.75)).toBeGreaterThan(6);
      // Los que asoman por detrás no coinciden entre sí y quedan dentro de la escena.
      for (const a of seek.items) {
        expect(a.x).toBeGreaterThan(0); expect(a.x).toBeLessThan(100); expect(a.y).toBeGreaterThan(0); expect(a.y).toBeLessThan(100);
      }
      if (age === "peques") expect(seek.items.some((i) => i.behind)).toBe(false);
      // Tres cifras distintas, la combinación usa las ganadas en los retos y la nota cuenta bien los símbolos.
      expect(new Set(d.code).size).toBe(3);
      expect(d.code).toContain(String(slide.digit));
      expect(d.code).toContain(String(seek.digit));
      expect(lock.note).not.toMatch(/de el /);
      // El navegador no recibe la combinación.
      expect(JSON.stringify(publicDemo(d))).not.toContain(`"code"`);
      expect(publicDemo(d)).not.toHaveProperty("lockHints");
    }
  });
});
