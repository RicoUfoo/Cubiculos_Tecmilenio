"use strict";

/* ===== 1. Config: única fuente de verdad ===== */
const Config = {
  ABRE: 7,
  CIERRA: 21,
  MAX_HORAS: 2,
  MAX_PERSONAS: 3,
  N_CUBICULOS: 5,
  DIAS_ADELANTE: 2,
  CLAVE_STORAGE: "cubiculos.reservas.v1",
};

/* ===== 2. Modelo: datos (esqueleto, se completa en otras historias) ===== */
const Modelo = {
  reservas: [],

  cubiculos() {
    return Array.from({ length: Config.N_CUBICULOS }, (_, i) => ({
      id: i + 1,
      nombre: "Cubículo " + (i + 1),
    }));
  },
};

/* ===== 3. Reglas: lógica de negocio (esqueleto) ===== */
const Reglas = {
  crear(datos) { /* historia 25 */ },
  cancelar(id) { /* historia 36 */ },
};

/* ===== 4. Vista: todo lo que toca el DOM ===== */
const Vista = {
  $(id) { return document.getElementById(id); },

  renderPlano() {
    const html = Modelo.cubiculos()
      .map(c => `<p>${c.nombre}</p>`)
      .join("");
    this.$("plano").innerHTML = html;
  },
};

/* ===== 5. App: punto de entrada que conecta todo ===== */
const App = {
  iniciar() {
    Vista.renderPlano();
  },
};

document.addEventListener("DOMContentLoaded", () => App.iniciar());