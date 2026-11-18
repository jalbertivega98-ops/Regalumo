import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { orderSummary, ordersForCustomer, readAccessToken } from "@/lib/customers";
import { MyOrdersForm } from "@/components/MyOrdersForm";

export const metadata: Metadata = {
  title: "Mis pedidos",
  description: "Recupera tus regalos de REGALUMO con el correo con el que pagaste, sin contraseña.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const key = t ? readAccessToken(t) : null;
  const emails = Boolean(config.email.resendKey);

  if (key) {
    const orders = (await ordersForCustomer(key)).map(orderSummary);
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-4xl font-black">Mis pedidos</h1>
        <p className="mt-2 text-ink-soft">Todos los regalos que has comprado con este correo.</p>
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="card p-5">No hemos encontrado pedidos pagados con este correo.</p>}
          {orders.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-lg font-bold">{o.name}</p>
                <p className="hint">
                  {fmtDate(o.date)} · {o.total}
                  {o.status === "refunded" ? " · Reembolsado" : o.expired ? " · Descarga caducada" : ""}
                </p>
              </div>
              {o.status === "paid" && !o.expired ? (
                <Link className="btn btn-primary" href={o.path}>Ver y descargar</Link>
              ) : (
                <Link className="btn btn-ghost" href={o.path}>Ver pedido</Link>
              )}
            </div>
          ))}
        </div>
        <p className="hint mt-6">
          Este enlace es personal: no lo compartas. ¿Algún problema? Escríbenos a <a className="underline" href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-4xl font-black">Mis pedidos</h1>
      <p className="mt-2 text-ink-soft">¿Has perdido el enlace de descarga? Recupera todos tus regalos con el correo con el que pagaste.</p>
      {t && (
        <p role="alert" className="mt-4 rounded-xl bg-coral/10 p-4 font-semibold text-coral-dark">
          Este enlace ha caducado o no es válido. Pide uno nuevo aquí abajo.
        </p>
      )}
      <div className="mt-6">
        {emails ? (
          <MyOrdersForm />
        ) : (
          <div className="card p-6">
            <p>
              Escríbenos a <a className="font-bold underline" href={`mailto:${config.contactEmail}?subject=Mis%20pedidos`}>{config.contactEmail}</a> desde el correo con el que pagaste y te mandamos tus enlaces de descarga.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
