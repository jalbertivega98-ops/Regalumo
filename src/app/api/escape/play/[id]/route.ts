import { handle, json } from "@/lib/http";
import { getStore } from "@/lib/store";
import { HttpError, type Project } from "@/lib/projects";
import { checkAnswer, generateGame } from "@/lib/escape/generator";
import { checkPlayKey, publicPlayState } from "@/lib/escape/play";
import { clean, normalizeAnswer } from "@/lib/security/text";

type Ctx = { params: Promise<{ id: string }> };

/** Panel de juego en el móvil: estado público, comprobar respuestas, pistas y palabra final. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!checkPlayKey(id, String(body.k || ""))) throw new HttpError(403, "Enlace no válido");
  const project = await getStore().get<Project>("projects", id);
  if (!project || project.product !== "escape" || project.status !== "paid") throw new HttpError(404, "Juego no encontrado");
  const g = generateGame(project.data);
  const n = g.puzzles.length;

  switch (body.action) {
    case "state":
      return json(publicPlayState(g));
    case "check": {
      const i = Number(body.index);
      const p = g.puzzles[i];
      if (!p) throw new HttpError(400, "Acertijo no válido");
      const correct = checkAnswer(p, clean(body.answer, 60));
      return json(correct ? { correct, reward: p.reward, solution: p.solution } : { correct });
    }
    case "hint": {
      const i = Number(body.index);
      const p = g.puzzles[i];
      if (!p) throw new HttpError(400, "Acertijo no válido");
      const h = Math.min(1, Math.max(0, Number(body.hint) || 0));
      return json({ hint: p.hints[h] });
    }
    case "final": {
      const correct = normalizeAnswer(clean(body.answer, 40)).toUpperCase() === g.finalWord;
      return json(correct ? { correct, finalWord: g.finalWord, ending: g.ending } : { correct, n });
    }
    default:
      throw new HttpError(400, "Acción no válida");
  }
});
