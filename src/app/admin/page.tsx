import { getStore } from "@/lib/store";
import { statsSince } from "@/lib/analytics";
import { PRODUCTS, PRODUCT_IDS, formatEur } from "@/lib/products/catalog";
import type { Order } from "@/lib/payments/orders";
import type { ErrorLog } from "@/lib/errors";
import { Stat, Table } from "@/components/admin/ui";
import { config } from "@/lib/config";

function daysAgo(days: number) {
  return Date.now() - days * 86400000;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const days = Math.min(365, Math.max(1, Number((await searchParams).dias) || 30));
  const store = getStore();
  const [orders, { totals }, errors, requests] = await Promise.all([
    store.list<Order>("orders", 5000),
    statsSince(days),
    store.list<ErrorLog>("errors", 200),
    store.list<{ status: string }>("requests", 500),
  ]);
  const since = daysAgo(days);
  const paid = orders.filter((o) => o.status === "paid" && Date.parse(o.paidAt ?? o.createdAt) >= since);
  const real = paid.filter((o) => o.provider === "stripe" && o.livemode);
  const test = paid.filter((o) => !(o.provider === "stripe" && o.livemode));
  const revenue = (list: Order[]) => list.reduce((s, o) => s + o.amountCents, 0);
  const sessions = totals["session"] ?? 0;
  const conv = sessions ? ((paid.length / sessions) * 100).toFixed(2) + " %" : "—";
  const stripeFees = (list: Order[]) => list.reduce((s, o) => s + Math.round(o.amountCents * 0.015 + 25), 0);
  const genCostEur = PRODUCT_IDS.reduce((s, p) => s + (totals[`free_generation:${p}`] ?? 0) * PRODUCTS[p].estimatedCostEur, 0) + paid.length * 0.01;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-black">Resumen de los últimos {days} días</h1>
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <a key={d} href={`/admin?dias=${d}`} className={`chip ${d === days ? "!bg-ink !text-white" : ""}`}>{d} días</a>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Ventas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Ventas reales" value={formatEur(revenue(real))} note={`${real.length} pedidos cobrados en modo real`} />
          <Stat label="Pedidos de prueba" value={test.length} note={`${formatEur(revenue(test))} simulados o en modo test (no es dinero real)`} />
          <Stat label="Conversión" value={conv} note={`${paid.length} compras / ${sessions} sesiones`} />
          <Stat label="Comisiones Stripe estimadas" value={formatEur(stripeFees(real))} note="1,5 % + 0,25 € por pago (tarjetas UE)" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Embudo y pruebas gratuitas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Sesiones" value={sessions} />
          <Stat label="Páginas vistas" value={totals["pageview"] ?? 0} />
          <Stat label="Pruebas iniciadas" value={totals["demo_start"] ?? 0} />
          <Stat label="Pagos iniciados" value={totals["checkout_start"] ?? 0} />
        </div>
        <div className="mt-3">
          <Table
            head={["Producto", "Pruebas", "Fotos subidas", "Generaciones gratis", "Pagos iniciados", "Compras", "Coste gen. estimado"]}
            rows={[...PRODUCT_IDS, "pack" as const].map((p) => [
              p === "pack" ? "Pack 3 regalos" : PRODUCTS[p].name,
              totals[`demo_start:${p}`] ?? 0,
              totals[`upload:${p}`] ?? 0,
              totals[`free_generation:${p}`] ?? 0,
              totals[`checkout_start:${p}`] ?? 0,
              totals[`purchase:${p}`] ?? 0,
              p === "pack" ? "—" : `${((totals[`free_generation:${p}`] ?? 0) * PRODUCTS[p].estimatedCostEur).toFixed(3)} €`,
            ])}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Coste variable de generación" value={`${genCostEur.toFixed(2)} €`} note={`Estimación de CPU. Tope diario configurado para pruebas: ${config.limits.maxFreeCostEurDay} €`} />
        <Stat label="Errores registrados" value={errors.length} note="Últimos 200" />
        <Stat label="Solicitudes pendientes" value={requests.filter((r) => r.status !== "resuelta").length} />
      </section>
    </div>
  );
}
