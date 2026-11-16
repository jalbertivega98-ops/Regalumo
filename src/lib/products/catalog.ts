/**
 * Registro de productos. Para añadir un producto nuevo:
 * 1. Añade su entrada aquí (id, precio, textos).
 * 2. Implementa su generador en src/lib/<producto>/ (validación + PDF).
 * 3. Regístralo en src/lib/products/generators.ts.
 * El checkout, los pedidos, las descargas y el panel lo recogen solos.
 */
export type ProductId = "newspaper" | "escape" | "coloring";
export type SkuId = ProductId | "pack";

export interface Product {
  id: ProductId;
  name: string;
  short: string;
  /** Precio por defecto en céntimos (EUR). El panel puede sobrescribirlo. */
  defaultPriceCents: number;
  editorPath: string;
  landingPath: string;
  free: string[];
  paid: string[];
  /** Coste variable estimado por generación completa (EUR), sin contar Stripe. */
  estimatedCostEur: number;
  accent: string;
}

export const PRODUCTS: Record<ProductId, Product> = {
  newspaper: {
    id: "newspaper",
    name: "Periódico personalizado",
    short: "Una portada de periódico protagonizada por quien tú quieras.",
    defaultPriceCents: 699,
    editorPath: "/crear/periodico",
    landingPath: "/periodico-personalizado",
    free: [
      "Portada completa con tus textos y fotos",
      "3 plantillas y edición ilimitada",
      "Vista previa en pantalla con marca de agua",
    ],
    paid: [
      "PDF A3 de alta calidad, listo para imprimir",
      "Sin marca de agua",
      "Enlace de descarga seguro durante 30 días",
    ],
    estimatedCostEur: 0.002,
    accent: "#FF6B4A",
  },
  escape: {
    id: "escape",
    name: "Escape room personalizado",
    short: "Una aventura imprimible con historia, acertijos, pistas y soluciones.",
    defaultPriceCents: 999,
    editorPath: "/crear/escape-room",
    landingPath: "/escape-room-personalizado",
    free: [
      "Mini aventura interactiva de 3 acertijos",
      "Generada con la edad, temática y nombres que elijas",
      "Pistas y comprobación de respuestas",
    ],
    paid: [
      "Juego completo de 4 a 10 acertijos según la duración",
      "Guía del organizador, historia para leer en voz alta y tarjetas de pistas",
      "Soluciones, diploma final y PDF imprimible",
    ],
    estimatedCostEur: 0.002,
    accent: "#7C5CFF",
  },
  coloring: {
    id: "coloring",
    name: "Libro para colorear personalizado",
    short: "Tus fotos convertidas en láminas para colorear.",
    defaultPriceCents: 799,
    editorPath: "/crear/libro-colorear",
    landingPath: "/libro-para-colorear-personalizado",
    free: [
      "Muestra real de una página a partir de tu foto",
      "Resolución limitada y marca de agua",
      "Estilos infantil, sencillo y detallado",
    ],
    paid: [
      "Libro de hasta 12 láminas en alta resolución (300 ppp)",
      "Portada con título personalizado",
      "PDF A4 listo para imprimir, sin marca de agua",
    ],
    estimatedCostEur: 0.01,
    accent: "#18B48E",
  },
};

export const PACK = {
  id: "pack" as const,
  name: "Pack 3 regalos",
  short: "Periódico + escape room + libro para colorear.",
  defaultPriceCents: 1999,
};

export const PRODUCT_IDS = Object.keys(PRODUCTS) as ProductId[];

export function isProductId(v: unknown): v is ProductId {
  return typeof v === "string" && v in PRODUCTS;
}

export function formatEur(cents: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}
