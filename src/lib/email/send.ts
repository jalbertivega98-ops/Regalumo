import { config } from "../config";
import { getStore } from "../store";
import { randomId } from "../security/tokens";

export interface OutboxEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  status: "sent" | "pending-config" | "failed";
  at: string;
  error?: string;
}

/**
 * Envía un correo transaccional con Resend (si RESEND_API_KEY está configurada).
 * Sin clave, el correo queda en la bandeja de salida del panel ("pending-config"):
 * no se finge que se ha enviado.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  const id = randomId(8);
  const record: OutboxEmail = { id, to, subject, html, status: "pending-config", at: new Date().toISOString() };
  if (config.email.resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.email.resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: config.email.from, to, subject, html }),
      });
      record.status = res.ok ? "sent" : "failed";
      if (!res.ok) record.error = (await res.text()).slice(0, 300);
    } catch (e) {
      record.status = "failed";
      record.error = String(e).slice(0, 300);
    }
  }
  await getStore().put("outbox", id, record);
  return record;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function purchaseEmail(opts: { orderUrl: string; items: string[]; total: string }) {
  return `<!doctype html><html><body style="margin:0;background:#FFF8EF;font-family:Arial,sans-serif;color:#1E1633">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="font-size:22px;font-weight:800;margin:0 0 4px">REGALUMO</p>
    <p style="color:#5E5873;margin:0 0 24px">Crea algo único. Sorprende a alguien especial.</p>
    <h1 style="font-size:24px;margin:0 0 12px">¡Gracias por tu compra!</h1>
    <p>Tu pedido está confirmado: ${opts.items.map(esc).join(", ")}. Total: <strong>${esc(opts.total)}</strong>.</p>
    <p>Puedes descargar tus archivos desde este enlace privado (no lo compartas):</p>
    <p style="margin:24px 0"><a href="${esc(opts.orderUrl)}" style="background:#FF6B4A;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700">Descargar mis regalos</a></p>
    <p style="font-size:13px;color:#5E5873">El enlace funciona durante 30 días. Si tienes cualquier problema, responde a este correo.</p>
  </div></body></html>`;
}
