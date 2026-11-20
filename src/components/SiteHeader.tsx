"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const PRODUCTS_NAV = [
  {
    href: "/periodico-personalizado",
    label: "Periódico",
    icon: "📰",
    desc: "Su historia en portada",
  },
  {
    href: "/escape-room-personalizado",
    label: "Escape room",
    icon: "🗝️",
    desc: "Una aventura para resolver",
  },
  {
    href: "/libro-para-colorear-personalizado",
    label: "Colorear",
    icon: "🖍️",
    desc: "Sus fotos en láminas",
  },
];
const EXTRA_NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#precios", label: "Precios" },
  { href: "/#preguntas", label: "Preguntas" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Dentro de /crear ya se está creando: el botón solo distraería y sacaría del editor.
  const creating = pathname?.startsWith("/crear") ?? false;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra el menú al cambiar de página.
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled || open ? "bg-cream/90 shadow-[0_8px_30px_-18px_rgba(30,22,51,0.35)] backdrop-blur-md" : "bg-cream/60 backdrop-blur"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="REGALUMO, inicio"
            className="transition-transform hover:scale-[1.03]"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Principal"
            className="hidden items-center gap-1 text-[15px] font-semibold lg:flex"
          >
            {PRODUCTS_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`group flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors hover:bg-white ${pathname === n.href ? "bg-white" : ""}`}
              >
                <span
                  aria-hidden
                  className="transition-transform group-hover:-rotate-12 group-hover:scale-125"
                >
                  {n.icon}
                </span>
                {n.label}
              </Link>
            ))}
            <span aria-hidden className="mx-2 h-5 w-px bg-line" />
            {EXTRA_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:bg-white hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!creating && (
              <Link
                href="/crear"
                className="btn btn-primary !px-4 !py-2.5 text-sm"
              >
                Crear gratis
              </Link>
            )}
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border-2 border-ink bg-white lg:hidden"
              aria-expanded={open}
              aria-controls="menu-movil"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="relative block h-3.5 w-5" aria-hidden>
                <span
                  className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-ink transition-opacity ${open ? "opacity-0" : ""}`}
                />
                <span
                  className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil a pantalla completa (fuera del header: su desenfoque rompería el position: fixed) */}
      <div
        id="menu-movil"
        className={`fixed inset-x-0 top-[68px] bottom-0 z-50 overflow-y-auto bg-cream px-4 pb-10 pt-4 transition-all duration-300 lg:hidden ${open ? "visible opacity-100" : "invisible -translate-y-3 opacity-0"}`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">
          ¿Qué quieres regalar?
        </p>
        <nav aria-label="Móvil" className="mt-3 grid gap-3">
          {PRODUCTS_NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="card flex items-center gap-4 p-4 active:scale-[0.98]"
              style={
                open ? { animation: `pop-in 0.4s ${i * 70}ms both` } : undefined
              }
            >
              <span
                className="grid size-12 place-items-center rounded-2xl bg-shell text-2xl"
                aria-hidden
              >
                {n.icon}
              </span>
              <span className="flex-1">
                <span className="block font-display text-xl font-bold">
                  {n.label}
                </span>
                <span className="block text-sm text-ink-soft">{n.desc}</span>
              </span>
              <span aria-hidden className="text-xl">
                →
              </span>
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {EXTRA_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-white px-2 py-3 text-center text-sm font-semibold"
              >
                {n.label}
              </Link>
            ))}
          </div>
          <Link
            href="/crear"
            onClick={() => setOpen(false)}
            className="btn btn-primary btn-shine mt-3 w-full text-lg"
          >
            Crear gratis, sin registro
          </Link>
          <Link
            href="/mis-pedidos"
            onClick={() => setOpen(false)}
            className="mt-1 py-2 text-center text-sm font-semibold text-ink-soft underline underline-offset-4"
          >
            ¿Ya compraste? Recupera tus descargas
          </Link>
        </nav>
      </div>
    </>
  );
}
