# Matriz de pruebas de reglas de negocio

**Reserva de Cubículos · Tecmilenio** — tarea **T47 (E4-60)**

> Documento generado automáticamente desde `pruebas/matriz/datos.js`.
> No se edita a mano: se cambia la fila en ese archivo y se vuelve a correr `npm run matriz:doc`.

Generado el 2026-11-23 · 104 casos · 70 reglas distintas

## Para qué sirve

Cada fila de esta matriz es una regla del sistema escrita como un caso concreto:
qué había antes (**Dado**), qué se hace (**Cuando**) y qué tiene que pasar (**Entonces**).
Las mismas filas son las pruebas automatizadas que corren con `npm run matriz`,
así que este documento no puede quedar desactualizado respecto al código:
si una regla cambia y la fila no, la prueba falla.

Las reglas se prueban contra el código real de `static/Script.js`, cargado en un
entorno aislado con una hora simulada (lunes 16 de noviembre de 2026, zona
`America/Monterrey`), para que los casos de «ya cerró» o «esa hora ya pasó» sean
siempre reproducibles.

## Resumen

| Estado | Casos | Qué significa |
| --- | --- | --- |
| ✅ Se cumple | 103 | La página se comporta como dice la regla. |
| ⚠️ Desviación conocida | 1 | La regla está documentada pero el código todavía no la aplica. Ver «Desviaciones conocidas». |
| ❌ No se cumple | 0 | Falla sin estar documentada: hay que revisarla. |

| Grupo de reglas | Casos |
| --- | --- |
| [Horario de operación y franjas](#horario-de-operación-y-franjas) | 12 |
| [Duración y campos obligatorios](#duración-y-campos-obligatorios) | 8 |
| [Aforo y nombre del grupo](#aforo-y-nombre-del-grupo) | 11 |
| [Cubículo](#cubículo) | 2 |
| [Choques en el mismo cubículo](#choques-en-el-mismo-cubículo) | 6 |
| [Un grupo, un cubículo a la vez](#un-grupo-un-cubículo-a-la-vez) | 4 |
| [Creación de la reserva](#creación-de-la-reserva) | 2 |
| [Cancelación](#cancelación) | 6 |
| [Liberar antes de tiempo](#liberar-antes-de-tiempo) | 6 |
| [Deshacer una cancelación](#deshacer-una-cancelación) | 7 |
| [Horas y duraciones que se ofrecen](#horas-y-duraciones-que-se-ofrecen) | 9 |
| [Estado que muestra el cubículo](#estado-que-muestra-el-cubículo) | 5 |
| [Saneado de los datos guardados](#saneado-de-los-datos-guardados) | 18 |
| [Esquema guardado y migraciones](#esquema-guardado-y-migraciones) | 8 |

## Horario de operación y franjas

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-01 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-02 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 07:00 · 1 h | Error en **Hora de inicio**: «Solo se puede reservar dentro del horario de operación (08:00 – 20:00).» | ✅ |
| M-03 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 20:00 · 1 h | Error en **Hora de inicio**: «Solo se puede reservar dentro del horario de operación (08:00 – 20:00).» | ✅ |
| M-04 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 19:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-05 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 19:00 · 2 h | Error en **Duración**: «La reserva terminaría a las 21:00, después del cierre (20:00).» | ✅ |
| M-06 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · «10.5» · 1 h | Error en **Hora de inicio**: «Elige una hora de inicio válida.» | ✅ |
| M-07 | Horario de operación | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · «a las diez» · 1 h | Error en **Hora de inicio**: «Elige una hora de inicio válida.» | ✅ |
| M-08 | Horario de operación | Son las 20:00 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Error en **Hora de inicio**: «Ya cerró por hoy (horario 08:00 – 20:00). Vuelve mañana a partir de las 08:00.» | ✅ |
| M-09 | Horario de operación | Son las 07:00 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 08:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-10 | No se reserva en el pasado | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 09:00 · 1 h | Error en **Hora de inicio**: «Esa hora ya pasó. Elige una hora a partir de ahora.» | ✅ |
| M-11 | No se reserva en el pasado | Son las 10:59 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-12 | No se reserva en el pasado | Son las 11:00 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Error en **Hora de inicio**: «Esa hora ya pasó. Elige una hora a partir de ahora.» | ✅ |

## Duración y campos obligatorios

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-13 | Duración máxima de 2 horas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 2 h | Se acepta, sin errores. | ✅ |
| M-14 | Duración máxima de 2 horas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 3 h | Error en **Duración**: «Cada reserva puede durar como máximo 2 horas.» | ✅ |
| M-15 | Duración válida | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 0 h | Error en **Duración**: «Elige una duración válida.» | ✅ |
| M-16 | Duración válida | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · -1 h | Error en **Duración**: «Elige una duración válida.» | ✅ |
| M-17 | Duración válida | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1.5 h | Error en **Duración**: «Elige una duración válida.» | ✅ |
| M-18 | Campos obligatorios | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · (sin duración) | Error en **Duración**: «Elige la duración.» | ✅ |
| M-19 | Campos obligatorios | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · (sin hora) · 1 h | Error en **Hora de inicio**: «Elige la hora de inicio.» | ✅ |
| M-20 | Campos obligatorios | Son las 20:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · (sin hora) · 1 h | Error en **Hora de inicio**: «Ya cerró por hoy (horario 08:00 – 20:00). Vuelve mañana a partir de las 08:00.» | ✅ |

## Aforo y nombre del grupo

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-21 | Aforo máximo de 3 personas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 3 personas · 10:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-22 | Aforo máximo de 3 personas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 4 personas · 10:00 · 1 h | Error en **Personas**: «Este cubículo admite hasta 3 personas.» | ✅ |
| M-23 | Aforo máximo de 3 personas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 0 personas · 10:00 · 1 h | Error en **Personas**: «Escribe un número entero, de 1 en adelante.» | ✅ |
| M-24 | Aforo máximo de 3 personas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 1.5 personas · 10:00 · 1 h | Error en **Personas**: «Escribe un número entero, de 1 en adelante.» | ✅ |
| M-25 | Campos obligatorios | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · (sin personas) · 10:00 · 1 h | Error en **Personas**: «Indica cuántas personas van a usar el cubículo.» | ✅ |
| M-26 | Aforo máximo de 3 personas | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «Equipo A» · dos personas · 10:00 · 1 h | Error en **Personas**: «Escribe un número entero, de 1 en adelante.» | ✅ |
| M-27 | Campos obligatorios | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre (vacío) · 2 personas · 10:00 · 1 h | Error en **Nombre del grupo**: «Escribe el nombre del grupo o del responsable.» | ✅ |
| M-28 | Campos obligatorios | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «   » · 2 personas · 10:00 · 1 h | Error en **Nombre del grupo**: «Escribe el nombre del grupo o del responsable.» | ✅ |
| M-29 | Nombre de al menos 2 caracteres | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «A» · 2 personas · 10:00 · 1 h | Error en **Nombre del grupo**: «Escribe al menos 2 caracteres.» | ✅ |
| M-30 | Nombre de al menos 2 caracteres | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «  Ana  » · 2 personas · 10:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-31 | Nombre de máximo 40 caracteres | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 1: nombre «NNNNNNNNNNNNNNNNNNNNN…» · 2 personas · 10:00 · 1 h | Error en **Nombre del grupo**: «Escribe como máximo 40 caracteres.» | ⚠️ |

## Cubículo

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-32 | El cubículo debe existir | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo 99: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Error en **Cubículo**: «Elige un cubículo válido.» | ✅ |
| M-33 | El cubículo debe existir | Son las 10:30 del lunes 16/11 | Se revisa el formulario del cubículo : nombre (vacío) · 9 personas · 10:00 · 1 h | Error en **Cubículo**: «Elige un cubículo válido.» | ✅ |

## Choques en el mismo cubículo

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-34 | Un cubículo no se reserva dos veces a la misma hora | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Error en **Hora de inicio**: «Choca con otra reserva: Cubículo 1 de 10:00 a 12:00. Elige otro horario.» | ✅ |
| M-35 | Un cubículo no se reserva dos veces a la misma hora | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 11:00 · 1 h | Error en **Hora de inicio**: «Choca con otra reserva: Cubículo 1 de 10:00 a 12:00. Elige otro horario.» | ✅ |
| M-36 | Un cubículo no se reserva dos veces a la misma hora | Son las 10:30 del lunes 16/11; cub-01 reservado 11:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 2 h | Error en **Duración**: «Choca con otra reserva: Cubículo 1 de 11:00 a 12:00. Elige otro horario.» | ✅ |
| M-37 | Reservas pegadas no son choque | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–11:00 por «Equipo A» | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 11:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-38 | El choque es por cubículo | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 2: nombre «Equipo B» · 2 personas · 10:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-39 | El choque es por día | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» (de mañana) | Se revisa el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 1 h | Se acepta, sin errores. | ✅ |

## Un grupo, un cubículo a la vez

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-40 | Un grupo no puede estar en dos cubículos a la vez | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 2: nombre «Equipo A» · 2 personas · 11:00 · 1 h | Error en **Hora de inicio**: «"Equipo A" ya tiene reservado el Cubículo 1 de 10:00 a 12:00. Un grupo no puede estar en dos cubículos a la vez.» | ✅ |
| M-41 | El nombre del grupo se compara sin distinguir mayúsculas ni espacios | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 2: nombre «  equipo a  » · 2 personas · 11:00 · 1 h | Error en **Hora de inicio**: «"equipo a" ya tiene reservado el Cubículo 1 de 10:00 a 12:00. Un grupo no puede estar en dos cubículos a la vez.» | ✅ |
| M-42 | Un grupo sí puede reservar en horas distintas | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–11:00 por «Equipo A» | Se revisa el formulario del cubículo 2: nombre «Equipo A» · 2 personas · 11:00 · 1 h | Se acepta, sin errores. | ✅ |
| M-43 | Un grupo no puede estar en dos cubículos a la vez | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se revisa el formulario del cubículo 2: nombre «Equipo B» · 2 personas · 11:00 · 1 h | Se acepta, sin errores. | ✅ |

## Creación de la reserva

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-44 | Crear una reserva válida | Son las 10:30 del lunes 16/11 | Se confirma el formulario del cubículo 1: nombre «Equipo A» · 2 personas · 10:00 · 2 h | La operación procede. Quedan 1 reserva(s) guardada(s). La reserva queda con folio y marcada como propia de este navegador. | ✅ |
| M-45 | Una reserva inválida no se guarda | Son las 10:30 del lunes 16/11 | Se confirma el formulario del cubículo 1: nombre «Equipo A» · 4 personas · 10:00 · 1 h | Error en **Personas**: «Este cubículo admite hasta 3 personas.» Quedan 0 reserva(s) guardada(s). | ✅ |

## Cancelación

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-46 | Cancelar una reserva propia | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A» | Se cancela la reserva | La operación procede. Quedan 0 reserva(s) guardada(s). | ✅ |
| M-47 | Solo se cancela lo propio | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A» desde otro navegador | Se cancela la reserva | Se rechaza. Mensaje: «Solo puedes cancelar las reservas que hiciste desde este navegador.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-48 | Cancelar algo que ya no existe | Son las 10:30 del lunes 16/11 | Se cancela el folio res-999 | Se rechaza. Mensaje: «Esa reserva ya no existe.» | ✅ |
| M-49 | No se cancela una reserva que ya terminó | Son las 10:30 del lunes 16/11; cub-01 reservado 08:00–09:00 por «Equipo A» | Se cancela la reserva | Se rechaza. Mensaje: «Esa reserva ya terminó y no se puede cancelar.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-50 | Una reserva en curso sí se puede cancelar | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se cancela la reserva | La operación procede. Quedan 0 reserva(s) guardada(s). | ✅ |
| M-51 | Si no se puede guardar, la cancelación se revierte | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A»; el navegador no deja guardar | Se cancela la reserva | Se rechaza. Mensaje: «No se pudo guardar la cancelación.» Quedan 1 reserva(s) guardada(s). La reserva sigue en pie, tal como estaba. | ✅ |

## Liberar antes de tiempo

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-52 | Liberar el cubículo durante la primera hora lo deja libre completo | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se toca «Liberar ahora» | La operación procede. Quedan 0 reserva(s) guardada(s). Se libera de 10:00 a 12:00 y la reserva desaparece. | ✅ |
| M-53 | Liberar conserva las horas ya usadas | Son las 11:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se toca «Liberar ahora» | La operación procede. Quedan 1 reserva(s) guardada(s). La reserva queda de 10:00 a 11:00 y la hora de 11:00 a 12:00 vuelve a estar libre. | ✅ |
| M-54 | No se libera una reserva que todavía no empieza | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A» | Se toca «Liberar ahora» | Se rechaza. Mensaje: «Tu reserva todavía no empieza.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-55 | No se libera una reserva que ya terminó | Son las 10:30 del lunes 16/11; cub-01 reservado 08:00–09:00 por «Equipo A» | Se toca «Liberar ahora» | Se rechaza. Mensaje: «Esa reserva ya terminó.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-56 | Solo se libera lo propio | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» desde otro navegador | Se toca «Liberar ahora» | Se rechaza. Mensaje: «Solo puedes liberar un cubículo que reservaste desde este navegador.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-57 | Si no se puede guardar, la liberación se revierte | Son las 11:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A»; el navegador no deja guardar | Se toca «Liberar ahora» | Se rechaza. Mensaje: «No se pudo guardar la liberación.» Quedan 1 reserva(s) guardada(s). La reserva conserva sus 2 horas. | ✅ |

## Deshacer una cancelación

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-58 | Deshacer devuelve la reserva cancelada | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A»; la reserva 1 se acaba de cancelar | Se toca «Deshacer» | La operación procede. Quedan 1 reserva(s) guardada(s). Vuelve con el mismo folio. | ✅ |
| M-59 | No se deshace dos veces | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A»; la reserva 1 se acaba de cancelar | Se toca «Deshacer» 2 veces | Se rechaza. Mensaje: «Esa reserva ya estaba restaurada.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-60 | Solo se deshace lo propio | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A» desde otro navegador; la reserva 1 se acaba de cancelar | Se toca «Deshacer» | Se rechaza. Mensaje: «Solo puedes cancelar las reservas que hiciste desde este navegador.» Quedan 0 reserva(s) guardada(s). | ✅ |
| M-61 | No se deshace una reserva cuya hora ya pasó | Son las 10:30 del lunes 16/11; cub-01 reservado 08:00–09:00 por «Equipo A»; la reserva 1 se acaba de cancelar | Se toca «Deshacer» | Se rechaza. Mensaje: «Ya no se puede deshacer.» Quedan 0 reserva(s) guardada(s). | ✅ |
| M-62 | No se deshace si alguien más ya ocupó el horario | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A»; cub-01 reservado 14:00–15:00 por «Equipo C» desde otro navegador; la reserva 1 se acaba de cancelar | Se toca «Deshacer» | Se rechaza. Mensaje: «Ya no se puede deshacer: ese horario ahora choca con Cubículo 1 de 14:00 a 15:00.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-63 | No se deshace si el grupo ya quedó en otro cubículo | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A»; cub-02 reservado 14:00–15:00 por «Equipo A»; la reserva 1 se acaba de cancelar | Se toca «Deshacer» | Se rechaza. Mensaje: «Ya no se puede deshacer: "Equipo A" ya tiene reservado el Cubículo 2 de 14:00 a 15:00.» Quedan 1 reserva(s) guardada(s). | ✅ |
| M-64 | Si no se puede guardar, el deshacer se revierte | Son las 10:30 del lunes 16/11; cub-01 reservado 14:00–15:00 por «Equipo A»; la reserva 1 se acaba de cancelar; el navegador no deja guardar | Se toca «Deshacer» | Se rechaza. Mensaje: «No se pudo guardar la reserva restaurada.» Quedan 0 reserva(s) guardada(s). El aviso ofrece reintentar. | ✅ |

## Horas y duraciones que se ofrecen

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-65 | Solo se ofrecen horas futuras y libres | Son las 10:30 del lunes 16/11 | Se abre el formulario del cubículo 1 y se ven las horas que ofrece | Devuelve `[10, 11, 12, 13, 14, 15, 16, 17, 18, 19]` | ✅ |
| M-66 | Solo se ofrecen horas futuras y libres | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se abre el formulario del cubículo 1 y se ven las horas que ofrece | Devuelve `[12, 13, 14, 15, 16, 17, 18, 19]` | ✅ |
| M-67 | Antes de abrir se ofrece el día completo | Son las 07:00 del lunes 16/11 | Se abre el formulario del cubículo 1 y se ven las horas que ofrece | Devuelve `[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]` | ✅ |
| M-68 | Al final del día solo queda la última franja | Son las 19:30 del lunes 16/11 | Se abre el formulario del cubículo 1 y se ven las horas que ofrece | Devuelve `[19]` | ✅ |
| M-69 | Cerrado: no se ofrece ninguna hora | Son las 20:30 del lunes 16/11 | Se abre el formulario del cubículo 1 y se ven las horas que ofrece | Devuelve `[]` | ✅ |
| M-70 | Las duraciones se recortan a lo que de verdad está libre | Son las 10:30 del lunes 16/11 | Se elige inicio 10:00 y se ven las duraciones que ofrece | Devuelve `[1, 2]` | ✅ |
| M-71 | Las duraciones se recortan a lo que de verdad está libre | Son las 10:30 del lunes 16/11; cub-01 reservado 11:00–12:00 por «Equipo A» | Se elige inicio 10:00 y se ven las duraciones que ofrece | Devuelve `[1]` | ✅ |
| M-72 | Las duraciones se recortan al cierre | Son las 10:30 del lunes 16/11 | Se elige inicio 19:00 y se ven las duraciones que ofrece | Devuelve `[1]` | ✅ |
| M-73 | Las duraciones se recortan a lo que de verdad está libre | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–11:00 por «Equipo A» | Se elige inicio 10:00 y se ven las duraciones que ofrece | Devuelve `[]` | ✅ |

## Estado que muestra el cubículo

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-74 | Estado del cubículo en este momento | Son las 10:30 del lunes 16/11 | Se mira la tarjeta del cubículo 1 | Devuelve estado = "libre", hasta = 20, cuando = "hoy" | ✅ |
| M-75 | Estado del cubículo en este momento | Son las 10:30 del lunes 16/11; cub-01 reservado 10:00–12:00 por «Equipo A» | Se mira la tarjeta del cubículo 1 | Devuelve estado = "ocupado", hasta = 12, cuando = "hoy" | ✅ |
| M-76 | Estado del cubículo en este momento | Son las 10:30 del lunes 16/11; cub-01 reservado 12:00–13:00 por «Equipo A» | Se mira la tarjeta del cubículo 1 | Devuelve estado = "libre", hasta = 12, cuando = "hoy" | ✅ |
| M-77 | Fuera del horario la tarjeta dice Cerrado | Son las 07:00 del lunes 16/11 | Se mira la tarjeta del cubículo 1 | Devuelve estado = "cerrado", hasta = 8, cuando = "hoy" | ✅ |
| M-78 | Fuera del horario la tarjeta dice Cerrado | Son las 20:30 del lunes 16/11 | Se mira la tarjeta del cubículo 1 | Devuelve estado = "cerrado", hasta = 8, cuando = "mañana" | ✅ |

## Saneado de los datos guardados

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-79 | Al cargar se conservan las reservas válidas | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 1 reserva(s). No descarta nada. | ✅ |
| M-80 | Al cargar se descarta lo que no es una reserva | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 3: «no es una reserva», «no es una reserva», «no es una reserva» | ✅ |
| M-81 | Al cargar se descartan reservas de cubículos que no existen | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «el cubículo no existe» | ✅ |
| M-82 | Al cargar se descartan fechas inválidas | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «fecha inválida» | ✅ |
| M-83 | Al cargar se descartan fechas inválidas | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «fecha inválida» | ✅ |
| M-84 | Al cargar se descartan reservas a más de 2 días | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «la fecha está a más de 2 días» | ✅ |
| M-85 | Al cargar se descartan horas fuera del horario | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «hora de inicio fuera del horario o inválida» | ✅ |
| M-86 | Al cargar se descartan horas que no caen en una franja | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «hora de inicio fuera del horario o inválida» | ✅ |
| M-87 | Al cargar se descartan duraciones mayores al máximo | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «duración inválida o termina después del cierre» | ✅ |
| M-88 | Al cargar se descartan reservas que terminan después del cierre | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «duración inválida o termina después del cierre» | ✅ |
| M-89 | Al cargar se descartan nombres inválidos | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «nombre vacío o inválido» | ✅ |
| M-90 | Al cargar se descartan reservas que pasan del aforo | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 0 reserva(s). Descarta 1: «número de personas inválido o mayor al aforo» | ✅ |
| M-91 | Al cargar, de dos reservas que chocan se conserva la primera | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 1 reserva(s). Descarta 1: «choca con otra reserva del mismo cubículo» Se queda la de folio más bajo (res-001). | ✅ |
| M-92 | Al cargar se descarta el mismo grupo en dos cubículos a la vez | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 1 reserva(s). Descarta 1: «el mismo grupo ya tiene otro cubículo a esa hora» | ✅ |
| M-93 | Al cargar, un nombre muy largo se recorta a 40 caracteres | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 1 reserva(s). No descarta nada. El nombre queda en 40 caracteres. | ✅ |
| M-94 | Al cargar, una firma de dueño inválida se descarta pero la reserva se conserva | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 1 reserva(s). No descarta nada. La reserva queda sin dueño, así que ya no se puede cancelar desde este navegador. | ✅ |
| M-95 | Al cargar, los folios repetidos o inválidos se reasignan | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 2 reserva(s). No descarta nada. La segunda se queda sin folio para que la carga le asigne uno nuevo. | ✅ |
| M-96 | Al cargar se conservan las reservas de hoy que ya pasaron | Son las 10:30 del lunes 16/11 | Se carga la página con esos datos en el navegador | Conserva 1 reserva(s). No descarta nada. Queda en la agenda del día como historial. | ✅ |

## Esquema guardado y migraciones

| # | Regla | Dado | Cuando | Entonces | Estado |
| --- | --- | --- | --- | --- | --- |
| M-97 | Se cargan los datos del esquema actual (v2) | Son las 10:30 del lunes 16/11; hay datos guardados en esquema v2 | Se carga la página | Devuelve estado = "ok", cargadas = 1, depuradas = 0 Quedan 1 reserva(s) guardada(s). | ✅ |
| M-98 | Los datos del esquema v1 se actualizan solos | Son las 10:30 del lunes 16/11; hay datos guardados en esquema v1 | Se carga la página | Devuelve estado = "ok", cargadas = 1 La reserva queda a nombre de este navegador. | ✅ |
| M-99 | Los datos más antiguos (v0, un arreglo suelto) también se actualizan | Son las 10:30 del lunes 16/11; hay datos guardados en formato antiguo (arreglo) | Se carga la página | Devuelve estado = "ok", cargadas = 1 Se asume 1 persona. | ✅ |
| M-100 | Se recuperan los datos de la clave antigua | Son las 10:30 del lunes 16/11; los datos están en la clave antigua | Se carga la página | Devuelve estado = "ok", cargadas = 1 Se pasan a la clave nueva y la antigua se borra. | ✅ |
| M-101 | Si los datos están dañados se respaldan y se empieza sin reservas | Son las 10:30 del lunes 16/11; los datos guardados están dañados | Se carga la página | Devuelve estado = "corrupto", cargadas = 0 Queda una copia en una clave «.danado.» para no perder nada. | ✅ |
| M-102 | Datos de una versión más nueva: se abren en solo lectura | Son las 10:30 del lunes 16/11; hay datos guardados en esquema v99 | Se carga la página | Devuelve estado = "futuro", cargadas = 0 No se sobrescribe lo guardado, para no romper la versión nueva. | ✅ |
| M-103 | Sin almacenamiento la página funciona igual, solo no recuerda | Son las 10:30 del lunes 16/11; el navegador no tiene almacenamiento | Se carga la página | Devuelve estado = "vacio", cargadas = 0 | ✅ |
| M-104 | Las reservas de días anteriores se eliminan al cargar | Son las 10:30 del lunes 16/11; hay datos guardados en esquema v2 | Se carga la página | Devuelve estado = "ok", cargadas = 1, depuradas = 1 Quedan 1 reserva(s) guardada(s). | ✅ |

## Desviaciones conocidas

Casos que la matriz declara como regla deseada pero que el código todavía no aplica.
Quedan marcados como pendientes (`todo`) en las pruebas: se ven en el reporte pero no
tumban la suite, para que no se olviden ni bloqueen el avance.

### M-31 · Nombre de máximo 40 caracteres

- **Caso:** Nombre de 41 caracteres
- **Esperado:** Error en **Nombre del grupo**: «Escribe como máximo 40 caracteres.»
- **Estado hoy:** ⚠️ desviación conocida
- **Detalle:** H-01: Reglas.validar no revisa el largo máximo del nombre. Hoy solo lo limitan el atributo maxlength="40" del formulario y el recorte de Almacen.sanear al recargar, así que un nombre de 41 caracteres entra por código y se guarda completo, pero cambia al recargar la página.

## Cómo correr estas pruebas

```bash
cd pruebas
npm install        # solo la primera vez
npm run matriz     # corre los casos de esta matriz
npm run matriz:doc # vuelve a generar este documento
```

Código probado: `static/Script.js`
