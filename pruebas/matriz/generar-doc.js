"use strict";
/* T47 · Genera MATRIZ_REGLAS.md a partir de matriz/datos.js.
   El documento y las pruebas salen de la MISMA lista, así que no se despegan.
   Además ejecuta cada fila, de modo que la columna "Estado" dice lo que de
   verdad hace la página hoy, no lo que debería hacer.
   Se corre con:  npm run matriz:doc                                          */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { filas } = require("./datos");
const { porGrupo } = require("./grupos");
const { verificar, describirDado, describirCuando, describirEsperado } = require("./ejecutor");
const { crearApp } = require("./cargar-app");
const { carpetaApp } = require("../ayudas/ruta-app");

const SALIDA = path.join(__dirname, "..", "MATRIZ_REGLAS.md");
const Mensajes = crearApp().Mensajes;

// Corre la fila de verdad para saber si la regla se cumple hoy.
function estadoReal(fila) {
  try {
    verificar({ assert }, fila);
    return fila.defecto ? { icono: "❓", texto: "ya corregida (revisar la nota)" } : { icono: "✅", texto: "se cumple" };
  } catch (e) {
    if (fila.defecto) return { icono: "⚠️", texto: "desviación conocida" };
    return { icono: "❌", texto: `no se cumple — ${String(e.message).split("\n")[0]}` };
  }
}

const celda = s => String(s).replace(/\|/g, "\\|").replace(/\n+/g, " ");

function generar() {
  const grupos = porGrupo(filas);
  const estados = new Map(filas.map(f => [f.id, estadoReal(f)]));
  const cuenta = i => filas.filter(f => estados.get(f.id).icono === i).length;
  const defectos = filas.filter(f => f.defecto);
  const hoy = new Date().toISOString().slice(0, 10);

  const L = [];
  L.push("# Matriz de pruebas de reglas de negocio");
  L.push("");
  L.push("**Reserva de Cubículos · Tecmilenio** — tarea **T47 (E4-60)**");
  L.push("");
  L.push("> Documento generado automáticamente desde `pruebas/matriz/datos.js`.");
  L.push("> No se edita a mano: se cambia la fila en ese archivo y se vuelve a correr `npm run matriz:doc`.");
  L.push("");
  L.push(`Generado el ${hoy} · ${filas.length} casos · ${new Set(filas.map(f => f.regla)).size} reglas distintas`);
  L.push("");
  L.push("## Para qué sirve");
  L.push("");
  L.push("Cada fila de esta matriz es una regla del sistema escrita como un caso concreto:");
  L.push("qué había antes (**Dado**), qué se hace (**Cuando**) y qué tiene que pasar (**Entonces**).");
  L.push("Las mismas filas son las pruebas automatizadas que corren con `npm run matriz`,");
  L.push("así que este documento no puede quedar desactualizado respecto al código:");
  L.push("si una regla cambia y la fila no, la prueba falla.");
  L.push("");
  L.push("Las reglas se prueban contra el código real de `static/Script.js`, cargado en un");
  L.push("entorno aislado con una hora simulada (lunes 16 de noviembre de 2026, zona");
  L.push("`America/Monterrey`), para que los casos de «ya cerró» o «esa hora ya pasó» sean");
  L.push("siempre reproducibles.");
  L.push("");
  L.push("## Resumen");
  L.push("");
  L.push("| Estado | Casos | Qué significa |");
  L.push("| --- | --- | --- |");
  L.push(`| ✅ Se cumple | ${cuenta("✅")} | La página se comporta como dice la regla. |`);
  L.push(`| ⚠️ Desviación conocida | ${cuenta("⚠️")} | La regla está documentada pero el código todavía no la aplica. Ver «Desviaciones conocidas». |`);
  L.push(`| ❌ No se cumple | ${cuenta("❌")} | Falla sin estar documentada: hay que revisarla. |`);
  L.push("");
  L.push("| Grupo de reglas | Casos |");
  L.push("| --- | --- |");
  grupos.forEach(g => L.push(`| [${g.nombre}](#${g.nombre.toLowerCase().replace(/[^a-záéíóúñ0-9 ]/g, "").replace(/ /g, "-")}) | ${g.filas.length} |`));
  L.push("");

  grupos.forEach(g => {
    L.push(`## ${g.nombre}`);
    L.push("");
    L.push("| # | Regla | Dado | Cuando | Entonces | Estado |");
    L.push("| --- | --- | --- | --- | --- | --- |");
    g.filas.forEach(f => {
      const e = estados.get(f.id);
      L.push(`| ${f.id} | ${celda(f.regla)} | ${celda(describirDado(f))} | ${celda(describirCuando(f))} | ${celda(describirEsperado(f, Mensajes))} | ${e.icono} |`);
    });
    L.push("");
  });

  L.push("## Desviaciones conocidas");
  L.push("");
  if (!defectos.length) {
    L.push("Ninguna: todas las reglas de la matriz se cumplen.");
  } else {
    L.push("Casos que la matriz declara como regla deseada pero que el código todavía no aplica.");
    L.push("Quedan marcados como pendientes (`todo`) en las pruebas: se ven en el reporte pero no");
    L.push("tumban la suite, para que no se olviden ni bloqueen el avance.");
    L.push("");
    defectos.forEach(f => {
      const e = estados.get(f.id);
      L.push(`### ${f.id} · ${f.regla}`);
      L.push("");
      L.push(`- **Caso:** ${f.caso}`);
      L.push(`- **Esperado:** ${describirEsperado(f, Mensajes)}`);
      L.push(`- **Estado hoy:** ${e.icono} ${e.texto}`);
      L.push(`- **Detalle:** ${f.defecto}`);
      L.push("");
    });
  }

  L.push("## Cómo correr estas pruebas");
  L.push("");
  L.push("```bash");
  L.push("cd pruebas");
  L.push("npm install        # solo la primera vez");
  L.push("npm run matriz     # corre los casos de esta matriz");
  L.push("npm run matriz:doc # vuelve a generar este documento");
  L.push("```");
  L.push("");
  L.push(`Código probado: \`${path.basename(carpetaApp())}/Script.js\``);
  L.push("");

  fs.writeFileSync(SALIDA, L.join("\n"), "utf8");
  return { ruta: SALIDA, ok: cuenta("✅"), desviaciones: cuenta("⚠️"), fallas: cuenta("❌") };
}

const r = generar();
console.log(`MATRIZ_REGLAS.md generado · ${r.ok} se cumplen · ${r.desviaciones} desviación(es) conocida(s) · ${r.fallas} falla(s) sin documentar`);
if (r.fallas) process.exitCode = 1;
