import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo con pagos SIMULADOS (PAYMENTS_MODE=mock).
 * Usan un almacén local aparte (.data-e2e) para no tocar los datos de desarrollo.
 */
const PORT = 3100;
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off", acceptDownloads: true },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] }, testIgnore: /movil/ },
    { name: "movil", use: { ...devices["Pixel 7"] }, testMatch: /movil/ },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PAYMENTS_MODE: "mock",
      APP_SECRET: "e2e-secret",
      ADMIN_PASSWORD: "e2e-admin",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      LOCAL_DATA_DIR: ".data-e2e",
      STRIPE_SECRET_KEY: "",
      RESEND_API_KEY: "",
    },
  },
});
