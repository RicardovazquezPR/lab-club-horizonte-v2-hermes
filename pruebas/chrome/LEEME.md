# Pruebas en Chrome (opcionales)

Comprueban las 4 páginas en un Chromium real abriéndolas por file://: sin desborde a 375 y 1280 px, sin peticiones externas, sin enlaces rotos ni errores de consola, y el comportamiento de actividades y formulario.

No hacen falta para usar el sitio. Requieren Node y Playwright:

    npm install playwright && npx playwright install chromium
    pruebas/chrome/suite.sh

Los scripts importan `playwright`: se resuelve desde `node_modules` de esta carpeta o de una superior.
