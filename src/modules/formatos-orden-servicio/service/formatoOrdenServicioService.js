import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export function normalizeOrdenFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const formatoCampo = raw.formatoCampo ?? raw.FormatoCampo;
  return {
    idFormatoOrden: raw.idFormatoOrden ?? raw.IdFormatoOrden,
    numeroOrden: raw.numeroOrden ?? raw.NumeroOrden,
    fechaRecepcionMuestra: raw.fechaRecepcionMuestra ?? raw.FechaRecepcionMuestra,
    analisisOrden: !!(raw.analisisOrden ?? raw.AnalisisOrden),
    muestreoOrden: !!(raw.muestreoOrden ?? raw.MuestreoOrden),
    hojaObservacionOrden: !!(raw.hojaObservacionOrden ?? raw.HojaObservacionOrden),
    informeTecnicoOrden: !!(raw.informeTecnicoOrden ?? raw.InformeTecnicoOrden),
    otro1Orden: raw.otro1Orden ?? raw.Otro1Orden ?? "",
    otro2Orden: raw.otro2Orden ?? raw.Otro2Orden ?? "",
    observacionOrden: raw.observacionOrden ?? raw.ObservacionOrden ?? "",
    estadoOrden: raw.estadoOrden ?? raw.EstadoOrden ?? "",
    fechaCreacionOrden: raw.fechaCreacionOrden ?? raw.FechaCreacionOrden,
    usuarioCreacionOrden: raw.usuarioCreacionOrden ?? raw.UsuarioCreacionOrden ?? "",
    formatoCampo,
    tipoMuestreo: raw.tipoMuestreo ?? raw.TipoMuestreo ?? "",
    usuario: raw.usuario ?? raw.Usuario ?? "",
  };
}

export function toApiPayload(form) {
  return {
    numeroOrden: Number(form.numeroOrden) || 0,
    fechaRecepcionMuestra: form.fechaRecepcionMuestra
      ? new Date(form.fechaRecepcionMuestra).toISOString()
      : new Date().toISOString(),
    estadoOrden: String(form.estadoOrden ?? "").trim(),
    idUsuario: Number(form.idUsuario) || 0,
    idFormatoCampo: Number(form.idFormatoCampo) || 0,
    idTipoMuestreo: Number(form.idTipoMuestreo) || 0,
    analisisOrden: !!form.analisisOrden,
    muestreoOrden: !!form.muestreoOrden,
    hojaObservacionOrden: !!form.hojaObservacionOrden,
    informeTecnicoOrden: !!form.informeTecnicoOrden,
    otro1Orden: form.otro1Orden?.trim() || null,
    otro2Orden: form.otro2Orden?.trim() || null,
    observacionOrden: form.observacionOrden?.trim() || null,
  };
}

export async function getOrdenesServicio() {
  const res = await apiGet("/api/FormatosOrdenServicio/OrdenServicio");
  return normalizeListResponse(res).map(normalizeOrdenFromApi);
}

export async function createOrdenServicio(form) {
  return await apiPost("/api/FormatosOrdenServicio/Create-ordenServicio", toApiPayload(form));
}

export async function updateOrdenServicio(id, form) {
  return await apiPut(`/api/FormatosOrdenServicio/Update-ordenServicio/${id}`, toApiPayload(form));
}

export async function deleteOrdenServicio(id) {
  return await apiDelete(`/api/FormatosOrdenServicio/Delete-ordenServicio/${id}`);
}
