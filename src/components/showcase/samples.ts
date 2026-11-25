import { generateGame } from "@/lib/escape/generator";
import type { ThemeId } from "@/lib/escape/themes";

/** Acertijo de ejemplo calculado en el servidor (determinista) para las páginas públicas. */
export function escapeSample(kind: "caesar" | "maze" | "numbers" | "wordsearch" = "numbers", theme: ThemeId = "piratas") {
  const g = generateGame({ theme, age: kind === "caesar" ? "jovenes" : "ninos", duration: 90, difficulty: "media" });
  const p = g.puzzles.find((x) => x.kind === kind) ?? g.puzzles[0];
  return { title: p.title, instructions: p.instructions, printable: p.printable, accept: p.accept, hint: p.hints[0] };
}
