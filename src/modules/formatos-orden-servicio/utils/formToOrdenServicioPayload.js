/**
 * Convierte el estado del formulario web al body de Create/UpdateOrdenServicio.
 *
 * Los nombres deben coincidir con CreateOrdenServicioRequestDto (camelCase).
 */
const COMPOUESTO_KEYS = [
  { key: "compuesto8h", value: "8h" },
  { key: "compuesto12h", value: "12h" },
  { key: "compuesto16h", value: "16h" },
  { key: "compuesto24h", value: "24h" },
];

function trimOrNull(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function modalidadFromTipoNombre(nombre) {
  const n = String(nombre ?? "").toLowerCase();
  if (n.includes("compuesto")) return "compuesto";
  if (n.includes("otro")) return "otros";
  return "puntual";
}

export function resolveIdTipoMuestreo(form, tiposMuestreo = []) {
  const fromForm = Number(form.idTipoMuestreo);
  if (fromForm > 0) return fromForm;

  const modalidad = form.modalidadMuestreo;
  const match = tiposMuestreo.find((t) => {
    const n = String(t.nombreTipoMuestreo ?? t.nombre ?? "").toLowerCase();
    if (modalidad === "compuesto") return n.includes("compuesto");
    if (modalidad === "otros") return n.includes("otro");
    return n.includes("puntual") || n.includes("simple");
  });
  return Number(match?.idTipoMuestreo) || 0;
}

export function compuestoHorasFromForm(form) {
  if (form.modalidadMuestreo !== "compuesto") return null;
  const horas = COMPOUESTO_KEYS.filter(({ key }) => form[key]).map(({ value }) => value);
  const otro = trimOrNull(form.compuestoOtroTiempo);
  if (otro && !horas.includes(otro)) horas.push(otro);
  if (!horas.length) return null;
  return horas.join(",").slice(0, 10);
}

export function flagsFromCompuestoHoras(raw) {
  const text = String(raw ?? "");
  const flags = {
    compuesto8h: /8h/i.test(text),
    compuesto12h: /12h/i.test(text),
    compuesto16h: /16h/i.test(text),
    compuesto24h: /24h/i.test(text),
    compuestoOtroTiempo: "",
  };
  const leftovers = text
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(8|12|16|24)h$/i.test(p));
  flags.compuestoOtroTiempo = leftovers.join(", ");
  return flags;
}

function resolveIdUsuario(form, idUsuarioSesion) {
  const fromForm = Number(form.idUsuario);
  if (fromForm > 0) return fromForm;
  return Number(idUsuarioSesion) || 0;
}

/**
 * Convierte el estado del wizard al DTO de la API (cabecera + filas).
 */
export function formToOrdenServicioPayload(
  form,
  { tiposMuestreo = [], idFormatoSolicitud = null, idUsuarioSesion = null } = {},
) {
  const fechaRecepcion = form.fecha
    ? `${form.fecha}T12:00:00`
    : new Date().toISOString().slice(0, 19);

  const detalleMuestras = (form.detalleMuestras ?? [])
    .filter((row) => trimOrNull(row.analisis) || trimOrNull(row.numeroMuestra))
    .map((row) => ({
      idMuestra: Number(row.idMuestra) || null,
      numeroMuestra: trimOrNull(row.numeroMuestra) || "01",
      analisisSolicitado: trimOrNull(row.analisis),
      codigoAsignado: trimOrNull(row.codigoAsignado ?? row.codigoLab),
      idsAnalisis: [Number(row.idAnalisis)].filter((id) => id > 0),
    }));

  const controlRecepcion = (form.controlRecepcion ?? [])
    .filter((row) => trimOrNull(row.laboratorio))
    .map((row) => ({
      laboratorio: trimOrNull(row.laboratorio),
      recibidoPor: trimOrNull(row.recibidoPor),
      fechaEntregaResultados: trimOrNull(row.fechaEntregaResultados) || null,
    }));

  return {
    numeroOrden: Number(form.numeroOrden) || 0,
    fechaRecepcion,
    estadoOrden: form.estadoOrden || "Pendiente",
    idUsuario: resolveIdUsuario(form, idUsuarioSesion),
    idFormatoCampo: Number(form.idFormatoCampo) || 0,
    idTipoMuestreo: resolveIdTipoMuestreo(form, tiposMuestreo),
    tieneAnalisis: !!form.analisisOrden,
    tieneMuestreo: !!form.muestreoOrden,
    tieneHojaObservacion: !!form.hojaObservacionOrden,
    tieneInformeTecnico: !!form.informeTecnicoOrden,
    observacion: trimOrNull(form.observacionOrden),
    idFormatoSolicitud: (() => {
      const n = Number(idFormatoSolicitud ?? form.idFormatoSolicitud);
      return n > 0 ? n : null;
    })(),
    usuarioEmpresaOrden: trimOrNull(form.usuarioEmpresa),
    atencionAOrden: trimOrNull(form.atencionA),
    telefonoOrden: trimOrNull(form.telefono),
    celularOrden: trimOrNull(form.celular),
    extensionOrden: trimOrNull(form.extension),
    correoOrden: trimOrNull(form.correo),
    direccionOrden: trimOrNull(form.direccion),
    departamentoOrden: trimOrNull(form.departamento),
    municipioOrden: trimOrNull(form.municipio),
    compuestoHorasOrden: compuestoHorasFromForm(form),
    modalidadMuestreoOtros: trimOrNull(form.modalidadMuestreoOtros),
    muestreoPorOrden: trimOrNull(form.muestreoPor),
    transportePorOrden: trimOrNull(form.transportePor),
    incluirNormaInforme: form.incluirNormaInforme === "si" || form.incluirNormaInforme === true,
    especificarLabOrden: trimOrNull(form.especificarLab),
    firmaUsuarioOrden: trimOrNull(form.firmaUsuario),
    firmaApeOrden: trimOrNull(form.firmaApe),
    detalleMuestras,
    controlRecepcion,
  };
}
