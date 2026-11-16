import { handle, json } from "@/lib/http";
import { quote } from "@/lib/payments/orders";
import { HttpError } from "@/lib/projects";
import { config } from "@/lib/config";

export const GET = handle(async (req: Request) => {
  const u = new URL(req.url);
  const sku = u.searchParams.get("sku");
  if (!sku || !["newspaper", "escape", "coloring", "pack"].includes(sku)) throw new HttpError(400, "Producto no válido");
  const q = await quote(sku as "pack", u.searchParams.get("promo") || undefined);
  return json({ list: q.list, amount: q.amount, promo: q.promo ? { code: q.promo.code, percentOff: q.promo.percentOff } : null, emails: Boolean(config.email.resendKey) });
});
