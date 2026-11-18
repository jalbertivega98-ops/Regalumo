import { describe, expect, it } from "vitest";
import { HOME_FAQ, SEO_PAGES, getSeoPage } from "@/content/seo";

describe("páginas para Google", () => {
  it("cada página tiene dirección, título, H1 y descripción únicos", () => {
    for (const key of ["slug", "title", "h1", "description", "label"] as const) {
      const values = SEO_PAGES.map((p) => p[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  it("títulos y descripciones caben en el resultado de Google", () => {
    for (const p of SEO_PAGES) {
      // + « · REGALUMO» (11) debe quedar en unos 60 caracteres.
      expect(p.title.length, p.slug).toBeLessThanOrEqual(52);
      expect(p.description.length, p.slug).toBeGreaterThanOrEqual(110);
      expect(p.description.length, p.slug).toBeLessThanOrEqual(160);
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("los enlaces relacionados apuntan a páginas que existen y no a sí mismas", () => {
    for (const p of SEO_PAGES) {
      expect(p.related.length).toBeGreaterThan(0);
      for (const r of p.related) {
        expect(getSeoPage(r), `${p.slug} → ${r}`).toBeDefined();
        expect(r).not.toBe(p.slug);
      }
    }
  });

  it("todas las páginas tienen preguntas frecuentes y contenido", () => {
    for (const p of [...SEO_PAGES]) {
      expect(p.faq.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.sections.length, p.slug).toBeGreaterThanOrEqual(3);
    }
    expect(HOME_FAQ.length).toBeGreaterThan(0);
  });
});
