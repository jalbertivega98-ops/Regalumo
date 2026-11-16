import { getFiles, getStore, storageDriver } from "@/lib/store";
import { paymentsMode } from "@/lib/payments/orders";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Diagnóstico de configuración (sin secretos): ayuda a detectar fallos de Supabase o Stripe. */
export async function GET() {
  const checks: Record<string, string> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      checks[name] = "ok";
    } catch (e) {
      checks[name] = "ERROR: " + (e instanceof Error ? e.message : String(e)).slice(0, 200);
    }
  };
  checks.driver = storageDriver();
  checks.supabaseUrl = config.supabase.url ? (/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabase.url) ? "formato ok" : "formato raro: debe ser https://xxxx.supabase.co") : "falta";
  checks.supabaseKey = config.supabase.serviceKey ? "definida" : "falta";
  await step("tabla documents", () => getStore().get("projects", "__health__"));
  await step("contador (increment_counter)", () => getStore().incr("health:check"));
  await step("escritura", () => getStore().put("settings", "__health__", { at: new Date().toISOString() }));
  await step("bucket de fotos", async () => {
    await getFiles().put("health/check.txt", Buffer.from("ok"), "text/plain");
    await getFiles().del("health/check.txt");
  });
  checks.pagos = paymentsMode();
  // Solo el tipo de clave (p. ej. "sk_live" o "rk_test"), nunca la clave.
  checks.tipoClaveStripe = config.stripe.secretKey ? (config.stripe.secretKey.match(/^[a-z]{2}_(live|test)/)?.[0] ?? "formato no reconocido") : "falta";
  checks.webhookSecret = config.stripe.webhookSecret ? (config.stripe.webhookSecret.startsWith("whsec_") ? "definido" : "formato no reconocido") : "falta";
  checks.cobrosRealesPermitidos = config.stripe.allowLive ? "sí" : "no";
  checks.appSecret = process.env.APP_SECRET ? "definido" : "falta";
  return Response.json(checks, { headers: { "Cache-Control": "no-store" } });
}
