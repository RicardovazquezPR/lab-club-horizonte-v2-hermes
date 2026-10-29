# Club de Estudiantes Horizonte (sitio de prueba)

Sitio web estático de 4 páginas para un club de estudiantes. Sin servidor, sin base de datos y sin dependencias: HTML, CSS y un único archivo de JavaScript.

Todos los datos (nombres del equipo, correo, aula, horario y actividades) son ficticios.

## Cómo abrirlo

Haz doble clic en `index.html`. Funciona abriéndolo directamente desde el disco (`file://`), sin instalar nada y sin conexión a internet.

Si prefieres servirlo por HTTP: `python3 -m http.server 8080` dentro de esta carpeta y abre `http://127.0.0.1:8080/`.

## Qué contiene

- `index.html`: portada con acceso a las otras páginas.
- `quienes-somos.html`: misión, valores y equipo (4 personas con nombre y cargo).
- `actividades.html`: próximas actividades con título, fecha, hora y lugar. Se muestran ordenadas de la más próxima a la más lejana y las que ya pasaron se ocultan solas.
- `contacto.html`: correo, aula y horario de reunión, y un formulario con validación.
- `css/estilos.css`: estilos de todo el sitio, adaptados a móvil (probado a 375 px) y a pantalla grande (1280 px).
- `js/app.js`: ordenar y ocultar actividades por fecha, y validar el formulario.
- `pruebas/`: pruebas automáticas de la lógica (necesitan Node, no son necesarias para usar el sitio).

## Cómo cambiar los datos

- Actividades: en `actividades.html`, cada actividad es un bloque `article`. Cambia a la vez `data-fecha` (formato `AAAA-MM-DD`), el atributo `datetime` y el texto de `time`, y `data-hora`. Si una `data-fecha` no se entiende, la actividad se deja visible en lugar de ocultarla.
- Equipo, correo, aula y horario: edita directamente `quienes-somos.html` y `contacto.html`.

## Cómo probarlo

Con Node instalado, desde esta carpeta:

    node pruebas/prueba-fechas.js
    node pruebas/prueba-contacto.js

Cada comando termina con el número de casos correctos y sale con error si alguno falla.

## Límites conocidos

- El formulario de contacto **no envía el mensaje a nadie**: valida los campos y muestra «Mensaje recibido». Para recibir mensajes de verdad haría falta un servicio aparte.
- La fecha de «hoy» es la del navegador de quien visita la página, no la del servidor.
- Con JavaScript desactivado se ven todas las actividades (sin ordenar ni filtrar) y el formulario no valida.
- La comprobación del correo es básica (`usuario@dominio.ext`, sin espacios); no cubre todos los casos del estándar.
- El diseño solo se ha comprobado en Chromium (Chrome).
