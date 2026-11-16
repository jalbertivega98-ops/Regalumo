"use client";
/** Utilidades del navegador: llamadas a la API y token de propiedad anónima del proyecto. */

export async function api<T = unknown>(url: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.token) headers.set("x-project-token", opts.token);
  if (opts.body && !(opts.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...opts, headers });
  const data = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
  if (!res.ok) throw new Error(data?.error || "No se ha podido completar la acción.");
  return data as T;
}

const key = (id: string) => `rg_tok_${id}`;

export function saveToken(id: string, token: string) {
  try {
    localStorage.setItem(key(id), token);
  } catch {}
}
export function getToken(id: string) {
  try {
    return localStorage.getItem(key(id)) || "";
  } catch {
    return "";
  }
}
export function forgetToken(id: string) {
  try {
    localStorage.removeItem(key(id));
  } catch {}
}

export function saveOrderKey(orderId: string, k: string) {
  try {
    localStorage.setItem(`rg_ord_${orderId}`, k);
  } catch {}
}
export function getOrderKey(orderId: string) {
  try {
    return localStorage.getItem(`rg_ord_${orderId}`) || "";
  } catch {
    return "";
  }
}

/** Pack pendiente de usar (se guarda al comprar el pack). */
export function getPackCredit(): { orderId: string; k: string } | null {
  try {
    const v = localStorage.getItem("rg_pack");
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
export function savePackCredit(orderId: string, k: string) {
  try {
    localStorage.setItem("rg_pack", JSON.stringify({ orderId, k }));
  } catch {}
}

export const eur = (cents: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export function debounce<T extends unknown[]>(fn: (...a: T) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: T) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
