/* REQ 3201: cada pagina, a 375 y 1280 px, sin desbordamiento horizontal, sin peticiones externas,
   sin errores de consola, un solo h1, menu con tres enlaces y enlaces internos que existen. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { iniciar, PAGINAS, ANCHOS, RAIZ } = require('./ayudas.js');

let h;
test.before(async function () { h = await iniciar(); });
test.after(async function () { await h.cerrar(); });

for (const pagina of PAGINAS) {
  for (const ancho of ANCHOS) {
    test(pagina + ' a ' + ancho + ' px: diseno y red', async function () {
      const p = await h.abrir(pagina, { ancho: ancho });
      await p.waitForLoadState('networkidle');
      const m = await p.evaluate(function () {
        return {
          desborde: document.documentElement.scrollWidth > window.innerWidth,
          h1: document.querySelectorAll('h1').length,
          menu: document.querySelectorAll('nav a').length,
          lang: document.documentElement.lang,
          enlaces: Array.prototype.map.call(document.querySelectorAll('a[href]'), function (a) { return a.getAttribute('href'); })
        };
      });
      assert.strictEqual(m.desborde, false, 'desbordamiento horizontal');
      assert.strictEqual(m.h1, 1, 'debe haber un solo h1');
      assert.strictEqual(m.menu, 3, 'el menu tiene tres enlaces');
      assert.strictEqual(m.lang, 'es');
      assert.deepStrictEqual(p.externas, [], 'peticiones externas');
      assert.deepStrictEqual(p.errores, [], 'errores de consola');
      for (const href of m.enlaces) {
        if (/^(https?:|mailto:|#)/.test(href)) { continue; }
        const fichero = href.split('#')[0].split('?')[0];
        assert.ok(fs.existsSync(path.join(RAIZ, fichero)), 'enlace roto: ' + href);
      }
      await p.cerrarTodo();
    });
  }
}

test('actividades.html redirige al calendario', async function () {
  const p = await h.abrir('actividades.html');
  await p.waitForURL(/calendario\.html$/);
  assert.match(await p.textContent('h1'), /Calendario de actividades/);
  await p.cerrarTodo();
});
