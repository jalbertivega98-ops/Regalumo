"use client";
import { classifySource, cleanCampaign, EDITOR_PATHS, type ClientStep, type SourceId } from "./traffic";

/**
 * Analítica del navegador sin cookies. En sessionStorage (solo esta pestaña, se borra al cerrarla)
 * se guardan marcas como «ya contada» y el origen de la visita («google», «tiktok»…).
 * No hay identificadores: al servidor solo llegan sumas.
 */

function send(body: Record<string, unknown>) {
  fetch("/api/track", { method: "POST", body: JSON.stringify(body), keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
}

function ss(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null; // navegación privada estricta
  }
}

/** Origen y campaña de esta visita (los mismos durante toda la pestaña). */
export function visitSource(): { src: SourceId; camp: string } {
  const s = ss();
  return { src: (s?.getItem("rg_src") as SourceId) || "directo", camp: s?.getItem("rg_camp") || "" };
}

const ME = "rg_yo";
/** El navegador del dueño (ha abierto /admin) no cuenta en las estadísticas. */
function isOwner() {
  try {
    return window.localStorage.getItem(ME) === "1";
  } catch {
    return false;
  }
}
export function markOwner() {
  try {
    window.localStorage.setItem(ME, "1");
  } catch {}
}

/** Llamar en cada cambio de página. */
export function trackPage(path: string) {
  if (isOwner()) return;
  const s = ss();
  if (s && !s.getItem("rg_s")) {
    const q = new URLSearchParams(window.location.search);
    let host = "";
    try {
      host = document.referrer ? new URL(document.referrer).hostname : "";
    } catch {}
    const src = classifySource({ utmSource: q.get("utm_source"), referrerHost: host, ownHost: window.location.hostname });
    const camp = cleanCampaign(q.get("utm_campaign"));
    s.setItem("rg_s", "1");
    s.setItem("rg_src", src);
    if (camp) s.setItem("rg_camp", camp);
    send({ event: "session", src, camp, path });
  }
  send({ event: "pageview", path });
  const product = EDITOR_PATHS[path as keyof typeof EDITOR_PATHS];
  if (product) trackStep("open", product);
}

/** Paso del embudo: cuenta una vez por pestaña (total) y una vez por producto. */
export function trackStep(step: ClientStep, product?: string) {
  if (isOwner()) return;
  const s = ss();
  const kAll = `rg_f_${step}`;
  const kProd = `rg_f_${step}_${product ?? ""}`;
  if (s?.getItem(kProd)) return;
  const first = !s?.getItem(kAll);
  s?.setItem(kAll, "1");
  s?.setItem(kProd, "1");
  send({ event: "step", step, product, first, src: visitSource().src });
}
