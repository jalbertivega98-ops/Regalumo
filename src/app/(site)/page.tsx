import Link from "next/link";
import Image from "next/image";
import { getPrices } from "@/lib/settings";
import { formatEur, PRODUCTS } from "@/lib/products/catalog";
import { HOME_FAQ, SEO_PAGES } from "@/content/seo";
import { pageMetadata } from "@/lib/seo/meta";
import { faqJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

const HOME_TITLE = "Regalos personalizados con foto, pruébalos gratis · REGALUMO";
import { ProductCards } from "@/components/ProductCards";
import { NewspaperShowcase } from "@/components/showcase/NewspaperShowcase";
import { ColoringShowcase } from "@/components/showcase/ColoringShowcase";
import { EscapeShowcase } from "@/components/showcase/EscapeShowcase";
import { escapeSample } from "@/components/showcase/samples";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 300;

export const metadata = {
  ...pageMetadata({
    title: HOME_TITLE,
    description:
      "Crea regalos personalizados con tus fotos: un periódico con su historia, un escape room para imprimir o un libro para colorear. Pruébalo gratis y sin registro.",
    path: "/",
  }),
  // Título completo, sin la coletilla «· REGALUMO» de la plantilla (ya la incluye).
  title: { absolute: HOME_TITLE },
};

const STEPS = [
  { n: "1", t: "Personaliza", d: "Nombres, fotos, temática o edad. Sin registrarte." },
  { n: "2", t: "Mira el resultado", d: "Vista previa real al momento. Cambia lo que quieras." },
  { n: "3", t: "Paga si te gusta", d: "Pago seguro con Stripe. Solo si quieres el archivo final." },
  { n: "4", t: "Descarga y regala", d: "PDF en alta calidad para imprimir o enviar el mismo día." },
];

const PICK = [
  { id: "newspaper", icon: "📰", label: "Periódico", bg: "bg-coral/15" },
  { id: "escape", icon: "🗝️", label: "Escape room", bg: "bg-violet/15" },
  { id: "coloring", icon: "🖍️", label: "Colorear", bg: "bg-mint/15" },
] as const;

const OCCASIONS = ["Cumpleaños", "Bodas", "Jubilaciones", "Aniversarios", "Día de la Madre", "Día del Padre", "Navidad", "Fiestas infantiles", "Despedidas", "Mascotas"];

const TRUST = [
  { i: "🔒", t: "Tus fotos son privadas", d: "Se guardan solo para crear tu regalo, nunca se publican ni se indexan y puedes borrarlas con un clic." },
  { i: "🧹", t: "Borrado automático", d: "Los proyectos que no se compran se eliminan solos pasado un tiempo. Guardamos lo mínimo." },
  { i: "💳", t: "Pago seguro", d: "Los pagos los procesa Stripe. Nunca vemos ni guardamos los datos de tu tarjeta." },
  { i: "🎯", t: "Sin trampas", d: "Ves el resultado antes de pagar, sabes exactamente qué incluye y no hay suscripciones." },
  { i: "✍️", t: "Nada inventado", d: "Tus textos son tuyos: no inventamos datos de nadie ni publicamos opiniones falsas." },
  { i: "📊", t: "Analítica sin cookies", d: "Medimos visitas de forma agregada y anónima, sin cookies de seguimiento ni terceros." },
];

export default async function Home() {
  const prices = await getPrices();
  const sample = escapeSample("numbers");
  const christmas = isChristmasSeason(new Date());
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd(), websiteJsonLd(), faqJsonLd(HOME_FAQ)],
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="blob pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-sun/40 blur-3xl" />
        <div aria-hidden className="blob pointer-events-none absolute -left-32 top-40 size-96 rounded-full bg-coral/25 blur-3xl [animation-delay:-5s]" />
        <div aria-hidden className="blob pointer-events-none absolute bottom-0 left-1/2 size-80 rounded-full bg-violet/15 blur-3xl [animation-delay:-9s]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-14 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-14 lg:min-h-[calc(100svh-68px)] lg:gap-14 lg:py-12">
          <div className="animate-rise">
            {christmas ? (
              <Link
                href="/regalos-de-navidad-personalizados"
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span aria-hidden>🎄</span>
                Regalos de Navidad sin esperar envíos
                <span aria-hidden className="text-coral-dark">→</span>
              </Link>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-mint" />
                </span>
                Pruébalo gratis, sin registro
              </p>
            )}
            <h1 className="mt-5 font-display text-[2.75rem] font-black leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
              Crea algo{" "}
              <span className="squiggle">
                <span className="text-gradient">único</span>
              </span>
              .<br /> Sorprende a alguien especial.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft xl:text-xl">
              Un periódico con su historia en portada, un escape room para su cumpleaños o un libro para colorear con sus fotos. Lo diseñas en minutos, lo ves antes de pagar y lo descargas al instante.
            </p>

            <p className="mt-7 text-sm font-bold uppercase tracking-widest text-ink-soft">1. Elige qué quieres regalar</p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {PICK.map((p, i) => (
                <Link
                  key={p.id}
                  href={PRODUCTS[p.id].editorPath}
                  className={`group relative flex flex-col items-center gap-1 rounded-2xl border-2 border-transparent bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:border-ink hover:shadow-lg sm:p-4 animate-rise`}
                  style={{ animationDelay: `${200 + i * 90}ms` }}
                >
                  <span aria-hidden className={`grid size-12 place-items-center rounded-2xl text-2xl transition-transform group-hover:-rotate-6 group-hover:scale-110 sm:size-14 sm:text-3xl ${p.bg}`}>
                    {p.icon}
                  </span>
                  <span className="mt-1 font-display text-[15px] font-bold leading-tight sm:text-lg">{p.label}</span>
                  <span className="text-xs text-ink-soft sm:text-sm">{formatEur(prices[p.id])}</span>
                  <span className="mt-1 hidden rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white transition group-hover:bg-coral sm:inline-block">Probar gratis</span>
                </Link>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <a href="#ejemplos" className="font-bold underline decoration-sun decoration-[3px] underline-offset-4 hover:decoration-coral">Ver ejemplos reales ↓</a>
              <span className="text-ink-soft">Pago único · PDF de alta calidad · Packs de 3 por {formatEur(prices.pack)}</span>
            </div>
          </div>
          <div className="relative mx-auto h-[360px] w-full max-w-sm sm:h-[440px] sm:max-w-md xl:h-[540px] xl:max-w-lg" aria-label="Ejemplos de regalos creados con REGALUMO">
            <div className="absolute left-0 top-0 w-[62%] animate-float" style={{ ["--r" as string]: "-5deg" }}>
              <div className="rotate-[-5deg] overflow-hidden rounded-md transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <NewspaperShowcaseStatic />
              </div>
            </div>
            <div className="absolute right-0 top-10 w-[46%] animate-float [animation-delay:1.5s]" style={{ ["--r" as string]: "6deg" }}>
              <div className="relative aspect-[3/4] rotate-[6deg] overflow-hidden rounded-2xl bg-white shadow-xl transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <Image src="/samples/coffee-sencillo.webp" alt="Lámina para colorear generada desde una foto" fill priority sizes="(min-width: 1280px) 260px, 220px" className="object-cover" />
              </div>
            </div>
            <div className="absolute bottom-0 right-6 w-[58%] animate-float [animation-delay:3s]" style={{ ["--r" as string]: "-2deg" }}>
              <div className="rotate-[-2deg] rounded-2xl bg-ink p-4 text-white shadow-xl transition-transform duration-500 hover:rotate-0 hover:scale-105 xl:p-5">
                <p className="text-[11px] font-bold tracking-widest text-sun">ESCAPE ROOM · PIRATAS</p>
                <p className="font-display text-lg font-bold leading-tight xl:text-xl">El tesoro de la isla Brumosa</p>
                <p className="mt-2 rounded-lg bg-white/10 p-2 text-center font-black tracking-[0.3em]">L C A N A</p>
                <p className="mt-1 text-center text-xs text-white/70">¿Qué palabra es?</p>
              </div>
            </div>
            <span aria-hidden className="absolute -left-2 bottom-16 rotate-[-10deg] rounded-full bg-sun px-3 py-1.5 text-sm font-black shadow-lg animate-float [animation-delay:2s]">¡Vista previa gratis!</span>
          </div>
        </div>
      </section>

      {/* OCASIONES (cinta en movimiento) */}
      <div className="marquee overflow-hidden border-y-2 border-ink bg-sun py-3" aria-label="Ocasiones">
        <div className="marquee-track flex gap-8 whitespace-nowrap font-display text-lg font-bold sm:text-xl">
          {[...OCCASIONS, ...OCCASIONS].map((o, i) => (
            <span key={i} className="flex items-center gap-8" aria-hidden={i >= OCCASIONS.length}>
              {o} <span className="text-coral">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* PRODUCTOS */}
      <section id="productos" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="reveal text-sm font-bold uppercase tracking-widest text-coral">Los regalos</p>
        <h2 className="reveal mt-1 font-display text-4xl font-black lg:text-5xl">Tres regalos que nadie más tendrá</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Cada uno con una prueba gratuita de verdad: introduces tus datos y ves tu resultado, no una imagen de catálogo.</p>
        <div className="mt-8">
          <ProductCards prices={prices} />
        </div>
      </section>

      {/* EJEMPLOS INTERACTIVOS */}
      <section id="ejemplos" className="scroll-mt-16 bg-shell py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="reveal text-sm font-bold uppercase tracking-widest text-violet">Tócalo, es real</p>
          <h2 className="reveal mt-1 font-display text-4xl font-black lg:text-5xl">Ejemplos reales, hechos con la herramienta</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">Nada de maquetas: esto es lo que genera REGALUMO. Tócalo.</p>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 xl:gap-16">
            <div className="reveal">
              <h3 className="font-display text-2xl font-bold">📰 {PRODUCTS.newspaper.name}</h3>
              <p className="text-ink-soft">Tres plantillas, tus fotos y tus textos.</p>
              <div className="mt-4">
                <NewspaperShowcase />
              </div>
            </div>
            <div className="space-y-10">
              <div className="reveal">
                <h3 className="font-display text-2xl font-bold">🖍️ {PRODUCTS.coloring.name}</h3>
                <p className="text-ink-soft">Desliza para comparar la foto con la lámina.</p>
                <div className="mt-4">
                  <ColoringShowcase />
                </div>
              </div>
              <div className="reveal">
                <h3 className="font-display text-2xl font-bold">🗝️ {PRODUCTS.escape.name}</h3>
                <p className="text-ink-soft mb-4">Un acertijo de un juego real. ¿Lo resuelves?</p>
                <EscapeShowcase sample={sample} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
        <p className="reveal text-sm font-bold uppercase tracking-widest text-mint">Así de fácil</p>
        <h2 className="reveal mt-1 font-display text-4xl font-black lg:text-5xl">Cómo funciona</h2>
        <ol className="relative mt-10 grid gap-4 md:grid-cols-4 lg:gap-6">
          <span aria-hidden className="absolute left-[12%] right-[12%] top-[2.9rem] hidden border-t-[3px] border-dashed border-line md:block" />
          {STEPS.map((s, i) => (
            <li key={s.n} className="reveal lift card relative p-6">
              <span className={`wiggle grid size-14 place-items-center rounded-2xl font-display text-2xl font-black shadow-[0_4px_0_rgba(30,22,51,0.15)] ${["bg-sun", "bg-coral text-white", "bg-violet text-white", "bg-mint text-white"][i]}`}>{s.n}</span>
              <p className="mt-4 font-display text-xl font-bold">{s.t}</p>
              <p className="mt-1 text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="reveal mt-10 text-center">
          <Link href="/crear" className="btn btn-primary btn-shine text-lg">Empezar ahora, es gratis</Link>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="relative scroll-mt-16 overflow-hidden bg-ink py-16 text-white lg:py-24">
        <div aria-hidden className="blob pointer-events-none absolute -right-20 top-0 size-96 rounded-full bg-violet/30 blur-3xl" />
        <div aria-hidden className="blob pointer-events-none absolute -left-20 bottom-0 size-80 rounded-full bg-coral/25 blur-3xl [animation-delay:-6s]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="reveal font-display text-4xl font-black lg:text-5xl">Precios claros, sin suscripciones</h2>
          <p className="mt-2 text-white/70">Crear y previsualizar es gratis. Pagas una vez por el archivo final. IVA incluido.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["newspaper", "coloring", "escape"] as const).map((id) => (
              <div key={id} className="reveal flex flex-col rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10">
                <p className="font-bold">{PRODUCTS[id].name}</p>
                <p className="mt-2 font-display text-4xl font-black">{formatEur(prices[id])}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/50">Gratis</p>
                <ul className="mt-1 space-y-1 text-sm text-white/80">{PRODUCTS[id].free.map((f) => <li key={f}>· {f}</li>)}</ul>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-sun">Al pagar</p>
                <ul className="mt-1 space-y-1 text-sm">{PRODUCTS[id].paid.map((f) => <li key={f}>★ {f}</li>)}</ul>
                <Link href={PRODUCTS[id].editorPath} className="mt-auto block pt-5 text-sm font-bold text-sun hover:underline">Probar gratis →</Link>
              </div>
            ))}
            <div className="reveal relative rounded-3xl bg-coral p-6 shadow-[0_20px_60px_-20px_rgba(255,107,74,0.8)] transition hover:-translate-y-1 lg:-my-3 lg:py-9">
              <span className="absolute -top-3 right-5 rotate-3 rounded-full bg-sun px-3 py-1 text-xs font-black text-ink shadow">Mejor precio</span>
              <p className="font-bold">Pack 3 regalos</p>
              <p className="mt-2 font-display text-4xl font-black">{formatEur(prices.pack)}</p>
              <p className="mt-1 text-sm">Ahorras {formatEur(prices.newspaper + prices.coloring + prices.escape - prices.pack)}</p>
              <ul className="mt-4 space-y-1 text-sm">
                <li>★ Periódico personalizado</li>
                <li>★ Escape room completo</li>
                <li>★ Libro para colorear</li>
                <li>★ Úsalos cuando quieras durante 30 días</li>
              </ul>
              <Link href="/crear" className="btn mt-6 w-full bg-white text-ink transition hover:scale-[1.03]">Empezar gratis</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <section id="confianza" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="reveal font-display text-4xl font-black lg:text-5xl">Confianza y privacidad</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Vas a subir fotos y recuerdos de personas que quieres. Los tratamos con el cuidado que merecen.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.t} className="reveal lift rounded-3xl border-2 border-line bg-white p-6">
              <p className="font-display text-xl font-bold"><span aria-hidden className="wiggle mr-2 inline-block">{t.i}</span>{t.t}</p>
              <p className="mt-1 text-ink-soft">{t.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-12">
        <h2 className="reveal font-display text-4xl font-black lg:text-5xl">Preguntas frecuentes</h2>
        <div className="mt-6">
          <Faq items={HOME_FAQ} />
        </div>
      </section>

      {/* IDEAS: enlaces a las guías por ocasión (también ayudan a que Google las encuentre) */}
      <section id="ideas" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <h2 className="reveal font-display text-3xl font-black lg:text-4xl">Ideas y guías de regalo</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {SEO_PAGES.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} className="inline-block rounded-full border-2 border-line bg-white px-4 py-2 font-semibold transition hover:border-coral hover:text-coral">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="reveal relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-coral via-[#ff4f6d] to-violet px-6 py-16 text-center text-white lg:py-24">
          <div aria-hidden className="blob pointer-events-none absolute -left-10 -top-10 size-64 rounded-full bg-sun/40 blur-3xl" />
          <h2 className="relative font-display text-4xl font-black sm:text-5xl lg:text-6xl">¿A quién vas a sorprender?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/90 lg:text-lg">Empieza ahora. En dos minutos tendrás una vista previa con sus datos.</p>
          <Link href="/crear" className="btn relative mt-7 bg-white text-lg text-ink transition hover:scale-105">Crear gratis →</Link>
        </div>
      </section>
    </>
  );
}

/** Del 15 de noviembre al 6 de enero (Reyes) la cabecera lleva a la guía de Navidad. La página se regenera cada 5 min. */
function isChristmasSeason(d: Date) {
  const m = d.getMonth();
  return (m === 10 && d.getDate() >= 15) || m === 11 || (m === 0 && d.getDate() <= 6);
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
