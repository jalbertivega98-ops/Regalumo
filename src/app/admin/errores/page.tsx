import { getStore } from "@/lib/store";
import type { ErrorLog } from "@/lib/errors";
import { Table, fmtDate } from "@/components/admin/ui";

export default async function Errores() {
  const errors = (await getStore().list<ErrorLog>("errors", 300)).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Errores</h1>
      <Table head={["Fecha", "Dónde", "Mensaje"]} rows={errors.map((e) => [fmtDate(e.at), <code key="w" className="text-xs">{e.where}</code>, e.message])} empty="Sin errores registrados. 🎉" />
    </div>
  );
}
