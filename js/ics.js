/* Club Horizonte v2 - generador de ficheros .ics (RFC 5545), sin dependencias.
   DEV0002 REQ-4 (3196). Horas locales "flotantes" (sin huso): el evento queda a la hora que
   dice el JSON en el calendario de quien lo importa. UID estable: importar dos veces no duplica. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) { module.exports = fabrica(); }
  else { raiz.Ics = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Escapa un valor de texto: \ ; , y saltos de linea (RFC 5545 3.3.11). */
  function escapar(t) {
    return String(t == null ? '' : t)
      .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n');
  }

  /* '2026-11-12' + '17:00' -> '20261112T170000' */
  function fechaHora(fecha, hora) {
    return fecha.replace(/-/g, '') + 'T' + hora.replace(':', '') + '00';
  }

  /* Instante UTC en formato 20261031T144700Z (DTSTAMP obliga a UTC). */
  function marcaUtc(d) {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  /* Pliega lineas a 75 octetos como maximo, sin partir un caracter multibyte. */
  function plegar(linea) {
    var enc = new TextEncoder();
    if (enc.encode(linea).length <= 75) { return linea; }
    var partes = [], actual = '', limite = 75;
    Array.from(linea).forEach(function (ch) {
      if (enc.encode(actual + ch).length > limite) {
        partes.push(actual); actual = ch; limite = 74;   // el espacio inicial cuenta
      } else { actual += ch; }
    });
    partes.push(actual);
    return partes.join('\r\n ');
  }

  /* Devuelve el texto completo del .ics de una actividad. `ahora` se inyecta para probar. */
  function generar(a, ahora) {
    var lineas = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Club Estudiantes Horizonte//Calendario v2//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + escapar(a.id) + '@club-horizonte-v2',
      'DTSTAMP:' + marcaUtc(ahora || new Date()),
      'DTSTART:' + fechaHora(a.fecha, a.horaInicio),
      'DTEND:' + fechaHora(a.fecha, a.horaFin),
      'SUMMARY:' + escapar(a.titulo),
      'LOCATION:' + escapar(a.lugar),
      'DESCRIPTION:' + escapar('Categoría: ' + a.categoria + '. Actividad del Club de Estudiantes Horizonte.'),
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lineas.map(plegar).join('\r\n') + '\r\n';
  }

  function nombreDeFichero(a) {
    var base = String(a.titulo).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (base || 'actividad') + '-' + a.fecha + '.ics';
  }

  return { generar: generar, escapar: escapar, plegar: plegar, nombreDeFichero: nombreDeFichero };
});
