/* Club de Estudiantes Horizonte - logica del navegador, sin dependencias.
   DEV0001 REQ-003 / REQ-004: ordenar actividades por fecha y ocultar las pasadas.
   Las funciones puras estan al principio y se exportan para probarlas con Node
   (js/prueba-fechas.js); el codigo que toca el DOM va al final y solo corre en el navegador. */

/* Devuelve la fecha ISO (AAAA-MM-DD) de "hoy" en la hora local del visitante. */
function fechaIsoDeHoy(ahora) {
  var d = ahora || new Date();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mes + '-' + dia;
}

/* true si el texto es una fecha AAAA-MM-DD que existe en el calendario. */
function esFechaIso(texto) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');
  if (!m) { return false; }
  var f = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return f.getFullYear() === Number(m[1]) && f.getMonth() === Number(m[2]) - 1 && f.getDate() === Number(m[3]);
}

/* Una actividad es pasada si su fecha es anterior a hoy. La de hoy sigue visible.
   Una fecha ilegible NO se oculta: es mejor mostrar de mas que perder una actividad. */
function esPasada(fechaIso, hoyIso) {
  if (!esFechaIso(fechaIso)) { return false; }
  return fechaIso < hoyIso;
}

/* Ordena una lista de {fecha, hora} de la mas proxima a la mas lejana (copia, no muta).
   Con la misma fecha manda la hora; las fechas ilegibles van al final. */
function ordenarPorFecha(items) {
  return items.slice().sort(function (a, b) {
    var va = esFechaIso(a.fecha), vb = esFechaIso(b.fecha);
    if (va !== vb) { return va ? -1 : 1; }
    var ka = (a.fecha || '') + ' ' + (a.hora || ''), kb = (b.fecha || '') + ' ' + (b.hora || '');
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/* Parte del DOM: solo corre si hay un contenedor de actividades en la pagina. */
function iniciarActividades(doc, ahora) {
  var lista = doc.getElementById('lista-actividades');
  var vacio = doc.getElementById('sin-actividades');
  if (!lista || !vacio) { return; }
  var hoy = fechaIsoDeHoy(ahora);
  var nodos = Array.prototype.slice.call(lista.querySelectorAll('[data-fecha]'));
  var datos = nodos.map(function (n) {
    var t = n.querySelector('time');
    return { nodo: n, fecha: n.getAttribute('data-fecha'), hora: t ? (t.getAttribute('data-hora') || '') : '' };
  });
  var visibles = 0;
  ordenarPorFecha(datos).forEach(function (d) {
    lista.appendChild(d.nodo);
    var oculta = esPasada(d.fecha, hoy);
    d.nodo.hidden = oculta;
    if (!oculta) { visibles += 1; }
  });
  vacio.hidden = visibles !== 0;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fechaIsoDeHoy: fechaIsoDeHoy, esFechaIso: esFechaIso, esPasada: esPasada, ordenarPorFecha: ordenarPorFecha };
}
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () { iniciarActividades(document); });
}
