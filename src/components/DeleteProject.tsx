"use client";
import { useState } from "react";
import { api, forgetToken } from "@/lib/client";

/** Borrado inmediato del proyecto y de todas sus fotos. */
export function DeleteProject({ projectId, token, redirect }: { projectId: string; token: string; redirect: string }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask)
    return (
      <button type="button" className="text-sm underline text-ink-soft" onClick={() => setAsk(true)}>
        Borrar este proyecto y sus fotos
      </button>
    );
  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white p-3 text-sm">
      <span>¿Seguro? Se borrará todo y no se puede deshacer.</span>
      <button
        type="button"
        disabled={busy}
        className="btn btn-dark !py-1.5 !px-3"
        onClick={async () => {
          setBusy(true);
          await api(`/api/projects/${projectId}`, { method: "DELETE", token }).catch(() => {});
          forgetToken(projectId);
          window.location.href = redirect;
        }}
      >
        Sí, borrar
      </button>
      <button type="button" className="underline" onClick={() => setAsk(false)}>Cancelar</button>
    </div>
  );
}
