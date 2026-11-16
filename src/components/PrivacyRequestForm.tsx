"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export function PrivacyRequestForm() {
  const [f, setF] = useState({ type: "supresion", email: "", message: "" });
  const [state, setState] = useState<"idle" | "sent" | string>("idle");
  if (state === "sent") return <p className="card mt-4 p-5 font-semibold">Hemos recibido tu solicitud. Te responderemos por correo.</p>;
  return (
    <form
      className="card mt-4 space-y-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api("/api/privacy/request", { method: "POST", body: JSON.stringify(f) });
          setState("sent");
        } catch (err) {
          setState((err as Error).message);
        }
      }}
    >
      <div>
        <label className="label" htmlFor="rq-type">Tipo de solicitud</label>
        <select id="rq-type" className="field" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="supresion">Borrar mis datos</option>
          <option value="acceso">Saber qué datos tenéis</option>
          <option value="soporte">Ayuda con un pedido</option>
          <option value="otro">Otra</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="rq-email">Tu correo</label>
        <input id="rq-email" type="email" required className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="rq-msg">Detalles (número de pedido, etc.)</label>
        <textarea id="rq-msg" rows={4} maxLength={2000} className="field" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </div>
      {state !== "idle" && <p className="text-sm font-semibold text-coral-dark">{state}</p>}
      <button className="btn btn-dark">Enviar solicitud</button>
    </form>
  );
}
