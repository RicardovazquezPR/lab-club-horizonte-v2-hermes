const test = require('node:test');
const assert = require('node:assert');
const Ics = require('../../js/ics.js');

const act = { id: 'act-001', titulo: 'Taller de estudio en grupo', categoria: 'Académica', fecha: '2026-11-12',
  horaInicio: '17:00', horaFin: '18:30', lugar: 'Aula 204, edificio B', cupo: 20 };
const ahora = new Date('2026-10-31T14:47:00Z');

test('el .ics tiene la estructura VCALENDAR/VEVENT y fines de línea CRLF', () => {
  const t = Ics.generar(act, ahora);
  assert.match(t, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(t, /BEGIN:VEVENT\r\n/);
  assert.match(t, /END:VEVENT\r\nEND:VCALENDAR\r\n$/);
  assert.ok(!/[^\r]\n/.test(t), 'no debe haber LF sueltos');
});

test('fechas y horas salen en formato local flotante y DTSTAMP en UTC', () => {
  const t = Ics.generar(act, ahora);
  assert.match(t, /DTSTART:20261112T170000\r\n/);
  assert.match(t, /DTEND:20261112T183000\r\n/);
  assert.match(t, /DTSTAMP:20261031T144700Z\r\n/);
});

test('UID estable: dos descargas de la misma actividad no se duplican al importar', () => {
  const a = Ics.generar(act, ahora), b = Ics.generar(act, new Date('2027-01-01T00:00:00Z'));
  const uid = (t) => /UID:(.*)\r\n/.exec(t)[1];
  assert.strictEqual(uid(a), uid(b));
  assert.strictEqual(uid(a), 'act-001@club-horizonte-v2');
});

test('escapa coma, punto y coma, barra y saltos de línea', () => {
  assert.strictEqual(Ics.escapar('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const t = Ics.generar(Object.assign({}, act, { lugar: 'Sala 1, piso 2; ala norte' }), ahora);
  assert.match(t, /LOCATION:Sala 1\\, piso 2\\; ala norte\r\n/);
});

test('el título y el lugar con tildes se conservan', () => {
  const t = Ics.generar(Object.assign({}, act, { titulo: 'Charla: cómo preparar un proyecto' }), ahora);
  assert.ok(t.includes('Charla: cómo preparar un proyecto'));
});

test('ninguna línea supera 75 octetos y el plegado no parte caracteres', () => {
  const largo = Object.assign({}, act, { titulo: 'ñ'.repeat(120) });
  const t = Ics.generar(largo, ahora);
  const enc = new TextEncoder();
  t.split('\r\n').forEach((l) => assert.ok(enc.encode(l).length <= 75, 'línea larga: ' + l.length));
  const desplegado = t.replace(/\r\n /g, '');
  assert.ok(desplegado.includes('SUMMARY:' + 'ñ'.repeat(120)));
});

test('el nombre de fichero es seguro y lleva la fecha', () => {
  assert.strictEqual(Ics.nombreDeFichero(act), 'taller-de-estudio-en-grupo-2026-11-12.ics');
  assert.strictEqual(Ics.nombreDeFichero(Object.assign({}, act, { titulo: '¿¡Charla: cómo!?' })), 'charla-como-2026-11-12.ics');
  assert.strictEqual(Ics.nombreDeFichero(Object.assign({}, act, { titulo: '***' })), 'actividad-2026-11-12.ics');
});
