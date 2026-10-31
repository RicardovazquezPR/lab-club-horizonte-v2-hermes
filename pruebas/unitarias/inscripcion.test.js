const test = require('node:test');
const assert = require('node:assert');
const Ins = require('../../js/inscripcion.js');

const act = { id: 'a1', titulo: 'Taller', cupo: 2 };
const otra = { id: 'a2', titulo: 'Otra', cupo: 5 };
const ok = { nombre: 'Ana Pérez', correo: 'ana@correo.com', estudiante: '20261234' };
const ahora = new Date('2026-10-31T15:00:00Z');

function falso(inicial) {
  const m = { v: inicial === undefined ? null : inicial };
  return { getItem: () => m.v, setItem: (k, t) => { m.v = t; }, m };
}
function almacen(inicial) { const f = falso(inicial); return Object.assign(Ins.crearAlmacen(f), { f }); }

/* REQ 3197 */
test('REQ 3197: campos vacíos dan un error por campo', () => {
  const e = Ins.validarCampos({ nombre: '', correo: '  ', estudiante: '' });
  assert.deepStrictEqual(Object.keys(e).sort(), ['correo', 'estudiante', 'nombre']);
});
test('REQ 3197: correos con formato inválido se rechazan y los válidos pasan', () => {
  ['ana', 'ana@', '@x.com', 'ana@x', 'a b@x.com', 'ana@x.c'].forEach((c) =>
    assert.ok(Ins.validarCampos({ ...ok, correo: c }).correo, c));
  assert.deepStrictEqual(Ins.validarCampos(ok), {});
});
test('REQ 3197: nombre de una sola palabra y número de estudiante no numérico se rechazan', () => {
  assert.ok(Ins.validarCampos({ ...ok, nombre: 'Ana' }).nombre);
  assert.ok(Ins.validarCampos({ ...ok, estudiante: '12ab' }).estudiante);
  assert.ok(Ins.validarCampos({ ...ok, estudiante: '123' }).estudiante);
});
test('REQ 3197: inscribir con datos inválidos no guarda nada', () => {
  const a = almacen();
  const r = Ins.inscribir(act, { ...ok, correo: 'mal' }, a, ahora);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errores.correo);
  assert.strictEqual(a.f.m.v, null);
});
test('REQ 3197: mismo correo (sin distinguir mayúsculas) no se inscribe dos veces en la misma actividad', () => {
  const a = almacen();
  assert.ok(Ins.inscribir(act, ok, a, ahora).ok);
  const r = Ins.inscribir(act, { ...ok, correo: 'ANA@Correo.com', nombre: 'Otra Persona' }, a, ahora);
  assert.strictEqual(r.ok, false);
  assert.match(r.errores.correo, /ya está inscrito/);
});
test('REQ 3197: el mismo correo sí puede inscribirse en otra actividad', () => {
  const a = almacen();
  assert.ok(Ins.inscribir(act, ok, a, ahora).ok);
  assert.ok(Ins.inscribir(otra, ok, a, ahora).ok);
});

/* REQ 3198 */
test('REQ 3198: plazas = cupo menos inscripciones de esa actividad', () => {
  const a = almacen();
  assert.strictEqual(Ins.plazasDisponibles(act, a.leer().lista), 2);
  Ins.inscribir(act, ok, a, ahora);
  Ins.inscribir(otra, { ...ok, correo: 'x@y.com' }, a, ahora);
  assert.strictEqual(Ins.plazasDisponibles(act, a.leer().lista), 1);
  assert.strictEqual(Ins.plazasDisponibles(otra, a.leer().lista), 4);
});
test('REQ 3198: con 0 plazas la actividad está agotada y la inscripción se bloquea', () => {
  const a = almacen();
  Ins.inscribir(act, ok, a, ahora);
  Ins.inscribir(act, { ...ok, correo: 'b@y.com', nombre: 'Beto Gil' }, a, ahora);
  assert.ok(Ins.estaAgotada(act, a.leer().lista));
  const r = Ins.inscribir(act, { ...ok, correo: 'c@y.com', nombre: 'Cora Ruiz' }, a, ahora);
  assert.strictEqual(r.ok, false);
  assert.match(r.mensaje, /agotada/i);
  assert.strictEqual(a.leer().lista.length, 2);
});
test('REQ 3198: plazas nunca negativas aunque haya más inscripciones que cupo', () => {
  const lista = [1, 2, 3].map((n) => ({ actividadId: 'a1', correo: n + '@x.com' }));
  assert.strictEqual(Ins.plazasDisponibles(act, lista), 0);
});

/* REQ 3199 */
test('REQ 3199: la inscripción se guarda y sigue ahí con un almacén nuevo sobre el mismo storage (recarga)', () => {
  const f = falso();
  const a1 = Ins.crearAlmacen(f);
  assert.ok(Ins.inscribir(act, ok, a1, ahora).ok);
  const a2 = Ins.crearAlmacen(f);
  const lista = a2.leer().lista;
  assert.strictEqual(lista.length, 1);
  assert.strictEqual(lista[0].correo, 'ana@correo.com');
  assert.strictEqual(lista[0].fecha, '2026-10-31T15:00:00.000Z');
});
test('REQ 3199: localStorage bloqueado avisa y no lanza', () => {
  const bloqueado = Ins.crearAlmacen({ getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } });
  assert.match(bloqueado.leer().error, /bloqueado/);
  const r = Ins.inscribir(act, ok, bloqueado, ahora);
  assert.strictEqual(r.ok, false);
  assert.match(r.mensaje, /bloqueado/);
});
test('REQ 3199: sin storage disponible avisa; escritura que falla (lleno) avisa', () => {
  assert.ok(Ins.crearAlmacen(null).leer().error);
  const lleno = Ins.crearAlmacen({ getItem: () => null, setItem() { throw new Error('QuotaExceeded'); } });
  const r = Ins.inscribir(act, ok, lleno, ahora);
  assert.strictEqual(r.ok, false);
  assert.match(r.mensaje, /No se pudo guardar/);
});
test('REQ 3199: datos guardados dañados se ignoran con aviso y no rompen', () => {
  const a = almacen('{no es json');
  const l = a.leer();
  assert.deepStrictEqual(l.lista, []);
  assert.match(l.error, /dañados/);
});
