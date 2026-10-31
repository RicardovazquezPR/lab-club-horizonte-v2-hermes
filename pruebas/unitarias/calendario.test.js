const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const A = require('../../js/actividades.js');
const C = require('../../js/calendario.js');

const reales = A.interpretar(fs.readFileSync(path.join(__dirname, '../../datos/actividades.json'), 'utf8')).actividades;
const act = (id, fecha, hora, cat) => ({ id, titulo: id, categoria: cat || 'Cultural', fecha, horaInicio: hora, horaFin: '23:00', lugar: 'L', cupo: 1 });

test('ordenar: por fecha, luego hora, luego id; no muta la entrada', () => {
  const e = [act('b', '2026-11-05', '10:00'), act('a', '2026-11-05', '10:00'), act('c', '2026-11-04', '18:00'), act('d', '2026-11-05', '09:00')];
  const copia = e.map(x => x.id);
  assert.deepStrictEqual(C.ordenar(e).map(x => x.id), ['c', 'd', 'a', 'b']);
  assert.deepStrictEqual(e.map(x => x.id), copia);
});
test('categorias: se derivan de los datos (4 en el JSON publicado)', () => {
  assert.deepStrictEqual(C.categorias(reales), ['Académica', 'Cultural', 'Deportiva', 'Voluntariado']);
  assert.deepStrictEqual(C.categorias([]), []);
});
test('filtrar: una, varias, ninguna y categoria inexistente', () => {
  assert.strictEqual(C.filtrar(reales, ['Deportiva']).length, 2);
  assert.strictEqual(C.filtrar(reales, ['Deportiva', 'Cultural']).length, 4);
  assert.strictEqual(C.filtrar(reales, []).length, 8);
  assert.strictEqual(C.filtrar(reales).length, 8);
  assert.strictEqual(C.filtrar(reales, ['Inexistente']).length, 0);
});
test('cuadricula noviembre 2026: empieza en domingo (6 vacias), 30 dias, 6 semanas de 7', () => {
  const s = C.cuadriculaMes(2026, 10, reales);
  assert.strictEqual(s.length, 6);
  s.forEach(w => assert.strictEqual(w.length, 7));
  assert.strictEqual(s[0].filter(c => c.fuera).length, 6);
  assert.strictEqual(s[0][6].dia, 1);
  const dias = [].concat.apply([], s).filter(c => !c.fuera);
  assert.strictEqual(dias.length, 30);
  assert.strictEqual(dias.reduce((n, c) => n + c.actividades.length, 0), 8);
});
test('cuadricula: la actividad cae en su dia', () => {
  const dias = [].concat.apply([], C.cuadriculaMes(2026, 10, reales)).filter(c => !c.fuera);
  assert.deepStrictEqual(dias.find(c => c.dia === 12).actividades.map(a => a.id), ['act-003']);
  assert.strictEqual(dias.find(c => c.dia === 13).actividades.length, 0);
});
test('cuadricula: febrero bisiesto 2028 tiene 29 dias; un mes que empieza en lunes no tiene vacias iniciales', () => {
  const feb = [].concat.apply([], C.cuadriculaMes(2028, 1, [])).filter(c => !c.fuera);
  assert.strictEqual(feb.length, 29);
  const feb2027 = C.cuadriculaMes(2027, 1, []);       // 1 feb 2027 es lunes
  assert.strictEqual(feb2027[0][0].dia, 1);
  assert.strictEqual(feb2027.length, 4);
});
test('cuadricula: dos actividades el mismo dia salen ordenadas por hora', () => {
  const dias = [].concat.apply([], C.cuadriculaMes(2026, 10, [act('t', '2026-11-10', '18:00'), act('m', '2026-11-10', '08:00')])).filter(c => !c.fuera);
  assert.deepStrictEqual(dias.find(c => c.dia === 10).actividades.map(a => a.id), ['m', 't']);
});
test('listaDelMes: solo el mes pedido y ordenada', () => {
  const l = C.listaDelMes(2026, 10, reales.concat([act('dic', '2026-12-01', '10:00')]));
  assert.strictEqual(l.length, 8);
  assert.deepStrictEqual(l.map(a => a.fecha), l.map(a => a.fecha).slice().sort());
  assert.strictEqual(C.listaDelMes(2026, 11, reales).length, 0);
});
test('desplazarMes cruza el anio en ambos sentidos', () => {
  assert.deepStrictEqual(C.desplazarMes(2026, 11, 1), { anio: 2027, mes: 0 });
  assert.deepStrictEqual(C.desplazarMes(2026, 0, -1), { anio: 2025, mes: 11 });
  assert.deepStrictEqual(C.desplazarMes(2026, 5, 1), { anio: 2026, mes: 6 });
});
test('mesInicial: hoy con actividades; hoy sin ellas va a la proxima; todo pasado va a la ultima; vacio va a hoy', () => {
  assert.deepStrictEqual(C.mesInicial(reales, '2026-11-15'), { anio: 2026, mes: 10 });
  assert.deepStrictEqual(C.mesInicial(reales, '2026-09-20'), { anio: 2026, mes: 10 });
  assert.deepStrictEqual(C.mesInicial(reales, '2027-03-01'), { anio: 2026, mes: 10 });
  assert.deepStrictEqual(C.mesInicial([], '2027-03-01'), { anio: 2027, mes: 2 });
});
test('fechaLarga y fechaIsoDeHoy', () => {
  assert.strictEqual(C.fechaLarga('2026-11-12'), 'jueves 12 de noviembre de 2026');
  assert.strictEqual(C.fechaIsoDeHoy(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});
