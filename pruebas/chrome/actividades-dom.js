// Prueba en Chrome real de actividades.html (DOM, ordenacion, ocultacion, mensaje vacio).
// Uso: node actividades-dom.js <carpeta-del-sitio> <prefijo-capturas>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [dir, out] = process.argv.slice(2);
  const url = 'file://' + path.resolve(dir, 'actividades.html');
  const b = await chromium.launch();
  const res = {};

  async function leer(p) {
    return p.evaluate(() => ({
      visibles: [...document.querySelectorAll('.actividad')].filter(n => !n.hidden).map(n => n.dataset.fecha),
      ocultas: [...document.querySelectorAll('.actividad')].filter(n => n.hidden).map(n => n.dataset.fecha),
      vacioVisible: !document.getElementById('sin-actividades').hidden,
      vacioTexto: document.getElementById('sin-actividades').textContent,
      primera: (() => { const n = [...document.querySelectorAll('.actividad')].find(x => !x.hidden); return n ? { h2: !!n.querySelector('h2').textContent.trim(), time: !!n.querySelector('time').textContent.trim(), lugar: n.querySelector('.lugar').textContent.trim().length > 0 } : null; })(),
    }));
  }

  // Caso A: hoy = 2026-10-29 (reloj fijado)
  for (const w of [375, 1280]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    const errs = [], reqs = [];
    p.on('pageerror', e => errs.push(String(e)));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('request', r => reqs.push(r.url()));
    await p.clock.install({ time: new Date(2026, 9, 29, 12, 0) });
    await p.goto(url);
    const r = await leer(p);
    r.overflowX = await p.evaluate(w2 => document.documentElement.scrollWidth > w2, w);
    r.errores = errs; r.externas = reqs.filter(u => !u.startsWith('file://'));
    res['hoy2026-10-29@' + w] = r;
    await p.screenshot({ path: `${out}-actividades-${w}.png`, fullPage: true });
    await p.close();
  }
  // Caso B: hoy = 2028-01-01 -> todas pasadas -> mensaje vacio
  {
    const p = await b.newPage({ viewport: { width: 375, height: 800 } });
    await p.clock.install({ time: new Date(2028, 0, 1, 12, 0) });
    await p.goto(url);
    res['hoy2028-01-01@375'] = await leer(p);
    await p.screenshot({ path: `${out}-actividades-vacio-375.png`, fullPage: true });
    await p.close();
  }
  // Caso C: el dia de la actividad sigue visible (2026-11-12 a las 23:59)
  {
    const p = await b.newPage();
    await p.clock.install({ time: new Date(2026, 10, 12, 23, 59) });
    await p.goto(url);
    const r = await leer(p);
    res['hoy2026-11-12'] = { primeraVisible: r.visibles[0], visibles: r.visibles.length };
    await p.close();
  }
  await b.close();
  console.log(JSON.stringify(res, null, 1));
})();
