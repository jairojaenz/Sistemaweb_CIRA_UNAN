function normalizeText(value) {
  return String(value ?? "").trim();
}

/** Código asignado a cada fila de muestra: AR-0001, AR-0002, … */
export function formatCodigoAsignado(secuencia) {
  const n = Math.max(1, Number(secuencia) || 1);
  return `AR-${String(n).padStart(4, "0")}`;
}

/** Asigna códigos secuenciales AR-0001… a todas las filas del detalle. */
export function assignCodigosAsignados(detalleMuestras = []) {
  return detalleMuestras.map((row, index) => {
    const { codigoLab: _legacy, ...rest } = row;
    return {
      ...rest,
      codigoAsignado: formatCodigoAsignado(index + 1),
    };
  });
}

function includesServicio(servicios, keyword) {
  const list = Array.isArray(servicios) ? servicios : [];
  const k = keyword.toLowerCase();
  return list.some((s) => String(s).toLowerCase().includes(k));
}

function toDateInputValue(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Siguiente número de orden disponible según las órdenes existentes. */
export function suggestNextNumeroOrden(ordenes = []) {
  const max = ordenes.reduce((acc, o) => {
    const n = Number(o.numeroOrden);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return String(max + 1);
}

/** Proforma vinculada a una solicitud (la más reciente si hay varias). */
export function findProformaBySolicitud(proformas = [], idSolicitud) {
  const id = Number(idSolicitud);
  if (!Number.isFinite(id)) return null;

  const matches = proformas.filter(
    (p) => Number(p.formatoSolicitud ?? p.FormatoSolicitud) === id,
  );
  if (matches.length === 0) return null;

  return matches.sort((a, b) => {
    const da = new Date(a.fechaCreacionProforma ?? a.FechaCreacionProforma ?? 0).getTime();
    const db = new Date(b.fechaCreacionProforma ?? b.FechaCreacionProforma ?? 0).getTime();
    return db - da;
  })[0];
}

/** Busca el número de proforma asociado a una solicitud. */
export function findProformaNumeroBySolicitud(proformas = [], idSolicitud) {
  const proforma = findProformaBySolicitud(proformas, idSolicitud);
  return normalizeText(proforma?.numeroProforma ?? proforma?.NumeroProforma);
}

/**
 * Convierte el nombre del catálogo/proforma (ej. "Puntual", "Compuesto 8h")
 * a los campos del formulario de orden de servicio.
 */
export function parseTipoMuestreoSolicitado(nombreTipo) {
  const original = normalizeText(nombreTipo);
  const nombre = original.toLowerCase();
  if (!nombre) return {};

  const base = {
    compuesto8h: false,
    compuesto12h: false,
    compuesto16h: false,
    compuesto24h: false,
    modalidadMuestreoOtros: "",
  };

  if (nombre.includes("compuesto")) {
    const result = { ...base, modalidadMuestreo: "compuesto" };
    if (/\b8\b|8\s*h|8h/.test(nombre)) result.compuesto8h = true;
    else if (/\b12\b|12\s*h|12h/.test(nombre)) result.compuesto12h = true;
    else if (/\b16\b|16\s*h|16h/.test(nombre)) result.compuesto16h = true;
    else if (/\b24\b|24\s*h|24h/.test(nombre)) result.compuesto24h = true;
    return result;
  }

  if (nombre.includes("puntual")) {
    return { ...base, modalidadMuestreo: "puntual" };
  }

  if (nombre.includes("otro")) {
    return {
      ...base,
      modalidadMuestreo: "otros",
      modalidadMuestreoOtros: original,
    };
  }

  return {
    ...base,
    modalidadMuestreo: "otros",
    modalidadMuestreoOtros: original,
  };
}

function formatAnalisisLabel(detalle, proformaDetalle) {
  const nombre =
    normalizeText(proformaDetalle?.nombreAnalisis ?? proformaDetalle?.NombreAnalisis) ||
    normalizeText(detalle.nombreAnalisis ?? detalle.NombreAnalisis);
  const abrev =
    normalizeText(detalle.abreviacionAnalisis ?? detalle.AbreviacionAnalisis);
  const tecnica = normalizeText(
    proformaDetalle?.nombreTecnica ??
      proformaDetalle?.NombreTecnica ??
      detalle.nombreTecnica ??
      detalle.NombreTecnica,
  );

  if (nombre && tecnica) return `${nombre} (${tecnica})`;
  if (nombre) return nombre;
  return abrev;
}

/** Agrupa detalles de solicitud por análisis (misma lógica que la proforma). */
export function dedupeSolicitudDetalles(detalles = []) {
  const map = new Map();

  detalles.forEach((detalle, index) => {
    const idAnalisis = detalle.idAnalisis ?? detalle.IdAnalisis;
    const nombreTexto =
      detalle.nombreAnalisisTexto ??
      detalle.NombreAnalisisTexto ??
      detalle.nombreAnalisis ??
      detalle.NombreAnalisis;
    const key =
      idAnalisis != null
        ? `a-${idAnalisis}`
        : `t-${nombreTexto ?? index}-${detalle.idDetalleSolicitud ?? detalle.IdDetalleSolicitud ?? index}`;

    const cantidad = Math.max(1, Number(detalle.cantidad ?? detalle.Cantidad) || 1);

    if (map.has(key)) {
      const existing = map.get(key);
      existing.cantidad += cantidad;
      return;
    }

    map.set(key, {
      idAnalisis,
      nombreAnalisis: nombreTexto,
      nombreTecnica:
        detalle.nombreTecnicaTexto ??
        detalle.NombreTecnicaTexto,
      abreviacionAnalisis: detalle.abreviacionAnalisis ?? detalle.AbreviacionAnalisis,
      precioAnalisis: detalle.precioAnalisis ?? detalle.PrecioAnalisis,
      idLaboratorio: detalle.idLaboratorio ?? detalle.IdLaboratorio,
      nombreLaboratorio: detalle.nombreLaboratorio ?? detalle.NombreLaboratorio,
      cantidad,
    });
  });

  return [...map.values()];
}

/**
 * Líneas de análisis a mostrar: proforma (si existe) o solicitud deduplicada.
 * La proforma ya consolida cantidades y técnicas acordadas con el cliente.
 */
export function getLineasAnalisisFromSolicitud(solicitud, proforma = null) {
  const proformaDetalles = proforma?.detalles ?? proforma?.Detalles ?? [];
  if (proformaDetalles.length > 0) {
    return proformaDetalles.map((p) => ({
      idAnalisis: p.idAnalisis ?? p.IdAnalisis,
      nombreAnalisis: p.nombreAnalisis ?? p.NombreAnalisis,
      abreviacionAnalisis: "",
      nombreTecnica: p.nombreTecnica ?? p.NombreTecnica,
      cantidad: Math.max(
        1,
        Number(p.cantidadDetalleProforma ?? p.CantidadDetalleProforma) || 1,
      ),
    }));
  }

  const detalles = solicitud?.detalles ?? solicitud?.Detalles ?? [];
  return dedupeSolicitudDetalles(detalles);
}

function buildLabMapFromSolicitud(solicitud) {
  const map = new Map();
  for (const detalle of solicitud?.detalles ?? solicitud?.Detalles ?? []) {
    const idAnalisis = Number(detalle.idAnalisis ?? detalle.IdAnalisis);
    if (!Number.isFinite(idAnalisis)) continue;
    const nombre = normalizeText(detalle.nombreLaboratorio ?? detalle.NombreLaboratorio);
    if (!nombre) continue;
    map.set(idAnalisis, {
      idLaboratorio: detalle.idLaboratorio ?? detalle.IdLaboratorio,
      nombreLaboratorio: nombre,
    });
  }
  return map;
}

/** Filas de detalle de muestras: un análisis por fila; cantidad solo repite el mismo análisis. */
export function buildDetalleMuestrasFromSolicitud(solicitud, proforma = null) {
  const lineas = getLineasAnalisisFromSolicitud(solicitud, proforma);
  if (lineas.length === 0) return null;

  const solicitudDetalles = dedupeSolicitudDetalles(
    solicitud?.detalles ?? solicitud?.Detalles ?? [],
  );
  const rows = [];
  let codigoSecuencia = 1;

  for (const linea of lineas) {
    const solicitudDetalle = solicitudDetalles.find(
      (d) => Number(d.idAnalisis) === Number(linea.idAnalisis),
    );
    const analisis = formatAnalisisLabel(
      solicitudDetalle ?? linea,
      linea.nombreTecnica || solicitudDetalle?.nombreTecnica ? linea : null,
    );
    const cantidad = Math.max(1, Number(linea.cantidad) || 1);

    for (let i = 1; i <= cantidad; i += 1) {
      rows.push({
        numeroMuestra: String(i).padStart(2, "0"),
        analisis,
        codigoAsignado: formatCodigoAsignado(codigoSecuencia),
      });
      codigoSecuencia += 1;
    }
  }

  return rows.length > 0 ? rows : null;
}

/** Filas de control de recepción: un laboratorio por cada lab involucrado. */
export function buildControlRecepcionFromSolicitud(solicitud, proforma = null) {
  const lineas = getLineasAnalisisFromSolicitud(solicitud, proforma);
  const labMap = buildLabMapFromSolicitud(solicitud);
  const laboratorios = new Map();

  for (const linea of lineas) {
    const idAnalisis = Number(linea.idAnalisis);
    const labFromMap = Number.isFinite(idAnalisis) ? labMap.get(idAnalisis) : null;
    const nombre = normalizeText(
      labFromMap?.nombreLaboratorio ??
        linea.nombreLaboratorio ??
        linea.NombreLaboratorio,
    );
    const id = labFromMap?.idLaboratorio ?? linea.idLaboratorio ?? linea.IdLaboratorio;
    if (!nombre) continue;

    const key = id != null ? String(id) : nombre.toLowerCase();
    if (!laboratorios.has(key)) {
      laboratorios.set(key, {
        laboratorio: nombre,
        recibidoPor: "",
        fechaEntregaResultados: "",
      });
    }
  }

  const rows = [...laboratorios.values()];
  return rows.length > 0 ? rows : null;
}

function findUsuarioId(usuarios, nombreUsuario) {
  const nombre = normalizeText(nombreUsuario).toLowerCase();
  if (!nombre) return "";
  const u = usuarios.find((x) => {
    const n = normalizeText(x.nombreUsuario ?? x.NombreUsuario).toLowerCase();
    const a = normalizeText(x.apellidoUsuario ?? x.ApellidoUsuario).toLowerCase();
    const completo = `${n} ${a}`.trim();
    return n === nombre || completo === nombre || completo.includes(nombre) || nombre.includes(n);
  });
  const id = u?.idUsuario ?? u?.IdUsuario;
  return id != null ? String(id) : "";
}

/**
 * @param {object} solicitud — respuesta API FormatosSolicitudServicio
 * @param {object} options
 * @param {object} options.initialForm — estado base del formulario de orden
 * @param {Array} options.usuarios
 * @param {object} [options.proforma] — proforma vinculada (técnicas y cantidades)
 */
export function mapSolicitudToOrdenForm(
  solicitud,
  { initialForm, usuarios = [], idUsuarioSesion = null, numeroOrden, proformaNo, tipoMuestreoNombre, proforma } = {},
) {
  const servicios = solicitud.servicios ?? solicitud.Servicios ?? [];
  const cliente = normalizeText(solicitud.cliente ?? solicitud.Cliente);
  const usuario = normalizeText(solicitud.usuario ?? solicitud.Usuario);
  const numeroSolicitud = normalizeText(solicitud.numeroSolicitud ?? solicitud.NumeroSolicitud);
  const observacion = normalizeText(solicitud.observacionSolicitud ?? solicitud.ObservacionSolicitud);

  const detalleMuestras =
    buildDetalleMuestrasFromSolicitud(solicitud, proforma) ?? initialForm.detalleMuestras;

  const controlRecepcion =
    buildControlRecepcionFromSolicitud(solicitud, proforma) ?? initialForm.controlRecepcion;

  const partesObs = [];
  if (numeroSolicitud) partesObs.push(`Solicitud de origen: ${numeroSolicitud}`);
  if (observacion) partesObs.push(observacion);

  const fecha =
    toDateInputValue(solicitud.fechaRecepcionSolicitud ?? solicitud.FechaRecepcionSolicitud) ||
    initialForm.fecha;

  const tipoMuestreo = parseTipoMuestreoSolicitado(tipoMuestreoNombre);

  return {
    ...initialForm,
    ...tipoMuestreo,
    numeroOrden:
      numeroOrden != null && String(numeroOrden).trim() !== ""
        ? String(numeroOrden)
        : initialForm.numeroOrden,
    proformaNo: proformaNo != null ? String(proformaNo) : initialForm.proformaNo,
    fecha,
    usuarioEmpresa: cliente || usuario || initialForm.usuarioEmpresa,
    atencionA: usuario || initialForm.atencionA,
    correo: normalizeText(solicitud.correoCliente ?? solicitud.CorreoCliente) || initialForm.correo,
    celular: normalizeText(solicitud.num1ContactoSolicitud ?? solicitud.Num1ContactoSolicitud) || initialForm.celular,
    telefono: normalizeText(solicitud.num2RecepcionSolicitud ?? solicitud.Num2RecepcionSolicitud) || initialForm.telefono,
    direccion:
      normalizeText(solicitud.direccionMuestreoSolicitud ?? solicitud.DireccionMuestreoSolicitud) ||
      initialForm.direccion,
    idUsuario:
      findUsuarioId(usuarios, usuario) ||
      (idUsuarioSesion != null ? String(idUsuarioSesion) : "") ||
      initialForm.idUsuario,
    analisisOrden: includesServicio(servicios, "análisis") || includesServicio(servicios, "analisis"),
    muestreoOrden: includesServicio(servicios, "muestreo"),
    hojaObservacionOrden:
      includesServicio(servicios, "hoja") || includesServicio(servicios, "observación"),
    informeTecnicoOrden: includesServicio(servicios, "informe"),
    detalleMuestras,
    controlRecepcion,
    observacionOrden: partesObs.join("\n") || initialForm.observacionOrden,
    firmaUsuario: cliente || initialForm.firmaUsuario,
  };
}
