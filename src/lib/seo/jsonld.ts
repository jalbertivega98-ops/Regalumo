import type { SeoPage } from "@/content/seo";
import { config } from "@/lib/config";
import { PRODUCTS } from "@/lib/products/catalog";

/** Datos estructurados (schema.org) compartidos por las páginas públicas. */

const ORG_ID = () => `${config.siteUrl}/#organizacion`;
const SITE_ID = () => `${config.siteUrl}/#web`;

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": ORG_ID(),
    name: config.siteName,
    url: `${config.siteUrl}/`,
    logo: `${config.siteUrl}/icon.svg`,
    slogan: config.slogan,
    email: config.contactEmail,
    areaServed: "ES",
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: config.contactEmail, availableLanguage: "es" },
  };
}

export function websiteJsonLd() {
  return { "@type": "WebSite", "@id": SITE_ID(), name: config.siteName, url: `${config.siteUrl}/`, inLanguage: "es-ES", publisher: { "@id": ORG_ID() } };
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

/** Grafo de una página de aterrizaje: migas, preguntas frecuentes y, si es de un producto, su ficha con precio real. */
export function landingJsonLd(page: SeoPage, prices: Record<string, number>) {
  const url = `${config.siteUrl}/${page.slug}`;
  const graph: object[] = [
    // Se repiten la empresa y la web para que las referencias por @id se resuelvan en esta misma página.
    organizationJsonLd(),
    websiteJsonLd(),
    {
      "@type": "WebPage",
      "@id": `${url}#pagina`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: "es-ES",
      isPartOf: { "@id": SITE_ID() },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${config.siteUrl}/` },
        { "@type": "ListItem", position: 2, name: page.eyebrow, item: url },
      ],
    },
    faqJsonLd(page.faq),
  ];
  if (page.product !== "all") {
    const product = PRODUCTS[page.product];
    graph.push({
      "@type": "Product",
      name: product.name,
      description: product.short,
      sku: product.id,
      image: `${config.siteUrl}/og/${page.slug}`,
      brand: { "@type": "Brand", name: config.siteName },
      url,
      offers: {
        "@type": "Offer",
        price: (prices[product.id] / 100).toFixed(2),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url,
        seller: { "@id": ORG_ID() },
        // Producto digital: se descarga al momento, sin gastos de envío.
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "EUR" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
          },
        },
        // Contenido digital personalizado: sin desistimiento una vez iniciada la descarga (art. 103.m TRLGDCU).
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "ES",
          returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        },
      },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
