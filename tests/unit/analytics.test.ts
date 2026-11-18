import { describe, expect, it, vi } from "vitest";

await vi.hoisted(async () => {
  const { mkdtempSync } = await import("fs");
  const { tmpdir } = await import("os");
  const path = await import("path");
  process.env.LOCAL_DATA_DIR = mkdtempSync(path.join(tmpdir(), "regalumo-analytics-"));
  process.env.APP_SECRET = "test-secret";
});

import { classifySource, cleanCampaign, isBot } from "@/lib/traffic";
import { pageKey } from "@/lib/pages";
import { statsSince } from "@/lib/analytics";
import { getStore } from "@/lib/store";
import { POST as trackRoute } from "@/app/api/track/route";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const send = (body: unknown, ua = UA) =>
  trackRoute(new Request("http://x/api/track", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "user-agent": ua } }));

describe("origen de las visitas", () => {
  it("clasifica por utm_source antes que por el dominio", () => {
    expect(classifySource({ utmSource: "WhatsApp", referrerHost: "www.google.es" })).toBe("whatsapp");
    expect(classifySource({ utmSource: "mi-boletin" })).toBe("campana");
    expect(classifySource({ utmSource: "pinterest" })).toBe("pinterest");
  });
  it("reconoce los dominios habituales", () => {
    expect(classifySource({ referrerHost: "www.google.es" })).toBe("google");
    expect(classifySource({ referrerHost: "www.google.com" })).toBe("google");
    expect(classifySource({ referrerHost: "m.facebook.com" })).toBe("facebook");
    expect(classifySource({ referrerHost: "l.instagram.com" })).toBe("instagram");
    expect(classifySource({ referrerHost: "www.tiktok.com" })).toBe("tiktok");
    expect(classifySource({ referrerHost: "pin.it" })).toBe("pinterest");
    expect(classifySource({ referrerHost: "es.pinterest.com" })).toBe("pinterest");
    expect(classifySource({ referrerHost: "chatgpt.com" })).toBe("ia");
    expect(classifySource({ referrerHost: "duckduckgo.com" })).toBe("buscadores");
    expect(classifySource({ referrerHost: "unblog.es" })).toBe("blogs");
    expect(classifySource({ referrerHost: "" })).toBe("directo");
  });
  it("la propia web y Stripe cuentan como directo, no como otra web", () => {
    expect(classifySource({ referrerHost: "regalumo.es", ownHost: "regalumo.es" })).toBe("directo");
    expect(classifySource({ referrerHost: "www.regalumo.es", ownHost: "regalumo.es" })).toBe("directo");
    expect(classifySource({ referrerHost: "checkout.stripe.com", ownHost: "regalumo.es" })).toBe("directo");
  });
  it("limpia el nombre de campaña", () => {
    expect(cleanCampaign("Navidad 2026 ¡Ñu!")).toBe("navidad-2026-nu");
    expect(cleanCampaign("x".repeat(80))).toHaveLength(40);
    expect(cleanCampaign(undefined)).toBe("");
  });
  it("descarta robots", () => {
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("Mozilla/5.0 HeadlessChrome/120")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot(UA)).toBe(false);
  });
});

describe("páginas", () => {
  it("solo guarda páginas conocidas y nunca el id de un pedido", () => {
    expect(pageKey("/")).toBe("/");
    expect(pageKey("/crear/periodico?p=abc")).toBe("/crear/periodico");
    expect(pageKey("/periodico-personalizado/")).toBe("/periodico-personalizado");
    expect(pageKey("/pedido/ord_123456")).toBe("/pedido");
    expect(pageKey("/legal/privacidad")).toBe("/legal");
    expect(pageKey("/lo-que-sea-inventado")).toBe("otras");
    expect(pageKey(42)).toBe("otras");
  });
});

describe("/api/track", () => {
  it("suma visitas, origen, páginas y pasos del embudo", async () => {
    await send({ event: "session", src: "tiktok", camp: "Navidad", path: "/crear/periodico" });
    await send({ event: "pageview", path: "/crear/periodico" });
    await send({ event: "step", step: "open", product: "newspaper", first: true, src: "tiktok" });
    await send({ event: "step", step: "open", product: "coloring", first: false, src: "tiktok" });
    await send({ event: "step", step: "inventado", product: "newspaper", first: true });
    await send({ event: "session", src: "no-existe", path: "/x" });
    await send({ event: "session", src: "google" }, "Googlebot/2.1");

    const { totals } = await statsSince(1);
    expect(totals["session"]).toBe(2);
    expect(totals["src:tiktok"]).toBe(1);
    expect(totals["src:directo"]).toBe(1);
    expect(totals["src:google"]).toBeUndefined();
    expect(totals["camp:tiktok|navidad"]).toBe(1);
    expect(totals["land:/crear/periodico"]).toBe(1);
    expect(totals["land:otras"]).toBe(1);
    expect(totals["dev:movil"]).toBe(2);
    expect(totals["pv:/crear/periodico"]).toBe(1);
    expect(totals["f:open"]).toBe(1);
    expect(totals["fs:tiktok:open"]).toBe(1);
    expect(totals["f:open:newspaper"]).toBe(1);
    expect(totals["f:open:coloring"]).toBe(1);
    expect(Object.keys(totals).some((k) => k.includes("inventado"))).toBe(false);
  });

  it("statsSince ignora los días fuera del periodo", async () => {
    await getStore().incr("stat:2001-01-01:session", 5);
    const { totals } = await statsSince(1);
    expect(totals["session"]).toBe(2);
  });
});

describe("compras en el embudo", () => {
  it("atribuye la compra y los ingresos al origen guardado en el pedido", async () => {
    const { createProject } = await import("@/lib/projects");
    const { fulfillOrder } = await import("@/lib/payments/orders");
    const { project } = await createProject("coloring", {});
    const order = {
      id: "ord_src_test",
      sku: "coloring" as const,
      items: [{ product: "coloring" as const, projectId: project.id }],
      amountCents: 799,
      listPriceCents: 799,
      currency: "eur" as const,
      status: "pending" as const,
      provider: "mock" as const,
      digitalConsentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: "pinterest" as const,
      campaign: "navidad",
    };
    await getStore().put("orders", order.id, order);
    await fulfillOrder(order.id, { amountTotal: 799, currency: "eur", provider: "mock" });
    await fulfillOrder(order.id, { amountTotal: 799, currency: "eur", provider: "mock" }); // webhook repetido
    const { totals } = await statsSince(1);
    expect(totals["f:paid"]).toBe(1);
    expect(totals["f:paid:coloring"]).toBe(1);
    expect(totals["fs:pinterest:paid"]).toBe(1);
    expect(totals["campp:pinterest|navidad"]).toBe(1);
    expect(totals["rev:pinterest"]).toBe(799);
  });
});

describe("rutas de los editores", () => {
  it("coinciden con las del catálogo", async () => {
    const { EDITOR_PATHS } = await import("@/lib/traffic");
    const { PRODUCTS, PRODUCT_IDS } = await import("@/lib/products/catalog");
    for (const p of PRODUCT_IDS) expect(EDITOR_PATHS[PRODUCTS[p].editorPath as keyof typeof EDITOR_PATHS]).toBe(p);
    expect(Object.keys(EDITOR_PATHS)).toHaveLength(PRODUCT_IDS.length);
  });
});
