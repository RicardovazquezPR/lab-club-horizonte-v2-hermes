# Club de Estudiantes Horizonte, versión 2 (sitio de prueba)

Sitio web estático para un club de estudiantes. La versión 2 añade un calendario de actividades, la inscripción a cada actividad y un resumen de inscripciones con exportación a CSV. Sin servidor ni base de datos: HTML, CSS y JavaScript que se ejecuta en el navegador.

Todos los datos (nombres del equipo, correo, aula, horario y actividades) son ficticios.

Sitio publicado: https://ricardovazquezpr.github.io/lab-club-horizonte-v2-hermes/

## Cómo abrirlo

El calendario, la inscripción y el resumen cargan `datos/actividades.json` con `fetch`, y los navegadores no permiten eso con `file://`. Hay que servir la carpeta por HTTP:

    python3 -m http.server 8080

y abrir `http://127.0.0.1:8080/`. Las páginas de la versión 1 (portada, quiénes somos, actividades, contacto) también funcionan con doble clic.

## Qué contiene

- `index.html`, `quienes-somos.html`, `actividades.html`, `contacto.html`: páginas de la versión 1 (el formulario de contacto sigue sin enviar nada).
- `calendario.html`: actividades en vista de mes o de lista, filtro por categoría, detalle de cada actividad y descarga de un archivo `.ics`.
- `inscripcion.html`: formulario de inscripción a una actividad, con validación y control de cupo.
- `resumen.html`: inscripciones guardadas, con plazas ocupadas por actividad y botón «Descargar CSV».
- `datos/actividades.json`: las actividades (id, título, categoría, fecha, horas, lugar, cupo y descripción).
- `js/`: lógica del calendario, del `.ics`, de la inscripción y de la exportación, más un archivo por página.
- `css/estilos.css`: estilos de todo el sitio, para móvil (375 px) y pantalla grande (1280 px).
- `pruebas/`: pruebas automáticas. `.github/workflows/pruebas.yml`: flujo de GitHub Actions que las ejecuta.

## Cómo cambiar los datos

- Actividades: edita `datos/actividades.json`. Cada actividad lleva `id`, `titulo`, `categoria`, `fecha` (`AAAA-MM-DD`), `horaInicio`, `horaFin` (`HH:MM`), `lugar`, `cupo` y `descripcion`.
- Equipo, correo, aula y horario: edita directamente `quienes-somos.html` y `contacto.html`.

## Cómo probarlo

Hace falta Node 20 o superior. Desde esta carpeta:

    npm ci
    npx playwright install chromium
    npm test

`npm test` ejecuta, en este orden:

- `npm run test:unit`: pruebas unitarias de la lógica (calendario, `.ics`, inscripción y CSV), sin navegador.
- `npm run test:v1`: pruebas del sitio v1 (fechas de actividades y formulario de contacto).
- `npm run test:navegador`: pruebas en Chromium real (Playwright) de todas las páginas a 375 y 1280 px, con comprobación de accesibilidad con axe-core (reglas WCAG A y AA). Las pruebas levantan su propio servidor local y fijan el reloj en el 31 de octubre de 2026 para no depender del día en que se ejecutan.

## Integración continua y publicación

- Cada push y cada pull request a `main` ejecuta el flujo `.github/workflows/pruebas.yml` (instala dependencias con `npm ci`, instala Chromium y corre las mismas tres órdenes de arriba).
- GitHub Pages publica la rama `main` (carpeta raíz). Publicar es fusionar un pull request a `main`; el flujo de pruebas no despliega nada por sí mismo, así que una fusión con pruebas en rojo también se publica. Conviene fusionar solo con las pruebas en verde.
- `.nojekyll` evita que Pages procese el sitio con Jekyll.

## Límites conocidos

- El formulario de contacto **no envía el mensaje a nadie**: valida los campos y muestra «Mensaje recibido».
- Las inscripciones se guardan solo en el `localStorage` del navegador de cada persona. No hay servidor: el cupo se controla por navegador, así que dos personas en dos equipos distintos no comparten plazas ocupadas, y el resumen solo muestra lo inscrito desde ese navegador.
- Las actividades de `datos/actividades.json` son de ejemplo (fechas de noviembre de 2026).
- La fecha de «hoy» es la del navegador de quien visita la página, no la del servidor.
- Con JavaScript desactivado el calendario, la inscripción y el resumen no funcionan.
- La comprobación del correo es básica (`usuario@dominio.ext`, sin espacios); no cubre todos los casos del estándar.
- El diseño solo se ha comprobado en Chromium (Chrome).
