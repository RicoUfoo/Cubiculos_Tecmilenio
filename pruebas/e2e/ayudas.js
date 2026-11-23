"use strict";
/* T46 · Piezas comunes de las pruebas de flujo.
   Todo arranca con una hora simulada fija (lunes 16 de noviembre de 2026, zona
   America/Monterrey) para que «ya pasó esa hora» o «ya cerró» den siempre lo
   mismo, sin importar cuándo se corran las pruebas. */
const { expect } = require("@playwright/test");

// Firma de este navegador. La página la usa para saber qué reservas son tuyas;
// al fijarla podemos sembrar reservas "propias" y "de otra persona".
const DISPOSITIVO = "pruebas-e2e-0001";
const OTRO = "otro-navegador-0002";

const HOY = "2026-11-16";
const A_LAS = h => `${HOY}T${h}:00-06:00`;   // A_LAS("10:30")
const BASE = A_LAS("10:30");

// Una reserva como la guarda la página (esquema v2).
function reserva({ id = "res-001", cubiculo = "cub-01", inicio = 10, duracion = 2, nombre = "Equipo A", personas = 2, mia = true, fecha = HOY } = {}) {
  return { id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno: mia ? DISPOSITIVO : OTRO };
}

// Abre la página con el reloj simulado y, si se piden, con reservas ya guardadas.
// `crudo` sirve para sembrar datos dañados a propósito.
async function abrirApp(page, { hora = BASE, reservas = null, crudo = null } = {}) {
  await page.clock.install({ time: new Date(hora) });
  // Esto corre antes del código de la página, en cada carga. Las reservas
  // sembradas se escriben UNA sola vez: así, si la prueba recarga, se ve lo que
  // la página guardó de verdad y no la semilla otra vez.
  await page.addInitScript(({ disp, estado }) => {
    try {
      localStorage.setItem("cubiculos.dispositivo", disp);
      if (estado && !sessionStorage.getItem("semilla-puesta")) {
        sessionStorage.setItem("semilla-puesta", "1");
        localStorage.setItem("cubiculos.estado", estado);
      }
    } catch (e) {}
  }, {
    disp: DISPOSITIVO,
    estado: crudo !== null ? crudo : reservas ? JSON.stringify({
      version: 2,
      guardado: new Date(hora).toISOString(),
      ultimoId: reservas.length,
      reservas,
    }) : null,
  });
  await page.goto("/");
  await expect(page.locator("#plano .booth")).toHaveCount(5);
  return page;
}

// --- Localizadores con nombre, para que las pruebas se lean como el flujo ---
const tarjeta = (page, n) => page.locator(`.booth[data-cub="cub-0${n}"]`);
const franja = (page, n, hora) => page.locator(`.slot[data-cub="cub-0${n}"][data-franja="fr-${String(hora).padStart(2, "0")}"]`);
const detalle = page => page.locator("#detalle");
const formulario = page => page.locator("#formReserva");
const avisoDeshacer = page => page.locator("#avisoDeshacer");
const aviso = page => page.locator("#aviso");

// Valores que ofrece un desplegable del formulario (sin la opción "Elige…").
async function opciones(page, id) {
  return page.locator(`#${id} option`).evaluateAll(os =>
    os.map(o => o.value).filter(v => v !== ""));
}

// Espera un aviso: tiene que estar VISIBLE y decir lo que toca. Comprobar solo
// el texto no sirve: un aviso oculto igual lo tiene.
async function esperarAviso(page, texto) {
  await expect(aviso(page)).toBeVisible();
  await expect(aviso(page)).toContainText(texto);
}

async function esperarAvisoDeshacer(page, texto) {
  await expect(avisoDeshacer(page)).toBeVisible();
  await expect(avisoDeshacer(page)).toContainText(texto);
}

// Abre el detalle de un cubículo y entra al formulario de reserva.
async function abrirFormulario(page, n) {
  await tarjeta(page, n).click();
  await expect(detalle(page)).toBeVisible();
  await page.locator("#btnReservar").click();
  await expect(formulario(page)).toBeVisible();
}

// Llena el formulario y llega hasta el paso de revisión.
async function llenar(page, { nombre = "Equipo Cálculo", personas = 2, inicio, duracion }) {
  await page.locator("#rNombre").fill(nombre);
  await page.locator("#rPersonas").fill(String(personas));
  if (inicio !== undefined) await page.locator("#rInicio").selectOption(String(inicio));
  if (duracion !== undefined) await page.locator("#rDuracion").selectOption(String(duracion));
  await formulario(page).locator('button[type="submit"]').click();
}

// Flujo completo: abrir, llenar, revisar y confirmar.
async function reservar(page, n, datos) {
  await abrirFormulario(page, n);
  await llenar(page, datos);
  await expect(page.getByRole("heading", { name: "Revisa tu reserva" })).toBeVisible();
  await page.locator('[data-accion="confirmar"]').click();
  await expect(page.getByRole("heading", { name: "¡Reserva confirmada!" })).toBeVisible();
}

// Responde el panel de confirmación (cancelar o liberar).
async function confirmarPanel(page, titulo) {
  await expect(page.locator("#detalleConfirmar")).toBeVisible();
  await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
  await page.locator('[data-confirmar="si"]').click();
}

module.exports = {
  DISPOSITIVO, OTRO, HOY, BASE, A_LAS, reserva, abrirApp,
  tarjeta, franja, detalle, formulario, aviso, avisoDeshacer,
  opciones, abrirFormulario, llenar, reservar, confirmarPanel,
  esperarAviso, esperarAvisoDeshacer,
};
