/**
 * Service: Muestras por análisis
 * API: /api/catalogos/muestras-por-analisis
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/catalogos/muestras-por-analisis";

export function normalizeMuestraPorAnalisisFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idMuestraxAnalisis: raw.idMuestraxAnalisis ?? raw.IdMuestraxAnalisis,
    tipoEnvaseMuestra: raw.tipoEnvaseMuestra ?? raw.TipoEnvaseMuestra ?? "",
    idMuestra: raw.idMuestra ?? raw.IdMuestra,
    identificacionMuestra: raw.identificacionMuestra ?? raw.IdentificacionMuestra ?? "",
    idAnalisis: raw.idAnalisis ?? raw.IdAnalisis,
    nombreAnalisis: raw.nombreAnalisis ?? raw.NombreAnalisis ?? "",
    idPreservante: raw.idPreservante ?? raw.IdPreservante,
    nombrePreservante: raw.nombrePreservante ?? raw.NombrePreservante ?? "",
    idLaboratorio: raw.idLaboratorio ?? raw.IdLaboratorio,
    nombreLaboratorio: raw.nombreLaboratorio ?? raw.NombreLaboratorio ?? "",
    idGrupoAnalisis: raw.idGrupoAnalisis ?? raw.IdGrupoAnalisis,
  };
}

export async function getMuestrasPorAnalisis(idMuestra) {
  const qs = idMuestra ? `?idMuestra=${idMuestra}` : "";
  return asList(await apiGet(`${API_BASE}${qs}`)).map(normalizeMuestraPorAnalisisFromApi);
}

export async function getMuestraPorAnalisisById(id) {
  return normalizeMuestraPorAnalisisFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createMuestraPorAnalisis(payload) {
  return apiPost(API_BASE, payload);
}

export async function updateMuestraPorAnalisis(id, payload) {
  return apiPut(`${API_BASE}/${id}`, payload);
}

export async function deleteMuestraPorAnalisis(id) {
  return apiDelete(`${API_BASE}/${id}`);
}
