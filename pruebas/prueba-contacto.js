// Prueba de la validacion del formulario de contacto (js/app.js). Uso: node pruebas/prueba-contacto.js
// Sin librerias: solo assert de Node. Sale con codigo 1 si algo falla.
const assert = require('assert');
const { esCorreoValido, validarContacto } = require('../js/app.js');

let ok = 0;
function caso(nombre, fn) {
  try { fn(); ok++; console.log('ok   ' + nombre); }
  catch (e) { console.error('FALLA ' + nombre + ': ' + e.message); process.exitCode = 1; }
}

const bueno = { nombre: 'Ana', correo: 'ana@correo.com', mensaje: 'Hola' };

caso('todo valido: sin errores', () => assert.deepStrictEqual(validarContacto(bueno), {}));
caso('todo vacio: tres errores', () => {
  const e = validarContacto({ nombre: '', correo: '', mensaje: '' });
  assert.deepStrictEqual(Object.keys(e).sort(), ['correo', 'mensaje', 'nombre']);
  assert.strictEqual(e.correo, 'Escribe tu correo.');
});
caso('solo espacios cuenta como vacio', () => {
  const e = validarContacto({ nombre: '   ', correo: ' ', mensaje: '\n\t ' });
  assert.deepStrictEqual(Object.keys(e).sort(), ['correo', 'mensaje', 'nombre']);
});
caso('valores ausentes no rompen', () => assert.strictEqual(Object.keys(validarContacto({})).length, 3));
caso('falta solo el nombre', () => assert.deepStrictEqual(Object.keys(validarContacto({ ...bueno, nombre: '' })), ['nombre']));
caso('falta solo el mensaje', () => assert.deepStrictEqual(Object.keys(validarContacto({ ...bueno, mensaje: '' })), ['mensaje']));
caso('correo sin arroba: formato invalido', () => {
  assert.strictEqual(validarContacto({ ...bueno, correo: 'ana.correo.com' }).correo, 'El correo no tiene un formato válido.');
});
caso('correo con espacios alrededor es valido (se recorta)', () => assert.deepStrictEqual(validarContacto({ ...bueno, correo: '  ana@correo.com  ' }), {}));

['ana@correo.com', 'a.b+c@dominio.es', 'x@sub.dominio.org', 'a@b.co'].forEach(c =>
  caso('correo valido: ' + c, () => assert.strictEqual(esCorreoValido(c), true)));
['', 'ana', 'ana@', '@correo.com', 'ana@correo', 'ana@@correo.com', 'ana@correo..com', 'ana@.com', 'ana@correo.', 'a na@correo.com', 'ana@cor reo.com', null, undefined].forEach(c =>
  caso('correo invalido: ' + JSON.stringify(c), () => assert.strictEqual(esCorreoValido(c), false)));

console.log(ok + ' casos correctos' + (process.exitCode ? ' (HAY FALLOS)' : ''));
