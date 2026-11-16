import { getStore } from "@/lib/store";
import type { OutboxEmail } from "@/lib/email/send";
import { Table, fmtDate } from "@/components/admin/ui";
import { config } from "@/lib/config";

export default async function Correos() {
  const mails = (await getStore().list<OutboxEmail>("outbox", 300)).sort((a, b) => b.at.localeCompare(a.at));
  const S: Record<string, string> = { sent: "Enviado", "pending-config": "No enviado (falta RESEND_API_KEY)", failed: "Error" };
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Correos de compra</h1>
      {!config.email.resendKey && <p className="card p-4 text-sm">El envío de correos no está configurado. Los correos se guardan aquí pero <b>no se envían</b>. Configura RESEND_API_KEY y EMAIL_FROM.</p>}
      <Table head={["Fecha", "Para", "Asunto", "Estado"]} rows={mails.map((m) => [fmtDate(m.at), m.to, m.subject, S[m.status] + (m.error ? `: ${m.error}` : "")])} empty="Sin correos." />
    </div>
  );
}
