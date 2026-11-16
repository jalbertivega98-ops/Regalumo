import { handle, json } from "@/lib/http";
import { getStore } from "@/lib/store";
import { clean } from "@/lib/security/text";
import { randomId } from "@/lib/security/tokens";
import { consume } from "@/lib/security/ratelimit";
import { HttpError } from "@/lib/projects";

/** Solicitudes de privacidad (acceso, supresión...) o de soporte: quedan pendientes en el panel. */
export const POST = handle(async (req: Request) => {
  await consume(req, "privacy-request", 5);
  const body = await req.json().catch(() => ({}));
  const email = clean(body.email, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Indica un correo válido para poder responderte.");
  const id = randomId(8);
  await getStore().put("requests", id, {
    id,
    type: ["supresion", "acceso", "soporte", "otro"].includes(body.type) ? body.type : "otro",
    email,
    message: clean(body.message, 2000),
    status: "pendiente",
    at: new Date().toISOString(),
  });
  return json({ ok: true });
});
