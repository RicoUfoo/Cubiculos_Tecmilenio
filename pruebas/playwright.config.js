"use strict";
/* T46 · Configuración de las pruebas de flujo en navegador real. */
const { defineConfig, devices } = require("@playwright/test");

const PUERTO = Number(process.env.PUERTO || 4173);
const BASE = `http://127.0.0.1:${PUERTO}`;

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE,
    // La página calcula horarios en la zona de Monterrey: el navegador de
    // prueba tiene que estar en la misma zona y en español.
    timezoneId: "America/Monterrey",
    locale: "es-MX",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `node ayudas/servidor.js`,
    url: BASE,
    // APP_DIR deja probar otra copia de la página:  APP_DIR=../otra npm run flujo
    env: { PUERTO: String(PUERTO), ...(process.env.APP_DIR ? { APP_DIR: process.env.APP_DIR } : {}) },
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
});
