import Image from "next/image";

/** Muestra del PDF que se recibe (páginas reales del generador, con las respuestas difuminadas). */
export function EscapePdfPreview() {
  return (
    <figure className="card overflow-hidden p-3 sm:p-5">
      <p className="px-1 text-xs font-bold uppercase tracking-widest text-violet">Así es el PDF que recibes</p>
      <Image
        src="/samples/escape-room-muestra.webp"
        alt="Muestra del escape room de Navidad: portada, hoja de control del organizador, puzle recortable, código de símbolos, tarjetas de recompensa y diploma"
        width={1600}
        height={1486}
        sizes="(max-width: 768px) 100vw, 768px"
        className="mt-3 h-auto w-full rounded-xl"
      />
      <figcaption className="mt-3 px-1 text-sm text-ink-soft">
        Muestra real de un escape room de Navidad (8 a 11 años, 60 minutos). Las respuestas están difuminadas para no destripar el juego. Cada temática tiene sus propios colores y adornos, y el tuyo lleva el nombre y la edad que elijas.
      </figcaption>
    </figure>
  );
}
