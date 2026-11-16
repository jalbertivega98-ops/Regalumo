import { track } from "@/lib/analytics";
import { isProductId } from "@/lib/products/catalog";

const ALLOWED = new Set(["pageview", "session", "preview"]);

/** Analítica sin cookies: solo incrementa contadores agregados. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (ALLOWED.has(body.event)) {
    await track(body.event, { product: isProductId(body.product) ? body.product : undefined });
  }
  return new Response(null, { status: 204 });
}
