import { handle, json } from "@/lib/http";
import { escapeSchema } from "@/lib/escape/generator";
import { generateDemo, publicDemo } from "@/lib/escape/demo";
import { consume } from "@/lib/security/ratelimit";
import { config } from "@/lib/config";
import { sign } from "@/lib/security/tokens";
import { HttpError } from "@/lib/projects";
import { track } from "@/lib/analytics";

/** Demo gratuita: 3 retos interactivos. La combinación del candado final se comprueba en el servidor. */
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
    ...publicDemo(demo),
  });
});
