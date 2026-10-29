// Prueba en Chrome real del formulario de contacto (REQ-005) abriendo por file://.
// Uso: node contacto-dom.js <carpeta-del-sitio> <prefijo-capturas>
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [carpeta, prefijo] = process.argv.slice(2);
  const url = 'file://' + path.resolve(carpeta, 'contacto.html');
  const browser = await chromium.launch();
  const resultado = { pasos: {}, errores: [], externas: [] };
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => resultado.errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') resultado.errores.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith('file://')) resultado.externas.push(r.url()); });
  let navegaciones = 0;
  page.on('framenavigated', () => navegaciones++);
  await page.goto(url);
  const base = navegaciones;

  const estado = async () => page.evaluate(() => {
    const v = id => { const e = document.getElementById(id); return e ? { texto: e.textContent, oculto: e.hidden } : null; };
    return {
      nombre: v('error-nombre'), correo: v('error-correo'), mensaje: v('error-mensaje'), exito: v('exito-contacto'),
      invalidos: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.id),
      foco: document.activeElement && document.activeElement.id,
      valores: ['nombre', 'correo', 'mensaje'].map(c => document.getElementById(c).value),
      desborde: document.documentElement.scrollWidth > window.innerWidth
    };
  });

  // 1) enviar vacio
  await page.click('button[type=submit]');
  resultado.pasos.vacio = await estado();
  await page.screenshot({ path: prefijo + '-vacio-375.png', fullPage: true });

  // 2) correo sin formato
  await page.fill('#nombre', 'Ana');
  await page.fill('#correo', 'ana.correo.com');
  await page.fill('#mensaje', 'Hola');
  await page.click('button[type=submit]');
  resultado.pasos.correoMalo = await estado();
  await page.screenshot({ path: prefijo + '-correo-malo-375.png', fullPage: true });

  // 3) todo valido
  await page.fill('#correo', 'ana@correo.com');
  await page.click('button[type=submit]');
  resultado.pasos.valido = await estado();
  await page.screenshot({ path: prefijo + '-valido-375.png', fullPage: true });

  // 4) escribir de nuevo oculta el exito
  await page.fill('#nombre', 'B');
  resultado.pasos.tras_escribir = (await estado()).exito;

  resultado.navegaciones_extra = navegaciones - base;

  // 5) 1280 px
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.click('button[type=submit]');
  resultado.pasos.ancho1280 = { desborde: (await estado()).desborde };
  await page.screenshot({ path: prefijo + '-1280.png', fullPage: true });

  await browser.close();
  console.log(JSON.stringify(resultado, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
