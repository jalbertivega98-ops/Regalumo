import { getStore } from "@/lib/store";
import type { Promo } from "@/lib/settings";
import { PromoForm, PromoToggle } from "@/components/admin/AdminForms";
import { Table, fmtDate } from "@/components/admin/ui";

export default async function Promociones() {
  const promos = await getStore().list<Promo>("promos", 500);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Promociones</h1>
      <PromoForm />
      <Table
        head={["Código", "Descuento", "Usos", "Caduca", "Estado", ""]}
        rows={promos.map((p) => [p.code, `${p.percentOff} %`, `${p.uses}${p.maxUses ? ` / ${p.maxUses}` : ""}`, fmtDate(p.expiresAt), p.active ? "Activo" : "Inactivo", <PromoToggle key="t" promo={p} />])}
        empty="No hay códigos promocionales."
      />
    </div>
  );
}
