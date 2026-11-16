"use client";
import { useState } from "react";
import Image from "next/image";

const STYLES = [
  { id: "infantil", name: "Infantil" },
  { id: "sencillo", name: "Sencillo" },
  { id: "detallado", name: "Detallado" },
] as const;

/** Antes / después con un deslizador. Imágenes reales generadas por el algoritmo del producto. */
export function ColoringShowcase({ sample = "coffee" }: { sample?: "chelsea" | "coffee" }) {
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("sencillo");
  const [pos, setPos] = useState(50);
  const [img, setImg] = useState(sample);
  return (
    <div>
      <div className="relative mx-auto aspect-[3/2] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl select-none">
        <Image src={`/samples/${img}-${style}.webp`} alt="Lámina para colorear generada a partir de la foto" fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image src={`/samples/${img}.webp`} alt="Foto original" fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-1 bg-white shadow" style={{ left: `calc(${pos}% - 2px)` }} />
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-xs font-bold text-white">Foto</span>
        <span className="absolute right-3 top-3 rounded-full bg-mint px-2 py-1 text-xs font-bold text-white">Para colorear</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Comparar foto y lámina" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {STYLES.map((s) => (
          <button key={s.id} type="button" className="chip text-sm" aria-pressed={style === s.id} onClick={() => setStyle(s.id)}>
            {s.name}
          </button>
        ))}
        <button type="button" className="chip text-sm" onClick={() => setImg(img === "coffee" ? "chelsea" : "coffee")}>
          Otra foto
        </button>
      </div>
      <p className="hint mt-2 text-center">Resultado real del conversor de REGALUMO (fotos de ejemplo con licencia libre CC0).</p>
    </div>
  );
}
