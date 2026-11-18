import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/content/seo";
import { config } from "@/lib/config";

/**
 * Fecha de la última revisión del contenido público. Cámbiala al editar textos:
 * Google solo se fía de «lastmod» si no cambia en cada despliegue.
 */
const CONTENT_UPDATED = new Date("2026-11-18");

/**
 * Solo páginas públicas indexables. Nunca proyectos, pedidos, fotos ni el panel.
 * /crear y los editores quedan fuera: llevan «noindex» (ver next.config.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_UPDATED;
  return [
    { url: `${config.siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    ...SEO_PAGES.map((p) => ({
      url: `${config.siteUrl}/${p.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: p.product === "all" ? 0.9 : 0.8,
    })),
    ...["aviso-legal", "condiciones", "privacidad", "cookies"].map((s) => ({ url: `${config.siteUrl}/legal/${s}`, lastModified, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
