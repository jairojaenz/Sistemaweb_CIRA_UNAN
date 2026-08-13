/**
 * Service: Planes de muestreo
 * API: /api/FormatosPlanMuestreo
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosPlanMuestreo";

export function normalizePlanFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idFormatoMuestreo: raw.idFormatoMuestreo ?? raw.IdFormatoMuestreo,
    codReferencia: raw.codReferencia ?? raw.CodReferencia ?? "",
    contactoCoordinacion: raw.contactoCoordinacion ?? raw.ContactoCoordinacion ?? "",
    celularContacto: raw.celularContacto ?? raw.CelularContacto ?? "",
    horaSalida: raw.horaSalida ?? raw.HoraSalida ?? "",
    horaRegreso: raw.horaRegreso ?? raw.HoraRegreso ?? "",
    coordinador: raw.coordinador ?? raw.Coordinador ?? "",
    reemplazoCoordinador: raw.reemplazoCoordinador ?? raw.ReemplazoCoordinador ?? "",
    observaciones: raw.observaciones ?? raw.Observaciones ?? "",
    observacionCoordinador: raw.observacionCoordinador ?? raw.ObservacionCoordinador ?? "",
    usuarioElaboracion: raw.usuarioElaboracion ?? raw.UsuarioElaboracion ?? "",
    fechaElaboracion: raw.fechaElaboracion ?? raw.FechaElaboracion ?? "",
    muestra: raw.muestra ?? raw.Muestra ?? "",
    formatosProforma: raw.formatosProforma ?? raw.FormatosProforma ?? "",
    tiposMuestreo: raw.tiposMuestreo ?? raw.TiposMuestreo ?? "",
    usuario: raw.usuario ?? raw.Usuario ?? "",
    idProforma: raw.idProforma ?? raw.IdProforma,
    idUsuario: raw.idUsuario ?? raw.IdUsuario,
    idTipoMuestreo: raw.idTipoMuestreo ?? raw.IdTipoMuestreo,
    idMuestra: raw.idMuestra ?? raw.IdMuestra,
    clienteFinalizacion: raw.clienteFinalizacion ?? raw.ClienteFinalizacion ?? "",
    fechaElaboracion: raw.fechaElaboracion ?? raw.FechaElaboracion ?? "",
    horaElaboracion: raw.horaElaboracion ?? raw.HoraElaboracion ?? "",
    fechaFinalizacion: raw.fechaFinalizacion ?? raw.FechaFinalizacion ?? "",
    horaFinalizacion: raw.horaFinalizacion ?? raw.HoraFinalizacion ?? "",
    usuarioEntrega: raw.usuarioEntrega ?? raw.UsuarioEntrega ?? "",
    fechaEntrega: raw.fechaEntrega ?? raw.FechaEntrega ?? "",
    horaEntrega: raw.horaEntrega ?? raw.HoraEntrega ?? "",
    idsMuestraxAnalisis: raw.idsMuestraxAnalisis ?? raw.IdsMuestraxAnalisis ?? [],
    idsAnalisis: raw.idsAnalisis ?? raw.IdsAnalisis ?? [],
    ensayos: (raw.ensayos ?? raw.Ensayos ?? []).map((e) => ({
      idMuestraxAnalisis: e.idMuestraxAnalisis ?? e.IdMuestraxAnalisis,
      idAnalisis: e.idAnalisis ?? e.IdAnalisis,
      nombreAnalisis: e.nombreAnalisis ?? e.NombreAnalisis ?? "",
      tipoEnvaseMuestra: e.tipoEnvaseMuestra ?? e.TipoEnvaseMuestra ?? "",
    })),
  };
}

export async function getPlanesMuestreo() {
  const res = await apiGet(API_BASE);
  return asList(res).map(normalizePlanFromApi);
}

export async function getPlanMuestreoById(id) {
  return normalizePlanFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createPlanMuestreo(payload) {
  return apiPost(`${API_BASE}/create-PlanMuestreo`, payload);
}

export async function updatePlanMuestreo(id, payload) {
  return apiPut(`${API_BASE}/update-PlanMuestreo/${id}`, payload);
}

export async function deletePlanMuestreo(id) {
  return apiDelete(`${API_BASE}/delete-PlanMuestreo/${id}`);
}
