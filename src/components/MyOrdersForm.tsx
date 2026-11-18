"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export function MyOrdersForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  if (state === "sent")
    return (
      <div className="card p-6" role="status">
        <p className="font-display text-2xl font-bold">Revisa tu correo 📬</p>
        <p className="mt-2">
          Si <b>{email}</b> tiene pedidos en REGALUMO, te acabamos de enviar un enlace para verlos. Llega en un minuto; mira también en spam o promociones.
        </p>
        <button type="button" className="btn btn-ghost mt-4 !py-2" onClick={() => setState("idle")}>
          Probar con otro correo
        </button>
      </div>
    );

  return (
    <form
      className="card space-y-3 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setState("sending");
        try {
          await api("/api/mis-pedidos", { method: "POST", body: JSON.stringify({ email }) });
          setState("sent");
        } catch (err) {
          setError((err as Error).message);
          setState("idle");
        }
      }}
    >
      <label className="label" htmlFor="mp-email">El correo con el que pagaste</label>
      <input
        id="mp-email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="tu@correo.com"
        className="field"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p role="alert" className="text-sm font-semibold text-coral-dark">{error}</p>}
      <button className="btn btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Enviarme el enlace"}
      </button>
      <p className="hint">Sin contraseñas: te mandamos un enlace que funciona 24 horas.</p>
    </form>
  );
}
