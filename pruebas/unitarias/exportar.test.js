const test = require('node:test');
const assert = require('node:assert');
const Exportar = require('../../js/exportar.js');

const ACTS = [
  { id: 'a1', titulo: 'Taller de estudio', fecha: '2026-11-03', cupo: 3 },
  { id: 'a2', titulo: 'Charla, "especial"', fecha: '2026-11-05', cupo: 1 }
];
const INSC = [
  { actividadId: 'a1', nombre: 'Ana Pérez', correo: 'ana@correo.com', estudiante: '20261234', fecha: '2026-10-31T10:00:00.000Z' },
  { actividadId: 'a2', nombre: 'Luis Muñoz', correo: 'luis@correo.com', estudiante: '20265678', fecha: '2026-10-31T11:00:00.000Z' },
  { actividadId: 'zzz', nombre: 'Huérfano', correo: 'h@correo.com', estudiante: '1111', fecha: '2026-10-31T12:00:00.000Z' }
];

test('resumen: ocupadas y disponibles por actividad', () => {
  const r = Exportar.resumen(ACTS, INSC);
  assert.strictEqual(r.length, 2);
  assert.strictEqual(r[0].ocupadas, 1);
  assert.strictEqual(r[0].disponibles, 2);
  assert.strictEqual(r[1].disponibles, 0);
});

test('resumen: ignora inscripciones de actividades que ya no existen', () => {
  const total = Exportar.resumen(ACTS, INSC).reduce((s, g) => s + g.ocupadas, 0);
  assert.strictEqual(total, 2);
});

test('resumen: disponibles nunca es negativo', () => {
  const r = Exportar.resumen([{ id: 'a1', titulo: 'x', fecha: '2026-11-03', cupo: 0 }], INSC);
  assert.strictEqual(r[0].disponibles, 0);
});

test('csv: empieza con BOM UTF-8 y trae las seis columnas pedidas', () => {
  const csv = Exportar.aCsv(ACTS, INSC);
  assert.strictEqual(csv.charCodeAt(0), 0xFEFF);
  assert.strictEqual(csv.split('\r\n')[0].slice(1), 'Actividad,Fecha,Nombre,Correo,Número de estudiante,Fecha de inscripción');
});

test('csv: conserva los acentos', () => {
  const csv = Exportar.aCsv(ACTS, INSC);
  assert.ok(csv.includes('Ana Pérez'));
  assert.ok(csv.includes('Luis Muñoz'));
});

test('csv: una fila por inscripcion valida, sin huerfanas', () => {
  const lineas = Exportar.aCsv(ACTS, INSC).split('\r\n').filter(Boolean);
  assert.strictEqual(lineas.length, 3);
  assert.ok(!lineas.join('').includes('Huérfano'));
});

test('csv: escapa comas y comillas', () => {
  const csv = Exportar.aCsv(ACTS, INSC);
  assert.ok(csv.includes('"Charla, ""especial"""'));
});

test('csv: neutraliza celdas que empiezan por = + - @', () => {
  ['=SUMA(1)', '+1', '-1', '@x'].forEach((t) => {
    assert.strictEqual(Exportar.neutralizar(t), "'" + t);
  });
  const csv = Exportar.aCsv(ACTS, [{ actividadId: 'a1', nombre: '=HYPERLINK("x")', correo: 'a@b.co', estudiante: '1234', fecha: 'f' }]);
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));
});

test('csv: sin inscripciones solo trae la cabecera', () => {
  const lineas = Exportar.aCsv(ACTS, []).split('\r\n').filter(Boolean);
  assert.strictEqual(lineas.length, 1);
});
