import { bump, track } from "@/lib/analytics";
import { isAdmin } from "@/lib/admin";
import { isProductId } from "@/lib/products/catalog";
import { pageKey } from "@/lib/pages";
import { cleanCampaign, isBot, isClientStep, isMobile, isSource } from "@/lib/traffic";

/**
 * Analítica sin cookies: solo incrementa contadores agregados por día (origen, página, paso del
 * embudo). No se guarda la IP, ni la URL de procedencia completa, ni ningún identificador.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ua = req.headers.get("user-agent");
  // Robots y el propio dueño con la sesión del panel abierta no cuentan.
  if (isBot(ua) || (await isAdmin())) return new Response(null, { status: 204 });
  const product = isProductId(body.product) ? body.product : undefined;
  const src = isSource(body.src) ? body.src : "directo";

  switch (body.event) {
    case "session": {
      const camp = cleanCampaign(body.camp);
      await bump([
        "session",
        `src:${src}`,
        `land:${pageKey(body.path)}`,
        `dev:${isMobile(ua) ? "movil" : "ordenador"}`,
        ...(camp ? [`camp:${src}|${camp}`] : []),
      ]);
      break;
    }
    case "pageview":
      await bump(["pageview", `pv:${pageKey(body.path)}`]);
      break;
    case "step": {
      // El navegador avisa una sola vez por pestaña y paso (`first`) y una vez por producto.
      if (!isClientStep(body.step)) break;
      const keys: string[] = [];
      if (body.first === true) keys.push(`f:${body.step}`, `fs:${src}:${body.step}`);
      if (product) keys.push(`f:${body.step}:${product}`);
      await bump(keys);
      break;
    }
    case "preview":
      // Versión anterior del editor (pestañas abiertas antes de actualizar).
      await track("preview", { product });
      break;
  }
  return new Response(null, { status: 204 });
}
