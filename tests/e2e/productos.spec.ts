import { expect, test } from "@playwright/test";
import { payAndDownload, SAMPLE_A, SAMPLE_B } from "./helpers";

test("periódico: datos propios, foto, valoración, pago simulado y PDF sin marca de agua", async ({ page }) => {
  await page.goto("/crear/periodico");
  await page.fill("#hn", "Lucía García");
  await page.getByText("Crear mi portada gratis").click();
  await page.waitForURL(/\?p=/);
  await page.setInputFiles("input[type=file]", SAMPLE_A);
  await expect(page.getByText("Lucía García").first()).toBeVisible();
  await page.click('[aria-label="4 de 5"]');
  await page.fill("#unlock-email", "prueba@example.com");
  const { bytes } = await payAndDownload(page);
  expect(bytes.length).toBeGreaterThan(50_000);
});

test("escape room: demo jugable con pista, fallo y solución; compra y PDF", async ({ page }) => {
  await page.goto("/crear/escape-room");
  await page.fill("#hero", "Mateo");
  await page.getByText("Jugar la demo gratis").click();
  await expect(page.getByText("Reto 1")).toBeVisible();
  await page.getByText("Pedir una pista").click();
  await expect(page.getByText("Pista 1")).toBeVisible();
  await page.fill("#answer", "nolose");
  await page.getByText("Comprobar").click();
  await expect(page.getByText("Todavía no")).toBeVisible();
  await page.getByText("Pedir una pista").click();
  await page.getByText("Ver la solución").click();
  await expect(page.getByText("Solución:")).toBeVisible();
  await page.getByText("Siguiente reto").click();
  await expect(page.getByText("Reto 2")).toBeVisible();
  const { bytes } = await payAndDownload(page);
  expect(bytes.length).toBeGreaterThan(20_000);
});

test("libro para colorear: dos fotos, vista previa con marca de agua, compra y PDF", async ({ page }) => {
  await page.goto("/crear/libro-colorear");
  await page.fill("#title", "Las aventuras de Chelsea");
  await page.setInputFiles("input[type=file]", [SAMPLE_A, SAMPLE_B]);
  await expect(page.getByText("Pág. 2")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('img[alt^="Lámina"]').first()).toBeVisible();
  const { bytes } = await payAndDownload(page);
  expect(bytes.length).toBeGreaterThan(50_000);
});

test("un pedido no se puede ver sin su enlace firmado", async ({ page, request }) => {
  await page.goto("/crear/escape-room");
  await page.fill("#hero", "Ana");
  await page.getByText("Jugar la demo gratis").click();
  await expect(page.getByText("Reto 1")).toBeVisible();
  const { url } = await payAndDownload(page);
  const orderId = new URL(url).pathname.split("/").pop()!;
  const r = await request.get(`/api/orders/${orderId}`);
  expect([401, 403, 404]).toContain(r.status());
  const r2 = await request.get(`/api/orders/${orderId}?k=falso`);
  expect([401, 403, 404]).toContain(r2.status());
});
