import Link from "next/link";
import Image from "next/image";
import { config } from "@/lib/config";
import { getPrices } from "@/lib/settings";
import { formatEur, PRODUCTS } from "@/lib/products/catalog";
import { HOME_FAQ } from "@/content/seo";
import { ProductCards } from "@/components/ProductCards";
import { NewspaperShowcase } from "@/components/showcase/NewspaperShowcase";
import { ColoringShowcase } from "@/components/showcase/ColoringShowcase";
import { EscapeShowcase } from "@/components/showcase/EscapeShowcase";
import { escapeSample } from "@/components/showcase/samples";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 300;

export const metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: "REGALUMO · Crea algo único. Sorprende a alguien especial." },
};

const STEPS = [
  { n: "1", t: "Personaliza", d: "Nombres, fotos, temática o edad. Sin registrarte." },
  { n: "2", t: "Mira el resultado", d: "Vista previa real al momento. Cambia lo que quieras." },
  { n: "3", t: "Paga si te gusta", d: "Pago seguro con Stripe. Solo si quieres el archivo final." },
  { n: "4", t: "Descarga y regala", d: "PDF en alta calidad para imprimir o enviar el mismo día." },
];

const TRUST = [
  { t: "Tus fotos son privadas", d: "Se guardan solo para crear tu regalo, nunca se publican ni se indexan y puedes borrarlas con un clic." },
  { t: "Borrado automático", d: "Los proyectos que no se compran se eliminan solos pasado un tiempo. Guardamos lo mínimo." },
  { t: "Pago seguro", d: "Los pagos los procesa Stripe. Nunca vemos ni guardamos los datos de tu tarjeta." },
  { t: "Sin trampas", d: "Ves el resultado antes de pagar, sabes exactamente qué incluye y no hay suscripciones." },
  { t: "Nada inventado", d: "Tus textos son tuyos: no inventamos datos de nadie ni publicamos opiniones falsas." },
  { t: "Analítica sin cookies", d: "Medimos visitas de forma agregada y anónima, sin cookies de seguimiento ni terceros." },
];

export default async function Home() {
  const prices = await getPrices();
  const sample = escapeSample("numbers");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: "REGALUMO", url: config.siteUrl, logo: `${config.siteUrl}/icon.svg`, slogan: config.slogan },
            { "@type": "WebSite", name: "REGALUMO", url: config.siteUrl, inLanguage: "es-ES" },
            { "@type": "FAQPage", mainEntity: HOME_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
          ],
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-sun/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-32 top-40 size-80 rounded-full bg-coral/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm">
              <span className="size-2 rounded-full bg-mint" /> Pruébalo gratis, sin registro
            </p>
            <h1 className="mt-5 font-display text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              Crea algo <span className="squiggle text-coral">único</span>.<br /> Sorprende a alguien especial.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Un periódico con su historia en portada, un escape room para su cumpleaños o un libro para colorear con sus fotos. Lo diseñas en minutos, lo ves antes de pagar y lo descargas al instante.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/crear" className="btn btn-primary text-lg">Crear gratis</Link>
              <a href="#ejemplos" className="btn btn-ghost text-lg">Ver ejemplos reales</a>
            </div>
            <p className="mt-4 text-sm text-ink-soft">Desde {formatEur(Math.min(prices.newspaper, prices.escape, prices.coloring))} · Pago único · PDF de alta calidad</p>
          </div>
          <div className="relative mx-auto h-[440px] w-full max-w-md" aria-label="Ejemplos de regalos creados con REGALUMO">
            <div className="absolute left-0 top-0 w-[62%] animate-float" style={{ ["--r" as string]: "-5deg" }}>
              <div className="rotate-[-5deg] overflow-hidden rounded-md">
                <NewspaperShowcaseStatic />
              </div>
            </div>
            <div className="absolute right-0 top-10 w-[46%] animate-float [animation-delay:1.5s]" style={{ ["--r" as string]: "6deg" }}>
              <div className="relative aspect-[3/4] rotate-[6deg] overflow-hidden rounded-2xl bg-white shadow-xl">
                <Image src="/samples/coffee-sencillo.webp" alt="Lámina para colorear generada desde una foto" fill priority sizes="220px" className="object-cover" />
              </div>
            </div>
            <div className="absolute bottom-0 right-6 w-[58%] animate-float [animation-delay:3s]" style={{ ["--r" as string]: "-2deg" }}>
              <div className="rotate-[-2deg] rounded-2xl bg-ink p-4 text-white shadow-xl">
                <p className="text-[11px] font-bold tracking-widest text-sun">ESCAPE ROOM · PIRATAS</p>
                <p className="font-display text-lg font-bold leading-tight">El tesoro de la isla Brumosa</p>
                <p className="mt-2 rounded-lg bg-white/10 p-2 text-center font-black tracking-[0.3em]">L C A N A</p>
                <p className="mt-1 text-center text-xs text-white/70">¿Qué palabra es?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-4xl font-black">Tres regalos que nadie más tendrá</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Cada uno con una prueba gratuita de verdad: introduces tus datos y ves tu resultado, no una imagen de catálogo.</p>
        <div className="mt-8">
          <ProductCards prices={prices} />
        </div>
      </section>

      {/* EJEMPLOS INTERACTIVOS */}
      <section id="ejemplos" className="bg-shell py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-4xl font-black">Ejemplos reales, hechos con la herramienta</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">Nada de maquetas: esto es lo que genera REGALUMO. Tócalo.</p>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl font-bold">{PRODUCTS.newspaper.name}</h3>
              <p className="text-ink-soft">Tres plantillas, tus fotos y tus textos.</p>
              <div className="mt-4">
                <NewspaperShowcase />
              </div>
            </div>
            <div className="space-y-10">
              <div>
                <h3 className="font-display text-2xl font-bold">{PRODUCTS.coloring.name}</h3>
                <p className="text-ink-soft">Desliza para comparar la foto con la lámina.</p>
                <div className="mt-4">
                  <ColoringShowcase />
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">{PRODUCTS.escape.name}</h3>
                <p className="text-ink-soft mb-4">Un acertijo de un juego real. ¿Lo resuelves?</p>
                <EscapeShowcase sample={sample} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl font-black">Cómo funciona</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-6">
              <span className="grid size-11 place-items-center rounded-full bg-sun font-display text-xl font-black">{s.n}</span>
              <p className="mt-4 font-display text-xl font-bold">{s.t}</p>
              <p className="mt-1 text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="bg-ink py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-4xl font-black">Precios claros, sin suscripciones</h2>
          <p className="mt-2 text-white/70">Crear y previsualizar es gratis. Pagas una vez por el archivo final. IVA incluido.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {(["newspaper", "coloring", "escape"] as const).map((id) => (
              <div key={id} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                <p className="font-bold">{PRODUCTS[id].name}</p>
                <p className="mt-2 font-display text-4xl font-black">{formatEur(prices[id])}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/50">Gratis</p>
                <ul className="mt-1 space-y-1 text-sm text-white/80">{PRODUCTS[id].free.map((f) => <li key={f}>· {f}</li>)}</ul>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-sun">Al pagar</p>
                <ul className="mt-1 space-y-1 text-sm">{PRODUCTS[id].paid.map((f) => <li key={f}>★ {f}</li>)}</ul>
              </div>
            ))}
            <div className="rounded-3xl bg-coral p-6">
              <p className="font-bold">Pack 3 regalos</p>
              <p className="mt-2 font-display text-4xl font-black">{formatEur(prices.pack)}</p>
              <p className="mt-1 text-sm">Ahorras {formatEur(prices.newspaper + prices.coloring + prices.escape - prices.pack)}</p>
              <ul className="mt-4 space-y-1 text-sm">
                <li>★ Periódico personalizado</li>
                <li>★ Escape room completo</li>
                <li>★ Libro para colorear</li>
                <li>★ Úsalos cuando quieras durante 30 días</li>
              </ul>
              <Link href="/crear" className="btn mt-6 w-full bg-white text-ink">Empezar gratis</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <section id="confianza" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl font-black">Confianza y privacidad</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Vas a subir fotos y recuerdos de personas que quieres. Los tratamos con el cuidado que merecen.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.t} className="rounded-3xl border-2 border-line bg-white p-6">
              <p className="font-display text-xl font-bold">{t.t}</p>
              <p className="mt-1 text-ink-soft">{t.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-display text-4xl font-black">Preguntas frecuentes</h2>
        <div className="mt-6">
          <Faq items={HOME_FAQ} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-coral px-6 py-14 text-center text-white">
          <h2 className="font-display text-4xl font-black sm:text-5xl">¿A quién vas a sorprender?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Empieza ahora. En dos minutos tendrás una vista previa con sus datos.</p>
          <Link href="/crear" className="btn mt-7 bg-white text-lg text-ink">Crear gratis</Link>
        </div>
      </section>
    </>
  );
}

/** Miniatura estática del periódico para la cabecera (sin interacción). */
function NewspaperShowcaseStatic() {
  return (
    <div className="bg-[#F6F1E4] p-4 shadow-2xl">
      <p className="border-b border-ink pb-1 text-[8px] uppercase tracking-wider">Edición especial nº 40 · Valencia</p>
      <p className="mt-1 border-b-[3px] border-ink pb-1 text-center font-serif text-2xl font-black leading-none" style={{ fontFamily: "UnifrakturMaguntia, serif" }}>
        El Diario de Marta
      </p>
      <p className="mt-2 text-center font-display text-[22px] font-black leading-tight">¡Marta cumple 40 años!</p>
      <div className="mt-2 grid grid-cols-[1.5fr_1fr] gap-2">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src="/samples/chelsea.webp" alt="" fill sizes="200px" className="object-cover grayscale" priority />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-1 rounded bg-ink/25" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[9px] italic">«La mejor fiesta es la que se comparte.»</p>
    </div>
  );
}
