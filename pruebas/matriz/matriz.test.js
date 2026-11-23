"use strict";
/* T47 · Matriz de pruebas de reglas de negocio (E4-60)
   Una prueba por fila de matriz/datos.js. Se corre con:  npm run matriz      */
const { test, describe } = require("node:test");
const { filas } = require("./datos");
const { porGrupo } = require("./grupos");
const { verificar } = require("./ejecutor");

describe("Matriz de reglas de negocio · reserva de cubículos", () => {
  porGrupo(filas).forEach(grupo => {
    describe(grupo.nombre, () => {
      grupo.filas.forEach(fila => {
        const nombre = `${fila.id} · ${fila.regla} — ${fila.caso}`;
        // Las filas con "defecto" documentan una desviación conocida: se marcan
        // como pendientes para que no tumben la suite, pero siguen a la vista.
        test(nombre, { todo: fila.defecto || false }, t => verificar(t, fila));
      });
    });
  });
});
