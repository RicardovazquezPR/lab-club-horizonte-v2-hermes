/* Club Horizonte v2 - pagina de resumen (DOM). Todo texto de datos se inserta con textContent. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.getElementById('resumen')) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var estado = { acts: [], inscripciones: [] };

  function storageSeguro() { try { return window.localStorage; } catch (e) { return null; } }

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto != null) { n.textContent = texto; }
    return n;
  }

  function pintar() {
    var cont = $('resumen');
    cont.textContent = '';
    var grupos = Exportar.resumen(estado.acts, estado.inscripciones);
    var total = 0;
    grupos.forEach(function (g) {
      total += g.ocupadas;
      var sec = el('section', 'grupo-resumen');
      sec.appendChild(el('h2', null, g.actividad.titulo));
      sec.appendChild(el('p', 'plazas-resumen', Calendario.fechaLarga(g.actividad.fecha) + ' · Plazas ocupadas: ' + g.ocupadas +
        ' · Plazas disponibles: ' + g.disponibles + ' de ' + g.actividad.cupo));
      if (!g.inscritos.length) {
        sec.appendChild(el('p', 'sin-inscritos', 'Todavía no hay inscripciones en esta actividad.'));
      } else {
        var tabla = el('table', 'tabla-resumen');
        var cap = el('caption', 'solo-lectores', 'Inscritos en ' + g.actividad.titulo);
        tabla.appendChild(cap);
        var cab = el('tr');
        ['Nombre', 'Correo', 'Número de estudiante', 'Fecha de inscripción'].forEach(function (t) {
          var th = el('th', null, t); th.setAttribute('scope', 'col'); cab.appendChild(th);
        });
        var thead = el('thead'); thead.appendChild(cab); tabla.appendChild(thead);
        var tbody = el('tbody');
        g.inscritos.forEach(function (i) {
          var tr = el('tr');
          [i.nombre, i.correo, i.estudiante, i.fecha].forEach(function (v) { tr.appendChild(el('td', null, v)); });
          tbody.appendChild(tr);
        });
        tabla.appendChild(tbody);
        var envoltorio = el('div', 'tabla-scroll');
        envoltorio.appendChild(tabla);
        sec.appendChild(envoltorio);
      }
      cont.appendChild(sec);
    });
    $('estado-resumen').textContent = total === 1 ? '1 inscripción en total.' : total + ' inscripciones en total.';
    $('exportar').disabled = total === 0;
  }

  function descargar() {
    var csv = Exportar.aCsv(estado.acts, estado.inscripciones);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'inscripciones-club-horizonte.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function iniciar() {
    $('exportar').addEventListener('click', descargar);
    Actividades.cargar('datos/actividades.json').then(function (r) {
      if (r.error) { $('errores').textContent = r.error; $('exportar').disabled = true; return; }
      estado.acts = r.actividades;
      var leido = Inscripcion.crearAlmacen(storageSeguro()).leer();
      if (leido.error) { $('errores').textContent = leido.error; }
      estado.inscripciones = leido.lista;
      pintar();
    });
  }
  iniciar();
})();
