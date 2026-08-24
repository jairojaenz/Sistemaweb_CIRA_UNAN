/**
 * Service: Formatos de orden de servicio
 * API: /api/FormatosOrdenServicio/...
 * normalizeOrdenFromApi adapta TieneAnalisis/FechaRecepcion al shape del formulario.
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

/**
 * Mapea la respuesta de la API (FechaRecepcion / TieneAnalisis / …)
 * al shape que usa el formulario web.
 */
export function normalizeOrdenFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const formatoCampo = raw.formatoCampo ?? raw.FormatoCampo;
  return {
    idFormatoOrden: raw.idFormatoOrden ?? raw.IdFormatoOrden,
    numeroOrden: raw.numeroOrden ?? raw.NumeroOrden,
    fechaRecepcionMuestra:
      raw.fechaRecepcionMuestra ??
      raw.FechaRecepcionMuestra ??
      raw.fechaRecepcion ??
      raw.FechaRecepcion,
    analisisOrden: !!(
      raw.analisisOrden ??
      raw.AnalisisOrden ??
      raw.tieneAnalisis ??
      raw.TieneAnalisis
    ),
    muestreoOrden: !!(
      raw.muestreoOrden ??
      raw.MuestreoOrden ??
      raw.tieneMuestreo ??
      raw.TieneMuestreo
    ),
    hojaObservacionOrden: !!(
      raw.hojaObservacionOrden ??
      raw.HojaObservacionOrden ??
      raw.tieneHojaObservacion ??
      raw.TieneHojaObservacion
    ),
    informeTecnicoOrden: !!(
      raw.informeTecnicoOrden ??
      raw.InformeTecnicoOrden ??
      raw.tieneInformeTecnico ??
      raw.TieneInformeTecnico
    ),
    otro1Orden: raw.otro1Orden ?? raw.Otro1Orden ?? "",
    otro2Orden: raw.otro2Orden ?? raw.Otro2Orden ?? "",
    observacionOrden: raw.observacionOrden ?? raw.ObservacionOrden ?? raw.observacion ?? raw.Observacion ?? "",
    estadoOrden: raw.estadoOrden ?? raw.EstadoOrden ?? "",
    fechaCreacionOrden: raw.fechaCreacionOrden ?? raw.FechaCreacionOrden ?? raw.fechaCreacion ?? raw.FechaCreacion,
    usuarioCreacionOrden: raw.usuarioCreacionOrden ?? raw.UsuarioCreacionOrden ?? raw.usuarioCreacion ?? raw.UsuarioCreacion ?? "",
    formatoCampo,
    idFormatoCampo: raw.idFormatoCampo ?? raw.IdFormatoCampo ?? raw.formatoCampo ?? raw.FormatoCampo ?? "",
    idUsuario: raw.idUsuario ?? raw.IdUsuario ?? "",
    idTipoMuestreo: raw.idTipoMuestreo ?? raw.IdTipoMuestreo ?? "",
    tipoMuestreo: raw.tipoMuestreo ?? raw.TipoMuestreo ?? "",
    usuario: raw.usuario ?? raw.Usuario ?? "",
    idFormatoSolicitud: raw.idFormatoSolicitud ?? raw.IdFormatoSolicitud ?? null,
    usuarioEmpresaOrden: raw.usuarioEmpresaOrden ?? raw.UsuarioEmpresaOrden ?? "",
    atencionAOrden: raw.atencionAOrden ?? raw.AtencionAOrden ?? "",
    telefonoOrden: raw.telefonoOrden ?? raw.TelefonoOrden ?? "",
    celularOrden: raw.celularOrden ?? raw.CelularOrden ?? "",
    extensionOrden: raw.extensionOrden ?? raw.ExtensionOrden ?? "",
    correoOrden: raw.correoOrden ?? raw.CorreoOrden ?? "",
    direccionOrden: raw.direccionOrden ?? raw.DireccionOrden ?? "",
    departamentoOrden: raw.departamentoOrden ?? raw.DepartamentoOrden ?? "",
    municipioOrden: raw.municipioOrden ?? raw.MunicipioOrden ?? "",
    compuestoHorasOrden: raw.compuestoHorasOrden ?? raw.CompuestoHorasOrden ?? "",
    modalidadMuestreoOtros: raw.modalidadMuestreoOtros ?? raw.ModalidadMuestreoOtros ?? "",
    muestreoPorOrden: raw.muestreoPorOrden ?? raw.MuestreoPorOrden ?? "",
    transportePorOrden: raw.transportePorOrden ?? raw.TransportePorOrden ?? "",
    incluirNormaInforme: !!(raw.incluirNormaInforme ?? raw.IncluirNormaInforme),
    especificarLabOrden: raw.especificarLabOrden ?? raw.EspecificarLabOrden ?? "",
    firmaUsuarioOrden: raw.firmaUsuarioOrden ?? raw.FirmaUsuarioOrden ?? "",
    firmaApeOrden: raw.firmaApeOrden ?? raw.FirmaApeOrden ?? "",
    detalles: (raw.detalles ?? raw.Detalles ?? []).map((d) => ({
      idDetalleOrden: d.idDetalleOrden ?? d.IdDetalleOrden,
      idMuestra: d.idMuestra ?? d.IdMuestra,
      identificacion: d.identificacion ?? d.Identificacion ?? "",
      analisisSolicitado: d.analisisSolicitado ?? d.AnalisisSolicitado ?? "",
      idsAnalisis: d.idsAnalisis ?? d.IdsAnalisis ?? [],
    })),
    detalleMuestras: (raw.detalleMuestras ?? raw.DetalleMuestras ?? []).map((d) => ({
      numeroMuestra: d.numeroMuestra ?? d.NumeroMuestra ?? "",
      analisisSolicitado: d.analisisSolicitado ?? d.AnalisisSolicitado ?? "",
      codigoAsignado: d.codigoAsignado ?? d.CodigoAsignado ?? "",
    })),
    controlRecepcion: (raw.controlRecepcion ?? raw.ControlRecepcion ?? []).map((d) => ({
      laboratorio: d.laboratorio ?? d.Laboratorio ?? "",
      recibidoPor: d.recibidoPor ?? d.RecibidoPor ?? "",
      fechaEntregaResultados: d.fechaEntregaResultados ?? d.FechaEntregaResultados ?? "",
    })),
  };
}

export async function getOrdenesServicio() {
  const res = await apiGet("/api/FormatosOrdenServicio/OrdenServicio");
  return asList(res).map(normalizeOrdenFromApi);
}

export async function getOrdenServicioById(id) {
  const res = await apiGet(`/api/FormatosOrdenServicio/OrdenServicio/${id}`);
  return normalizeOrdenFromApi(res);
}

export async function createOrdenServicio(payload) {
  return await apiPost("/api/FormatosOrdenServicio/Create-ordenServicio", payload);
}

export async function updateOrdenServicio(id, payload) {
  return await apiPut(`/api/FormatosOrdenServicio/Update-ordenServicio/${id}`, payload);
}

export async function deleteOrdenServicio(id) {
  return await apiDelete(`/api/FormatosOrdenServicio/Delete-ordenServicio/${id}`);
}
