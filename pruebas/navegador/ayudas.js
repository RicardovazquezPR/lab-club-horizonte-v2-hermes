/* Ayudas comunes de las pruebas de navegador (Playwright Chromium). DEV0002 REQ 3201, 3202.
   El sitio se sirve por HTTP local porque fetch() no funciona con file://. El reloj se fija en
   2026-10-31 para que el mes inicial y los resultados no dependan del dia en que se ejecuta. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..', '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png' };
const PAGINAS = ['index.html', 'quienes-somos.html', 'calendario.html', 'inscripcion.html', 'resumen.html', 'contacto.html'];
const ANCHOS = [375, 1280];

function servir() {
  return new Promise(function (resolve) {
    const srv = http.createServer(function (req, res) {
      const ruta = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(RAIZ, ruta === '/' ? 'index.html' : ruta);
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', function () { resolve({ srv: srv, base: 'http://127.0.0.1:' + srv.address().port + '/' }); });
  });
}

async function iniciar() {
  const s = await servir();
  const navegador = await chromium.launch();
  return {
    base: s.base,
    navegador: navegador,
    /* Abre una pagina con el reloj fijado y recoge errores de consola, de pagina y peticiones externas. */
    async abrir(pagina, opciones) {
      opciones = opciones || {};
      const ctx = await navegador.newContext({ viewport: { width: opciones.ancho || 1280, height: 900 }, acceptDownloads: true });
      const p = await ctx.newPage();
      p.errores = []; p.externas = [];
      p.on('pageerror', function (e) { p.errores.push('pageerror: ' + e); });
      p.on('console', function (m) { if (m.type() === 'error') { p.errores.push('console: ' + m.text()); } });
      p.on('request', function (r) { if (!r.url().startsWith(s.base) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) { p.externas.push(r.url()); } });
      await p.clock.install({ time: opciones.reloj || new Date(2026, 9, 31, 12, 0) });
      await p.goto(s.base + pagina);
      p.cerrarTodo = function () { return ctx.close(); };
      return p;
    },
    async cerrar() { await navegador.close(); s.srv.close(); }
  };
}

module.exports = { iniciar, PAGINAS, ANCHOS, RAIZ };
