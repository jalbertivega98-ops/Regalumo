import Link from "next/link";
import Image from "next/image";
import { PRODUCTS, formatEur, type ProductId } from "@/lib/products/catalog";
import type { Prices } from "@/lib/settings";

const VISUAL: Record<ProductId, { bg: string; tag: string }> = {
  newspaper: { bg: "bg-coral/15", tag: "Cumpleaños, bodas, jubilaciones" },
  escape: { bg: "bg-violet/15", tag: "De 5 años a adultos" },
  coloring: { bg: "bg-mint/15", tag: "Mascotas, familia, viajes" },
};

function MiniNewspaper() {
  return (
    <div className="mx-auto w-40 rotate-[-4deg] bg-[#F6F1E4] p-3 shadow-lg" aria-hidden>
      <div className="border-b-2 border-ink pb-1 text-center font-serif text-[15px] font-black leading-none">El Diario de Marta</div>
      <div className="mt-2 text-center font-serif text-[13px] font-black leading-tight">¡Marta cumple 40 años!</div>
      <div className="mt-2 flex gap-1.5">
        <div className="relative h-14 w-20 overflow-hidden bg-ink/10">
          <Image src="/samples/chelsea.webp" alt="" fill sizes="80px" className="object-cover grayscale" />
        </div>
        <div className="flex-1 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-1 rounded bg-ink/25" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniColoring() {
  return (
    <div className="relative h-40 w-60" aria-hidden>
      <div className="absolute left-0 top-3 h-28 w-36 rotate-[-6deg] overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
        <Image src="/samples/chelsea.webp" alt="" fill sizes="144px" className="object-cover" />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white">Foto</span>
      </div>
      <div className="absolute right-0 bottom-0 h-32 w-44 rotate-[3deg] overflow-hidden rounded-xl border-4 border-white bg-white shadow-xl">
        <Image src="/samples/chelsea-sencillo.webp" alt="" fill sizes="176px" className="object-cover" />
        <span className="absolute right-1.5 top-1.5 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-ink">Para colorear</span>
      </div>
    </div>
  );
}

function MiniEscape() {
  return (
    <div className="mx-auto w-44 rotate-[3deg] rounded-xl bg-white p-3 shadow-lg" aria-hidden>
      <p className="text-[10px] font-bold tracking-widest text-violet">SOBRE 2</p>
      <p className="font-display text-sm font-bold leading-tight">Números que hablan</p>
      <p className="mt-2 rounded-lg bg-violet/10 p-2 text-center text-sm font-black tracking-widest">13-1-16-1</p>
      <div className="mt-2 flex justify-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-4 w-4 border-b-2 border-ink" />
        ))}
      </div>
    </div>
  );
}

export function ProductCards({ prices }: { prices: Prices }) {
  return (
    <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
      {(Object.keys(PRODUCTS) as ProductId[]).map((id) => {
        const p = PRODUCTS[id];
        const v = VISUAL[id];
        return (
          <article key={id} className="reveal lift card group flex flex-col overflow-hidden">
            <Link href={p.editorPath} tabIndex={-1} aria-hidden className={`${v.bg} grid h-52 place-items-center overflow-hidden p-6 lg:h-60`}>
              <div className="lift-img">
              {id === "newspaper" ? (
                <MiniNewspaper />
              ) : id === "escape" ? (
                <MiniEscape />
              ) : (
                <MiniColoring />
              )}
              </div>
            </Link>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">{v.tag}</p>
              <h3 className="font-display text-2xl font-bold mt-1">{p.name}</h3>
              <p className="mt-2 text-ink-soft">{p.short}</p>
              <p className="mt-4 font-display text-3xl font-black">{formatEur(prices[id])}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link href={p.editorPath} className="btn btn-primary !py-2.5">Pruébalo gratis →</Link>
                <Link href={p.landingPath} className="btn btn-ghost !py-2.5">Ver más</Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
