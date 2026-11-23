"use strict";
/* ===========================================================================
   T47 · Matriz de pruebas de reglas de negocio (E4-60)
   ---------------------------------------------------------------------------
   Cada objeto de ESTA lista es UNA fila de la matriz: una regla, un escenario
   y el resultado esperado. De aquí salen las dos cosas a la vez:
     · las pruebas automatizadas  (matriz/matriz.test.js)
     · el documento MATRIZ_REGLAS.md  (matriz/generar-doc.js)
   Así nunca se despegan: si cambia una regla, se corrige en un solo lugar.

   Campos de cada fila:
     id       identificador estable (no reciclar números)
     regla    la regla de negocio que se está probando
     caso     el escenario, en una línea
     dado     el estado antes: hora simulada, reservas que ya existen, etc.
     cuando   la acción que se ejecuta
     entonces el resultado esperado
     defecto  (opcional) desviación conocida: la prueba se marca como pendiente
   =========================================================================== */

const CUB1 = "cub-01";
const CUB2 = "cub-02";

// Reserva ya existente en el escenario. Por omisión es de HOY y de este
// navegador; `mia: false` la pone a nombre de otro dispositivo.
const ya = (extra = {}) => ({ cubiculo: CUB1, inicio: 10, duracion: 2, nombre: "Equipo A", personas: 2, ...extra });

// Reserva tal como podría estar guardada en el navegador (para probar el saneado).
const cruda = (extra = {}) => ({
  id: "res-001", cubiculo: CUB1, fecha: "2026-11-16", inicio: 10, duracion: 2,
  nombre: "Equipo A", personas: 2, dueno: "dispositivo-de-prueba-0001", ...extra,
});

// Datos que llegan del formulario. Por omisión son válidos a las 10:30.
const forma = (extra = {}) => ({ cubiculo: CUB1, nombre: "Equipo A", personas: 2, inicio: 10, duracion: 1, ...extra });

const LUNES_1030 = "2026-11-16T10:30";

const filas = [
  /* ===== Horario de operación (08:00 – 20:00) ===== */
  {
    id: "M-01", regla: "Horario de operación",
    caso: "Reserva de 10:00 a 11:00 pedida a las 10:30",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma() },
    entonces: { errores: {} },
  },
  {
    id: "M-02", regla: "Horario de operación",
    caso: "Hora de inicio antes de la apertura (07:00)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: 7 }) },
    entonces: { errores: { inicio: m => m.fueraDeHorario() } },
  },
  {
    id: "M-03", regla: "Horario de operación",
    caso: "Hora de inicio en el cierre (20:00)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: 20 }) },
    entonces: { errores: { inicio: m => m.fueraDeHorario() } },
  },
  {
    id: "M-04", regla: "Horario de operación",
    caso: "Última franja del día: 19:00 a 20:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: 19, duracion: 1 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-05", regla: "Horario de operación",
    caso: "La reserva se pasaría del cierre (19:00 + 2 h)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: 19, duracion: 2 }) },
    entonces: { errores: { duracion: m => m.despuesDelCierre(21) } },
  },
  {
    id: "M-06", regla: "Horario de operación",
    caso: "Hora de inicio a media franja (10:30)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: 10.5 }) },
    entonces: { errores: { inicio: m => m.inicioInvalido() } },
  },
  {
    id: "M-07", regla: "Horario de operación",
    caso: "Hora de inicio que no es un número",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: "a las diez" }) },
    entonces: { errores: { inicio: m => m.inicioInvalido() } },
  },
  {
    id: "M-08", regla: "Horario de operación",
    caso: "Se intenta reservar cuando ya cerró (20:00)",
    dado: { ahora: "2026-11-16T20:00" },
    cuando: { accion: "validar", datos: forma() },
    entonces: { errores: { inicio: m => m.yaCerro() } },
  },
  {
    id: "M-09", regla: "Horario de operación",
    caso: "Antes de abrir (07:00) sí se puede apartar la franja de 08:00",
    dado: { ahora: "2026-11-16T07:00" },
    cuando: { accion: "validar", datos: forma({ inicio: 8 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-10", regla: "No se reserva en el pasado",
    caso: "A las 10:30 se pide una franja que ya terminó (09:00)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: 9 }) },
    entonces: { errores: { inicio: m => m.horaPasada() } },
  },
  {
    id: "M-11", regla: "No se reserva en el pasado",
    caso: "La franja en curso sigue disponible hasta que termina (10:59)",
    dado: { ahora: "2026-11-16T10:59" },
    cuando: { accion: "validar", datos: forma({ inicio: 10 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-12", regla: "No se reserva en el pasado",
    caso: "En cuanto la franja termina (11:00) ya no se puede apartar",
    dado: { ahora: "2026-11-16T11:00" },
    cuando: { accion: "validar", datos: forma({ inicio: 10 }) },
    entonces: { errores: { inicio: m => m.horaPasada() } },
  },

  /* ===== Duración ===== */
  {
    id: "M-13", regla: "Duración máxima de 2 horas",
    caso: "Duración de 2 horas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ duracion: 2 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-14", regla: "Duración máxima de 2 horas",
    caso: "Duración de 3 horas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ duracion: 3 }) },
    entonces: { errores: { duracion: m => m.duracionMaxima() } },
  },
  {
    id: "M-15", regla: "Duración válida",
    caso: "Duración de 0 horas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ duracion: 0 }) },
    entonces: { errores: { duracion: m => m.duracionInvalida() } },
  },
  {
    id: "M-16", regla: "Duración válida",
    caso: "Duración negativa",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ duracion: -1 }) },
    entonces: { errores: { duracion: m => m.duracionInvalida() } },
  },
  {
    id: "M-17", regla: "Duración válida",
    caso: "Duración de hora y media (no cabe en franjas de 1 h)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ duracion: 1.5 }) },
    entonces: { errores: { duracion: m => m.duracionInvalida() } },
  },
  {
    id: "M-18", regla: "Campos obligatorios",
    caso: "No se eligió duración",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ duracion: "" }) },
    entonces: { errores: { duracion: m => m.duracionVacia() } },
  },
  {
    id: "M-19", regla: "Campos obligatorios",
    caso: "No se eligió hora de inicio",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ inicio: "" }) },
    entonces: { errores: { inicio: m => m.inicioVacio() } },
  },
  {
    id: "M-20", regla: "Campos obligatorios",
    caso: "No se eligió hora de inicio y además ya cerró",
    dado: { ahora: "2026-11-16T20:30" },
    cuando: { accion: "validar", datos: forma({ inicio: "" }) },
    entonces: { errores: { inicio: m => m.yaCerro() } },
  },

  /* ===== Aforo y nombre ===== */
  {
    id: "M-21", regla: "Aforo máximo de 3 personas",
    caso: "3 personas (el máximo)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ personas: 3 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-22", regla: "Aforo máximo de 3 personas",
    caso: "4 personas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ personas: 4 }) },
    entonces: { errores: { personas: m => m.personasAforo(3) } },
  },
  {
    id: "M-23", regla: "Aforo máximo de 3 personas",
    caso: "0 personas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ personas: 0 }) },
    entonces: { errores: { personas: m => m.personasInvalido() } },
  },
  {
    id: "M-24", regla: "Aforo máximo de 3 personas",
    caso: "Personas con decimales (1.5)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ personas: 1.5 }) },
    entonces: { errores: { personas: m => m.personasInvalido() } },
  },
  {
    id: "M-25", regla: "Campos obligatorios",
    caso: "No se escribió cuántas personas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ personas: "" }) },
    entonces: { errores: { personas: m => m.personasVacio() } },
  },
  {
    id: "M-26", regla: "Aforo máximo de 3 personas",
    caso: "Personas escrito con letras",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ personas: "dos" }) },
    entonces: { errores: { personas: m => m.personasInvalido() } },
  },
  {
    id: "M-27", regla: "Campos obligatorios",
    caso: "Nombre del grupo vacío",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ nombre: "" }) },
    entonces: { errores: { nombre: m => m.nombreVacio() } },
  },
  {
    id: "M-28", regla: "Campos obligatorios",
    caso: "Nombre con solo espacios",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ nombre: "   " }) },
    entonces: { errores: { nombre: m => m.nombreVacio() } },
  },
  {
    id: "M-29", regla: "Nombre de al menos 2 caracteres",
    caso: "Nombre de una sola letra",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ nombre: "A" }) },
    entonces: { errores: { nombre: m => m.nombreCorto() } },
  },
  {
    id: "M-30", regla: "Nombre de al menos 2 caracteres",
    caso: "Nombre con espacios alrededor se recorta antes de medirlo",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ nombre: "  Ana  " }) },
    entonces: { errores: {} },
  },
  {
    id: "M-31", regla: "Nombre de máximo 40 caracteres",
    caso: "Nombre de 41 caracteres",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ nombre: "N".repeat(41) }) },
    entonces: { errores: { nombre: "Escribe como máximo 40 caracteres." } },
    defecto: "H-01: Reglas.validar no revisa el largo máximo del nombre. Hoy solo lo limitan el atributo maxlength=\"40\" del formulario y el recorte de Almacen.sanear al recargar, así que un nombre de 41 caracteres entra por código y se guarda completo, pero cambia al recargar la página.",
  },

  /* ===== Cubículo ===== */
  {
    id: "M-32", regla: "El cubículo debe existir",
    caso: "Cubículo que no está en el plano",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ cubiculo: "cub-99" }) },
    entonces: { errores: { cubiculo: m => m.cubiculoInvalido() } },
  },
  {
    id: "M-33", regla: "El cubículo debe existir",
    caso: "Cubículo vacío: se reporta solo ese error y ya no se revisa el resto",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "validar", datos: forma({ cubiculo: "", nombre: "", personas: 9 }) },
    entonces: { errores: { cubiculo: m => m.cubiculoInvalido() } },
  },

  /* ===== Choques en el mismo cubículo ===== */
  {
    id: "M-34", regla: "Un cubículo no se reserva dos veces a la misma hora",
    caso: "Ya hay 10:00–12:00 y se pide 10:00–11:00 en el mismo cubículo",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "validar", datos: forma({ inicio: 10, duracion: 1 }) },
    entonces: { errores: { inicio: m => m.choqueCubiculo("Cubículo 1 de 10:00 a 12:00") } },
  },
  {
    id: "M-35", regla: "Un cubículo no se reserva dos veces a la misma hora",
    caso: "Ya hay 10:00–12:00 y se pide 11:00–12:00: el choque se marca en la hora",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "validar", datos: forma({ inicio: 11, duracion: 1 }) },
    entonces: { errores: { inicio: m => m.choqueCubiculo("Cubículo 1 de 10:00 a 12:00") } },
  },
  {
    id: "M-36", regla: "Un cubículo no se reserva dos veces a la misma hora",
    caso: "Ya hay 11:00–12:00 y se pide 10:00 por 2 h: el choque se marca en la duración",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 11, duracion: 1 })] },
    cuando: { accion: "validar", datos: forma({ inicio: 10, duracion: 2 }) },
    entonces: { errores: { duracion: m => m.choqueCubiculo("Cubículo 1 de 11:00 a 12:00") } },
  },
  {
    id: "M-37", regla: "Reservas pegadas no son choque",
    caso: "Ya hay 10:00–11:00 y se pide 11:00–12:00",
    dado: { ahora: LUNES_1030, reservas: [ya({ duracion: 1 })] },
    cuando: { accion: "validar", datos: forma({ inicio: 11, duracion: 1 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-38", regla: "El choque es por cubículo",
    caso: "El cubículo 1 está ocupado 10:00–12:00 y se pide el cubículo 2 a esa hora",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "validar", datos: forma({ cubiculo: CUB2, nombre: "Equipo B" }) },
    entonces: { errores: {} },
  },
  {
    id: "M-39", regla: "El choque es por día",
    caso: "La reserva que ocupa 10:00–12:00 es de mañana",
    dado: { ahora: LUNES_1030, reservas: [ya({ dia: "manana" })] },
    cuando: { accion: "validar", datos: forma() },
    entonces: { errores: {} },
  },

  /* ===== Un grupo, un cubículo ===== */
  {
    id: "M-40", regla: "Un grupo no puede estar en dos cubículos a la vez",
    caso: "«Equipo A» tiene el cubículo 1 de 10:00 a 12:00 y pide el cubículo 2 a las 11:00",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "validar", datos: forma({ cubiculo: CUB2, inicio: 11, duracion: 1 }) },
    entonces: { errores: { inicio: m => m.choqueGrupo("Equipo A", "Cubículo 1 de 10:00 a 12:00") } },
  },
  {
    id: "M-41", regla: "El nombre del grupo se compara sin distinguir mayúsculas ni espacios",
    caso: "«Equipo A» ya tiene el cubículo 1; se pide el 2 como «  equipo a  »",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "validar", datos: forma({ cubiculo: CUB2, inicio: 11, duracion: 1, nombre: "  equipo a  " }) },
    entonces: { errores: { inicio: m => m.choqueGrupo("equipo a", "Cubículo 1 de 10:00 a 12:00") } },
  },
  {
    id: "M-42", regla: "Un grupo sí puede reservar en horas distintas",
    caso: "«Equipo A» tiene el cubículo 1 de 10:00 a 11:00 y pide el cubículo 2 de 11:00 a 12:00",
    dado: { ahora: LUNES_1030, reservas: [ya({ duracion: 1 })] },
    cuando: { accion: "validar", datos: forma({ cubiculo: CUB2, inicio: 11, duracion: 1 }) },
    entonces: { errores: {} },
  },
  {
    id: "M-43", regla: "Un grupo no puede estar en dos cubículos a la vez",
    caso: "Otro grupo sí puede usar el cubículo 2 a la misma hora",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "validar", datos: forma({ cubiculo: CUB2, inicio: 11, duracion: 1, nombre: "Equipo B" }) },
    entonces: { errores: {} },
  },

  /* ===== Creación ===== */
  {
    id: "M-44", regla: "Crear una reserva válida",
    caso: "Se aparta el cubículo 1 de 10:00 a 12:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "crear", datos: forma({ duracion: 2 }) },
    entonces: {
      ok: true,
      reservas: [{ cubiculo: CUB1, fecha: "2026-11-16", inicio: 10, duracion: 2, nombre: "Equipo A", personas: 2 }],
      y: "la reserva queda con folio y marcada como propia de este navegador",
      revisar: (t, { app, resultado }) => {
        t.assert.match(resultado.reserva.id, /^res-\d{3}$/);
        t.assert.equal(resultado.reserva.dueno, app.Identidad.token());
      },
    },
  },
  {
    id: "M-45", regla: "Una reserva inválida no se guarda",
    caso: "Se intenta crear con 4 personas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "crear", datos: forma({ personas: 4 }) },
    entonces: { ok: false, errores: { personas: m => m.personasAforo(3) }, reservas: [] },
  },

  /* ===== Cancelar ===== */
  {
    id: "M-46", regla: "Cancelar una reserva propia",
    caso: "Reserva propia de 14:00 a 15:00, se cancela a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1 })] },
    cuando: { accion: "cancelar", reserva: 1 },
    entonces: { ok: true, reservas: [] },
  },
  {
    id: "M-47", regla: "Solo se cancela lo propio",
    caso: "La reserva es de otro navegador",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1, mia: false })] },
    cuando: { accion: "cancelar", reserva: 1 },
    entonces: { ok: false, error: m => m.cancelarNoEsTuya(), reservas: 1 },
  },
  {
    id: "M-48", regla: "Cancelar algo que ya no existe",
    caso: "Se cancela un folio inexistente",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "cancelar", id: "res-999" },
    entonces: { ok: false, error: m => m.cancelarNoExiste() },
  },
  {
    id: "M-49", regla: "No se cancela una reserva que ya terminó",
    caso: "Reserva de 08:00 a 09:00, se intenta cancelar a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 8, duracion: 1 })] },
    cuando: { accion: "cancelar", reserva: 1 },
    entonces: { ok: false, error: m => m.cancelarYaTermino(), reservas: 1 },
  },
  {
    id: "M-50", regla: "Una reserva en curso sí se puede cancelar",
    caso: "Reserva de 10:00 a 12:00, se cancela a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "cancelar", reserva: 1 },
    entonces: { ok: true, reservas: [] },
  },
  {
    id: "M-51", regla: "Si no se puede guardar, la cancelación se revierte",
    caso: "El navegador rechaza la escritura al cancelar",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1 })], fallaAlGuardar: true },
    cuando: { accion: "cancelar", reserva: 1 },
    entonces: {
      ok: false, error: m => m.cancelarFallo(),
      reservas: [{ cubiculo: CUB1, inicio: 14, duracion: 1 }],
      y: "la reserva sigue en pie, tal como estaba",
    },
  },

  /* ===== Liberar antes de tiempo ===== */
  {
    id: "M-52", regla: "Liberar el cubículo durante la primera hora lo deja libre completo",
    caso: "Reserva propia de 10:00 a 12:00, se libera a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "liberar", reserva: 1 },
    entonces: {
      ok: true, reservas: [],
      y: "se libera de 10:00 a 12:00 y la reserva desaparece",
      revisar: (t, { resultado }) => {
        t.assert.equal(resultado.desde, 10);
        t.assert.equal(resultado.hasta, 12);
        t.assert.equal(resultado.eliminada, true);
      },
    },
  },
  {
    id: "M-53", regla: "Liberar conserva las horas ya usadas",
    caso: "Reserva propia de 10:00 a 12:00, se libera a las 11:30",
    dado: { ahora: "2026-11-16T11:30", reservas: [ya()] },
    cuando: { accion: "liberar", reserva: 1 },
    entonces: {
      ok: true,
      reservas: [{ cubiculo: CUB1, inicio: 10, duracion: 1 }],
      y: "la reserva queda de 10:00 a 11:00 y la hora de 11:00 a 12:00 vuelve a estar libre",
      revisar: (t, { resultado }) => {
        t.assert.equal(resultado.desde, 11);
        t.assert.equal(resultado.eliminada, false);
      },
    },
  },
  {
    id: "M-54", regla: "No se libera una reserva que todavía no empieza",
    caso: "Reserva propia de 14:00 a 15:00, se intenta liberar a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1 })] },
    cuando: { accion: "liberar", reserva: 1 },
    entonces: { ok: false, error: m => m.liberarNoEmpieza(), reservas: 1 },
  },
  {
    id: "M-55", regla: "No se libera una reserva que ya terminó",
    caso: "Reserva propia de 08:00 a 09:00, se intenta liberar a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 8, duracion: 1 })] },
    cuando: { accion: "liberar", reserva: 1 },
    entonces: { ok: false, error: m => m.liberarYaTermino(), reservas: 1 },
  },
  {
    id: "M-56", regla: "Solo se libera lo propio",
    caso: "La reserva en curso es de otro navegador",
    dado: { ahora: LUNES_1030, reservas: [ya({ mia: false })] },
    cuando: { accion: "liberar", reserva: 1 },
    entonces: { ok: false, error: m => m.liberarNoEsTuya(), reservas: 1 },
  },
  {
    id: "M-57", regla: "Si no se puede guardar, la liberación se revierte",
    caso: "El navegador rechaza la escritura al liberar",
    dado: { ahora: "2026-11-16T11:30", reservas: [ya()], fallaAlGuardar: true },
    cuando: { accion: "liberar", reserva: 1 },
    entonces: {
      ok: false, error: m => m.liberarFallo(),
      reservas: [{ cubiculo: CUB1, inicio: 10, duracion: 2 }],
      y: "la reserva conserva sus 2 horas",
    },
  },

  /* ===== Deshacer una cancelación ===== */
  {
    id: "M-58", regla: "Deshacer devuelve la reserva cancelada",
    caso: "Se canceló la reserva de 14:00 a 15:00 y se deshace",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1 })], canceladas: [1] },
    cuando: { accion: "deshacer" },
    entonces: {
      ok: true,
      reservas: [{ cubiculo: CUB1, inicio: 14, duracion: 1, nombre: "Equipo A", personas: 2 }],
      y: "vuelve con el mismo folio",
      revisar: (t, { resultado, canceladas }) => t.assert.equal(resultado.reserva.id, canceladas[0].id),
    },
  },
  {
    id: "M-59", regla: "No se deshace dos veces",
    caso: "Se deshace la cancelación y se vuelve a intentar",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1 })], canceladas: [1] },
    cuando: { accion: "deshacer", repetir: 2 },
    entonces: { ok: false, error: m => m.deshacerYaExiste(), reservas: 1 },
  },
  {
    id: "M-60", regla: "Solo se deshace lo propio",
    caso: "La reserva cancelada era de otro navegador",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1, mia: false })], canceladas: [1] },
    cuando: { accion: "deshacer" },
    entonces: { ok: false, error: m => m.cancelarNoEsTuya(), reservas: [] },
  },
  {
    id: "M-61", regla: "No se deshace una reserva cuya hora ya pasó",
    caso: "La reserva cancelada era de 08:00 a 09:00 y ya son las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 8, duracion: 1 })], canceladas: [1] },
    cuando: { accion: "deshacer" },
    entonces: { ok: false, error: m => m.deshacerYaTermino(), reservas: [] },
  },
  {
    id: "M-62", regla: "No se deshace si alguien más ya ocupó el horario",
    caso: "Mientras tanto, otra persona apartó el cubículo 1 de 14:00 a 15:00",
    dado: {
      ahora: LUNES_1030,
      reservas: [ya({ inicio: 14, duracion: 1 }), ya({ inicio: 14, duracion: 1, nombre: "Equipo C", mia: false })],
      canceladas: [1],
    },
    cuando: { accion: "deshacer" },
    entonces: { ok: false, error: m => m.deshacerChoque("Cubículo 1 de 14:00 a 15:00"), reservas: 1 },
  },
  {
    id: "M-63", regla: "No se deshace si el grupo ya quedó en otro cubículo",
    caso: "«Equipo A» apartó el cubículo 2 a la misma hora después de cancelar",
    dado: {
      ahora: LUNES_1030,
      reservas: [ya({ inicio: 14, duracion: 1 }), ya({ cubiculo: CUB2, inicio: 14, duracion: 1 })],
      canceladas: [1],
    },
    cuando: { accion: "deshacer" },
    entonces: { ok: false, error: m => m.deshacerChoqueGrupo("Equipo A", "Cubículo 2 de 14:00 a 15:00"), reservas: 1 },
  },
  {
    id: "M-64", regla: "Si no se puede guardar, el deshacer se revierte",
    caso: "El navegador rechaza la escritura al restaurar",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 14, duracion: 1 })], canceladas: [1], fallaAlGuardar: true },
    cuando: { accion: "deshacer" },
    entonces: {
      ok: false, error: m => m.deshacerFallo(), reservas: [],
      y: "el aviso ofrece reintentar",
      revisar: (t, { resultado }) => t.assert.equal(resultado.reintentar, true),
    },
  },

  /* ===== Horas que se ofrecen en el formulario ===== */
  {
    id: "M-65", regla: "Solo se ofrecen horas futuras y libres",
    caso: "A las 10:30, sin reservas, el cubículo 1 ofrece de 10:00 a 19:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "iniciosDisponibles", cubiculo: CUB1 },
    entonces: { valor: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] },
  },
  {
    id: "M-66", regla: "Solo se ofrecen horas futuras y libres",
    caso: "A las 10:30 con el cubículo ocupado de 10:00 a 12:00",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "iniciosDisponibles", cubiculo: CUB1 },
    entonces: { valor: [12, 13, 14, 15, 16, 17, 18, 19] },
  },
  {
    id: "M-67", regla: "Antes de abrir se ofrece el día completo",
    caso: "A las 07:00, sin reservas",
    dado: { ahora: "2026-11-16T07:00" },
    cuando: { accion: "iniciosDisponibles", cubiculo: CUB1 },
    entonces: { valor: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] },
  },
  {
    id: "M-68", regla: "Al final del día solo queda la última franja",
    caso: "A las 19:30",
    dado: { ahora: "2026-11-16T19:30" },
    cuando: { accion: "iniciosDisponibles", cubiculo: CUB1 },
    entonces: { valor: [19] },
  },
  {
    id: "M-69", regla: "Cerrado: no se ofrece ninguna hora",
    caso: "A las 20:30",
    dado: { ahora: "2026-11-16T20:30" },
    cuando: { accion: "iniciosDisponibles", cubiculo: CUB1 },
    entonces: { valor: [] },
  },
  {
    id: "M-70", regla: "Las duraciones se recortan a lo que de verdad está libre",
    caso: "Inicio 10:00 con todo libre",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "duracionesPosibles", cubiculo: CUB1, inicio: 10 },
    entonces: { valor: [1, 2] },
  },
  {
    id: "M-71", regla: "Las duraciones se recortan a lo que de verdad está libre",
    caso: "Inicio 10:00 con la hora siguiente ocupada",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 11, duracion: 1 })] },
    cuando: { accion: "duracionesPosibles", cubiculo: CUB1, inicio: 10 },
    entonces: { valor: [1] },
  },
  {
    id: "M-72", regla: "Las duraciones se recortan al cierre",
    caso: "Inicio 19:00: solo cabe 1 hora antes de cerrar",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "duracionesPosibles", cubiculo: CUB1, inicio: 19 },
    entonces: { valor: [1] },
  },
  {
    id: "M-73", regla: "Las duraciones se recortan a lo que de verdad está libre",
    caso: "Inicio 10:00 cuando esa misma hora está ocupada",
    dado: { ahora: LUNES_1030, reservas: [ya({ duracion: 1 })] },
    cuando: { accion: "duracionesPosibles", cubiculo: CUB1, inicio: 10 },
    entonces: { valor: [] },
  },

  /* ===== Estado que muestra la tarjeta ===== */
  {
    id: "M-74", regla: "Estado del cubículo en este momento",
    caso: "Sin reservas a las 10:30: libre hasta el cierre",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "estadoActual", cubiculo: CUB1 },
    entonces: { valor: { estado: "libre", hasta: 20, cuando: "hoy" } },
  },
  {
    id: "M-75", regla: "Estado del cubículo en este momento",
    caso: "Ocupado de 10:00 a 12:00, a las 10:30",
    dado: { ahora: LUNES_1030, reservas: [ya()] },
    cuando: { accion: "estadoActual", cubiculo: CUB1 },
    entonces: { valor: { estado: "ocupado", hasta: 12, cuando: "hoy" } },
  },
  {
    id: "M-76", regla: "Estado del cubículo en este momento",
    caso: "Libre ahora pero reservado de 12:00 a 13:00",
    dado: { ahora: LUNES_1030, reservas: [ya({ inicio: 12, duracion: 1 })] },
    cuando: { accion: "estadoActual", cubiculo: CUB1 },
    entonces: { valor: { estado: "libre", hasta: 12, cuando: "hoy" } },
  },
  {
    id: "M-77", regla: "Fuera del horario la tarjeta dice Cerrado",
    caso: "A las 07:00, antes de abrir",
    dado: { ahora: "2026-11-16T07:00" },
    cuando: { accion: "estadoActual", cubiculo: CUB1 },
    entonces: { valor: { estado: "cerrado", hasta: 8, cuando: "hoy" } },
  },
  {
    id: "M-78", regla: "Fuera del horario la tarjeta dice Cerrado",
    caso: "A las 20:30, ya cerrado: abre mañana",
    dado: { ahora: "2026-11-16T20:30" },
    cuando: { accion: "estadoActual", cubiculo: CUB1 },
    entonces: { valor: { estado: "cerrado", hasta: 8, cuando: "mañana" } },
  },

  /* ===== Saneado de lo que viene guardado en el navegador =====
     Cualquiera puede editar el almacenamiento del navegador a mano, así que al
     cargar se revisa reserva por reserva y se tira lo que no cumple las reglas. */
  {
    id: "M-79", regla: "Al cargar se conservan las reservas válidas",
    caso: "Una reserva bien formada",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda()] },
    entonces: { validas: 1, descartadas: [] },
  },
  {
    id: "M-80", regla: "Al cargar se descarta lo que no es una reserva",
    caso: "El almacenamiento tiene un nulo, un texto y un arreglo",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [null, "reserva", [1, 2]] },
    entonces: { validas: 0, descartadas: ["noEsObjeto", "noEsObjeto", "noEsObjeto"] },
  },
  {
    id: "M-81", regla: "Al cargar se descartan reservas de cubículos que no existen",
    caso: "La reserva apunta al cubículo 9",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ cubiculo: "cub-09" })] },
    entonces: { validas: 0, descartadas: ["cubiculo"] },
  },
  {
    id: "M-82", regla: "Al cargar se descartan fechas inválidas",
    caso: "Fecha con formato roto",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ fecha: "16/11/2026" })] },
    entonces: { validas: 0, descartadas: ["fecha"] },
  },
  {
    id: "M-83", regla: "Al cargar se descartan fechas inválidas",
    caso: "Día que no existe en el calendario (30 de febrero)",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ fecha: "2026-02-30" })] },
    entonces: { validas: 0, descartadas: ["fecha"] },
  },
  {
    id: "M-84", regla: "Al cargar se descartan reservas a más de 2 días",
    caso: "Reserva con fecha de 5 días adelante",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ fecha: "2026-11-21" })] },
    entonces: { validas: 0, descartadas: ["fechaLejana"] },
  },
  {
    id: "M-85", regla: "Al cargar se descartan horas fuera del horario",
    caso: "Reserva guardada a las 07:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ inicio: 7 })] },
    entonces: { validas: 0, descartadas: ["inicio"] },
  },
  {
    id: "M-86", regla: "Al cargar se descartan horas que no caen en una franja",
    caso: "Reserva guardada a las 10:30",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ inicio: 10.5 })] },
    entonces: { validas: 0, descartadas: ["inicio"] },
  },
  {
    id: "M-87", regla: "Al cargar se descartan duraciones mayores al máximo",
    caso: "Reserva guardada de 3 horas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ duracion: 3 })] },
    entonces: { validas: 0, descartadas: ["duracion"] },
  },
  {
    id: "M-88", regla: "Al cargar se descartan reservas que terminan después del cierre",
    caso: "Reserva guardada de 19:00 a 21:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ inicio: 19, duracion: 2 })] },
    entonces: { validas: 0, descartadas: ["duracion"] },
  },
  {
    id: "M-89", regla: "Al cargar se descartan nombres inválidos",
    caso: "Reserva guardada con el nombre «A»",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ nombre: "A" })] },
    entonces: { validas: 0, descartadas: ["nombre"] },
  },
  {
    id: "M-90", regla: "Al cargar se descartan reservas que pasan del aforo",
    caso: "Reserva guardada con 5 personas",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ personas: 5 })] },
    entonces: { validas: 0, descartadas: ["personas"] },
  },
  {
    id: "M-91", regla: "Al cargar, de dos reservas que chocan se conserva la primera",
    caso: "Dos reservas guardadas en el cubículo 1 a las 10:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ id: "res-001" }), cruda({ id: "res-002", nombre: "Equipo B" })] },
    entonces: { validas: 1, descartadas: ["choque"], y: "se queda la de folio más bajo (res-001)" },
  },
  {
    id: "M-92", regla: "Al cargar se descarta el mismo grupo en dos cubículos a la vez",
    caso: "«Equipo A» aparece guardado en el cubículo 1 y en el 2 a las 10:00",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ id: "res-001" }), cruda({ id: "res-002", cubiculo: CUB2 })] },
    entonces: { validas: 1, descartadas: ["choqueGrupo"] },
  },
  {
    id: "M-93", regla: "Al cargar, un nombre muy largo se recorta a 40 caracteres",
    caso: "Reserva guardada con un nombre de 45 caracteres",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ nombre: "N".repeat(45) })] },
    entonces: {
      validas: 1, descartadas: [],
      y: "el nombre queda en 40 caracteres",
      revisar: (t, { resultado }) => t.assert.equal(resultado.validas[0].nombre.length, 40),
    },
  },
  {
    id: "M-94", regla: "Al cargar, una firma de dueño inválida se descarta pero la reserva se conserva",
    caso: "Reserva guardada con dueño «abc»",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ dueno: "abc" })] },
    entonces: {
      validas: 1, descartadas: [],
      y: "la reserva queda sin dueño, así que ya no se puede cancelar desde este navegador",
      revisar: (t, { resultado }) => t.assert.equal(resultado.validas[0].dueno, null),
    },
  },
  {
    id: "M-95", regla: "Al cargar, los folios repetidos o inválidos se reasignan",
    caso: "Dos reservas guardadas con el folio res-001",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda(), cruda({ inicio: 14, duracion: 1, nombre: "Equipo B" })] },
    entonces: {
      validas: 2, descartadas: [],
      y: "la segunda se queda sin folio para que la carga le asigne uno nuevo",
      revisar: (t, { resultado }) => {
        t.assert.equal(resultado.validas[0].id, "res-001");
        t.assert.equal(resultado.validas[1].id, null);
      },
    },
  },
  {
    id: "M-96", regla: "Al cargar se conservan las reservas de hoy que ya pasaron",
    caso: "Reserva de hoy de 08:00 a 09:00, cargada a las 10:30",
    dado: { ahora: LUNES_1030 },
    cuando: { accion: "sanear", lista: [cruda({ inicio: 8, duracion: 1 })] },
    entonces: { validas: 1, descartadas: [], y: "queda en la agenda del día como historial" },
  },

  /* ===== Esquema guardado y migraciones ===== */
  {
    id: "M-97", regla: "Se cargan los datos del esquema actual (v2)",
    caso: "El navegador tiene una reserva guardada en v2",
    dado: { ahora: LUNES_1030, guardado: { version: 2, reservas: [cruda()] } },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "ok", cargadas: 1, depuradas: 0 },
      reservas: [{ cubiculo: CUB1, inicio: 10, duracion: 2 }],
    },
  },
  {
    id: "M-98", regla: "Los datos del esquema v1 se actualizan solos",
    caso: "El navegador tiene datos v1, sin firma de dueño",
    dado: { ahora: LUNES_1030, guardado: { version: 1, ultimoId: 1, reservas: [cruda({ dueno: undefined })] } },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "ok", cargadas: 1 },
      y: "la reserva queda a nombre de este navegador",
      revisar: (t, { app }) => t.assert.equal(app.Modelo.reservas[0].dueno, app.Identidad.token()),
    },
  },
  {
    id: "M-99", regla: "Los datos más antiguos (v0, un arreglo suelto) también se actualizan",
    caso: "El navegador tiene un arreglo de reservas sin número de personas",
    dado: { ahora: LUNES_1030, guardado: [cruda({ personas: undefined, dueno: undefined })] },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "ok", cargadas: 1 },
      y: "se asume 1 persona",
      revisar: (t, { app }) => t.assert.equal(app.Modelo.reservas[0].personas, 1),
    },
  },
  {
    id: "M-100", regla: "Se recuperan los datos de la clave antigua",
    caso: "Las reservas están guardadas en «cubiculos.reservas.v1»",
    dado: { ahora: LUNES_1030, guardadoEnClaveAntigua: { version: 2, reservas: [cruda()] } },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "ok", cargadas: 1 },
      y: "se pasan a la clave nueva y la antigua se borra",
      revisar: (t, { app }) => {
        t.assert.equal(app.ls.crudo("cubiculos.reservas.v1"), null);
        t.assert.notEqual(app.ls.crudo("cubiculos.estado"), null);
      },
    },
  },
  {
    id: "M-101", regla: "Si los datos están dañados se respaldan y se empieza sin reservas",
    caso: "El almacenamiento tiene texto que no es JSON",
    dado: { ahora: LUNES_1030, guardadoCrudo: "{esto no es json" },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "corrupto", cargadas: 0 },
      y: "queda una copia en una clave «.danado.» para no perder nada",
      revisar: (t, { app }) => t.assert.ok(app.ls.claves().some(k => k.startsWith("cubiculos.estado.danado."))),
    },
  },
  {
    id: "M-102", regla: "Datos de una versión más nueva: se abren en solo lectura",
    caso: "El almacenamiento dice esquema v99",
    dado: { ahora: LUNES_1030, guardado: { version: 99, reservas: [] } },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "futuro", cargadas: 0 },
      y: "no se sobrescribe lo guardado, para no romper la versión nueva",
      revisar: (t, { app }) => {
        t.assert.equal(app.Almacen.guardar(), false);
        t.assert.equal(JSON.parse(app.ls.crudo("cubiculos.estado")).version, 99);
      },
    },
  },
  {
    id: "M-103", regla: "Sin almacenamiento la página funciona igual, solo no recuerda",
    caso: "El navegador no deja usar localStorage (modo privado)",
    dado: { ahora: LUNES_1030, sinAlmacenamiento: true },
    cuando: { accion: "hidratar" },
    entonces: { valor: { estado: "vacio", cargadas: 0 } },
  },
  {
    id: "M-104", regla: "Las reservas de días anteriores se eliminan al cargar",
    caso: "El navegador tiene una reserva de ayer y una de hoy",
    dado: {
      ahora: LUNES_1030,
      guardado: { version: 2, reservas: [cruda({ fecha: "2026-11-15" }), cruda({ id: "res-002", inicio: 14, duracion: 1, nombre: "Equipo B" })] },
    },
    cuando: { accion: "hidratar" },
    entonces: {
      valor: { estado: "ok", cargadas: 1, depuradas: 1 },
      reservas: [{ cubiculo: CUB1, inicio: 14, duracion: 1 }],
    },
  },
];

module.exports = { filas, CUB1, CUB2, LUNES_1030 };
