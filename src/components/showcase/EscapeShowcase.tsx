"use client";
import { useState } from "react";
import { PrintableHtml } from "@/components/escape/PrintableHtml";
import type { Printable } from "@/lib/escape/generator";

type Sample = { title: string; instructions: string; printable: Printable; accept: string[]; hint: string };

function norm(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

/** Un acertijo real del generador que se puede resolver aquí mismo. */
export function EscapeShowcase({ sample }: { sample: Sample }) {
  const [v, setV] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "ko">("idle");
  const [hint, setHint] = useState(false);
  return (
    <div className="card p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-violet">Acertijo de ejemplo</p>
      <h3 className="font-display text-2xl font-bold mt-1">{sample.title}</h3>
      <p className="mt-1 text-sm">{sample.instructions}</p>
      <div className="mt-3">
        <PrintableHtml p={sample.printable} />
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setState(sample.accept.includes(norm(v)) ? "ok" : "ko");
        }}
      >
        <label htmlFor="sample-answer" className="sr-only">Tu respuesta</label>
        <input id="sample-answer" className="field" value={v} onChange={(e) => setV(e.target.value)} placeholder="Tu respuesta" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done" />
        <button className="btn btn-dark !py-2">Comprobar</button>
      </form>
      {state === "ok" && <p className="mt-2 rounded-xl bg-mint/15 p-2 text-sm font-semibold">¡Correcto! En el juego completo, esta respuesta os daría una letra de la palabra final.</p>}
      {state === "ko" && (
        <p className="mt-2 rounded-xl bg-coral/10 p-2 text-sm font-semibold text-coral-dark">
          Casi.{" "}
          {!hint && (
            <button type="button" className="underline" onClick={() => setHint(true)}>
              ¿Una pista?
            </button>
          )}
        </p>
      )}
      {hint && <p className="mt-2 rounded-xl bg-sun/25 p-2 text-sm">{sample.hint}</p>}
    </div>
  );
}
