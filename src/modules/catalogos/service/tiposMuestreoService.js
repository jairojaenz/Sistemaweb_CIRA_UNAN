/**
 * Service: Tipos de muestreo
 * API: /api/catalogos/tipos-muestreo
 * UI `nombreTipoMuestreo` ↔ API `Nombre`.
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idTipoMuestreo";
const NAME = "nombreTipoMuestreo";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getTiposMuestreo() {
  return asList(await apiGet("/api/catalogos/tipos-muestreo")).map(normalize);
}

export async function getTipoMuestreoById(id) {
  return normalize(await apiGet(`/api/catalogos/tipos-muestreo/${id}`));
}

export async function createTipoMuestreo(data) {
  return apiPost("/api/catalogos/tipos-muestreo", toNamedPayload(data, NAME));
}

export async function updateTipoMuestreo(id, data) {
  return apiPut(`/api/catalogos/tipos-muestreo/${id}`, toNamedPayload(data, NAME));
}

export async function deleteTipoMuestreo(id) {
  return apiDelete(`/api/catalogos/tipos-muestreo/${id}`);
}

export async function toggleTipoMuestreoStatus(id) {
  return apiPut(`/api/catalogos/tipos-muestreo/toggle-tipo-muestreo-status/${id}`);
}
