import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { getStore } from "@/lib/store";
import { checkOrderToken, type Order } from "@/lib/payments/orders";
import { MockPay } from "@/components/order/MockPay";
import { formatEur } from "@/lib/products/catalog";

export const metadata: Metadata = { title: "Pago simulado", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Página de pago SIMULADO: solo existe en desarrollo (PAYMENTS_MODE=mock). */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  if (!config.mockPayments) notFound();
  const { id } = await params;
  const { k = "" } = await searchParams;
  if (!checkOrderToken(id, k)) notFound();
  const order = await getStore().get<Order>("orders", id);
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 border-4 border-dashed border-sun">
        <p className="font-bold text-coral-dark">ENTORNO DE DESARROLLO · PAGO SIMULADO</p>
        <h1 className="font-display text-2xl font-bold mt-2">Simular pago de {formatEur(order.amountCents)}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Esta pantalla sustituye a Stripe Checkout solo cuando no hay claves de Stripe configuradas. No se cobra nada. En producción esta página no existe.
        </p>
        <MockPay id={id} k={k} />
      </div>
    </div>
  );
}
