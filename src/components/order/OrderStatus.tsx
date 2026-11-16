"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, eur, saveOrderKey, savePackCredit } from "@/lib/client";

type Item = { product: string; name: string; editorPath: string; projectId: string | null; ready: boolean; downloadUrl: string | null };
type OrderDto = { id: string; sku: string; status: string; amountCents: number; expired: boolean; provider: string; items: Item[] };

export function OrderStatus({ id, k }: { id: string; k: string }) {
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
        {tries > 15 && <p className="mt-3 hint">Está tardando más de lo normal. Si has pagado, recibirás el enlace por correo en cuanto se confirme. Puedes recargar esta página.</p>}
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
        <p className="mt-2 text-ink-soft">Guarda esta página en favoritos: es tu enlace privado de descarga durante 30 días.</p>
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
