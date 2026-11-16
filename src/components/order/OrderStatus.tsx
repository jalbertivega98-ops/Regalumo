"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, eur, saveOrderKey, savePackCredit } from "@/lib/client";

type Item = { product: string; name: string; editorPath: string; projectId: string | null; ready: boolean; downloadUrl: string | null };
type OrderDto = { id: string; sku: string; status: string; amountCents: number; expired: boolean; provider: string; items: Item[] };

function CopyLink() {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      window.prompt("Copia este enlace:", window.location.href);
    }
  };
  return (
    <button type="button" className="btn btn-ghost !py-2" onClick={copy} aria-live="polite">
      {done ? "¡Enlace copiado!" : "Copiar mi enlace"}
    </button>
  );
}

export function OrderStatus({ id, k, emails = false, contact }: { id: string; k: string; emails?: boolean; contact?: string }) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    saveOrderKey(id, k);
    let stop = false;
    const load = async () => {
      try {
        const o = await api<OrderDto>(`/api/orders/${id}?k=${encodeURIComponent(k)}`);
        if (stop) return;
        setOrder(o);
        if (o.status === "paid" && o.sku === "pack" && o.items.some((i) => !i.projectId)) savePackCredit(id, k);
        if (o.status === "pending") {
          setTries((t) => t + 1);
          setTimeout(load, 2000);
        }
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
    };
    load();
    return () => {
      stop = true;
    };
  }, [id, k]);

  if (error) return <p role="alert" className="rounded-xl bg-coral/10 p-4 font-semibold text-coral-dark">{error}</p>;
  if (!order) return <p>Cargando tu pedido…</p>;

  if (order.status === "pending")
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-2xl font-bold">Confirmando tu pago…</p>
        <p className="mt-2 text-ink-soft">Esperamos la confirmación segura de Stripe. Suele tardar unos segundos.</p>
        {tries > 15 && <p className="mt-3 hint">Está tardando más de lo normal. Si has pagado, recarga esta página en un minuto. No la cierres: es tu enlace de descarga.</p>}
      </div>
    );

  if (order.status !== "paid")
    return (
      <div className="card p-6">
        <p className="font-display text-2xl font-bold">El pago no se ha completado</p>
        <p className="mt-2">Estado: {order.status === "refunded" ? "reembolsado" : "no completado"}. No se ha realizado ningún cargo si el pago falló.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <p className="text-mint font-bold">Pago confirmado · {eur(order.amountCents)}</p>
        <h1 className="font-display text-3xl font-black mt-1">¡Tu regalo está listo!</h1>
        <div className="mt-4 rounded-2xl bg-sun/25 p-4">
          <p className="font-bold">Guarda este enlace: es tu acceso privado de descarga durante 30 días.</p>
          <p className="mt-1 text-sm text-ink-soft">
            {emails
              ? "Si dejaste tu correo, también te lo hemos enviado."
              : "Cópialo o añade esta página a favoritos. Si lo pierdes, escríbenos" + (contact ? ` a ${contact}` : "") + " con el correo con el que pagaste."}
          </p>
          <div className="mt-3"><CopyLink /></div>
        </div>
        {order.provider === "mock" && <p className="mt-2 rounded-xl bg-sun/30 p-2 text-sm font-semibold">Pedido de prueba con pago simulado (entorno de desarrollo).</p>}
      </div>
      {order.items.map((it) => (
        <div key={it.product} className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-bold text-lg">{it.name}</p>
            <p className="hint">{it.ready ? "PDF de alta calidad, sin marca de agua" : "Incluido en tu pack: créalo cuando quieras"}</p>
          </div>
          {it.downloadUrl ? (
            <a className="btn btn-primary" href={it.downloadUrl}>Descargar PDF</a>
          ) : order.expired ? (
            <span className="hint">Enlace caducado</span>
          ) : (
            <Link className="btn btn-ghost" href={it.editorPath}>Crear ahora</Link>
          )}
        </div>
      ))}
      <p className="hint text-center">La primera descarga puede tardar unos segundos mientras generamos el archivo en alta resolución.</p>
    </div>
  );
}
