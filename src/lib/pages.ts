import { SEO_PAGES } from "@/content/seo";
import { EDITOR_PATHS } from "./traffic";

const STATIC = new Set(["/", "/crear", "/mis-pedidos", ...Object.keys(EDITOR_PATHS), ...SEO_PAGES.map((p) => `/${p.slug}`)]);

/**
 * Página pública conocida para las estadísticas, o «otras». Las páginas de pedido se agrupan
 * para no guardar nunca el identificador de un pedido.
 */
export function pageKey(path: unknown): string {
  if (typeof path !== "string") return "otras";
  const p = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (STATIC.has(p)) return p;
  if (p.startsWith("/pedido/")) return "/pedido";
  if (/^\/legal\/[a-z-]{1,30}$/.test(p)) return "/legal";
  return "otras";
}

/** Nombre legible de una página para el panel. */
export function pageLabel(key: string) {
  if (key === "/") return "Portada";
  if (key === "/crear") return "Elegir regalo (/crear)";
  if (key === "/pedido") return "Página del pedido (tras pagar)";
  if (key === "/legal") return "Textos legales";
  if (key === "/mis-pedidos") return "Mis pedidos";
  if (key === "otras") return "Otras";
  const editor: Record<string, string> = { "/crear/periodico": "Editor del periódico", "/crear/escape-room": "Editor del escape room", "/crear/libro-colorear": "Editor del libro para colorear" };
  return editor[key] ?? key;
}
