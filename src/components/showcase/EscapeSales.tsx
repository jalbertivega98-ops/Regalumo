import Image from "next/image";
import Link from "next/link";
import { THEMES, THEME_IDS, type ThemeId } from "@/lib/escape/themes";
import { EscapePdfPreview } from "./EscapePdfPreview";

/**
 * Secciones de venta del escape room: datos clave, cómo funciona, cómo se juega,
 * qué incluye, temáticas, tipos de reto y el panel del móvil.
 * Todas las imágenes son páginas reales del generador (public/samples/escape).
 */

const FACTS = [
  { icon: "🧩", big: "4 a 9", small: "retos encadenados" },
  { icon: "⏱️", big: "30 a 90 min", small: "tú eliges la duración" },
  { icon: "🎂", big: "De 5 años", small: "a adultos y familias" },
  { icon: "👥", big: "3 a 6", small: "por equipo (o dos equipos)" },
  { icon: "✂️", big: "20 min", small: "para prepararlo todo" },
];

const STEPS = [
  { icon: "🎨", title: "Elige y personaliza", text: "Temática, edad, dificultad, duración y el nombre del protagonista y de su equipo. La historia se escribe con esos datos." },
  { icon: "👀", title: "Pruébalo gratis", text: "Jugad una mini versión de 3 acertijos al momento, sin registro y sin tarjeta. Cambia lo que quieras hasta que te guste." },
  { icon: "⬇️", title: "Paga y descarga", text: "Pago único y el PDF completo llega al instante (también por correo). Puedes imprimirlo las veces que quieras." },
  { icon: "✉️", title: "Imprime, esconde y ¡a jugar!", text: "Recorta, mete cada reto en su sobre con su etiqueta y escóndelos por casa. La guía te dice dónde va cada uno." },
];

const LOOP = [
  { n: "1", title: "Abrís el sobre", text: "Cada sobre trae un reto y un trocito de la historia." },
  { n: "2", title: "Resolvéis el reto", text: "Si os atascáis, gastad una ficha de pista." },
  { n: "3", title: "Ganáis una letra", text: "Y la tarjeta de recompensa dice dónde está el siguiente sobre." },
  { n: "4", title: "¡Abrís el premio!", text: "Con todas las letras formáis la palabra final que abre el cofre." },
];

const INCLUDES = [
  ["📕", "Portada con el nombre del protagonista"],
  ["🧭", "Guía del organizador paso a paso"],
  ["📋", "Hoja de control con dónde esconder cada sobre"],
  ["📜", "Historia para leer en voz alta al empezar"],
  ["🧩", "Los retos, uno por página y adaptados a la edad"],
  ["🔐", "Desafío final con la palabra secreta"],
  ["🎟️", "Tarjetas de recompensa que llevan al siguiente sobre"],
  ["🏷️", "Etiquetas para los sobres, ya numeradas"],
  ["💌", "Invitaciones para los jugadores"],
  ["💡", "Fichas de pista para cuando haya atascos"],
  ["✅", "Soluciones explicadas para el organizador"],
  ["🏅", "Diploma de equipo para el final"],
  ["📱", "Código QR para jugar con el móvil (opcional)"],
];

const PUZZLES: { id: string; name: string; text: string; age: string }[] = [
  { id: "jigsaw", name: "Puzle recortable", text: "Se recortan las piezas y, al montarlas, aparece la contraseña.", age: "Todas las edades" },
  { id: "symbols", name: "Código de símbolos", text: "Un mensaje secreto escrito con símbolos y su tabla para descifrarlo.", age: "Todas las edades" },
  { id: "maze", name: "Laberinto de letras", text: "El camino correcto recoge las letras de la palabra.", age: "Todas las edades" },
  { id: "riddle", name: "Adivinanzas", text: "Adivinanzas de la temática elegida, sin respuestas repetidas.", age: "Todas las edades" },
  { id: "shapes", name: "Cuenta y encontrarás", text: "Contar formas para sacar el número de la clave. Ideal para peques.", age: "5 a 7 años" },
  { id: "wordsearch", name: "Sopa de letras incompleta", text: "Una de las palabras de la lista no está: esa es la respuesta.", age: "Desde 8 años" },
  { id: "caesar", name: "Mensaje cifrado", text: "Cada letra se ha desplazado en el abecedario. Hay que devolverla a su sitio.", age: "Desde 8 años" },
  { id: "logic", name: "Reto de lógica", text: "Con unas pocas pistas, averiguar quién llegó primero.", age: "Desde 12 años" },
];

const PHONE = [
  { n: 1, text: "Pulsáis empezar y arranca la cuenta atrás." },
  { n: 2, text: "Escribís la respuesta de cada sobre. Si os atascáis, hay pistas." },
  { n: 3, text: "Cada acierto da una letra y os dice dónde buscar el siguiente sobre." },
  { n: 4, text: "Con la palabra final, ¡celebración y premio!" },
];

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-violet">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-ink-soft">{text}</p>}
    </div>
  );
}

export function EscapeSales({
  href,
  price,
  featuredTheme,
  compact = false,
}: {
  href: string;
  /** Precio ya formateado, p. ej. «9,99 €». */
  price: string;
  featuredTheme?: ThemeId;
  /** Versión corta para el editor: sin datos clave ni galería de temáticas. */
  compact?: boolean;
}) {
  const themes = featuredTheme ? [featuredTheme, ...THEME_IDS.filter((t) => t !== featuredTheme)] : THEME_IDS;

  return (
    <div className="space-y-16 pb-12 sm:space-y-20">
      {!compact && (
        <section className="mx-auto max-w-7xl px-4">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {FACTS.map((f) => (
              <li key={f.big} className="card flex flex-col items-center p-4 text-center">
                <span aria-hidden className="text-2xl">{f.icon}</span>
                <span className="mt-1 font-display text-xl font-black">{f.big}</span>
                <span className="text-sm text-ink-soft">{f.small}</span>
              </li>
            ))}
            <li className="card flex flex-col items-center bg-sun/30 p-4 text-center">
              <span aria-hidden className="text-2xl">💶</span>
              <span className="mt-1 font-display text-xl font-black">{price}</span>
              <span className="text-sm text-ink-soft">pago único, sin suscripción</span>
            </li>
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4" aria-label="Cómo funciona">
        <SectionTitle eyebrow="Cómo funciona" title="De la idea a la partida en 4 pasos" text="No hace falta preparar nada a mano: el juego se genera con tus datos y llega listo para imprimir." />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card relative p-5">
              <span className="absolute -top-3 left-5 rounded-full bg-coral px-3 py-0.5 text-sm font-bold text-white">Paso {i + 1}</span>
              <span aria-hidden className="mt-2 block text-3xl">{s.icon}</span>
              <h3 className="mt-2 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ink py-14 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-sun">El día de la partida</p>
            <h2 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl">Así se juega</h2>
            <p className="mt-3 text-lg text-white/75">
              El organizador lee la historia en voz alta, entrega el primer sobre y pone la cuenta atrás. A partir de ahí, el juego se guía solo.
            </p>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((s, i) => (
              <li key={s.n} className="relative rounded-3xl bg-white/10 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun font-display text-xl font-black text-ink">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-white/75">{s.text}</p>
                {i < LOOP.length - 1 && (
                  <span aria-hidden className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-2xl text-sun lg:block">→</span>
                )}
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-6 max-w-2xl text-center text-white/75">
            Se repite sobre a sobre: <strong className="text-white">sobre 1 → letra → sobre 2 → letra → …</strong> hasta reunir la palabra que abre el premio. El premio lo ponéis vosotros: un regalo, chuches o lo que se os ocurra.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4" aria-label="Qué incluye">
        <SectionTitle eyebrow="Qué incluye" title="Todo lo que necesitas, en un solo PDF" text="Para imprimir en casa en A4, a color o en blanco y negro. Solo hacen falta tijeras y unos sobres." />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
          <EscapePdfPreview />
          <ul className="grid gap-2">
            {INCLUDES.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5 text-lg">
                <span aria-hidden className="text-xl">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {!compact && (
        <section className="mx-auto max-w-7xl px-4" aria-label="Temáticas">
          <SectionTitle eyebrow="7 temáticas" title="Elige la aventura" text="Cada temática tiene su historia, sus colores, sus adornos y sus propios acertijos. Toca una para empezar con ella." />
          <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {themes.map((id) => {
              const t = THEMES[id];
              return (
                <li key={id} className="w-56 shrink-0 snap-start sm:w-auto">
                  <Link href={`/crear/escape-room?tema=${id}`} className="card group block overflow-hidden p-2 transition hover:-translate-y-1">
                    <Image
                      src={`/samples/escape/portada-${id}.webp`}
                      alt={`Portada del escape room de ${t.name}: «${t.title}»`}
                      width={420}
                      height={593}
                      sizes="(max-width: 640px) 224px, 300px"
                      className="h-auto w-full rounded-xl"
                    />
                    <p className="mt-2 px-1 font-display text-lg font-bold group-hover:text-coral">
                      <span aria-hidden>{t.emoji}</span> {t.name}
                    </p>
                    <p className="px-1 pb-1 text-sm text-ink-soft">{t.title}</p>
                  </Link>
                </li>
              );
            })}
            <li className="w-56 shrink-0 snap-start sm:w-auto">
              <Link href={href} className="card flex h-full min-h-48 flex-col items-center justify-center gap-2 bg-coral p-6 text-center text-white hover:bg-coral-dark">
                <span aria-hidden className="text-4xl">✨</span>
                <span className="font-display text-xl font-bold">Crea el tuyo gratis</span>
                <span className="text-sm text-white/85">Con el nombre y la edad que quieras</span>
              </Link>
            </li>
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4" aria-label="Tipos de reto">
        <SectionTitle eyebrow="Los retos" title="Acertijos de verdad, no fichas de colorear" text="Se combinan según la edad y la duración, y nunca se repite la misma respuesta. Estos son algunos de los que pueden tocar:" />
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PUZZLES.map((p) => (
            <li key={p.id} className="card overflow-hidden p-2">
              <Image
                src={`/samples/escape/reto-${p.id}.webp`}
                alt={`Ejemplo de reto: ${p.name}`}
                width={420}
                height={593}
                sizes="(max-width: 1024px) 50vw, 300px"
                className="h-auto w-full rounded-xl border border-line"
              />
              <div className="p-2">
                <span className="chip text-xs">{p.age}</span>
                <h3 className="mt-2 font-display text-lg font-bold leading-tight">{p.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-ink-soft">Y además: candados de números, anagramas, letras en el espejo, series y más.</p>
      </section>

      <section className="mx-auto max-w-7xl px-4" aria-label="Jugar con el móvil">
        <SectionTitle
          eyebrow="Incluido · opcional"
          title="Y si queréis, jugad con el móvil"
          text="El PDF trae un código QR. Al escanearlo se abre un panel con cuenta atrás, comprobación de respuestas y pistas. Sin instalar nada. Y si preferís solo papel, el juego funciona igual."
        />
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {PHONE.map((s) => (
            <li key={s.n} className="w-52 shrink-0 snap-start lg:w-auto">
              <div className="mx-auto max-w-[220px] rounded-[2.2rem] border-[7px] border-ink bg-ink shadow-xl">
                <Image
                  src={`/samples/escape/panel-${s.n}.webp`}
                  alt={`Panel del móvil, paso ${s.n}: ${s.text}`}
                  width={390}
                  height={800}
                  sizes="220px"
                  className="h-auto w-full rounded-[1.7rem]"
                />
              </div>
              <p className="mx-auto mt-3 max-w-[220px] text-center text-ink-soft">
                <strong className="text-ink">{s.n}.</strong> {s.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {!compact && (
        <section className="mx-auto max-w-3xl px-4">
          <div className="rounded-[2rem] bg-violet p-8 text-center text-white">
            <p className="font-display text-3xl font-black">Prepara una tarde que recordarán</p>
            <p className="mt-2 text-white/85">Pruébalo gratis con tus datos. Si te gusta, el juego completo cuesta {price}.</p>
            <Link href={href} className="btn btn-primary mt-5">Crear mi escape room</Link>
          </div>
        </section>
      )}
    </div>
  );
}
