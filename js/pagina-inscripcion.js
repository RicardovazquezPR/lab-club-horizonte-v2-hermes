/* Club Horizonte v2 - pagina de inscripcion (DOM). Texto del JSON siempre con textContent. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.getElementById('formulario')) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var CAMPOS = ['nombre', 'correo', 'estudiante'];
  var estado = { acts: [], almacen: null };

  function storageSeguro() { try { return window.localStorage; } catch (e) { return null; } }

  function actual() {
    var id = $('actividad').value;
    return estado.acts.filter(function (a) { return a.id === id; })[0] || null;
  }

  function limpiarErrores() {
    CAMPOS.forEach(function (c) {
      $('error-' + c).textContent = '';
      $(c).removeAttribute('aria-invalid');
    });
  }

  function pintarEstado() {
    var a = actual();
    if (!a) { return; }
    var leido = estado.almacen.leer();
    var plazas = Inscripcion.plazasDisponibles(a, leido.lista);
    $('resumen-actividad').textContent = a.titulo + ' · ' + Calendario.fechaLarga(a.fecha) + ', ' + a.horaInicio + ' a ' + a.horaFin + ' · ' + a.lugar +
      ' · Plazas disponibles: ' + plazas + ' de ' + a.cupo;
    var agotada = plazas === 0;
    $('agotada').hidden = !agotada;
    $('enviar').disabled = agotada;
    CAMPOS.forEach(function (c) { $(c).disabled = agotada; });
    if (leido.error) { $('resultado').textContent = leido.error; }
  }

  function enviar(ev) {
    ev.preventDefault();
    limpiarErrores();
    $('resultado').textContent = '';
    var a = actual();
    if (!a) { return; }
    var datos = { nombre: $('nombre').value, correo: $('correo').value, estudiante: $('estudiante').value };
    var r = Inscripcion.inscribir(a, datos, estado.almacen);
    if (r.ok) {
      CAMPOS.forEach(function (c) { $(c).value = ''; });
      $('resultado').textContent = r.mensaje;
    } else {
      var primero = null;
      CAMPOS.forEach(function (c) {
        if (r.errores[c]) {
          $('error-' + c).textContent = r.errores[c];
          $(c).setAttribute('aria-invalid', 'true');
          if (!primero) { primero = $(c); }
        }
      });
      $('resultado').textContent = r.mensaje;
      if (primero) { primero.focus(); }
    }
    pintarEstado();
  }

  function iniciar() {
    estado.almacen = Inscripcion.crearAlmacen(storageSeguro());
    $('formulario').addEventListener('submit', enviar);
    $('actividad').addEventListener('change', function () { limpiarErrores(); $('resultado').textContent = ''; pintarEstado(); });
    Actividades.cargar('datos/actividades.json').then(function (r) {
      if (r.error) {
        var p = document.createElement('p'); p.className = 'error'; p.textContent = r.error;
        $('errores').appendChild(p);
        $('formulario').hidden = true; return;
      }
      estado.acts = Calendario.ordenar(r.actividades);
      var sel = $('actividad');
      estado.acts.forEach(function (a) {
        var o = document.createElement('option'); o.value = a.id;
        o.textContent = Calendario.fechaLarga(a.fecha) + ' · ' + a.titulo;
        sel.appendChild(o);
      });
      var pedida = new URLSearchParams(window.location.search).get('actividad');
      if (pedida && estado.acts.some(function (a) { return a.id === pedida; })) { sel.value = pedida; }
      pintarEstado();
    });
  }
  iniciar();
})();
