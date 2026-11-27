import { handle, json } from "@/lib/http";
import type { EscapeInput } from "@/lib/escape/generator";
import { generateDemo } from "@/lib/escape/demo";
import { verify } from "@/lib/security/tokens";
import { HttpError } from "@/lib/projects";
import { track } from "@/lib/analytics";

/** Candado final de la demo: comprueba la combinación, da pistas o la revela. */
export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const st = verify<{ input: EscapeInput }>(body.state, "escape-demo");
  if (!st) throw new HttpError(400, "La partida ha caducado. Vuelve a generarla.");
  const demo = generateDemo(st.input);
  if (body.hint !== undefined) {
    const h = Math.min(demo.lockHints.length - 1, Math.max(0, Number(body.hint) || 0));
    return json({ hint: demo.lockHints[h] });
  }
  if (body.reveal) return json({ code: demo.code, ending: demo.ending });
  const given = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);
  const correct = given === demo.code;
  if (correct) await track("demo_complete", { product: "escape" });
  return json({ correct, ...(correct ? { ending: demo.ending } : {}) });
});
