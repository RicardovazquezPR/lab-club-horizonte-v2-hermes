// Uso: node check.js <carpeta-del-sitio> <pagina1,pagina2,...> <prefijo-capturas>
// Abre por file:// (como pide REQ-008), mide a 375 y 1280, registra peticiones y errores.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [dir, pages, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const result = {};
  for (const pg of pages.split(',')) {
    result[pg] = {};
    for (const w of [375, 1280]) {
      const p = await b.newPage({ viewport: { width: w, height: 800 } });
      const reqs = [], errs = [];
      p.on('request', r => reqs.push(r.url()));
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto('file://' + path.resolve(dir, pg));
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      await p.screenshot({ path: `${out}-${pg.replace('.html','')}-${w}.png`, fullPage: true });
      result[pg][w] = {
        overflowX: sw > w,
        external: reqs.filter(u => !u.startsWith('file://')),
        errors: errs,
      };
      await p.close();
    }
  }
  await b.close();
  console.log(JSON.stringify(result, null, 1));
})();
