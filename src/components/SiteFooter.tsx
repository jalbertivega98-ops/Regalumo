import Link from "next/link";
import { Logo } from "./Logo";
import { config } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="[&_span]:text-white">
            <Logo />
          </div>
          <p className="mt-3 text-white/70 text-sm">{config.slogan}</p>
        </div>
        <div>
          <p className="font-bold mb-3">Productos</p>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><Link href="/periodico-personalizado">Periódico personalizado</Link></li>
            <li><Link href="/periodico-de-cumpleanos">Periódico de cumpleaños</Link></li>
            <li><Link href="/escape-room-personalizado">Escape room personalizado</Link></li>
            <li><Link href="/escape-room-para-cumpleanos">Escape room para cumpleaños</Link></li>
            <li><Link href="/escape-room-para-imprimir">Escape room para imprimir</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold mb-3">Ideas</p>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><Link href="/libro-para-colorear-personalizado">Libro para colorear personalizado</Link></li>
            <li><Link href="/foto-para-colorear">Convertir foto para colorear</Link></li>
            <li><Link href="/regalos-personalizados">Regalos personalizados</Link></li>
            <li><Link href="/#precios">Precios</Link></li>
            <li><Link href="/#preguntas">Preguntas frecuentes</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold mb-3">Legal y contacto</p>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><Link href="/legal/aviso-legal">Aviso legal</Link></li>
            <li><Link href="/legal/condiciones">Condiciones de venta</Link></li>
            <li><Link href="/legal/privacidad">Privacidad</Link></li>
            <li><Link href="/legal/cookies">Cookies</Link></li>
            <li><Link href="/legal/privacidad#solicitud">Ejercer mis derechos</Link></li>
            <li><a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60">
          © {new Date().getFullYear()} REGALUMO. Precios en euros con IVA incluido. Productos digitales descargables. Pagos procesados por Stripe.
        </p>
      </div>
    </footer>
  );
}
