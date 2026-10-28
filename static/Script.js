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

/* ===== 2. Modelo: datos ===== */
const Modelo = {
  reservas: [],

  // T3: lista de cubículos. Para agregar uno, basta con añadir un objeto aquí.
  CUBICULOS: [
    { id: 1, nombre: "Cubículo 1", capacidad: 3 },
    { id: 2, nombre: "Cubículo 2", capacidad: 3 },
    { id: 3, nombre: "Cubículo 3", capacidad: 3 },
    { id: 4, nombre: "Cubículo 4", capacidad: 3 },
    { id: 5, nombre: "Cubículo 5", capacidad: 3 },
  ],

  cubiculos() {
    return this.CUBICULOS;
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

  // T3: el plano se genera recorriendo los datos del Modelo
  renderPlano() {
    const html = Modelo.cubiculos().map(c => `
      <button class="booth" type="button" data-cub="${c.id}"
              aria-label="${c.nombre}, capacidad ${c.capacidad} personas">
        <small>Cubículo</small>
        <b>${c.id}</b>
        <span>Hasta ${c.capacidad} personas</span>
      </button>`).join("");
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