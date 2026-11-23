"use strict";
// Carga Script.js en un contexto de Node AISLADO (sin navegador) para probar las reglas de negocio.
// Cada llamada a crearApp() devuelve una copia nueva y limpia: ninguna prueba contamina a otra.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { carpetaApp } = require("../ayudas/ruta-app");

let _codigo = null;
function codigoFuente() {
  if (_codigo === null) _codigo = fs.readFileSync(path.join(carpetaApp(), "Script.js"), "utf8");
  return _codigo;
}

// localStorage de mentira, con la opción de hacer que falle al guardar las reservas (disco lleno, modo privado...)
function almacenamientoFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  const api = {
    fallaAlGuardar: false,          // solo falla la clave de las reservas; la prueba de disponibilidad sí funciona
    noDisponible: false,            // simula un navegador sin localStorage
    getItem: k => (datos.has(k) ? datos.get(k) : null),
    setItem(k, v) {
      if (api.noDisponible) throw new Error("localStorage no disponible");
      if (api.fallaAlGuardar && k === "cubiculos.estado") throw new Error("QuotaExceededError");
      datos.set(k, String(v));
    },
    removeItem(k) { if (api.noDisponible) throw new Error("localStorage no disponible"); datos.delete(k); },
    claves: () => [...datos.keys()],
    crudo: k => (datos.has(k) ? datos.get(k) : null),
  };
  return api;
}

function crearApp({ almacen = {} } = {}) {
  const ls = almacenamientoFalso(almacen);
  const consola = [];
  const contexto = vm.createContext({
    console: {
      log() {}, info() {}, debug() {},
      warn: (...a) => consola.push({ nivel: "warn", texto: a.map(String).join(" ") }),
      error: (...a) => consola.push({ nivel: "error", texto: a.map(String).join(" ") }),
    },
    localStorage: ls,
    crypto: webcrypto,
    // Script.js termina con document.addEventListener("DOMContentLoaded", ...): aquí no hay página, así que no hace nada.
    document: { addEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    window: { addEventListener() {} },
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {}, requestAnimationFrame() {},
  });
  vm.runInContext(
    codigoFuente() + "\n;globalThis.__app = { Config, Mensajes, Identidad, Modelo, Reglas, Almacen, Sincronizacion };",
    contexto,
    { filename: "Script.js" }
  );
  return { ...contexto.__app, ls, consola };
}

module.exports = { crearApp, almacenamientoFalso };
