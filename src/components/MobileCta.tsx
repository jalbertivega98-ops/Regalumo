"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Barra fija inferior en móvil con el botón principal. Solo en páginas informativas, nunca dentro del editor ni del pedido. */
export function MobileCta() {
  const pathname = usePathname() || "/";
  const [show, setShow] = useState(false);
  const hidden = pathname.startsWith("/crear") || pathname.startsWith("/pedido") || pathname.startsWith("/legal") || pathname.startsWith("/proyecto");

  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 500;
      setShow(window.scrollY > 520 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hidden) return null;
  return (
    <div
      aria-hidden={!show}
      className={`pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-cream/90 px-4 pt-3 backdrop-blur-md transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-sm leading-tight">
          <span className="block font-bold">Pruébalo gratis</span>
          <span className="text-ink-soft">Sin registro · ves el resultado antes de pagar</span>
        </p>
        <Link href="/crear" tabIndex={show ? 0 : -1} className="btn btn-primary !px-5 !py-2.5">
          Crear
        </Link>
      </div>
    </div>
  );
}
