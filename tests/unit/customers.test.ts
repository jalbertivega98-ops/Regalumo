import { afterAll, describe, expect, it, vi } from "vitest";

await vi.hoisted(async () => {
  const { mkdtempSync } = await import("fs");
  const { tmpdir } = await import("os");
  const path = await import("path");
  process.env.LOCAL_DATA_DIR = mkdtempSync(path.join(tmpdir(), "regalumo-test-"));
  process.env.APP_SECRET = "test-secret";
  process.env.RESEND_API_KEY = "re_test_dummy";
  process.env.NEXT_PUBLIC_SITE_URL = "https://regalumo.test";
});

import { getStore } from "@/lib/store";
import { createProject } from "@/lib/projects";
import { fulfillOrder, type Order } from "@/lib/payments/orders";
import { sign } from "@/lib/security/tokens";
import { accessToken, customerKey, ordersForCustomer, orderSummary, readAccessToken } from "@/lib/customers";
import { POST } from "@/app/api/mis-pedidos/route";
import type { OutboxEmail } from "@/lib/email/send";

const sentTo: string[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  if (String(url).includes("api.resend.com")) {
    sentTo.push(JSON.parse(String(init?.body)).to);
    return new Response("{}", { status: 200 });
  }
  return realFetch(url, init);
}) as typeof fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

async function order(email: string | undefined, paid: boolean) {
  const { project } = await createProject("newspaper", { honoree: "Prueba" });
  const o: Order = {
    id: "ord_" + Math.random().toString(36).slice(2),
    sku: "newspaper",
    items: [{ product: "newspaper", projectId: project.id }],
    amountCents: 699,
    listPriceCents: 699,
    currency: "eur",
    status: "pending",
    provider: "stripe",
    digitalConsentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await getStore().put("orders", o.id, o);
  if (paid) await fulfillOrder(o.id, { amountTotal: 699, currency: "eur", email, provider: "stripe" });
  return o.id;
}

const ask = (email: unknown, ip = "10.1.0.1") =>
  POST(new Request("http://x/api/mis-pedidos", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify({ email }) }));

describe("Mis pedidos", () => {
  it("encuentra solo los pedidos pagados de ese correo, sin distinguir mayúsculas", async () => {
    const a = await order("Ana@Ejemplo.com", true);
    const b = await order("ana@ejemplo.com ", true);
    await order("ana@ejemplo.com", false); // pendiente: no aparece
    await order("otra@ejemplo.com", true);
    const found = await ordersForCustomer(customerKey("ANA@ejemplo.com"));
    expect(found.map((o) => o.id).sort()).toEqual([a, b].sort());
    const idx = await getStore().get<{ orderIds: string[] }>("customers", customerKey("ana@ejemplo.com"));
    expect(idx?.orderIds.sort()).toEqual([a, b].sort());
    const s = orderSummary(found[0]);
    expect(s.path).toMatch(/^\/pedido\/ord_.+\?k=/);
    expect(s.expired).toBe(false);
  });

  it("también encuentra pedidos antiguos que no están en el índice", async () => {
    const id = await order("vieja@ejemplo.com", true);
    await getStore().del("customers", customerKey("vieja@ejemplo.com"));
    expect((await ordersForCustomer(customerKey("vieja@ejemplo.com"))).map((o) => o.id)).toEqual([id]);
  });

  it("el enlace mágico caduca, no lleva el correo en claro y no sirve para otra cosa", () => {
    const t = accessToken("ana@ejemplo.com");
    expect(readAccessToken(t)).toBe(customerKey("ana@ejemplo.com"));
    expect(Buffer.from(t.split(".")[0], "base64url").toString()).not.toContain("ana");
    expect(readAccessToken(accessToken("ana@ejemplo.com", Date.now() - 25 * 3600000))).toBeNull();
    expect(readAccessToken(sign({ c: customerKey("ana@ejemplo.com") }, "order"))).toBeNull();
    expect(readAccessToken("basura")).toBeNull();
  });

  it("envía el enlace solo si hay pedidos, pero responde igual en los dos casos", async () => {
    await order("luis@ejemplo.com", true);
    sentTo.length = 0;
    const yes = await ask("Luis@Ejemplo.com");
    const no = await ask("nadie@ejemplo.com");
    expect(yes.status).toBe(200);
    expect(no.status).toBe(200);
    expect(await yes.json()).toEqual(await no.json());
    expect(sentTo).toEqual(["luis@ejemplo.com"]);
    const mail = (await getStore().list<OutboxEmail>("outbox")).find((m) => m.subject === "Tus pedidos de REGALUMO");
    const link = mail!.html.match(/href="([^"]+)"/)![1].replace(/&amp;/g, "&");
    expect(link.startsWith("https://regalumo.test/mis-pedidos?t=")).toBe(true);
    expect(readAccessToken(new URL(link).searchParams.get("t"))).toBe(customerKey("luis@ejemplo.com"));
  });

  it("rechaza correos no válidos y limita los envíos por correo", async () => {
    expect((await ask("no-es-correo")).status).toBe(400);
    expect((await ask(123)).status).toBe(400);
    await order("spam@ejemplo.com", true);
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await ask("spam@ejemplo.com", `10.2.0.${i}`)).status);
    expect(codes).toEqual([200, 200, 200, 429]);
  });
});
