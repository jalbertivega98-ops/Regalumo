"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, eur } from "@/lib/client";

export function AdminLogin() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="grid min-h-screen place-items-center bg-shell p-4">
      <form
        className="card w-full max-w-sm space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: pw }) });
            window.location.reload();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <h1 className="font-display text-2xl font-bold">Panel de REGALUMO</h1>
        <div>
          <label className="label" htmlFor="pw">Contraseña</label>
          <input id="pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p className="text-sm font-semibold text-coral-dark">{error}</p>}
        <button className="btn btn-dark w-full">Entrar</button>
      </form>
    </div>
  );
}

export function AdminLogout() {
  return (
    <button
      className="text-sm underline"
      onClick={async () => {
        await api("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin";
      }}
    >
      Salir
    </button>
  );
}

export function PricesForm({ initial, labels }: { initial: Record<string, number>; labels: Record<string, string> }) {
  const [v, setV] = useState(() => Object.fromEntries(Object.entries(initial).map(([k, c]) => [k, (c / 100).toFixed(2)])));
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg("");
        try {
          const body = Object.fromEntries(Object.entries(v).map(([k, s]) => [k, Math.round(Number(String(s).replace(",", ".")) * 100)]));
          await api("/api/admin/prices", { method: "PUT", body: JSON.stringify(body) });
          setMsg("Precios guardados. Se aplican a los nuevos pagos y a la web en unos minutos.");
          router.refresh();
        } catch (err) {
          setMsg((err as Error).message);
        }
      }}
    >
      {Object.keys(v).map((k) => (
        <div key={k} className="flex items-center gap-3">
          <label className="w-56 font-semibold" htmlFor={`price-${k}`}>{labels[k]}</label>
          <input id={`price-${k}`} className="field max-w-32" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
          <span className="hint">€ (actual {eur(initial[k])})</span>
        </div>
      ))}
      <button className="btn btn-dark">Guardar precios</button>
      {msg && <p className="hint">{msg}</p>}
    </form>
  );
}

export function PromoForm() {
  const [f, setF] = useState({ code: "", percentOff: "10", maxUses: "", expiresAt: "" });
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <form
      className="card grid gap-3 p-5 sm:grid-cols-5 sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("/api/admin/promos", { method: "POST", body: JSON.stringify(f) });
          setMsg("Código guardado.");
          setF({ code: "", percentOff: "10", maxUses: "", expiresAt: "" });
          router.refresh();
        } catch (err) {
          setMsg((err as Error).message);
        }
      }}
    >
      <div><label className="label" htmlFor="pc">Código</label><input id="pc" className="field" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="NAVIDAD10" /></div>
      <div><label className="label" htmlFor="pp">Descuento %</label><input id="pp" className="field" inputMode="numeric" value={f.percentOff} onChange={(e) => setF({ ...f, percentOff: e.target.value })} /></div>
      <div><label className="label" htmlFor="pm">Usos máximos</label><input id="pm" className="field" inputMode="numeric" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} placeholder="Sin límite" /></div>
      <div><label className="label" htmlFor="pe">Caduca</label><input id="pe" type="date" className="field" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
      <button className="btn btn-dark">Crear o actualizar</button>
      {msg && <p className="hint sm:col-span-5">{msg}</p>}
    </form>
  );
}

export function PromoToggle({ promo }: { promo: { code: string; percentOff: number; active: boolean; maxUses?: number; expiresAt?: string } }) {
  const router = useRouter();
  return (
    <button
      className="underline text-sm"
      onClick={async () => {
        await api("/api/admin/promos", { method: "POST", body: JSON.stringify({ ...promo, active: !promo.active }) });
        router.refresh();
      }}
    >
      {promo.active ? "Desactivar" : "Activar"}
    </button>
  );
}

export function RequestToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  return (
    <button
      className="underline text-sm"
      onClick={async () => {
        await api("/api/admin/requests", { method: "PATCH", body: JSON.stringify({ id, status: status === "resuelta" ? "pendiente" : "resuelta" }) });
        router.refresh();
      }}
    >
      Marcar como {status === "resuelta" ? "pendiente" : "resuelta"}
    </button>
  );
}
