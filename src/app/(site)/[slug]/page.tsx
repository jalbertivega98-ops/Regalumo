import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEO_PAGES, getSeoPage } from "@/content/seo";
import { getPrices } from "@/lib/settings";
import { PRODUCTS, formatEur } from "@/lib/products/catalog";
import { NewspaperShowcase } from "@/components/showcase/NewspaperShowcase";
import { ColoringShowcase } from "@/components/showcase/ColoringShowcase";
import { EscapeShowcase } from "@/components/showcase/EscapeShowcase";
import { escapeSample } from "@/components/showcase/samples";
import { ProductCards } from "@/components/ProductCards";
import { ProductVideo } from "@/components/ProductVideo";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata } from "@/lib/seo/meta";
import { landingJsonLd } from "@/lib/seo/jsonld";

export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = getSeoPage((await params).slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/${page.slug}`, image: `/og/${page.slug}`, imageAlt: page.h1 });
}

export default async function SeoLanding({ params }: { params: Promise<{ slug: string }> }) {
  const page = getSeoPage((await params).slug);
  if (!page) notFound();
  const prices = await getPrices();
  const product = page.product === "all" ? null : PRODUCTS[page.product];
  const href = product ? product.editorPath : "/crear";

  return (
    <>
      <JsonLd data={landingJsonLd(page, prices)} />
      <nav aria-label="Migas de pan" className="mx-auto max-w-7xl px-4 pt-6 text-sm text-ink-soft">
        <Link href="/" className="underline">Inicio</Link> <span aria-hidden>›</span> <span>{page.eyebrow}</span>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-6 px-4 pb-12 pt-4 lg:grid-cols-2 lg:gap-10 lg:pt-6">
        <div>
          <p className="font-semibold text-coral">{page.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl">{page.h1}</h1>
          <p className="mt-4 text-lg text-ink-soft">{page.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={href} className="btn btn-primary text-lg">{page.cta}</Link>
            {product && <span className="text-sm text-ink-soft">Prueba gratis · completo por {formatEur(prices[product.id])}</span>}
          </div>
        </div>
        <div className={product ? "order-first lg:order-none" : undefined}>
          {product ? <ProductVideo product={product.id} /> : <ColoringShowcase eager />}
        </div>
      </section>

      {product && (
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="mb-4 text-center font-display text-3xl font-bold">Un ejemplo de cómo queda</h2>
          {page.visual === "newspaper" && <NewspaperShowcase compact />}
          {page.visual === "coloring" && <ColoringShowcase sample={page.slug === "foto-para-colorear" ? "chelsea" : "coffee"} />}
          {page.visual === "escape" && <EscapeShowcase sample={escapeSample(page.slug === "escape-room-para-imprimir" ? "caesar" : "numbers")} />}
        </section>
      )}

      {page.visual === "all" && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <ProductCards prices={prices} />
        </section>
      )}

      <article className="mx-auto max-w-3xl px-4">
        {page.sections.map((s) => (
          <section key={s.h2} className="py-6">
            <h2 className="font-display text-3xl font-bold">{s.h2}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-lg leading-relaxed text-ink-soft">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-3 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-lg"><span aria-hidden className="text-coral">✦</span>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <div className="my-8 rounded-[2rem] bg-ink p-8 text-center text-white">
          <p className="font-display text-3xl font-black">Pruébalo ahora con tus datos</p>
          <p className="mt-2 text-white/75">Sin registro y sin tarjeta. Solo pagas si quieres el archivo final.</p>
          <Link href={href} className="btn btn-primary mt-5">{page.cta}</Link>
        </div>
        <section className="py-6">
          <h2 className="font-display text-3xl font-bold">Preguntas frecuentes</h2>
          <div className="mt-4">
            <Faq items={page.faq} />
          </div>
        </section>
        <section className="py-6">
          <h2 className="font-display text-2xl font-bold">También te puede interesar</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {page.related.map((slug) => {
              const r = getSeoPage(slug);
              return r ? (
                <li key={slug}>
                  <Link href={`/${slug}`} className="card block p-4 font-semibold hover:text-coral">{r.label} →</Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      </article>
    </>
  );
}
