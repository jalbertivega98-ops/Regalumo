import { handle, json } from "@/lib/http";
import { config } from "@/lib/config";
import { getStore } from "@/lib/store";
import { HttpError } from "@/lib/projects";
import { consume, LimitError, today } from "@/lib/security/ratelimit";
import { sendEmail } from "@/lib/email/send";
import { customerKey, isEmail, magicLinkEmail, myOrdersUrl, normalizeEmail, ordersForCustomer } from "@/lib/customers";

/** Correos de "Mis pedidos" por dirección y día (evita usar la web para llenar el buzón de alguien). */
const PER_EMAIL_DAY = 3;

/**
 * Pide el enlace mágico de "Mis pedidos". La respuesta es siempre la misma
 * para no revelar si un correo ha comprado o no.
 */
export const POST = handle(async (req: Request) => {
  if (!config.email.resendKey) throw new HttpError(503, `Todavía no podemos enviar correos. Escríbenos a ${config.contactEmail} con el correo con el que pagaste.`);
  await consume(req, "my-orders", 8);
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  if (!isEmail(email)) throw new HttpError(400, "Escribe un correo válido.");

  const key = customerKey(email);
  const sent = await getStore().incr(`rl:${today()}:my-orders-email:${key}`);
  if (sent > PER_EMAIL_DAY) throw new LimitError("Ya te hemos enviado varios enlaces hoy. Revisa tu bandeja de entrada y la carpeta de spam.");

  const orders = await ordersForCustomer(key);
  if (orders.length) await sendEmail(email, "Tus pedidos de REGALUMO", magicLinkEmail(myOrdersUrl(email)));
  return json({ ok: true });
});
