/* REQ 3197-3199: inscripcion en navegador real (validacion, guardado, cupos, duplicados, localStorage). */
const test = require('node:test');
const assert = require('node:assert');
const { iniciar } = require('./ayudas.js');

let h;
test.before(async function () { h = await iniciar(); });
test.after(async function () { await h.cerrar(); });

async function rellenar(p, nombre, correo, est) {
  await p.fill('#nombre', nombre); await p.fill('#correo', correo); await p.fill('#estudiante', est);
}

test('enviar vacio muestra tres errores y pone el foco en el primer campo', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001', { ancho: 375 });
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await p.click('#enviar');
  assert.ok((await p.textContent('#error-nombre')).length > 0);
  assert.ok((await p.textContent('#error-correo')).length > 0);
  assert.ok((await p.textContent('#error-estudiante')).length > 0);
  assert.strictEqual(await p.evaluate(function () { return document.activeElement.id; }), 'nombre');
  assert.strictEqual(await p.getAttribute('#nombre', 'aria-invalid'), 'true');
  await p.cerrarTodo();
});

test('correo con formato malo y numero de estudiante no valido se rechazan', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await rellenar(p, 'Ana Pérez', 'ana@', '12');
  await p.click('#enviar');
  assert.ok((await p.textContent('#error-correo')).length > 0);
  assert.ok((await p.textContent('#error-estudiante')).length > 0);
  assert.strictEqual((await p.textContent('#error-nombre')).trim(), '');
  await p.cerrarTodo();
});

test('inscripcion valida: se confirma, baja una plaza y persiste tras recargar', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  assert.match(await p.textContent('#resumen-actividad'), /20/);
  await rellenar(p, 'Ana Pérez', 'ana@correo.com', '20261234');
  await p.click('#enviar');
  assert.match(await p.textContent('#resultado'), /inscri/i);
  assert.match(await p.textContent('#resumen-actividad'), /19/);
  await p.reload();
  await p.waitForSelector('#actividad option', { state: 'attached' });
  assert.match(await p.textContent('#resumen-actividad'), /19/);
  assert.deepStrictEqual(p.errores, []);
  await p.cerrarTodo();
});

test('el mismo correo (con otras mayusculas) no se inscribe dos veces en la misma actividad', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-001');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await rellenar(p, 'Ana Pérez', 'ana@correo.com', '20261234');
  await p.click('#enviar');
  await rellenar(p, 'Ana Pérez', 'ANA@Correo.com', '20261234');
  await p.click('#enviar');
  assert.match(await p.textContent('#error-correo'), /ya/i);
  assert.match(await p.textContent('#resumen-actividad'), /19/);
  await p.cerrarTodo();
});

test('con cupo 2: al llenarse aparece Agotada y el formulario se deshabilita', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-007');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await rellenar(p, 'Uno Uno', 'uno@correo.com', '1111');
  await p.click('#enviar');
  await rellenar(p, 'Dos Dos', 'dos@correo.com', '2222');
  await p.click('#enviar');
  assert.strictEqual(await p.isVisible('#agotada'), true);
  assert.strictEqual(await p.isDisabled('#enviar'), true);
  assert.strictEqual(await p.isDisabled('#nombre'), true);
  await p.reload();
  await p.waitForSelector('#actividad option', { state: 'attached' });
  assert.strictEqual(await p.isVisible('#agotada'), true);
  await p.cerrarTodo();
});

test('si localStorage esta bloqueado se avisa y no se finge que se guardo', async function () {
  const ctx = await h.navegador.newContext();
  const q = await ctx.newPage();
  await q.addInitScript(function () {
    Object.defineProperty(window, 'localStorage', { get: function () { throw new Error('bloqueado'); } });
  });
  await q.goto(h.base + 'inscripcion.html?actividad=act-001');
  await q.waitForSelector('#actividad option', { state: 'attached' });
  await rellenar(q, 'Ana Pérez', 'ana@correo.com', '20261234');
  await q.click('#enviar');
  const texto = (await q.textContent('#errores')) + (await q.textContent('#resultado'));
  assert.match(texto, /no se (ha )?guard|almacen|bloquea|navegador/i);
  assert.doesNotMatch(await q.textContent('#resultado'), /^Inscripción (realizada|guardada)/);
  await ctx.close();
});

test('solo con teclado se puede completar la inscripcion', async function () {
  const p = await h.abrir('inscripcion.html?actividad=act-002');
  await p.waitForSelector('#actividad option', { state: 'attached' });
  await p.focus('#nombre');
  await p.keyboard.type('Luis Gómez');
  await p.keyboard.press('Tab');
  await p.keyboard.type('luis@correo.com');
  await p.keyboard.press('Tab');
  await p.keyboard.type('30303030');
  await p.keyboard.press('Enter');
  assert.match(await p.textContent('#resultado'), /inscri/i);
  await p.cerrarTodo();
});
