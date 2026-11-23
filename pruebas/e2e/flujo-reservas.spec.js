"use strict";
/* ===========================================================================
   T46 · Pruebas automatizadas del flujo de reservas (E4-59)
   ---------------------------------------------------------------------------
   Recorren la página en un navegador real (Chromium), como lo haría una
   persona: tocar el cubículo, llenar el formulario, confirmar, cancelar,
   deshacer, liberar. Si algo del flujo se rompe, estas pruebas lo detectan
   antes de subirlo.
   Se corren con:  npm run flujo
   =========================================================================== */
const { test, expect } = require("@playwright/test");
const A = require("./ayudas");

test.describe("Reservar un cubículo", () => {
  test("flujo completo desde la tarjeta del cubículo", async ({ page }) => {
    await A.abrirApp(page);

    // 1. Abrir el detalle del cubículo 1
    await A.tarjeta(page, 1).click();
    await expect(A.detalle(page)).toBeVisible();
    await expect(page.locator("#detalleTitulo")).toHaveText("Cubículo 1");
    await expect(page.locator("#btnReservar")).toBeEnabled();

    // 2. Llenar el formulario
    await page.locator("#btnReservar").click();
    await expect(A.formulario(page)).toBeVisible();
    await A.llenar(page, { nombre: "Equipo Cálculo", personas: 3, inicio: 14, duracion: 2 });

    // 3. Revisar antes de confirmar: la página repite lo elegido
    await expect(page.getByRole("heading", { name: "Revisa tu reserva" })).toBeVisible();
    const resumen = page.locator("#detalleReserva");
    await expect(resumen).toContainText("14:00 – 16:00 (2 horas)");
    await expect(resumen).toContainText("Equipo Cálculo");
    await expect(resumen).toContainText("Cubículo 1");

    // 4. Confirmar: aparece el código y el aviso
    await page.locator('[data-accion="confirmar"]').click();
    await expect(page.getByRole("heading", { name: "¡Reserva confirmada!" })).toBeVisible();
    await expect(page.locator(".exito-codigo")).toHaveText(/^res-\d{3}$/);
    await A.esperarAviso(page, "Reserva confirmada");

    // 5. La agenda del cubículo ya muestra la reserva como propia
    await page.locator('[data-accion="listo"]').click();
    const bloque = page.locator('#detalleCuerpo .agenda-item[data-inicio="14"]');
    await expect(bloque).toContainText("Ocupado");
    await expect(bloque).toContainText("Equipo Cálculo");
    await expect(bloque.locator(".agenda-tuya")).toHaveText("Tu reserva");

    // 6. La tabla de franjas marca ocupadas las dos horas, y solo esas
    await page.keyboard.press("Escape");
    await expect(A.detalle(page)).toBeHidden();
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "ocupada");
    await expect(A.franja(page, 1, 15)).toHaveAttribute("data-estado", "ocupada");
    await expect(A.franja(page, 1, 16)).toHaveAttribute("data-estado", "libre");
    await expect(A.franja(page, 2, 14)).toHaveAttribute("data-estado", "libre");

    // 7. Y sigue ahí al recargar la página
    await page.reload();
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "ocupada");
  });

  test("se puede reservar tocando una franja libre de la tabla", async ({ page }) => {
    await A.abrirApp(page);

    await A.franja(page, 2, 16).click();
    await expect(A.detalle(page)).toBeVisible();
    await expect(A.formulario(page)).toBeVisible();
    // La hora de la franja que se tocó llega ya elegida
    await expect(page.locator("#rInicio")).toHaveValue("16");

    await A.llenar(page, { nombre: "Grupo Física", personas: 2, duracion: 1 });
    await page.locator('[data-accion="confirmar"]').click();
    await expect(page.getByRole("heading", { name: "¡Reserva confirmada!" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(A.franja(page, 2, 16)).toHaveAttribute("data-estado", "ocupada");
    await expect(A.franja(page, 2, 17)).toHaveAttribute("data-estado", "libre");
  });

  test("una franja que ya pasó no abre el formulario", async ({ page }) => {
    await A.abrirApp(page);
    // A las 10:30, la franja de 09:00 ya terminó
    const pasada = A.franja(page, 1, 9);
    await expect(pasada).toHaveAttribute("aria-disabled", "true");
    await pasada.click({ force: true });
    await expect(A.detalle(page)).toBeHidden();
  });
});

test.describe("El formulario avisa qué está mal", () => {
  test("marca los campos vacíos al intentar continuar", async ({ page }) => {
    await A.abrirApp(page);
    await A.abrirFormulario(page, 1);

    await A.formulario(page).locator('button[type="submit"]').click();

    await expect(page.locator("#rNombreError")).toHaveText("Escribe el nombre del grupo o del responsable.");
    await expect(page.locator("#rNombre")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#rPersonasError")).toHaveText("Indica cuántas personas van a usar el cubículo.");
    await expect(page.locator("#rInicioError")).toHaveText("Elige la hora de inicio.");
    // No avanzó al resumen
    await expect(page.getByRole("heading", { name: "Revisa tu reserva" })).toBeHidden();
  });

  test("rechaza un nombre de una sola letra y más personas que el aforo", async ({ page }) => {
    await A.abrirApp(page);
    await A.abrirFormulario(page, 1);

    await A.llenar(page, { nombre: "A", personas: 4, inicio: 14, duracion: 1 });
    await expect(page.locator("#rNombreError")).toHaveText("Escribe al menos 2 caracteres.");
    await expect(page.locator("#rPersonasError")).toHaveText("Este cubículo admite hasta 3 personas.");

    // Al corregir, los avisos desaparecen y el flujo continúa
    await A.llenar(page, { nombre: "Equipo B", personas: 3, inicio: 14, duracion: 1 });
    await expect(page.getByRole("heading", { name: "Revisa tu reserva" })).toBeVisible();
  });

  test("se puede volver a editar desde el resumen", async ({ page }) => {
    await A.abrirApp(page);
    await A.abrirFormulario(page, 1);
    await A.llenar(page, { nombre: "Equipo C", personas: 2, inicio: 14, duracion: 1 });

    await page.locator('[data-accion="editar"]').click();
    await expect(A.formulario(page)).toBeVisible();
    // Lo que ya se había escrito sigue ahí
    await expect(page.locator("#rNombre")).toHaveValue("Equipo C");
    await expect(page.locator("#rInicio")).toHaveValue("14");
  });
});

test.describe("Solo se ofrece lo que de verdad está libre", () => {
  test("las horas ya reservadas no aparecen en el formulario", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ cubiculo: "cub-01", inicio: 10, duracion: 2 })] });

    await A.tarjeta(page, 1).click();
    await expect(page.locator("#btnReservar")).toHaveText("Reservar otro horario");
    await page.locator("#btnReservar").click();

    const horas = await A.opciones(page, "rInicio");
    expect(horas).not.toContain("10");
    expect(horas).not.toContain("11");
    expect(horas).toContain("12");
    // Tampoco las horas que ya pasaron
    expect(horas).not.toContain("9");
  });

  test("la duración se recorta a lo que queda libre antes de la siguiente reserva", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ cubiculo: "cub-03", inicio: 15, duracion: 1, mia: false })] });

    await A.abrirFormulario(page, 3);
    await page.locator("#rInicio").selectOption("14");
    // De 14:00 solo cabe 1 hora, porque a las 15:00 ya hay otra reserva
    expect(await A.opciones(page, "rDuracion")).toEqual(["1"]);

    await page.locator("#rInicio").selectOption("16");
    expect(await A.opciones(page, "rDuracion")).toEqual(["1", "2"]);
  });

  test("al cerrar la sala el botón de reservar queda deshabilitado", async ({ page }) => {
    await A.abrirApp(page, { hora: A.A_LAS("19:30") });

    await A.tarjeta(page, 1).click();
    await page.locator("#btnReservar").click();
    // A las 19:30 solo queda la última franja
    expect(await A.opciones(page, "rInicio")).toEqual(["19"]);

    // Pasan 40 minutos: la sala cierra a las 20:00
    await page.locator('[data-accion="cancelar"]').click();
    await page.clock.fastForward("40:00");
    await expect(page.locator("#btnReservar")).toBeDisabled();
    await expect(page.locator("#btnReservar")).toContainText("Cerrado");
  });
});

test.describe("Cancelar una reserva", () => {
  test("pide confirmación y libera el horario", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1 })] });

    await A.tarjeta(page, 1).click();
    await page.locator('[data-cancelar="res-001"]').click();

    // Antes de borrar nada, la página pregunta y muestra lo que se va a cancelar
    await expect(page.locator("#detalleConfirmar")).toContainText("El horario quedará libre");
    await expect(page.locator("#detalleConfirmar")).toContainText("res-001");
    await A.confirmarPanel(page, "¿Cancelar esta reserva?");

    await A.esperarAvisoDeshacer(page, "Reserva cancelada");
    await page.keyboard.press("Escape");
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "libre");
  });

  test("se puede conservar la reserva si uno se arrepiente", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1 })] });

    await A.tarjeta(page, 1).click();
    await page.locator('[data-cancelar="res-001"]').click();
    await page.locator('[data-confirmar="no"]').click();

    await expect(page.locator("#detalleConfirmar")).toBeHidden();
    await expect(page.locator('#detalleCuerpo .agenda-item[data-inicio="14"]')).toContainText("Ocupado");
  });

  test("el aviso permite deshacer y la reserva vuelve", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1 })] });

    await A.tarjeta(page, 1).click();
    await page.locator('[data-cancelar="res-001"]').click();
    await A.confirmarPanel(page, "¿Cancelar esta reserva?");

    await A.avisoDeshacer(page).locator("[data-deshacer]").click();
    await A.esperarAviso(page, "Reserva restaurada");

    await page.keyboard.press("Escape");
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "ocupada");
    // Y queda guardada: al recargar sigue ahí
    await page.reload();
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "ocupada");
  });

  test("si se deja pasar el tiempo, la cancelación queda firme", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1 })] });

    await A.tarjeta(page, 1).click();
    await page.locator('[data-cancelar="res-001"]').click();
    await A.confirmarPanel(page, "¿Cancelar esta reserva?");
    await expect(A.avisoDeshacer(page)).toBeVisible();

    // El aviso ofrece deshacer durante 10 segundos. Hay que quitar el puntero de
    // encima: mientras está ahí, la cuenta se pausa a propósito.
    await page.mouse.move(0, 0);
    await page.clock.fastForward(12_000);
    await expect(A.avisoDeshacer(page)).toBeHidden();

    await page.reload();
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "libre");
  });

  test("el aviso espera mientras el puntero está encima", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1 })] });

    await A.tarjeta(page, 1).click();
    await page.locator('[data-cancelar="res-001"]').click();
    await A.confirmarPanel(page, "¿Cancelar esta reserva?");
    await expect(A.avisoDeshacer(page)).toBeVisible();

    // Con el puntero sobre el aviso, la cuenta se detiene y sigue habiendo
    // oportunidad de deshacer aunque pasen más de 10 segundos.
    await A.avisoDeshacer(page).hover();
    await page.clock.fastForward(30_000);
    await expect(A.avisoDeshacer(page)).toBeVisible();

    await A.avisoDeshacer(page).locator("[data-deshacer]").click();
    await A.esperarAviso(page, "Reserva restaurada");
  });
});

test.describe("Liberar el cubículo antes de tiempo", () => {
  test("durante la primera hora deja libre toda la reserva", async ({ page }) => {
    // Reserva propia de 10:00 a 12:00 y son las 10:30
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 10, duracion: 2 })] });

    await A.tarjeta(page, 1).click();
    await expect(page.locator("#btnLiberar")).toBeVisible();
    await page.locator("#btnLiberar").click();

    await expect(page.locator("#detalleConfirmar")).toContainText("Tu reserva termina en este momento");
    await A.confirmarPanel(page, "¿Liberar el cubículo ahora?");

    await A.esperarAviso(page, "Cubículo 1 liberado hasta las 12:00");
    await page.keyboard.press("Escape");
    await expect(A.franja(page, 1, 10)).toHaveAttribute("data-estado", "libre");
    await expect(A.franja(page, 1, 11)).toHaveAttribute("data-estado", "libre");
  });

  test("a media reserva conserva las horas ya usadas", async ({ page }) => {
    // Misma reserva de 10:00 a 12:00, pero ya son las 11:30
    await A.abrirApp(page, { hora: A.A_LAS("11:30"), reservas: [A.reserva({ inicio: 10, duracion: 2 })] });

    await A.tarjeta(page, 1).click();
    await page.locator("#btnLiberar").click();
    await A.confirmarPanel(page, "¿Liberar el cubículo ahora?");

    await page.keyboard.press("Escape");
    // La hora que ya se usó se queda registrada; la que no, se libera
    await expect(A.franja(page, 1, 10)).toHaveAttribute("data-estado", "ocupada");
    await expect(A.franja(page, 1, 11)).toHaveAttribute("data-estado", "libre");
  });

  test("no aparece el botón si la reserva todavía no empieza", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1 })] });
    await A.tarjeta(page, 1).click();
    await expect(page.locator("#btnLiberar")).toBeHidden();
    await expect(page.locator('[data-cancelar="res-001"]')).toBeVisible();
  });
});

test.describe("Reservas de otras personas", () => {
  test("no se pueden cancelar ni liberar desde este navegador", async ({ page }) => {
    await A.abrirApp(page, { reservas: [A.reserva({ inicio: 14, duracion: 1, nombre: "Equipo Ajeno", mia: false })] });

    await A.tarjeta(page, 1).click();
    const bloque = page.locator('#detalleCuerpo .agenda-item[data-inicio="14"]');
    await expect(bloque).toContainText("Equipo Ajeno");
    await expect(bloque.locator(".agenda-tuya")).toHaveCount(0);
    await expect(page.locator("[data-cancelar]")).toHaveCount(0);
    await expect(page.locator("[data-liberar]")).toHaveCount(0);
  });
});

test.describe("Varias pestañas y datos guardados", () => {
  test("lo que se reserva en una pestaña aparece en la otra", async ({ context }) => {
    const pestana1 = await context.newPage();
    await A.abrirApp(pestana1);
    const pestana2 = await context.newPage();
    await A.abrirApp(pestana2);

    await A.reservar(pestana1, 5, { nombre: "Equipo Redes", personas: 2, inicio: 17, duracion: 1 });

    // La otra pestaña se entera sola, sin recargar
    await expect(A.franja(pestana2, 5, 17)).toHaveAttribute("data-estado", "ocupada");
  });

  test("unos datos dañados no rompen la página", async ({ page }) => {
    await A.abrirApp(page, { crudo: "{esto no es json" });

    // La página carga igual, vacía y utilizable
    await expect(page.locator("#plano .booth")).toHaveCount(5);
    await expect(A.franja(page, 1, 14)).toHaveAttribute("data-estado", "libre");
    await A.reservar(page, 1, { nombre: "Equipo Nuevo", personas: 2, inicio: 14, duracion: 1 });
  });

  test("las reservas de días anteriores se limpian al cargar", async ({ page }) => {
    await A.abrirApp(page, {
      reservas: [A.reserva({ id: "res-001", fecha: "2026-11-15", inicio: 14, duracion: 1 })],
    });
    await A.tarjeta(page, 1).click();
    await expect(page.locator('#detalleCuerpo .agenda-item[data-inicio="8"]')).toContainText("Libre");
    await expect(page.locator("[data-cancelar]")).toHaveCount(0);
  });
});
