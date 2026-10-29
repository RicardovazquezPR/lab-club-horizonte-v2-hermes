// Prueba de la logica de fechas de js/app.js. Uso: node pruebas/prueba-fechas.js
// No usa librerias: solo assert de Node. Sale con codigo 1 si algo falla.
const assert = require('assert');
const { fechaIsoDeHoy, esFechaIso, esPasada, ordenarPorFecha } = require('../js/app.js');

let ok = 0;
function caso(nombre, fn) {
  try { fn(); ok += 1; console.log('  ok  ' + nombre); }
  catch (e) { console.log('FALLA ' + nombre + '\n      ' + e.message); process.exitCode = 1; }
}

caso('fechaIsoDeHoy rellena mes y dia con cero', () => {
  assert.strictEqual(fechaIsoDeHoy(new Date(2026, 0, 5, 9, 0)), '2026-01-05');
});
caso('fechaIsoDeHoy usa la fecha local aunque sea casi medianoche', () => {
  assert.strictEqual(fechaIsoDeHoy(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
});
caso('esFechaIso acepta fechas reales y 29 de febrero bisiesto', () => {
  assert.ok(esFechaIso('2026-10-29'));
  assert.ok(esFechaIso('2028-02-29'));
});
caso('esFechaIso rechaza inexistentes y mal formadas', () => {
  for (const malo of ['2027-02-29', '2026-13-01', '2026-00-10', '2026-1-5', '29/10/2026', '', null, undefined, 'manana']) {
    assert.strictEqual(esFechaIso(malo), false, 'deberia rechazar ' + String(malo));
  }
});
caso('esPasada: ayer si, hoy no, manana no', () => {
  assert.strictEqual(esPasada('2026-10-28', '2026-10-29'), true);
  assert.strictEqual(esPasada('2026-10-29', '2026-10-29'), false);
  assert.strictEqual(esPasada('2026-10-30', '2026-10-29'), false);
});
caso('esPasada compara bien al cruzar de ano y de mes', () => {
  assert.strictEqual(esPasada('2026-12-31', '2027-01-01'), true);
  assert.strictEqual(esPasada('2027-01-01', '2026-12-31'), false);
  assert.strictEqual(esPasada('2026-09-30', '2026-10-01'), true);
});
caso('esPasada no oculta una fecha ilegible', () => {
  assert.strictEqual(esPasada('pronto', '2026-10-29'), false);
  assert.strictEqual(esPasada('', '2026-10-29'), false);
});
caso('ordenarPorFecha ordena ascendente y no muta la entrada', () => {
  const entrada = [
    { fecha: '2027-01-21', hora: '16:00' }, { fecha: '2026-11-12', hora: '17:00' },
    { fecha: '2026-12-03', hora: '18:30' }, { fecha: '2026-11-26', hora: '19:00' },
  ];
  const copia = JSON.stringify(entrada);
  const salida = ordenarPorFecha(entrada);
  assert.deepStrictEqual(salida.map(x => x.fecha), ['2026-11-12', '2026-11-26', '2026-12-03', '2027-01-21']);
  assert.strictEqual(JSON.stringify(entrada), copia);
});
caso('ordenarPorFecha desempata por hora y deja las ilegibles al final', () => {
  const salida = ordenarPorFecha([
    { fecha: 'pronto', hora: '09:00' }, { fecha: '2026-11-01', hora: '18:00' }, { fecha: '2026-11-01', hora: '09:00' },
  ]);
  assert.deepStrictEqual(salida.map(x => x.hora), ['09:00', '18:00', '09:00']);
  assert.strictEqual(salida[2].fecha, 'pronto');
});
caso('ordenarPorFecha con lista vacia devuelve lista vacia', () => {
  assert.deepStrictEqual(ordenarPorFecha([]), []);
});
caso('flujo completo: 6 actividades, hoy 2026-10-29 -> 4 visibles ordenadas, 2 ocultas', () => {
  const todas = ['2027-01-21', '2026-11-12', '2026-09-10', '2026-12-03', '2026-10-08', '2026-11-26'].map(f => ({ fecha: f, hora: '' }));
  const hoy = '2026-10-29';
  const visibles = ordenarPorFecha(todas).filter(a => !esPasada(a.fecha, hoy)).map(a => a.fecha);
  assert.deepStrictEqual(visibles, ['2026-11-12', '2026-11-26', '2026-12-03', '2027-01-21']);
});

console.log('\n' + ok + ' casos correctos' + (process.exitCode ? ', HAY FALLOS' : ', sin fallos'));
