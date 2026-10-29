// Comprobacion global del sitio (REQ-008). Uso: node sitio.js <carpeta> <prefijo-capturas>
// Por file://: 4 paginas a 375 y 1280, enlaces internos que resuelven, 0 peticiones externas, 0 errores de consola.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [carpeta, prefijo] = process.argv.slice(2);
  const paginas = ['index.html', 'quienes-somos.html', 'actividades.html', 'contacto.html'];
  const browser = await chromium.launch();
  const informe = { paginas: {}, enlaces_rotos: [], externas: [], errores: [] };
  for (const p of paginas) {
    informe.paginas[p] = {};
    for (const w of [375, 1280]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      const page = await ctx.newPage();
      page.on('pageerror', e => informe.errores.push(p + ': ' + e));
      page.on('console', m => { if (m.type() === 'error') informe.errores.push(p + ': ' + m.text()); });
      page.on('request', r => { if (!r.url().startsWith('file://')) informe.externas.push(r.url()); });
      page.on('requestfailed', r => informe.errores.push(p + ' fallo de carga: ' + r.url()));
      await page.goto('file://' + path.resolve(carpeta, p));
      const m = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        desborde: document.documentElement.scrollWidth > window.innerWidth,
        menu: [...document.querySelectorAll('nav a')].map(a => a.getAttribute('href')),
        actual: [...document.querySelectorAll('nav a[aria-current=page]')].length,
        enlaces: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
      }));
      informe.paginas[p][w] = { h1: m.h1, desborde: m.desborde, menu: m.menu.length, actual: m.actual };
      if (w === 1280) {
        for (const h of m.enlaces) {
          if (/^(https?:|mailto:|#)/.test(h)) continue;
          if (!fs.existsSync(path.resolve(carpeta, h.split('#')[0]))) informe.enlaces_rotos.push(p + ' -> ' + h);
        }
      }
      await page.screenshot({ path: prefijo + '-' + p.replace('.html', '') + '-' + w + '.png', fullPage: true });
      await ctx.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(informe));
})().catch(e => { console.error(e); process.exit(1); });
