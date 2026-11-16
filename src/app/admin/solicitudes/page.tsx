import { getStore } from "@/lib/store";
import { RequestToggle } from "@/components/admin/AdminForms";
import { Table, fmtDate } from "@/components/admin/ui";

type Req = { id: string; type: string; email: string; message: string; status: string; at: string };

export default async function Solicitudes() {
  const reqs = (await getStore().list<Req>("requests", 500)).sort((a, b) => b.at.localeCompare(a.at));
  const feedback = (await getStore().list<{ product: string; rating: number; comment: string; at: string }>("feedback", 200)).filter((f) => f.comment);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black">Solicitudes</h1>
      <p className="hint">Solicitudes de privacidad (acceso, supresión…) y soporte. La ley da un mes para responder a las de protección de datos.</p>
      <Table head={["Fecha", "Tipo", "Correo", "Mensaje", "Estado", ""]} rows={reqs.map((r) => [fmtDate(r.at), r.type, r.email, r.message, r.status, <RequestToggle key="t" id={r.id} status={r.status} />])} empty="No hay solicitudes." />
      <h2 className="font-display text-xl font-bold">Comentarios de valoraciones</h2>
      <Table head={["Fecha", "Producto", "Nota", "Comentario"]} rows={feedback.map((f) => [fmtDate(f.at), f.product, `${f.rating}/5`, f.comment])} empty="Sin comentarios." />
    </div>
  );
}
