import { handle, json } from "@/lib/http";
import { login } from "@/lib/admin";
import { consume } from "@/lib/security/ratelimit";
import { HttpError } from "@/lib/projects";

export const POST = handle(async (req: Request) => {
  await consume(req, "admin-login", 10);
  const body = await req.json().catch(() => ({}));
  if (!(await login(String(body.password || "")))) throw new HttpError(401, "Contraseña incorrecta");
  return json({ ok: true });
});
