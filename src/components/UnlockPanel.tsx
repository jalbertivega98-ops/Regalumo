"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, eur, getPackCredit } from "@/lib/client";
import { PACK, PRODUCTS, type ProductId } from "@/lib/products/catalog";
import { trackStep, visitSource } from "@/lib/track-client";

interface Props {
  product: ProductId;
  projectId: string | null;
  token: string;
  /** Crea el proyecto si aún no existe (p. ej. escape room) y devuelve id y token. */
  ensureProject?: () => Promise<{ id: string; token: string }>;
  disabledReason?: string;
  /** Guarda los cambios pendientes antes de ir al pago, para que el PDF lleve lo último. */
  beforePay?: () => Promise<void>;
}

/** Panel de compra: muestra qué es gratis y qué incluye el pago, y lleva a Stripe Checkout. */
export function UnlockPanel({ product, projectId, token, ensureProject, disabledReason, beforePay }: Props) {
  const info = PRODUCTS[product];
  const [prices, setPrices] = useState<{ single: number; pack: number } | null>(null);
  const [emails, setEmails] = useState(false);
  const [sku, setSku] = useState<"single" | "pack">("single");
  const [email, setEmail] = useState("");
  const [promo, setPromo] = useState("");
  const [promoInfo, setPromoInfo] = useState<string>("");
  const [consent, setConsent] = useState(false);
  const [needConsent, setNeedConsent] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pack, setPack] = useState<{ orderId: string; k: string } | null>(null);

  useEffect(() => {
    Promise.all([api<{ amount: number; emails?: boolean }>(`/api/quote?sku=${product}`), api<{ amount: number }>(`/api/quote?sku=pack`)])
      .then(([a, b]) => {
        setPrices({ single: a.amount, pack: b.amount });
        setEmails(Boolean(a.emails));
      })
      .catch(() => setPrices({ single: info.defaultPriceCents, pack: PACK.defaultPriceCents }));
    const t = setTimeout(() => setPack(getPackCredit()), 0);
    return () => clearTimeout(t);
  }, [product, info.defaultPriceCents]);

  async function applyPromo() {
    setPromoInfo("");
    if (!promo.trim()) return;
    try {
      const q = await api<{ amount: number; promo: { percentOff: number } }>(`/api/quote?sku=${sku === "pack" ? "pack" : product}&promo=${encodeURIComponent(promo)}`);
      setPromoInfo(`Código aplicado: −${q.promo.percentOff} %. Total: ${eur(q.amount)}`);
    } catch (e) {
      setPromoInfo((e as Error).message);
    }
  }

  async function ids() {
    if (ensureProject) return ensureProject();
    if (projectId) return { id: projectId, token };
    throw new Error("Primero crea tu proyecto.");
  }

  async function buy() {
    setError("");
    // El botón nunca se queda «muerto»: si falta la casilla, se señala en vez de no hacer nada.
    if (!consent) {
      setNeedConsent(true);
      consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      consentRef.current?.focus({ preventScroll: true });
      return;
    }
    setBusy(true);
    try {
      const p = await ids();
      await beforePay?.();
      const r = await api<{ url: string }>("/api/checkout", {
        method: "POST",
        token: p.token,
        body: JSON.stringify({ projectId: p.id, sku: sku === "pack" ? "pack" : product, email, promo, consent, ...visitSource() }),
      });
      trackStep("checkout", product);
      window.location.href = r.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function redeemPack() {
    if (!pack) return;
    setBusy(true);
    setError("");
    try {
      const p = await ids();
      await beforePay?.();
      await api(`/api/orders/${pack.orderId}/redeem`, { method: "POST", token: p.token, body: JSON.stringify({ k: pack.k, projectId: p.id }) });
      window.location.href = `/pedido/${pack.orderId}?k=${encodeURIComponent(pack.k)}`;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const price = prices ? (sku === "pack" ? prices.pack : prices.single) : null;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="unlock-title">
      <h2 id="unlock-title" className="font-display text-2xl font-bold">¿Te gusta? Descárgalo completo</h2>
      <div className="mt-4 rounded-2xl bg-ink p-4 text-sm text-white">
        <p className="mb-2 font-bold">Al pagar {price !== null ? eur(price) : ""}{sku === "pack" ? " (pack de 3)" : ""}</p>
        <ul className="space-y-1.5">
          {info.paid.map((f) => (
            <li key={f} className="flex gap-2"><span aria-hidden className="text-sun">★</span>{f}</li>
          ))}
        </ul>
      </div>

      {pack && (
        <div className="mt-4 rounded-2xl border-2 border-mint p-4 text-sm">
          <p className="font-bold">Tienes un pack de 3 regalos.</p>
          <p className="mt-1">Puedes usar tu hueco de «{info.name}» sin pagar de nuevo.</p>
          <button className="btn btn-dark mt-3 !py-2" onClick={redeemPack} disabled={busy || !!disabledReason}>
            Usar mi pack para este regalo
          </button>
        </div>
      )}

      <fieldset className="mt-5 grid gap-2 sm:grid-cols-2">
        <legend className="label">Elige</legend>
        <label className={`rounded-2xl border-2 p-3 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet ${sku === "single" ? "border-ink" : "border-line"}`}>
          <input type="radio" name="sku" className="sr-only" checked={sku === "single"} onChange={() => setSku("single")} />
          <span className="font-bold block">{info.name}</span>
          <span className="text-lg font-display font-bold">{prices ? eur(prices.single) : "…"}</span>
        </label>
        <label className={`rounded-2xl border-2 p-3 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet ${sku === "pack" ? "border-ink" : "border-line"}`}>
          <input type="radio" name="sku" className="sr-only" checked={sku === "pack"} onChange={() => setSku("pack")} />
          <span className="font-bold block">{PACK.name}</span>
          <span className="text-lg font-display font-bold">{prices ? eur(prices.pack) : "…"}</span>
          <span className="hint block">Este regalo + los otros dos productos cuando quieras.{prices ? ` Sale a ${eur(Math.floor(prices.pack / 3))} cada uno.` : ""}</span>
        </label>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="unlock-email">{emails ? "Correo para recibir el enlace (opcional)" : "Tu correo (opcional, por si necesitas ayuda con el pedido)"}</label>
          <input id="unlock-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" autoComplete="email" />
        </div>
        <details className="self-end" open={!!promo}>
          <summary className="cursor-pointer list-none py-3 text-sm font-semibold underline">¿Tienes un código promocional?</summary>
        <div>
          <label className="sr-only" htmlFor="unlock-promo">Código promocional</label>
          <div className="flex gap-2">
            <input id="unlock-promo" className="field" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Opcional" />
            <button type="button" className="btn btn-ghost !py-2" onClick={applyPromo}>Aplicar</button>
          </div>
          {promoInfo && <p className="hint mt-1">{promoInfo}</p>}
        </div>
        </details>
      </div>

      <label className={`mt-4 flex gap-3 text-sm items-start rounded-2xl p-2 -mx-2 ${needConsent && !consent ? "bg-coral/10 ring-2 ring-coral" : ""}`}>
        <input
          ref={consentRef}
          type="checkbox"
          className="mt-1 size-5 shrink-0 accent-[#1E1633]"
          checked={consent}
          aria-invalid={needConsent && !consent}
          aria-describedby={needConsent && !consent ? "unlock-consent-msg" : undefined}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Quiero recibir el contenido digital de inmediato y acepto que, una vez iniciada la descarga, pierdo el derecho de desistimiento.
          He leído las <Link href="/legal/condiciones" className="underline" target="_blank">condiciones de venta</Link>.
        </span>
      </label>

      {error && <p role="alert" className="mt-3 rounded-xl bg-coral/10 p-3 text-sm font-semibold text-coral-dark">{error}</p>}
      {disabledReason && <p className="mt-3 hint">{disabledReason}</p>}

      {needConsent && !consent && !disabledReason && (
        <p id="unlock-consent-msg" role="alert" className="mt-3 text-sm font-semibold text-coral-dark">
          Falta un paso: marca la casilla de arriba para poder pagar.
        </p>
      )}

      <button className="btn btn-primary mt-5 w-full text-lg" onClick={buy} disabled={busy || !!disabledReason}>
        {busy ? "Abriendo pago seguro…" : `Pagar ${price !== null ? eur(price) : ""} y descargar`}
      </button>
      <p className="hint mt-2 text-center">Pago seguro con Stripe. No guardamos los datos de tu tarjeta.</p>
    </section>
  );
}
