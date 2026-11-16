import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/periodico-personalizado", label: "Periódico" },
  { href: "/escape-room-personalizado", label: "Escape room" },
  { href: "/libro-para-colorear-personalizado", label: "Colorear" },
  { href: "/#precios", label: "Precios" },
  { href: "/#preguntas", label: "Preguntas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-line/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="REGALUMO, inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden md:flex items-center gap-6 font-semibold text-[15px]">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-coral transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/crear" className="btn btn-primary !py-2.5 !px-4 text-sm">
            Crear gratis
          </Link>
          <details className="md:hidden relative">
            <summary className="list-none cursor-pointer rounded-full border-2 border-ink px-3 py-2 text-sm font-bold" aria-label="Abrir menú">
              Menú
            </summary>
            <nav aria-label="Móvil" className="absolute right-0 mt-2 w-56 card p-2 flex flex-col">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-xl px-3 py-2.5 font-semibold hover:bg-shell">
                  {n.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
