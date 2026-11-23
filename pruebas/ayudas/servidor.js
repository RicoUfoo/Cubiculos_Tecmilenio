"use strict";
// Servidor estático mínimo (sin dependencias) para que el navegador abra la
// página igual que en producción: con http://, no con file://.
// Playwright lo levanta y lo apaga solo (ver playwright.config.js).
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { carpetaApp } = require("./ruta-app");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function crearServidor(raiz = carpetaApp()) {
  return http.createServer((pet, res) => {
    const pedido = decodeURIComponent(new URL(pet.url, "http://localhost").pathname);
    const relativo = pedido === "/" ? "index.html" : pedido.replace(/^\/+/, "");
    const archivo = path.resolve(raiz, relativo);
    // No salir de la carpeta de la página.
    if (!archivo.startsWith(path.resolve(raiz))) { res.writeHead(403).end("Prohibido"); return; }
    fs.readFile(archivo, (err, cuerpo) => {
      if (err) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("No encontrado"); return; }
      res.writeHead(200, {
        "content-type": TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-store",
      }).end(cuerpo);
    });
  });
}

if (require.main === module) {
  const puerto = Number(process.env.PUERTO || 4173);
  crearServidor().listen(puerto, "127.0.0.1", () => {
    console.log(`Página servida en http://127.0.0.1:${puerto} desde ${carpetaApp()}`);
  });
}

module.exports = { crearServidor };
