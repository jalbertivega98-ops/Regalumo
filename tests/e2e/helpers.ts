import { expect, type Page } from "@playwright/test";
import { promises as fs } from "fs";

export const SAMPLE_A = "assets/samples/chelsea.png";
export const SAMPLE_B = "assets/samples/coffee.png";

/** Paga con el pago simulado y descarga el PDF final. Devuelve sus bytes. */
export async function payAndDownload(page: Page) {
  await page.locator("input[type=checkbox]").last().check();
  await page.getByRole("button", { name: /Pagar/ }).click();
  await page.waitForURL(/simular/);
  await page.getByText("Confirmar pago simulado").click();
  const link = page.getByText("Descargar PDF");
  await expect(link).toBeVisible({ timeout: 20_000 });
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), link.click()]);
  const file = await dl.path();
  const bytes = await fs.readFile(file!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  return { bytes, name: dl.suggestedFilename(), url: page.url() };
}
