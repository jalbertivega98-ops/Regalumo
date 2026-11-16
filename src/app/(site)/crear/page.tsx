import type { Metadata } from "next";
import Link from "next/link";
import { getPrices } from "@/lib/settings";
import { PRODUCTS, formatEur, type ProductId } from "@/lib/products/catalog";

export const metadata: Metadata = { title: "Crear gratis", alternates: { canonical: "/crear" }, description: "Elige qué regalo quieres crear y pruébalo gratis sin registrarte." };
export const revalidate = 300;

const ICON: Record<ProductId, string> = { newspaper: "📰", escape: "🗝️", coloring: "🖍️" };

export default async function Crear() {
  const prices = await getPrices();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-5xl font-black">¿Qué quieres crear?</h1>
      <p className="mt-2 text-ink-soft">Todas las opciones se prueban gratis y sin registro. Solo pagas si quieres el archivo final.</p>
      <div className="mt-8 grid gap-4">
        {(Object.keys(PRODUCTS) as ProductId[]).map((id) => (
          <Link key={id} href={PRODUCTS[id].editorPath} className="card group flex items-center gap-5 p-6 transition hover:-translate-y-1">
            <span className="text-5xl" aria-hidden>{ICON[id]}</span>
            <span className="flex-1">
              <span className="block font-display text-2xl font-bold">{PRODUCTS[id].name}</span>
              <span className="block text-ink-soft">{PRODUCTS[id].short}</span>
              <span className="mt-1 block text-sm font-semibold">Prueba gratis · completo por {formatEur(prices[id])}</span>
            </span>
            <span aria-hidden className="text-2xl transition group-hover:translate-x-1">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
