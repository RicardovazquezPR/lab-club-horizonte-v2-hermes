/* REQ 3201, 3202: axe-core (WCAG 2.0/2.1 A y AA) en cada pagina y en estados clave. Exige 0 violaciones. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { iniciar, PAGINAS } = require('./ayudas.js');

const AXE = fs.readFileSync(path.join(path.dirname(require.resolve('axe-core')), 'axe.min.js'), 'utf8');
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

let h;
test.before(async function () { h = await iniciar(); });
test.after(async function () { await h.cerrar(); });

async function auditar(p) {
  await p.evaluate(AXE);
  const r = await p.evaluate(function (tags) { return axe.run(document, { runOnly: { type: 'tag', values: tags } }); }, ETIQUETAS);
  return r.violations.map(function (v) {
    return v.id + ' (' + v.impact + '): ' + v.nodes.slice(0, 3).map(function (n) { return n.target.join(' '); }).join(' | ');
  });
}

for (const pagina of PAGINAS) {
  for (const ancho of [375, 1280]) {
    test('axe: ' + pagina + ' a ' + ancho + ' px', async function () {
      const p = await h.abrir(pagina, { ancho: ancho });
      await p.waitForLoadState('networkidle');
      assert.deepStrictEqual(await auditar(p), []);
      await p.cerrarTodo();
    });
  }
}

test('axe: calendario con el detalle de una actividad abierto', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('.chip');
  await p.click('.chip[data-id="act-003"]');
  assert.deepStrictEqual(await auditar(p), []);
  await p.cerrarTodo();
});

test('axe: calendario en vista de lista con un filtro puesto', async function () {
  const p = await h.abrir('calendario.html');
  await p.waitForSelector('.chip');
  await p.check('input[data-categoria="Cultural"]');
  await p.click('#vista-lista');
  assert.deepStrictEqual(await auditar(p), []);
  await p.cerrarTodo();
});

test('axe: inscripcion con errores visibles', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await p.click('#enviar');
  assert.deepStrictEqual(await auditar(p), []);
  await p.cerrarTodo();
});

test('axe: inscripcion con la actividad agotada', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-007');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  for (const [n, c, e] of [['Uno Uno', 'uno@correo.com', '1111'], ['Dos Dos', 'dos@correo.com', '2222']]) {
    await p.fill('#nombre', n); await p.fill('#correo', c); await p.fill('#estudiante', e); await p.click('#enviar');
  }
  assert.deepStrictEqual(await auditar(p), []);
  await p.cerrarTodo();
});

test('axe: resumen con una tabla de inscritos', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await p.fill('#nombre', 'Ana Pérez'); await p.fill('#correo', 'ana@correo.com'); await p.fill('#estudiante', '20261234');
  await p.click('#enviar');
  await p.click('text=Ver resumen de inscripciones');
  await p.waitForSelector('table.tabla-resumen');
  assert.deepStrictEqual(await auditar(p), []);
  await p.cerrarTodo();
});
