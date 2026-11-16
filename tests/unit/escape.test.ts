import { describe, expect, it } from "vitest";
import { caesar, checkAnswer, generateDemo, generateGame, gridContains, puzzleCount, solveMaze, AGES, DURATIONS, type Printable } from "@/lib/escape/generator";
import { FINAL_WORDS, THEME_IDS } from "@/lib/escape/themes";
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
      }
    }
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

  it("la demo tiene 3 acertijos y acepta respuestas con artículo o tildes", () => {
    const d = generateDemo({ theme: "piratas", age: "ninos" });
    expect(d.puzzles).toHaveLength(3);
    const r = d.puzzles[0];
    expect(checkAnswer(r, r.answer)).toBe(true);
    expect(checkAnswer(r, "La " + r.answer.toLowerCase())).toBe(true);
    expect(checkAnswer(r, "respuesta-incorrecta")).toBe(false);
  });
});
