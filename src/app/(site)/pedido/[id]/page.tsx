import type { Metadata } from "next";
import { OrderStatus } from "@/components/order/OrderStatus";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params;
  const { k = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <OrderStatus id={id} k={k} />
    </div>
  );
}
