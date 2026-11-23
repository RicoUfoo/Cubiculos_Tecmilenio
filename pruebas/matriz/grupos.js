"use strict";
// Agrupa las filas de la matriz por tema, para la prueba y para el documento.
const GRUPOS = [
  { hasta: 12, nombre: "Horario de operación y franjas" },
  { hasta: 20, nombre: "Duración y campos obligatorios" },
  { hasta: 31, nombre: "Aforo y nombre del grupo" },
  { hasta: 33, nombre: "Cubículo" },
  { hasta: 39, nombre: "Choques en el mismo cubículo" },
  { hasta: 43, nombre: "Un grupo, un cubículo a la vez" },
  { hasta: 45, nombre: "Creación de la reserva" },
  { hasta: 51, nombre: "Cancelación" },
  { hasta: 57, nombre: "Liberar antes de tiempo" },
  { hasta: 64, nombre: "Deshacer una cancelación" },
  { hasta: 73, nombre: "Horas y duraciones que se ofrecen" },
  { hasta: 78, nombre: "Estado que muestra el cubículo" },
  { hasta: 96, nombre: "Saneado de los datos guardados" },
  { hasta: 999, nombre: "Esquema guardado y migraciones" },
];

function grupoDe(id) {
  const n = Number(String(id).replace(/\D/g, ""));
  return (GRUPOS.find(g => n <= g.hasta) || GRUPOS[GRUPOS.length - 1]).nombre;
}

// [{ nombre, filas }] en el orden de la matriz
function porGrupo(filas) {
  const orden = [];
  const mapa = new Map();
  filas.forEach(f => {
    const g = grupoDe(f.id);
    if (!mapa.has(g)) { mapa.set(g, []); orden.push(g); }
    mapa.get(g).push(f);
  });
  return orden.map(nombre => ({ nombre, filas: mapa.get(nombre) }));
}

module.exports = { grupoDe, porGrupo };
