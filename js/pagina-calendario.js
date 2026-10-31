/* Club Horizonte v2 - pagina del calendario (DOM). Solo corre en el navegador.
   Toda cadena que viene del JSON se inserta con textContent, nunca con innerHTML. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.getElementById('vista-contenido')) { return; }

  var $ = function (id) { return document.getElementById(id); };
  var DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var estado = { todas: [], anio: 0, mes: 0, vista: 'mes', categorias: [], elegidas: [], actual: null, hoy: '' };

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) { e.className = clase; }
    if (texto != null) { e.textContent = texto; }
    return e;
  }
  function vaciar(n) { while (n.firstChild) { n.removeChild(n.firstChild); } }

  function visibles() { return Calendario.filtrar(estado.todas, estado.elegidas); }
  function etiquetaActividad(a) { return a.horaInicio + ' ' + a.titulo; }

  function botonActividad(a) {
    var b = el('button', 'chip categoria-' + estado.categorias.indexOf(a.categoria), etiquetaActividad(a));
    b.type = 'button';
    b.setAttribute('data-id', a.id);
    b.setAttribute('aria-label', a.titulo + ', ' + Calendario.fechaLarga(a.fecha) + ', ' + a.horaInicio + ', ' + a.categoria);
    b.addEventListener('click', function () { mostrarDetalle(a, b); });
    return b;
  }

  function pintarMes() {
    var cont = $('vista-contenido'); vaciar(cont);
    var semanas = Calendario.cuadriculaMes(estado.anio, estado.mes, visibles());
    var tabla = el('table', 'rejilla');
    tabla.appendChild(el('caption', 'solo-lectores', 'Actividades de ' + MESES[estado.mes] + ' de ' + estado.anio));
    var cab = el('tr');
    DIAS.forEach(function (d) { var th = el('th', null, d); th.scope = 'col'; cab.appendChild(th); });
    var thead = el('thead'); thead.appendChild(cab); tabla.appendChild(thead);
    var tbody = el('tbody');
    semanas.forEach(function (sem) {
      var tr = el('tr');
      sem.forEach(function (c) {
        var td = el('td', c.fuera ? 'fuera' : 'dia');
        if (!c.fuera) {
          var iso = estado.anio + '-' + String(estado.mes + 1).padStart(2, '0') + '-' + String(c.dia).padStart(2, '0');
          if (iso === estado.hoy) { td.className += ' hoy'; td.setAttribute('aria-label', 'Hoy'); }
          td.appendChild(el('span', 'num', String(c.dia)));
          c.actividades.forEach(function (a) { td.appendChild(botonActividad(a)); });
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);
    cont.appendChild(tabla);
  }

  function pintarLista() {
    var cont = $('vista-contenido'); vaciar(cont);
    var lista = Calendario.listaDelMes(estado.anio, estado.mes, visibles());
    var ul = el('ul', 'lista-actividades');
    lista.forEach(function (a) {
      var li = el('li', 'item-actividad');
      var b = el('button', 'item-boton');
      b.type = 'button'; b.setAttribute('data-id', a.id);
      b.appendChild(el('span', 'item-fecha', Calendario.fechaLarga(a.fecha) + ', ' + a.horaInicio + '–' + a.horaFin));
      b.appendChild(el('span', 'item-titulo', a.titulo));
      b.appendChild(el('span', 'item-lugar', a.lugar + ' · ' + a.categoria));
      b.addEventListener('click', function () { mostrarDetalle(a, b); });
      li.appendChild(b); ul.appendChild(li);
    });
    cont.appendChild(ul);
  }

  function pintar() {
    $('etiqueta-mes').textContent = MESES[estado.mes] + ' de ' + estado.anio;
    $('vista-mes').setAttribute('aria-pressed', estado.vista === 'mes' ? 'true' : 'false');
    $('vista-lista').setAttribute('aria-pressed', estado.vista === 'lista' ? 'true' : 'false');
    if (estado.vista === 'mes') { pintarMes(); } else { pintarLista(); }
    $('sin-actividades').hidden = Calendario.listaDelMes(estado.anio, estado.mes, visibles()).length > 0;
  }

  function mostrarDetalle(a, origen) {
    estado.actual = a; estado.origen = origen;
    $('detalle-titulo').textContent = a.titulo;
    var dl = $('detalle-datos'); vaciar(dl);
    [['Fecha', Calendario.fechaLarga(a.fecha)], ['Hora', a.horaInicio + ' a ' + a.horaFin], ['Lugar', a.lugar], ['Categoría', a.categoria], ['Cupo', a.cupo + ' plazas']]
      .forEach(function (p) { dl.appendChild(el('dt', null, p[0])); dl.appendChild(el('dd', null, p[1])); });
    $('enlace-inscripcion').setAttribute('href', 'inscripcion.html?actividad=' + encodeURIComponent(a.id));
    $('detalle').hidden = false;
    $('detalle').focus();
  }

  function cerrarDetalle() {
    $('detalle').hidden = true;
    if (estado.origen && document.body.contains(estado.origen)) { estado.origen.focus(); }
  }

  function descargarIcs() {
    var a = estado.actual; if (!a) { return; }
    var blob = new Blob([Ics.generar(a)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url; enlace.download = Ics.nombreDeFichero(a);
    document.body.appendChild(enlace); enlace.click(); document.body.removeChild(enlace);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function pintarCasillas() {
    var cont = $('casillas'); vaciar(cont);
    estado.categorias.forEach(function (c, i) {
      var etiqueta = el('label', 'casilla categoria-' + i);
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.value = c; cb.setAttribute('data-categoria', c);
      cb.addEventListener('change', function () {
        estado.elegidas = Array.prototype.slice.call(cont.querySelectorAll('input:checked')).map(function (x) { return x.value; });
        pintar();
      });
      etiqueta.appendChild(cb); etiqueta.appendChild(document.createTextNode(' ' + c));
      cont.appendChild(etiqueta);
    });
  }

  function mover(delta) {
    var m = Calendario.desplazarMes(estado.anio, estado.mes, delta);
    estado.anio = m.anio; estado.mes = m.mes; pintar();
  }

  function avisar(id, mensajes) {
    var cont = $(id); vaciar(cont);
    mensajes.forEach(function (m) { cont.appendChild(el('p', id === 'errores' ? 'error' : 'aviso-datos', m)); });
  }

  function iniciar() {
    $('vista-mes').addEventListener('click', function () { estado.vista = 'mes'; pintar(); });
    $('vista-lista').addEventListener('click', function () { estado.vista = 'lista'; pintar(); });
    $('mes-anterior').addEventListener('click', function () { mover(-1); });
    $('mes-siguiente').addEventListener('click', function () { mover(1); });
    $('quitar-filtros').addEventListener('click', function () {
      Array.prototype.forEach.call($('casillas').querySelectorAll('input'), function (c) { c.checked = false; });
      estado.elegidas = []; pintar();
    });
    $('descargar-ics').addEventListener('click', descargarIcs);
    $('cerrar-detalle').addEventListener('click', cerrarDetalle);

    /* En pantallas estrechas la rejilla de 7 columnas no deja leer ni tocar: se abre en lista. */
    if (window.matchMedia && window.matchMedia('(max-width: 40rem)').matches) { estado.vista = 'lista'; }
    estado.hoy = Calendario.fechaIsoDeHoy();
    var ahora = new Date(); estado.anio = ahora.getFullYear(); estado.mes = ahora.getMonth();

    Actividades.cargar('datos/actividades.json').then(function (r) {
      if (r.error) {
        avisar('errores', [r.error]);
        $('filtros').hidden = true;
        pintar(); return;
      }
      r.avisos.forEach(function (m) { console.warn(m); });
      if (r.avisos.length) { avisar('avisos', ['Algunas actividades no se muestran porque sus datos están incompletos (' + r.avisos.length + ').']); }
      estado.todas = r.actividades;
      estado.categorias = Calendario.categorias(r.actividades);
      var ini = Calendario.mesInicial(r.actividades, estado.hoy);
      estado.anio = ini.anio; estado.mes = ini.mes;
      pintarCasillas(); pintar();
    });
  }
  iniciar();
})();
