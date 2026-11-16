import type { Metadata } from "next";
import Link from "next/link";
import { getPrices } from "@/lib/settings";
import { PRODUCTS, formatEur, type ProductId } from "@/lib/products/catalog";

export const metadata: Metadata = { title: "Crear gratis", alternates: { canonical: "/crear" }, description: "Elige qué regalo quieres crear y pruébalo gratis sin registrarte." };
export const revalidate = 300;

const ICON: Record<ProductId, { i: string; bg: string; tag: string }> = {
  newspaper: { i: "📰", bg: "bg-coral/15", tag: "Cumpleaños, bodas, jubilaciones" },
  escape: { i: "🗝️", bg: "bg-violet/15", tag: "De 5 años a adultos" },
  coloring: { i: "🖍️", bg: "bg-mint/15", tag: "Con tus propias fotos" },
};

export default async function Crear() {
  const prices = await getPrices();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-coral">Paso 1 de 4</p>
      <h1 className="mt-1 font-display text-5xl font-black lg:text-6xl">¿Qué quieres crear?</h1>
      <p className="mt-2 text-ink-soft">Todas las opciones se prueban gratis y sin registro. Solo pagas si quieres el archivo final.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
        {(Object.keys(PRODUCTS) as ProductId[]).map((id) => (
          <Link key={id} href={PRODUCTS[id].editorPath} className="lift card group flex items-center gap-5 p-5 animate-rise md:flex-col md:items-start md:p-7">
            <span className={`wiggle grid size-16 shrink-0 place-items-center rounded-2xl text-4xl md:size-20 md:text-5xl ${ICON[id].bg}`} aria-hidden>{ICON[id].i}</span>
            <span className="flex-1">
              <span className="block text-xs font-bold uppercase tracking-widest text-ink-soft">{ICON[id].tag}</span>
              <span className="block font-display text-2xl font-bold">{PRODUCTS[id].name}</span>
              <span className="block text-ink-soft">{PRODUCTS[id].short}</span>
              <span className="mt-1 block text-sm font-semibold">Prueba gratis · completo por {formatEur(prices[id])}</span>
            </span>
            <span aria-hidden className="text-2xl transition group-hover:translate-x-1 md:hidden">→</span>
            <span className="btn btn-primary hidden w-full md:inline-flex">Empezar gratis →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
