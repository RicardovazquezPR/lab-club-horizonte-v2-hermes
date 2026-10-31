/* Club Horizonte v2 - carga y validacion de actividades (REQ 3193).
   Modulo sin dependencias: sirve en el navegador (<script>) y en Node (require). */
(function (raiz, fabrica) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = fabrica(); }
  else { raiz.Actividades = fabrica(); }
}(typeof self !== 'undefined' ? self : this, function () {
  var CAMPOS = ['id', 'titulo', 'categoria', 'fecha', 'horaInicio', 'horaFin', 'lugar', 'cupo'];

  function esFechaIso(t) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof t === 'string' ? t : '');
    if (!m) { return false; }
    var f = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return f.getFullYear() === Number(m[1]) && f.getMonth() === Number(m[2]) - 1 && f.getDate() === Number(m[3]);
  }
  function esHora(t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(typeof t === 'string' ? t : ''); }

  /* Devuelve la lista de problemas de una actividad; vacia = valida. */
  function problemasDe(a) {
    var p = [];
    if (!a || typeof a !== 'object' || Array.isArray(a)) { return ['no es un objeto']; }
    CAMPOS.forEach(function (c) {
      var v = a[c];
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) { p.push('falta ' + c); }
    });
    if (a.fecha !== undefined && a.fecha !== null && a.fecha !== '' && !esFechaIso(a.fecha)) { p.push('fecha invalida'); }
    ['horaInicio', 'horaFin'].forEach(function (c) {
      if (a[c] !== undefined && a[c] !== null && a[c] !== '' && !esHora(a[c])) { p.push(c + ' invalida'); }
    });
    if (esHora(a.horaInicio) && esHora(a.horaFin) && a.horaFin <= a.horaInicio) { p.push('horaFin no es posterior a horaInicio'); }
    if (a.cupo !== undefined && a.cupo !== null && a.cupo !== '' && !(Number.isInteger(a.cupo) && a.cupo >= 0)) { p.push('cupo invalido'); }
    return p;
  }

  /* Valida el contenido ya parseado del JSON.
     Devuelve {actividades, avisos, error}. Con error (estructura inutilizable) no hay actividades.
     Una actividad invalida o con id repetido se omite y se anota en avisos. */
  function validar(contenido) {
    var res = { actividades: [], avisos: [], error: null };
    var lista = Array.isArray(contenido) ? contenido : (contenido && contenido.actividades);
    if (!Array.isArray(lista)) {
      res.error = 'El fichero de actividades no tiene el formato esperado: debe contener una lista "actividades".';
      return res;
    }
    var vistos = {};
    lista.forEach(function (a, i) {
      var p = problemasDe(a);
      var etiqueta = 'Actividad ' + (i + 1) + (a && a.id ? ' (' + a.id + ')' : '');
      if (!p.length && vistos[a.id]) { p.push('id repetido'); }
      if (p.length) { res.avisos.push(etiqueta + ' omitida: ' + p.join(', ') + '.'); return; }
      vistos[a.id] = true;
      res.actividades.push({
        id: String(a.id), titulo: String(a.titulo), categoria: String(a.categoria), fecha: a.fecha,
        horaInicio: a.horaInicio, horaFin: a.horaFin, lugar: String(a.lugar), cupo: a.cupo,
        descripcion: typeof a.descripcion === 'string' ? a.descripcion : ''
      });
    });
    return res;
  }

  /* Interpreta el texto del JSON; un error de sintaxis da un mensaje claro, no una excepcion. */
  function interpretar(texto) {
    var contenido;
    try { contenido = JSON.parse(texto); }
    catch (e) {
      return { actividades: [], avisos: [], error: 'El fichero de actividades tiene un error de formato (JSON no válido): ' + e.message };
    }
    return validar(contenido);
  }

  /* Solo navegador: descarga y valida. Nunca rechaza; el fallo viaja en .error. */
  function cargar(url, fetchFn) {
    var f = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    if (!f) { return Promise.resolve({ actividades: [], avisos: [], error: 'Este navegador no puede cargar las actividades.' }); }
    return f(url).then(function (r) {
      if (!r.ok) { return { actividades: [], avisos: [], error: 'No se pudo cargar el fichero de actividades (código ' + r.status + ').' }; }
      return r.text().then(interpretar);
    }, function () {
      return { actividades: [], avisos: [], error: 'No se pudo cargar el fichero de actividades. Si abres el sitio como archivo local, usa un servidor web o la dirección publicada.' };
    });
  }

  return { CAMPOS: CAMPOS, esFechaIso: esFechaIso, esHora: esHora, problemasDe: problemasDe, validar: validar, interpretar: interpretar, cargar: cargar };
}));
