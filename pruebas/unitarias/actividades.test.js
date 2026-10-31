const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const A = require('../../js/actividades.js');

const buena = { id: 'x1', titulo: 'T', categoria: 'Cultural', fecha: '2026-11-03', horaInicio: '10:00', horaFin: '11:00', lugar: 'L', cupo: 5 };

test('el JSON publicado trae 8 actividades validas y sin avisos', () => {
  const texto = fs.readFileSync(path.join(__dirname, '../../datos/actividades.json'), 'utf8');
  const r = A.interpretar(texto);
  assert.strictEqual(r.error, null);
  assert.deepStrictEqual(r.avisos, []);
  assert.strictEqual(r.actividades.length, 8);
  assert.strictEqual(new Set(r.actividades.map(a => a.categoria)).size, 4);
  assert.ok(r.actividades.some(a => a.cupo === 2), 'una actividad con cupo 2');
});
test('una actividad valida no tiene problemas', () => assert.deepStrictEqual(A.problemasDe(buena), []));
test('cada campo obligatorio ausente se detecta', () => {
  for (const c of A.CAMPOS) {
    const a = Object.assign({}, buena); delete a[c];
    assert.ok(A.problemasDe(a).includes('falta ' + c), c);
  }
});
test('texto vacio o solo espacios cuenta como ausente', () => {
  assert.ok(A.problemasDe(Object.assign({}, buena, { titulo: '   ' })).includes('falta titulo'));
});
test('fecha inexistente, hora mal formada y fin anterior al inicio', () => {
  assert.ok(A.problemasDe(Object.assign({}, buena, { fecha: '2026-02-30' })).includes('fecha invalida'));
  assert.ok(A.problemasDe(Object.assign({}, buena, { horaInicio: '25:00' })).includes('horaInicio invalida'));
  assert.ok(A.problemasDe(Object.assign({}, buena, { horaFin: '09:00' })).includes('horaFin no es posterior a horaInicio'));
});
test('cupo: 0 es valido; negativo, decimal y texto no', () => {
  assert.deepStrictEqual(A.problemasDe(Object.assign({}, buena, { cupo: 0 })), []);
  for (const c of [-1, 1.5, '3']) assert.ok(A.problemasDe(Object.assign({}, buena, { cupo: c })).includes('cupo invalido'), String(c));
});
test('validar omite la invalida con aviso y conserva las buenas', () => {
  const r = A.validar({ actividades: [buena, { id: 'x2' }, Object.assign({}, buena, { id: 'x3' })] });
  assert.strictEqual(r.actividades.length, 2);
  assert.strictEqual(r.avisos.length, 1);
  assert.match(r.avisos[0], /Actividad 2 \(x2\) omitida/);
});
test('id repetido: se omite la segunda', () => {
  const r = A.validar([buena, buena]);
  assert.strictEqual(r.actividades.length, 1);
  assert.match(r.avisos[0], /id repetido/);
});
test('estructura inutilizable da error claro, sin excepcion', () => {
  for (const malo of [null, 5, 'texto', {}, { actividades: 3 }]) {
    const r = A.validar(malo);
    assert.ok(r.error); assert.deepStrictEqual(r.actividades, []);
  }
});
test('JSON mal formado da error claro, sin excepcion', () => {
  const r = A.interpretar('{ no es json');
  assert.match(r.error, /JSON no válido/);
});
test('lista vacia es valida: cero actividades, sin error', () => {
  const r = A.validar({ actividades: [] });
  assert.strictEqual(r.error, null); assert.strictEqual(r.actividades.length, 0);
});
test('cargar: codigo HTTP de error y fallo de red dan mensaje, no rechazan', async () => {
  const r404 = await A.cargar('x', async () => ({ ok: false, status: 404 }));
  assert.match(r404.error, /404/);
  const rRed = await A.cargar('x', async () => { throw new Error('red'); });
  assert.match(rRed.error, /No se pudo cargar/);
});
test('cargar: respuesta correcta se interpreta', async () => {
  const r = await A.cargar('x', async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ actividades: [buena] }) }));
  assert.strictEqual(r.actividades.length, 1);
});
