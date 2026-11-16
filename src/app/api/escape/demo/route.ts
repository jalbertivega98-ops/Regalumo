import { handle, json } from "@/lib/http";
import { generateDemo, escapeSchema } from "@/lib/escape/generator";
import { consume } from "@/lib/security/ratelimit";
import { config } from "@/lib/config";
import { sign } from "@/lib/security/tokens";
import { HttpError } from "@/lib/projects";
import { track } from "@/lib/analytics";

/** Demo gratuita: devuelve 3 acertijos SIN soluciones; se comprueban en el servidor. */
export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const parsed = escapeSchema.safeParse(body.input ?? {});
  if (!parsed.success) throw new HttpError(400, "Revisa los datos de la aventura.");
  await consume(req, "escape-demo", config.limits.escapeDemosPerIpDay, { global: true });
  const demo = generateDemo(parsed.data);
  await track("demo_start", { product: "escape" });
  await track("free_generation", { product: "escape" });
  return json({
    state: sign({ input: parsed.data, exp: Date.now() + 6 * 3600 * 1000 }, "escape-demo"),
    title: demo.title,
    intro: demo.intro,
    themeName: demo.themeName,
    puzzles: demo.puzzles.map((p) => ({ kind: p.kind, title: p.title, chapter: p.chapter, instructions: p.instructions, printable: p.printable })),
  });
});
