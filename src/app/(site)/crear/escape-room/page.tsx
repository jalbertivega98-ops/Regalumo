import type { Metadata } from "next";
import { Suspense } from "react";
import { EscapeEditor } from "@/components/escape/EscapeEditor";
import { EscapeSales } from "@/components/showcase/EscapeSales";
import { getPrices } from "@/lib/settings";
import { formatEur } from "@/lib/products/catalog";

export const metadata: Metadata = {
  title: "Crea tu escape room personalizado gratis",
  robots: { index: false, follow: true },
  alternates: { canonical: "/escape-room-personalizado" },
};

export const revalidate = 300;

export default async function Page() {
  const prices = await getPrices();
  return (
    <Suspense fallback={<p className="p-10 text-center">Cargando…</p>}>
      <EscapeEditor />
      <EscapeSales compact href="#top" price={formatEur(prices.escape)} />
    </Suspense>
  );
}
