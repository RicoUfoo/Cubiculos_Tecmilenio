"use strict";

/* ===== 1. Config: única fuente de verdad ===== */
const Config = {
  // T7: horario de operación configurable (8:00 a 20:00)
  ABRE: 8,
  CIERRA: 20,
  // T8: duración de cada franja, en horas
  FRANJA_HORAS: 1,
  MAX_HORAS: 2,
  MAX_PERSONAS: 3,
  N_CUBICULOS: 5,
  DIAS_ADELANTE: 2,
  CLAVE_STORAGE: "cubiculos.reservas.v1",
  // T12: cada cuántos milisegundos se refresca la disponibilidad
  REFRESCO_MS: 15000,
  // T6: formato y zona horaria del reloj
  LOCALE: "es-MX",
  ZONA_HORARIA: "America/Monterrey",
};

/* ===== 2. Modelo: datos ===== */
const Modelo = {
  reservas: [],

  // T3 + T4: lista de cubículos con identificador estable y nombre legible.
  // Para agregar uno, basta con añadir un objeto aquí.
  CUBICULOS: [
    { id: "cub-01", numero: 1, nombre: "Cubículo 1", capacidad: 3 },
    { id: "cub-02", numero: 2, nombre: "Cubículo 2", capacidad: 3 },
    { id: "cub-03", numero: 3, nombre: "Cubículo 3", capacidad: 3 },
    { id: "cub-04", numero: 4, nombre: "Cubículo 4", capacidad: 3 },
    { id: "cub-05", numero: 5, nombre: "Cubículo 5", capacidad: 3 },
  ],

  cubiculos() {
    return this.CUBICULOS;
  },

  // T8: modelo de franjas de una hora, generado desde Config (ABRE → CIERRA).
  // Cada franja: { id: "fr-08", inicio: 8, fin: 9, etiqueta: "08:00 – 09:00" }
  franjas() {
    const pad = n => String(n).padStart(2, "0");
    const lista = [];
    for (let h = Config.ABRE; h + Config.FRANJA_HORAS <= Config.CIERRA; h += Config.FRANJA_HORAS) {
      const fin = h + Config.FRANJA_HORAS;
      lista.push({
        id: `fr-${pad(h)}`,
        inicio: h,
        fin,
        etiqueta: `${pad(h)}:00 – ${pad(fin)}:00`,
      });
    }
    return lista;
  },

  // T8: buscar una franja por su id estable
  franjaPorId(id) {
    return this.franjas().find(f => f.id === id);
  },

  // T8: franja que contiene una hora entera (ej. 14 → fr-14). undefined si está fuera de horario
  franjaDeHora(hora) {
    return this.franjas().find(f => hora >= f.inicio && hora < f.fin);
  },

  // T8: franja en curso ahora mismo (hora de Monterrey). undefined si está cerrado
  _fmtHoraNum: new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: Config.ZONA_HORARIA,
  }),

  franjaActual(fecha = new Date()) {
    return this.franjaDeHora(Number(this._fmtHoraNum.format(fecha)));
  },

  // T10: fecha de hoy en formato AAAA-MM-DD (zona horaria de Monterrey)
  _fmtFechaISO: new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: Config.ZONA_HORARIA,
  }),

  hoy() {
    return this._fmtFechaISO.format(new Date());
  },

  // T10: estado de UNA franja de UN cubículo: "libre" u "ocupada".
  // Una reserva ocupa las franjas desde "inicio" durante "duracion" horas.
  // Reserva: { cubiculo: "cub-02", fecha: "2026-11-01", inicio: 10, duracion: 2, nombre: "Ana" }
  estadoFranja(cubId, franja, fecha = this.hoy()) {
    const ocupada = this.reservas.some(r =>
      r.cubiculo === cubId &&
      r.fecha === fecha &&
      franja.inicio >= r.inicio &&
      franja.inicio < r.inicio + r.duracion
    );
    return ocupada ? "ocupada" : "libre";
  },

  // T11: MOTOR DE ESTADO ACTUAL DEL CUBÍCULO.
  // Devuelve { estado, franja, hasta, cuando } para un cubículo en un instante dado:
  //   "cerrado" -> fuera del horario de operación. "hasta" = hora en que abre,
  //                "cuando" = "hoy" o "mañana".
  //   "ocupado" -> la franja en curso tiene reserva. "hasta" = hora en que se libera
  //                (une reservas seguidas).
  //   "libre"   -> sin reserva ahora. "hasta" = hora de la siguiente reserva
  //                (o la hora de cierre si ya no hay más hoy).
  // El parámetro "ahora" permite probarlo con cualquier hora.
  estadoActual(cubId, ahora = new Date()) {
    const hora = Number(this._fmtHoraNum.format(ahora));
    const fecha = this._fmtFechaISO.format(ahora);

    if (hora < Config.ABRE) {
      return { estado: "cerrado", franja: null, hasta: Config.ABRE, cuando: "hoy" };
    }
    if (hora >= Config.CIERRA) {
      return { estado: "cerrado", franja: null, hasta: Config.ABRE, cuando: "mañana" };
    }

    const franjas = this.franjas();
    const i = franjas.findIndex(f => hora >= f.inicio && hora < f.fin);
    const franja = franjas[i];
    const ocupada = f => this.estadoFranja(cubId, f, fecha) === "ocupada";

    if (ocupada(franja)) {
      let j = i;
      while (j + 1 < franjas.length && ocupada(franjas[j + 1])) j++;
      return { estado: "ocupado", franja, hasta: franjas[j].fin, cuando: "hoy" };
    }

    let k = i + 1;
    while (k < franjas.length && !ocupada(franjas[k])) k++;
    const hasta = k < franjas.length ? franjas[k].inicio : Config.CIERRA;
    return { estado: "libre", franja, hasta, cuando: "hoy" };
  },

  // T12: "firma" de la disponibilidad: un texto que cambia solo si cambia algo visible
  // (el día, el estado actual de algún cubículo o alguna franja). Sirve para saber
  // si hace falta volver a dibujar la pantalla.
  firmaDisponibilidad(ahora = new Date()) {
    const partes = [this.hoy()];
    this.cubiculos().forEach(c => {
      const e = this.estadoActual(c.id, ahora);
      partes.push(`${c.id}:${e.estado}:${e.hasta}`);
      partes.push(this.franjas().map(f => this.estadoFranja(c.id, f)[0]).join(""));
    });
    return partes.join("|");
  },

  // T10: DATOS DE EJEMPLO para ver la distinción visual.
  // Se borran cuando existan las reservas reales (T25) y la persistencia (T33).
  cargarEjemplo() {
    const fecha = this.hoy();
    this.reservas = [
      { cubiculo: "cub-01", fecha, inicio: 8,  duracion: 1, nombre: "Ejemplo" },
      { cubiculo: "cub-02", fecha, inicio: 10, duracion: 2, nombre: "Ejemplo" },
      { cubiculo: "cub-04", fecha, inicio: 14, duracion: 1, nombre: "Ejemplo" },
      { cubiculo: "cub-05", fecha, inicio: 16, duracion: 2, nombre: "Ejemplo" },
    ];
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
        <b>${c.numero}</b>
        <span>Hasta ${c.capacidad} personas</span>
        <strong class="estado-actual"></strong>
      </button>`).join("");
    this.$("plano").innerHTML = html;
  },

  // T11: muestra el estado actual de cada cubículo en su tarjeta del plano.
  // Se puede llamar muchas veces (la T12 lo usará para refrescar).
  // Los colores del estado son de la T5: aquí solo se escribe el texto y data-estado.
  renderEstados(ahora = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    Modelo.cubiculos().forEach(c => {
      const boton = document.querySelector(`.booth[data-cub="${c.id}"]`);
      if (!boton) return;

      const e = Modelo.estadoActual(c.id, ahora);
      const hora = `${pad(e.hasta)}:00`;
      let texto;
      if (e.estado === "cerrado") {
        texto = `Cerrado · abre ${e.cuando === "mañana" ? "mañana " : ""}a las ${hora}`;
      } else if (e.estado === "ocupado") {
        texto = `Ocupado · hasta las ${hora}`;
      } else {
        texto = `Libre · hasta las ${hora}`;
      }

      boton.dataset.estado = e.estado;
      boton.querySelector(".estado-actual").textContent = texto;
      boton.setAttribute("aria-label", `${c.nombre}, capacidad ${c.capacidad} personas, ${texto}`);
    });
  },

  // T12: REFRESCO AUTOMÁTICO DE LA DISPONIBILIDAD.
  // Vuelve a dibujar estados y franjas, pero SOLO si algo cambió (compara la "firma"),
  // así no se pierde el foco del teclado ni parpadea la pantalla.
  // Devuelve true si se redibujó. "forzar" obliga a dibujar siempre.
  // Cuando existan reservas guardadas (T33), aquí se vuelven a leer antes de comparar.
  _firma: "",

  refrescar(forzar = false, ahora = new Date()) {
    const firma = Modelo.firmaDisponibilidad(ahora);
    if (!forzar && firma === this._firma) return false;
    this._firma = firma;

    // Recordar qué franja tenía el foco para devolvérselo después de redibujar
    const activo = document.activeElement;
    const enFranja = activo && activo.classList && activo.classList.contains("slot");
    const cub = enFranja ? activo.dataset.cub : null;
    const franja = enFranja ? activo.dataset.franja : null;

    this.renderEstados(ahora);
    this.renderFranjas();

    if (cub) {
      const mismo = document.querySelector(`.slot[data-cub="${cub}"][data-franja="${franja}"]`);
      if (mismo) mismo.focus();
    }
    return true;
  },

  // T9: cuadrícula de franjas por cubículo.
  // Filas = cubículos (Modelo.cubiculos), columnas = franjas (Modelo.franjas, T8).
  // Cada celda es un botón con data-cub y data-franja; T10 les pondrá el color de libre/ocupada.
  renderFranjas() {
    const franjas = Modelo.franjas();
    const cubiculos = Modelo.cubiculos();
    const pad = n => String(n).padStart(2, "0");

    const cabecera = franjas
      .map(f => `<th scope="col">${pad(f.inicio)}:00</th>`)
      .join("");

    const filas = cubiculos.map(c => `
      <tr data-cub="${c.id}">
        <th scope="row">${c.nombre}</th>
        ${franjas.map(f => {
          // T10: libre u ocupada (color + rayas + texto para lector de pantalla)
          const estado = Modelo.estadoFranja(c.id, f);
          return `
        <td>
          <button class="slot slot--${estado}" type="button"
                  data-cub="${c.id}" data-franja="${f.id}" data-estado="${estado}"
                  aria-label="${c.nombre}, ${f.etiqueta}, ${estado}"></button>
        </td>`;
        }).join("")}
      </tr>`).join("");

    this.$("franjas").innerHTML = `
      <table class="tabla-franjas">
        <caption class="sr-only">Franjas de una hora por cubículo</caption>
        <thead><tr><th scope="col">Cubículo</th>${cabecera}</tr></thead>
        <tbody>${filas}</tbody>
      </table>`;

    const info = this.$("franjasInfo");
    if (info && franjas.length) {
      info.textContent = `${franjas.length} franjas de una hora, de ${franjas[0].etiqueta.slice(0, 5)} a ${franjas[franjas.length - 1].etiqueta.slice(-5)}.`;
    }
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
    Modelo.cargarEjemplo();  // T10: datos de ejemplo (quitar en T25/T33)
    Vista.renderPlano();
    Vista.refrescar(true);   // T9 + T10 + T11: primer dibujo
    Vista.renderReloj();
    setInterval(() => Vista.renderReloj(), 1000);

    // T12: refresco automático de la disponibilidad
    setInterval(() => Vista.refrescar(), Config.REFRESCO_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) Vista.refrescar();   // al volver a la pestaña, actualizar al instante
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.iniciar());