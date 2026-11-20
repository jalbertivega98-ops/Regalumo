import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PRODUCTS, type ProductId } from "@/lib/products/catalog";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

const ICON: Record<ProductId, string> = { newspaper: "📰", escape: "🗝️", coloring: "🖍️" };

/** 404 en español con el menú y caminos claros hacia los regalos (en vez de la página en inglés de Next). */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:py-20">
          <p className="text-6xl" aria-hidden>🎁</p>
          <h1 className="mt-4 font-display text-4xl font-black sm:text-5xl">Esta página no existe</h1>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            Puede que el enlace esté mal escrito o que la página ya no esté. Si buscabas un regalo, empieza por aquí:
          </p>
          <ul className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            {(Object.keys(PRODUCTS) as ProductId[]).map((id) => (
              <li key={id}>
                <Link href={PRODUCTS[id].editorPath} className="card flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5 sm:flex-col sm:items-start">
                  <span aria-hidden className="text-3xl">{ICON[id]}</span>
                  <span>
                    <span className="block font-display text-lg font-bold leading-tight">{PRODUCTS[id].name}</span>
                    <span className="text-sm text-ink-soft">Pruébalo gratis →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">Ir a la portada</Link>
            <Link href="/mis-pedidos" className="btn btn-ghost">Recuperar mis pedidos</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
