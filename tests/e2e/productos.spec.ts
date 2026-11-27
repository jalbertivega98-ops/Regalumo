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
  // Pagar sin marcar la casilla no deja el botón «muerto»: avisa de qué falta y no sale de la página.
  await page.getByRole("button", { name: /Pagar/ }).click();
  await expect(page.getByText("Falta un paso: marca la casilla")).toBeVisible();
  await expect(page).not.toHaveURL(/simular/);
  const { bytes } = await payAndDownload(page);
  expect(bytes.length).toBeGreaterThan(50_000);
});

test("escape room: demo jugable (puzle, búsqueda y candado) con pistas, fallo y solución; compra y PDF", async ({ page }) => {
  await page.goto("/crear/escape-room");
  await page.fill("#hero", "Mateo");
  await page.getByText("Jugar la demo gratis").click();
  // Reto 1: puzle de piezas. Dos pistas y la solución.
  await expect(page.getByRole("heading", { name: /^Reto 1:/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pieza en la posición/ })).toHaveCount(9);
  await page.getByRole("button", { name: "Pieza en la posición 1" }).click();
  await expect(page.getByRole("button", { name: /posición 1 \(seleccionada\)/ })).toBeVisible();
  await page.getByText("Pedir una pista").click();
  await expect(page.getByText("Pista 1")).toBeVisible();
  await page.getByText("Pedir una pista").click();
  await page.getByText("Ver la solución").click();
  await expect(page.getByText(/primera cifra del candado es \d/)).toBeVisible();
  await page.getByText("Siguiente reto").click();
  // Reto 2: buscar objetos. Si faltan, avisa.
  await expect(page.getByRole("heading", { name: /^Reto 2:/ })).toBeVisible();
  await page.getByRole("button", { name: /^Ya están/ }).click();
  await expect(page.getByText("Todavía falta alguna")).toBeVisible();
  const objetivos = page.locator("section[aria-live] [tabindex='0']");
  const n = await objetivos.count();
  expect(n).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < n; i++) await objetivos.nth(i).click();
  await page.getByRole("button", { name: /^Ya están/ }).click();
  await expect(page.getByText(`Eran ${n}.`)).toBeVisible();
  await page.getByText("Siguiente reto").click();
  // Reto 3: candado. Combinación mala, pistas del servidor y combinación buena.
  await expect(page.getByRole("heading", { name: /^Reto 3:/ })).toBeVisible();
  const abrir = page.locator("form").getByRole("button", { name: /Abrir/ });
  await abrir.click();
  await expect(page.getByText("El candado no se abre")).toBeVisible();
  await page.getByText("Pedir una pista").click();
  await page.getByText("Pedir una pista").click();
  const pista = await page.getByText(/La combinación es/).innerText();
  const code = pista.match(/(\d) - (\d) - (\d)/)!.slice(1).map(Number);
  for (let w = 0; w < 3; w++) for (let k = 0; k < code[w]; k++) await page.getByRole("button", { name: `Subir la rueda ${w + 1}` }).click();
  await abrir.click();
  await expect(page.getByText("El candado se abre")).toBeVisible();
  const { bytes } = await payAndDownload(page);
  expect(bytes.length).toBeGreaterThan(20_000);
});

test("libro para colorear: dos fotos, vista previa con marca de agua, compra y PDF", async ({ page }) => {
  await page.goto("/crear/libro-colorear");
  await page.setInputFiles("input[type=file]", [SAMPLE_A, SAMPLE_B]);
  await expect(page.getByLabel("Ver página 2")).toBeVisible({ timeout: 30_000 });
  await page.fill("#title", "Las aventuras de Chelsea");
  await expect(page.locator('img[alt^="Lámina"]').first()).toBeVisible();
  const { bytes } = await payAndDownload(page);
  expect(bytes.length).toBeGreaterThan(50_000);
});

test("un pedido no se puede ver sin su enlace firmado", async ({ page, request }) => {
  await page.goto("/crear/escape-room");
  await page.fill("#hero", "Ana");
  await page.getByText("Jugar la demo gratis").click();
  await expect(page.getByRole("heading", { name: /^Reto 1:/ })).toBeVisible();
  const { url } = await payAndDownload(page);
  const orderId = new URL(url).pathname.split("/").pop()!;
  const r = await request.get(`/api/orders/${orderId}`);
  expect([401, 403, 404]).toContain(r.status());
  const r2 = await request.get(`/api/orders/${orderId}?k=falso`);
  expect([401, 403, 404]).toContain(r2.status());
});

test("escape room: panel para jugar desde el móvil tras la compra", async ({ page, request }) => {
  const { generateGame } = await import("../../src/lib/escape/generator");
  await page.goto("/crear/escape-room");
  await page.fill("#hero", "Vera");
  await page.getByText("Jugar la demo gratis").click();
  await expect(page.getByRole("heading", { name: /^Reto 1:/ })).toBeVisible();
  await payAndDownload(page);
  // Datos del proyecto (con su token de propietario) para conocer las respuestas en la prueba.
  const playHref = await page.getByText("Jugar desde el móvil").getAttribute("href");
  expect(playHref).toMatch(/^\/jugar\/[\w-]+\?k=[\w-]{16}$/);
  const projectId = playHref!.split("/")[2].split("?")[0];
  const token = await page.evaluate((id) => localStorage.getItem(`rg_tok_${id}`), projectId);
  const { project } = await (await request.get(`/api/projects/${projectId}`, { headers: { "x-project-token": token! } })).json();
  const g = generateGame(project.data);

  // Sin la clave correcta no hay juego ni respuestas.
  const bad = await request.post(`/api/escape/play/${projectId}`, { data: { k: "x".repeat(16), action: "state" } });
  expect(bad.status()).toBe(403);
  const state = await (await request.post(`/api/escape/play/${projectId}`, { data: { k: playHref!.split("k=")[1], action: "state" } })).text();
  for (const p of g.puzzles) expect(state).not.toContain(`"${p.answer}"`);
  expect(state).not.toContain(g.finalWord);

  await page.goto(playHref!);
  await expect(page.getByText(g.title)).toBeVisible();
  await page.getByText("Empezar la cuenta atrás").click();
  await expect(page.getByText("Sobre 1", { exact: true })).toBeVisible();
  await page.fill("#play-answer", "nolose");
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByText("No es correcto")).toBeVisible();
  await page.getByText(/Usar una ficha de pista/).click();
  await expect(page.getByText("Pista 1:")).toBeVisible();
  for (const [i, p] of g.puzzles.entries()) {
    await page.fill("#play-answer", p.answer.toLowerCase());
    await page.getByRole("button", { name: "Comprobar" }).click();
    await expect(page.getByText("Vuestra letra es").or(page.getByText("Vuestra última letra es"))).toBeVisible();
    // El progreso sobrevive a recargar la página.
    if (i === 0) {
      await page.reload();
      await expect(page.getByText("1 de " + g.puzzles.length + " sobres resueltos", { exact: false })).toBeVisible();
    } else await page.getByRole("button", { name: /Ya tenemos el sobre|Ir al reto final/ }).click();
  }
  await page.fill("#play-final", [...g.finalWord].reverse().join("") === g.finalWord ? "zzz" : [...g.finalWord].reverse().join(""));
  await page.locator("form").getByRole("button", { name: /^Abrir/ }).click();
  await expect(page.getByText("Esa no es la palabra")).toBeVisible();
  await page.fill("#play-final", g.finalWord.toLowerCase());
  await page.locator("form").getByRole("button", { name: /^Abrir/ }).click();
  await expect(page.getByText("¡Lo habéis conseguido!")).toBeVisible();
  await expect(page.getByText(g.ending)).toBeVisible();
});
