import { expect, test } from "@playwright/test";

const PAGES = ["/", "/crear", "/crear/periodico", "/crear/escape-room", "/crear/libro-colorear", "/periodico-personalizado", "/escape-room-personalizado", "/foto-para-colorear", "/legal/privacidad"];

for (const p of PAGES) {
  test(`móvil ${p}: sin desplazamiento horizontal`, async ({ page }) => {
    await page.goto(p);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
