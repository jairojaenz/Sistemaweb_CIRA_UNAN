/**
 * Convierte el estado del formulario web al body de Create/UpdateOrdenServicio.
 *
 * Importante: los nombres deben coincidir con CreateOrdenServicioRequestDto
 * (fechaRecepcion, tieneAnalisis, …). Antes se enviaban analisisOrden / fechaRecepcionMuestra
 * y el binder de ASP.NET no los mapeaba.
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

export function idTipoMuestreoFromModalidad(modalidadMuestreo) {
  if (modalidadMuestreo === "compuesto") return 2;
  if (modalidadMuestreo === "otros") return 3;
  return 1;
}

function compuestoHorasFromForm(form) {
  if (form.modalidadMuestreo !== "compuesto") return null;
  const match = COMPOUESTO_KEYS.find(({ key }) => form[key]);
  return match?.value ?? null;
}

function buildObservacionOrden(form) {
  const partes = [];
  if (form.modalidadMuestreo === "otros" && form.modalidadMuestreoOtros?.trim()) {
    partes.push(`Tipo de muestreo (otros): ${form.modalidadMuestreoOtros.trim()}`);
  }
  if (form.observacionOrden?.trim()) partes.push(form.observacionOrden.trim());
  return partes.length > 0 ? partes.join("\n") : null;
}

/**
 * Convierte el estado del formulario web al DTO de la API.
 */
function resolveIdUsuario(form, usuarios, idUsuarioSesion) {
  const fromForm = Number(form.idUsuario);
  if (fromForm > 0) return fromForm;

  const fromSesion = Number(idUsuarioSesion);
  if (fromSesion > 0) return fromSesion;

  const first = usuarios[0]?.idUsuario ?? usuarios[0]?.IdUsuario ?? 0;
  return Number(first) || 0;
}

function resolveIdFormatoCampo(form, formatosCampo) {
  const fromForm = Number(form.idFormatoCampo);
  if (fromForm > 0) return fromForm;

  const first = formatosCampo[0]?.idFormatoCampo ?? 0;
  const resolved = Number(first);
  return resolved > 0 ? resolved : null;
}

export function formToOrdenServicioPayload(
  form,
  { usuarios = [], formatosCampo = [], idFormatoSolicitud = null, idUsuarioSesion = null } = {},
) {
  const fechaIso = form.fecha
    ? new Date(`${form.fecha}T12:00:00`).toISOString()
    : new Date().toISOString();

  const detalleMuestras = (form.detalleMuestras ?? [])
    .filter((row) => trimOrNull(row.analisis))
    .map((row) => ({
      numeroMuestra: trimOrNull(row.numeroMuestra) || "01",
      analisisSolicitado: trimOrNull(row.analisis),
      codigoAsignado: trimOrNull(row.codigoAsignado ?? row.codigoLab),
    }));

  const controlRecepcion = (form.controlRecepcion ?? [])
    .filter((row) => trimOrNull(row.laboratorio))
    .map((row) => ({
      laboratorio: trimOrNull(row.laboratorio),
      recibidoPor: trimOrNull(row.recibidoPor),
      fechaEntregaResultados: trimOrNull(row.fechaEntregaResultados) || null,
    }));

  return {
    // Campos del Create/UpdateOrdenServicioRequestDto (API).
    numeroOrden: Number(form.numeroOrden) || 0,
    fechaRecepcion: fechaIso,
    estadoOrden: form.estadoOrden || "Pendiente",
    idUsuario: resolveIdUsuario(form, usuarios, idUsuarioSesion),
    idFormatoCampo: resolveIdFormatoCampo(form, formatosCampo),
    idTipoMuestreo: idTipoMuestreoFromModalidad(form.modalidadMuestreo),
    tieneAnalisis: !!form.analisisOrden,
    tieneMuestreo: !!form.muestreoOrden,
    tieneHojaObservacion: !!form.hojaObservacionOrden,
    tieneInformeTecnico: !!form.informeTecnicoOrden,
    observacion: buildObservacionOrden(form),
    // Metadatos del formulario web (la API actual los ignora si no están en el DTO).
    idFormatoSolicitud: idFormatoSolicitud != null ? Number(idFormatoSolicitud) : null,
    detalleMuestras,
    controlRecepcion,
  };
}
