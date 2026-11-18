import { expect, test } from "@playwright/test";

const SEO = [
  "/escape-room-personalizado",
  "/escape-room-para-cumpleanos",
  "/escape-room-para-imprimir",
  "/periodico-personalizado",
  "/periodico-de-cumpleanos",
  "/regalos-personalizados",
  "/foto-para-colorear",
  "/libro-para-colorear-personalizado",
];

test("la portada muestra eslogan, productos y precios", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Crea algo único", { exact: false }).first()).toBeVisible();
  for (const price of ["6,99", "9,99", "7,99", "19,99"]) await expect(page.getByText(price).first()).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
});

for (const path of SEO) {
  test(`página SEO ${path} con metadatos propios`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBe(0);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join(" ")).toContain("BreadcrumbList");
  });
}

test("sitemap y robots: públicas dentro, privadas fuera", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const p of SEO) expect(sitemap).toContain(p);
  expect(sitemap).not.toMatch(/\/crear\/|\/pedido|\/admin|\/api/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/api\//);
  expect(robots).toMatch(/Disallow: \/pedido\//);
});

test("los editores y pedidos no se indexan", async ({ page }) => {
  for (const p of ["/crear/periodico", "/crear/escape-room", "/crear/libro-colorear"]) {
    const res = await page.goto(p);
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("las fotos de un proyecto no se sirven sin su token", async ({ request }) => {
  const r = await request.get("/api/projects/inexistente/photos/x");
  expect([401, 403, 404]).toContain(r.status());
});

test("el panel de administración pide contraseña", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("#pw")).toBeVisible();
  await page.fill("#pw", "incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Resumen de los últimos")).toHaveCount(0);
  await page.fill("#pw", "e2e-admin");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Resumen de los últimos")).toBeVisible();
});

test("el panel de visitas muestra origen, páginas y embudo", async ({ page, context }) => {
  // Visita desde un enlace etiquetado de Pinterest que juega la demo del escape room.
  await page.goto("/?utm_source=pinterest&utm_campaign=Navidad");
  await page.waitForLoadState("networkidle");
  await page.goto("/crear/escape-room");
  await page.getByText("Jugar la demo gratis").click();
  await expect(page.getByText(/Reto 1/i).first()).toBeVisible();

  const admin = await context.newPage();
  await admin.goto("/admin");
  await admin.fill("#pw", "e2e-admin");
  await admin.getByRole("button", { name: "Entrar" }).click();
  await expect(admin.getByText("Resumen de los últimos")).toBeVisible();
  await admin.waitForTimeout(1500); // los avisos de analítica se envían en segundo plano
  await admin.goto("/admin/visitas?dias=1");
  await expect(admin.getByRole("heading", { name: "Visitas y embudo" })).toBeVisible();
  await expect(admin.getByRole("cell", { name: "Pinterest" }).first()).toBeVisible();
  await expect(admin.getByRole("cell", { name: "navidad" })).toBeVisible();
  await expect(admin.getByRole("cell", { name: "Editor del escape room" }).first()).toBeVisible();
  await expect(admin.getByText("3. Ve su muestra gratis")).toBeVisible();
});

test("Mis pedidos: sin correo configurado ofrece contacto y avisa de enlaces caducados", async ({ page }) => {
  const res = await page.goto("/mis-pedidos");
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { name: "Mis pedidos" })).toBeVisible();
  await expect(page.getByText(/desde el correo con el que pagaste/)).toBeVisible();
  await page.goto("/mis-pedidos?t=enlace-falso");
  await expect(page.getByText(/ha caducado o no es válido/)).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Mis pedidos" })).toHaveAttribute("href", "/mis-pedidos");
});
