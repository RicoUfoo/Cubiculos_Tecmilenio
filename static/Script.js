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
  // T33: persistencia local (localStorage) con esquema versionado
  CLAVE_STORAGE: "cubiculos.estado",
  CLAVES_ANTIGUAS: ["cubiculos.reservas.v1"],   // se migran y se borran
  // T36: clave del identificador anónimo de este navegador (el "dueño" de sus reservas)
  CLAVE_DISPOSITIVO: "cubiculos.dispositivo",
  // T36: v2 = cada reserva guarda "dueno" (ver Almacen.MIGRACIONES[1])
  ESQUEMA_VERSION: 2,                           // súbelo cuando cambie la forma de los datos
  MAX_NOMBRE: 40,
  // T12: cada cuántos milisegundos se refresca la disponibilidad
  REFRESCO_MS: 15000,
  // T6: formato y zona horaria del reloj
  LOCALE: "es-MX",
  ZONA_HORARIA: "America/Monterrey",
  // T26: mínimo de caracteres para el nombre del grupo
  MIN_NOMBRE: 2,
  // T31: cuánto tiempo se queda resaltada la reserva nueva y visible el aviso
  AVISO_MS: 6000,
  // T40: cuánto tiempo se puede deshacer una cancelación
  DESHACER_MS: 10000,
};

/* ===== 1b. Mensajes: catálogo centralizado (T30) =====
   TODOS los textos de error y aviso viven aquí. Ninguna otra parte del código
   escribe mensajes a mano: los pide por nombre (Mensajes.horaPasada(), etc.).
   Para cambiar una redacción o traducir la página, basta con editar este objeto. */
const Mensajes = {
  // Ayudante: 9 → "09:00"
  hora: h => `${String(h).padStart(2, "0")}:00`,
  horario: () => `${Mensajes.hora(Config.ABRE)} – ${Mensajes.hora(Config.CIERRA)}`,

  // Cubículo
  cubiculoInvalido: () => "Elige un cubículo válido.",

  // Nombre (T22 / T26)
  nombreVacio: () => "Escribe el nombre del grupo o del responsable.",
  nombreCorto: () => `Escribe al menos ${Config.MIN_NOMBRE} caracteres.`,

  // Personas / aforo (T22)
  personasVacio: () => "Indica cuántas personas van a usar el cubículo.",
  personasInvalido: () => "Escribe un número entero, de 1 en adelante.",
  personasAforo: max => `Este cubículo admite hasta ${max} personas.`,

  // Hora de inicio y duración (T23)
  inicioVacio: () => "Elige la hora de inicio.",
  inicioInvalido: () => "Elige una hora de inicio válida.",
  duracionVacia: () => "Elige la duración.",
  duracionInvalida: () => "Elige una duración válida.",
  duracionMaxima: () => `Cada reserva puede durar como máximo ${Config.MAX_HORAS} horas.`,

  // Horario de operación (T27)
  fueraDeHorario: () => `Solo se puede reservar dentro del horario de operación (${Mensajes.horario()}).`,
  inicioNoAlineado: () => "La hora de inicio debe coincidir con el inicio de una franja.",
  despuesDelCierre: fin => `La reserva terminaría a las ${Mensajes.hora(fin)}, después del cierre (${Mensajes.hora(Config.CIERRA)}).`,
  yaCerro: () => `Ya cerró por hoy (horario ${Mensajes.horario()}). Vuelve mañana a partir de las ${Mensajes.hora(Config.ABRE)}.`,

  // Horas ya transcurridas (T29)
  horaPasada: () => "Esa hora ya pasó. Elige una hora a partir de ahora.",
  horaYaNoDisponible: h => `Las ${Mensajes.hora(h)} ya no están disponibles (pasó la hora o alguien más la reservó). Elige otra.`,

  // Conflictos de agenda (T28)
  choqueCubiculo: lista => `Choca con otra reserva: ${lista}. Elige otro horario.`,
  choqueGrupo: (nombre, lista) => `"${nombre}" ya tiene reservado el ${lista}. Un grupo no puede estar en dos cubículos a la vez.`,
  conflictoExistente: (a, b) => `Conflicto de agenda: ${a} choca con ${b}.`,

  // Persistencia (T33)
  almacenNoDisponible: () => "No se puede usar el almacenamiento del navegador: las reservas solo durarán mientras la página esté abierta.",
  errorAlGuardar: () => "No se pudieron guardar las reservas en este navegador (¿almacenamiento lleno o bloqueado?).",
  datosMigrados: (de, a) => `Datos guardados actualizados del esquema v${de} al v${a}.`,
  migracionFaltante: v => `No hay cómo actualizar los datos del esquema v${v}.`,

  // Hidratación y saneamiento (T34)
  datosCorruptos: respaldo => `Los datos guardados estaban dañados. Se respaldaron en "${respaldo}" y se empezó sin reservas.`,
  versionFutura: v => `Los datos guardados son de una versión más nueva de la página (esquema v${v}). Se muestran vacíos y no se sobrescriben.`,
  reservaDescartada: (r, motivo) => `Reserva descartada al cargar (${motivo}): ${JSON.stringify(r)}`,
  resumenCarga: (cargadas, descartadas, depuradas) =>
    `Reservas cargadas: ${cargadas} · descartadas por datos inválidos: ${descartadas} · vencidas eliminadas: ${depuradas}.`,
  motivo: {
    noEsObjeto: "no es una reserva",
    cubiculo: "el cubículo no existe",
    fecha: "fecha inválida",
    fechaLejana: `la fecha está a más de ${Config.DIAS_ADELANTE} días`,
    inicio: "hora de inicio fuera del horario o inválida",
    duracion: "duración inválida o termina después del cierre",
    nombre: "nombre vacío o inválido",
    personas: "número de personas inválido o mayor al aforo",
    choque: "choca con otra reserva del mismo cubículo",
    choqueGrupo: "el mismo grupo ya tiene otro cubículo a esa hora",
  },

  // Depuración de vencidas (T35)
  reservasDepuradas: n => `Se ${n === 1 ? "eliminó 1 reserva vencida" : `eliminaron ${n} reservas vencidas`} de días anteriores.`,

  // Reserva exitosa (T31)
  reservaCreada: (cub, ini, fin, codigo) => `Reserva confirmada: ${cub}, de ${Mensajes.hora(ini)} a ${Mensajes.hora(fin)}. Código ${codigo}.`,

  // Cancelación de reservas propias (T36)
  cancelarNoExiste: () => "Esa reserva ya no existe. Es posible que ya se haya cancelado.",
  cancelarNoEsTuya: () => "Solo puedes cancelar las reservas que hiciste desde este navegador.",
  cancelarYaTermino: () => "Esa reserva ya terminó y no se puede cancelar.",
  cancelarFallo: () => "No se pudo guardar la cancelación en este navegador, así que la reserva sigue activa. Intenta de nuevo.",
  reservaCancelada: (cub, ini, fin) => `Reserva cancelada: ${cub}, de ${Mensajes.hora(ini)} a ${Mensajes.hora(fin)}. El horario quedó libre.`,
  etiquetaTuya: () => "Tu reserva",
  botonCancelarReserva: () => "Cancelar reserva",
  cancelarAriaLabel: (nombre, rango) => `Cancelar la reserva de ${nombre}, ${rango}`,

  // Confirmación integrada para acciones destructivas (T37)
  confirmarEyebrow: () => "Confirmar",
  confirmarCancelarTitulo: () => "¿Cancelar esta reserva?",
  confirmarCancelarAviso: () => "El horario quedará libre para que otra persona lo aparte. Si fue un error, justo después tendrás unos segundos para deshacerlo.",
  cancelarNoPosibleTitulo: () => "No se pudo cancelar",
  botonConfirmarCancelar: () => "Sí, cancelar reserva",
  botonConservar: () => "No, conservar reserva",
  botonEntendido: () => "Entendido",

  // Liberación inmediata del cubículo (T39)
  liberarNoExiste: () => "Esa reserva ya no existe. Es posible que ya se haya liberado o cancelado.",
  liberarNoEsTuya: () => "Solo puedes liberar un cubículo que reservaste desde este navegador.",
  liberarNoEmpieza: () => "Tu reserva todavía no empieza. Si ya no la necesitas, cancélala.",
  liberarYaTermino: () => "Esa reserva ya terminó: el cubículo ya está libre.",
  liberarFallo: () => "No se pudo guardar la liberación en este navegador, así que tu reserva sigue activa. Intenta de nuevo.",
  cubiculoLiberado: (cub, hasta) => `${cub} liberado: queda libre desde ahora hasta las ${Mensajes.hora(hasta)}.`,
  botonLiberar: () => "Liberar ahora",
  botonLiberarCubiculo: () => "Ya terminé · liberar cubículo",
  liberarAriaLabel: (nombre, rango) => `Liberar ahora el cubículo de la reserva de ${nombre}, ${rango}`,
  confirmarLiberarTitulo: () => "¿Liberar el cubículo ahora?",
  confirmarLiberarAviso: () => "Tu reserva termina en este momento y el resto del horario queda libre para que otra persona lo aparte. Esta acción no se puede deshacer.",
  liberarNoPosibleTitulo: () => "No se pudo liberar",
  botonConfirmarLiberar: () => "Sí, liberar ahora",
  botonSeguirUsando: () => "No, lo sigo usando",

  // Aviso de cancelación con opción de deshacer (T40)
  botonDeshacer: () => "Deshacer",
  deshacerAriaLabel: () => "Deshacer la cancelación de la reserva",
  reservaRestaurada: (cub, ini, fin) => `Reserva restaurada: ${cub}, de ${Mensajes.hora(ini)} a ${Mensajes.hora(fin)}.`,
  deshacerYaExiste: () => "Esa reserva ya estaba restaurada.",
  deshacerYaTermino: () => "Ya no se puede deshacer: esa reserva ya terminó.",
  deshacerChoque: lista => `Ya no se puede deshacer: ese horario ahora choca con ${lista}.`,
  deshacerChoqueGrupo: (nombre, lista) => `Ya no se puede deshacer: "${nombre}" ya tiene reservado el ${lista}.`,
  deshacerFallo: () => "No se pudo guardar la reserva restaurada en este navegador. Intenta de nuevo.",
};

/* ===== 1c. Identidad del dispositivo (T36) =====
   La página no pide registro ni contraseña, así que "reserva propia" significa
   "hecha desde este navegador". Al crear una reserva se guarda un identificador
   anónimo (el token); solo quien tenga ese mismo token en su localStorage puede
   cancelarla. No es seguridad real (no hay servidor): evita cancelar por error
   o a propósito la reserva de otra persona desde la interfaz. */
const Identidad = {
  _token: null,

  _generar() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  },

  token() {
    if (this._token) return this._token;
    let t = null;
    try { t = localStorage.getItem(Config.CLAVE_DISPOSITIVO); } catch (e) { /* sin almacenamiento */ }
    if (!t || !/^[\w-]{8,64}$/.test(t)) {
      t = this._generar();
      try { localStorage.setItem(Config.CLAVE_DISPOSITIVO, t); } catch (e) { /* vive solo en memoria */ }
    }
    this._token = t;
    return t;
  },

  esMia(reserva) {
    return !!reserva && !!reserva.dueno && reserva.dueno === this.token();
  },
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

  // T29: BLOQUEO DE HORAS YA TRANSCURRIDAS.
  // Una franja "ya pasó" cuando su hora de fin ya llegó (hora de Monterrey).
  // La franja en curso NO ha pasado: todavía se puede usar lo que queda de ella.
  franjaYaPaso(franja, ahora = new Date()) {
    return franja.fin <= this.horaDecimal(ahora);
  },

  // T12: "firma" de la disponibilidad: un texto que cambia solo si cambia algo visible
  // (el día, el estado actual de algún cubículo o alguna franja). Sirve para saber
  // si hace falta volver a dibujar la pantalla.
  firmaDisponibilidad(ahora = new Date()) {
    // T29: la hora entera entra en la firma para redibujar justo cuando una franja pasa
    const partes = [this.hoy(), `h${Math.floor(this.horaDecimal(ahora))}`];
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
    return Modelo.franjas()
      .filter(f => !Modelo.franjaYaPaso(f, ahora) && Modelo.estadoFranja(cubId, f, fecha) === "libre")
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

  // T27: CUMPLIMIENTO DEL HORARIO DE OPERACIÓN.
  // ¿El lugar está abierto en este instante? (ABRE ≤ hora < CIERRA, hora de Monterrey)
  estaAbierto(ahora = new Date()) {
    const h = Modelo.horaDecimal(ahora);
    return h >= Config.ABRE && h < Config.CIERRA;
  },

  // T27: revisa que una reserva [inicio, inicio + duracion) quepa en el horario de operación.
  // Devuelve null si está bien, o { campo, mensaje } con el primer problema encontrado.
  revisarHorario(inicio, duracion, ahora = new Date()) {
    const h = Modelo.horaDecimal(ahora);
    const error = (campo, mensaje) => ({ campo, mensaje });

    if (h >= Config.CIERRA) return error("inicio", Mensajes.yaCerro());
    if (!Number.isInteger(inicio)) return error("inicio", Mensajes.inicioInvalido());
    if (inicio < Config.ABRE || inicio >= Config.CIERRA) return error("inicio", Mensajes.fueraDeHorario());
    if ((inicio - Config.ABRE) % Config.FRANJA_HORAS !== 0) return error("inicio", Mensajes.inicioNoAlineado());
    // T29: no se puede reservar una franja que ya terminó
    if (Modelo.franjaYaPaso({ fin: inicio + Config.FRANJA_HORAS }, ahora)) return error("inicio", Mensajes.horaPasada());
    if (duracion == null) return null;   // todavía no se eligió duración

    if (!Number.isInteger(duracion) || duracion < Config.FRANJA_HORAS || duracion % Config.FRANJA_HORAS !== 0) {
      return error("duracion", Mensajes.duracionInvalida());
    }
    if (duracion > Config.MAX_HORAS) return error("duracion", Mensajes.duracionMaxima());
    if (inicio + duracion > Config.CIERRA) return error("duracion", Mensajes.despuesDelCierre(inicio + duracion));
    return null;
  },

  // T28: DETECCIÓN DE CONFLICTOS DE AGENDA.
  // Dos rangos de horas se traslapan si cada uno empieza antes de que el otro termine.
  // (10–12 y 12–13 NO chocan: uno termina justo cuando empieza el otro)
  seTraslapan(ini1, fin1, ini2, fin2) {
    return ini1 < fin2 && ini2 < fin1;
  },

  // T28: busca las reservas que chocan con una reserva propuesta.
  // Devuelve { cubiculo: [...], grupo: [...] }:
  //   cubiculo -> reservas del MISMO cubículo en un horario que se traslapa.
  //   grupo    -> reservas del MISMO grupo (mismo nombre) en OTRO cubículo a la misma hora
  //               (un grupo no puede estar en dos cubículos a la vez).
  // "ignorarId" sirve para revisar una reserva ya guardada sin que choque consigo misma.
  conflictos({ cubiculo, fecha, inicio, duracion, nombre = "" }, ignorarId = null) {
    const fin = inicio + duracion;
    const grupo = String(nombre).trim().toLocaleLowerCase(Config.LOCALE);
    const mismoDiaYHora = r =>
      r.id !== ignorarId &&
      r.fecha === fecha &&
      this.seTraslapan(inicio, fin, r.inicio, r.inicio + r.duracion);

    return {
      cubiculo: Modelo.reservas.filter(r => mismoDiaYHora(r) && r.cubiculo === cubiculo),
      grupo: grupo
        ? Modelo.reservas.filter(r =>
            mismoDiaYHora(r) &&
            r.cubiculo !== cubiculo &&
            String(r.nombre ?? "").trim().toLocaleLowerCase(Config.LOCALE) === grupo)
        : [],
    };
  },

  // T28: texto legible de una reserva que choca (ej. "Cubículo 2 de 10:00 a 12:00")
  describirReserva(r) {
    const cub = Modelo.cubiculos().find(c => c.id === r.cubiculo);
    return `${cub ? cub.nombre : r.cubiculo} de ${Mensajes.hora(r.inicio)} a ${Mensajes.hora(r.inicio + r.duracion)}`;
  },

  // T28: revisa TODAS las reservas guardadas y devuelve los pares que chocan entre sí.
  // Útil cuando las reservas vengan de otro lado (localStorage, T33) y puedan venir mal.
  conflictosExistentes() {
    const pares = [];
    Modelo.reservas.forEach((a, i) => {
      Modelo.reservas.slice(i + 1).forEach(b => {
        if (a.cubiculo === b.cubiculo && a.fecha === b.fecha &&
            this.seTraslapan(a.inicio, a.inicio + a.duracion, b.inicio, b.inicio + b.duracion)) {
          pares.push([a, b]);
        }
      });
    });
    return pares;
  },

  // T26: validación de campos obligatorios. Devuelve { campo: "mensaje" } (vacío = todo bien).
  // Campos: nombre, personas (T22), inicio y duracion (T23).
  // T27 (horario de operación) y T28 (conflictos de agenda) se revisan aquí también.
  validar(datos, ahora = new Date()) {
    const errores = {};
    const cub = Modelo.cubiculos().find(c => c.id === datos.cubiculo);
    if (!cub) return { cubiculo: Mensajes.cubiculoInvalido() };

    const nombre = String(datos.nombre ?? "").trim();
    if (!nombre) errores.nombre = Mensajes.nombreVacio();
    else if (nombre.length < Config.MIN_NOMBRE) errores.nombre = Mensajes.nombreCorto();

    const max = this.aforo(cub);
    const personas = Number(datos.personas);
    if (datos.personas === "" || datos.personas == null) errores.personas = Mensajes.personasVacio();
    else if (!Number.isInteger(personas) || personas < 1) errores.personas = Mensajes.personasInvalido();
    else if (personas > max) errores.personas = Mensajes.personasAforo(max);

    const inicio = Number(datos.inicio);
    const sinInicio = datos.inicio === "" || datos.inicio == null;
    const sinDuracion = datos.duracion === "" || datos.duracion == null;
    const duracion = sinDuracion ? null : Number(datos.duracion);

    // T27: horario de operación
    const fueraDeHorario = this.revisarHorario(sinInicio ? NaN : inicio, duracion, ahora);
    if (sinInicio) {
      errores.inicio = this.estaAbierto(ahora) || Modelo.horaDecimal(ahora) < Config.ABRE
        ? Mensajes.inicioVacio()
        : fueraDeHorario.mensaje;
      return errores;
    }
    if (fueraDeHorario) {
      errores[fueraDeHorario.campo] = fueraDeHorario.mensaje;
      return errores;
    }
    if (sinDuracion) {
      errores.duracion = Mensajes.duracionVacia();
      return errores;
    }

    // T28: conflictos de agenda
    const fecha = Modelo._fmtFechaISO.format(ahora);
    const choques = this.conflictos({ cubiculo: cub.id, fecha, inicio, duracion, nombre });
    if (choques.cubiculo.length) {
      const lista = choques.cubiculo.map(r => this.describirReserva(r)).join(" y ");
      // Si choca justo en la hora de inicio, el problema es la hora; si choca después, la duración
      const chocaAlInicio = choques.cubiculo.some(r => inicio >= r.inicio && inicio < r.inicio + r.duracion);
      errores[chocaAlInicio ? "inicio" : "duracion"] = Mensajes.choqueCubiculo(lista);
    } else if (choques.grupo.length) {
      const lista = choques.grupo.map(r => this.describirReserva(r)).join(" y ");
      errores.inicio = Mensajes.choqueGrupo(nombre, lista);
    }
    return errores;
  },

  // T25: PUNTO ÚNICO DE ALTA. Toda reserva nueva se crea aquí y en ningún otro lado
  // (nadie más debe hacer Modelo.reservas.push). Valida y guarda.
  // Devuelve { ok: true, reserva } o { ok: false, errores }.
  // Reserva: { id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno }   (dueno: T36)
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
      dueno: Identidad.token(),   // T36: quién puede cancelarla
    };
    Modelo.reservas.push(reserva);
    Sincronizacion.avisar({ tipo: "reserva-creada", reserva });   // T32: toda la interfaz se entera
    return { ok: true, reserva };
  },

  // T36: CANCELACIÓN AUTOSERVICIO DE RESERVAS PROPIAS.
  // ¿La reserva ya terminó? (de un día anterior, o de hoy con hora de fin ya transcurrida)
  yaTermino(reserva, ahora = new Date()) {
    const hoy = Modelo._fmtFechaISO.format(ahora);
    if (reserva.fecha !== hoy) return reserva.fecha < hoy;
    return reserva.inicio + reserva.duracion <= Modelo.horaDecimal(ahora);
  },

  // T36: devuelve null si se puede cancelar, o el mensaje (catálogo T30) de por qué no.
  // Se puede cancelar: existe, es de este navegador y todavía no termina
  // (una reserva en curso sí: libera lo que le queda).
  motivoNoCancelar(reserva, ahora = new Date()) {
    if (!reserva) return Mensajes.cancelarNoExiste();
    if (!Identidad.esMia(reserva)) return Mensajes.cancelarNoEsTuya();
    if (this.yaTermino(reserva, ahora)) return Mensajes.cancelarYaTermino();
    return null;
  },

  puedeCancelar(reserva, ahora = new Date()) {
    return this.motivoNoCancelar(reserva, ahora) === null;
  },

  // T38: PUNTO ÚNICO DE BAJA (el espejo de crear, T25). Nadie más debe quitar reservas
  // a mano (salvo la depuración de vencidas, T35).
  // La baja es TRANSACCIONAL: primero se quita del modelo, luego se intenta guardar; si el
  // guardado falla se deshace todo, para que la pantalla y lo guardado nunca se contradigan.
  // El id de una reserva dada de baja no se reutiliza (Modelo._ultimoId solo sube y se guarda).
  // Devuelve { ok: true, reserva } o { ok: false, error }.
  cancelar(id, ahora = new Date()) {
    const reserva = Modelo.reservas.find(r => r.id === id);
    const motivo = this.motivoNoCancelar(reserva, ahora);
    if (motivo) return { ok: false, error: motivo };

    const respaldo = Modelo.reservas;
    Modelo.reservas = respaldo.filter(r => r.id !== id);
    if (!Almacen.guardarSeguro()) {
      Modelo.reservas = respaldo;   // deshacer: la reserva sigue activa
      return { ok: false, error: Mensajes.cancelarFallo() };
    }
    // yaGuardado: el almacén ya quedó al día, no hace falta guardar otra vez (T33)
    Sincronizacion.avisar({ tipo: "reserva-cancelada", reserva, yaGuardado: true });   // T32
    return { ok: true, reserva };
  },

  // T40: DESHACER UNA CANCELACIÓN (T36).
  // La reserva cancelada se vuelve a dar de alta TAL CUAL (mismo id y código, mismo dueño).
  // Como el id de una baja nunca se reutiliza (T38), no puede chocar con una reserva nueva.
  // Antes de restaurarla se revisa todo otra vez: en esos segundos el mundo pudo cambiar
  // (alguien tomó el horario, la reserva terminó, otra pestaña la restauró).
  // motivoNoDeshacer devuelve null si se puede, o el mensaje (catálogo T30) de por qué ya no.
  motivoNoDeshacer(reserva, ahora = new Date()) {
    if (!reserva) return Mensajes.cancelarNoExiste();
    if (!Identidad.esMia(reserva)) return Mensajes.cancelarNoEsTuya();
    if (Modelo.reservas.some(r => r.id === reserva.id)) return Mensajes.deshacerYaExiste();
    if (this.yaTermino(reserva, ahora)) return Mensajes.deshacerYaTermino();
    const choques = this.conflictos(reserva, reserva.id);   // T28
    if (choques.cubiculo.length) {
      return Mensajes.deshacerChoque(choques.cubiculo.map(r => this.describirReserva(r)).join(" y "));
    }
    if (choques.grupo.length) {
      return Mensajes.deshacerChoqueGrupo(reserva.nombre, choques.grupo.map(r => this.describirReserva(r)).join(" y "));
    }
    return null;
  },

  // Transaccional, igual que cancelar (T38): si el guardado falla se deshace y se puede reintentar.
  // Devuelve { ok: true, reserva } o { ok: false, error, reintentar? }.
  deshacerCancelacion(reserva, ahora = new Date()) {
    const motivo = this.motivoNoDeshacer(reserva, ahora);
    if (motivo) return { ok: false, error: motivo };

    const respaldo = Modelo.reservas;
    const restaurada = { ...reserva };
    Modelo.reservas = [...respaldo, restaurada];
    if (!Almacen.guardarSeguro()) {
      Modelo.reservas = respaldo;
      return { ok: false, error: Mensajes.deshacerFallo(), reintentar: true };
    }
    Sincronizacion.avisar({ tipo: "reserva-restaurada", reserva: restaurada, yaGuardado: true });   // T32
    return { ok: true, reserva: restaurada };
  },

  // T39: LIBERACIÓN INMEDIATA DEL CUBÍCULO.
  // Si un grupo termina antes, libera su reserva EN CURSO: la reserva se recorta para que
  // termine al inicio de la franja actual, y desde esa franja hasta el fin original todo
  // queda libre al instante (la franja en curso sí se puede reservar, T29).
  // Lo que ya se usó se conserva en la agenda del día. Si se libera durante la primera
  // franja, no queda nada usado y la reserva se da de baja completa.
  // Diferencia con cancelar (T36): cancelar es para reservas que todavía no empiezan.

  // ¿La reserva está ocurriendo ahora mismo? (hoy, inicio ≤ ahora < fin)
  enCurso(reserva, ahora = new Date()) {
    if (!reserva || reserva.fecha !== Modelo._fmtFechaISO.format(ahora)) return false;
    const h = Modelo.horaDecimal(ahora);
    return reserva.inicio <= h && h < reserva.inicio + reserva.duracion;
  },

  // Reserva propia que está en curso en un cubículo (o undefined)
  reservaPropiaEnCurso(cubId, ahora = new Date()) {
    return Modelo.reservas.find(r => r.cubiculo === cubId && Identidad.esMia(r) && this.enCurso(r, ahora));
  },

  // null si se puede liberar, o el mensaje (catálogo T30) de por qué no
  motivoNoLiberar(reserva, ahora = new Date()) {
    if (!reserva) return Mensajes.liberarNoExiste();
    if (!Identidad.esMia(reserva)) return Mensajes.liberarNoEsTuya();
    if (this.yaTermino(reserva, ahora)) return Mensajes.liberarYaTermino();
    if (!this.enCurso(reserva, ahora)) return Mensajes.liberarNoEmpieza();
    return null;
  },

  puedeLiberar(reserva, ahora = new Date()) {
    return this.motivoNoLiberar(reserva, ahora) === null;
  },

  // Igual que cancelar (T38): transaccional. Si el guardado falla, se deshace todo.
  // Devuelve { ok: true, reserva, desde, hasta, eliminada } o { ok: false, error }.
  //   desde/hasta = horas que quedaron libres; eliminada = true si no quedó nada usado.
  liberar(id, ahora = new Date()) {
    const reserva = Modelo.reservas.find(r => r.id === id);
    const motivo = this.motivoNoLiberar(reserva, ahora);
    if (motivo) return { ok: false, error: motivo };

    const franja = Modelo.franjaActual(ahora);
    const desde = franja ? franja.inicio : reserva.inicio;
    const hasta = reserva.inicio + reserva.duracion;
    const usada = desde - reserva.inicio;   // horas que sí se usaron

    const respaldo = Modelo.reservas;
    // Se crea una copia recortada (no se modifica el objeto) para poder deshacer sin rastro
    Modelo.reservas = usada > 0
      ? respaldo.map(r => (r.id === id ? { ...r, duracion: usada } : r))
      : respaldo.filter(r => r.id !== id);
    if (!Almacen.guardarSeguro()) {
      Modelo.reservas = respaldo;   // deshacer: la reserva sigue activa
      return { ok: false, error: Mensajes.liberarFallo() };
    }
    Sincronizacion.avisar({ tipo: "cubiculo-liberado", reserva, desde, hasta, yaGuardado: true });   // T32
    return { ok: true, reserva, desde, hasta, eliminada: usada <= 0 };
  },
};

/* ===== 3b. Sincronización: avisa a toda la interfaz cuando cambian los datos (T32) =====
   Quien cambia datos (Reglas.crear, Almacen al depurar o al recibir otra pestaña) llama
   a Sincronizacion.avisar(). Quien muestra datos se suscribe con Sincronizacion.alCambiar().
   Así ninguna parte de la pantalla se queda con información vieja. */
const Sincronizacion = {
  _oyentes: [],
  alCambiar(fn) { this._oyentes.push(fn); },
  avisar(cambio = { tipo: "cambio" }) {
    this._oyentes.forEach(fn => {
      try { fn(cambio); } catch (e) { console.error("Error al sincronizar la interfaz:", e); }
    });
  },
};

/* ===== 3c. Almacen: persistencia, hidratación y depuración (T33, T34, T35) ===== */
const Almacen = {
  _disponible: null,
  _soloLectura: false,   // T34: true si los datos son de una versión más nueva (no se pisan)

  // T33: ¿se puede usar localStorage? (puede estar bloqueado o en modo privado)
  disponible() {
    if (this._disponible === null) {
      try {
        const k = "__cubiculos_prueba__";
        localStorage.setItem(k, k);
        localStorage.removeItem(k);
        this._disponible = true;
      } catch (e) {
        this._disponible = false;
        console.warn(Mensajes.almacenNoDisponible());
      }
    }
    return this._disponible;
  },

  // T33: ESQUEMA VERSIONADO. Lo que se guarda siempre tiene esta forma:
  // { version: 2, guardado: "2026-11-12T18:30:00.000Z", ultimoId: 3,
  //   reservas: [{ id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno }, ...] }
  serializar() {
    return JSON.stringify({
      version: Config.ESQUEMA_VERSION,
      guardado: new Date().toISOString(),
      ultimoId: Modelo._ultimoId,
      reservas: Modelo.reservas.map(({ id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno }) =>
        ({ id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno })),   // T36: dueno
    });
  },

  guardar() {
    if (!this.disponible() || this._soloLectura) return false;
    try {
      localStorage.setItem(Config.CLAVE_STORAGE, this.serializar());
      return true;
    } catch (e) {
      console.warn(Mensajes.errorAlGuardar(), e);
      return false;
    }
  },

  // T38: guardado para operaciones que deben ser transaccionales (como cancelar).
  // Devuelve false SOLO si había que guardar y falló la escritura. Si no hay almacenamiento
  // o los datos son de solo lectura, no hay nada que pueda fallar: la página trabaja en memoria.
  guardarSeguro() {
    if (!this.disponible() || this._soloLectura) return true;
    try {
      localStorage.setItem(Config.CLAVE_STORAGE, this.serializar());
      return true;
    } catch (e) {
      console.warn(Mensajes.errorAlGuardar(), e);
      return false;
    }
  },

  // T33: MIGRACIONES. MIGRACIONES[n] convierte datos del esquema n al n + 1.
  // Cuando cambie la forma de los datos: sube Config.ESQUEMA_VERSION y agrega el paso aquí.
  MIGRACIONES: {
    // v0 = formato viejo: un arreglo suelto de reservas, sin "version", sin "id" ni "personas"
    0: datos => ({
      version: 1,
      ultimoId: 0,
      reservas: (Array.isArray(datos) ? datos : []).map(r => ({ personas: 1, ...r })),
    }),
    // T36: v1 -> v2. Antes de la T36 las reservas solo existían en el localStorage de este
    // navegador, así que todas son de este dispositivo: se les asigna su token para que
    // el dueño pueda cancelarlas.
    1: datos => ({
      version: 2,
      ultimoId: datos.ultimoId,
      reservas: (Array.isArray(datos.reservas) ? datos.reservas : [])
        .map(r => ({ dueno: Identidad.token(), ...r })),
    }),
  },

  migrar(datos) {
    let version = Array.isArray(datos) ? 0 : Number(datos && datos.version);
    if (!Number.isInteger(version) || version < 0) throw new Error("datos sin versión");
    const original = version;
    if (version > Config.ESQUEMA_VERSION) return { futuro: true, version };
    while (version < Config.ESQUEMA_VERSION) {
      const paso = this.MIGRACIONES[version];
      if (!paso) throw new Error(Mensajes.migracionFaltante(version));
      datos = paso(datos);
      version = datos.version;
    }
    if (original !== version) console.info(Mensajes.datosMigrados(original, version));
    return { datos, migrado: original !== version };
  },

  // T33 + T34: lee y migra lo guardado. Nunca lanza error: devuelve qué encontró.
  // estado: "vacio" | "ok" | "corrupto" | "futuro"
  leer() {
    if (!this.disponible()) return { estado: "vacio" };
    let crudo = localStorage.getItem(Config.CLAVE_STORAGE);
    let antigua = null;
    if (crudo === null) {   // ¿hay datos con una clave vieja?
      antigua = Config.CLAVES_ANTIGUAS.find(k => localStorage.getItem(k) !== null) || null;
      if (!antigua) return { estado: "vacio" };
      crudo = localStorage.getItem(antigua);
    }
    try {
      const r = this.migrar(JSON.parse(crudo));
      if (r.futuro) return { estado: "futuro", version: r.version };
      return { estado: "ok", datos: r.datos, cambio: r.migrado || !!antigua, antigua };
    } catch (e) {
      return { estado: "corrupto", crudo, antigua, error: e };
    }
  },

  // T34: HIDRATACIÓN Y SANEAMIENTO DEL ESTADO AL INICIAR.
  // 1) lee y migra, 2) revisa cada reserva y descarta las inválidas o que chocan,
  // 3) repara ids, 4) quita las vencidas (T35), 5) si algo cambió, guarda la versión limpia.
  // Se usa al abrir la página y cuando otra pestaña guarda (evento "storage").
  hidratar(ahora = new Date()) {
    const lectura = this.leer();
    let reservas = [];
    let ultimoId = 0;
    let hayQueGuardar = false;
    this._soloLectura = false;

    if (lectura.estado === "corrupto") {
      const respaldo = `${Config.CLAVE_STORAGE}.danado.${Date.now()}`;
      try { localStorage.setItem(respaldo, lectura.crudo); } catch (e) { /* sin espacio: se pierde */ }
      console.warn(Mensajes.datosCorruptos(respaldo), lectura.error);
      hayQueGuardar = true;
    } else if (lectura.estado === "futuro") {
      this._soloLectura = true;
      console.warn(Mensajes.versionFutura(lectura.version));
    } else if (lectura.estado === "ok") {
      reservas = lectura.datos.reservas;
      ultimoId = Number(lectura.datos.ultimoId) || 0;
      hayQueGuardar = lectura.cambio;
    }

    const { validas, descartadas } = this.sanear(reservas, ahora);
    descartadas.forEach(d => console.warn(Mensajes.reservaDescartada(d.reserva, d.motivo)));

    // Reparar ids: el contador nunca puede quedar por debajo del id más alto guardado
    const numero = r => Number(String(r.id).slice(4));
    ultimoId = Math.max(ultimoId, ...validas.filter(r => r.id).map(numero), 0);
    Modelo._ultimoId = ultimoId;
    validas.forEach(r => { if (!r.id) { r.id = Modelo.nuevoIdReserva(); hayQueGuardar = true; } });

    Modelo.reservas = validas;
    const depuradas = this.depurarVencidas(ahora, { avisar: false });   // T35

    if (hayQueGuardar || descartadas.length || depuradas) this.guardar();
    if (lectura.antigua && lectura.estado !== "futuro") {
      try { localStorage.removeItem(lectura.antigua); } catch (e) { /* no importa */ }
    }
    if (lectura.estado !== "vacio") {
      console.info(Mensajes.resumenCarga(Modelo.reservas.length, descartadas.length, depuradas));
    }
    return { estado: lectura.estado, cargadas: Modelo.reservas.length, descartadas, depuradas };
  },

  // T34: SANEAMIENTO. Convierte cada reserva a la forma correcta o la descarta con un motivo.
  // Usa las mismas reglas que el formulario (horario T27, aforo T22, conflictos T28).
  // Si dos reservas chocan, se queda la más antigua (la de id menor).
  sanear(lista, ahora = new Date()) {
    const validas = [];
    const descartadas = [];
    if (!Array.isArray(lista)) return { validas, descartadas };

    const hoy = Modelo._fmtFechaISO.format(ahora);
    const limite = this.sumarDias(hoy, Config.DIAS_ADELANTE);
    const M = Mensajes.motivo;
    const idsVistos = new Set();
    const orden = r => (r && /^res-\d+$/.test(r.id) ? Number(r.id.slice(4)) : Infinity);

    [...lista].sort((a, b) => orden(a) - orden(b)).forEach(bruta => {
      const descartar = motivo => descartadas.push({ reserva: bruta, motivo });
      if (!bruta || typeof bruta !== "object" || Array.isArray(bruta)) return descartar(M.noEsObjeto);

      const cub = Modelo.cubiculos().find(c => c.id === bruta.cubiculo);
      if (!cub) return descartar(M.cubiculo);

      const fecha = String(bruta.fecha ?? "");
      if (!this.fechaValida(fecha)) return descartar(M.fecha);
      if (fecha > limite) return descartar(M.fechaLejana);

      const inicio = Number(bruta.inicio);
      if (!Number.isInteger(inicio) || inicio < Config.ABRE || inicio >= Config.CIERRA ||
          (inicio - Config.ABRE) % Config.FRANJA_HORAS !== 0) return descartar(M.inicio);

      const duracion = Number(bruta.duracion);
      if (!Number.isInteger(duracion) || duracion < Config.FRANJA_HORAS ||
          duracion % Config.FRANJA_HORAS !== 0 || duracion > Config.MAX_HORAS ||
          inicio + duracion > Config.CIERRA) return descartar(M.duracion);

      const nombre = typeof bruta.nombre === "string" ? bruta.nombre.trim().slice(0, Config.MAX_NOMBRE) : "";
      if (nombre.length < Config.MIN_NOMBRE) return descartar(M.nombre);

      const personas = Number(bruta.personas);
      if (!Number.isInteger(personas) || personas < 1 || personas > Reglas.aforo(cub)) return descartar(M.personas);

      const choca = otra => otra.fecha === fecha &&
        Reglas.seTraslapan(inicio, inicio + duracion, otra.inicio, otra.inicio + otra.duracion);
      if (validas.some(o => o.cubiculo === cub.id && choca(o))) return descartar(M.choque);
      const grupo = nombre.toLocaleLowerCase(Config.LOCALE);
      if (validas.some(o => o.cubiculo !== cub.id && choca(o) &&
          o.nombre.toLocaleLowerCase(Config.LOCALE) === grupo)) return descartar(M.choqueGrupo);

      // id: se conserva si es válido y no está repetido; si no, se asigna uno nuevo después
      let id = /^res-\d+$/.test(bruta.id) && !idsVistos.has(bruta.id) ? bruta.id : null;
      if (id) idsVistos.add(id);

      // T36: el dueño se conserva; sin dueño válido queda en null (nadie podrá cancelarla)
      const dueno = typeof bruta.dueno === "string" && /^[\w-]{8,64}$/.test(bruta.dueno) ? bruta.dueno : null;

      validas.push({ id, cubiculo: cub.id, fecha, inicio, duracion, nombre, personas, dueno });
    });
    return { validas, descartadas };
  },

  // "2026-11-12" es una fecha real (no "2026-02-30")
  fechaValida(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    const [a, m, d] = texto.split("-").map(Number);
    const f = new Date(Date.UTC(a, m - 1, d));
    return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
  },

  sumarDias(texto, dias) {
    const [a, m, d] = texto.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
  },

  // T35: DEPURACIÓN AUTOMÁTICA DE RESERVAS VENCIDAS.
  // Vencida = de un día anterior a hoy (hora de Monterrey). Las de hoy que ya terminaron
  // se conservan hasta medianoche para que la agenda del día siga mostrando quién usó cada
  // cubículo (de todos modos esas horas ya están bloqueadas por la T29).
  // Corre al iniciar, cada REFRESCO_MS y al volver a la pestaña. Si quita algo, avisa (T32)
  // y por lo tanto se guarda (T33) y se redibuja.
  vencida(reserva, hoy) {
    return reserva.fecha < hoy;   // "AAAA-MM-DD" se compara bien como texto
  },

  depurarVencidas(ahora = new Date(), { avisar = true } = {}) {
    const hoy = Modelo._fmtFechaISO.format(ahora);
    const antes = Modelo.reservas.length;
    Modelo.reservas = Modelo.reservas.filter(r => !this.vencida(r, hoy));
    const quitadas = antes - Modelo.reservas.length;
    if (quitadas) {
      console.info(Mensajes.reservasDepuradas(quitadas));
      if (avisar) Sincronizacion.avisar({ tipo: "depuracion", cantidad: quitadas });
    }
    return quitadas;
  },
};

/* ===== 4. Vista: todo lo que toca el DOM ===== */
const Vista = {
  $(id) { return document.getElementById(id); },

  // T31: id de la reserva recién creada (se resalta en la tabla y en la agenda)
  _resaltar: null,
  _timerResaltar: null,
  _timerAviso: null,

  // T31: aviso flotante que se lee en voz alta con lector de pantalla (role="status")
  avisar(texto) {
    const el = this.$("aviso");
    if (!el) return;
    // Con el detalle abierto (modal), el resto de la página queda inactivo y tapado:
    // el aviso se mueve dentro del diálogo para que se vea y se anuncie.
    const dlg = this.$("detalle");
    const destino = dlg && dlg.open ? dlg : document.body;
    if (el.parentNode !== destino) destino.appendChild(el);
    clearTimeout(this._timerAviso);
    el.textContent = "";                 // vaciar primero para que se anuncie aunque se repita
    el.hidden = false;
    requestAnimationFrame(() => { el.textContent = texto; el.classList.add("aviso--visible"); });
    this._timerAviso = setTimeout(() => {
      el.classList.remove("aviso--visible");
      el.hidden = true;
    }, Config.AVISO_MS);
  },

  // T31: resalta una reserva unos segundos y luego vuelve a la normalidad
  resaltar(id) {
    clearTimeout(this._timerResaltar);
    this._resaltar = id;
    this.refrescar(true);
    this._timerResaltar = setTimeout(() => {
      this._resaltar = null;
      this.refrescar(true);
    }, Config.AVISO_MS);
  },

  // T38: si una reserva desaparece (se cancela aquí, en otra pestaña o se depura), no puede
  // quedar nada apuntando a ella: ni el resaltado de la T31 ni el último código mostrado.
  limpiarHuerfanos() {
    const existe = id => Modelo.reservas.some(r => r.id === id);
    if (this._resaltar && !existe(this._resaltar)) {
      clearTimeout(this._timerResaltar);
      this._resaltar = null;
    }
    if (FormReserva._ultima) {
      // T39: si se liberó (recortó), apuntar a la versión actual, no a la vieja
      FormReserva._ultima = Modelo.reservas.find(r => r.id === FormReserva._ultima.id) || null;
    }
  },

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
  // Las reservas guardadas (T33) llegan por el evento "storage" y por Sincronizacion.
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
    this.renderFranjas(ahora);
    this.centrarFranjaActual(ahora);   // T41
    if (this._detalleCub) this.renderDetalle(ahora);   // T15: el detalle abierto también se actualiza
    this.renderAhora(ahora);     // T13
    FormReserva.sincronizar(ahora);   // T32: si el formulario está abierto, sus horas también

    if (cub) {
      const mismo = document.querySelector(`.slot[data-cub="${cub}"][data-franja="${franja}"]`);
      if (mismo) mismo.focus();
    }
    return true;
  },

  // T9: cuadrícula de franjas por cubículo.
  // Filas = cubículos (Modelo.cubiculos), columnas = franjas (Modelo.franjas, T8).
  // Cada celda es un botón con data-cub y data-franja; T10 les pondrá el color de libre/ocupada.
  renderFranjas(ahora = new Date()) {
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
          // T29: las franjas que ya pasaron quedan bloqueadas (atenuadas, sin acción)
          const pasada = Modelo.franjaYaPaso(f, ahora);
          // T31: la reserva recién creada se resalta unos segundos
          const r = estado === "ocupada" ? Modelo.reservaEn(c.id, f) : null;
          const nueva = r && r.id && r.id === this._resaltar;
          const clases = ["slot", `slot--${estado}`];
          if (pasada) clases.push("slot--pasada");
          if (nueva) clases.push("slot--nueva");
          const accion = pasada ? "ya pasó, no se puede reservar"
            : estado === "libre" ? "toca para reservar" : "toca para ver el detalle";
          return `
        <td>
          <button class="${clases.join(" ")}" type="button"
                  data-cub="${c.id}" data-franja="${f.id}" data-estado="${estado}"
                  ${pasada ? 'aria-disabled="true" title="Ya pasó"' : ""}
                  aria-label="${c.nombre}, ${f.etiqueta}, ${estado}, ${accion}"></button>
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

  // T41: en pantallas angostas la tabla de franjas se desliza de lado. Al cargar se deja a la
  // vista la hora actual (en vez de empezar siempre en la apertura). Solo la primera vez: después
  // se respeta lo que la persona deslizó. Si no hay scroll (pantalla ancha) no hace nada.
  _franjasCentradas: false,
  centrarFranjaActual(ahora = new Date()) {
    if (this._franjasCentradas) return;
    const caja = this.$("franjas");
    if (!caja || caja.scrollWidth <= caja.clientWidth) return;
    const franja = Modelo.franjaActual(ahora);
    const slot = franja && caja.querySelector(`.slot[data-franja="${franja.id}"]`);
    if (!slot) return;
    const etiqueta = caja.querySelector("tbody th");   // columna fija de nombres: tapa lo de la izquierda
    caja.scrollLeft += slot.getBoundingClientRect().left - caja.getBoundingClientRect().left
      - (etiqueta ? etiqueta.offsetWidth : 0) - 8;
    this._franjasCentradas = true;
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

    // T29 + T32: tocar una franja de la tabla.
    //   libre y a futuro -> abre el formulario con esa hora ya elegida
    //   ocupada          -> abre el detalle del cubículo
    //   ya pasó          -> bloqueada, no hace nada
    this.$("franjas").addEventListener("click", ev => {
      const slot = ev.target.closest(".slot");
      if (!slot || slot.getAttribute("aria-disabled") === "true") return;
      const franja = Modelo.franjaPorId(slot.dataset.franja);
      this.abrirDetalle(slot.dataset.cub);
      if (franja && slot.dataset.estado === "libre") FormReserva.abrir({ inicio: franja.inicio });
    });

    this.$("detalleCerrar").addEventListener("click", () => dlg.close());
    // Tocar fuera de la caja (en el fondo oscuro) también cierra
    dlg.addEventListener("click", ev => {
      if (ev.target === dlg) dlg.close();
    });
    dlg.addEventListener("close", () => {
      const aviso = this.$("aviso");                  // T31: el aviso regresa a la página
      if (aviso && aviso.parentNode === dlg) document.body.appendChild(aviso);
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
    Deshacer.ubicar();   // T40: un aviso de deshacer pendiente debe quedar dentro del modal
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
        ? `<strong>Ocupado</strong>${b.reserva.nombre ? ` · ${this.esc(b.reserva.nombre)}` : ""}${Identidad.esMia(b.reserva) ? ` <span class="agenda-tuya">${Mensajes.etiquetaTuya()}</span>` : ""}`
        : `<strong>Libre</strong>`;
      const nueva = b.reserva && b.reserva.id && b.reserva.id === this._resaltar;   // T31
      // T39: la reserva propia EN CURSO se libera (lo usado se conserva);
      // T36: las propias que todavía no empiezan se cancelan
      const liberable = b.tipo === "ocupado" && Reglas.puedeLiberar(b.reserva, ahora);
      const cancelable = !liberable && b.tipo === "ocupado" && Reglas.puedeCancelar(b.reserva, ahora);
      let accion = "";
      if (liberable) {
        accion = `<button type="button" class="btn btn--chico agenda-cancelar" data-liberar="${this.esc(b.reserva.id)}"
                  aria-label="${this.esc(Mensajes.liberarAriaLabel(b.reserva.nombre, rango))}">${Mensajes.botonLiberar()}</button>`;
      } else if (cancelable) {
        accion = `<button type="button" class="btn btn--sec btn--chico agenda-cancelar" data-cancelar="${this.esc(b.reserva.id)}"
                  aria-label="${this.esc(Mensajes.cancelarAriaLabel(b.reserva.nombre, rango))}">${Mensajes.botonCancelarReserva()}</button>`;
      }
      return `
        <li class="agenda-item agenda-item--${b.tipo}${nueva ? " agenda-item--nueva" : ""}" data-inicio="${b.inicio}" data-fin="${b.fin}">
          <span class="agenda-hora">${rango}</span>
          <span class="agenda-que">${quien}</span>
          <span class="agenda-ahora" hidden>Ahora</span>
          ${accion}
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
      // T29 + T32: en cuanto cambia la hora, bloquear la franja que acaba de pasar
      // (refrescar solo redibuja si algo cambió, así que es barato llamarlo cada minuto)
      this.refrescar(false, ahora);
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
    // T37: con una confirmación abierta, el panel también se limpia al cerrarse (no se borra nada)
    panel.addEventListener("close", () => Confirmacion.reiniciar());
    // T37: Esc con una confirmación abierta solo cierra la confirmación, no todo el panel
    panel.addEventListener("cancel", ev => {
      if (Confirmacion.activa()) { ev.preventDefault(); Confirmacion.cerrar(); }
    });
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
      const liberar = ev.target.closest("#btnLiberar");   // T39
      if (liberar) LiberarCubiculo.pedir(liberar.dataset.liberar);
    });
  },

  renderizar() {
    const cubId = Vista._detalleCub;
    const contenedor = document.getElementById("detalleAccion");
    if (!cubId || !contenedor) return;

    // T39: si tu reserva está ocurriendo en este cubículo, la acción a la mano es liberarlo
    const mia = Reglas.reservaPropiaEnCurso(cubId);

    const hayHoras = Reglas.iniciosDisponibles(cubId).length > 0;
    const estado = Modelo.estadoActual(cubId).estado;

    // T27: después del cierre ya no se puede reservar para hoy
    const yaCerro = Modelo.horaDecimal() >= Config.CIERRA;

    let texto = "Reservar";
    if (yaCerro) texto = `Cerrado · abre mañana a las ${String(Config.ABRE).padStart(2, "0")}:00`;
    else if (!hayHoras) texto = "Sin horarios disponibles hoy";
    else if (estado === "ocupado") texto = "Reservar otro horario";

    // Solo se vuelve a dibujar si cambió algo (así no se pierde el foco del botón)
    const habilitado = hayHoras && !yaCerro;
    const firma = `${texto}|${habilitado}|${mia ? mia.id : ""}`;
    if (contenedor.dataset.firma === firma) return;
    contenedor.dataset.firma = firma;
    const btnLiberar = mia
      ? `<button type="button" class="btn btn--sec" id="btnLiberar" data-liberar="${Vista.esc(mia.id)}">${Mensajes.botonLiberarCubiculo()}</button>`
      : "";
    contenedor.innerHTML = `${btnLiberar}<button type="button" class="btn" id="btnReservar"${habilitado ? "" : " disabled"}>${texto}</button>`;
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

  // "pre" permite llegar con la hora ya elegida (T29: al tocar una franja libre de la tabla)
  abrir(pre = {}) {
    if (!Vista._detalleCub) return;
    this._cub = Vista._detalleCub;
    this._datos = { nombre: "", personas: "", inicio: "", duracion: "" };
    if (pre.inicio != null && Reglas.iniciosDisponibles(this._cub).includes(pre.inicio)) {
      this._datos.inicio = String(pre.inicio);
      const durs = Reglas.duracionesPosibles(this._cub, pre.inicio);
      if (durs.length) this._datos.duracion = String(durs[0]);
    }
    this.mostrar("form");
  },

  // T26/T32: marca (o limpia) el error de un campo sin redibujar todo el formulario
  marcarError(campo, mensaje = "") {
    const input = this.$(this._ids[campo]);
    const caja = this.$(`${this._ids[campo]}Error`);
    if (input) input.setAttribute("aria-invalid", mensaje ? "true" : "false");
    if (caja) caja.textContent = mensaje;
  },

  // T32: SINCRONIZACIÓN DEL FORMULARIO ABIERTO.
  // Si mientras alguien llena el formulario pasa una hora (T29) o se reserva un horario,
  // las opciones de hora se actualizan solas. Si la hora elegida ya no existe, se quita
  // y se avisa con el mensaje del catálogo (T30). No redibuja si nada cambió (no pierde el foco).
  sincronizar(ahora = new Date()) {
    if (this._paso !== "form") return;
    const sel = this.$("rInicio");
    if (!sel) return;

    const inicios = Reglas.iniciosDisponibles(this._cub, ahora);
    const firma = inicios.join(",");
    if (sel.dataset.opciones === firma) return;
    sel.dataset.opciones = firma;

    const elegido = this._datos.inicio;
    const sigue = elegido === "" || inicios.includes(Number(elegido));
    sel.innerHTML = `<option value="">${inicios.length ? "Elige una hora" : "Sin horas libres hoy"}</option>` +
      inicios.map(h => `<option value="${h}">${this.pad(h)}:00</option>`).join("");
    if (!sigue) {
      this._datos.inicio = "";
      this._datos.duracion = "";
      this.marcarError("inicio", Mensajes.horaYaNoDisponible(Number(elegido)));
    }
    sel.value = this._datos.inicio;
    this.actualizarDuraciones();
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
        <p class="detalle-dato">Hoy · horario ${this.pad(Config.ABRE)}:00 – ${this.pad(Config.CIERRA)}:00 · hasta ${Config.MAX_HORAS} horas por reserva · máximo ${max} personas.</p>

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
            <select id="rInicio" name="inicio" data-opciones="${inicios.join(",")}" ${attrs("inicio")} required>
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
    // T32: Reglas.crear ya avisó a Sincronizacion -> plano, franjas, agenda y botón se redibujaron.
    // T31: retroalimentación: pantalla de éxito, aviso hablado y resaltado de la reserva nueva
    const r = res.reserva;
    this.mostrar("exito");
    Vista.avisar(Mensajes.reservaCreada(this.cubiculo().nombre, r.inicio, r.inicio + r.duracion, r.id));
    Vista.resaltar(r.id);
  },

  // T31: RETROALIMENTACIÓN DE RESERVA EXITOSA.
  // Ícono + título con foco + ficha con todos los datos + código para presentarse.
  // Además (en confirmar): aviso flotante que lee el lector de pantalla y resaltado
  // de la reserva en la tabla de franjas y en la agenda.
  renderExito() {
    const c = this.cubiculo();
    const r = this._ultima;
    const fin = r.inicio + r.duracion;
    this.$("detalleReserva").innerHTML = `
      <div class="exito">
        <span class="exito-icono" aria-hidden="true">✓</span>
        <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">¡Reserva confirmada!</h3>
        <p class="detalle-dato">El cubículo ya aparece como ocupado en el plano y en la agenda.</p>
      </div>
      <dl class="detalle-ficha">
        <div><dt>Cubículo</dt><dd>${Vista.esc(c.nombre)}</dd></div>
        <div><dt>Código</dt><dd class="exito-codigo">${Vista.esc(r.id)}</dd></div>
        <div class="ancho"><dt>Horario</dt><dd>Hoy, ${this.pad(r.inicio)}:00 – ${this.pad(fin)}:00 (${r.duracion} ${r.duracion === 1 ? "hora" : "horas"})</dd></div>
        <div><dt>A nombre de</dt><dd>${Vista.esc(r.nombre)}</dd></div>
        <div><dt>Personas</dt><dd>${r.personas}</dd></div>
      </dl>
      <p class="detalle-dato">Guarda tu código; te lo pueden pedir para usar el cubículo.</p>
      <div class="reserva-botones">
        <button type="button" class="btn" data-accion="listo">Ver la agenda</button>
      </div>`;
  },
};

// T37. Confirmación integrada para acciones destructivas //
// Panel dentro del mismo <dialog> (no usa window.confirm): reemplaza el detalle mientras se pide
// confirmar, con el foco en el título, un botón seguro ("conservar") y uno de peligro.
// Es genérico: cualquier acción destructiva futura llama a Confirmacion.pedir({...}).
// Cerrar el panel, tocar fuera, Esc o "conservar" NUNCA ejecutan la acción.
//   op = { titulo, mensaje, datos: [{ etiqueta, valor, ancho }], textoConfirmar, textoConservar,
//          alConfirmar: () => ({ ok, error }),  alTerminar: res => void,
//          vigente: () => (null | "mensaje de por qué ya no aplica") }
const Confirmacion = {
  _activa: false,
  _procesando: false,
  _op: null,

  $(id) { return document.getElementById(id); },
  activa() { return this._activa; },

  iniciar() {
    const cont = this.$("detalleConfirmar");
    if (!cont) return;
    cont.addEventListener("click", ev => {
      const boton = ev.target.closest("[data-confirmar]");
      if (!boton) return;
      if (boton.dataset.confirmar === "si") this.confirmar();
      else this.cerrar();
    });
  },

  pedir(op) {
    const cont = this.$("detalleConfirmar");
    if (!cont) return;
    const esc = t => Vista.esc(t);
    this._op = op;
    this._activa = true;
    this._procesando = false;

    this.$("detalleCuerpo").hidden = true;
    this.$("detalleAccion").hidden = true;
    this.$("detalleEyebrow").textContent = Mensajes.confirmarEyebrow();

    const datos = (op.datos || []).map(d =>
      `<div${d.ancho ? ' class="ancho"' : ""}><dt>${esc(d.etiqueta)}</dt><dd>${esc(d.valor)}</dd></div>`).join("");

    cont.hidden = false;
    cont.innerHTML = `
      <h3 class="reserva-titulo" id="confirmarTitulo" tabindex="-1">${esc(op.titulo)}</h3>
      ${op.mensaje ? `<p class="detalle-dato">${esc(op.mensaje)}</p>` : ""}
      ${datos ? `<dl class="detalle-ficha">${datos}</dl>` : ""}
      <p class="confirmar-error" id="confirmarError" role="alert"></p>
      <div class="reserva-botones">
        <button type="button" class="btn btn--sec" data-confirmar="no">${esc(op.textoConservar || Mensajes.botonEntendido())}</button>
        <button type="button" class="btn btn--peligro" data-confirmar="si">${esc(op.textoConfirmar || "")}</button>
      </div>`;
    this.$("confirmarTitulo").focus();
  },

  // Si no se puede (o ya no aplica): se muestra el motivo y queda solo "Entendido"
  mostrarError(texto) {
    const cont = this.$("detalleConfirmar");
    if (!this._activa || !cont) return;
    this.$("confirmarError").textContent = texto;
    const si = cont.querySelector('[data-confirmar="si"]');
    const no = cont.querySelector('[data-confirmar="no"]');
    if (si) si.hidden = true;
    if (no) { no.textContent = Mensajes.botonEntendido(); no.focus(); }
  },

  confirmar() {
    if (!this._activa || this._procesando || !this._op || !this._op.alConfirmar) return;
    this._procesando = true;   // evita doble clic y que revisar() lo tome por un cambio ajeno
    const op = this._op;
    const res = op.alConfirmar();
    if (res.ok) {
      this.cerrar();
      if (op.alTerminar) op.alTerminar(res);
      return;
    }
    this._procesando = false;
    this.mostrarError(res.error);
  },

  // T38: si mientras se confirma cambia algo (otra pestaña canceló esa reserva, pasó la hora),
  // se avisa en el momento en vez de dejar que se confirme algo que ya no existe.
  revisar() {
    if (!this._activa || this._procesando || !this._op || !this._op.vigente) return;
    const motivo = this._op.vigente();
    if (motivo) this.mostrarError(motivo);
  },

  // Quita la confirmación y regresa al detalle, con el foco en el título del panel
  cerrar() {
    if (!this._activa) return;
    this.reiniciar();
    Vista.renderDetalle();
    const titulo = this.$("detalleTitulo");
    titulo.setAttribute("tabindex", "-1");
    titulo.focus();
  },

  // Deja el panel como estaba (sin tocar el foco ni redibujar: se usa también al cerrar el <dialog>)
  reiniciar() {
    if (!this._activa) return;
    this._activa = false;
    this._procesando = false;
    this._op = null;
    const cont = this.$("detalleConfirmar");
    cont.hidden = true;
    cont.innerHTML = "";
    this.$("detalleCuerpo").hidden = false;
    this.$("detalleAccion").hidden = false;
    this.$("detalleEyebrow").textContent = "Detalle";
  },
};

// T36. Cancelación autoservicio de reservas propias //
// El botón "Cancelar reserva" vive en la agenda del detalle (solo en reservas propias y vigentes).
// Pide confirmación (T37) y la baja la hace Reglas.cancelar (T36 + T38).
const CancelarReserva = {
  iniciar() {
    const cuerpo = document.getElementById("detalleCuerpo");
    if (!cuerpo) return;
    cuerpo.addEventListener("click", ev => {
      const boton = ev.target.closest("[data-cancelar]");
      if (boton) this.pedir(boton.dataset.cancelar);
    });
  },

  pedir(id) {
    const reserva = Modelo.reservas.find(r => r.id === id);
    const motivo = Reglas.motivoNoCancelar(reserva);
    if (motivo) {   // p. ej. alguien la canceló en otra pestaña justo antes del clic
      Confirmacion.pedir({ titulo: Mensajes.cancelarNoPosibleTitulo() });
      Confirmacion.mostrarError(motivo);
      return;
    }

    const cub = Modelo.cubiculos().find(c => c.id === reserva.cubiculo);
    const fin = reserva.inicio + reserva.duracion;
    const pad = FormReserva.pad;
    Confirmacion.pedir({
      titulo: Mensajes.confirmarCancelarTitulo(),
      mensaje: Mensajes.confirmarCancelarAviso(),
      datos: [
        { etiqueta: "Cubículo", valor: cub.nombre },
        { etiqueta: "Código", valor: reserva.id },
        { etiqueta: "Horario", valor: `Hoy, ${pad(reserva.inicio)}:00 – ${pad(fin)}:00`, ancho: true },
        { etiqueta: "A nombre de", valor: reserva.nombre },
      ],
      textoConfirmar: Mensajes.botonConfirmarCancelar(),
      textoConservar: Mensajes.botonConservar(),
      alConfirmar: () => Reglas.cancelar(id),
      // T40: el aviso de cancelación trae el botón "Deshacer"
      alTerminar: res => Deshacer.ofrecer({
        texto: Mensajes.reservaCancelada(cub.nombre, res.reserva.inicio, fin),
        reserva: res.reserva,
      }),
      vigente: () => Reglas.motivoNoCancelar(Modelo.reservas.find(r => r.id === id)),
    });
  },
};

// T40. Aviso de cancelación con opción de deshacer //
// Al cancelar una reserva (T36) no sale un aviso cualquiera: sale uno con el botón "Deshacer"
// durante Config.DESHACER_MS. Deshacer vuelve a crear LA MISMA reserva por
// Reglas.deshacerCancelacion, que revisa todo otra vez (horario, choques, guardado).
// Solo se puede deshacer la última cancelación (una nueva reemplaza al aviso anterior).
// El aviso se pausa mientras se apunta o se enfoca, para no desaparecer mientras se decide.
// Vive en memoria: si se recarga la página ya no hay deshacer.
const Deshacer = {
  _pendiente: null,   // { reserva }: copia de la reserva cancelada
  _timer: null,
  _procesando: false,

  $(id) { return document.getElementById(id); },

  iniciar() {
    const el = this.$("avisoDeshacer");
    if (!el) return;
    el.addEventListener("click", ev => { if (ev.target.closest("[data-deshacer]")) this.ejecutar(); });
    el.addEventListener("pointerenter", () => this.pausar());
    el.addEventListener("pointerleave", () => this.reanudar());
    el.addEventListener("focusin", () => this.pausar());
    el.addEventListener("focusout", () => this.reanudar());
    const dlg = this.$("detalle");
    if (dlg) dlg.addEventListener("close", () => this.ubicar());   // al cerrar el detalle, el aviso vuelve a la página
  },

  // Con el detalle abierto (modal) el resto de la página queda tapado: el aviso va dentro del diálogo
  ubicar() {
    const el = this.$("avisoDeshacer");
    if (!el) return;
    const dlg = this.$("detalle");
    const destino = dlg && dlg.open ? dlg : document.body;
    if (el.parentNode !== destino) destino.appendChild(el);
    el.classList.toggle("aviso--en-detalle", destino === dlg);
    // T41: dentro del detalle, el aviso se coloca justo ENCIMA de la barra de acción (medida en
    // pantalla) para no tapar el botón "Reservar", ni en celular (hoja abajo) ni en escritorio (modal centrado)
    const barra = destino === dlg ? dlg.querySelector(".detalle-accion") : null;
    const caja = barra && !barra.hidden ? barra.getBoundingClientRect() : null;
    el.style.bottom = caja && caja.height ? `${Math.round(window.innerHeight - caja.top + 8)}px` : "";
  },

  html(texto, conBoton) {
    return `<span class="aviso-texto">${Vista.esc(texto)}</span>` + (conBoton
      ? `<button type="button" class="aviso-boton" data-deshacer aria-label="${Vista.esc(Mensajes.deshacerAriaLabel())}">${Mensajes.botonDeshacer()}</button>`
      : "");
  },

  programar() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.cerrar(), this._pendiente ? Config.DESHACER_MS : Config.AVISO_MS);
  },
  pausar() { clearTimeout(this._timer); },
  reanudar() {
    const el = this.$("avisoDeshacer");
    if (el && !el.hidden) this.programar();
  },

  ofrecer({ texto, reserva }) {
    const el = this.$("avisoDeshacer");
    if (!el) { Vista.avisar(texto); return; }   // sin el elemento, al menos el aviso normal
    this.cerrar();                              // reemplaza el aviso anterior (si había)
    this._pendiente = { reserva: { ...reserva } };
    this.ubicar();
    el.textContent = "";                        // vaciar antes de mostrar para que se anuncie
    el.hidden = false;
    requestAnimationFrame(() => {
      if (!this._pendiente) return;
      el.innerHTML = this.html(texto, true);
      el.classList.add("aviso--visible");
    });
    this.programar();
  },

  // Muestra un problema en el mismo aviso. "reintentar" deja el botón (p. ej. falló el guardado).
  mostrarError(texto, reintentar = false) {
    const el = this.$("avisoDeshacer");
    if (!el) return;
    if (!reintentar) this._pendiente = null;
    el.classList.add("aviso--error");
    el.innerHTML = this.html(texto, reintentar);
    el.hidden = false;
    el.classList.add("aviso--visible");
    this.programar();
  },

  ejecutar() {
    const p = this._pendiente;
    if (!p || this._procesando) return;
    this._procesando = true;   // revisar() no debe tomar nuestro propio cambio por uno ajeno
    let res;
    try { res = Reglas.deshacerCancelacion(p.reserva); } finally { this._procesando = false; }
    if (!res.ok) { this.mostrarError(res.error, res.reintentar); return; }

    const r = res.reserva;
    const cub = Modelo.cubiculos().find(c => c.id === r.cubiculo);
    this.cerrar();
    Vista.resaltar(r.id);   // T31: se ve dónde volvió
    Vista.avisar(Mensajes.reservaRestaurada(cub.nombre, r.inicio, r.inicio + r.duracion));
    const dlg = this.$("detalle");
    if (dlg && dlg.open) {   // el botón que tenía el foco desapareció: el foco vuelve al título del detalle
      const titulo = this.$("detalleTitulo");
      titulo.setAttribute("tabindex", "-1");
      titulo.focus();
    }
  },

  // T38: si mientras el aviso está visible cambia algo que impide deshacer (alguien tomó el
  // horario, otra pestaña ya la restauró), se avisa en el momento en vez de fallar al tocar.
  revisar() {
    if (!this._pendiente || this._procesando) return;
    const motivo = Reglas.motivoNoDeshacer(this._pendiente.reserva);
    if (motivo) this.mostrarError(motivo);
  },

  cerrar() {
    clearTimeout(this._timer);
    this._pendiente = null;
    const el = this.$("avisoDeshacer");
    if (!el) return;
    el.classList.remove("aviso--visible", "aviso--error");
    el.hidden = true;
    el.textContent = "";
  },
};

// T39. Liberación inmediata del cubículo //
// Dos accesos: el botón "Liberar ahora" de la reserva en curso en la agenda, y
// "Ya terminé · liberar cubículo" en la barra de acción del detalle (T19).
// Pide confirmación (T37) y el recorte lo hace Reglas.liberar.
const LiberarCubiculo = {
  iniciar() {
    const cuerpo = document.getElementById("detalleCuerpo");
    if (!cuerpo) return;
    cuerpo.addEventListener("click", ev => {
      const boton = ev.target.closest("[data-liberar]");
      if (boton) this.pedir(boton.dataset.liberar);
    });
  },

  pedir(id) {
    const reserva = Modelo.reservas.find(r => r.id === id);
    const motivo = Reglas.motivoNoLiberar(reserva);
    if (motivo) {   // p. ej. justo terminó la hora o se liberó en otra pestaña
      Confirmacion.pedir({ titulo: Mensajes.liberarNoPosibleTitulo() });
      Confirmacion.mostrarError(motivo);
      return;
    }

    const cub = Modelo.cubiculos().find(c => c.id === reserva.cubiculo);
    const fin = reserva.inicio + reserva.duracion;
    const pad = FormReserva.pad;
    Confirmacion.pedir({
      titulo: Mensajes.confirmarLiberarTitulo(),
      mensaje: Mensajes.confirmarLiberarAviso(),
      datos: [
        { etiqueta: "Cubículo", valor: cub.nombre },
        { etiqueta: "Código", valor: reserva.id },
        { etiqueta: "Tu reserva", valor: `Hoy, ${pad(reserva.inicio)}:00 – ${pad(fin)}:00`, ancho: true },
        { etiqueta: "Queda libre", valor: `Desde ahora hasta las ${pad(fin)}:00`, ancho: true },
      ],
      textoConfirmar: Mensajes.botonConfirmarLiberar(),
      textoConservar: Mensajes.botonSeguirUsando(),
      alConfirmar: () => Reglas.liberar(id),
      alTerminar: res => Vista.avisar(Mensajes.cubiculoLiberado(cub.nombre, res.hasta)),
      vigente: () => Reglas.motivoNoLiberar(Modelo.reservas.find(r => r.id === id)),
    });
  },
};

/* ===== 5. App: punto de entrada que conecta todo ===== */
const App = {
  iniciar() {
    // T33 + T34 + T35: leer lo guardado, sanearlo y quitar lo vencido ANTES del primer dibujo
    // (los datos de ejemplo de la T10 ya no se usan: ahora las reservas son reales y se guardan)
    Almacen.hidratar();
    Vista.renderPlano();
    Vista.conectarDetalle(); // T15: tocar una tarjeta abre su detalle
    Vista.refrescar(true);   // T9 + T10 + T11 + T13: primer dibujo
    Vista.renderReloj();
    cierrepanel.iniciar();
    accionreservar.iniciar();
    FormReserva.iniciar();   // T22–T26
    Confirmacion.iniciar();     // T37
    CancelarReserva.iniciar();  // T36
    LiberarCubiculo.iniciar();  // T39
    Deshacer.iniciar();         // T40
    // T33: todo cambio se guarda (excepto los que vienen del mismo almacén, para no hacer eco)
    // T38: las bajas (Reglas.cancelar) ya guardaron antes de avisar: no se guarda dos veces
    Sincronizacion.alCambiar(cambio => { if (cambio.origen !== "almacen" && !cambio.yaGuardado) Almacen.guardar(); });
    // T38: tras CUALQUIER cambio (alta, baja, depuración, otra pestaña) se limpia lo que apuntaba
    // a reservas que ya no existen y se revisa si hay una confirmación pendiente sobre ellas
    Sincronizacion.alCambiar(() => { Vista.limpiarHuerfanos(); Confirmacion.revisar(); Deshacer.revisar(); });
    // T32: cualquier cambio en las reservas redibuja toda la interfaz al instante
    Sincronizacion.alCambiar(() => Vista.refrescar(true));
    // T33 + T32: si otra pestaña guarda reservas, esta pestaña las carga y se redibuja
    window.addEventListener("storage", ev => {
      if (ev.key !== Config.CLAVE_STORAGE) return;
      Almacen.hidratar();
      Sincronizacion.avisar({ tipo: "externo", origen: "almacen" });
    });
    setInterval(() => Vista.renderReloj(), 1000);

    // T12 + T35: refresco automático; antes de comparar, se depuran las reservas vencidas
    const mantenimiento = () => {
      Almacen.depurarVencidas();
      Vista.refrescar();
    };
    setInterval(mantenimiento, Config.REFRESCO_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) mantenimiento();   // al volver a la pestaña, actualizar al instante
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.iniciar());