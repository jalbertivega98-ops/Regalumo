import { handle, json } from "@/lib/http";
import { HttpError, loadOwned, tokenFrom } from "@/lib/projects";
import { startCheckout } from "@/lib/payments/orders";
import { clean } from "@/lib/security/text";

export const POST = handle(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const project = await loadOwned(String(body.projectId || ""), tokenFrom(req));
  const sku = body.sku === "pack" ? "pack" : project.product;
  const email = clean(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "El correo electrónico no es válido.");
  const r = await startCheckout({ project, sku, promoCode: clean(body.promo, 24) || undefined, email: email || undefined, consent: body.consent === true });
  return json(r);
});
