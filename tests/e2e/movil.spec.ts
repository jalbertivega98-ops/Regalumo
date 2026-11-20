import { expect, test } from "@playwright/test";

const PAGES = ["/", "/crear", "/crear/periodico", "/crear/escape-room", "/crear/libro-colorear", "/periodico-personalizado", "/escape-room-personalizado", "/foto-para-colorear", "/legal/privacidad", "/mis-pedidos", "/no-existe"];

for (const p of PAGES) {
  test(`móvil ${p}: sin desplazamiento horizontal`, async ({ page }) => {
    await page.goto(p);
    await page.waitForLoadState("networkidle");
    // Contra el ancho de la pantalla: si algo se sale, el móvil aleja la página y innerWidth crece con ella.
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth) - screen.width);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
