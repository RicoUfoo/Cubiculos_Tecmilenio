/* =====================================================================================
   MAPA EXPLORABLE · Sala de estudio
   -------------------------------------------------------------------------------------
   Archivo único y sin dependencias. Muestra una sala (basada en fotos reales) en vista
   isométrica 3D o en planta 2D, donde te desplazas con un avatar configurable y puedes
   reservar mesas, bancas y cuartos.

   CÓMO REUTILIZARLO EN OTRO PROYECTO
     1. Copia todo el contenido del <script> a un archivo .js (o deja este HTML tal cual).
     2. Incluye un contenedor con altura:   <div id="app" style="height:100vh"></div>
     3. Llama:   const mapa = EspacioExplorable.montar(document.getElementById("app"), { ...opciones });
     4. El plano se define como DATOS en MUNDO_TECMILENIO (cuartos, mesas, bancas, decoración).
        Pasa tu propio objeto con { mundo: miMundo } para cambiar el espacio sin tocar el motor.

   OPCIONES (todas opcionales)
     titulo, subtitulo, zona ("America/Monterrey"), locale ("es-MX"), abre (8), cierra (20),
     maxHoras (2), ejemplos (true: ocupación de ejemplo), claveReservas / claveAvatar / claveVista
     (claves de localStorage), mundo, ahora (función que devuelve un Date).

   PARÁMETRO DE URL PARA PROBAR EL HORARIO
     ?hora=14:30   simula que son las 14:30 (el reloj sigue corriendo desde ahí).

   API DEVUELTA POR montar():
     abrir(id), cerrarPanel(), irA(id), estado(id), reservar({espacio,nombre,personas,inicio,duracion}),
     cancelar(id), reservas(), jugador(), vista("iso"|"2d"), destruir()
   ===================================================================================== */
(function (global) {
"use strict";

/* ===================================================================================
   1. CONFIGURACIÓN POR DEFECTO
   =================================================================================== */
const BASE = {
  titulo: "Sala de estudio",
  subtitulo: "Explora el espacio y aparta tu lugar",
  zona: "America/Monterrey",
  locale: "es-MX",
  abre: 8,
  cierra: 20,
  maxHoras: 2,
  ejemplos: true,
  claveReservas: "espacio.reservas.v1",
  claveAvatar: "espacio.avatar.v1",
  claveVista: "espacio.vista.v1",
  claveEjemplos: "espacio.ejemplos.v1",
  claveDispositivo: "espacio.dispositivo.v1",
  ahora: null,
  mundo: null,
};

/* ===================================================================================
   2. MUNDO (datos). Unidades: 1 = 1 metro aprox. x crece a la derecha, y hacia el frente.
   =================================================================================== */
const MUNDO_TECMILENIO = {
  ancho: 32,
  alto: 22,
  inicio: { x: 16, y: 19.6 },

  // Cuartos cerrados (puertas hacia el lobby, junto a la pared norte)
  cuartos: [
    { id: "cuarto-1001", nombre: "Sala 1001", detalle: "Sala grande con mampara plegable", capacidad: 10,
      x0: 0, y0: 0, x1: 10, y1: 6, puerta: { x: 4.2, ancho: 1.6 }, frente: "particion", numero: "1001",
      muebles: [{ t: "mesaLarga", x: 2.4, y: 2.2, w: 5.2, d: 1.2, porLado: 4, sillas: "#2f7d57" },
                { t: "planta", x: 0.8, y: 5.2, s: 1.1 }] },
    { id: "cuarto-1002", nombre: "Sala 1002", detalle: "Sala con puertas de cristal", capacidad: 6,
      x0: 10, y0: 0, x1: 16, y1: 6, puerta: { x: 12.2, ancho: 1.8 }, frente: "vidrio", numero: "1002",
      muebles: [{ t: "mesaRedonda", x: 13.4, y: 2.8, r: 0.72, sillas: "#2f7aa8" }] },
    { id: "cuarto-colab", nombre: "Colaboración", detalle: "Sala de trabajo en equipo con pizarrón", capacidad: 8,
      x0: 16, y0: 0, x1: 23, y1: 6, puerta: { x: 19.0, ancho: 1.7 }, frente: "vidrio", numero: "",
      muebles: [{ t: "pizarra", x: 16.5, y: 0.1, w: 1.7 },
                { t: "mesaRedonda", x: 17.9, y: 3.3, r: 0.62, sillas: "#e7d9b0" },
                { t: "mesaRedonda", x: 21.6, y: 3.2, r: 0.62, sillas: "#f4f4f1" }] },
    { id: "cuarto-gym", nombre: "Sala Gimnasio", detalle: "Sala con cristal esmerilado", capacidad: 10,
      x0: 23, y0: 0, x1: 32, y1: 6, puerta: { x: 26.0, ancho: 1.8 }, frente: "escarchado", numero: "",
      muebles: [{ t: "mesaLarga", x: 25.2, y: 2.4, w: 4.4, d: 1.2, porLado: 3, sillas: "#3f6fb0" },
                { t: "planta", x: 31.0, y: 5.2, s: 1 }] },
  ],

  // Mesas (reservables)
  mesas: [
    { id: "mesa-01", nombre: "Mesa 1", detalle: "Redonda con sillones verdes", x: 8.5, y: 17.5, capacidad: 4, variante: "redonda", sillas: "#2f7d57" },
    { id: "mesa-02", nombre: "Mesa 2", detalle: "Redonda con sillones azules", x: 13.2, y: 19.4, capacidad: 4, variante: "redonda", sillas: "#3f6fa0" },
    { id: "mesa-03", nombre: "Mesa 3", detalle: "Mesa alta con banquillos amarillos", x: 12.4, y: 9.6, capacidad: 4, variante: "alta", sillas: "#e3b719" },
    { id: "mesa-04", nombre: "Mesa 4", detalle: "Mesa alta con banquillos grises", x: 20.0, y: 15.6, capacidad: 4, variante: "alta", sillas: "#8b9096" },
    { id: "mesa-05", nombre: "Mesa 5", detalle: "Redonda con sillas blancas", x: 21.6, y: 10.2, capacidad: 4, variante: "redonda", sillas: "#f1f1ee" },
    { id: "mesa-06", nombre: "Mesa 6", detalle: "Redonda con sillones verde y azul", x: 26.0, y: 18.6, capacidad: 4, variante: "redonda", sillas: ["#2f7d57", "#3f6fa0", "#2f7d57", "#3f6fa0"] },
  ],

  // Bancas: sofás y zonas de puffs
  bancas: [
    { id: "banca-01", nombre: "Banca 1", detalle: "Sofá gris verdoso junto a la entrada de salas", variante: "sofa", x: 6.8, y: 7.4, w: 2.8, capacidad: 3, color: "#7d8b78" },
    { id: "banca-02", nombre: "Banca 2", detalle: "Zona de puffs amarillo y verde", variante: "puffs", x: 16.2, y: 12.2, capacidad: 3, colores: ["#e8d230", "#8fd12e", "#3d4146"] },
    { id: "banca-03", nombre: "Banca 3", detalle: "Zona de puffs azules con tapete", variante: "puffs", x: 26.6, y: 11.2, capacidad: 3, colores: ["#1f8bdc", "#1f8bdc", "#3d4146"], tapete: "#c9ad7c" },
    { id: "banca-04", nombre: "Banca 4", detalle: "Zona de puffs grises y verdes", variante: "puffs", x: 29.0, y: 15.4, capacidad: 3, colores: ["#4a4e53", "#8fd12e", "#4a4e53"] },
  ],

  // Decoración sin reserva
  decoracion: [
    { t: "escaleras", x: 0.3, y: 8.2, w: 3.4, d: 6.0 },
    { t: "mesaBaja", x: 4.5, y: 8.3, r: 0.36, planta: true },
    { t: "mesaBaja", x: 10.2, y: 8.0, r: 0.3, planta: true },
    { t: "planta", x: 10.9, y: 7.3, s: 1.2 },
    { t: "planta", x: 4.4, y: 15.2, s: 1.4 },
    { t: "planta", x: 31.0, y: 8.0, s: 1.3 },
    { t: "planta", x: 31.0, y: 20.6, s: 1.2 },
    { t: "planta", x: 1.0, y: 21.2, s: 1.0 },
    { t: "celosia", x: 14.6, y: 7.1, w: 2.5 },
    { t: "celosia", x: 21.2, y: 7.1, w: 2.5 },
    { t: "mesaBaja", x: 18.2, y: 13.6, r: 0.3 },
    { t: "mural", y0: 15.0, y1: 21.2 },
    { t: "tapete", x: 16.2, y: 12.2, r: 1.9, color: "#cfc3a4", solo2d: false },
    { t: "extintor", x: 31.2, y: 6.6 },
  ],
};

/* ===================================================================================
   3. UTILIDADES
   =================================================================================== */
const TW = 64, TH = 32, ZH = 30, S2 = 40, RAIZ2 = Math.SQRT2, TAU = Math.PI * 2;

const cacheTono = new Map();
function tono(hex, f) {
  const k = hex + "|" + f;
  if (cacheTono.has(k)) return cacheTono.get(k);
  let r, g, b;                                   // acepta "#rrggbb" y también "rgb(r,g,b)" (resultado de otro tono)
  if (hex[0] === "#") { const n = parseInt(hex.slice(1), 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
  else { [r, g, b] = hex.match(/\d+/g).map(Number); }
  const m = c => Math.round(f < 1 ? c * f : c + (255 - c) * (f - 1));
  const out = `rgb(${m(r)},${m(g)},${m(b)})`;
  cacheTono.set(k, out);
  return out;
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function azar(semilla) {
  let t = semilla >>> 0;
  return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const hh = h => String(h).padStart(2, "0") + ":00";
const acotar = (v, a, b) => Math.max(a, Math.min(b, v));
function leer(clave, defecto) { try { const t = localStorage.getItem(clave); return t === null ? defecto : JSON.parse(t); } catch (e) { return defecto; } }
function escribir(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch (e) { return false; } }
function rr(g, x, y, w, h, r, col) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); g.fillStyle = col; g.fill(); }

/* ===================================================================================
   4. AVATAR (dibujo chibi en pantalla; se usa en el mundo, en sillas y en la vista previa)
   =================================================================================== */
const PIEL = ["#f6d5b8", "#e8b48a", "#d29a6a", "#b87a4b", "#8a5632", "#5c3a21"];
const PELO = ["#1b1410", "#3b2a1f", "#6b4a2f", "#b07a3c", "#d9b25c", "#c0392b", "#8e8e93", "#5b6cff"];
const ROPA = ["#2e8b57", "#1f8bdc", "#e8b730", "#d9534f", "#7e57c2", "#ec6fa5", "#2b2f33", "#f3f3f0"];
const PANT = ["#2f3e5c", "#2b2f33", "#6b6f76", "#7a5a3a", "#1f6f54", "#c7b99a"];
const PEINADOS = [["corto", "Corto"], ["largo", "Largo"], ["rizado", "Rizado"], ["cola", "Coleta"], ["rapado", "Rapado"]];
const ACCESORIOS = [["ninguno", "Ninguno"], ["lentes", "Lentes"], ["gorra", "Gorra"], ["audifonos", "Audífonos"]];
const AVATAR_BASE = { nombre: "Tú", piel: PIEL[1], pelo: PELO[1], peinado: "corto", ropa: ROPA[0], pantalon: PANT[0], accesorio: "ninguno", mochila: true };

function sanearAvatar(a) {
  const ok = (v, lista) => lista.includes(v);
  const color = (v, def) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : def);
  a = a && typeof a === "object" ? a : {};
  return {
    nombre: String(a.nombre ?? AVATAR_BASE.nombre).trim().slice(0, 16) || AVATAR_BASE.nombre,
    piel: color(a.piel, AVATAR_BASE.piel), pelo: color(a.pelo, AVATAR_BASE.pelo),
    peinado: ok(a.peinado, PEINADOS.map(p => p[0])) ? a.peinado : AVATAR_BASE.peinado,
    ropa: color(a.ropa, AVATAR_BASE.ropa), pantalon: color(a.pantalon, AVATAR_BASE.pantalon),
    accesorio: ok(a.accesorio, ACCESORIOS.map(p => p[0])) ? a.accesorio : AVATAR_BASE.accesorio,
    mochila: a.mochila !== false,
  };
}
function avatarAleatorio(sem) {
  const r = azar(sem), pick = l => l[Math.floor(r() * l.length)];
  return { nombre: "", piel: pick(PIEL), pelo: pick(PELO.slice(0, 6)), peinado: pick(PEINADOS)[0], ropa: pick(ROPA), pantalon: pick(PANT),
           accesorio: r() < 0.3 ? pick(ACCESORIOS)[0] : "ninguno", mochila: r() < 0.5 };
}

// o: { x, y (pies, en px), dir: "down|up|left|right", paso, mov, sentado, esc }
function dibujarAvatar(g, ap, o) {
  const dir = o.dir || "down", sent = !!o.sentado;
  const sw = o.mov ? Math.sin(o.paso) * 3.4 : 0;
  g.save(); g.translate(o.x, o.y); g.scale(o.esc || 1, o.esc || 1);
  g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.ellipse(0, 0, 11, 4.5, 0, 0, TAU); g.fill();

  const pierna = sent ? 5 : 13, cad = -pierna, torsoH = 17, top = cad - torsoH;
  const lado = dir === "left" || dir === "right";
  const sgn = dir === "left" ? -1 : 1;
  const mochCol = "#3b3f46";

  // Mochila detrás del torso (de frente o de lado)
  if (ap.mochila && dir === "down") rr(g, -9.5, top + 2, 19, 14, 4, mochCol);
  if (ap.mochila && lado) rr(g, sgn > 0 ? -10 : 4, top + 2, 6, 13, 3, mochCol);

  // Piernas
  if (sent) {
    rr(g, -7, cad, 14, 6, 3, ap.pantalon);
    rr(g, -7.5, -3, 6, 3.4, 1.6, "#202225"); rr(g, 1.5, -3, 6, 3.4, 1.6, "#202225");
  } else if (lado) {
    rr(g, -2.5 - sw * 0.6, cad, 5, pierna - 2, 2, ap.pantalon);
    rr(g, -2.5 + sw * 0.6, cad, 5, pierna - 2, 2, tono(ap.pantalon, 0.8));
    rr(g, -3 - sw * 0.6 + (sgn > 0 ? 1 : -1), -3.4, 6, 3.4, 1.6, "#202225");
    rr(g, -3 + sw * 0.6 + (sgn > 0 ? 1 : -1), -3.4, 6, 3.4, 1.6, "#202225");
  } else {
    rr(g, -6.2, cad, 4.8, pierna - 2 + (sw > 0 ? -sw * 0.5 : 0), 2, ap.pantalon);
    rr(g, 1.4, cad, 4.8, pierna - 2 + (sw < 0 ? sw * 0.5 : 0), 2, ap.pantalon);
    rr(g, -6.7, -3.4 + (sw > 0 ? -sw * 0.5 : 0), 5.6, 3.4, 1.6, "#202225");
    rr(g, 1.1, -3.4 + (sw < 0 ? sw * 0.5 : 0), 5.6, 3.4, 1.6, "#202225");
  }

  // Torso y brazos
  rr(g, -8, top, 16, torsoH + 1, 5, ap.ropa);
  g.fillStyle = "rgba(0,0,0,.10)"; g.fillRect(1, top + 3, 7, torsoH - 4);
  if (lado) {
    rr(g, -2.2 + sw * 0.5, top + 2, 4.4, 12, 2.2, tono(ap.ropa, 0.88));
    g.beginPath(); g.arc(sw * 0.5, top + 14.5, 2, 0, TAU); g.fillStyle = ap.piel; g.fill();
  } else {
    const ay = sent ? 0 : sw * 0.45;
    rr(g, -11.4, top + 2 + ay, 3.8, 12, 2, tono(ap.ropa, 0.9));
    rr(g, 7.6, top + 2 - ay, 3.8, 12, 2, tono(ap.ropa, 0.9));
    g.fillStyle = ap.piel;
    g.beginPath(); g.arc(-9.5, top + 14.4 + ay, 2, 0, TAU); g.fill();
    g.beginPath(); g.arc(9.5, top + 14.4 - ay, 2, 0, TAU); g.fill();
  }
  if (ap.mochila && dir === "up") rr(g, -7.5, top + 3, 15, 13, 4, mochCol);

  // Cabeza
  const cy = top - 8.2, R = 9;
  const peinado = ap.peinado;
  if (peinado === "largo") rr(g, -10, cy - 1, 20, 17, 7, ap.pelo);
  if (peinado === "cola") {
    const px = dir === "left" ? 10 : dir === "right" ? -10 : (dir === "up" ? 0 : 9);
    g.beginPath(); g.ellipse(px, cy + (dir === "up" ? 6 : 4), 3.4, 6.5, 0, 0, TAU); g.fillStyle = ap.pelo; g.fill();
  }
  g.beginPath(); g.arc(0, cy, R, 0, TAU); g.fillStyle = ap.piel; g.fill();
  g.fillStyle = "rgba(0,0,0,.07)"; g.beginPath(); g.arc(0, cy, R, -0.6, 1.5); g.lineTo(0, cy); g.fill();

  // Pelo (parte superior)
  const pelo = () => {
    if (peinado === "rapado") {
      g.beginPath(); g.arc(0, cy, R + 0.1, Math.PI * 1.08, Math.PI * 1.92); g.closePath(); g.fillStyle = tono(ap.pelo, 0.9); g.fill();
      if (dir === "up") { g.beginPath(); g.arc(0, cy, R + 0.1, 0, TAU); g.fill(); }
      return;
    }
    if (peinado === "rizado") {
      g.fillStyle = ap.pelo;
      for (const [x, y, r] of [[-7, -3, 4.8], [-3.5, -7.5, 5], [3.5, -7.5, 5], [7, -3, 4.8], [0, -9.5, 4.6]]) { g.beginPath(); g.arc(x, cy + y, r, 0, TAU); g.fill(); }
      if (dir === "up") { g.beginPath(); g.arc(0, cy, R + 1.5, 0, TAU); g.fill(); }
      return;
    }
    g.fillStyle = ap.pelo;
    g.beginPath(); g.arc(0, cy, R + 0.8, Math.PI, TAU); g.closePath(); g.fill();
    if (dir === "down") { g.beginPath(); g.ellipse(0, cy - 2.4, R + 0.3, 3.4, 0, 0, Math.PI); g.fill(); }
    if (lado) { g.beginPath(); g.arc(-sgn * 2.5, cy - 0.5, R, 0, TAU); g.fill(); g.beginPath(); g.ellipse(sgn * 2, cy - 4, 7.6, 4, 0, 0, TAU); g.fill(); }
    if (dir === "up") { g.beginPath(); g.arc(0, cy, R + 0.8, 0, TAU); g.fill(); }
  };
  // Cara
  const cara = () => {
    const ojo = "#1d1d1f";
    if (dir === "down") {
      g.fillStyle = ojo; g.beginPath(); g.arc(-3.4, cy + 1.6, 1.4, 0, TAU); g.arc(3.4, cy + 1.6, 1.4, 0, TAU); g.fill();
      g.strokeStyle = "#8a4a3a"; g.lineWidth = 1.1; g.beginPath(); g.arc(0, cy + 4.2, 2.2, 0.2, Math.PI - 0.2); g.stroke();
    } else if (lado) {
      g.fillStyle = ojo; g.beginPath(); g.arc(sgn * 4.4, cy + 1.6, 1.4, 0, TAU); g.fill();
      g.fillStyle = tono(ap.piel, 0.88); g.beginPath(); g.arc(sgn * 9, cy + 2.6, 1.7, 0, TAU); g.fill();
    }
  };
  // Pelo detrás de la cara si el personaje mira de lado o hacia abajo; sobre la cara si mira hacia arriba
  if (dir === "up") { cara(); pelo(); } else { pelo(); cara(); }

  // Accesorios
  if (ap.accesorio === "lentes" && dir !== "up") {
    g.strokeStyle = "#1d1d1f"; g.lineWidth = 1.2;
    if (dir === "down") { g.beginPath(); g.arc(-3.4, cy + 1.6, 2.9, 0, TAU); g.moveTo(6.3, cy + 1.6); g.arc(3.4, cy + 1.6, 2.9, 0, TAU); g.moveTo(-0.5, cy + 1.4); g.lineTo(0.5, cy + 1.4); g.stroke(); }
    else { g.beginPath(); g.arc(sgn * 4.4, cy + 1.6, 3, 0, TAU); g.moveTo(sgn * 1.4, cy + 1.2); g.lineTo(-sgn * 8, cy + 0.4); g.stroke(); }
  }
  if (ap.accesorio === "gorra") {
    const gc = tono(ap.ropa, 0.62);
    g.fillStyle = gc; g.beginPath(); g.arc(0, cy - 0.8, R + 1.2, Math.PI, TAU); g.closePath(); g.fill();
    if (dir === "down") rr(g, -R - 1, cy - 3, 2 * R + 2, 3.4, 1.6, tono(ap.ropa, 0.48));
    if (lado) rr(g, sgn > 0 ? 2 : -14, cy - 3, 12, 3.2, 1.6, tono(ap.ropa, 0.48));
  }
  if (ap.accesorio === "audifonos") {
    g.strokeStyle = "#25282c"; g.lineWidth = 2.2; g.beginPath(); g.arc(0, cy - 0.5, R + 1.4, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
    g.fillStyle = "#25282c";
    if (lado) { g.beginPath(); g.arc(0, cy + 1.5, 3.4, 0, TAU); g.fill(); }
    else { g.beginPath(); g.arc(-R - 1.2, cy + 1.5, 3.2, 0, TAU); g.arc(R + 1.2, cy + 1.5, 3.2, 0, TAU); g.fill(); }
  }
  g.restore();
}

/* ===================================================================================
   5. MONTAJE
   =================================================================================== */
function montar(raiz, opciones = {}) {
  const cfg = Object.assign({}, BASE, opciones);
  const mundo = cfg.mundo || MUNDO_TECMILENIO;
  const W = mundo.ancho, H = mundo.alto;
  const ac = new AbortController();           // para quitar todos los listeners al destruir
  const sig = { signal: ac.signal };

  /* ---------- 5.1 Reloj ---------- */
  let desfase = 0;
  (function leerHoraUrl() {
    try {
      const m = /[?&]hora=(\d{1,2}):(\d{2})/.exec(location.search);
      if (!m) return;
      const partes = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: cfg.zona }).formatToParts(new Date());
      const act = Number(partes.find(p => p.type === "hour").value) * 60 + Number(partes.find(p => p.type === "minute").value);
      desfase = (Number(m[1]) * 60 + Number(m[2]) - act) * 60000;
    } catch (e) {}
  })();
  const ahoraFn = () => (cfg.ahora ? cfg.ahora() : new Date(Date.now() + desfase));
  const fmtHM = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: cfg.zona });
  const fmtISO = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: cfg.zona });
  const fmtReloj = new Intl.DateTimeFormat(cfg.locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: cfg.zona });
  const fmtFecha = new Intl.DateTimeFormat(cfg.locale, { weekday: "long", day: "numeric", month: "long", timeZone: cfg.zona });
  const horaDec = (d = ahoraFn()) => { const p = fmtHM.formatToParts(d); const v = t => Number(p.find(x => x.type === t).value); return v("hour") + v("minute") / 60; };
  const hoyISO = (d = ahoraFn()) => fmtISO.format(d);

  /* ---------- 5.2 Espacios (derivados del mundo) ---------- */
  const espacios = [
    ...mundo.mesas.map(m => ({ ...m, tipo: "mesa" })),
    ...mundo.bancas.map(b => ({ ...b, tipo: "banca" })),
    ...mundo.cuartos.map(q => ({ ...q, tipo: "cuarto" })),
  ];
  const porId = id => espacios.find(e => e.id === id);
  const TIPO_TXT = { mesa: "Mesa", banca: "Banca", cuarto: "Cuarto" };

  /* ---------- 5.3 Reservas ---------- */
  const dueno = (() => { let t = leer(cfg.claveDispositivo, null); if (!t || !/^[\w-]{8,64}$/.test(t)) { t = (crypto.randomUUID ? crypto.randomUUID() : "d-" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36)); escribir(cfg.claveDispositivo, t); } return t; })();
  let propias = [];                 // reservas guardadas (persisten)
  let ultimoId = 0;
  let ejemplosOn = cfg.ejemplos && leer(cfg.claveEjemplos, true) !== false;

  function sanearReservas(lista) {
    const hoy = hoyISO(), salida = [];
    if (!Array.isArray(lista)) return salida;
    for (const r of lista) {
      if (!r || typeof r !== "object" || !porId(r.espacio) || typeof r.fecha !== "string" || r.fecha < hoy) continue;
      const e = porId(r.espacio);
      const ini = Number(r.inicio), dur = Number(r.duracion), per = Number(r.personas);
      const nom = typeof r.nombre === "string" ? r.nombre.trim().slice(0, 40) : "";
      if (!Number.isInteger(ini) || ini < cfg.abre || ini >= cfg.cierra) continue;
      if (!Number.isInteger(dur) || dur < 1 || dur > cfg.maxHoras || ini + dur > cfg.cierra) continue;
      if (nom.length < 2 || !Number.isInteger(per) || per < 1 || per > e.capacidad) continue;
      if (salida.some(o => o.espacio === r.espacio && o.fecha === r.fecha && ini < o.inicio + o.duracion && o.inicio < ini + dur)) continue;
      salida.push({ id: String(r.id || ""), espacio: r.espacio, fecha: r.fecha, inicio: ini, duracion: dur, nombre: nom, personas: per, dueno: typeof r.dueno === "string" ? r.dueno : "" });
    }
    return salida;
  }
  (function cargar() {
    const datos = leer(cfg.claveReservas, null);
    if (datos && typeof datos === "object") {
      propias = sanearReservas(datos.reservas);
      ultimoId = Number(datos.ultimoId) || 0;
      propias.forEach(r => { if (!/^res-\d+$/.test(r.id)) r.id = "res-" + String(++ultimoId).padStart(3, "0"); });
      ultimoId = Math.max(ultimoId, ...propias.map(r => Number(r.id.slice(4))), 0);
    }
  })();
  const guardar = () => escribir(cfg.claveReservas, { version: 1, ultimoId, reservas: propias });

  // Ocupación de ejemplo, determinista por día (no se guarda)
  function reservasEjemplo() {
    if (!ejemplosOn) return [];
    const hoy = hoyISO(), r = azar(hash(hoy)), nombres = ["Equipo Alfa", "Los Cuates", "Proyecto Final", "Estudio BD", "Algoritmos", "Mesa de Scrum", "Tutoría", "Repaso"];
    const lista = [];
    espacios.forEach((e, i) => {
      let h = cfg.abre + Math.floor(r() * 3);
      while (h < cfg.cierra - 1) {
        if (r() < 0.55) {
          const dur = 1 + Math.floor(r() * Math.min(2, cfg.maxHoras));
          if (h + dur <= cfg.cierra) lista.push({ id: `ej-${i}-${h}`, espacio: e.id, fecha: hoy, inicio: h, duracion: dur, nombre: nombres[Math.floor(r() * nombres.length)], personas: 1 + Math.floor(r() * e.capacidad), dueno: "ejemplo", ejemplo: true });
          h += dur;
        }
        h += 1 + Math.floor(r() * 3);
      }
    });
    return lista;
  }
  let todas = [];
  const recalcular = () => { todas = [...propias, ...reservasEjemplo()]; };
  recalcular();

  const bloqueEn = (id, hora, fecha) => todas.find(r => r.espacio === id && r.fecha === fecha && hora >= r.inicio && hora < r.inicio + r.duracion);
  function estadoDe(id, ahora = ahoraFn()) {
    const h = horaDec(ahora), f = hoyISO(ahora);
    if (h < cfg.abre) return { e: "cerrado", txt: `Cerrado · abre a las ${hh(cfg.abre)}`, corto: "Cerrado" };
    if (h >= cfg.cierra) return { e: "cerrado", txt: `Cerrado · abre mañana a las ${hh(cfg.abre)}`, corto: "Cerrado" };
    const hi = Math.floor(h), oc = bloqueEn(id, hi, f);
    if (oc) {
      let fin = oc.inicio + oc.duracion, o2;
      while ((o2 = bloqueEn(id, fin, f))) fin = o2.inicio + o2.duracion;
      return { e: "ocupado", txt: `Ocupado hasta las ${hh(fin)}`, corto: "Ocupado", hasta: fin, reserva: oc };
    }
    let k = hi + 1; while (k < cfg.cierra && !bloqueEn(id, k, f)) k++;
    return { e: "libre", txt: k >= cfg.cierra ? `Libre hasta el cierre (${hh(cfg.cierra)})` : `Libre hasta las ${hh(k)}`, corto: "Libre", hasta: k };
  }
  function agendaDe(id, fecha = hoyISO()) {
    const a = [];
    for (let h = cfg.abre; h < cfg.cierra; h++) {
      const r = bloqueEn(id, h, fecha) || null, u = a[a.length - 1];
      if (u && u.reserva === r && u.fin === h) u.fin = h + 1;
      else a.push({ tipo: r ? "ocupado" : "libre", inicio: h, fin: h + 1, reserva: r });
    }
    return a;
  }
  const iniciosDisponibles = (id, ahora = ahoraFn()) => {
    const f = hoyISO(ahora), h = horaDec(ahora), l = [];
    for (let i = cfg.abre; i < cfg.cierra; i++) if (i + 1 > h && !bloqueEn(id, i, f)) l.push(i);
    return l;
  };
  const duracionesPosibles = (id, inicio, ahora = ahoraFn()) => {
    const f = hoyISO(ahora), l = [];
    for (let n = 1; n <= cfg.maxHoras; n++) { const k = inicio + n - 1; if (k >= cfg.cierra || bloqueEn(id, k, f)) break; l.push(n); }
    return l;
  };
  const describir = r => `${porId(r.espacio)?.nombre ?? r.espacio} de ${hh(r.inicio)} a ${hh(r.inicio + r.duracion)}`;
  const yaTermino = (r, ahora = ahoraFn()) => r.fecha < hoyISO(ahora) || (r.fecha === hoyISO(ahora) && r.inicio + r.duracion <= horaDec(ahora));

  function validar(d, ahora = ahoraFn()) {
    const err = {}, e = porId(d.espacio);
    if (!e) return { espacio: "Elige un espacio válido." };
    const nombre = String(d.nombre ?? "").trim();
    if (!nombre) err.nombre = "Escribe el nombre del grupo o del responsable.";
    else if (nombre.length < 2) err.nombre = "Escribe al menos 2 caracteres.";
    const per = Number(d.personas);
    if (d.personas === "" || d.personas == null) err.personas = "Indica cuántas personas van a usar el espacio.";
    else if (!Number.isInteger(per) || per < 1) err.personas = "Escribe un número entero, de 1 en adelante.";
    else if (per > e.capacidad) err.personas = `Este espacio admite hasta ${e.capacidad} personas.`;
    const h = horaDec(ahora), f = hoyISO(ahora);
    if (d.inicio === "" || d.inicio == null) { err.inicio = h >= cfg.cierra ? `Ya cerró por hoy (${hh(cfg.abre)} – ${hh(cfg.cierra)}).` : "Elige la hora de inicio."; return err; }
    const ini = Number(d.inicio);
    if (h >= cfg.cierra) { err.inicio = `Ya cerró por hoy (${hh(cfg.abre)} – ${hh(cfg.cierra)}).`; return err; }
    if (!Number.isInteger(ini) || ini < cfg.abre || ini >= cfg.cierra) { err.inicio = `Solo se puede reservar de ${hh(cfg.abre)} a ${hh(cfg.cierra)}.`; return err; }
    if (ini + 1 <= h) { err.inicio = "Esa hora ya pasó. Elige una a partir de ahora."; return err; }
    if (d.duracion === "" || d.duracion == null) { err.duracion = "Elige la duración."; return err; }
    const dur = Number(d.duracion);
    if (!Number.isInteger(dur) || dur < 1) { err.duracion = "Elige una duración válida."; return err; }
    if (dur > cfg.maxHoras) { err.duracion = `Cada reserva puede durar como máximo ${cfg.maxHoras} horas.`; return err; }
    if (ini + dur > cfg.cierra) { err.duracion = `Terminaría a las ${hh(ini + dur)}, después del cierre (${hh(cfg.cierra)}).`; return err; }
    const choca = todas.filter(r => r.fecha === f && ini < r.inicio + r.duracion && r.inicio < ini + dur);
    const mismo = choca.filter(r => r.espacio === e.id);
    if (mismo.length) { err[mismo.some(r => ini >= r.inicio && ini < r.inicio + r.duracion) ? "inicio" : "duracion"] = `Choca con otra reserva: ${mismo.map(describir).join(" y ")}.`; return err; }
    const grupo = nombre.toLocaleLowerCase(cfg.locale);
    const otro = choca.filter(r => r.espacio !== e.id && r.nombre.toLocaleLowerCase(cfg.locale) === grupo);
    if (otro.length && !err.nombre) err.inicio = `"${nombre}" ya tiene reservado ${otro.map(describir).join(" y ")}. Un grupo no puede estar en dos lugares a la vez.`;
    return err;
  }
  function crearReserva(d) {
    const err = validar(d);
    if (Object.keys(err).length) return { ok: false, errores: err };
    const r = { id: "res-" + String(++ultimoId).padStart(3, "0"), espacio: d.espacio, fecha: hoyISO(), inicio: Number(d.inicio), duracion: Number(d.duracion), nombre: String(d.nombre).trim().slice(0, 40), personas: Number(d.personas), dueno };
    propias.push(r);
    if (!guardar()) { propias.pop(); ultimoId--; return { ok: false, errores: { general: "No se pudo guardar la reserva en este navegador." } }; }
    recalcular(); cambioDatos("creada", r);
    return { ok: true, reserva: r };
  }
  function cancelarReserva(id) {
    const r = propias.find(x => x.id === id);
    if (!r) return { ok: false, error: "Esa reserva ya no existe o no es tuya." };
    if (r.dueno !== dueno) return { ok: false, error: "Solo puedes cancelar tus propias reservas." };
    if (yaTermino(r)) return { ok: false, error: "Esa reserva ya terminó." };
    const antes = propias; propias = propias.filter(x => x.id !== id);
    if (!guardar()) { propias = antes; return { ok: false, error: "No se pudo guardar la cancelación." }; }
    recalcular(); cambioDatos("cancelada", r);
    return { ok: true, reserva: r };
  }

  /* ---------- 5.4 Estado de UI y entrada ---------- */
  let modo = leer(cfg.claveVista, "iso") === "2d" ? "2d" : "iso";
  const zoomBase = () => (modo === "iso" ? 0.85 : 1);
  let zoom = zoomBase();
  let avatar = sanearAvatar(leer(cfg.claveAvatar, null));
  let panelId = null, formAbierto = false, confirmando = null, resaltado = { id: null, hasta: 0 };
  const teclas = new Set();
  let ruta = [], joy = { x: 0, y: 0 };
  const jug = { x: mundo.inicio.x, y: mundo.inicio.y, dir: "down", paso: 0, mov: false };
  const cam = { x: 0, y: 0 };
  let estados = {};

  /* ---------- 5.5 DOM ---------- */
  inyectarEstilos();
  raiz.classList.add("ee");
  raiz.innerHTML = `
    <canvas class="ee-lienzo" tabindex="0" role="application" aria-label="Mapa de la sala. Muévete con las flechas o WASD. Pulsa E para ver el espacio cercano. También puedes usar la lista de espacios."></canvas>
    <header class="ee-hud">
      <div class="ee-marca"><p class="ee-eyebrow">${esc(cfg.titulo)}</p><h1>${esc(cfg.subtitulo)}</h1></div>
      <div class="ee-reloj"><b data-r="hora">--:--</b><span data-r="fecha"></span><span class="ee-chip" data-r="abierto"></span></div>
    </header>
    <nav class="ee-controles" aria-label="Controles del mapa">
      <button type="button" class="ee-btn" data-a="vista" aria-pressed="false"></button>
      <button type="button" class="ee-btn ee-btn--ico" data-a="menos" aria-label="Alejar">−</button>
      <button type="button" class="ee-btn ee-btn--ico" data-a="mas" aria-label="Acercar">+</button>
      <button type="button" class="ee-btn" data-a="avatar">Mi apariencia</button>
      <button type="button" class="ee-btn" data-a="lista">Espacios</button>
      <button type="button" class="ee-btn" data-a="ayuda">Ayuda</button>
    </nav>
    <div class="ee-pista" data-r="pista" hidden></div>
    <div class="ee-aviso" data-r="aviso" role="status" aria-live="polite" hidden></div>
    <div class="ee-sr" data-r="sr" role="status" aria-live="polite"></div>
    <div class="ee-joy" data-r="joy" hidden aria-hidden="true"><i></i></div>
    <aside class="ee-panel" data-r="panel" hidden aria-labelledby="eePanelTitulo">
      <div class="ee-panel-cab">
        <div><p class="ee-eyebrow" data-r="pEyebrow"></p><h2 id="eePanelTitulo" tabindex="-1" data-r="pTitulo"></h2></div>
        <button type="button" class="ee-cerrar" data-a="cerrarPanel" aria-label="Cerrar detalle">&times;</button>
      </div>
      <div data-r="pInfo"></div>
      <div data-r="pAccion" class="ee-accion"></div>
    </aside>
    <dialog class="ee-dlg" data-r="dlgAvatar" aria-labelledby="eeAvTit"></dialog>
    <dialog class="ee-dlg" data-r="dlgLista" aria-labelledby="eeLiTit"></dialog>
    <dialog class="ee-dlg" data-r="dlgAyuda" aria-labelledby="eeAyTit"></dialog>`;
  const $ = s => raiz.querySelector(`[data-r="${s}"]`);
  const lienzo = raiz.querySelector(".ee-lienzo"), c = lienzo.getContext("2d");
  const el = { hora: $("hora"), fecha: $("fecha"), abierto: $("abierto"), pista: $("pista"), aviso: $("aviso"), sr: $("sr"), joy: $("joy"),
    panel: $("panel"), pEyebrow: $("pEyebrow"), pTitulo: $("pTitulo"), pInfo: $("pInfo"), pAccion: $("pAccion"),
    dlgAvatar: $("dlgAvatar"), dlgLista: $("dlgLista"), dlgAyuda: $("dlgAyuda") };

  let timerAviso = 0;
  function avisar(txt, tipo = "ok") {
    el.aviso.textContent = txt; el.aviso.dataset.tipo = tipo; el.aviso.hidden = false;
    clearTimeout(timerAviso); timerAviso = setTimeout(() => { el.aviso.hidden = true; }, 4500);
  }
  const anunciar = txt => { el.sr.textContent = ""; setTimeout(() => { el.sr.textContent = txt; }, 30); };

  /* ---------- 5.6 Proyección y primitivas de dibujo ---------- */
  const P = (x, y, z = 0) => (modo === "iso" ? [(x - y) * TW / 2, (x + y) * TH / 2 - z * ZH] : [x * S2, y * S2]);
  function poli(pts, fill, stroke, lw = 1) {
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }
  function caja(x, y, w, d, z0, h, col, o = {}) {
    const cs = typeof col === "string" ? { top: tono(col, 1.14), izq: tono(col, 0.86), der: tono(col, 0.7), borde: tono(col, 0.52) } : col;
    const prev = c.globalAlpha; c.globalAlpha = prev * (o.alfa ?? 1);
    if (modo === "2d") {
      const [x0, y0] = P(x, y), [x1, y1] = P(x + w, y + d);
      c.fillStyle = cs.top; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.strokeStyle = cs.borde; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
    } else {
      const z1 = z0 + h;
      poli([P(x, y + d, z1), P(x + w, y + d, z1), P(x + w, y + d, z0), P(x, y + d, z0)], cs.izq, cs.borde, 0.8);
      poli([P(x + w, y, z1), P(x + w, y + d, z1), P(x + w, y + d, z0), P(x + w, y, z0)], cs.der, cs.borde, 0.8);
      poli([P(x, y, z1), P(x + w, y, z1), P(x + w, y + d, z1), P(x, y + d, z1)], cs.top, cs.borde, 0.8);
    }
    c.globalAlpha = prev;
  }
  function cil(cx, cy, r, z0, h, col, o = {}) {
    const cs = typeof col === "string" ? { top: tono(col, 1.14), lado: tono(col, 0.8), borde: tono(col, 0.52) } : col;
    const prev = c.globalAlpha; c.globalAlpha = prev * (o.alfa ?? 1);
    if (modo === "2d") {
      const [x, y] = P(cx, cy);
      c.beginPath(); c.arc(x, y, r * S2, 0, TAU); c.fillStyle = cs.top; c.fill(); c.strokeStyle = cs.borde; c.lineWidth = 1; c.stroke();
    } else {
      const [x, ya] = P(cx, cy, z0 + h), [, yb] = P(cx, cy, z0);
      const rx = r * RAIZ2 * TW / 2, ry = r * RAIZ2 * TH / 2;
      c.fillStyle = cs.lado; c.strokeStyle = cs.borde; c.lineWidth = 0.8;
      if (h > 0) {
        c.beginPath(); c.ellipse(x, yb, rx, ry, 0, 0, TAU); c.fill();
        c.fillRect(x - rx, ya, 2 * rx, yb - ya);
        c.beginPath(); c.moveTo(x - rx, ya); c.lineTo(x - rx, yb); c.moveTo(x + rx, ya); c.lineTo(x + rx, yb); c.stroke();
      }
      c.beginPath(); c.ellipse(x, ya, rx, ry, 0, 0, TAU); c.fillStyle = cs.top; c.fill(); c.stroke();
    }
    c.globalAlpha = prev;
  }
  function esfera(cx, cy, z, r, col) {
    const [x, y] = P(cx, cy, z), pr = modo === "iso" ? r * ZH : r * S2;
    const gr = c.createRadialGradient(x - pr * 0.3, y - pr * 0.35, pr * 0.1, x, y, pr);
    gr.addColorStop(0, tono(col, 1.35)); gr.addColorStop(1, tono(col, 0.74));
    c.beginPath(); c.arc(x, y, pr, 0, TAU); c.fillStyle = gr; c.fill();
  }
  function discoPiso(cx, cy, r, fill, stroke, lw = 1.5) {
    const pts = []; for (let i = 0; i < 40; i++) pts.push(P(cx + Math.cos(i / 40 * TAU) * r, cy + Math.sin(i / 40 * TAU) * r, 0));
    poli(pts, fill, stroke, lw);
  }
  function rectPiso(x, y, w, d, fill, stroke, lw = 1.5) { poli([P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)], fill, stroke, lw); }
  // Plano vertical con y constante (mira hacia +y). Coordenadas internas: 100 unidades = 1 m. v crece hacia abajo.
  function panelY(x0, y, zTop, fn) {
    if (modo !== "iso") return;
    const [ox, oy] = P(x0, y, zTop);
    c.save(); c.translate(ox, oy); c.transform(TW / 2 / 100, TH / 2 / 100, 0, ZH / 100, 0, 0); fn(); c.restore();
  }
  // Plano vertical con x constante (mira hacia +x); el texto corre hacia -y, desde y1 (extremo mayor).
  function panelX(x, y1, zTop, fn) {
    if (modo !== "iso") return;
    const [ox, oy] = P(x, y1, zTop);
    c.save(); c.translate(ox, oy); c.transform(TW / 2 / 100, -TH / 2 / 100, 0, ZH / 100, 0, 0); fn(); c.restore();
  }

  /* ---------- 5.7 Construcción del mundo ---------- */
  const solidos = [], estaticos = [], decals = [];
  const dentro = {};                                  // id de cuarto -> jugador dentro
  const agregar = (cx, cy, h, fn, extra = {}) => estaticos.push(Object.assign({ k: cx + cy, h, fn }, extra));
  const asientosDe = {};                               // id espacio -> [[x,y,lado]]

  function silla(x, y, lado, col, taburete = false) {
    if (taburete) {
      cil(x, y, 0.05, 0, 0.7, "#3a3d40"); cil(x, y, 0.24, 0, 0.03, "#3a3d40"); cil(x, y, 0.22, 0.7, 0.07, col);
      return;
    }
    cil(x, y, 0.05, 0, 0.34, "#25282c");
    const atras = () => {
      if (lado === "N") caja(x - 0.24, y - 0.32, 0.48, 0.1, 0.4, 0.44, col);
      else if (lado === "S") caja(x - 0.24, y + 0.22, 0.48, 0.1, 0.4, 0.44, col);
      else if (lado === "E") caja(x + 0.22, y - 0.24, 0.1, 0.48, 0.4, 0.44, col);
      else caja(x - 0.32, y - 0.24, 0.1, 0.48, 0.4, 0.44, col);
    };
    if (lado === "N" || lado === "W") atras();
    cil(x, y, 0.25, 0.32, 0.1, col);
    if (lado === "S" || lado === "E") atras();
  }
  const ladoXY = (l, x, y, d) => (l === "N" ? [x, y - d] : l === "S" ? [x, y + d] : l === "E" ? [x + d, y] : [x - d, y]);

  function mesaRedonda(id, x, y, r, sillas, solido = true) {
    const cols = Array.isArray(sillas) ? sillas : [sillas, sillas, sillas, sillas];
    const seats = [];
    ["N", "E", "S", "W"].forEach((l, i) => {
      const [sx, sy] = ladoXY(l, x, y, r + 0.32);
      agregar(sx, sy, 0.9, () => silla(sx, sy, l, cols[i]));
      seats.push([sx, sy, l]);
    });
    agregar(x, y, 0.8, () => { cil(x, y, 0.08, 0, 0.7, "#2b2d30"); cil(x, y, 0.34, 0, 0.04, "#2b2d30"); cil(x, y, r, 0.7, 0.06, "#c98f52"); });
    if (solido) solidos.push([x - r * 0.9, y - r * 0.9, x + r * 0.9, y + r * 0.9]);
    if (id) asientosDe[id] = seats;
  }
  function mesaAlta(id, x, y, sillas) {
    const seats = [];
    ["N", "E", "S", "W"].forEach(l => {
      const [sx, sy] = ladoXY(l, x, y, 0.88);
      agregar(sx, sy, 1, () => silla(sx, sy, l, sillas, true));
      seats.push([sx, sy, l]);
    });
    agregar(x, y, 1.1, () => { cil(x, y, 0.07, 0, 1, "#2b2d30"); cil(x, y, 0.36, 0, 0.04, "#2b2d30"); cil(x, y, 0.52, 1, 0.06, "#c98f52"); });
    solidos.push([x - 0.5, y - 0.5, x + 0.5, y + 0.5]);
    asientosDe[id] = seats;
  }
  function mesaLarga(id, x, y, w, d, porLado, sillas) {
    const seats = [];
    for (let i = 0; i < porLado; i++) {
      const cx = x + (i + 0.5) * w / porLado;
      [["N", cx, y - 0.4], ["S", cx, y + d + 0.4]].forEach(([l, sx, sy]) => { agregar(sx, sy, 0.9, () => silla(sx, sy, l, sillas)); seats.push([sx, sy, l]); });
    }
    agregar(x + w / 2, y + d / 2, 0.8, () => {
      caja(x + 0.2, y + 0.2, 0.1, d - 0.4, 0, 0.7, "#2b2d30"); caja(x + w - 0.3, y + 0.2, 0.1, d - 0.4, 0, 0.7, "#2b2d30");
      caja(x, y, w, d, 0.7, 0.07, "#c98f52");
    });
    solidos.push([x, y, x + w, y + d]);
    if (id) asientosDe[id] = seats;
  }
  function planta(x, y, s = 1, solido = true) {
    agregar(x, y, 1 + s, () => {
      cil(x, y, 0.22, 0, 0.36, "#8d9296");
      if (modo === "iso") {
        cil(x, y, 0.035, 0.36, 0.55 * s, "#6b4f32");
        esfera(x, y, 0.95 * s + 0.2, 0.34 * s, "#3f8f4f"); esfera(x - 0.13, y + 0.1, 0.72 * s + 0.2, 0.3 * s, "#4fa860"); esfera(x + 0.14, y - 0.08, 1.2 * s + 0.2, 0.26 * s, "#2f7a44");
      } else esfera(x, y, 0, 0.36 * s, "#3f8f4f");
    });
    if (solido) solidos.push([x - 0.25, y - 0.25, x + 0.25, y + 0.25]);
  }
  function mesaBaja(x, y, r, conPlanta) {
    agregar(x, y, 0.8, () => {
      cil(x, y, 0.05, 0, 0.5, "#2b2d30"); cil(x, y, r, 0.5, 0.05, "#c98f52");
      if (conPlanta && modo === "iso") { cil(x, y, 0.11, 0.55, 0.14, "#9aa0a4"); esfera(x, y, 0.88, 0.17, "#4fa860"); }
    });
    solidos.push([x - r, y - r, x + r, y + r]);
  }
  function puff(x, y, r, col) {
    agregar(x, y, 0.5, () => {
      cil(x, y, r, 0, 0.14, tono(col, 0.78)); cil(x, y, r * 0.93, 0.1, 0.2, col); cil(x, y, r * 0.66, 0.28, 0.06, tono(col, 1.12));
    });
  }
  function sofa(id, x, y, w, col) {
    const seats = [0, 1, 2].map(i => [x + (i + 0.5) * w / 3, y + 0.62, "S"]);
    agregar(x + w / 2, y + 0.5, 1.1, () => {
      caja(x, y, w, 0.3, 0.1, 0.9, col);
      caja(x, y + 0.3, w, 0.7, 0, 0.42, tono(col, 0.92));
      for (let i = 0; i < 3; i++) caja(x + 0.28 + i * (w - 0.56) / 3, y + 0.34, (w - 0.56) / 3 - 0.04, 0.62, 0.42, 0.12, tono(col, 1.12));
      caja(x, y + 0.3, 0.28, 0.7, 0.42, 0.26, col); caja(x + w - 0.28, y + 0.3, 0.28, 0.7, 0.42, 0.26, col);
    });
    solidos.push([x, y, x + w, y + 1]);
    asientosDe[id] = seats;
  }
  function escaleras(x, y, w, d) {
    const n = 12, dy = d / n;
    agregar(x + w / 2, y + d / 2, 3.2, () => {
      for (let i = 0; i < n; i++) {
        const sy = y + i * dy, alt = (n - i) * 0.25;
        caja(x, sy, w, dy + 0.02, 0, alt, "#cfc8bb");
      }
      if (modo === "iso") caja(x + w - 0.06, y, 0.06, d, 0, 1.4, "#9aa0a4"); // pasamanos
    });
    solidos.push([x, y, x + w, y + d]);
  }
  function celosia(x, y, w) {
    agregar(x + w / 2, y + 0.1, 2, () => {
      caja(x, y, w, 0.2, 0, 1.7, "#6a4a32");
      panelY(x, y + 0.2, 1.7, () => {
        c.fillStyle = "#b98a5c";
        for (let i = 0; i < Math.floor(w * 100 / 60); i++) { const u = 18 + i * 60; c.beginPath(); c.moveTo(u, 30); c.lineTo(u + 36, 30); c.lineTo(u + 18, 100); c.closePath(); c.fill(); c.beginPath(); c.moveTo(u, 160); c.lineTo(u + 36, 160); c.lineTo(u + 18, 100); c.closePath(); c.fill(); }
      });
      if (modo === "iso") { esfera(x + 0.5, y + 0.1, 2.0, 0.34, "#2f7a44"); esfera(x + w - 0.5, y + 0.1, 2.0, 0.34, "#3f8f4f"); esfera(x + w / 2, y + 0.1, 2.1, 0.3, "#4fa860"); }
    });
    solidos.push([x, y, x + w, y + 0.2]);
  }
  function pizarra(x, y, w) {
    agregar(x + w / 2, y, 1.9, () => { caja(x + 0.1, y, 0.06, 0.06, 0, 0.5, "#9aa0a4"); caja(x + w - 0.16, y, 0.06, 0.06, 0, 0.5, "#9aa0a4"); caja(x, y, w, 0.08, 0.5, 1.2, { top: "#ffffff", izq: "#f6f8f7", der: "#e2e6e4", borde: "#9aa0a4" }); });
  }
  function extintor(x, y) { agregar(x, y, 0.8, () => { cil(x, y, 0.1, 0, 0.5, "#c0392b"); }); }
  function tapete(x, y, r, color) { decals.push(() => discoPiso(x, y, r, color, tono(color, 0.8), 1)); }
  function mural(y0, y1) {
    agregar(0, y1 + 0.5, 3, () => {        // clave de orden mayor que la de los segmentos de pared que cubre
      panelX(0.01, y1, 2.7, () => {
        const L = (y1 - y0) * 100;
        c.fillStyle = "#e4f2e8"; c.fillRect(0, 0, L, 200);
        c.strokeStyle = "#4caf50"; c.lineWidth = 4; c.strokeRect(2, 2, L - 4, 196);
        const pill = (x, y, w, h, fill, stroke, txt, col, fs) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, h / 2) : c.rect(x, y, w, h); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = 3; c.strokeStyle = stroke; c.stroke(); } c.fillStyle = col; c.font = `700 ${fs}px system-ui, sans-serif`; c.textBaseline = "middle"; c.textAlign = "center"; c.fillText(txt, x + w / 2, y + h / 2 + 2); };
        pill(30, 22, 200, 56, null, "#4caf50", "Conoce", "#2e8b3d", 34);
        pill(250, 22, 58, 56, null, "#4caf50", "→", "#2e8b3d", 34);
        pill(326, 22, 150, 56, "#4caf50", null, "MAPS", "#0d2a1b", 36);
        pill(30, 96, L - 60, 42, "#6ec14f", null, "Un nuevo modelo educativo flexible", "#0d2a1b", 24);
        pill(30, 148, 340, 38, "#a5d84a", null, "que se adapta a ti", "#0d2a1b", 22);
      });
    });
  }

  function paredes() {
    const par = (x, y, w, d, h, col, extra = {}) => agregar(x + w / 2, y + d / 2, h, () => caja(x, y, w, d, 0, h, col, extra), { solo: true });
    // Pared norte (blanca) y oeste (blanca) del lobby; los cuartos van pegados al norte
    for (let x = 0; x < W; x++) agregar(x + 0.5, -0.1, 3, () => caja(x, -0.2, 1, 0.2, 0, 3, "#f4f6f4"));
    for (let y = 0; y < H; y++) agregar(-0.1, y + 0.5, 3, () => caja(-0.2, y, 0.2, 1, 0, 3, "#f4f6f4"));
    // Franja verde baja en la pared oeste (como en las fotos)
    for (let y = 0; y < H; y++) agregar(-0.05, y + 0.5, 1.2, () => caja(-0.05, y, 0.05, 1, 0, 1.1, "#7da287"));

    const VID = { top: "rgba(214,240,232,.40)", izq: "rgba(176,222,210,.30)", der: "rgba(150,200,190,.26)", borde: "rgba(255,255,255,.55)" };
    const ESC = { top: "rgba(236,243,243,.92)", izq: "rgba(222,232,232,.86)", der: "rgba(200,214,214,.84)", borde: "rgba(255,255,255,.7)" };
    const OSC = { top: "#5b5f63", izq: "#4a4d50", der: "#3a3d40", borde: "#2a2c2e" };

    mundo.cuartos.forEach(q => {
      const gx0 = q.puerta.x, gx1 = q.puerta.x + q.puerta.ancho;
      // Piezas del frente (y = y1) con hueco de puerta
      const piezas = [[q.x0, gx0], [gx1, q.x1]];
      piezas.forEach(([a, b]) => {
        for (let x = Math.floor(a); x < Math.ceil(b); x++) {
          const xa = Math.max(a, x), xb = Math.min(b, x + 1);
          if (xb - xa < 0.01) continue;
          const t = 0.1;
          agregar((xa + xb) / 2, q.y1, 2.8, () => {
            if (q.frente === "particion") caja(xa, q.y1 - t / 2, xb - xa, t, 0, 2.7, OSC, { alfa: dentro[q.id] ? 0.16 : 1 });
            else if (q.frente === "escarchado") { caja(xa, q.y1 - t / 2, xb - xa, t, 0, 1.25, ESC); caja(xa, q.y1 - t / 2, xb - xa, t, 1.25, 1.45, VID); }
            else caja(xa, q.y1 - t / 2, xb - xa, t, 0, 2.7, VID);
          });
        }
        solidos.push([a, q.y1 - 0.06, b, q.y1 + 0.06]);
      });
      // Marco verde de la puerta y número
      agregar(gx0, q.y1, 2.8, () => { caja(gx0 - 0.1, q.y1 - 0.08, 0.1, 0.16, 0, 2.7, "#0f6b45"); });
      agregar(gx1, q.y1, 2.8, () => { caja(gx1, q.y1 - 0.08, 0.1, 0.16, 0, 2.7, "#0f6b45"); });
      if (q.numero) agregar(gx0 - 0.5, q.y1 + 0.1, 3, () => {
        panelY(gx0 - 0.9, q.y1 + 0.06, 2.5, () => {
          c.fillStyle = "#0f6b45"; c.fillRect(0, 0, 70, 210);
          c.fillStyle = "#eaf6ef"; c.font = "700 46px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(q.numero, 35, 110);
        });
      });
      // Pared divisoria derecha del cuarto (cristal), excepto en el borde del mundo
      if (q.x1 < W) for (let y = 0; y < Math.ceil(q.y1); y++) {
        const ya = y, yb = Math.min(q.y1, y + 1);
        agregar(q.x1, (ya + yb) / 2, 2.8, () => caja(q.x1 - 0.05, ya, 0.1, yb - ya, 0, 2.7, VID));
      }
      solidos.push([q.x1 - 0.06, 0, q.x1 + 0.06, q.y1]);
    });
    // Pared oeste del cuarto 1001 y borde este del gimnasio (colisión)
    solidos.push([-0.3, -0.3, 0, H + 0.3]);
    solidos.push([-0.3, -0.3, W + 0.3, 0]);
  }

  function construir() {
    // Piso
    decals.push(() => {
      if (modo === "iso") {
        const a = P(0, 0), b = P(W, 0), d = P(W, H), e = P(0, H);
        poli([e, d, [d[0], d[1] + 12], [e[0], e[1] + 12]], PAL.losaIzq); poli([d, b, [b[0], b[1] + 12], [d[0], d[1] + 12]], PAL.losaDer);
        poli([a, b, d, e], PAL.piso);
      } else { c.fillStyle = PAL.piso; c.fillRect(0, 0, W * S2, H * S2); }
      c.strokeStyle = PAL.junta; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i <= W; i += 2) { const [x1, y1] = P(i, 0), [x2, y2] = P(i, H); c.moveTo(x1, y1); c.lineTo(x2, y2); }
      for (let j = 0; j <= H; j += 2) { const [x1, y1] = P(0, j), [x2, y2] = P(W, j); c.moveTo(x1, y1); c.lineTo(x2, y2); }
      c.stroke();
      // Zócalos verdes y área de cuartos
      rectPiso(0, 0, W, 6, PAL.pisoCuartos, null);
    });

    // Cuartos y paredes
    paredes();
    mundo.cuartos.forEach(q => (q.muebles || []).forEach(m => {
      if (m.t === "mesaLarga") mesaLarga(q.id, m.x, m.y, m.w, m.d, m.porLado, m.sillas);
      else if (m.t === "mesaRedonda") { if (!asientosDe[q.id]) asientosDe[q.id] = []; const antes = Object.keys(asientosDe).length; mesaRedonda(null, m.x, m.y, m.r, m.sillas); const s = []; ["N", "E", "S", "W"].forEach(l => { const [sx, sy] = ladoXY(l, m.x, m.y, m.r + 0.32); s.push([sx, sy, l]); }); asientosDe[q.id].push(...s); }
      else if (m.t === "planta") planta(m.x, m.y, m.s);
      else if (m.t === "pizarra") pizarra(m.x, m.y, m.w);
    }));

    // Mesas
    mundo.mesas.forEach(m => { if (m.variante === "alta") mesaAlta(m.id, m.x, m.y, m.sillas); else mesaRedonda(m.id, m.x, m.y, 0.62, m.sillas); });
    // Bancas
    mundo.bancas.forEach(b => {
      if (b.variante === "sofa") sofa(b.id, b.x, b.y, b.w, b.color);
      else {
        const offs = [[-0.95, -0.35], [0.9, -0.5], [0.1, 0.85]];
        const seats = [];
        if (b.tapete) decals.push(() => discoPiso(b.x, b.y, 1.9, b.tapete, tono(b.tapete, 0.78), 1));
        offs.forEach(([ox, oy], i) => { puff(b.x + ox, b.y + oy, 0.52, b.colores[i % b.colores.length]); seats.push([b.x + ox, b.y + oy, "S"]); solidos.push([b.x + ox - 0.34, b.y + oy - 0.34, b.x + ox + 0.34, b.y + oy + 0.34]); });
        agregar(b.x - 0.1, b.y + 0.05, 0.8, () => { cil(b.x - 0.1, b.y + 0.1, 0.05, 0, 0.45, "#2b2d30"); cil(b.x - 0.1, b.y + 0.1, 0.3, 0.45, 0.05, "#c98f52"); });
        asientosDe[b.id] = seats;
      }
    });
    // Decoración
    mundo.decoracion.forEach(d => {
      if (d.t === "planta") planta(d.x, d.y, d.s); else if (d.t === "mesaBaja") mesaBaja(d.x, d.y, d.r, d.planta);
      else if (d.t === "escaleras") escaleras(d.x, d.y, d.w, d.d); else if (d.t === "celosia") celosia(d.x, d.y, d.w);
      else if (d.t === "mural") mural(d.y0, d.y1); else if (d.t === "tapete") { if (d.color && !(mundo.bancas.some(b => b.x === d.x && b.y === d.y && b.tapete))) tapete(d.x, d.y, d.r, d.color); }
      else if (d.t === "extintor") extintor(d.x, d.y);
    });
    // Entrada
    decals.push(() => { rectPiso(mundo.inicio.x - 1.6, H - 1.0, 3.2, 0.8, "rgba(40,70,55,.35)", "rgba(40,70,55,.6)", 1); });

    // Zonas de interacción, anclas y etiquetas
    espacios.forEach(e => {
      if (e.tipo === "cuarto") {
        const px = e.puerta.x + e.puerta.ancho / 2;
        e.ancla = [px, e.y1 + 0.9]; e.zona = [e.x0, e.y0, e.x1, e.y1 + 1.6]; e.hit = [e.x0, e.y0, e.x1, e.y1 + 0.2];
        e.etiqueta = [px, e.y1, 3.1];
      } else if (e.tipo === "mesa") {
        e.ancla = [e.x, e.y + 1.5]; e.zona = [e.x - 2.2, e.y - 2.2, e.x + 2.2, e.y + 2.2]; e.hit = [e.x - 1.2, e.y - 1.2, e.x + 1.2, e.y + 1.2]; e.etiqueta = [e.x, e.y, 2.4];
      } else if (e.variante === "sofa") {
        e.ancla = [e.x + e.w / 2, e.y + 1.9]; e.zona = [e.x - 1.2, e.y - 0.8, e.x + e.w + 1.2, e.y + 3]; e.hit = [e.x - 0.2, e.y - 0.2, e.x + e.w + 0.2, e.y + 1.2]; e.etiqueta = [e.x + e.w / 2, e.y + 0.4, 2.2];
      } else {
        e.ancla = [e.x, e.y + 2.2]; e.zona = [e.x - 2.8, e.y - 2.4, e.x + 2.8, e.y + 3.2]; e.hit = [e.x - 1.8, e.y - 1.6, e.x + 1.8, e.y + 1.8]; e.etiqueta = [e.x, e.y, 1.9];
      }
    });
    // Indicadores de estado en el piso
    decals.push(() => {
      espacios.forEach(e => {
        const st = estados[e.id]; if (!st) return;
        const col = COL_ESTADO[st.e], sel = panelId === e.id || (resaltado.id === e.id && resaltado.hasta > performance.now());
        const fill = sel ? col + "55" : col + "26", lw = sel ? 3 : 1.6;
        if (e.tipo === "cuarto") rectPiso(e.puerta.x - 0.1, e.y1 + 0.18, e.puerta.ancho + 0.2, 1.2, fill, col, lw);
        else if (e.tipo === "mesa") discoPiso(e.x, e.y, e.variante === "alta" ? 1.4 : 1.55, fill, col, lw);
        else if (e.variante === "sofa") rectPiso(e.x - 0.3, e.y - 0.3, e.w + 0.6, 1.9, fill, col, lw);
        else discoPiso(e.x, e.y, 2.05, fill, col, lw);
      });
    });
  }
  const COL_ESTADO = { libre: "#2fb36d", ocupado: "#e5534b", cerrado: "#8c9a93" };

  /* ---------- Paleta por tema ---------- */
  let PAL = {};
  function paleta() {
    const osc = matchMedia("(prefers-color-scheme: dark)").matches;
    PAL = osc
      ? { fondo: "#0b1611", piso: "#a8a395", pisoCuartos: "rgba(40,60,50,.18)", junta: "rgba(40,40,30,.16)", losaIzq: "#6f6b60", losaDer: "#58554c" }
      : { fondo: "#d8e4dc", piso: "#efe9dd", pisoCuartos: "rgba(120,150,135,.14)", junta: "rgba(120,110,90,.18)", losaIzq: "#c8c0ad", losaDer: "#b3ab98" };
  }
  paleta();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paleta, sig);
  construir();

  /* ---------- 5.8 Colisión y rutas ---------- */
  const RJ = 0.26;
  function colisiona(x, y, r = RJ) {
    if (x - r < 0.2 || y - r < 0.2 || x + r > W - 0.2 || y + r > H - 0.2) return true;
    for (const s of solidos) if (x + r > s[0] && x - r < s[2] && y + r > s[1] && y - r < s[3]) return true;
    return false;
  }
  if (colisiona(jug.x, jug.y)) { jug.y -= 1; }
  const CELDA = 0.5, cols = Math.ceil(W / CELDA), filas = Math.ceil(H / CELDA);
  const bloq = new Uint8Array(cols * filas);
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) bloq[j * cols + i] = colisiona((i + 0.5) * CELDA, (j + 0.5) * CELDA, 0.31) ? 1 : 0;
  const celdaDe = (x, y) => [acotar(Math.floor(x / CELDA), 0, cols - 1), acotar(Math.floor(y / CELDA), 0, filas - 1)];
  function lineaLibre(a, b) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / 0.15);
    for (let i = 1; i < n; i++) { const t = i / n; if (colisiona(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.3)) return false; }
    return true;
  }
  function buscarRuta(x0, y0, x1, y1) {
    let [si, sj] = celdaDe(x0, y0), [ti, tj] = celdaDe(x1, y1);
    if (bloq[tj * cols + ti]) {                      // el destino está ocupado: busca la celda libre más cercana
      let mejor = null, md = 1e9;
      for (let r = 1; r <= 10 && !mejor; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        const i = ti + di, j = tj + dj; if (i < 0 || j < 0 || i >= cols || j >= filas || bloq[j * cols + i]) continue;
        const dd = Math.hypot(di, dj); if (dd < md) { md = dd; mejor = [i, j]; }
      }
      if (!mejor) return [];
      [ti, tj] = mejor;
    }
    const N = cols * filas, g = new Float32Array(N).fill(1e9), padre = new Int32Array(N).fill(-1), cerrado = new Uint8Array(N);
    const abierto = [[0, sj * cols + si]]; g[sj * cols + si] = 0;
    const h = (i, j) => { const dx = Math.abs(i - ti), dy = Math.abs(j - tj); return dx + dy + (1.414 - 2) * Math.min(dx, dy); };
    const push = n => { abierto.push(n); let k = abierto.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (abierto[p][0] <= abierto[k][0]) break; [abierto[p], abierto[k]] = [abierto[k], abierto[p]]; k = p; } };
    const pop = () => { const top = abierto[0], ult = abierto.pop(); if (abierto.length) { abierto[0] = ult; let k = 0; for (;;) { let l = 2 * k + 1, r = l + 1, m = k; if (l < abierto.length && abierto[l][0] < abierto[m][0]) m = l; if (r < abierto.length && abierto[r][0] < abierto[m][0]) m = r; if (m === k) break; [abierto[m], abierto[k]] = [abierto[k], abierto[m]]; k = m; } } return top; };
    let fin = -1;
    while (abierto.length) {
      const [, n] = pop(); if (cerrado[n]) continue; cerrado[n] = 1;
      const i = n % cols, j = (n / cols) | 0;
      if (i === ti && j === tj) { fin = n; break; }
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= cols || nj >= filas) continue;
        const m = nj * cols + ni; if (bloq[m] || cerrado[m]) continue;
        if (di && dj && (bloq[j * cols + ni] || bloq[nj * cols + i])) continue;
        const gg = g[n] + (di && dj ? 1.414 : 1);
        if (gg < g[m]) { g[m] = gg; padre[m] = n; push([gg + h(ni, nj), m]); }
      }
    }
    if (fin < 0) return [];
    const celdas = []; for (let n = fin; n >= 0; n = padre[n]) celdas.push([(n % cols + 0.5) * CELDA, (((n / cols) | 0) + 0.5) * CELDA]);
    celdas.reverse();
    const pts = [[x0, y0], ...celdas.slice(1)];
    const lisa = [pts[0]]; let i = 0;
    while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !lineaLibre(pts[i], pts[j])) j--; lisa.push(pts[j]); i = j; }
    lisa.shift();
    return lisa;
  }
  function irAPunto(x, y) { ruta = buscarRuta(jug.x, jug.y, x, y); return ruta.length > 0; }

  /* ---------- 5.9 Entrada de teclado, ratón y táctil ---------- */
  const hayDialogo = () => raiz.querySelector("dialog[open]") !== null;
  const enCampo = t => t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName);
  const MOV = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]);
  addEventListener("keydown", ev => {
    if (hayDialogo() || enCampo(ev.target) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (MOV.has(k)) { teclas.add(k); if (!ev.target.closest || !ev.target.closest(".ee-panel")) ev.preventDefault(); return; }
    if (k === "shift") { teclas.add("shift"); return; }
    if ((k === "e" || (k === "enter" && ev.target === lienzo)) && cercano) { abrirPanel(cercano.id); ev.preventDefault(); }
    else if (k === "escape" && panelId) cerrarPanel();
    else if (k === "v") alternarVista();
    else if (k === "+" || k === "=") cambiarZoom(1.15);
    else if (k === "-" || k === "_") cambiarZoom(1 / 1.15);
  }, sig);
  addEventListener("keyup", ev => teclas.delete(ev.key.toLowerCase()), sig);
  addEventListener("blur", () => teclas.clear(), sig);

  function aMundo(px, py) {                          // píxel de pantalla -> mundo (en el suelo)
    const r = lienzo.getBoundingClientRect();
    const sx = (px - r.left - r.width / 2) / zoom + cam.px, sy = (py - r.top - r.height / 2) / zoom + cam.py;
    if (modo === "iso") { const u = sx / (TW / 2), v = sy / (TH / 2); return [(u + v) / 2, (v - u) / 2]; }
    return [sx / S2, sy / S2];
  }
  const etiquetasPantalla = [];
  let arrastre = null;
  lienzo.addEventListener("pointerdown", ev => { arrastre = { x: ev.clientX, y: ev.clientY, t: performance.now() }; lienzo.focus({ preventScroll: true }); }, sig);
  lienzo.addEventListener("pointerup", ev => {
    if (!arrastre || Math.hypot(ev.clientX - arrastre.x, ev.clientY - arrastre.y) > 8) { arrastre = null; return; }
    arrastre = null;
    const r = lienzo.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    const et = etiquetasPantalla.find(e => px >= e.x0 && px <= e.x1 && py >= e.y0 && py <= e.y1);
    if (et) { abrirPanel(et.id); return; }
    const [wx, wy] = aMundo(ev.clientX, ev.clientY);
    const e = espacios.find(s => wx >= s.hit[0] && wx <= s.hit[2] && wy >= s.hit[1] && wy <= s.hit[3]);
    if (e) { abrirPanel(e.id); return; }
    if (wx > 0 && wy > 0 && wx < W && wy < H) irAPunto(wx, wy);
  }, sig);
  lienzo.addEventListener("wheel", ev => { ev.preventDefault(); cambiarZoom(ev.deltaY < 0 ? 1.1 : 1 / 1.1); }, { passive: false, signal: ac.signal });
  function cambiarZoom(f) { zoom = acotar(zoom * f, 0.5, 2.4); }

  // Joystick táctil
  const joyEl = el.joy, perilla = joyEl.querySelector("i");
  if (matchMedia("(pointer: coarse)").matches) joyEl.hidden = false;
  let joyActivo = false;
  const joyMover = ev => {
    const r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = ev.clientX - cx, dy = ev.clientY - cy; const m = Math.hypot(dx, dy), max = r.width / 2 - 14;
    if (m > max) { dx = dx / m * max; dy = dy / m * max; }
    perilla.style.transform = `translate(${dx}px,${dy}px)`;
    joy = m < 8 ? { x: 0, y: 0 } : { x: dx / max, y: dy / max };
  };
  joyEl.addEventListener("pointerdown", ev => { joyActivo = true; joyEl.setPointerCapture(ev.pointerId); joyMover(ev); ev.preventDefault(); }, sig);
  joyEl.addEventListener("pointermove", ev => { if (joyActivo) joyMover(ev); }, sig);
  const joySoltar = () => { joyActivo = false; joy = { x: 0, y: 0 }; perilla.style.transform = ""; };
  joyEl.addEventListener("pointerup", joySoltar, sig); joyEl.addEventListener("pointercancel", joySoltar, sig);

  /* ---------- 5.10 Actualización ---------- */
  let cercano = null;
  function pantallaAMundoDir(sx, sy) {
    if (modo === "iso") { const u = sx / (TW / 2), v = sy / (TH / 2); return [(u + v) / 2, (v - u) / 2]; }
    return [sx, sy];
  }
  function actualizar(dt) {
    let sx = 0, sy = 0;
    if (teclas.has("arrowup") || teclas.has("w")) sy -= 1;
    if (teclas.has("arrowdown") || teclas.has("s")) sy += 1;
    if (teclas.has("arrowleft") || teclas.has("a")) sx -= 1;
    if (teclas.has("arrowright") || teclas.has("d")) sx += 1;
    if (joy.x || joy.y) { sx = joy.x; sy = joy.y; }
    let dx = 0, dy = 0;
    if (sx || sy) {
      ruta = [];
      const m = Math.hypot(sx, sy); [dx, dy] = pantallaAMundoDir(sx / m, sy / m);
    } else if (ruta.length) {
      const [tx, ty] = ruta[0], d = Math.hypot(tx - jug.x, ty - jug.y);
      if (d < 0.14) ruta.shift(); else { dx = (tx - jug.x) / d; dy = (ty - jug.y) / d; }
    }
    const l = Math.hypot(dx, dy);
    jug.mov = false;
    if (l > 0) {
      dx /= l; dy /= l;
      const vel = (teclas.has("shift") ? 6.8 : 4.2) * dt, ax = jug.x, ay = jug.y;
      let nx = jug.x + dx * vel; if (!colisiona(nx, jug.y)) jug.x = nx;
      let ny = jug.y + dy * vel; if (!colisiona(jug.x, ny)) jug.y = ny;
      const real = Math.hypot(jug.x - ax, jug.y - ay);
      if (real > 1e-4) {
        jug.mov = true; jug.paso += real * 5.2;
        const [px, py] = [(P(jug.x, jug.y)[0] - P(ax, ay)[0]), (P(jug.x, jug.y)[1] - P(ax, ay)[1])];
        jug.dir = Math.abs(px) > Math.abs(py) * 1.2 ? (px < 0 ? "left" : "right") : (py < 0 ? "up" : "down");
      } else if (ruta.length) ruta.shift();
    }
    // Cámara
    const [px, py] = P(jug.x, jug.y, 0.6);
    if (cam.px === undefined) { cam.px = px; cam.py = py; }
    const k = 1 - Math.exp(-dt * 7); cam.px += (px - cam.px) * k; cam.py += (py - cam.py) * k;
    // Interacción cercana
    let mejor = null, md = 1e9;
    for (const e of espacios) {
      if (jug.x >= e.zona[0] && jug.x <= e.zona[2] && jug.y >= e.zona[1] && jug.y <= e.zona[3]) {
        const d = Math.hypot(jug.x - e.ancla[0], jug.y - e.ancla[1]); if (d < md) { md = d; mejor = e; }
      }
    }
    if (mejor !== cercano) {
      cercano = mejor;
      if (cercano) { el.pista.hidden = false; el.pista.innerHTML = `<kbd>E</kbd> Ver ${esc(cercano.nombre)}`; el.pista.onclick = () => abrirPanel(cercano.id); }
      else el.pista.hidden = true;
    }
    mundo.cuartos.forEach(q => { dentro[q.id] = jug.x > q.x0 && jug.x < q.x1 && jug.y > q.y0 && jug.y < q.y1 + 0.1; });
  }

  /* ---------- 5.11 Dibujo ---------- */
  let ancho = 0, alto = 0, dpr = 1;
  function ajustarLienzo() {
    const r = lienzo.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    ancho = r.width; alto = r.height;
    if (lienzo.width !== Math.round(ancho * dpr) || lienzo.height !== Math.round(alto * dpr)) { lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr); }
  }
  const ro = new ResizeObserver(ajustarLienzo); ro.observe(lienzo);

  function pill(g, x, y, txt, dotCol, opts = {}) {
    g.font = `600 ${opts.fs || 12}px system-ui, sans-serif`;
    const tw = g.measureText(txt).width, padX = 10, h = (opts.fs || 12) + 10, w = tw + padX * 2 + (dotCol ? 14 : 0);
    const x0 = x - w / 2, y0 = y - h;
    g.beginPath(); g.roundRect ? g.roundRect(x0, y0, w, h, h / 2) : g.rect(x0, y0, w, h);
    g.fillStyle = opts.bg || "rgba(7,48,31,.9)"; g.fill();
    if (opts.borde) { g.strokeStyle = opts.borde; g.lineWidth = 2; g.stroke(); }
    let tx = x0 + padX;
    if (dotCol) { g.beginPath(); g.arc(tx + 4, y0 + h / 2, 4.2, 0, TAU); g.fillStyle = dotCol; g.fill(); tx += 14; }
    g.fillStyle = opts.color || "#eaf6ef"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(txt, tx, y0 + h / 2 + 0.5);
    return { x0, y0, x1: x0 + w, y1: y0 + h };
  }

  function dibujar(t) {
    ajustarLienzo();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = PAL.fondo; c.fillRect(0, 0, ancho, alto);
    c.save();
    c.translate(ancho / 2, alto / 2); c.scale(zoom, zoom); c.translate(-cam.px, -cam.py);

    decals.forEach(f => f());

    // Objetos dinámicos: jugador y personas sentadas
    const dyn = [];
    const f = hoyISO(), hActual = horaDec();
    espacios.forEach(e => {
      const st = estados[e.id];
      if (st && st.e === "ocupado" && st.reserva && asientosDe[e.id]) {
        const seats = asientosDe[e.id], n = Math.min(st.reserva.personas, seats.length);
        for (let i = 0; i < n; i++) {
          const [sx, sy, lado] = seats[i], ap = avatarAleatorio(hash(st.reserva.id + ":" + i));
          const dir = lado === "N" ? "down" : lado === "S" ? "up" : lado === "E" ? "left" : "right";
          const kx = e.tipo === "cuarto" ? sx : sx, ky = sy;
          dyn.push({ k: kx + ky + 0.02, h: 99, fn: () => { const [px, py] = P(kx, ky, modo === "iso" ? 0.3 : 0); dibujarAvatar(c, ap, { x: px, y: py + (modo === "iso" ? 0 : 6), dir, sentado: true, esc: 0.92 }); } });
        }
      }
    });
    dyn.push({ k: jug.x + jug.y + 0.01, h: 100, fn: () => {
      const [px, py] = P(jug.x, jug.y, 0);
      dibujarAvatar(c, avatar, { x: px, y: py, dir: jug.dir, paso: jug.paso, mov: jug.mov });
      c.font = "600 11px system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      const w = c.measureText(avatar.nombre).width + 12; rr(c, px - w / 2, py - 70, w, 16, 8, "rgba(7,48,31,.86)");
      c.fillStyle = "#eaf6ef"; c.fillText(avatar.nombre, px, py - 61.5);
    } });

    const lista = estaticos.concat(dyn);
    if (modo === "iso") lista.sort((a, b) => a.k - b.k || a.h - b.h); else lista.sort((a, b) => a.h - b.h || a.k - b.k);
    lista.forEach(it => it.fn());
    c.restore();

    // Etiquetas (en pantalla, sin escalar)
    etiquetasPantalla.length = 0;
    const toPant = (x, y, z) => { const [px, py] = P(x, y, z); return [ancho / 2 + (px - cam.px) * zoom, alto / 2 + (py - cam.py) * zoom - (modo === "2d" ? 8 : 0)]; };
    espacios.forEach(e => {
      const st = estados[e.id]; if (!st) return;
      const [sx, sy] = toPant(e.etiqueta[0], e.etiqueta[1], e.etiqueta[2]);
      if (sx < -80 || sx > ancho + 80 || sy < -40 || sy > alto + 40) return;
      const cerca = cercano === e || panelId === e.id || Math.hypot(jug.x - e.etiqueta[0], jug.y - e.etiqueta[1]) < 5;
      const mia = propias.some(r => r.espacio === e.id && r.dueno === dueno && !yaTermino(r));
      const txt = (mia ? "★ " : "") + e.nombre + (cerca ? " · " + st.corto : "");
      // Si la etiqueta tapa a tu personaje, se vuelve translúcida para que lo veas
      const [jx, jy] = toPant(jug.x, jug.y, 0.9);
      const w = c.measureText(txt).width + 40, tapa = Math.abs(sx - jx) < w / 2 + 14 && jy > sy - 90 && jy < sy + 30;
      c.globalAlpha = tapa ? 0.22 : 1;
      const r = pill(c, sx, sy, txt, COL_ESTADO[st.e], { borde: panelId === e.id ? "#86E3AE" : null, fs: cerca ? 13 : 12 });
      c.globalAlpha = 1;
      etiquetasPantalla.push({ id: e.id, ...r });
    });
    // Rótulo de entrada
    { const [sx, sy] = toPant(mundo.inicio.x, H - 0.6, 0.2); pill(c, sx, sy, "Entrada", null, { bg: "rgba(40,70,55,.6)", fs: 11 }); }
  }

  /* ---------- 5.12 Bucle ---------- */
  let ultimo = performance.now(), raf = 0, tickEstado = 0;
  function bucle(t) {
    const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t;
    if (t - tickEstado > 500) { tickEstado = t; refrescarEstados(); }
    actualizar(dt); dibujar(t);
    raf = requestAnimationFrame(bucle);
  }

  let firmaPanel = "", firmaReloj = "";
  function refrescarEstados() {
    const d = ahoraFn(); estados = {}; espacios.forEach(e => { estados[e.id] = estadoDe(e.id, d); });
    const r = fmtReloj.format(d), ab = horaDec(d) >= cfg.abre && horaDec(d) < cfg.cierra;
    if (r + ab !== firmaReloj) {
      const fecha = fmtFecha.format(d);
      firmaReloj = r + ab; el.hora.textContent = r; el.fecha.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
      el.abierto.textContent = ab ? `Abierto · cierra ${hh(cfg.cierra)}` : `Cerrado · ${hh(cfg.abre)} – ${hh(cfg.cierra)}`; el.abierto.dataset.abierto = ab ? "1" : "0";
    }
    if (panelId) { const f = JSON.stringify([estados[panelId], Math.floor(horaDec(d)), todas.length, confirmando]); if (f !== firmaPanel) renderInfo(); }
  }
  function cambioDatos(tipo, r) {
    refrescarEstados(); renderInfo(); renderLista();
  }

  /* ---------- 5.13 Panel de detalle ---------- */
  let focoAnterior = null;
  function abrirPanel(id, { enfocar = true } = {}) {
    const e = porId(id); if (!e) return false;
    if (panelId !== id) { formAbierto = false; confirmando = null; }
    focoAnterior = document.activeElement;
    panelId = id; el.panel.hidden = false;
    el.pEyebrow.textContent = `${TIPO_TXT[e.tipo]} · hasta ${e.capacidad} personas`; el.pTitulo.textContent = e.nombre;
    renderInfo(); renderAccion();
    if (enfocar) el.pTitulo.focus({ preventScroll: true });
    anunciar(`${e.nombre}. ${estados[id]?.txt ?? ""}`);
    return true;
  }
  function cerrarPanel() {
    if (!panelId) return; panelId = null; formAbierto = false; confirmando = null; el.panel.hidden = true;
    (focoAnterior && document.contains(focoAnterior) && focoAnterior !== document.body ? focoAnterior : lienzo).focus({ preventScroll: true });
  }
  function htmlLinea(id) {
    const f = hoyISO(), h = horaDec(), total = cfg.cierra - cfg.abre, pct = v => ((v - cfg.abre) / total * 100).toFixed(2);
    const bloques = agendaDe(id).filter(b => b.tipo === "ocupado").map(b => `<span class="ee-bloque" style="left:${pct(b.inicio)}%;width:${(b.fin - b.inicio) / total * 100}%"></span>`).join("");
    const pasado = acotar(h, cfg.abre, cfg.cierra), marcas = [];
    for (let k = cfg.abre; k <= cfg.cierra; k += 3) marcas.push(`<span style="left:${pct(k)}%">${String(k).padStart(2, "0")}</span>`);
    return `<div class="ee-linea" role="img" aria-label="Línea de tiempo de hoy"><span class="ee-pasado" style="width:${pct(pasado)}%"></span>${bloques}${h >= cfg.abre && h < cfg.cierra ? `<i class="ee-ahora" style="left:${pct(h)}%"></i>` : ""}</div><div class="ee-horas" aria-hidden="true">${marcas.join("")}</div>`;
  }
  function renderInfo() {
    if (!panelId) return;
    const e = porId(panelId), st = estados[panelId] || estadoDe(panelId);
    firmaPanel = JSON.stringify([estados[panelId], Math.floor(horaDec()), todas.length, confirmando]);
    const items = agendaDe(panelId).map(b => {
      const rango = `${hh(b.inicio)} – ${hh(b.fin)}`, ahora = horaDec() >= b.inicio && horaDec() < b.fin;
      if (b.tipo === "libre") return `<li class="ee-ag ee-ag--libre${ahora ? " ee-ag--ahora" : ""}"><span class="ee-ag-h">${rango}</span><span class="ee-ag-q">Libre</span>${ahora ? '<span class="ee-etq ee-etq--ahora">Ahora</span>' : ""}</li>`;
      const r = b.reserva, mia = r.dueno === dueno && !r.ejemplo, puede = mia && !yaTermino(r);
      const conf = confirmando === r.id;
      return `<li class="ee-ag ee-ag--ocupado${ahora ? " ee-ag--ahora" : ""}${yaTermino(r) ? " ee-ag--pasado" : ""}"><span class="ee-ag-h">${rango}</span>
        <span class="ee-ag-q"><b>${esc(r.nombre)}</b> · ${r.personas} ${r.personas === 1 ? "persona" : "personas"} ${mia ? '<span class="ee-etq ee-etq--tuya">Tuya</span>' : ""}${r.ejemplo ? '<span class="ee-etq">Ejemplo</span>' : ""}</span>
        ${ahora ? '<span class="ee-etq ee-etq--ahora">Ahora</span>' : ""}
        ${puede ? (conf ? `<span class="ee-conf" role="group" aria-label="Confirmar cancelación"><span>¿Cancelar esta reserva?</span><button type="button" class="ee-btn ee-btn--peligro ee-btn--chico" data-a="cancelarSi" data-id="${esc(r.id)}">Sí, cancelar</button><button type="button" class="ee-btn ee-btn--sec ee-btn--chico" data-a="cancelarNo">No</button></span>`
          : `<button type="button" class="ee-btn ee-btn--sec ee-btn--chico ee-ag-cancel" data-a="cancelar" data-id="${esc(r.id)}" aria-label="Cancelar reserva de ${esc(r.nombre)}, ${rango}">Cancelar reserva</button>`) : ""}</li>`;
    }).join("");
    el.pInfo.innerHTML = `<p class="ee-det">${esc(e.detalle || "")}</p>
      <p class="ee-estado ee-estado--${st.e}"><span class="ee-dot"></span>${esc(st.txt)}</p>
      <h3 class="ee-sub">Hoy</h3>${htmlLinea(panelId)}
      <h3 class="ee-sub">Agenda</h3><ol class="ee-agenda">${items}</ol>`;
  }
  function renderAccion() {
    if (!panelId) return;
    const e = porId(panelId), st = estados[panelId] || estadoDe(panelId);
    el.pAccion.classList.toggle("ee-accion--fija", !formAbierto);   // botones siempre visibles; el formulario se desplaza con el panel
    if (!formAbierto) {
      const libres = iniciosDisponibles(panelId).length;
      const bloqueado = st.e === "cerrado" || !libres;
      el.pAccion.innerHTML = `<div class="ee-fila-botones">
        <button type="button" class="ee-btn" data-a="reservar" ${bloqueado ? "disabled" : ""}>Reservar ${esc(e.nombre)}</button>
        <button type="button" class="ee-btn ee-btn--sec" data-a="ir">Ir allí</button></div>
        ${bloqueado ? `<p class="ee-nota">${st.e === "cerrado" ? esc(st.txt) + "." : "Ya no quedan horas libres hoy."}</p>` : ""}`;
      return;
    }
    const inicios = iniciosDisponibles(panelId);
    el.pAccion.innerHTML = `<form class="ee-form" novalidate>
      <h3 class="ee-sub" tabindex="-1" id="eeFormTit">Reservar ${esc(e.nombre)}</h3>
      <div class="ee-campo"><label for="eeNombre">Nombre del grupo o responsable</label><input id="eeNombre" name="nombre" maxlength="40" autocomplete="off" aria-describedby="eeNombreErr"><small class="ee-err" id="eeNombreErr"></small></div>
      <div class="ee-campos">
        <div class="ee-campo"><label for="eePersonas">Personas (1 a ${e.capacidad})</label><input id="eePersonas" name="personas" type="number" inputmode="numeric" min="1" max="${e.capacidad}" value="1" aria-describedby="eePersonasErr"><small class="ee-err" id="eePersonasErr"></small></div>
        <div class="ee-campo"><label for="eeInicio">Hora de inicio</label><select id="eeInicio" name="inicio" aria-describedby="eeInicioErr"><option value="">Elige…</option>${inicios.map(h => `<option value="${h}">${hh(h)}</option>`).join("")}</select><small class="ee-err" id="eeInicioErr"></small></div>
      </div>
      <div class="ee-campo"><label for="eeDuracion">Duración</label><select id="eeDuracion" name="duracion" disabled aria-describedby="eeDuracionErr"><option value="">Elige primero la hora</option></select><small class="ee-err" id="eeDuracionErr"></small></div>
      <p class="ee-resumen" id="eeResumen" aria-live="polite"></p>
      <div class="ee-fila-botones"><button type="submit" class="ee-btn">Confirmar reserva</button><button type="button" class="ee-btn ee-btn--sec" data-a="volver">Volver</button></div></form>`;
    const f = el.pAccion.querySelector("form"), ini = f.inicio, dur = f.duracion, res = el.pAccion.querySelector("#eeResumen");
    const resumen = () => { res.textContent = ini.value && dur.value ? `Se reservará ${e.nombre} de ${hh(+ini.value)} a ${hh(+ini.value + +dur.value)}.` : ""; };
    ini.addEventListener("change", () => {
      const ds = ini.value ? duracionesPosibles(panelId, +ini.value) : [];
      dur.innerHTML = ds.length ? ds.map(n => `<option value="${n}">${n} ${n === 1 ? "hora" : "horas"}</option>`).join("") : '<option value="">Elige primero la hora</option>';
      dur.disabled = !ds.length; resumen();
    });
    dur.addEventListener("change", resumen);
    f.addEventListener("submit", ev => { ev.preventDefault(); enviarForm(f); });
    el.pAccion.querySelector("#eeFormTit").focus({ preventScroll: true });
  }
  function enviarForm(f) {
    f.querySelectorAll(".ee-err").forEach(s => { s.textContent = ""; }); f.querySelectorAll("[aria-invalid]").forEach(i => i.removeAttribute("aria-invalid"));
    const r = crearReserva({ espacio: panelId, nombre: f.nombre.value, personas: f.personas.value, inicio: f.inicio.value, duracion: f.duracion.value });
    if (!r.ok) {
      const orden = ["nombre", "personas", "inicio", "duracion"]; let primero = null;
      for (const k of orden) if (r.errores[k]) { const inp = f.elements[k], msg = f.querySelector("#ee" + k[0].toUpperCase() + k.slice(1) + "Err"); inp.setAttribute("aria-invalid", "true"); msg.textContent = r.errores[k]; primero = primero || inp; }
      if (r.errores.general || r.errores.espacio) avisar(r.errores.general || r.errores.espacio, "error");
      if (primero) primero.focus(); anunciar("Revisa los campos marcados con error.");
      return;
    }
    const x = r.reserva, e = porId(x.espacio);
    formAbierto = false; resaltado = { id: e.id, hasta: performance.now() + 4000 };
    el.pAccion.innerHTML = `<div class="ee-exito" role="status"><span class="ee-exito-ico" aria-hidden="true">✓</span><h3 class="ee-sub" tabindex="-1" id="eeOk">¡Reserva confirmada!</h3>
      <p>${esc(e.nombre)}, de ${hh(x.inicio)} a ${hh(x.inicio + x.duracion)}.<br>Código <b class="ee-codigo">${esc(x.id)}</b></p>
      <div class="ee-fila-botones"><button type="button" class="ee-btn" data-a="volver">Listo</button></div></div>`;
    el.pAccion.querySelector("#eeOk").focus({ preventScroll: true });
    avisar(`Reserva confirmada: ${e.nombre}, de ${hh(x.inicio)} a ${hh(x.inicio + x.duracion)}. Código ${x.id}.`);
    anunciar(`Reserva confirmada. ${e.nombre}, de ${hh(x.inicio)} a ${hh(x.inicio + x.duracion)}. Código ${x.id}.`);
  }

  raiz.addEventListener("click", ev => {
    const b = ev.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "vista") alternarVista();
    else if (a === "mas") cambiarZoom(1.2); else if (a === "menos") cambiarZoom(1 / 1.2);
    else if (a === "avatar") abrirAvatar(); else if (a === "lista") abrirLista(); else if (a === "ayuda") abrirAyuda();
    else if (a === "cerrarPanel") cerrarPanel();
    else if (a === "reservar") { formAbierto = true; renderAccion(); }
    else if (a === "volver") { formAbierto = false; renderAccion(); el.pAccion.querySelector("button")?.focus(); }
    else if (a === "ir") { const e = porId(panelId); if (irAPunto(e.ancla[0], e.ancla[1])) { avisar(`Caminando hacia ${e.nombre}…`); } if (innerWidth < 720) cerrarPanel(); }
    else if (a === "cancelar") { confirmando = b.dataset.id; renderInfo(); raiz.querySelector('[data-a="cancelarSi"]')?.focus(); }
    else if (a === "cancelarNo") { const id = confirmando; confirmando = null; renderInfo(); raiz.querySelector(`[data-a="cancelar"][data-id="${id}"]`)?.focus(); }
    else if (a === "cancelarSi") {
      const r = cancelarReserva(b.dataset.id); confirmando = null;
      if (r.ok) { avisar(`Reserva cancelada: ${describir(r.reserva)}.`); anunciar("Reserva cancelada. El horario quedó libre."); } else avisar(r.error, "error");
      renderInfo(); renderAccion(); el.pTitulo.focus({ preventScroll: true });
    }
    else if (a === "ver") { cerrarDlg(el.dlgLista); abrirPanel(b.dataset.id); }
    else if (a === "caminar") { const e = porId(b.dataset.id); cerrarDlg(el.dlgLista); if (irAPunto(e.ancla[0], e.ancla[1])) avisar(`Caminando hacia ${e.nombre}…`); }
    else if (a === "cerrarDlg") cerrarDlg(b.closest("dialog"));
    else if (a === "ejemplos") { ejemplosOn = !ejemplosOn; escribir(cfg.claveEjemplos, ejemplosOn); recalcular(); refrescarEstados(); renderInfo(); renderLista(); abrirAyuda(true); }
  }, sig);

  /* ---------- 5.14 Vista 2D / 3D ---------- */
  function alternarVista() {
    modo = modo === "iso" ? "2d" : "iso"; escribir(cfg.claveVista, modo);
    zoom = zoomBase(); cam.px = undefined; actualizarBotonVista();
    anunciar(modo === "iso" ? "Vista 3D isométrica" : "Vista 2D en planta");
  }
  function actualizarBotonVista() {
    const b = raiz.querySelector('[data-a="vista"]'); b.textContent = modo === "iso" ? "Vista: 3D" : "Vista: 2D"; b.setAttribute("aria-pressed", modo === "2d" ? "true" : "false");
    b.setAttribute("aria-label", modo === "iso" ? "Vista 3D. Cambiar a vista 2D en planta" : "Vista 2D. Cambiar a vista 3D");
  }
  actualizarBotonVista();

  /* ---------- 5.15 Diálogos ---------- */
  const cerrarDlg = d => { if (d && d.open) d.close(); };
  function abrirDlg(d) { if (d.open) return; if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  [el.dlgAvatar, el.dlgLista, el.dlgAyuda].forEach(d => {
    d.addEventListener("click", ev => { if (ev.target === d) d.close(); }, sig);
    d.addEventListener("close", () => lienzo.focus({ preventScroll: true }), sig);
  });

  // ---- Ayuda
  function abrirAyuda(sinAbrir) {
    el.dlgAyuda.innerHTML = `<div class="ee-dlg-caja"><div class="ee-dlg-cab"><h2 id="eeAyTit">Cómo usar el mapa</h2><button type="button" class="ee-cerrar" data-a="cerrarDlg" aria-label="Cerrar ayuda">&times;</button></div>
      <h3 class="ee-sub">Moverte</h3>
      <ul class="ee-ayuda"><li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o las flechas mueven a tu personaje (<kbd>Shift</kbd> para correr).</li>
      <li>Toca o haz clic en el piso para caminar hasta ahí; en el celular usa el joystick.</li>
      <li><kbd>E</kbd> abre el espacio más cercano. También puedes tocar su nombre o el mueble.</li>
      <li><kbd>V</kbd> cambia entre vista 3D y 2D · <kbd>+</kbd> <kbd>−</kbd> o la rueda hacen zoom · <kbd>Esc</kbd> cierra el detalle.</li></ul>
      <h3 class="ee-sub">Colores</h3>
      <ul class="ee-leyenda"><li><span class="ee-dot ee-dot--libre"></span> <b>Libre</b>: se puede apartar ahora.</li><li><span class="ee-dot ee-dot--ocupado"></span> <b>Ocupado</b>: ya está reservado; verás a las personas sentadas.</li><li><span class="ee-dot ee-dot--cerrado"></span> <b>Cerrado</b>: fuera del horario (${hh(cfg.abre)} a ${hh(cfg.cierra)}).</li><li>★ marca un espacio donde tú tienes una reserva.</li></ul>
      <h3 class="ee-sub">Reservas</h3>
      <p class="ee-nota">Hasta ${cfg.maxHoras} horas por reserva, en bloques de una hora. Se guardan solo en este navegador y puedes cancelarlas desde la agenda del espacio.</p>
      ${cfg.ejemplos ? `<p class="ee-nota">La ocupación que ves de otros grupos es <b>de ejemplo</b>: <button type="button" class="ee-btn ee-btn--sec ee-btn--chico" data-a="ejemplos">${ejemplosOn ? "Quitar ejemplos" : "Mostrar ejemplos"}</button></p>` : ""}
      <div class="ee-fila-botones"><button type="button" class="ee-btn" data-a="cerrarDlg">Entendido</button></div></div>`;
    abrirDlg(el.dlgAyuda);
  }

  // ---- Lista accesible de espacios
  function renderLista() {
    if (!el.dlgLista.open && el.dlgLista.dataset.lista !== "1") return;
    const grupos = [["cuarto", "Cuartos"], ["mesa", "Mesas"], ["banca", "Bancas"]];
    el.dlgLista.innerHTML = `<div class="ee-dlg-caja"><div class="ee-dlg-cab"><h2 id="eeLiTit">Espacios</h2><button type="button" class="ee-cerrar" data-a="cerrarDlg" aria-label="Cerrar lista">&times;</button></div>
      ${grupos.map(([t, tt]) => `<h3 class="ee-sub">${tt}</h3><ul class="ee-lista">${espacios.filter(e => e.tipo === t).map(e => { const st = estados[e.id] || estadoDe(e.id); return `<li><div><b>${esc(e.nombre)}</b><span class="ee-lista-d">${esc(e.detalle || "")} · hasta ${e.capacidad}</span><span class="ee-estado ee-estado--${st.e}"><span class="ee-dot"></span>${esc(st.txt)}</span></div><div class="ee-lista-b"><button type="button" class="ee-btn ee-btn--chico" data-a="ver" data-id="${e.id}" aria-label="Ver ${esc(e.nombre)}">Ver</button><button type="button" class="ee-btn ee-btn--sec ee-btn--chico" data-a="caminar" data-id="${e.id}" aria-label="Ir a ${esc(e.nombre)}">Ir</button></div></li>`; }).join("")}</ul>`).join("")}</div>`;
  }
  function abrirLista() { el.dlgLista.dataset.lista = "1"; renderLista(); abrirDlg(el.dlgLista); }
  el.dlgLista.addEventListener("close", () => { el.dlgLista.dataset.lista = ""; }, sig);

  // ---- Apariencia
  let borrador = null, animPrev = 0;
  function abrirAvatar() {
    borrador = { ...avatar };
    const sw = (campo, lista, etq) => `<fieldset class="ee-fs"><legend>${etq}</legend><div class="ee-sw">${lista.map(col => `<label class="ee-swatch" title="${col}"><input type="radio" name="${campo}" value="${col}" ${borrador[campo].toLowerCase() === col.toLowerCase() ? "checked" : ""}><span style="background:${col}"></span><i class="ee-sr">${col}</i></label>`).join("")}<label class="ee-swatch ee-swatch--otro" title="Otro color"><input type="color" name="${campo}-otro" value="${borrador[campo]}" aria-label="Otro color para ${etq.toLowerCase()}"><span>+</span></label></div></fieldset>`;
    const opt = (campo, lista) => lista.map(([v, t]) => `<option value="${v}" ${borrador[campo] === v ? "selected" : ""}>${t}</option>`).join("");
    el.dlgAvatar.innerHTML = `<form class="ee-dlg-caja" method="dialog" novalidate><div class="ee-dlg-cab"><h2 id="eeAvTit">Mi apariencia</h2><button type="button" class="ee-cerrar" data-a="cerrarDlg" aria-label="Cerrar">&times;</button></div>
      <div class="ee-av">
        <div class="ee-av-prev"><canvas width="220" height="260" aria-label="Vista previa de tu personaje" role="img"></canvas>
          <div class="ee-fila-botones"><button type="button" class="ee-btn ee-btn--sec ee-btn--chico" data-av="azar">Sorpréndeme</button><button type="button" class="ee-btn ee-btn--sec ee-btn--chico" data-av="reset">Restablecer</button></div></div>
        <div class="ee-av-campos">
          <div class="ee-campo"><label for="avNombre">Nombre (se ve sobre tu personaje)</label><input id="avNombre" maxlength="16" value="${esc(borrador.nombre)}" autocomplete="off"></div>
          <div class="ee-campos"><div class="ee-campo"><label for="avPeinado">Peinado</label><select id="avPeinado">${opt("peinado", PEINADOS)}</select></div>
          <div class="ee-campo"><label for="avAcc">Accesorio</label><select id="avAcc">${opt("accesorio", ACCESORIOS)}</select></div></div>
          ${sw("piel", PIEL, "Tono de piel")}${sw("pelo", PELO, "Color de cabello")}${sw("ropa", ROPA, "Playera")}${sw("pantalon", PANT, "Pantalón")}
          <label class="ee-check"><input type="checkbox" id="avMochila" ${borrador.mochila ? "checked" : ""}> Mochila</label>
        </div></div>
      <div class="ee-fila-botones"><button type="submit" class="ee-btn" data-av="guardar">Guardar</button><button type="button" class="ee-btn ee-btn--sec" data-a="cerrarDlg">Cancelar</button></div></form>`;
    const f = el.dlgAvatar.querySelector("form"), cv = f.querySelector("canvas"), g = cv.getContext("2d");
    let dirPrev = "down", t0 = performance.now();
    const pintar = () => {
      g.clearRect(0, 0, cv.width, cv.height);
      const gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, "#eef3ee"); gr.addColorStop(1, "#d9e5dc"); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = "rgba(120,110,90,.18)"; g.beginPath(); g.ellipse(110, 215, 70, 22, 0, 0, TAU); g.fill();
      dibujarAvatar(g, borrador, { x: 110, y: 215, dir: dirPrev, esc: 3.1, paso: (performance.now() - t0) / 140, mov: caminando });
      if (el.dlgAvatar.open) animPrev = requestAnimationFrame(pintar);
    };
    let caminando = false;
    f.addEventListener("input", ev => {
      const n = ev.target.name || ev.target.id;
      if (ev.target.type === "radio") borrador[n] = ev.target.value;
      else if (n && n.endsWith("-otro")) { borrador[n.replace("-otro", "")] = ev.target.value; f.querySelectorAll(`input[name="${n.replace("-otro", "")}"]`).forEach(r => { r.checked = false; }); }
      else if (n === "avNombre") borrador.nombre = ev.target.value;
      else if (n === "avPeinado") borrador.peinado = ev.target.value;
      else if (n === "avAcc") borrador.accesorio = ev.target.value;
      else if (n === "avMochila") borrador.mochila = ev.target.checked;
    });
    f.addEventListener("click", ev => {
      const b = ev.target.closest("[data-av]"); if (!b) return;
      if (b.dataset.av === "azar") { borrador = { ...avatarAleatorio(Date.now()), nombre: borrador.nombre }; sincronizar(); }
      if (b.dataset.av === "reset") { borrador = { ...AVATAR_BASE, nombre: borrador.nombre }; sincronizar(); }
    });
    f.addEventListener("submit", ev => { ev.preventDefault(); avatar = sanearAvatar(borrador); escribir(cfg.claveAvatar, avatar); cerrarDlg(el.dlgAvatar); avisar("Apariencia guardada."); });
    // Girar la vista previa con las flechas / clic
    cv.tabIndex = 0;
    cv.addEventListener("click", () => { dirPrev = { down: "left", left: "up", up: "right", right: "down" }[dirPrev]; });
    cv.addEventListener("keydown", ev => { const m = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[ev.key]; if (m) { dirPrev = m; ev.preventDefault(); } });
    // Refleja el borrador en los controles (para «Sorpréndeme» y «Restablecer») sin cerrar el diálogo
    const sincronizar = () => {
      f.querySelector("#avNombre").value = borrador.nombre;
      f.querySelector("#avPeinado").value = borrador.peinado;
      f.querySelector("#avAcc").value = borrador.accesorio;
      f.querySelector("#avMochila").checked = borrador.mochila;
      ["piel", "pelo", "ropa", "pantalon"].forEach(campo => {
        f.querySelectorAll(`input[name="${campo}"]`).forEach(r => { r.checked = r.value.toLowerCase() === borrador[campo].toLowerCase(); });
        f.querySelector(`input[name="${campo}-otro"]`).value = borrador[campo];
      });
    };
    abrirDlg(el.dlgAvatar); cancelAnimationFrame(animPrev); pintar(); f.querySelector("#avNombre").focus();
  }

  /* ---------- 5.16 Inicio ---------- */
  function estilosYaInyectados() { return document.getElementById("ee-estilos"); }
  refrescarEstados();
  ajustarLienzo();
  [el.dlgAvatar, el.dlgLista, el.dlgAyuda].forEach(d => d.addEventListener("cancel", () => {}, sig));
  raf = requestAnimationFrame(bucle);
  // Pista inicial
  if (leer(cfg.claveAvatar + ".visto", false) !== true) {          // la guía rápida se muestra solo la primera vez
    escribir(cfg.claveAvatar + ".visto", true);
    setTimeout(() => avisar("Muévete con WASD o las flechas. Pulsa E cerca de un espacio para reservarlo."), 600);
  }

  return {
    abrir: id => abrirPanel(id), cerrarPanel, irA: id => { const e = porId(id); return e ? irAPunto(e.ancla[0], e.ancla[1]) : false; },
    estado: id => estadoDe(id), reservar: d => crearReserva(d), cancelar: id => cancelarReserva(id),
    reservas: () => propias.map(r => ({ ...r })), espacios: () => espacios.map(e => ({ id: e.id, tipo: e.tipo, nombre: e.nombre, capacidad: e.capacidad })),
    jugador: () => ({ x: jug.x, y: jug.y, dir: jug.dir, mov: jug.mov, cercano: cercano && cercano.id }),
    teletransportar: (x, y) => { jug.x = x; jug.y = y; ruta = []; cam.px = undefined; },
    vista: v => { if (v && v !== modo) alternarVista(); return modo; },
    avatar: () => ({ ...avatar }),
    destruir() { cancelAnimationFrame(raf); ac.abort(); ro.disconnect(); raiz.innerHTML = ""; raiz.classList.remove("ee"); },
  };
}

/* ===================================================================================
   6. ESTILOS (con prefijo .ee- para no chocar con tu página)
   =================================================================================== */
function inyectarEstilos() {
  if (document.getElementById("ee-estilos")) return;
  const s = document.createElement("style"); s.id = "ee-estilos";
  s.textContent = `
  .ee { --ee-deep:#07301F; --ee-on:#EAF6EF; --ee-muted:#A5CDB7; --ee-acc:#86E3AE; --ee-card:#FFFFFF; --ee-bg:#EDF3EF; --ee-txt:#0E2218; --ee-txt2:#4F645A; --ee-bd:#D0DDD5; --ee-focus:#0A6B3C;
        --ee-libre:#1c8f55; --ee-ocup:#c23c36; --ee-cerr:#6b7a72; --ee-peligro:#9B2C2C;
        position:relative; width:100%; height:100%; overflow:hidden; color:var(--ee-txt); font-family:system-ui,-apple-system,"Segoe UI",sans-serif; background:#d8e4dc; -webkit-text-size-adjust:100%; }
  @media (prefers-color-scheme: dark){ .ee { --ee-card:#13261D; --ee-bg:#0B1611; --ee-txt:#EAF6EF; --ee-txt2:#A0B8AD; --ee-bd:#234435; --ee-focus:#6BE19B; --ee-libre:#3fd184; --ee-ocup:#f08a84; --ee-cerr:#9fb3a8; --ee-peligro:#C54B4B; background:#0b1611; } }
  .ee *, .ee *::before, .ee *::after { box-sizing:border-box; }
  .ee-lienzo { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none; cursor:crosshair; outline:none; }
  .ee-lienzo:focus-visible { outline:3px solid var(--ee-focus); outline-offset:-3px; }
  .ee button, .ee input, .ee select { font:inherit; }
  .ee :focus-visible { outline:3px solid var(--ee-focus); outline-offset:2px; }
  .ee-sr { position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
  .ee-hud { position:absolute; top:max(12px,env(safe-area-inset-top)); left:12px; right:12px; display:flex; justify-content:space-between; gap:12px; align-items:flex-start; pointer-events:none; }
  .ee-marca, .ee-reloj { pointer-events:auto; background:rgba(7,48,31,.9); color:var(--ee-on); border-radius:14px; padding:10px 14px; backdrop-filter:blur(6px); box-shadow:0 6px 20px rgba(0,0,0,.22); }
  .ee-eyebrow { margin:0 0 2px; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ee-muted); }
  .ee-marca h1 { margin:0; font-size:clamp(15px,2.6vw,20px); line-height:1.15; }
  .ee-reloj { display:flex; flex-direction:column; align-items:flex-end; gap:2px; text-align:right; }
  .ee-reloj b { font:600 26px ui-monospace,Menlo,monospace; line-height:1; }
  .ee-reloj > span:not(.ee-chip) { font-size:12px; color:var(--ee-muted); }
  .ee-chip { margin-top:4px; padding:2px 9px; border-radius:999px; font-size:11px; font-weight:700; background:rgba(255,255,255,.14); }
  .ee-chip[data-abierto="1"] { background:#1c8f55; color:#fff; } .ee-chip[data-abierto="0"] { background:#6b7a72; color:#fff; }
  .ee-controles { position:absolute; left:12px; bottom:max(12px,env(safe-area-inset-bottom)); display:flex; flex-wrap:wrap; gap:8px; max-width:calc(100% - 24px); }
  .ee-btn { -webkit-appearance:none; appearance:none; cursor:pointer; min-height:44px; padding:10px 16px; border-radius:12px; font-weight:600; font-size:14px; color:var(--ee-on); background:var(--ee-deep); border:1.5px solid var(--ee-deep); touch-action:manipulation; box-shadow:0 4px 14px rgba(0,0,0,.18); }
  .ee-btn:hover { background:var(--ee-acc); color:#04150d; border-color:var(--ee-acc); }
  .ee-btn:disabled { cursor:not-allowed; opacity:.55; background:var(--ee-bg); color:var(--ee-txt2); border-color:var(--ee-bd); box-shadow:none; }
  .ee-btn--sec { color:var(--ee-txt); background:var(--ee-card); border-color:var(--ee-bd); }
  .ee-btn--sec:hover { background:var(--ee-bg); color:var(--ee-txt); border-color:var(--ee-acc); }
  .ee-btn--peligro { background:var(--ee-peligro); border-color:var(--ee-peligro); color:#fff; } .ee-btn--peligro:hover { background:#7F2323; border-color:#7F2323; color:#fff; }
  .ee-btn--chico { min-height:40px; padding:6px 12px; font-size:13px; box-shadow:none; }
  .ee-btn--ico { min-width:44px; padding:10px 0; font-size:20px; line-height:1; }
  .ee-pista { position:absolute; left:50%; bottom:max(76px,calc(64px + env(safe-area-inset-bottom))); transform:translateX(-50%); padding:10px 18px; border-radius:999px; background:var(--ee-deep); color:var(--ee-on); font-weight:600; font-size:14px; box-shadow:0 8px 24px rgba(0,0,0,.3); cursor:pointer; white-space:nowrap; }
  .ee-pista[hidden], .ee-aviso[hidden], .ee-panel[hidden], .ee-joy[hidden] { display:none; }
  .ee kbd { font:inherit; font-size:.85em; padding:1px 7px; margin:0 1px; border-radius:6px; background:rgba(127,127,127,.16); border:1.5px solid rgba(127,127,127,.4); border-bottom-width:3px; }
  .ee-aviso { position:absolute; left:50%; top:max(84px,calc(72px + env(safe-area-inset-top))); transform:translateX(-50%); max-width:min(560px,calc(100% - 32px)); padding:12px 18px; border-radius:12px; background:var(--ee-deep); color:var(--ee-on); font-weight:600; font-size:14px; box-shadow:0 10px 30px rgba(0,0,0,.35); text-align:center; }
  .ee-aviso[data-tipo="error"] { background:#7F2323; }
  .ee-joy { position:absolute; right:18px; bottom:max(18px,env(safe-area-inset-bottom)); width:132px; height:132px; border-radius:50%; background:rgba(7,48,31,.55); border:2px solid rgba(255,255,255,.35); touch-action:none; display:grid; place-items:center; }
  .ee-joy i { width:54px; height:54px; border-radius:50%; background:rgba(234,246,239,.92); box-shadow:0 4px 12px rgba(0,0,0,.3); }
  .ee-panel { position:absolute; z-index:5; right:12px; top:max(96px,calc(84px + env(safe-area-inset-top))); bottom:84px; width:min(390px,calc(100% - 24px)); overflow:auto; background:var(--ee-card); color:var(--ee-txt); border:1.5px solid var(--ee-bd); border-radius:16px; padding:16px; box-shadow:0 20px 60px rgba(0,0,0,.35); overscroll-behavior:contain; }
  @media (max-width:720px){ .ee-panel { left:0; right:0; top:auto; bottom:0; width:100%; max-height:78%; border-radius:18px 18px 0 0; padding-bottom:max(16px,env(safe-area-inset-bottom)); } .ee-controles { max-width:calc(100% - 170px); } .ee-reloj b { font-size:20px; } .ee-marca { max-width:62%; } }
  .ee-panel-cab, .ee-dlg-cab { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .ee-panel h2, .ee-dlg h2 { margin:0; font-size:22px; line-height:1.1; }
  .ee-panel h2:focus-visible { outline:3px solid var(--ee-focus); outline-offset:4px; border-radius:6px; }
  .ee-cerrar { flex:none; width:44px; height:44px; cursor:pointer; font-size:24px; line-height:1; color:var(--ee-txt); background:var(--ee-bg); border:1.5px solid var(--ee-bd); border-radius:10px; }
  .ee-cerrar:hover { border-color:var(--ee-acc); }
  .ee-det { margin:10px 0 0; font-size:14px; color:var(--ee-txt2); }
  .ee-estado { display:inline-flex; align-items:center; gap:8px; margin:12px 0 0; padding:6px 12px; border-radius:999px; font-size:14px; font-weight:600; border:1.5px solid var(--ee-bd); background:var(--ee-bg); }
  .ee-estado--libre { border-color:var(--ee-libre); } .ee-estado--ocupado { border-color:var(--ee-ocup); } .ee-estado--cerrado { border-color:var(--ee-cerr); }
  .ee-dot { display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--ee-cerr); }
  .ee-estado--libre .ee-dot, .ee-dot--libre { background:var(--ee-libre); } .ee-estado--ocupado .ee-dot, .ee-dot--ocupado { background:var(--ee-ocup); } .ee-dot--cerrado { background:var(--ee-cerr); }
  .ee-sub { margin:20px 0 8px; font-size:13px; letter-spacing:.07em; text-transform:uppercase; color:var(--ee-txt2); }
  .ee-sub:focus-visible { outline:3px solid var(--ee-focus); outline-offset:4px; border-radius:6px; }
  .ee-linea { position:relative; height:22px; overflow:hidden; border-radius:8px; background:var(--ee-bg); border:1px solid var(--ee-bd); }
  .ee-pasado { position:absolute; inset:0 auto 0 0; background:rgba(120,120,120,.18); }
  .ee-bloque { position:absolute; top:0; bottom:0; background:repeating-linear-gradient(45deg,#E9A9A9 0 4px,#D98B8B 4px 8px); }
  .ee-ahora { position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:var(--ee-txt); }
  .ee-horas { position:relative; height:16px; margin-top:4px; font-size:11px; color:var(--ee-txt2); }
  .ee-horas span { position:absolute; transform:translateX(-50%); } .ee-horas span:first-child { transform:none; } .ee-horas span:last-child { transform:translateX(-100%); }
  .ee-agenda { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .ee-ag { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:6px 10px; padding:9px 12px; font-size:14px; border:1.5px solid var(--ee-bd); border-left-width:6px; border-radius:10px; background:var(--ee-card); }
  .ee-ag--libre { border-color:var(--ee-libre); } .ee-ag--ocupado { border-color:#D98B8B; } .ee-ag--pasado { opacity:.7; } .ee-ag--ahora { box-shadow:0 0 0 2px var(--ee-txt); }
  .ee-ag-h { font:13px ui-monospace,Menlo,monospace; white-space:nowrap; } .ee-ag-q { min-width:0; overflow-wrap:anywhere; }
  .ee-ag-cancel, .ee-conf { grid-column:1 / -1; } .ee-conf { display:flex; flex-wrap:wrap; align-items:center; gap:8px; font-weight:600; }
  .ee-etq { display:inline-block; margin-left:4px; padding:1px 8px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; border:1.5px solid var(--ee-bd); background:var(--ee-bg); }
  .ee-etq--tuya { border-color:var(--ee-acc); } .ee-etq--ahora { background:var(--ee-txt); color:var(--ee-bg); border-color:var(--ee-txt); }
  .ee-panel .ee-eyebrow { color:var(--ee-txt2); margin-bottom:8px; }
  .ee-accion { margin-top:18px; padding-top:14px; border-top:1.5px solid var(--ee-bd); }
  .ee-accion--fija { position:sticky; bottom:-16px; margin:18px -16px -16px; padding:12px 16px 16px; background:var(--ee-card); }
  .ee-fila-botones { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; } .ee-fila-botones .ee-btn { flex:1 1 auto; box-shadow:none; }
  .ee-nota { margin:10px 0 0; font-size:13px; color:var(--ee-txt2); }
  .ee-form .ee-sub { margin-top:0; }
  .ee-campo { margin-top:12px; } .ee-campo label { display:block; margin-bottom:5px; font-size:14px; font-weight:600; }
  .ee-campo input:not([type=color]):not([type=checkbox]), .ee-campo select { width:100%; min-height:44px; padding:9px 12px; font-size:16px; color:var(--ee-txt); background:var(--ee-card); border:1.5px solid var(--ee-bd); border-radius:10px; }
  .ee-campo [aria-invalid="true"] { border-color:#B84A4A; background:rgba(184,74,74,.12); }
  .ee-err { display:block; margin-top:5px; font-size:13px; font-weight:600; color:#B33A3A; } @media (prefers-color-scheme: dark){ .ee-err { color:#F4A6A6; } }
  .ee-err:not(:empty)::before { content:"⚠ "; }
  .ee-campos { display:grid; grid-template-columns:1fr 1fr; gap:0 10px; }
  .ee-resumen { min-height:1.2em; margin:12px 0 0; font-size:14px; font-weight:600; }
  .ee-exito { text-align:center; } .ee-exito-ico { display:inline-grid; place-items:center; width:52px; height:52px; font-size:28px; font-weight:700; color:#EAF6EF; background:#0A7A45; border-radius:50%; }
  .ee-exito .ee-sub { margin:10px 0 6px; font-size:16px; } .ee-codigo { font-family:ui-monospace,Menlo,monospace; letter-spacing:.05em; }
  .ee-dlg { width:min(640px,calc(100% - 24px)); max-height:calc(100dvh - 24px); padding:0; border:none; border-radius:18px; color:var(--ee-txt); background:var(--ee-card); box-shadow:0 30px 80px rgba(0,0,0,.5); }
  .ee-dlg::backdrop { background:rgba(0,0,0,.55); } .ee-dlg-caja { padding:20px; }
  .ee-ayuda, .ee-leyenda { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:8px; font-size:14px; } .ee-leyenda { list-style:none; padding:0; } .ee-leyenda li { display:flex; gap:8px; align-items:center; }
  .ee-lista { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .ee-lista li { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 12px; border:1.5px solid var(--ee-bd); border-radius:12px; }
  .ee-lista b { display:block; } .ee-lista-d { display:block; font-size:13px; color:var(--ee-txt2); } .ee-lista .ee-estado { margin-top:6px; font-size:13px; padding:3px 10px; } .ee-lista-b { display:flex; gap:6px; flex:none; }
  .ee-av { display:grid; grid-template-columns:230px 1fr; gap:18px; margin-top:12px; } @media (max-width:640px){ .ee-av { grid-template-columns:1fr; } }
  .ee-av-prev canvas { display:block; width:100%; max-width:230px; margin:0 auto; border-radius:14px; border:1.5px solid var(--ee-bd); background:#e3ece5; }
  .ee-av-prev .ee-fila-botones { justify-content:center; }
  .ee-fs { margin:12px 0 0; padding:0; border:0; } .ee-fs legend { padding:0; margin-bottom:6px; font-size:14px; font-weight:600; }
  .ee-sw { display:flex; flex-wrap:wrap; gap:8px; }
  .ee-swatch { position:relative; display:block; width:34px; height:34px; cursor:pointer; }
  .ee-swatch input { position:absolute; inset:0; opacity:0; width:100%; height:100%; margin:0; cursor:pointer; }
  .ee-swatch span { display:grid; place-items:center; width:100%; height:100%; border-radius:50%; border:2px solid var(--ee-bd); font-weight:700; color:var(--ee-txt); }
  .ee-swatch input:checked + span { border-color:var(--ee-txt); box-shadow:0 0 0 2px var(--ee-card), 0 0 0 4px var(--ee-txt); }
  .ee-swatch input:focus-visible + span { outline:3px solid var(--ee-focus); outline-offset:3px; }
  .ee-swatch--otro span { background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red); color:#fff; text-shadow:0 0 3px #000; }
  .ee-swatch--otro input { padding:0; border:0; }
  .ee-check { display:flex; align-items:center; gap:10px; margin-top:14px; font-weight:600; min-height:44px; } .ee-check input { width:22px; height:22px; }
  @media (prefers-reduced-motion: reduce){ .ee * { transition:none !important; animation:none !important; } }
  `;
  document.head.appendChild(s);
}

global.EspacioExplorable = { montar, MUNDO_TECMILENIO, dibujarAvatar, AVATAR_BASE, version: "1.0.0" };
})(window);

/* Arranque de esta página */
window.mapa = EspacioExplorable.montar(document.getElementById("app"));
