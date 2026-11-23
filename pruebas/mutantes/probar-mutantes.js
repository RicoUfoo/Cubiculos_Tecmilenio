"use strict";
/* ===========================================================================
   ¿Y quién prueba a las pruebas?
   ---------------------------------------------------------------------------
   Una prueba que nunca falla no sirve de nada. Este script rompe el código a
   propósito (un "mutante" = un cambio pequeño y dañino en Script.js) y revisa
   que alguna prueba se dé cuenta. Si un mutante sobrevive, hay un hueco en la
   cobertura.
   Se corre con:  npm run mutantes
   =========================================================================== */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { carpetaApp } = require("../ayudas/ruta-app");

const RAIZ = path.join(__dirname, "..");
const COPIAS = path.join(__dirname, ".copias");

const MUTANTES = [
  { id: "MUT-01", que: "Permitir reservas de 3 horas", de: "MAX_HORAS: 2", a: "MAX_HORAS: 3" },
  { id: "MUT-02", que: "Cerrar la sala a las 21:00", de: "CIERRA: 20", a: "CIERRA: 21" },
  {
    // Ojo: subir Config.MAX_PERSONAS no cambia nada, porque el aforo también está
    // topado por la capacidad de cada cubículo (3). Hay que mutar el cálculo.
    id: "MUT-03", que: "Dejar entrar 4 personas por cubículo",
    de: "aforo(cubiculo) { return Math.min(cubiculo.capacidad, Config.MAX_PERSONAS); }",
    a: "aforo(cubiculo) { return 4; }",
  },
  { id: "MUT-04", que: "Aceptar nombres de una sola letra", de: "MIN_NOMBRE: 2", a: "MIN_NOMBRE: 1" },
  {
    id: "MUT-05", que: "No detectar horarios que se traslapan",
    de: "seTraslapan(ini1, fin1, ini2, fin2) { return ini1 < fin2 && ini2 < fin1; }",
    a: "seTraslapan(ini1, fin1, ini2, fin2) { return false; }",
  },
  {
    id: "MUT-06", que: "Dejar que cualquiera cancele reservas ajenas",
    de: "return !!reserva && !!reserva.dueno && reserva.dueno === this.token();",
    a: "return true;",
  },
  {
    id: "MUT-07", que: "Permitir reservar horas que ya pasaron",
    de: "franjaYaPaso(franja, ahora = new Date()) { return franja.fin <= this.horaDecimal(ahora); }",
    a: "franjaYaPaso(franja, ahora = new Date()) { return false; }",
  },
  {
    id: "MUT-08", que: "No revertir la cancelación si falla el guardado",
    de: `    if (!Almacen.guardarSeguro()) {
      Modelo.reservas = respaldo;
      return { ok: false, error: Mensajes.cancelarFallo() };
    }`,
    a: `    if (!Almacen.guardarSeguro()) {
      return { ok: false, error: Mensajes.cancelarFallo() };
    }`,
  },
  {
    id: "MUT-09", que: "Saltarse el paso de revisar antes de confirmar",
    de: `    if (Object.keys(errores).length) this.mostrar("form", errores);
    else this.mostrar("resumen");`,
    a: `    if (Object.keys(errores).length) this.mostrar("form", errores);
    else this.mostrar("exito");`,
  },
  {
    id: "MUT-10", que: "No preseleccionar la hora al tocar una franja libre",
    de: `if (franja && slot.dataset.estado === "libre") FormReserva.abrir({ inicio: franja.inicio });`,
    a: `if (franja && slot.dataset.estado === "libre") FormReserva.abrir();`,
  },
  {
    // El fragmento lleva la línea de arriba a propósito: sin ella coincidiría
    // primero con Vista.avisar, que es otro aviso.
    id: "MUT-11", que: "No mostrar el aviso para deshacer la cancelación",
    de: `    this.ubicar();
    el.textContent = "";
    el.hidden = false;`,
    a: `    this.ubicar();
    el.textContent = "";
    el.hidden = true;`,
  },
  {
    id: "MUT-12", que: "No mostrar el aviso de confirmación de la reserva",
    de: `    clearTimeout(this._timerAviso);
    el.textContent = "";
    el.hidden = false;`,
    a: `    clearTimeout(this._timerAviso);
    el.textContent = "";
    el.hidden = true;`,
  },
];

function prepararCopia(mut, indice) {
  const origen = carpetaApp();
  const destino = path.join(COPIAS, mut.id, "static");
  fs.rmSync(path.join(COPIAS, mut.id), { recursive: true, force: true });
  fs.mkdirSync(destino, { recursive: true });
  ["Style.css", "index.html"].forEach(f => {
    const desde = path.join(origen, f);
    if (fs.existsSync(desde)) fs.copyFileSync(desde, path.join(destino, f));
  });
  const codigo = fs.readFileSync(path.join(origen, "Script.js"), "utf8");
  // Se normalizan los saltos de línea solo para buscar; se escribe el texto mutado tal cual.
  const buscado = mut.de.replace(/\n/g, "\r\n");
  const usaCRLF = codigo.includes("\r\n") && codigo.includes(buscado);
  const de = usaCRLF ? buscado : mut.de;
  if (!codigo.includes(de)) return { error: "no encontré el fragmento que había que mutar" };
  const a = usaCRLF ? mut.a.replace(/\n/g, "\r\n") : mut.a;
  fs.writeFileSync(path.join(destino, "Script.js"), codigo.replace(de, a));
  return { destino };
}

function corre(comando, args, env) {
  try {
    execFileSync(comando, args, { cwd: RAIZ, env: { ...process.env, ...env }, stdio: "ignore" });
    return true;   // pasó: el mutante NO fue detectado por esta suite
  } catch (e) {
    return false;  // falló: la suite detectó el mutante
  }
}

function probar(mut, indice) {
  const copia = prepararCopia(mut, indice);
  if (copia.error) return { ...mut, detectado: false, por: copia.error };
  const APP_DIR = path.relative(RAIZ, copia.destino);

  if (!corre("node", ["--test", "matriz/matriz.test.js"], { APP_DIR })) {
    return { ...mut, detectado: true, por: "matriz de reglas (T47)" };
  }
  const PUERTO = String(4300 + indice);
  if (!corre("npx", ["playwright", "test", "--max-failures=1"], { APP_DIR, PUERTO })) {
    return { ...mut, detectado: true, por: "flujo en navegador (T46)" };
  }
  return { ...mut, detectado: false, por: "ninguna prueba falló" };
}

console.log(`Probando ${MUTANTES.length} mutantes contra la página de ${carpetaApp()}\n`);
const resultados = MUTANTES.map((m, i) => {
  process.stdout.write(`${m.id} · ${m.que} … `);
  const r = probar(m, i);
  console.log(r.detectado ? `detectado por ${r.por}` : `SOBREVIVIÓ (${r.por})`);
  return r;
});
fs.rmSync(COPIAS, { recursive: true, force: true });

const sobrevivientes = resultados.filter(r => !r.detectado);
console.log(`\n${resultados.length - sobrevivientes.length} de ${resultados.length} mutantes detectados.`);
if (sobrevivientes.length) {
  console.log("Mutantes que nadie detectó (hay un hueco en las pruebas):");
  sobrevivientes.forEach(r => console.log(`  · ${r.id} ${r.que} — ${r.por}`));
  process.exitCode = 1;
} else {
  console.log("Ninguna falla pasó desapercibida.");
}
