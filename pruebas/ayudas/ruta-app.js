"use strict";
// Dónde está la página que se va a probar (Script.js, Style.css, index.html).
// Orden de búsqueda:
//   1. la variable de entorno APP_DIR (para probar otra copia: APP_DIR=../otra-carpeta npm test)
//   2. ../static   (donde está en el repositorio: static/Script.js)
//   3. ..          (si los tres archivos están en la raíz del repositorio)
const fs = require("fs");
const path = require("path");

function carpetaApp() {
  const candidatas = [
    process.env.APP_DIR && path.resolve(process.env.APP_DIR),
    path.resolve(__dirname, "..", "..", "static"),
    path.resolve(__dirname, "..", ".."),
  ].filter(Boolean);
  for (const c of candidatas) {
    if (fs.existsSync(path.join(c, "Script.js")) && fs.existsSync(path.join(c, "index.html"))) return c;
  }
  throw new Error(
    "No encontré Script.js e index.html. Busqué en:\n  " + candidatas.join("\n  ") +
    "\nIndica la carpeta con APP_DIR (ej. APP_DIR=../static)."
  );
}

module.exports = { carpetaApp };
