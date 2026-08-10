function trimOrNull(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function toIsoDate(value, fallback = new Date()) {
  if (value) {
    const d = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback.toISOString();
}

/**
 * Mapea el estado del formulario web al DTO de creación de solicitud.
 */
export function formToSolicitudPayload(form, { idCliente, idUsuario } = {}) {
  const servicios = Array.isArray(form.tipoServicio)
    ? form.tipoServicio
    : form.tipoServicio
      ? [form.tipoServicio]
      : [];

  const matrices = Array.isArray(form.matriz) ? form.matriz : [];

  const detallesSolicitud = (form.analisisSolicitados ?? [])
    .filter((a) => trimOrNull(a.tipoAnalisis))
    .map((a) => ({
      tipoAnalisisTexto: trimOrNull(a.tipoAnalisis),
      tecnicaTexto: trimOrNull(a.tecnica),
      cantidad: 1,
    }));

  return {
    idCliente: Number(idCliente) || 0,
    fechaRecepcionSolicitud: toIsoDate(form.fechaRecepcion),
    idMedioRecepcion: Number(form.medioRecepcion) || 0,
    totalMuestrasSolicitud: Number(form.numeroMuestras) || 0,
    direccionMuestreoSolicitud: trimOrNull(form.ubicacionMuestreo) || trimOrNull(form.direccionUsuario) || "",
    observacionSolicitud: trimOrNull(form.observaciones),
    fechaEnvioProforma: toIsoDate(form.fechaProforma),
    estado: "Pendiente",
    idServicios: servicios.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
    matrices: matrices
      .filter((m) => Number(m.numMuestras) > 0)
      .map((m) => ({
        idMatriz: Number(m.idMatriz),
        numMuestras: Number(m.numMuestras),
      })),
    idUsuario: Number(idUsuario) || 0,
    firmaSolicitud: trimOrNull(form.firma),
    recibidoPorSolicitud: trimOrNull(form.recibidoPor),
    inicialesAnalistaSolicitud: trimOrNull(form.inicialesAnalista),
    detallesSolicitud,
  };
}
