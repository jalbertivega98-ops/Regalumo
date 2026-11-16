import { getStore } from "@/lib/store";
import type { Order } from "@/lib/payments/orders";
import { formatEur } from "@/lib/products/catalog";
import { Table, fmtDate } from "@/components/admin/ui";

/** No hay cuentas de usuario: los clientes se agrupan por el correo de sus pedidos pagados. */
export default async function Clientes() {
  const orders = (await getStore().list<Order>("orders", 5000)).filter((o) => o.status === "paid" && o.email);
  const map = new Map<string, { orders: number; total: number; last: string }>();
  for (const o of orders) {
    const c = map.get(o.email!) ?? { orders: 0, total: 0, last: "" };
    c.orders++;
    c.total += o.amountCents;
    if ((o.paidAt ?? "") > c.last) c.last = o.paidAt ?? "";
    map.set(o.email!, c);
  }
  const rows = [...map.entries()].sort((a, b) => b[1].last.localeCompare(a[1].last));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Clientes</h1>
      <p className="hint">REGALUMO no obliga a registrarse. Aquí aparecen las personas que han comprado y dejado su correo. Trátalos como datos personales.</p>
      <Table head={["Correo", "Pedidos", "Total", "Último pedido"]} rows={rows.map(([e, c]) => [e, c.orders, formatEur(c.total), fmtDate(c.last)])} empty="Todavía no hay clientes." />
    </div>
  );
}
