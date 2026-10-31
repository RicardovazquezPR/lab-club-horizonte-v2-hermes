/* Club Horizonte v2 - logica del calendario (REQ 3194, 3195). Funciones puras, sin DOM. */
(function (raiz, fabrica) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = fabrica(); }
  else { raiz.Calendario = fabrica(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  function dos(n) { return String(n).padStart(2, '0'); }
  function claveMes(anio, mes) { return anio + '-' + dos(mes + 1); }          // mes 0-11
  function fechaIsoDeHoy(d) { d = d || new Date(); return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); }

  /* Orden cronologico ascendente: fecha, luego hora de inicio, luego id. Copia, no muta. */
  function ordenar(acts) {
    return acts.slice().sort(function (a, b) {
      var ka = a.fecha + ' ' + a.horaInicio + ' ' + a.id, kb = b.fecha + ' ' + b.horaInicio + ' ' + b.id;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  }

  /* Categorias distintas, tomadas de los datos y no escritas a mano. Orden alfabetico. */
  function categorias(acts) {
    var vistas = {};
    acts.forEach(function (a) { vistas[a.categoria] = true; });
    return Object.keys(vistas).sort(function (a, b) { return a.localeCompare(b, 'es'); });
  }

  /* Filtro por una o varias categorias. Lista vacia o ausente = sin filtro (todas). */
  function filtrar(acts, seleccion) {
    if (!seleccion || !seleccion.length) { return acts.slice(); }
    return acts.filter(function (a) { return seleccion.indexOf(a.categoria) !== -1; });
  }

  /* Cuadricula del mes: semanas de 7 celdas (lunes primero). Celdas fuera del mes: {fuera:true}.
     Cada celda del mes: {dia, fecha, actividades:[...ordenadas]}. mes es 0-11. */
  function cuadriculaMes(anio, mes, acts) {
    var primero = new Date(anio, mes, 1);
    var desfase = (primero.getDay() + 6) % 7;
    var diasMes = new Date(anio, mes + 1, 0).getDate();
    var porFecha = {};
    ordenar(acts).forEach(function (a) { (porFecha[a.fecha] = porFecha[a.fecha] || []).push(a); });
    var celdas = [], i;
    for (i = 0; i < desfase; i += 1) { celdas.push({ fuera: true }); }
    for (i = 1; i <= diasMes; i += 1) {
      var f = anio + '-' + dos(mes + 1) + '-' + dos(i);
      celdas.push({ dia: i, fecha: f, actividades: porFecha[f] || [] });
    }
    while (celdas.length % 7 !== 0) { celdas.push({ fuera: true }); }
    var semanas = [];
    for (i = 0; i < celdas.length; i += 7) { semanas.push(celdas.slice(i, i + 7)); }
    return semanas;
  }

  /* Actividades de un mes concreto, ordenadas (es lo que muestra la vista de lista). */
  function listaDelMes(anio, mes, acts) {
    var pref = claveMes(anio, mes);
    return ordenar(acts).filter(function (a) { return a.fecha.slice(0, 7) === pref; });
  }

  /* Mes anterior o siguiente (delta -1 / +1), cruzando de anio. */
  function desplazarMes(anio, mes, delta) {
    var t = anio * 12 + mes + delta;
    return { anio: Math.floor(t / 12), mes: ((t % 12) + 12) % 12 };
  }

  /* Mes con el que abre el calendario: el de hoy si tiene actividades; si no, el de la primera
     actividad futura; si no hay futuras, el de la ultima; sin actividades, el de hoy. */
  function mesInicial(acts, hoyIso) {
    var hoy = hoyIso || fechaIsoDeHoy();
    var base = { anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)) - 1 };
    if (!acts.length) { return base; }
    var o = ordenar(acts);
    if (o.some(function (a) { return a.fecha.slice(0, 7) === hoy.slice(0, 7); })) { return base; }
    var futura = o.filter(function (a) { return a.fecha >= hoy; })[0] || o[o.length - 1];
    return { anio: Number(futura.fecha.slice(0, 4)), mes: Number(futura.fecha.slice(5, 7)) - 1 };
  }

  /* Texto largo de una fecha ISO: "jueves 12 de noviembre de 2026". */
  function fechaLarga(iso) {
    var d = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
    return DIAS[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  return { MESES: MESES, DIAS: DIAS, claveMes: claveMes, fechaIsoDeHoy: fechaIsoDeHoy, ordenar: ordenar, categorias: categorias,
           filtrar: filtrar, cuadriculaMes: cuadriculaMes, listaDelMes: listaDelMes, desplazarMes: desplazarMes,
           mesInicial: mesInicial, fechaLarga: fechaLarga };
}));
