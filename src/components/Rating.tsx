"use client";
import { useState } from "react";
import { api } from "@/lib/client";

/** Valoración del resultado antes de comprar. */
export function Rating({ projectId, token }: { projectId: string; token: string }) {
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  async function send(v: number, c = comment) {
    setValue(v);
    try {
      await api(`/api/projects/${projectId}/rating`, { method: "POST", token, body: JSON.stringify({ rating: v, comment: c }) });
      setSent(true);
    } catch {
      /* no es crítico */
    }
  }
  return (
    <div className="card p-4 text-center">
      <p className="font-bold">¿Qué te parece el resultado?</p>
      <div className="mt-2 flex justify-center gap-1" role="radiogroup" aria-label="Valoración de 1 a 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} de 5`} onClick={() => send(n)} className={`text-3xl transition ${n <= value ? "text-sun scale-110" : "text-line hover:text-sun/70"}`}>
            ★
          </button>
        ))}
      </div>
      {value > 0 && value < 4 && (
        <div className="mt-3 flex gap-2">
          <input className="field text-sm" placeholder="¿Qué mejorarías? (opcional)" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="button" className="btn btn-ghost !py-2 text-sm" onClick={() => send(value, comment)}>Enviar</button>
        </div>
      )}
      {sent && <p className="hint mt-2">¡Gracias! Tu opinión nos ayuda a mejorar.</p>}
    </div>
  );
}
