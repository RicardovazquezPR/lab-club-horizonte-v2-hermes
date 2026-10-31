/* REQ 3193-3196: calendario en navegador real (mes, lista, filtro, detalle, .ics, teclado, error de datos). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { iniciar } = require('./ayudas.js');

let h;
test.before(async function () { h = await iniciar(); });
test.after(async function () { await h.cerrar(); });

test('a 1280 px abre en vista de mes con 8 actividades de noviembre de 2026', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  assert.strictEqual(await p.textContent('#etiqueta-mes'), 'noviembre de 2026');
  assert.strictEqual(await p.locator('table.rejilla .chip').count(), 8);
  assert.strictEqual(await p.getAttribute('#vista-mes', 'aria-pressed'), 'true');
  assert.deepStrictEqual(p.errores, []);
  await p.cerrarTodo();
});

test('a 375 px abre en lista cronologica', async function () {
  const p = await h.abrir('calendario.html', { ancho: 375 });
  await p.waitForSelector('ul.lista-actividades');
  const titulos = await p.locator('.item-titulo').allTextContents();
  assert.strictEqual(titulos.length, 8);
  assert.strictEqual(titulos[0], 'Taller de estudio en grupo');
  assert.strictEqual(titulos[7], 'Carrera 5K del club');
  await p.cerrarTodo();
});

test('navegar de mes: octubre y diciembre estan vacios y se avisa', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  await p.click('#mes-siguiente');
  assert.strictEqual(await p.textContent('#etiqueta-mes'), 'diciembre de 2026');
  assert.strictEqual(await p.isVisible('#sin-actividades'), true);
  await p.click('#mes-anterior');
  await p.click('#mes-anterior');
  assert.strictEqual(await p.textContent('#etiqueta-mes'), 'octubre de 2026');
  assert.strictEqual(await p.isVisible('#sin-actividades'), true);
  await p.click('#mes-siguiente');
  assert.strictEqual(await p.locator('table.rejilla .chip').count(), 8);
  await p.cerrarTodo();
});

test('filtro por una y varias categorias, y quitar filtros', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  assert.strictEqual(await p.locator('#casillas input').count(), 4);
  await p.check('input[data-categoria="Deportiva"]');
  assert.strictEqual(await p.locator('table.rejilla .chip').count(), 2);
  await p.check('input[data-categoria="Cultural"]');
  assert.strictEqual(await p.locator('table.rejilla .chip').count(), 4);
  await p.click('#quitar-filtros');
  assert.strictEqual(await p.locator('table.rejilla .chip').count(), 8);
  assert.strictEqual(await p.locator('#casillas input:checked').count(), 0);
  await p.cerrarTodo();
});

test('alternar entre mes y lista conserva el filtro', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  await p.check('input[data-categoria="Académica"]');
  await p.click('#vista-lista');
  assert.strictEqual(await p.locator('.item-actividad').count(), 2);
  assert.strictEqual(await p.getAttribute('#vista-lista', 'aria-pressed'), 'true');
  await p.click('#vista-mes');
  assert.strictEqual(await p.locator('table.rejilla .chip').count(), 2);
  await p.cerrarTodo();
});

test('detalle: muestra datos, enlaza a la inscripcion y se cierra devolviendo el foco', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  const chip = p.locator('.chip[data-id="act-007"]');
  await chip.click();
  assert.strictEqual(await p.isVisible('#detalle'), true);
  assert.strictEqual(await p.textContent('#detalle-titulo'), 'Taller de primeros auxilios');
  assert.match(await p.textContent('#detalle-datos'), /2 plazas/);
  assert.strictEqual(await p.getAttribute('#enlace-inscripcion', 'href'), 'inscripcion.html?actividad=act-007');
  await p.click('#cerrar-detalle');
  assert.strictEqual(await p.isVisible('#detalle'), false);
  assert.strictEqual(await p.evaluate(function () { return document.activeElement.getAttribute('data-id'); }), 'act-007');
  await p.cerrarTodo();
});

test('descarga .ics valido y con el UID estable', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  await p.click('.chip[data-id="act-001"]');
  const [d] = await Promise.all([p.waitForEvent('download'), p.click('#descargar-ics')]);
  assert.match(d.suggestedFilename(), /^taller-de-estudio-en-grupo-2026-11-03\.ics$/);
  const texto = fs.readFileSync(await d.path(), 'utf8');
  assert.ok(texto.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(texto.includes('DTSTART:20261103T170000\r\n'));
  assert.ok(texto.includes('DTEND:20261103T183000\r\n'));
  assert.ok(/SUMMARY:Taller de estudio en grupo\r\n/.test(texto));
  assert.ok(texto.trimEnd().endsWith('END:VCALENDAR'));
  await p.cerrarTodo();
});

test('solo con teclado: Tab llega a una actividad y Enter abre el detalle', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('table.rejilla');
  await p.focus('#vista-mes');
  let guardia = 0;
  while (guardia++ < 40) {
    const esChip = await p.evaluate(function () { return document.activeElement.classList.contains('chip'); });
    if (esChip) { break; }
    await p.keyboard.press('Tab');
  }
  assert.ok(guardia < 40, 'Tab no llego a ninguna actividad');
  await p.keyboard.press('Enter');
  assert.strictEqual(await p.isVisible('#detalle'), true);
  assert.strictEqual(await p.evaluate(function () { return document.activeElement.id; }), 'detalle');
  await p.cerrarTodo();
});

test('si el JSON falla se ve un mensaje claro y la pagina no queda en blanco', async function () {
  const p = await h.abrir('calendario.html');
  await p.close();
  const ctx = await h.navegador.newContext();
  const q = await ctx.newPage();
  await q.route('**/datos/actividades.json', function (r) { r.fulfill({ status: 200, contentType: 'application/json', body: '{ roto' }); });
  await q.goto(h.base + 'calendario.html');
  await q.waitForSelector('#errores p');
  assert.match(await q.textContent('#errores'), /JSON|formato|no se pudo|no es válido/i);
  assert.strictEqual(await q.textContent('h1'), 'Calendario de actividades');
  await ctx.close();
});

test('el texto del JSON se escapa: una etiqueta en el titulo no se ejecuta', async function () {
  const ctx = await h.navegador.newContext();
  const q = await ctx.newPage();
  const errores = [];
  q.on('pageerror', function (e) { errores.push(String(e)); });
  await q.route('**/datos/actividades.json', function (r) {
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ actividades: [{
      id: 'x1', titulo: '<img src=x onerror="window.__xss=1">Hola', categoria: 'Cultural', fecha: '2026-11-05',
      horaInicio: '10:00', horaFin: '11:00', lugar: 'Aula', cupo: 3, descripcion: 'd' }] }) });
  });
  await q.clock.install({ time: new Date(2026, 9, 31, 12, 0) });
  await q.goto(h.base + 'calendario.html');
  await q.waitForSelector('.chip');
  assert.strictEqual(await q.evaluate(function () { return window.__xss; }), undefined);
  assert.strictEqual(await q.locator('.chip img').count(), 0);
  assert.match(await q.textContent('.chip'), /<img src=x/);
  assert.deepStrictEqual(errores, []);
  await ctx.close();
});
