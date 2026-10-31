/* Club Horizonte v2 - resumen de inscripciones y exportacion a CSV (sin DOM). DEV0002 REQ 3200.
   Antes: no existia. CSV con BOM UTF-8 para que Excel muestre bien los acentos; celdas con comillas o
   comas escapadas; celdas que empiezan por = + - @ se neutralizan para evitar inyeccion de formulas. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) { module.exports = fabrica(); }
  else { raiz.Exportar = fabrica(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BOM = '\uFEFF';
  var COLUMNAS = ['Actividad', 'Fecha', 'Nombre', 'Correo', 'Número de estudiante', 'Fecha de inscripción'];

  function neutralizar(texto) {
    var t = String(texto == null ? '' : texto);
    return /^[=+\-@\t\r]/.test(t) ? "'" + t : t;
  }

  function celda(valor) {
    var t = neutralizar(valor);
    return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }

  /* Agrupa por actividad (en el orden de las actividades) con plazas ocupadas y disponibles.
     Las inscripciones de una actividad que ya no existe en el JSON se ignoran. */
  function resumen(actividades, inscripciones) {
    return actividades.map(function (a) {
      var propias = inscripciones.filter(function (i) { return i.actividadId === a.id; });
      return {
        actividad: a,
        inscritos: propias,
        ocupadas: propias.length,
        disponibles: Math.max(0, a.cupo - propias.length)
      };
    });
  }

  function aCsv(actividades, inscripciones) {
    var filas = [COLUMNAS.map(celda).join(',')];
    resumen(actividades, inscripciones).forEach(function (g) {
      g.inscritos.forEach(function (i) {
        filas.push([g.actividad.titulo, g.actividad.fecha, i.nombre, i.correo, i.estudiante, i.fecha].map(celda).join(','));
      });
    });
    return BOM + filas.join('\r\n') + '\r\n';
  }

  return { BOM: BOM, COLUMNAS: COLUMNAS, neutralizar: neutralizar, celda: celda, resumen: resumen, aCsv: aCsv };
}));
