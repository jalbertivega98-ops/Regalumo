import { handle, json } from "@/lib/http";
import { requireAdmin } from "@/lib/admin";
import { setPrices } from "@/lib/settings";

export const PUT = handle(async (req: Request) => {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  return json({ prices: await setPrices(body) });
});
