"use strict";

/* ===== 1. Config: única fuente de verdad ===== */
const Config = {
  ABRE: 8,
  CIERRA: 20,
  FRANJA_HORAS: 1,
  MAX_HORAS: 2,
  MAX_PERSONAS: 3,
  N_CUBICULOS: 5,
  DIAS_ADELANTE: 2,
  CLAVE_STORAGE: "cubiculos.estado",
  CLAVES_ANTIGUAS: ["cubiculos.reservas.v1"],
  CLAVE_DISPOSITIVO: "cubiculos.dispositivo",
  CLAVE_TEMA: "cubiculos.tema", // T43: persistencia del tema oscuro/claro
  ESQUEMA_VERSION: 2,
  MAX_NOMBRE: 40,
  REFRESCO_MS: 15000,
  LOCALE: "es-MX",
  ZONA_HORARIA: "America/Monterrey",
  MIN_NOMBRE: 2,
  AVISO_MS: 6000,
  DESHACER_MS: 10000,
};

/* ===== 1b. Mensajes: catálogo centralizado (T30) ===== */
const Mensajes = {
  hora: h => `${String(h).padStart(2, "0")}:00`,
  horario: () => `${Mensajes.hora(Config.ABRE)} – ${Mensajes.hora(Config.CIERRA)}`,
  cubiculoInvalido: () => "Elige un cubículo válido.",
  nombreVacio: () => "Escribe el nombre del grupo o del responsable.",
  nombreCorto: () => `Escribe al menos ${Config.MIN_NOMBRE} caracteres.`,
  personasVacio: () => "Indica cuántas personas van a usar el cubículo.",
  personasInvalido: () => "Escribe un número entero, de 1 en adelante.",
  personasAforo: max => `Este cubículo admite hasta ${max} personas.`,
  inicioVacio: () => "Elige la hora de inicio.",
  inicioInvalido: () => "Elige una hora de inicio válida.",
  duracionVacia: () => "Elige la duración.",
  duracionInvalida: () => "Elige una duración válida.",
  duracionMaxima: () => `Cada reserva puede durar como máximo ${Config.MAX_HORAS} horas.`,
  fueraDeHorario: () => `Solo se puede reservar dentro del horario de operación (${Mensajes.horario()}).`,
  inicioNoAlineado: () => "La hora de inicio debe coincidir con el inicio de una franja.",
  despuesDelCierre: fin => `La reserva terminaría a las ${Mensajes.hora(fin)}, después del cierre (${Mensajes.hora(Config.CIERRA)}).`,
  yaCerro: () => `Ya cerró por hoy (horario ${Mensajes.horario()}). Vuelve mañana a partir de las ${Mensajes.hora(Config.ABRE)}.`,
  horaPasada: () => "Esa hora ya pasó. Elige una hora a partir de ahora.",
  horaYaNoDisponible: h => `Las ${Mensajes.hora(h)} ya no están disponibles (pasó la hora o alguien más la reservó). Elige otra.`,
  choqueCubiculo: lista => `Choca con otra reserva: ${lista}. Elige otro horario.`,
  choqueGrupo: (nombre, lista) => `"${nombre}" ya tiene reservado el ${lista}. Un grupo no puede estar en dos cubículos a la vez.`,
  conflictoExistente: (a, b) => `Conflicto de agenda: ${a} choca con ${b}.`,
  almacenNoDisponible: () => "No se puede usar el almacenamiento del navegador: las reservas solo durarán mientras la página esté abierta.",
  errorAlGuardar: () => "No se pudieron guardar las reservas en este navegador.",
  datosMigrados: (de, a) => `Datos guardados actualizados del esquema v${de} al v${a}.`,
  migracionFaltante: v => `No hay cómo actualizar los datos del esquema v${v}.`,
  datosCorruptos: respaldo => `Los datos guardados estaban dañados. Se respaldaron en "${respaldo}" y se empezó sin reservas.`,
  versionFutura: v => `Los datos guardados son de una versión más nueva de la página (esquema v${v}).`,
  reservaDescartada: (r, motivo) => `Reserva descartada al cargar (${motivo}): ${JSON.stringify(r)}`,
  resumenCarga: (cargadas, descartadas, depuradas) => `Reservas cargadas: ${cargadas} · descartadas: ${descartadas} · vencidas: ${depuradas}.`,
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
  reservasDepuradas: n => `Se ${n === 1 ? "eliminó 1 reserva vencida" : `eliminaron ${n} reservas vencidas`} de días anteriores.`,
  reservaCreada: (cub, ini, fin, codigo) => `Reserva confirmada: ${cub}, de ${Mensajes.hora(ini)} a ${Mensajes.hora(fin)}. Código ${codigo}.`,
  cancelarNoExiste: () => "Esa reserva ya no existe.",
  cancelarNoEsTuya: () => "Solo puedes cancelar las reservas que hiciste desde este navegador.",
  cancelarYaTermino: () => "Esa reserva ya terminó y no se puede cancelar.",
  cancelarFallo: () => "No se pudo guardar la cancelación.",
  reservaCancelada: (cub, ini, fin) => `Reserva cancelada: ${cub}, de ${Mensajes.hora(ini)} a ${Mensajes.hora(fin)}.`,
  etiquetaTuya: () => "Tu reserva",
  botonCancelarReserva: () => "Cancelar reserva",
  cancelarAriaLabel: (nombre, rango) => `Cancelar la reserva de ${nombre}, ${rango}`,
  confirmarEyebrow: () => "Confirmar",
  confirmarCancelarTitulo: () => "¿Cancelar esta reserva?",
  confirmarCancelarAviso: () => "El horario quedará libre para que otra persona lo aparte.",
  cancelarNoPosibleTitulo: () => "No se pudo cancelar",
  botonConfirmarCancelar: () => "Sí, cancelar reserva",
  botonConservar: () => "No, conservar reserva",
  botonEntendido: () => "Entendido",
  liberarNoExiste: () => "Esa reserva ya no existe.",
  liberarNoEsTuya: () => "Solo puedes liberar un cubículo que reservaste desde este navegador.",
  liberarNoEmpieza: () => "Tu reserva todavía no empieza.",
  liberarYaTermino: () => "Esa reserva ya terminó.",
  liberarFallo: () => "No se pudo guardar la liberación.",
  cubiculoLiberado: (cub, hasta) => `${cub} liberado hasta las ${Mensajes.hora(hasta)}.`,
  botonLiberar: () => "Liberar ahora",
  botonLiberarCubiculo: () => "Ya terminé · liberar cubículo",
  liberarAriaLabel: (nombre, rango) => `Liberar ahora el cubículo de la reserva de ${nombre}, ${rango}`,
  confirmarLiberarTitulo: () => "¿Liberar el cubículo ahora?",
  confirmarLiberarAviso: () => "Tu reserva termina en este momento y el resto del horario queda libre.",
  liberarNoPosibleTitulo: () => "No se pudo liberar",
  botonConfirmarLiberar: () => "Sí, liberar ahora",
  botonSeguirUsando: () => "No, lo sigo usando",
  botonDeshacer: () => "Deshacer",
  deshacerAriaLabel: () => "Deshacer la cancelación de la reserva",
  reservaRestaurada: (cub, ini, fin) => `Reserva restaurada: ${cub}, de ${Mensajes.hora(ini)} a ${Mensajes.hora(fin)}.`,
  deshacerYaExiste: () => "Esa reserva ya estaba restaurada.",
  deshacerYaTermino: () => "Ya no se puede deshacer.",
  deshacerChoque: lista => `Ya no se puede deshacer: ese horario ahora choca con ${lista}.`,
  deshacerChoqueGrupo: (nombre, lista) => `Ya no se puede deshacer: "${nombre}" ya tiene reservado el ${lista}.`,
  deshacerFallo: () => "No se pudo guardar la reserva restaurada.",
};

/* ===== 1c. Identidad del dispositivo (T36) ===== */
const Identidad = {
  _token: null,
  _generar() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  },
  token() {
    if (this._token) return this._token;
    let t = null;
    try { t = localStorage.getItem(Config.CLAVE_DISPOSITIVO); } catch (e) {}
    if (!t || !/^[\w-]{8,64}$/.test(t)) {
      t = this._generar();
      try { localStorage.setItem(Config.CLAVE_DISPOSITIVO, t); } catch (e) {}
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
  CUBICULOS: [
    { id: "cub-01", numero: 1, nombre: "Cubículo 1", capacidad: 3 },
    { id: "cub-02", numero: 2, nombre: "Cubículo 2", capacidad: 3 },
    { id: "cub-03", numero: 3, nombre: "Cubículo 3", capacidad: 3 },
    { id: "cub-04", numero: 4, nombre: "Cubículo 4", capacidad: 3 },
    { id: "cub-05", numero: 5, nombre: "Cubículo 5", capacidad: 3 },
  ],
  cubiculos() { return this.CUBICULOS; },
  franjas() {
    const pad = n => String(n).padStart(2, "0");
    const lista = [];
    for (let h = Config.ABRE; h + Config.FRANJA_HORAS <= Config.CIERRA; h += Config.FRANJA_HORAS) {
      const fin = h + Config.FRANJA_HORAS;
      lista.push({ id: `fr-${pad(h)}`, inicio: h, fin, etiqueta: `${pad(h)}:00 – ${pad(fin)}:00` });
    }
    return lista;
  },
  franjaPorId(id) { return this.franjas().find(f => f.id === id); },
  franjaDeHora(hora) { return this.franjas().find(f => hora >= f.inicio && hora < f.fin); },
  _fmtHoraNum: new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: Config.ZONA_HORARIA }),
  franjaActual(fecha = new Date()) { return this.franjaDeHora(Number(this._fmtHoraNum.format(fecha))); },
  _fmtFechaISO: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: Config.ZONA_HORARIA }),
  hoy() { return this._fmtFechaISO.format(new Date()); },
  estadoFranja(cubId, franja, fecha = this.hoy()) {
    const ocupada = this.reservas.some(r =>
      r.cubiculo === cubId && r.fecha === fecha && franja.inicio >= r.inicio && franja.inicio < r.inicio + r.duracion
    );
    return ocupada ? "ocupada" : "libre";
  },
  estadoActual(cubId, ahora = new Date()) {
    const hora = Number(this._fmtHoraNum.format(ahora));
    const fecha = this._fmtFechaISO.format(ahora);
    if (hora < Config.ABRE) return { estado: "cerrado", franja: null, hasta: Config.ABRE, cuando: "hoy" };
    if (hora >= Config.CIERRA) return { estado: "cerrado", franja: null, hasta: Config.ABRE, cuando: "mañana" };
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
  reservaEn(cubId, franja, fecha = this.hoy()) {
    return this.reservas.find(r =>
      r.cubiculo === cubId && r.fecha === fecha && franja.inicio >= r.inicio && franja.inicio < r.inicio + r.duracion
    );
  },
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
  _fmtHoraMin: new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: Config.ZONA_HORARIA }),
  horaDecimal(fecha = new Date()) {
    const partes = this._fmtHoraMin.formatToParts(fecha);
    const valor = tipo => Number(partes.find(p => p.type === tipo).value);
    return valor("hour") + valor("minute") / 60;
  },
  franjaYaPaso(franja, ahora = new Date()) { return franja.fin <= this.horaDecimal(ahora); },
  firmaDisponibilidad(ahora = new Date()) {
    const partes = [this.hoy(), `h${Math.floor(this.horaDecimal(ahora))}`];
    this.cubiculos().forEach(c => {
      const e = this.estadoActual(c.id, ahora);
      partes.push(`${c.id}:${e.estado}:${e.hasta}`);
      partes.push(this.franjas().map(f => this.estadoFranja(c.id, f)[0]).join(""));
    });
    return partes.join("|");
  },
  _ultimoId: 0,
  nuevoIdReserva() {
    this._ultimoId += 1;
    return `res-${String(this._ultimoId).padStart(3, "0")}`;
  },
};

/* ===== 3. Reglas: lógica de negocio ===== */
const Reglas = {
  aforo(cubiculo) { return Math.min(cubiculo.capacidad, Config.MAX_PERSONAS); },
  iniciosDisponibles(cubId, ahora = new Date()) {
    const fecha = Modelo._fmtFechaISO.format(ahora);
    return Modelo.franjas()
      .filter(f => !Modelo.franjaYaPaso(f, ahora) && Modelo.estadoFranja(cubId, f, fecha) === "libre")
      .map(f => f.inicio);
  },
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
  estaAbierto(ahora = new Date()) {
    const h = Modelo.horaDecimal(ahora);
    return h >= Config.ABRE && h < Config.CIERRA;
  },
  revisarHorario(inicio, duracion, ahora = new Date()) {
    const h = Modelo.horaDecimal(ahora);
    const error = (campo, mensaje) => ({ campo, mensaje });
    if (h >= Config.CIERRA) return error("inicio", Mensajes.yaCerro());
    if (!Number.isInteger(inicio)) return error("inicio", Mensajes.inicioInvalido());
    if (inicio < Config.ABRE || inicio >= Config.CIERRA) return error("inicio", Mensajes.fueraDeHorario());
    if ((inicio - Config.ABRE) % Config.FRANJA_HORAS !== 0) return error("inicio", Mensajes.inicioNoAlineado());
    if (Modelo.franjaYaPaso({ fin: inicio + Config.FRANJA_HORAS }, ahora)) return error("inicio", Mensajes.horaPasada());
    if (duracion == null) return null;
    if (!Number.isInteger(duracion) || duracion < Config.FRANJA_HORAS || duracion % Config.FRANJA_HORAS !== 0) {
      return error("duracion", Mensajes.duracionInvalida());
    }
    if (duracion > Config.MAX_HORAS) return error("duracion", Mensajes.duracionMaxima());
    if (inicio + duracion > Config.CIERRA) return error("duracion", Mensajes.despuesDelCierre(inicio + duracion));
    return null;
  },
  seTraslapan(ini1, fin1, ini2, fin2) { return ini1 < fin2 && ini2 < fin1; },
  conflictos({ cubiculo, fecha, inicio, duracion, nombre = "" }, ignorarId = null) {
    const fin = inicio + duracion;
    const grupo = String(nombre).trim().toLocaleLowerCase(Config.LOCALE);
    const mismoDiaYHora = r =>
      r.id !== ignorarId && r.fecha === fecha && this.seTraslapan(inicio, fin, r.inicio, r.inicio + r.duracion);
    return {
      cubiculo: Modelo.reservas.filter(r => mismoDiaYHora(r) && r.cubiculo === cubiculo),
      grupo: grupo
        ? Modelo.reservas.filter(r =>
            mismoDiaYHora(r) && r.cubiculo !== cubiculo &&
            String(r.nombre ?? "").trim().toLocaleLowerCase(Config.LOCALE) === grupo)
        : [],
    };
  },
  describirReserva(r) {
    const cub = Modelo.cubiculos().find(c => c.id === r.cubiculo);
    return `${cub ? cub.nombre : r.cubiculo} de ${Mensajes.hora(r.inicio)} a ${Mensajes.hora(r.inicio + r.duracion)}`;
  },
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
    const fecha = Modelo._fmtFechaISO.format(ahora);
    const choques = this.conflictos({ cubiculo: cub.id, fecha, inicio, duracion, nombre });
    if (choques.cubiculo.length) {
      const lista = choques.cubiculo.map(r => this.describirReserva(r)).join(" y ");
      const chocaAlInicio = choques.cubiculo.some(r => inicio >= r.inicio && inicio < r.inicio + r.duracion);
      errores[chocaAlInicio ? "inicio" : "duracion"] = Mensajes.choqueCubiculo(lista);
    } else if (choques.grupo.length) {
      const lista = choques.grupo.map(r => this.describirReserva(r)).join(" y ");
      errores.inicio = Mensajes.choqueGrupo(nombre, lista);
    }
    return errores;
  },
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
      dueno: Identidad.token(),
    };
    Modelo.reservas.push(reserva);
    Sincronizacion.avisar({ tipo: "reserva-creada", reserva });
    return { ok: true, reserva };
  },
  yaTermino(reserva, ahora = new Date()) {
    const hoy = Modelo._fmtFechaISO.format(ahora);
    if (reserva.fecha !== hoy) return reserva.fecha < hoy;
    return reserva.inicio + reserva.duracion <= Modelo.horaDecimal(ahora);
  },
  motivoNoCancelar(reserva, ahora = new Date()) {
    if (!reserva) return Mensajes.cancelarNoExiste();
    if (!Identidad.esMia(reserva)) return Mensajes.cancelarNoEsTuya();
    if (this.yaTermino(reserva, ahora)) return Mensajes.cancelarYaTermino();
    return null;
  },
  puedeCancelar(reserva, ahora = new Date()) { return this.motivoNoCancelar(reserva, ahora) === null; },
  cancelar(id, ahora = new Date()) {
    const reserva = Modelo.reservas.find(r => r.id === id);
    const motivo = this.motivoNoCancelar(reserva, ahora);
    if (motivo) return { ok: false, error: motivo };
    const respaldo = Modelo.reservas;
    Modelo.reservas = respaldo.filter(r => r.id !== id);
    if (!Almacen.guardarSeguro()) {
      Modelo.reservas = respaldo;
      return { ok: false, error: Mensajes.cancelarFallo() };
    }
    Sincronizacion.avisar({ tipo: "reserva-cancelada", reserva, yaGuardado: true });
    return { ok: true, reserva };
  },
  motivoNoDeshacer(reserva, ahora = new Date()) {
    if (!reserva) return Mensajes.cancelarNoExiste();
    if (!Identidad.esMia(reserva)) return Mensajes.cancelarNoEsTuya();
    if (Modelo.reservas.some(r => r.id === reserva.id)) return Mensajes.deshacerYaExiste();
    if (this.yaTermino(reserva, ahora)) return Mensajes.deshacerYaTermino();
    const choques = this.conflictos(reserva, reserva.id);
    if (choques.cubiculo.length) return Mensajes.deshacerChoque(choques.cubiculo.map(r => this.describirReserva(r)).join(" y "));
    if (choques.grupo.length) return Mensajes.deshacerChoqueGrupo(reserva.nombre, choques.grupo.map(r => this.describirReserva(r)).join(" y "));
    return null;
  },
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
    Sincronizacion.avisar({ tipo: "reserva-restaurada", reserva: restaurada, yaGuardado: true });
    return { ok: true, reserva: restaurada };
  },
  enCurso(reserva, ahora = new Date()) {
    if (!reserva || reserva.fecha !== Modelo._fmtFechaISO.format(ahora)) return false;
    const h = Modelo.horaDecimal(ahora);
    return reserva.inicio <= h && h < reserva.inicio + reserva.duracion;
  },
  reservaPropiaEnCurso(cubId, ahora = new Date()) {
    return Modelo.reservas.find(r => r.cubiculo === cubId && Identidad.esMia(r) && this.enCurso(r, ahora));
  },
  motivoNoLiberar(reserva, ahora = new Date()) {
    if (!reserva) return Mensajes.liberarNoExiste();
    if (!Identidad.esMia(reserva)) return Mensajes.liberarNoEsTuya();
    if (this.yaTermino(reserva, ahora)) return Mensajes.liberarYaTermino();
    if (!this.enCurso(reserva, ahora)) return Mensajes.liberarNoEmpieza();
    return null;
  },
  puedeLiberar(reserva, ahora = new Date()) { return this.motivoNoLiberar(reserva, ahora) === null; },
  liberar(id, ahora = new Date()) {
    const reserva = Modelo.reservas.find(r => r.id === id);
    const motivo = this.motivoNoLiberar(reserva, ahora);
    if (motivo) return { ok: false, error: motivo };
    const franja = Modelo.franjaActual(ahora);
    const desde = franja ? franja.inicio : reserva.inicio;
    const hasta = reserva.inicio + reserva.duracion;
    const usada = desde - reserva.inicio;
    const respaldo = Modelo.reservas;
    Modelo.reservas = usada > 0
      ? respaldo.map(r => (r.id === id ? { ...r, duracion: usada } : r))
      : respaldo.filter(r => r.id !== id);
    if (!Almacen.guardarSeguro()) {
      Modelo.reservas = respaldo;
      return { ok: false, error: Mensajes.liberarFallo() };
    }
    Sincronizacion.avisar({ tipo: "cubiculo-liberado", reserva, desde, hasta, yaGuardado: true });
    return { ok: true, reserva, desde, hasta, eliminada: usada <= 0 };
  },
};

/* ===== 3b. Sincronización ===== */
const Sincronizacion = {
  _oyentes: [],
  alCambiar(fn) { this._oyentes.push(fn); },
  avisar(cambio = { tipo: "cambio" }) {
    this._oyentes.forEach(fn => {
      try { fn(cambio); } catch (e) { console.error("Error al sincronizar:", e); }
    });
  },
};

/* ===== 3c. Almacen: persistencia ===== */
const Almacen = {
  _disponible: null,
  _soloLectura: false,
  disponible() {
    if (this._disponible === null) {
      try {
        const k = "__cubiculos_prueba__";
        localStorage.setItem(k, k);
        localStorage.removeItem(k);
        this._disponible = true;
      } catch (e) {
        this._disponible = false;
      }
    }
    return this._disponible;
  },
  serializar() {
    return JSON.stringify({
      version: Config.ESQUEMA_VERSION,
      guardado: new Date().toISOString(),
      ultimoId: Modelo._ultimoId,
      reservas: Modelo.reservas.map(({ id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno }) =>
        ({ id, cubiculo, fecha, inicio, duracion, nombre, personas, dueno })),
    });
  },
  guardar() {
    if (!this.disponible() || this._soloLectura) return false;
    try {
      localStorage.setItem(Config.CLAVE_STORAGE, this.serializar());
      return true;
    } catch (e) {
      return false;
    }
  },
  guardarSeguro() {
    if (!this.disponible() || this._soloLectura) return true;
    try {
      localStorage.setItem(Config.CLAVE_STORAGE, this.serializar());
      return true;
    } catch (e) {
      return false;
    }
  },
  MIGRACIONES: {
    0: datos => ({
      version: 1,
      ultimoId: 0,
      reservas: (Array.isArray(datos) ? datos : []).map(r => ({ personas: 1, ...r })),
    }),
    1: datos => ({
      version: 2,
      ultimoId: datos.ultimoId,
      reservas: (Array.isArray(datos.reservas) ? datos.reservas : []).map(r => ({ dueno: Identidad.token(), ...r })),
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
    return { datos, migrado: original !== version };
  },
  leer() {
    if (!this.disponible()) return { estado: "vacio" };
    let crudo = localStorage.getItem(Config.CLAVE_STORAGE);
    let antigua = null;
    if (crudo === null) {
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
  hidratar(ahora = new Date()) {
    const lectura = this.leer();
    let reservas = [];
    let ultimoId = 0;
    let hayQueGuardar = false;
    this._soloLectura = false;
    if (lectura.estado === "corrupto") {
      const respaldo = `${Config.CLAVE_STORAGE}.danado.${Date.now()}`;
      try { localStorage.setItem(respaldo, lectura.crudo); } catch (e) {}
      hayQueGuardar = true;
    } else if (lectura.estado === "futuro") {
      this._soloLectura = true;
    } else if (lectura.estado === "ok") {
      reservas = lectura.datos.reservas;
      ultimoId = Number(lectura.datos.ultimoId) || 0;
      hayQueGuardar = lectura.cambio;
    }
    const { validas, descartadas } = this.sanear(reservas, ahora);
    const numero = r => Number(String(r.id).slice(4));
    ultimoId = Math.max(ultimoId, ...validas.filter(r => r.id).map(numero), 0);
    Modelo._ultimoId = ultimoId;
    validas.forEach(r => { if (!r.id) { r.id = Modelo.nuevoIdReserva(); hayQueGuardar = true; } });
    Modelo.reservas = validas;
    const depuradas = this.depurarVencidas(ahora, { avisar: false });
    if (hayQueGuardar || descartadas.length || depuradas) this.guardar();
    if (lectura.antigua && lectura.estado !== "futuro") {
      try { localStorage.removeItem(lectura.antigua); } catch (e) {}
    }
    return { estado: lectura.estado, cargadas: Modelo.reservas.length, descartadas, depuradas };
  },
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
      if (!Number.isInteger(inicio) || inicio < Config.ABRE || inicio >= Config.CIERRA || (inicio - Config.ABRE) % Config.FRANJA_HORAS !== 0) return descartar(M.inicio);
      const duracion = Number(bruta.duracion);
      if (!Number.isInteger(duracion) || duracion < Config.FRANJA_HORAS || duracion % Config.FRANJA_HORAS !== 0 || duracion > Config.MAX_HORAS || inicio + duracion > Config.CIERRA) return descartar(M.duracion);
      const nombre = typeof bruta.nombre === "string" ? bruta.nombre.trim().slice(0, Config.MAX_NOMBRE) : "";
      if (nombre.length < Config.MIN_NOMBRE) return descartar(M.nombre);
      const personas = Number(bruta.personas);
      if (!Number.isInteger(personas) || personas < 1 || personas > Reglas.aforo(cub)) return descartar(M.personas);
      const choca = otra => otra.fecha === fecha && Reglas.seTraslapan(inicio, inicio + duracion, otra.inicio, otra.inicio + otra.duracion);
      if (validas.some(o => o.cubiculo === cub.id && choca(o))) return descartar(M.choque);
      const grupo = nombre.toLocaleLowerCase(Config.LOCALE);
      if (validas.some(o => o.cubiculo !== cub.id && choca(o) && o.nombre.toLocaleLowerCase(Config.LOCALE) === grupo)) return descartar(M.choqueGrupo);
      let id = /^res-\d+$/.test(bruta.id) && !idsVistos.has(bruta.id) ? bruta.id : null;
      if (id) idsVistos.add(id);
      const dueno = typeof bruta.dueno === "string" && /^[\w-]{8,64}$/.test(bruta.dueno) ? bruta.dueno : null;
      validas.push({ id, cubiculo: cub.id, fecha, inicio, duracion, nombre, personas, dueno });
    });
    return { validas, descartadas };
  },
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
  vencida(reserva, hoy) { return reserva.fecha < hoy; },
  depurarVencidas(ahora = new Date(), { avisar = true } = {}) {
    const hoy = Modelo._fmtFechaISO.format(ahora);
    const antes = Modelo.reservas.length;
    Modelo.reservas = Modelo.reservas.filter(r => !this.vencida(r, hoy));
    const quitadas = antes - Modelo.reservas.length;
    if (quitadas && avisar) Sincronizacion.avisar({ tipo: "depuracion", cantidad: quitadas });
    return quitadas;
  },
};

/* ===== T43. Gestión de Tema (Oscuro / Claro) ===== */
const GestionTema = {
  iniciar() {
    const btn = document.getElementById("btnTema");
    if (!btn) return;
    
    // Leer preferencia guardada o usar la del sistema
    let temaGuardado = null;
    try { temaGuardado = localStorage.getItem(Config.CLAVE_TEMA); } catch (e) {}

    // T49: solo se aceptan valores conocidos (un valor basura dejaba la página sin tema)
    if (temaGuardado === "dark" || temaGuardado === "light") {
      document.documentElement.dataset.tema = temaGuardado;
    }
    this.sincronizarBarra();

    btn.addEventListener("click", () => {
      const nuevo = this.esOscuro() ? "light" : "dark";
      document.documentElement.dataset.tema = nuevo;
      try { localStorage.setItem(Config.CLAVE_TEMA, nuevo); } catch (e) {}
      this.sincronizarBarra();
    });
  },
  esOscuro() {
    const actual = document.documentElement.dataset.tema;
    if (actual) return actual === "dark";
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  },
  // T48: con tema manual, la barra del navegador (theme-color) debe seguir al tema elegido, no al del sistema
  sincronizarBarra() {
    const manual = document.documentElement.dataset.tema;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      if (!m.dataset.media) m.dataset.media = m.getAttribute("media") || "";
      const esDeOscuro = m.dataset.media.includes("dark");
      if (!manual) m.setAttribute("media", m.dataset.media);
      else m.setAttribute("media", (manual === "dark") === esDeOscuro ? "all" : "not all");
    });
  },
};

/* ===== T48. Compatibilidad del <dialog> =====
   Safari < 15.4 y navegadores viejos no tienen showModal(); sin esto el detalle nunca abría.
   Además marca <html> mientras está abierto, porque body:has() no existe en Firefox < 121. */
const Dialogo = {
  abrir(dlg) {
    if (dlg.open) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else {
      dlg.setAttribute("open", "");
      dlg.classList.add("detalle--sin-soporte");
    }
    document.documentElement.classList.add("detalle-abierto");
  },
  cerrar(dlg) {
    if (typeof dlg.close === "function" && typeof dlg.showModal === "function") { dlg.close(); return; }
    if (!dlg.hasAttribute("open")) return;
    dlg.removeAttribute("open");
    dlg.dispatchEvent(new Event("close"));
  },
  conectar(dlg) {
    dlg.addEventListener("close", () => document.documentElement.classList.remove("detalle-abierto"));
    // Escape solo hace falta a mano cuando el navegador no tiene <dialog> nativo
    document.addEventListener("keydown", ev => {
      if (typeof dlg.showModal === "function") return;
      if (ev.key !== "Escape" || !dlg.hasAttribute("open")) return;
      const cancel = new Event("cancel", { cancelable: true });
      if (dlg.dispatchEvent(cancel)) this.cerrar(dlg);
    });
  },
};

/* ===== 4. Vista: todo lo que toca el DOM ===== */
const Vista = {
  $(id) { return document.getElementById(id); },
  _resaltar: null,
  _timerResaltar: null,
  _timerAviso: null,
  avisar(texto) {
    const el = this.$("aviso");
    if (!el) return;
    const dlg = this.$("detalle");
    const destino = dlg && dlg.open ? dlg : document.body;
    if (el.parentNode !== destino) destino.appendChild(el);
    clearTimeout(this._timerAviso);
    el.textContent = "";
    el.hidden = false;
    requestAnimationFrame(() => { el.textContent = texto; el.classList.add("aviso--visible"); });
    this._timerAviso = setTimeout(() => {
      el.classList.remove("aviso--visible");
      el.hidden = true;
    }, Config.AVISO_MS);
  },
  resaltar(id) {
    clearTimeout(this._timerResaltar);
    this._resaltar = id;
    this.refrescar(true);
    this._timerResaltar = setTimeout(() => {
      this._resaltar = null;
      this.refrescar(true);
    }, Config.AVISO_MS);
  },
  limpiarHuerfanos() {
    const existe = id => Modelo.reservas.some(r => r.id === id);
    if (this._resaltar && !existe(this._resaltar)) {
      clearTimeout(this._timerResaltar);
      this._resaltar = null;
    }
    if (FormReserva._ultima) {
      FormReserva._ultima = Modelo.reservas.find(r => r.id === FormReserva._ultima.id) || null;
    }
  },
  esc(texto) {
    return String(texto).replace(/[&<>"']/g, ch => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  },
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
  _firma: "",
  refrescar(forzar = false, ahora = new Date()) {
    const firma = Modelo.firmaDisponibilidad(ahora);
    if (!forzar && firma === this._firma) return false;
    this._firma = firma;
    const activo = document.activeElement;
    const enFranja = activo && activo.classList && activo.classList.contains("slot");
    const cub = enFranja ? activo.dataset.cub : null;
    const franja = enFranja ? activo.dataset.franja : null;

    this.renderEstados(ahora);
    this.renderLineasTiempo();
    this.renderFranjas(ahora);
    this.centrarFranjaActual(ahora);
    if (this._detalleCub) this.renderDetalle(ahora);
    this.renderAhora(ahora);
    FormReserva.sincronizar(ahora);

    if (cub) {
      const mismo = document.querySelector(`.slot[data-cub="${cub}"][data-franja="${franja}"]`);
      if (mismo) mismo.focus();
    }
    return true;
  },
  renderFranjas(ahora = new Date()) {
    const franjas = Modelo.franjas();
    const cubiculos = Modelo.cubiculos();
    const pad = n => String(n).padStart(2, "0");
    const cabecera = franjas.map(f => `<th scope="col">${pad(f.inicio)}:00</th>`).join("");
    const filas = cubiculos.map(c => `
      <tr data-cub="${c.id}">
        <th scope="row">${c.nombre}</th>
        ${franjas.map(f => {
          const estado = Modelo.estadoFranja(c.id, f);
          const pasada = Modelo.franjaYaPaso(f, ahora);
          const r = estado === "ocupada" ? Modelo.reservaEn(c.id, f) : null;
          const nueva = r && r.id && r.id === this._resaltar;
          const clases = ["slot", `slot--${estado}`];
          if (pasada) clases.push("slot--pasada");
          if (nueva) clases.push("slot--nueva");
          const accion = pasada ? "ya pasó, no se puede reservar" : estado === "libre" ? "toca para reservar" : "toca para ver el detalle";
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
  _franjasCentradas: false,
  centrarFranjaActual(ahora = new Date()) {
    if (this._franjasCentradas) return;
    const caja = this.$("franjas");
    if (!caja || caja.scrollWidth <= caja.clientWidth) return;
    const franja = Modelo.franjaActual(ahora);
    const slot = franja && caja.querySelector(`.slot[data-franja="${franja.id}"]`);
    if (!slot) return;
    const etiqueta = caja.querySelector("tbody th");
    caja.scrollLeft += slot.getBoundingClientRect().left - caja.getBoundingClientRect().left - (etiqueta ? etiqueta.offsetWidth : 0) - 8;
    this._franjasCentradas = true;
  },
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
    const descripcion = bloques.length ? `Ocupado de ${rangos.join(", de ")}` : "Sin reservas hoy";
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
  renderLineasTiempo() {
    Modelo.cubiculos().forEach(c => {
      const hueco = document.querySelector(`.booth[data-cub="${c.id}"] .lt-slot`);
      if (hueco) hueco.innerHTML = this.htmlLineaTiempo(c.id);
    });
  },
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
    document.querySelectorAll(".agenda-item").forEach(li => {
      const ini = Number(li.dataset.inicio);
      const fin = Number(li.dataset.fin);
      const actual = h >= ini && h < fin;
      li.classList.toggle("agenda-item--pasado", h >= fin);
      li.classList.toggle("agenda-item--ahora", actual);
      const ahEl = li.querySelector(".agenda-ahora");
      if (ahEl) ahEl.hidden = !actual;
      if (actual) li.setAttribute("aria-current", "time");
      else li.removeAttribute("aria-current");
    });
  },
  _detalleCub: null,
  conectarDetalle() {
    const dlg = this.$("detalle");
    if (!dlg || this._conectado) return;
    this._conectado = true;

    this.$("plano").addEventListener("click", ev => {
      const tarjeta = ev.target.closest(".booth");
      if (tarjeta) this.abrirDetalle(tarjeta.dataset.cub);
    });

    this.$("franjas").addEventListener("click", ev => {
      const slot = ev.target.closest(".slot");
      if (!slot || slot.getAttribute("aria-disabled") === "true") return;
      const franja = Modelo.franjaPorId(slot.dataset.franja);
      this.abrirDetalle(slot.dataset.cub);
      if (franja && slot.dataset.estado === "libre") FormReserva.abrir({ inicio: franja.inicio });
    });

    Dialogo.conectar(dlg);
    this.$("detalleCerrar").addEventListener("click", () => Dialogo.cerrar(dlg));
    dlg.addEventListener("click", ev => { if (ev.target === dlg) Dialogo.cerrar(dlg); });
    dlg.addEventListener("close", () => {
      const aviso = this.$("aviso");
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
    Dialogo.abrir(dlg);
    Deshacer.ubicar();
  },
  renderDetalle(ahora = new Date()) {
    const c = Modelo.cubiculos().find(x => x.id === this._detalleCub);
    if (!c) return;
    const pad = n => String(n).padStart(2, "0");
    const e = Modelo.estadoActual(c.id, ahora);
    const agenda = Modelo.agendaDelDia(c.id);
    const h = Modelo.horaDecimal(ahora);
    const total = Config.CIERRA - Config.ABRE;
    const horasOcupadas = agenda.filter(b => b.tipo === "ocupado").reduce((suma, b) => suma + (b.fin - b.inicio), 0);
    const proxima = agenda.find(b => b.tipo === "ocupado" && b.inicio > h);

    const itemsAgenda = agenda.map(b => {
      const rango = `${pad(b.inicio)}:00 – ${pad(b.fin)}:00`;
      const quien = b.tipo === "ocupado"
        ? `<strong>Ocupado</strong>${b.reserva.nombre ? ` · ${this.esc(b.reserva.nombre)}` : ""}${Identidad.esMia(b.reserva) ? ` <span class="agenda-tuya">${Mensajes.etiquetaTuya()}</span>` : ""}`
        : `<strong>Libre</strong>`;
      const nueva = b.reserva && b.reserva.id && b.reserva.id === this._resaltar;
      const liberable = b.tipo === "ocupado" && Reglas.puedeLiberar(b.reserva, ahora);
      const cancelable = !liberable && b.tipo === "ocupado" && Reglas.puedeCancelar(b.reserva, ahora);
      let accion = "";
      if (liberable) {
        accion = `<button type="button" class="btn btn--chico agenda-cancelar" data-liberar="${this.esc(b.reserva.id)}" aria-label="${this.esc(Mensajes.liberarAriaLabel(b.reserva.nombre, rango))}">${Mensajes.botonLiberar()}</button>`;
      } else if (cancelable) {
        accion = `<button type="button" class="btn btn--sec btn--chico agenda-cancelar" data-cancelar="${this.esc(b.reserva.id)}" aria-label="${this.esc(Mensajes.cancelarAriaLabel(b.reserva.nombre, rango))}">${Mensajes.botonCancelarReserva()}</button>`;
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
    accionreservar.renderizar();
  },
  // T48: hourCycle h23 en vez de hour12:false (Chrome mostraba "24:05" a medianoche)
  _fmtHora: new Intl.DateTimeFormat(Config.LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: Config.ZONA_HORARIA }),
  _fmtFecha: new Intl.DateTimeFormat(Config.LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: Config.ZONA_HORARIA }),
  renderReloj() {
    const ahora = new Date();
    const hora = this._fmtHora.format(ahora);
    let fecha = this._fmtFecha.format(ahora);
    fecha = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    const elHora = this.$("clockTime");
    const elFecha = this.$("clockDate");
    if (elHora && elHora.textContent !== hora) {
      elHora.textContent = hora;
      this.renderAhora(ahora);
      this.refrescar(false, ahora);
    }
    if (elFecha && elFecha.textContent !== fecha) elFecha.textContent = fecha;
  },
};

const cierrepanel = {
  iniciar() {
    const panel = document.getElementById("detalle");
    if (!panel) return;
    Vista.conectarDetalle();
    panel.addEventListener("close", () => FormReserva.reiniciar());
    panel.addEventListener("close", () => Confirmacion.reiniciar());
    panel.addEventListener("cancel", ev => {
      if (Confirmacion.activa()) { ev.preventDefault(); Confirmacion.cerrar(); }
    });
  }
};

const accionreservar = {
  iniciar() {
    const contenedor = document.getElementById("detalleAccion");
    if (!contenedor) return;
    contenedor.addEventListener("click", ev => {
      if (ev.target.closest("#btnReservar")) FormReserva.abrir();
      const liberar = ev.target.closest("#btnLiberar");
      if (liberar) LiberarCubiculo.pedir(liberar.dataset.liberar);
    });
  },
  renderizar() {
    const cubId = Vista._detalleCub;
    const contenedor = document.getElementById("detalleAccion");
    if (!cubId || !contenedor) return;
    const mia = Reglas.reservaPropiaEnCurso(cubId);
    const hayHoras = Reglas.iniciosDisponibles(cubId).length > 0;
    const estado = Modelo.estadoActual(cubId).estado;
    const yaCerro = Modelo.horaDecimal() >= Config.CIERRA;

    let texto = "Reservar";
    if (yaCerro) texto = `Cerrado · abre mañana a las ${String(Config.ABRE).padStart(2, "0")}:00`;
    else if (!hayHoras) texto = "Sin horarios disponibles hoy";
    else if (estado === "ocupado") texto = "Reservar otro horario";

    const habilitado = hayHoras && !yaCerro;
    const firma = `${texto}|${habilitado}|${mia ? mia.id : ""}`;
    if (contenedor.dataset.firma === firma) return;
    contenedor.dataset.firma = firma;
    const btnLiberar = mia ? `<button type="button" class="btn btn--sec" id="btnLiberar" data-liberar="${Vista.esc(mia.id)}">${Mensajes.botonLiberarCubiculo()}</button>` : "";
    contenedor.innerHTML = `${btnLiberar}<button type="button" class="btn" id="btnReservar"${habilitado ? "" : " disabled"}>${texto}</button>`;
  }
};

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
    cont.addEventListener("submit", ev => { ev.preventDefault(); this.enviar(); });
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
  marcarError(campo, mensaje = "") {
    const input = this.$(this._ids[campo]);
    const caja = this.$(`${this._ids[campo]}Error`);
    if (input) input.setAttribute("aria-invalid", mensaje ? "true" : "false");
    if (caja) caja.textContent = mensaje;
  },
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
  renderForm(errores = {}) {
    const c = this.cubiculo();
    const d = this._datos;
    const esc = t => Vista.esc(t);
    const max = Reglas.aforo(c);
    const inicios = Reglas.iniciosDisponibles(c.id);

    if (d.inicio !== "" && !inicios.includes(Number(d.inicio))) { d.inicio = ""; d.duracion = ""; }
    const duraciones = d.inicio !== "" ? Reglas.duracionesPosibles(c.id, Number(d.inicio)) : [];
    if (d.duracion !== "" && !duraciones.includes(Number(d.duracion))) d.duracion = "";

    const attrs = (k, ayuda = "") => `aria-invalid="${errores[k] ? "true" : "false"}" aria-describedby="${ayuda}${this._ids[k]}Error"`;
    const err = k => (errores[k] ? esc(errores[k]) : "");
    const opInicio = inicios.map(h => `<option value="${h}"${String(h) === String(d.inicio) ? " selected" : ""}>${this.pad(h)}:00</option>`).join("");
    const opDuracion = duraciones.map(n => `<option value="${n}"${String(n) === String(d.duracion) ? " selected" : ""}>${this.textoDuracion(n, Number(d.inicio))}</option>`).join("");

    this.$("detalleReserva").innerHTML = `
      <form id="formReserva" novalidate>
        <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">Reservar ${esc(c.nombre)}</h3>
        <p class="detalle-dato">Hoy · horario ${this.pad(Config.ABRE)}:00 – ${this.pad(Config.CIERRA)}:00 · máximo ${max} personas.</p>
        <div class="campo">
          <label for="rNombre">Nombre del grupo o responsable</label>
          <input id="rNombre" name="nombre" type="text" maxlength="40" autocomplete="off" value="${esc(d.nombre)}" ${attrs("nombre", "rNombreAyuda ")} required>
          <small id="rNombreAyuda">Así aparecerá en la agenda.</small>
          <small class="campo-error" id="rNombreError">${err("nombre")}</small>
        </div>
        <div class="campo">
          <label for="rPersonas">Número de personas</label>
          <input id="rPersonas" name="personas" type="number" inputmode="numeric" min="1" max="${max}" step="1" value="${esc(d.personas)}" ${attrs("personas", "rPersonasAyuda ")} required>
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
        <div class="reserva-botones">
          <button type="button" class="btn btn--sec" data-accion="cancelar">Cancelar</button>
          <button type="submit" class="btn">Revisar reserva</button>
        </div>
      </form>`;
  },
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
    sel.innerHTML = `<option value="">Elige la duración</option>` + duraciones.map(n => `<option value="${n}">${this.textoDuracion(n, Number(inicio))}</option>`).join("");
    sel.value = String(this._datos.duracion);
  },
  enviar() {
    const datos = new FormData(this.$("formReserva"));
    ["nombre", "personas", "inicio", "duracion"].forEach(k => { this._datos[k] = datos.get(k) ?? ""; });
    const errores = Reglas.validar({ cubiculo: this._cub, ...this._datos });
    if (Object.keys(errores).length) this.mostrar("form", errores);
    else this.mostrar("resumen");
  },
  renderResumen() {
    const c = this.cubiculo();
    const d = this._datos;
    const inicio = Number(d.inicio);
    const dur = Number(d.duracion);
    const personas = Number(d.personas);
    this.$("detalleReserva").innerHTML = `
      <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">Revisa tu reserva</h3>
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
  confirmar() {
    const res = Reglas.crear({ cubiculo: this._cub, ...this._datos });
    if (!res.ok) { this.mostrar("form", res.errores); return; }
    this._ultima = res.reserva;
    const r = res.reserva;
    this.mostrar("exito");
    Vista.avisar(Mensajes.reservaCreada(this.cubiculo().nombre, r.inicio, r.inicio + r.duracion, r.id));
    Vista.resaltar(r.id);
  },
  renderExito() {
    const c = this.cubiculo();
    const r = this._ultima;
    const fin = r.inicio + r.duracion;
    this.$("detalleReserva").innerHTML = `
      <div class="exito">
        <span class="exito-icono" aria-hidden="true">✓</span>
        <h3 class="reserva-titulo" id="reservaTitulo" tabindex="-1">¡Reserva confirmada!</h3>
      </div>
      <dl class="detalle-ficha">
        <div><dt>Cubículo</dt><dd>${Vista.esc(c.nombre)}</dd></div>
        <div><dt>Código</dt><dd class="exito-codigo">${Vista.esc(r.id)}</dd></div>
        <div class="ancho"><dt>Horario</dt><dd>Hoy, ${this.pad(r.inicio)}:00 – ${this.pad(fin)}:00 (${r.duracion}h)</dd></div>
        <div><dt>A nombre de</dt><dd>${Vista.esc(r.nombre)}</dd></div>
        <div><dt>Personas</dt><dd>${r.personas}</dd></div>
      </dl>
      <div class="reserva-botones">
        <button type="button" class="btn" data-accion="listo">Ver la agenda</button>
      </div>`;
  },
};

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
    const datos = (op.datos || []).map(d => `<div${d.ancho ? ' class="ancho"' : ""}><dt>${esc(d.etiqueta)}</dt><dd>${esc(d.valor)}</dd></div>`).join("");
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
    this._procesando = true;
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
  revisar() {
    if (!this._activa || this._procesando || !this._op || !this._op.vigente) return;
    const motivo = this._op.vigente();
    if (motivo) this.mostrarError(motivo);
  },
  cerrar() {
    if (!this._activa) return;
    this.reiniciar();
    Vista.renderDetalle();
    const titulo = this.$("detalleTitulo");
    titulo.setAttribute("tabindex", "-1");
    titulo.focus();
  },
  reiniciar() {
    if (!this._activa) return;
    this._activa = false;
    this._procesando = false;
    this._op = null;
    const cont = this.$("detalleConfirmar");
    if (!cont) return;
    cont.hidden = true;
    cont.innerHTML = "";
    this.$("detalleCuerpo").hidden = false;
    this.$("detalleAccion").hidden = false;
    this.$("detalleEyebrow").textContent = "Detalle";
  },
};

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
    if (motivo) {
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
      alTerminar: res => Deshacer.ofrecer({
        texto: Mensajes.reservaCancelada(cub.nombre, res.reserva.inicio, fin),
        reserva: res.reserva,
      }),
      vigente: () => Reglas.motivoNoCancelar(Modelo.reservas.find(r => r.id === id)),
    });
  },
};

const Deshacer = {
  _pendiente: null,
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
    if (dlg) dlg.addEventListener("close", () => this.ubicar());
  },
  ubicar() {
    const el = this.$("avisoDeshacer");
    if (!el) return;
    const dlg = this.$("detalle");
    const destino = dlg && dlg.open ? dlg : document.body;
    if (el.parentNode !== destino) destino.appendChild(el);
    el.classList.toggle("aviso--en-detalle", destino === dlg);
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
    if (!el) { Vista.avisar(texto); return; }
    this.cerrar();
    this._pendiente = { reserva: { ...reserva } };
    this.ubicar();
    el.textContent = "";
    el.hidden = false;
    requestAnimationFrame(() => {
      if (!this._pendiente) return;
      el.innerHTML = this.html(texto, true);
      el.classList.add("aviso--visible");
    });
    this.programar();
  },
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
    this._procesando = true;
    let res;
    try { res = Reglas.deshacerCancelacion(p.reserva); } finally { this._procesando = false; }
    if (!res.ok) { this.mostrarError(res.error, res.reintentar); return; }
    const r = res.reserva;
    const cub = Modelo.cubiculos().find(c => c.id === r.cubiculo);
    this.cerrar();
    Vista.resaltar(r.id);
    Vista.avisar(Mensajes.reservaRestaurada(cub.nombre, r.inicio, r.inicio + r.duracion));
    const dlg = this.$("detalle");
    if (dlg && dlg.open) {
      const titulo = this.$("detalleTitulo");
      titulo.setAttribute("tabindex", "-1");
      titulo.focus();
    }
  },
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
    if (motivo) {
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

/* ===== 5. App: punto de entrada ===== */
const App = {
  iniciar() {
    Almacen.hidratar();
    GestionTema.iniciar(); // T43: Inicializar control de tema
    Vista.renderPlano();
    Vista.conectarDetalle();
    Vista.refrescar(true);
    Vista.renderReloj();
    cierrepanel.iniciar();
    accionreservar.iniciar();
    FormReserva.iniciar();
    Confirmacion.iniciar();
    CancelarReserva.iniciar();
    LiberarCubiculo.iniciar();
    Deshacer.iniciar();
    Sincronizacion.alCambiar(cambio => { if (cambio.origen !== "almacen" && !cambio.yaGuardado) Almacen.guardar(); });
    Sincronizacion.alCambiar(() => { Vista.limpiarHuerfanos(); Confirmacion.revisar(); Deshacer.revisar(); });
    Sincronizacion.alCambiar(() => Vista.refrescar(true));
    window.addEventListener("storage", ev => {
      if (ev.key !== Config.CLAVE_STORAGE) return;
      Almacen.hidratar();
      Sincronizacion.avisar({ tipo: "externo", origen: "almacen" });
    });
    setInterval(() => Vista.renderReloj(), 1000);
    const mantenimiento = () => {
      Almacen.depurarVencidas();
      Vista.refrescar();
    };
    setInterval(mantenimiento, Config.REFRESCO_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) mantenimiento();
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.iniciar());