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

  // T13: bloques ocupados de un cubículo en un día, uniendo franjas seguidas.
  // Ej. reservas 10–11 y 11–12 → [{ inicio: 10, fin: 12 }]
  bloquesOcupados(cubId, fecha = this.hoy()) {
    const bloques = [];
    this.franjas().forEach(f => {
      if (this.estadoFranja(cubId, f, fecha) !== "ocupada") return;
      const ultimo = bloques[bloques.length - 1];
      if (ultimo && ultimo.fin === f.inicio) ultimo.fin = f.fin;
      else bloques.push({ inicio: f.inicio, fin: f.fin });
    });
    return bloques;
  },

  // T17: reserva que cubre una franja de un cubículo (o undefined si está libre)
  reservaEn(cubId, franja, fecha = this.hoy()) {
    return this.reservas.find(r =>
      r.cubiculo === cubId &&
      r.fecha === fecha &&
      franja.inicio >= r.inicio &&
      franja.inicio < r.inicio + r.duracion
    );
  },

  // T17: AGENDA CRONOLÓGICA DEL DÍA de un cubículo, de ABRE a CIERRA, sin huecos.
  // Devuelve bloques en orden: { tipo: "libre" | "ocupado", inicio, fin, reserva }
  // Franjas libres seguidas se unen en un bloque; cada reserva es su propio bloque.
  // Ej. [{ tipo: "libre", inicio: 8, fin: 10 }, { tipo: "ocupado", inicio: 10, fin: 12, reserva: {...} }, ...]
  agendaDelDia(cubId, fecha = this.hoy()) {
    const agenda = [];
    this.franjas().forEach(f => {
      const r = this.reservaEn(cubId, f, fecha) || null;
      const ultimo = agenda[agenda.length - 1];
      if (ultimo && ultimo.reserva === r && ultimo.fin === f.inicio) {
        ultimo.fin = f.fin;
      } else {
        agenda.push({ tipo: r ? "ocupado" : "libre", inicio: f.inicio, fin: f.fin, reserva: r });
      }
    });
    return agenda;
  },

  // T13: hora actual con minutos como número decimal (14:30 → 14.5), hora de Monterrey.
  // Sirve para colocar la marca de "ahora" en la línea de tiempo.
  _fmtHoraMin: new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    timeZone: Config.ZONA_HORARIA,
  }),

  horaDecimal(fecha = new Date()) {
    const partes = this._fmtHoraMin.formatToParts(fecha);
    const valor = tipo => Number(partes.find(p => p.type === tipo).value);
    return valor("hour") + valor("minute") / 60;
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

  // T25: id único para cada reserva nueva ("res-001", "res-002", ...)
  _ultimoId: 0,
  nuevoIdReserva() {
    this._ultimoId += 1;
    return `res-${String(this._ultimoId).padStart(3, "0")}`;
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

/* ===== 3. Reglas: lógica de negocio ===== */
const Reglas = {
  // T22: control de aforo. Máximo de personas que admite un cubículo.
  aforo(cubiculo) {
    return Math.min(cubiculo.capacidad, Config.MAX_PERSONAS);
  },

  // T23: horas de inicio que se pueden elegir = franjas libres de hoy que todavía no terminan.
  iniciosDisponibles(cubId, ahora = new Date()) {
    const fecha = Modelo._fmtFechaISO.format(ahora);
    const h = Modelo.horaDecimal(ahora);
    return Modelo.franjas()
      .filter(f => f.fin > h && Modelo.estadoFranja(cubId, f, fecha) === "libre")
      .map(f => f.inicio);
  },

  // T23: duraciones (en horas) que caben empezando en "inicio".
  // Se acota por MAX_HORAS, por la siguiente reserva y por la hora de cierre.
  duracionesPosibles(cubId, inicio, ahora = new Date()) {
    const fecha = Modelo._fmtFechaISO.format(ahora);
    const franjas = Modelo.franjas();
    const i = franjas.findIndex(f => f.inicio === inicio);
    if (i < 0) return [];
    const maximo = Math.floor(Config.MAX_HORAS / Config.FRANJA_HORAS);
    const duraciones = [];
    for (let n = 1; n <= maximo; n++) {
      const f = franjas[i + n - 1];
      if (!f || Modelo.estadoFranja(cubId, f, fecha) !== "libre") break;
      duraciones.push(n * Config.FRANJA_HORAS);
    }
    return duraciones;
  },

  // T26: validación de campos obligatorios. Devuelve { campo: "mensaje" } (vacío = todo bien).
  // Campos: nombre, personas (T22), inicio y duracion (T23).
  validar(datos, ahora = new Date()) {
    const errores = {};
    const cub = Modelo.cubiculos().find(c => c.id === datos.cubiculo);
    if (!cub) return { cubiculo: "Elige un cubículo válido." };

    const nombre = String(datos.nombre ?? "").trim();
    if (!nombre) errores.nombre = "Escribe el nombre del grupo o del responsable.";
    else if (nombre.length < 2) errores.nombre = "Escribe al menos 2 caracteres.";

    const max = this.aforo(cub);
    const personas = Number(datos.personas);
    if (datos.personas === "" || datos.personas == null) errores.personas = "Indica cuántas personas van a usar el cubículo.";
    else if (!Number.isInteger(personas) || personas < 1) errores.personas = "Escribe un número entero, de 1 en adelante.";
    else if (personas > max) errores.personas = `Este cubículo admite hasta ${max} personas.`;

    const inicio = Number(datos.inicio);
    if (datos.inicio === "" || datos.inicio == null) {
      errores.inicio = "Elige la hora de inicio.";
    } else if (!this.iniciosDisponibles(cub.id, ahora).includes(inicio)) {
      errores.inicio = "Esa hora ya no está disponible. Elige otra.";
    } else if (datos.duracion === "" || datos.duracion == null) {
      errores.duracion = "Elige la duración.";
    } else if (!this.duracionesPosibles(cub.id, inicio, ahora).includes(Number(datos.duracion))) {
      errores.duracion = "Esa duración no cabe en el horario libre. Elige otra.";
    }
    return errores;
  },

  // T25: PUNTO ÚNICO DE ALTA. Toda reserva nueva se crea aquí y en ningún otro lado
  // (nadie más debe hacer Modelo.reservas.push). Valida y guarda.
  // Devuelve { ok: true, reserva } o { ok: false, errores }.
  // Reserva: { id, cubiculo, fecha, inicio, duracion, nombre, personas }
  crear(datos, ahora = new Date()) {
    const errores = this.validar(datos, ahora);
    if (Object.keys(errores).length) return { ok: false, errores };

    const reserva = {
      id: Modelo.nuevoIdReserva(),
      cubiculo: datos.cubiculo,
      fecha: Modelo._fmtFechaISO.format(ahora),
      inicio: Number(datos.inicio),
      duracion: Number(datos.duracion),
      nombre: String(datos.nombre).trim(),
      personas: Number(datos.personas),
    };
    Modelo.reservas.push(reserva);
    return { ok: true, reserva };
  },

  cancelar(id) { /* historia 36 */ },
};

/* ===== 4. Vista: todo lo que toca el DOM ===== */
const Vista = {
  $(id) { return document.getElementById(id); },

  // Escapa texto antes de meterlo en innerHTML (los nombres de las reservas los escribe la gente)
  esc(texto) {
    return String(texto).replace(/[&<>"']/g, ch => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  },

  // T3: el plano se genera recorriendo los datos del Modelo
  renderPlano() {
    const html = Modelo.cubiculos().map(c => `
      <button class="booth" type="button" data-cub="${c.id}" aria-haspopup="dialog"
              aria-label="${c.nombre}, capacidad ${c.capacidad} personas">
        <small>Cubículo</small>
        <b>${c.numero}</b>
        <span>Hasta ${c.capacidad} personas</span>
        <strong class="estado-actual"></strong>
        <span class="lt-slot"></span>
      </button>`).join("");
    this.$("plano").innerHTML = html;
  },

  // T11: muestra el estado actual de cada cubículo en su tarjeta del plano.
  // Se puede llamar muchas veces (la T12 lo usará para refrescar).
  // Los colores del estado son de la T5: aquí solo se escribe el texto y data-estado.
  // T11: texto legible de un estado actual (lo usan el plano y el detalle de la T15)
  textoEstado(e) {
    const hora = `${String(e.hasta).padStart(2, "0")}:00`;
    if (e.estado === "cerrado") {
      return `Cerrado · abre ${e.cuando === "mañana" ? "mañana " : ""}a las ${hora}`;
    }
    if (e.estado === "ocupado") return `Ocupado · hasta las ${hora}`;
    return `Libre · hasta las ${hora}`;
  },

  renderEstados(ahora = new Date()) {
    Modelo.cubiculos().forEach(c => {
      const boton = document.querySelector(`.booth[data-cub="${c.id}"]`);
      if (!boton) return;

      const e = Modelo.estadoActual(c.id, ahora);
      const texto = this.textoEstado(e);

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
    this.renderLineasTiempo();   // T13
    this.renderFranjas();
    if (this._detalleCub) this.renderDetalle(ahora);   // T15: el detalle abierto también se actualiza
    this.renderAhora(ahora);     // T13

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

  // T13: LÍNEA DE TIEMPO DIARIA DE OCUPACIÓN.
  // Una pista de ABRE a CIERRA con los bloques ocupados, la parte del día que ya pasó
  // y una marca de "ahora". Se usa chica en cada tarjeta del plano y grande en el detalle (T15).
  // Solo usa <span> porque va dentro de un <button>.
  htmlLineaTiempo(cubId, { conHoras = false } = {}) {
    const pad = n => String(n).padStart(2, "0");
    const total = Config.CIERRA - Config.ABRE;
    const pct = h => ((h - Config.ABRE) / total) * 100;

    const bloques = Modelo.bloquesOcupados(cubId);
    const horasOcupadas = bloques.reduce((suma, b) => suma + (b.fin - b.inicio), 0);
    const rangos = bloques.map(b => `${pad(b.inicio)}:00 – ${pad(b.fin)}:00`);

    const segmentos = bloques.map((b, i) => `
      <span class="lt-bloque" style="left:${pct(b.inicio)}%; width:${pct(b.fin) - pct(b.inicio)}%"
            title="Ocupado ${rangos[i]}"></span>`).join("");

    let horas = "";
    if (conHoras) {
      const marcas = [];
      for (let h = Config.ABRE; h <= Config.CIERRA; h += 2) {
        marcas.push(`<span style="left:${pct(h)}%">${pad(h)}:00</span>`);
      }
      horas = `<span class="lt-horas" aria-hidden="true">${marcas.join("")}</span>`;
    }

    const descripcion = bloques.length
      ? `Ocupado de ${rangos.join(", de ")}`
      : "Sin reservas hoy";

    return `
      <span class="linea-tiempo${conHoras ? " linea-tiempo--grande" : ""}">
        <span class="lt-pista" role="img" aria-label="Línea de tiempo de hoy: ${descripcion}">
          <span class="lt-pasado"></span>
          ${segmentos}
          <span class="lt-ahora" hidden></span>
        </span>
        ${horas}
        <span class="lt-resumen">${horasOcupadas} de ${total} h ocupadas hoy</span>
      </span>`;
  },

  // T13: dibuja la línea de tiempo chica dentro de cada tarjeta del plano
  renderLineasTiempo() {
    Modelo.cubiculos().forEach(c => {
      const hueco = document.querySelector(`.booth[data-cub="${c.id}"] .lt-slot`);
      if (hueco) hueco.innerHTML = this.htmlLineaTiempo(c.id);
    });
  },

  // T13: mueve la marca de "ahora" y sombrea lo que ya pasó del día.
  // Barato: solo cambia estilos, se llama cada que cambia el minuto del reloj.
  renderAhora(ahora = new Date()) {
    const h = Modelo.horaDecimal(ahora);
    const total = Config.CIERRA - Config.ABRE;
    const dentro = h >= Config.ABRE && h < Config.CIERRA;
    const pct = Math.min(Math.max((h - Config.ABRE) / total, 0), 1) * 100;

    document.querySelectorAll(".lt-ahora").forEach(el => {
      el.hidden = !dentro;
      el.style.left = `${pct}%`;
    });
    document.querySelectorAll(".lt-pasado").forEach(el => {
      el.style.width = `${pct}%`;
    });

    // T17: en la agenda, marcar el bloque en curso y atenuar los que ya pasaron
    document.querySelectorAll(".agenda-item").forEach(li => {
      const ini = Number(li.dataset.inicio);
      const fin = Number(li.dataset.fin);
      const actual = h >= ini && h < fin;
      li.classList.toggle("agenda-item--pasado", h >= fin);
      li.classList.toggle("agenda-item--ahora", actual);
      li.querySelector(".agenda-ahora").hidden = !actual;
      if (actual) li.setAttribute("aria-current", "time");
      else li.removeAttribute("aria-current");
    });
  },

  // T15: DEL PLANO AL DETALLE CON UN TOQUE.
  // Tocar (o Enter / Espacio) una tarjeta del plano abre el detalle de ese cubículo.
  // Usa <dialog> nativo: Esc lo cierra, el foco queda atrapado dentro y al cerrar
  // regresa a la tarjeta que lo abrió.
  _detalleCub: null,

  conectarDetalle() {
    const dlg = this.$("detalle");
    if (!dlg || this._conectado) return;   // solo se conecta una vez
    this._conectado = true;

    this.$("plano").addEventListener("click", ev => {
      const tarjeta = ev.target.closest(".booth");
      if (tarjeta) this.abrirDetalle(tarjeta.dataset.cub);
    });

    this.$("detalleCerrar").addEventListener("click", () => dlg.close());
    // Tocar fuera de la caja (en el fondo oscuro) también cierra
    dlg.addEventListener("click", ev => {
      if (ev.target === dlg) dlg.close();
    });
    dlg.addEventListener("close", () => {
      const tarjeta = document.querySelector(`.booth[data-cub="${this._detalleCub}"]`);
      this._detalleCub = null;
      if (tarjeta) tarjeta.focus();
    });
  },

  abrirDetalle(cubId) {
    const dlg = this.$("detalle");
    this._detalleCub = cubId;
    this.renderDetalle();
    if (!dlg.open) dlg.showModal();
  },

  // T16 + T17: PANEL DE DETALLE DEL CUBÍCULO.
  // T16: estado actual, ficha (capacidad, horario, horas libres, próxima reserva) y línea de tiempo.
  // T17: agenda cronológica del día (bloques libres y ocupados en orden, con el bloque en curso marcado).
  // T18–T19 lo van a extender (botón "Reservar").
  renderDetalle(ahora = new Date()) {
    const c = Modelo.cubiculos().find(x => x.id === this._detalleCub);
    if (!c) return;
    const pad = n => String(n).padStart(2, "0");
    const e = Modelo.estadoActual(c.id, ahora);
    const agenda = Modelo.agendaDelDia(c.id);
    const h = Modelo.horaDecimal(ahora);
    
    // T16: números de la ficha
    const total = Config.CIERRA - Config.ABRE;
    const horasOcupadas = agenda
      .filter(b => b.tipo === "ocupado")
      .reduce((suma, b) => suma + (b.fin - b.inicio), 0);
    const proxima = agenda.find(b => b.tipo === "ocupado" && b.inicio > h);

    // T17: lista de la agenda
    const itemsAgenda = agenda.map(b => {
      const rango = `${pad(b.inicio)}:00 – ${pad(b.fin)}:00`;
      const quien = b.tipo === "ocupado"
        ? `<strong>Ocupado</strong>${b.reserva.nombre ? ` · ${this.esc(b.reserva.nombre)}` : ""}`
        : `<strong>Libre</strong>`;
      return `
        <li class="agenda-item agenda-item--${b.tipo}" data-inicio="${b.inicio}" data-fin="${b.fin}">
          <span class="agenda-hora">${rango}</span>
          <span class="agenda-que">${quien}</span>
          <span class="agenda-ahora" hidden>Ahora</span>
        </li>`;
    }).join("");

    this.$("detalleTitulo").textContent = c.nombre;
    this.$("detalleCuerpo").innerHTML = `
      <p class="detalle-estado" data-estado="${e.estado}">${this.textoEstado(e)}</p>
      <dl class="detalle-ficha">
        <div><dt>Capacidad</dt><dd>${c.capacidad} personas</dd></div>
        <div><dt>Horario</dt><dd>${pad(Config.ABRE)}:00 – ${pad(Config.CIERRA)}:00</dd></div>
        <div><dt>Libre hoy</dt><dd>${total - horasOcupadas} de ${total} h</dd></div>
        <div><dt>Próxima reserva</dt><dd>${proxima ? `${pad(proxima.inicio)}:00` : "Ninguna hoy"}</dd></div>
      </dl>
      <h3 class="detalle-sub">Ocupación de hoy</h3>
      ${this.htmlLineaTiempo(c.id, { conHoras: true })}
      <h3 class="detalle-sub">Agenda de hoy</h3>
      <ol class="agenda">${itemsAgenda}</ol>`;
    this.renderAhora(ahora);
    accionreservar.renderizar();   // T19
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
    if (elHora && elHora.textContent !== hora) {
      elHora.textContent = hora;
      this.renderAhora(ahora);   // T13: cada minuto nuevo, mover la marca de "ahora"
    }
    if (elFecha && elFecha.textContent !== fecha) elFecha.textContent = fecha;
  },
};

// T18. Cierre del panel y manejo del foco //
const cierrepanel = {
  iniciar() {
    const panel = document.getElementById("detalle");
    if (!panel) return;
    Vista.conectarDetalle();
    // Al cerrar el panel se descarta el formulario de reserva a medias
    panel.addEventListener("close", () => FormReserva.reiniciar());
  }
};

// T19. Acción principal "Reservar" contextual //
// El texto del botón cambia según el cubículo; abre el formulario de reserva (T22–T26).
const accionreservar = {
  iniciar() {
    const contenedor = document.getElementById("detalleAccion");
    if (!contenedor) return;
    contenedor.addEventListener("click", ev => {
      if (ev.target.closest("#btnReservar")) FormReserva.abrir();
    });
  },

  renderizar() {
    const cubId = Vista._detalleCub;
    const contenedor = document.getElementById("detalleAccion");
    if (!cubId || !contenedor) return;

    const hayHoras = Reglas.iniciosDisponibles(cubId).length > 0;
    const estado = Modelo.estadoActual(cubId).estado;

    let texto = "Reservar";
    if (!hayHoras) texto = "Sin horarios disponibles hoy";
    else if (estado === "ocupado") texto = "Reservar otro horario";

    // Solo se vuelve a dibujar si cambió algo (así no se pierde el foco del botón)
    const firma = `${texto}|${hayHoras}`;
    if (contenedor.dataset.firma === firma) return;
    contenedor.dataset.firma = firma;
    contenedor.innerHTML = `<button type="button" class="btn" id="btnReservar"${hayHoras ? "" : " disabled"}>${texto}</button>`;
  }
};

// T22–T26. Formulario de reserva dentro del panel de detalle.
// Pasos: "form" (T22 grupo y aforo, T23 hora y duración, T26 validación con foco)
//        → "resumen" (T24) → "exito". El alta real la hace Reglas.crear (T25).
const FormReserva = {
  _cub: null,
  _paso: null,
  _datos: { nombre: "", personas: "", inicio: "", duracion: "" },
  _ultima: null,
  _ids: { nombre: "rNombre", personas: "rPersonas", inicio: "rInicio", duracion: "rDuracion" },
  _fmtDiaMes: new Intl.DateTimeFormat(Config.LOCALE, { day: "numeric", month: "long", timeZone: Config.ZONA_HORARIA }),

  $(id) { return document.getElementById(id); },
  cubiculo() { return Modelo.cubiculos().find(c => c.id === this._cub); },
  pad(n) { return String(n).padStart(2, "0"); },

  iniciar() {
    const cont = this.$("detalleReserva");
    if (!cont) return;

    cont.addEventListener("submit", ev => {
      ev.preventDefault();
      this.enviar();
    });
    cont.addEventListener("change", ev => {
      const campo = ev.target;
      if (!campo.name) return;
      this._datos[campo.name] = campo.value;
      if (campo.name === "inicio") this.actualizarDuraciones();
    });
    cont.addEventListener("click", ev => {
      const boton = ev.target.closest("[data-accion]");
      if (!boton) return;
      const accion = boton.dataset.accion;
      if (accion === "cancelar" || accion === "listo") this.volver();
      else if (accion === "editar") this.mostrar("form");
      else if (accion === "confirmar") this.confirmar();
    });
  },

  abrir() {
    if (!Vista._detalleCub) return;
    this._cub = Vista._detalleCub;
    this._datos = { nombre: "", personas: "", inicio: "", duracion: "" };
    this.mostrar("form");
  },

  // Muestra un paso y manda el foco: al primer campo con error, o al título del paso.
  mostrar(paso, errores = {}) {
    this._paso = paso;
    this.$("detalleCuerpo").hidden = true;
    this.$("detalleAccion").hidden = true;
    this.$("detalleReserva").hidden = false;
    this.$("detalleEyebrow").textContent = "Reservar";

    if (paso === "form") this.renderForm(errores);
    else if (paso === "resumen") this.renderResumen();
    else this.renderExito();

    const primero = ["nombre", "personas", "inicio", "duracion"].find(k => errores[k]);
    const destino = primero ? this.$(this._ids[primero]) : this.$("reservaTitulo");
    if (destino) destino.focus();
  },

  // Regresa al detalle normal del cubículo (ya con la reserva nueva en la agenda)
  volver() {
    this.reiniciar();
    Vista.renderDetalle();
    const titulo = this.$("detalleTitulo");
    titulo.setAttribute("tabindex", "-1");
    titulo.focus();
  },

  reiniciar() {
    this._paso = null;
    this._datos = { nombre: "", personas: "", inicio: "", duracion: "" };
    const cont = this.$("detalleReserva");
    if (!cont) return;
    cont.hidden = true;
    cont.innerHTML = "";
    this.$("detalleCuerpo").hidden = false;
    this.$("detalleAccion").hidden = false;
    this.$("detalleEyebrow").textContent = "Detalle";
  },

  textoDuracion(n, inicio) {
    return `${n === 1 ? "1 hora" : `${n} horas`} (hasta las ${this.pad(inicio + n)}:00)`;
  },

  // T22 + T23 + T26: formulario. "errores" = { campo: mensaje } que viene de Reglas.validar
  renderForm(errores = {}) {
    const c = this.cubiculo();
    const d = this._datos;
    const esc = t => Vista.esc(t);
    const max = Reglas.aforo(c);
    const inicios = Reglas.iniciosDisponibles(c.id);

    // Si lo que estaba elegido ya no está disponible, se limpia (la validación lo avisa)
    if (d.inicio !== "" && !inicios.includes(Number(d.inicio))) { d.inicio = ""; d.duracion = ""; }
    const duraciones = d.inicio !== "" ? Reglas.duracionesPosibles(c.id, Number(d.inicio)) : [];
    if (d.duracion !== "" && !duraciones.includes(Number(d.duracion))) d.duracion = "";

    const attrs = (k, ayuda = "") =>
      `aria-invalid="${errores[k] ? "true" : "false"}" aria-describedby="${ayuda}${this._ids[k]}Error"`;
    const err = k => (errores[k] ? esc(errores[k]) : "");

    const opInicio = inicios.map(h =>
      `<option value="${h}"${String(h) === String(d.inicio) ? " selected" : ""}>${this.pad(h)}:00</option>`).join("");
    const opDuracion = duraciones.map(n =>
      `<option value="${n}"${String(n) === String(d.duracion) ? " selected" : ""}>${this.textoDuracion(n, Number(d.inicio))}</option>`).join("");

    this.$("detalleReserva").innerHTML = `
      <form id="formReserva" novalidate>
        <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">Reservar ${esc(c.nombre)}</h3>
        <p class="detalle-dato">Hoy · hasta ${Config.MAX_HORAS} horas por reserva · máximo ${max} personas.</p>

        <div class="campo">
          <label for="rNombre">Nombre del grupo o responsable</label>
          <input id="rNombre" name="nombre" type="text" maxlength="40" autocomplete="off"
                 value="${esc(d.nombre)}" ${attrs("nombre", "rNombreAyuda ")} required>
          <small id="rNombreAyuda">Así aparecerá en la agenda.</small>
          <small class="campo-error" id="rNombreError">${err("nombre")}</small>
        </div>

        <div class="campo">
          <label for="rPersonas">Número de personas</label>
          <input id="rPersonas" name="personas" type="number" inputmode="numeric" min="1" max="${max}" step="1"
                 value="${esc(d.personas)}" ${attrs("personas", "rPersonasAyuda ")} required>
          <small id="rPersonasAyuda">De 1 a ${max} personas.</small>
          <small class="campo-error" id="rPersonasError">${err("personas")}</small>
        </div>

        <div class="campos-fila">
          <div class="campo">
            <label for="rInicio">Hora de inicio</label>
            <select id="rInicio" name="inicio" ${attrs("inicio")} required>
              <option value="">${inicios.length ? "Elige una hora" : "Sin horas libres hoy"}</option>${opInicio}
            </select>
            <small class="campo-error" id="rInicioError">${err("inicio")}</small>
          </div>
          <div class="campo">
            <label for="rDuracion">Duración</label>
            <select id="rDuracion" name="duracion" ${d.inicio === "" ? "disabled" : ""} ${attrs("duracion")} required>
              <option value="">${d.inicio === "" ? "Primero la hora" : "Elige la duración"}</option>${opDuracion}
            </select>
            <small class="campo-error" id="rDuracionError">${err("duracion")}</small>
          </div>
        </div>
        <p class="detalle-dato">Solo aparecen las horas libres; la duración se ajusta a lo que sigue libre.</p>

        <div class="reserva-botones">
          <button type="button" class="btn btn--sec" data-accion="cancelar">Cancelar</button>
          <button type="submit" class="btn">Revisar reserva</button>
        </div>
      </form>`;
  },

  // T23: al cambiar la hora de inicio, solo se rehace el selector de duración
  actualizarDuraciones() {
    const sel = this.$("rDuracion");
    if (!sel) return;
    const inicio = this._datos.inicio;

    if (inicio === "") {
      this._datos.duracion = "";
      sel.disabled = true;
      sel.innerHTML = `<option value="">Primero la hora</option>`;
      return;
    }
    const duraciones = Reglas.duracionesPosibles(this._cub, Number(inicio));
    if (!duraciones.includes(Number(this._datos.duracion))) this._datos.duracion = "";
    sel.disabled = false;
    sel.innerHTML = `<option value="">Elige la duración</option>` + duraciones.map(n =>
      `<option value="${n}">${this.textoDuracion(n, Number(inicio))}</option>`).join("");
    sel.value = String(this._datos.duracion);
  },

  // T26: valida; si hay errores vuelve al formulario con el foco en el primer campo con error
  enviar() {
    const datos = new FormData(this.$("formReserva"));
    ["nombre", "personas", "inicio", "duracion"].forEach(k => { this._datos[k] = datos.get(k) ?? ""; });

    const errores = Reglas.validar({ cubiculo: this._cub, ...this._datos });
    if (Object.keys(errores).length) this.mostrar("form", errores);
    else this.mostrar("resumen");
  },

  // T24: resumen previo
  renderResumen() {
    const c = this.cubiculo();
    const d = this._datos;
    const inicio = Number(d.inicio);
    const dur = Number(d.duracion);
    const personas = Number(d.personas);

    this.$("detalleReserva").innerHTML = `
      <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">Revisa tu reserva</h3>
      <p class="detalle-dato">Todavía no está confirmada. Revisa los datos y confirma.</p>
      <dl class="detalle-ficha">
        <div><dt>Cubículo</dt><dd>${Vista.esc(c.nombre)}</dd></div>
        <div><dt>Día</dt><dd>Hoy, ${this._fmtDiaMes.format(new Date())}</dd></div>
        <div class="ancho"><dt>Horario</dt><dd>${this.pad(inicio)}:00 – ${this.pad(inicio + dur)}:00 (${dur} ${dur === 1 ? "hora" : "horas"})</dd></div>
        <div><dt>Grupo o responsable</dt><dd>${Vista.esc(d.nombre.trim())}</dd></div>
        <div><dt>Personas</dt><dd>${personas}</dd></div>
      </dl>
      <div class="reserva-botones">
        <button type="button" class="btn btn--sec" data-accion="editar">Editar</button>
        <button type="button" class="btn" data-accion="confirmar">Confirmar reserva</button>
      </div>`;
  },

  // T24 + T25: confirmar = crear la reserva por el punto único de alta
  confirmar() {
    const res = Reglas.crear({ cubiculo: this._cub, ...this._datos });
    if (!res.ok) {                       // p. ej. alguien tomó esa hora mientras tanto
      this.mostrar("form", res.errores);
      return;
    }
    this._ultima = res.reserva;
    Vista.refrescar(true);               // plano, franjas y agenda ya con la reserva nueva
    this.mostrar("exito");
  },

  renderExito() {
    const c = this.cubiculo();
    const r = this._ultima;
    this.$("detalleReserva").innerHTML = `
      <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">¡Reserva confirmada!</h3>
      <p class="detalle-dato">${Vista.esc(c.nombre)} · hoy de ${this.pad(r.inicio)}:00 a ${this.pad(r.inicio + r.duracion)}:00 ·
        a nombre de <strong>${Vista.esc(r.nombre)}</strong> (${r.personas} ${r.personas === 1 ? "persona" : "personas"}).</p>
      <p class="detalle-dato">Código: <strong>${r.id}</strong></p>
      <div class="reserva-botones">
        <button type="button" class="btn" data-accion="listo">Listo</button>
      </div>`;
  },
};

/* ===== 5. App: punto de entrada que conecta todo ===== */
const App = {
  iniciar() {
    Modelo.cargarEjemplo();  // T10: datos de ejemplo (quitar en T25/T33)
    Vista.renderPlano();
    Vista.conectarDetalle(); // T15: tocar una tarjeta abre su detalle
    Vista.refrescar(true);   // T9 + T10 + T11 + T13: primer dibujo
    Vista.renderReloj();
    cierrepanel.iniciar();
    accionreservar.iniciar();
    FormReserva.iniciar();   // T22–T26
    setInterval(() => Vista.renderReloj(), 1000);

    // T12: refresco automático de la disponibilidad
    setInterval(() => Vista.refrescar(), Config.REFRESCO_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) Vista.refrescar();   // al volver a la pestaña, actualizar al instante
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.iniciar());