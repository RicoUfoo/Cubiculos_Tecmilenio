# Reserva de Cubículos

Sistema web para consultar la disponibilidad y reservar los cubículos de una sala de estudio. Proyecto Scrum de Tecmilenio.

Es una página estática: solo HTML, CSS y JavaScript. No necesita servidor, base de datos ni registro de usuarios.

## Demo

https://ricoufoo.github.io/Cubiculos_Tecmilenio/

## Funcionalidades

- Plano de 5 cubículos con estado en vivo: libre, ocupado o cerrado.
- Horario de operación configurable (8:00 a 20:00) con franjas de una hora.
- Reloj y fecha en vivo con formato es-MX (zona America/Monterrey).
- Cuadrícula de franjas por cubículo y línea de tiempo diaria de ocupación.
- Panel de detalle con agenda cronológica del día.
- Reserva en pocos pasos: grupo, personas (1 a 3), hora de inicio y duración (máx. 2 h).
- Validaciones: horario, conflictos de agenda, horas ya transcurridas y un grupo no puede estar en dos cubículos a la vez.
- Cancelación de reservas propias con confirmación y opción de deshacer (también con Ctrl/⌘ + Z).
- Liberación inmediata del cubículo cuando terminas antes.
- Persistencia local (localStorage) con esquema versionado, migraciones, saneamiento al iniciar y depuración de reservas vencidas.
- Sincronización entre pestañas.
- Diseño adaptable (mobile-first), tema claro/oscuro (sistema o manual).
- Operación completa por teclado y compatibilidad con lectores de pantalla.

## Estructura

```
index.html   Estructura de la página
Style.css    Estilos, temas y puntos de ruptura
Script.js    Lógica, organizada en módulos:
             Config, Mensajes, Identidad, Modelo, Reglas,
             Sincronizacion, Almacen, GestionTema, Dialogo,
             Vista, FormReserva, Confirmacion, CancelarReserva,
             Deshacer, LiberarCubiculo, NavegacionFranjas, App
```

## Cómo ejecutarlo en local

1. Clona el repositorio:
   ```
   git clone https://github.com/RicoUfoo/Cubiculos_Tecmilenio.git
   ```
2. Abre `index.html` en el navegador (doble clic), o sirve la carpeta con cualquier servidor estático.

## Configuración

Los parámetros están en el objeto `Config` al inicio de `Script.js`:

| Parámetro | Valor | Descripción |
|---|---|---|
| `ABRE` / `CIERRA` | 8 / 20 | Horario de operación |
| `MAX_HORAS` | 2 | Duración máxima por reserva |
| `MAX_PERSONAS` | 3 | Aforo por cubículo |
| `N_CUBICULOS` | 5 | Número de cubículos |
| `REFRESCO_MS` | 15000 | Refresco automático de disponibilidad |

## Despliegue (GitHub Pages)

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`, y guarda.
4. Espera 1 o 2 minutos; el sitio queda en la URL de la sección Demo.

Nota: GitHub Pages distingue mayúsculas. Los archivos deben llamarse exactamente `index.html`, `Style.css` y `Script.js`.

## Notas de uso

- Las reservas se guardan en el navegador de cada persona; no hay servidor compartido.
- Solo se pueden cancelar o liberar las reservas hechas desde el mismo navegador.

## Equipo

Proyecto Scrum, Tecmilenio. Equipo de 5 integrantes.