import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/content/seo";
import { config } from "@/lib/config";

/** Solo páginas públicas. Nunca proyectos, pedidos, fotos ni el panel. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${config.siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${config.siteUrl}/crear`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...SEO_PAGES.map((p) => ({ url: `${config.siteUrl}/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: p.slug === "regalos-personalizados" ? 0.9 : 0.8 })),
    ...["aviso-legal", "condiciones", "privacidad", "cookies"].map((s) => ({ url: `${config.siteUrl}/legal/${s}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
