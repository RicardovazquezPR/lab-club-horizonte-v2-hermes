/* REQ 3200: resumen y exportacion CSV en navegador real. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { iniciar } = require('./ayudas.js');

let h;
test.before(async function () { h = await iniciar(); });
test.after(async function () { await h.cerrar(); });

test('sin inscripciones: se dice y el boton de descarga esta deshabilitado', async function () {
  const p = await h.abrir('resumen.html');
  await p.waitForSelector('#resumen section');
  assert.match(await p.textContent('#estado-resumen'), /0 inscripciones/);
  assert.strictEqual(await p.isDisabled('#exportar'), true);
  assert.strictEqual(await p.locator('#resumen section').count(), 8);
  await p.cerrarTodo();
});

test('con una inscripcion: tabla, plazas y CSV con BOM, seis columnas y celda neutralizada', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await p.fill('#nombre', '=Ana, "la" Pérez'); await p.fill('#correo', 'ana@correo.com'); await p.fill('#estudiante', '20261234');
  await p.click('#enviar');
  await p.click('text=Ver resumen de inscripciones');
  await p.waitForSelector('table.tabla-resumen');
  assert.match(await p.textContent('#estado-resumen'), /1 inscripción en total/);
  assert.match(await p.textContent('#resumen'), /Plazas ocupadas: 1 · Plazas disponibles: 19 de 20/);
  assert.strictEqual(await p.locator('table.tabla-resumen tbody tr').count(), 1);
  const [d] = await Promise.all([p.waitForEvent('download'), p.click('#exportar')]);
  const bytes = fs.readFileSync(await d.path());
  assert.deepStrictEqual([bytes[0], bytes[1], bytes[2]], [0xEF, 0xBB, 0xBF]);
  const texto = bytes.toString('utf8').replace(/^\uFEFF/, '');
  const lineas = texto.trim().split(/\r?\n/);
  assert.strictEqual(lineas.length, 2);
  assert.match(lineas[0], /^"?actividad"?,/i);
  assert.ok(texto.includes('Pérez'), 'los acentos sobreviven');
  assert.ok(!/(^|,)"?=Ana/.test(lineas[1]), 'una celda no puede empezar por =');
  assert.deepStrictEqual(p.errores, []);
  await p.cerrarTodo();
});
