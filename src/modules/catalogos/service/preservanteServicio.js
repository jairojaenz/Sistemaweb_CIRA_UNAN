/**
 * Service: Preservantes
 * API: /api/catalogos/preservantes
 * UI `nombrePreservante` ↔ API `Nombre`.
 */
import { apiGet, apiPost, apiPut, apiDelete } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idPreservante";
const NAME = "nombrePreservante";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getPreservantes() {
  return asList(await apiGet("/api/catalogos/preservantes")).map(normalize);
}

export async function getPreservanteById(id) {
  return normalize(await apiGet(`/api/catalogos/preservantes/${id}`));
}

export async function createPreservante(data) {
  return apiPost("/api/catalogos/preservantes", toNamedPayload(data, NAME));
}

export async function updatePreservante(id, data) {
  return apiPut(`/api/catalogos/preservantes/${id}`, toNamedPayload(data, NAME));
}

export async function deletePreservante(id) {
  return apiDelete(`/api/catalogos/preservantes/${id}`);
}

export async function togglePreservanteStatus(id) {
  return apiPut(`/api/catalogos/preservantes/toggle-preservante-status/${id}`);
}
