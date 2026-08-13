function trimOrNull(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

/** Convierte yyyy-mm-dd del input date a ISO que bindéa DateTime en la API. */
function toIsoDate(value, fallback = new Date()) {
  if (value) {
    const d = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback.toISOString();
}

/**
 * Mapea el formulario web al DTO de Create/UpdateSolicitudServicioRequestDto.
 * Los nombres deben coincidir con la API (fechaRecepcion, direccionMuestreo, …).
 */
export function formToSolicitudPayload(form, { idCliente, idUsuario } = {}) {
  const servicios = Array.isArray(form.tipoServicio)
    ? form.tipoServicio
    : form.tipoServicio
      ? [form.tipoServicio]
      : [];

  const matrices = Array.isArray(form.matriz) ? form.matriz : [];

  // Cada fila debe tener idAnalisis o idGrupoAnalisis (el API no acepta texto libre).
  const detallesSolicitud = (form.analisisSolicitados ?? [])
    .map((a) => ({
      idAnalisis: Number(a.idAnalisis) || null,
      idGrupoAnalisis: Number(a.idGrupoAnalisis) || null,
      cantidad: Number(a.cantidad) > 0 ? Number(a.cantidad) : 1,
    }))
    .filter((d) => d.idAnalisis || d.idGrupoAnalisis);

  return {
    idCliente: Number(idCliente) || 0,
    fechaRecepcion: toIsoDate(form.fechaRecepcion),
    idMedioRecepcion: Number(form.medioRecepcion) || 0,
    totalMuestrasSolicitud: Number(form.numeroMuestras) || 0,
    numMuestras: Number(form.numeroMuestras) || 0,
    direccionMuestreo: trimOrNull(form.ubicacionMuestreo) || trimOrNull(form.direccionUsuario) || "",
    observacion: trimOrNull(form.observaciones),
    fechaEnvioProforma: toIsoDate(form.fechaProforma),
    estado: form.estado || "Pendiente",
    idServicios: servicios.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
    matrices: matrices
      .filter((m) => Number(m.numMuestras) > 0)
      .map((m) => ({
        idMatriz: Number(m.idMatriz),
        numMuestras: Number(m.numMuestras),
      })),
    idUsuario: Number(idUsuario) || 0,
    detallesSolicitud,
  };
}

/** yyyy-mm-dd para inputs type="date" a partir de DateOnly/ISO de la API. */
export function toInputDate(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
