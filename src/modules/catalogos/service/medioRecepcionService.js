/**
 * Service: Medios de recepción
 * API: /api/catalogos/medios-recepcion
 * UI `nombreMedioRecepcion` ↔ API `Nombre`.
 */
import { apiGet, apiPost, apiPut, apiDelete } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idMedioRecepcion";
const NAME = "nombreMedioRecepcion";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getMediosRecepcion() {
  return asList(await apiGet("/api/catalogos/medios-recepcion")).map(normalize);
}

export async function getMedioRecepcionById(id) {
  return normalize(await apiGet(`/api/catalogos/medios-recepcion/${id}`));
}

export async function createMedioRecepcion(data) {
  return apiPost("/api/catalogos/medios-recepcion", toNamedPayload(data, NAME));
}

export async function updateMedioRecepcion(id, data) {
  return apiPut(`/api/catalogos/medios-recepcion/${id}`, toNamedPayload(data, NAME));
}

export async function deleteMedioRecepcion(id) {
  return apiDelete(`/api/catalogos/medios-recepcion/${id}`);
}

export async function toggleMedioRecepcionStatus(id) {
  return apiPut(`/api/catalogos/medios-recepcion/toggle-mediorec-status/${id}`);
}
