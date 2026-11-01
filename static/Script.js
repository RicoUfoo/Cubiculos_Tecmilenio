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
  // T6: formato y zona horaria del reloj
  LOCALE: "es-MX",
  ZONA_HORARIA: "America/Monterrey",
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

// T4: Identificadores estables y nombres legibles
  const identificadores = {
  cubiculo_1: "cub-01",
  cubiculo_2: "cub-02",
  cubiculo_3: "cub-03",
  cubiculo_4: "cub-04",
  cubiculo_5: "cub-05",
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

  // T6: reloj y fecha en vivo, formato es-MX
  _fmtHora: new Intl.DateTimeFormat(Config.LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: Config.ZONA_HORARIA,
  }),
  _fmtFecha: new Intl.DateTimeFormat(Config.LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: Config.ZONA_HORARIA,
  }),

  renderReloj() {
    const ahora = new Date();
    const hora = this._fmtHora.format(ahora);
    let fecha = this._fmtFecha.format(ahora);
    fecha = fecha.charAt(0).toUpperCase() + fecha.slice(1);

    const elHora = this.$("clockTime");
    const elFecha = this.$("clockDate");
    if (elHora && elHora.textContent !== hora) elHora.textContent = hora;
    if (elFecha && elFecha.textContent !== fecha) elFecha.textContent = fecha;
  },
};

/* ===== 5. App: punto de entrada que conecta todo ===== */
const App = {
  iniciar() {
    Vista.renderPlano();
    Vista.renderReloj();
    setInterval(() => Vista.renderReloj(), 1000);
  },
};

// T7. politica de horario de operacion configurable //
const horariooperacion = {
  abre: "8:00",
  cierra: "20:00",
  };
document.addEventListener("DOMContentLoaded", () => App.iniciar());
