import type { Metadata } from "next";
import { config } from "@/lib/config";

/**
 * Next.js sustituye por completo `openGraph` y `twitter` del layout cuando una
 * página define los suyos. Este ayudante los rellena enteros (nombre del sitio,
 * idioma e imagen) para que WhatsApp, Facebook o X muestren siempre la tarjeta.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  /** Ruta de la imagen 1200×630. Por defecto, la imagen general de la marca. */
  image?: string;
  imageAlt?: string;
}): Metadata {
  const image = { url: opts.image ?? "/opengraph-image", width: 1200, height: 630, alt: opts.imageAlt ?? `${config.siteName} · ${config.slogan}` };
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: config.siteName,
      url: opts.path,
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
  };
}
