/* Club Horizonte v2 - logica de inscripcion (sin DOM). DEV0002 REQ 3197, 3198, 3199.
   Almacenamiento inyectable: en el navegador es localStorage; en las pruebas, un objeto falso. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) { module.exports = fabrica(); }
  else { raiz.Inscripcion = fabrica(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CLAVE = 'club-horizonte-v2-inscripciones';
  var RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var RE_ESTUDIANTE = /^\d{4,12}$/;

  function normalizarCorreo(c) { return String(c == null ? '' : c).trim().toLowerCase(); }

  /* Devuelve {campo: mensaje}. Vacio = formulario valido. No mira duplicados ni cupo. */
  function validarCampos(d) {
    var e = {};
    var nombre = String(d && d.nombre != null ? d.nombre : '').trim();
    var correo = String(d && d.correo != null ? d.correo : '').trim();
    var est = String(d && d.estudiante != null ? d.estudiante : '').trim();
    if (!nombre) { e.nombre = 'Escribe tu nombre completo.'; }
    else if (nombre.split(/\s+/).length < 2) { e.nombre = 'Escribe nombre y apellido.'; }
    if (!correo) { e.correo = 'Escribe tu correo electrónico.'; }
    else if (!RE_CORREO.test(correo)) { e.correo = 'El correo no tiene un formato válido (ejemplo: ana@correo.com).'; }
    if (!est) { e.estudiante = 'Escribe tu número de estudiante.'; }
    else if (!RE_ESTUDIANTE.test(est)) { e.estudiante = 'El número de estudiante son entre 4 y 12 dígitos.'; }
    return e;
  }

  /* Almacen sobre cualquier objeto con getItem/setItem. Nunca lanza: el fallo viaja en .error. */
  function crearAlmacen(storage) {
    function leer() {
      if (!storage) { return { lista: [], error: 'Este navegador no permite guardar inscripciones.' }; }
      var texto;
      try { texto = storage.getItem(CLAVE); }
      catch (e) { return { lista: [], error: 'El navegador tiene bloqueado el almacenamiento local: las inscripciones no se pueden guardar ni leer.' }; }
      if (texto == null || texto === '') { return { lista: [], error: null }; }
      try {
        var v = JSON.parse(texto);
        if (!Array.isArray(v)) { throw new Error('no es lista'); }
        return { lista: v.filter(function (x) { return x && typeof x === 'object' && x.actividadId && x.correo; }), error: null };
      } catch (e) {
        return { lista: [], error: 'Los datos guardados de inscripciones están dañados y se ignoran.' };
      }
    }
    function escribir(lista) {
      try { storage.setItem(CLAVE, JSON.stringify(lista)); return null; }
      catch (e) { return 'No se pudo guardar la inscripción: el navegador tiene bloqueado el almacenamiento local o está lleno.'; }
    }
    return { leer: leer, escribir: escribir };
  }

  function deActividad(lista, id) { return lista.filter(function (i) { return i.actividadId === id; }); }

  /* Plazas = cupo menos inscripciones guardadas de esa actividad; nunca negativas. */
  function plazasDisponibles(actividad, lista) {
    return Math.max(0, actividad.cupo - deActividad(lista, actividad.id).length);
  }
  function estaAgotada(actividad, lista) { return plazasDisponibles(actividad, lista) === 0; }
  function yaInscrito(actividad, correo, lista) {
    var c = normalizarCorreo(correo);
    return deActividad(lista, actividad.id).some(function (i) { return normalizarCorreo(i.correo) === c; });
  }

  /* Intenta inscribir. Devuelve {ok, errores, mensaje, inscripcion}. `ahora` se inyecta para probar. */
  function inscribir(actividad, datos, almacen, ahora) {
    var errores = validarCampos(datos);
    if (Object.keys(errores).length) { return { ok: false, errores: errores, mensaje: 'Revisa los campos marcados.' }; }
    var leido = almacen.leer();
    if (leido.error) { return { ok: false, errores: {}, mensaje: leido.error }; }
    if (estaAgotada(actividad, leido.lista)) { return { ok: false, errores: {}, mensaje: 'Actividad agotada: ya no quedan plazas.' }; }
    if (yaInscrito(actividad, datos.correo, leido.lista)) {
      return { ok: false, errores: { correo: 'Este correo ya está inscrito en esta actividad.' }, mensaje: 'Revisa los campos marcados.' };
    }
    var insc = {
      actividadId: actividad.id,
      nombre: String(datos.nombre).trim().replace(/\s+/g, ' '),
      correo: String(datos.correo).trim(),
      estudiante: String(datos.estudiante).trim(),
      fecha: (ahora || new Date()).toISOString()
    };
    var nueva = leido.lista.concat([insc]);
    var fallo = almacen.escribir(nueva);
    if (fallo) { return { ok: false, errores: {}, mensaje: fallo }; }
    return { ok: true, errores: {}, mensaje: 'Inscripción guardada. Te quedan ' + plazasDisponibles(actividad, nueva) + ' plazas libres en la actividad.', inscripcion: insc };
  }

  return { CLAVE: CLAVE, validarCampos: validarCampos, crearAlmacen: crearAlmacen, plazasDisponibles: plazasDisponibles,
           estaAgotada: estaAgotada, yaInscrito: yaInscrito, inscribir: inscribir, normalizarCorreo: normalizarCorreo };
}));
