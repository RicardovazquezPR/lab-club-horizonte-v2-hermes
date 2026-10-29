#!/bin/bash
# Suite completa del sitio. Uso: suite.sh   (desde cualquier carpeta)
# Imprime una linea JSON con instantes y cifras para la hoja de la tarea de cierre.
SITIO="$(cd "$(dirname "$0")/../.." && pwd)"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
ini=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cd "$SITIO"
f=$(node pruebas/prueba-fechas.js | tail -1)
c=$(node pruebas/prueba-contacto.js | tail -1)
cd "$(dirname "$0")"
s=$(node sitio.js "$SITIO" /tmp/suite 2>&1)
a=$(node actividades-dom.js "$SITIO" /tmp/suite-act 2>&1 | tr -d '\n ')
k=$(node contacto-dom.js "$SITIO" /tmp/suite-con 2>&1 | tr -d '\n ')
fin=$(date -u +%Y-%m-%dT%H:%M:%SZ)
python3 - "$ini" "$fin" "$f" "$c" "$s" <<'EOF'
import sys, json, re
ini, fin, f, c, s = sys.argv[1:6]
nf = int(re.search(r'(\d+) casos', f).group(1)); nc = int(re.search(r'(\d+) casos', c).group(1))
r = json.loads(s)
checks = 0; fallos = 0
for p, anchos in r['paginas'].items():
    for w, m in anchos.items():
        checks += 1
        if m['desborde'] or m['h1'] != 1 or m['menu'] != 3: fallos += 1
fallos += len(r['enlaces_rotos']) + len(r['externas']) + len(r['errores'])
print(json.dumps({"inicio": ini, "fin": fin, "logica_node": nf + nc,
                  "chrome_paginas": checks, "chrome_fallos": fallos,
                  "externas": len(r['externas']), "enlaces_rotos": len(r['enlaces_rotos'])}))
EOF
echo "dom actividades: $a" | cut -c1-200
echo "dom contacto: $k" | cut -c1-200
