import { getStore } from "@/lib/store";
import type { Order } from "@/lib/payments/orders";
import { PACK, PRODUCTS, formatEur } from "@/lib/products/catalog";
import { Table, fmtDate } from "@/components/admin/ui";

const STATUS: Record<string, string> = { paid: "Pagado", pending: "Pendiente", failed: "Fallido", refunded: "Reembolsado" };

export default async function Pedidos() {
  const orders = (await getStore().list<Order>("orders", 1000)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Pedidos</h1>
      <Table
        head={["Fecha", "Pedido", "Producto", "Importe", "Estado", "Pago", "Cliente", "Promo"]}
        rows={orders.map((o) => [
          fmtDate(o.createdAt),
          <code key="id" className="text-xs">{o.id}</code>,
          o.sku === "pack" ? PACK.name : PRODUCTS[o.sku].name,
          formatEur(o.amountCents),
          STATUS[o.status] ?? o.status,
          o.provider === "mock" ? "Simulado" : o.livemode ? "Stripe real" : "Stripe prueba",
          o.email ?? "—",
          o.promoCode ?? "—",
        ])}
        empty="Todavía no hay pedidos."
      />
    </div>
  );
}
