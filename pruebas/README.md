# Pruebas automatizadas · Reserva de Cubículos

Pruebas de la página que está en `static/` (`index.html`, `Style.css`, `Script.js`).
Cubren dos tareas del tablero:

| Tarea | Qué prueba | Dónde está | Cómo se corre |
| --- | --- | --- | --- |
| **T46** (E4-59) | El **flujo de reservas** en un navegador real: apartar, revisar, confirmar, cancelar, deshacer, liberar. | `e2e/` | `npm run flujo` |
| **T47** (E4-60) | La **matriz de reglas de negocio**: 104 casos de horario, aforo, choques, permisos y datos guardados. | `matriz/` | `npm run matriz` |

El resultado de T47 también se publica como documento legible: **[`MATRIZ_REGLAS.md`](MATRIZ_REGLAS.md)**.

## Qué necesitas

- **Node.js 22 o más nuevo** (`node --version` para revisarlo).
- Nada más: la matriz usa el `node --test` que ya viene con Node, y el navegador lo baja Playwright.

## Primera vez (PowerShell, en la carpeta del repositorio)

```powershell
cd pruebas
npm install
npm run preparar     # baja el Chromium que usan las pruebas (~150 MB, una sola vez)
```

## Cada vez que quieras probar

```powershell
cd pruebas
npm test             # corre las dos suites: matriz (T47) y flujo (T46)
```

O por separado:

```powershell
npm run matriz       # solo las reglas de negocio (rápido, sin navegador)
npm run flujo        # solo el flujo en el navegador
npm run matriz:doc   # regenera MATRIZ_REGLAS.md
npm run mutantes     # comprueba que las pruebas sí detectan fallas
```

Si algo del flujo falla, Playwright guarda la captura y la traza del momento exacto:

```powershell
npm run flujo:reporte
```

## Cómo están armadas

```
pruebas/
├─ matriz/
│  ├─ datos.js          ← las 104 filas de la matriz: regla, escenario y resultado esperado
│  ├─ ejecutor.js        ← monta el escenario, ejecuta la acción y compara
│  ├─ cargar-app.js      ← carga Script.js aislado, con localStorage y hora de mentira
│  ├─ grupos.js          ← agrupa las filas por tema
│  ├─ matriz.test.js     ← una prueba por fila
│  └─ generar-doc.js     ← escribe MATRIZ_REGLAS.md
├─ e2e/
│  ├─ ayudas.js          ← abrir la página con hora simulada y reservas sembradas
│  └─ flujo-reservas.spec.js  ← 21 recorridos completos
├─ ayudas/
│  ├─ ruta-app.js        ← encuentra la carpeta de la página
│  └─ servidor.js        ← servidor estático mínimo (para que sea http://, no file://)
├─ mutantes/
│  └─ probar-mutantes.js ← rompe el código a propósito y revisa que alguna prueba falle
└─ MATRIZ_REGLAS.md      ← generado, no editar a mano
```

**Una sola fuente de verdad.** Las pruebas de T47 y el documento `MATRIZ_REGLAS.md` salen
del mismo archivo (`matriz/datos.js`). Si una regla cambia en el código y la fila no se
actualiza, la prueba falla; y el documento no puede quedar desactualizado porque se vuelve
a generar de ahí mismo.

**La hora siempre es la misma.** Las dos suites trabajan con una hora simulada: lunes 16 de
noviembre de 2026, zona `America/Monterrey`. Así los casos de «esa hora ya pasó», «ya cerró»
o «liberar a media reserva» dan el mismo resultado hoy, mañana y en la madrugada.

**No se toca la página.** Las pruebas no modifican nada de `static/`: la leen, la sirven y la
recorren. Tampoco usan la base de datos del navegador de verdad: cada prueba arranca con un
almacenamiento limpio.

## Probar otra copia de la página

Por omisión se prueba `../static`. Con `APP_DIR` se puede apuntar a otra carpeta
(por ejemplo, para comparar con una versión anterior):

```powershell
$env:APP_DIR="../otra-carpeta/static"; npm test
$env:APP_DIR=""                        # para volver a lo normal
```

## ¿Y quién prueba a las pruebas?

`npm run mutantes` hace 12 cambios dañinos en una copia de `Script.js` —permitir reservas de
3 horas, no detectar horarios que se traslapan, dejar que cualquiera cancele reservas ajenas,
saltarse el paso de revisar antes de confirmar…— y revisa que alguna prueba se dé cuenta de
cada uno. Hoy detecta los 12. Es la forma de saber que las pruebas de verdad sirven y no solo
pasan en verde.
