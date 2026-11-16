import { handle, json } from "@/lib/http";
import { checkAnswer, generateDemo, type EscapeInput } from "@/lib/escape/generator";
import { verify } from "@/lib/security/tokens";
import { HttpError } from "@/lib/projects";
import { clean } from "@/lib/security/text";
import { track } from "@/lib/analytics";

/** Comprueba una respuesta o entrega una pista de la demo. */
export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const st = verify<{ input: EscapeInput }>(body.state, "escape-demo");
  if (!st) throw new HttpError(400, "La partida ha caducado. Vuelve a generarla.");
  const demo = generateDemo(st.input);
  const i = Number(body.index);
  const p = demo.puzzles[i];
  if (!p) throw new HttpError(400, "Acertijo no válido");
  if (body.hint !== undefined) {
    const h = Math.min(1, Math.max(0, Number(body.hint) || 0));
    return json({ hint: p.hints[h] });
  }
  if (body.reveal) return json({ answer: p.answer, solution: p.solution });
  const correct = checkAnswer(p, clean(body.answer, 60));
  const last = i === demo.puzzles.length - 1;
  if (correct && last) await track("demo_complete", { product: "escape" });
  return json({ correct, ...(correct ? { solution: p.solution, ending: last ? demo.ending : undefined } : {}) });
});
