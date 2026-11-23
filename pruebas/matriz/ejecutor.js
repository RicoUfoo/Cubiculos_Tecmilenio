"use strict";
/* T47 · Ejecuta una fila de la matriz y compara el resultado con lo esperado.
   La misma función la usan la prueba automatizada y el generador del documento. */
const { crearApp } = require("./cargar-app");

// La página trabaja en la zona de Monterrey (UTC-06:00, sin horario de verano).
// Las horas de la matriz ("2026-11-16T10:30") se interpretan en esa zona.
const DESFASE = "-06:00";
const OTRO_DISPOSITIVO = "otro-dispositivo-9f2c4b";

function fechaLocal(texto) {
  const f = new Date(`${texto}:00${DESFASE}`);
  if (Number.isNaN(f.getTime())) throw new Error(`Hora inválida en la matriz: ${texto}`);
  return f;
}

// Deja la aplicación en el estado que describe el campo "dado" de la fila.
function preparar(fila) {
  const d = fila.dado || {};
  const almacen = {};
  if (d.guardado !== undefined) almacen["cubiculos.estado"] = JSON.stringify(d.guardado);
  if (d.guardadoCrudo !== undefined) almacen["cubiculos.estado"] = d.guardadoCrudo;
  if (d.guardadoEnClaveAntigua !== undefined) almacen["cubiculos.reservas.v1"] = JSON.stringify(d.guardadoEnClaveAntigua);

  const app = crearApp({ almacen });
  const ahora = fechaLocal(d.ahora);
  if (d.sinAlmacenamiento) { app.ls.noDisponible = true; app.Almacen._disponible = null; }

  const hoy = app.Modelo._fmtFechaISO.format(ahora);
  const fecha = r => r.fecha || (r.dia ? app.Almacen.sumarDias(hoy, r.dia === "manana" ? 1 : -1) : hoy);
  const sembradas = (d.reservas || []).map((r, i) => {
    const { mia = true, dia, ...resto } = r;
    return {
      id: `res-${String(i + 1).padStart(3, "0")}`,
      fecha: fecha(r),
      dueno: mia ? app.Identidad.token() : OTRO_DISPOSITIVO,
      ...resto,
    };
  });
  app.Modelo._ultimoId = sembradas.length;

  // "canceladas: [n]" simula que esa reserva se canceló hace un momento:
  // sale del modelo pero se conserva para probar el Deshacer.
  const canceladas = (d.canceladas || []).map(n => sembradas[n - 1]);
  app.Modelo.reservas = sembradas.filter(r => !canceladas.includes(r));
  if (d.fallaAlGuardar) app.ls.fallaAlGuardar = true;

  return { app, ahora, sembradas, canceladas };
}

function ejecutar(fila, ctx) {
  const { app, ahora, sembradas, canceladas } = ctx;
  const c = fila.cuando;
  const folio = () => (c.id !== undefined ? c.id : sembradas[c.reserva - 1].id);
  switch (c.accion) {
    case "validar": return app.Reglas.validar(c.datos, ahora);
    case "crear": return app.Reglas.crear(c.datos, ahora);
    case "cancelar": return app.Reglas.cancelar(folio(), ahora);
    case "liberar": return app.Reglas.liberar(folio(), ahora);
    case "deshacer": {
      const objetivo = c.reserva ? sembradas[c.reserva - 1] : canceladas[0];
      let r;
      for (let i = 0; i < (c.repetir || 1); i++) r = app.Reglas.deshacerCancelacion(objetivo, ahora);
      return r;
    }
    case "iniciosDisponibles": return app.Reglas.iniciosDisponibles(c.cubiculo, ahora);
    case "duracionesPosibles": return app.Reglas.duracionesPosibles(c.cubiculo, c.inicio, ahora);
    case "estadoActual": return app.Modelo.estadoActual(c.cubiculo, ahora);
    case "sanear": return app.Almacen.sanear(c.lista, ahora);
    case "hidratar": return app.Almacen.hidratar(ahora);
    default: throw new Error(`Acción desconocida en la matriz: ${c.accion}`);
  }
}

// Los mensajes esperados se escriben como función (m => m.horaPasada()) para que
// salgan del catálogo de la página y no se desincronicen por una coma.
const resolver = (v, Mensajes) => (typeof v === "function" ? v(Mensajes) : v);

// Script.js corre dentro de un contexto aparte (vm), así que los objetos que
// devuelve nacen con "otro" Object.prototype y las comparaciones estrictas
// fallarían sin motivo. Esta copia los trae a este lado antes de compararlos.
function propio(valor) {
  // Ojo: `valor.map(...)` devolvería un arreglo del OTRO contexto y las
  // comparaciones estrictas seguirían fallando; hay que construirlo aquí.
  if (Array.isArray(valor)) {
    const copia = [];
    for (let i = 0; i < valor.length; i++) copia.push(propio(valor[i]));
    return copia;
  }
  if (valor && typeof valor === "object") {
    const copia = {};
    Object.keys(valor).forEach(k => { copia[k] = propio(valor[k]); });
    return copia;
  }
  return valor;
}

// Recorta el objeto real a las claves que la fila declara, para comparar solo eso.
function recortar(real, esperado) {
  const r = {};
  Object.keys(esperado).forEach(k => { r[k] = real ? real[k] : undefined; });
  return r;
}

function esperadoErrores(fila, Mensajes) {
  const e = {};
  Object.entries(fila.entonces.errores).forEach(([k, v]) => { e[k] = resolver(v, Mensajes); });
  return e;
}

// Corre la fila y revisa TODO lo que declara "entonces". `t` es el contexto de
// node:test (se usa t.assert.*), así cada desajuste se reporta con su fila.
function verificar(t, fila) {
  const ctx = preparar(fila);
  const resultado = propio(ejecutar(fila, ctx));
  const e = fila.entonces;
  const M = ctx.app.Mensajes;

  if (e.errores) {
    const reales = resultado && resultado.errores ? resultado.errores : resultado;
    t.assert.deepStrictEqual(reales, esperadoErrores(fila, M), "campos con error");
  }
  if (e.ok !== undefined) t.assert.strictEqual(resultado.ok, e.ok, "resultado de la operación");
  if (e.error) t.assert.strictEqual(resultado.error, resolver(e.error, M), "mensaje de rechazo");
  if (e.valor !== undefined) {
    if (Array.isArray(e.valor)) t.assert.deepStrictEqual(resultado, e.valor, "valor devuelto");
    else t.assert.deepStrictEqual(recortar(resultado, e.valor), e.valor, "valor devuelto");
  }
  if (e.validas !== undefined) t.assert.strictEqual(resultado.validas.length, e.validas, "reservas conservadas");
  if (e.descartadas) {
    t.assert.deepStrictEqual(
      resultado.descartadas.map(d => d.motivo),
      e.descartadas.map(k => M.motivo[k]),
      "motivos de descarte"
    );
  }
  if (e.reservas !== undefined) {
    const guardadas = propio(ctx.app.Modelo.reservas);
    if (typeof e.reservas === "number") {
      t.assert.strictEqual(guardadas.length, e.reservas, "cuántas reservas quedan");
    } else {
      t.assert.strictEqual(guardadas.length, e.reservas.length, "cuántas reservas quedan");
      e.reservas.forEach((esp, i) => t.assert.deepStrictEqual(recortar(guardadas[i], esp), esp, `reserva ${i + 1}`));
    }
  }
  if (e.revisar) e.revisar(t, { ...ctx, resultado });
  return { ctx, resultado };
}

// Texto legible de lo que la fila espera; lo usa el documento de la matriz.
const CAMPOS = { cubiculo: "Cubículo", nombre: "Nombre del grupo", personas: "Personas", inicio: "Hora de inicio", duracion: "Duración" };

function describirEsperado(fila, Mensajes) {
  const e = fila.entonces;
  const partes = [];
  if (e.errores) {
    const errs = esperadoErrores(fila, Mensajes);
    const claves = Object.keys(errs);
    if (!claves.length) partes.push("Se acepta, sin errores.");
    else claves.forEach(k => partes.push(`Error en **${CAMPOS[k] || k}**: «${errs[k]}»`));
  }
  if (e.ok === true && !e.errores) partes.push("La operación procede.");
  if (e.ok === false && !e.errores) partes.push("Se rechaza.");
  if (e.error) partes.push(`Mensaje: «${resolver(e.error, Mensajes)}»`);
  if (e.valor !== undefined) {
    partes.push(Array.isArray(e.valor)
      ? `Devuelve \`[${e.valor.join(", ")}]\``
      : `Devuelve ${Object.entries(e.valor).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(", ")}`);
  }
  if (e.validas !== undefined) partes.push(`Conserva ${e.validas} reserva(s).`);
  if (e.descartadas) {
    partes.push(e.descartadas.length
      ? `Descarta ${e.descartadas.length}: ${e.descartadas.map(k => `«${Mensajes.motivo[k]}»`).join(", ")}`
      : "No descarta nada.");
  }
  if (e.reservas !== undefined && !e.validas) {
    const n = typeof e.reservas === "number" ? e.reservas : e.reservas.length;
    partes.push(`Quedan ${n} reserva(s) guardada(s).`);
  }
  if (e.y) partes.push(e.y.charAt(0).toUpperCase() + e.y.slice(1) + ".");
  return partes.join(" ");
}

// Texto legible de la acción que ejecuta la fila.
function describirCuando(fila) {
  const c = fila.cuando;
  const d = c.datos || {};
  const hora = h => (Number.isInteger(h) ? `${String(h).padStart(2, "0")}:00` : `«${h}»`);
  const cub = id => `cubículo ${Number(String(id).replace(/\D/g, "")) || id}`;
  switch (c.accion) {
    case "validar":
    case "crear": {
      const campos = [
        `nombre ${d.nombre === "" ? "(vacío)" : `«${d.nombre.length > 24 ? d.nombre.slice(0, 21) + "…" : d.nombre}»`}`,
        `${d.personas === "" ? "(sin personas)" : `${d.personas} personas`}`,
        d.inicio === "" ? "(sin hora)" : hora(d.inicio),
        d.duracion === "" ? "(sin duración)" : `${d.duracion} h`,
      ];
      return `${c.accion === "crear" ? "Se confirma" : "Se revisa"} el formulario del ${cub(d.cubiculo) || "cubículo"}: ${campos.join(" · ")}`;
    }
    case "cancelar": return c.id ? `Se cancela el folio ${c.id}` : "Se cancela la reserva";
    case "liberar": return "Se toca «Liberar ahora»";
    case "deshacer": return c.repetir > 1 ? `Se toca «Deshacer» ${c.repetir} veces` : "Se toca «Deshacer»";
    case "iniciosDisponibles": return `Se abre el formulario del ${cub(c.cubiculo)} y se ven las horas que ofrece`;
    case "duracionesPosibles": return `Se elige inicio ${hora(c.inicio)} y se ven las duraciones que ofrece`;
    case "estadoActual": return `Se mira la tarjeta del ${cub(c.cubiculo)}`;
    case "sanear": return "Se carga la página con esos datos en el navegador";
    case "hidratar": return "Se carga la página";
    default: return c.accion;
  }
}

// Texto legible del escenario de partida.
function describirDado(fila) {
  const d = fila.dado || {};
  const partes = [];
  if (d.ahora) partes.push(`Son las ${d.ahora.slice(11)} del lunes ${d.ahora.slice(8, 10)}/${d.ahora.slice(5, 7)}`);
  (d.reservas || []).forEach(r => {
    const de = r.dia === "manana" ? " (de mañana)" : r.dia === "ayer" ? " (de ayer)" : "";
    partes.push(`${r.cubiculo} reservado ${String(r.inicio).padStart(2, "0")}:00–${String(r.inicio + r.duracion).padStart(2, "0")}:00 por «${r.nombre}»${r.mia === false ? " desde otro navegador" : ""}${de}`);
  });
  (d.canceladas || []).forEach(n => partes.push(`la reserva ${n} se acaba de cancelar`));
  if (d.fallaAlGuardar) partes.push("el navegador no deja guardar");
  if (d.sinAlmacenamiento) partes.push("el navegador no tiene almacenamiento");
  if (d.guardado !== undefined) partes.push(`hay datos guardados${Array.isArray(d.guardado) ? " en formato antiguo (arreglo)" : ` en esquema v${d.guardado.version}`}`);
  if (d.guardadoCrudo !== undefined) partes.push("los datos guardados están dañados");
  if (d.guardadoEnClaveAntigua !== undefined) partes.push("los datos están en la clave antigua");
  return partes.join("; ");
}

module.exports = { preparar, ejecutar, verificar, propio, resolver, describirEsperado, describirDado, describirCuando, fechaLocal, OTRO_DISPOSITIVO };
