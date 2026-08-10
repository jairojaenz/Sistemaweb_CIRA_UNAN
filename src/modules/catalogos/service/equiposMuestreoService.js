/**
 * Service: Equipos de muestreo
 * API: /api/catalogos/equipos-muestreo
 * UI `nombreEquipo` ↔ API `Nombre`.
 */
import { apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idEquipo";
const NAME = "nombreEquipo";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getEquiposMuestreo() {
  return asList(await apiGet("/api/catalogos/equipos-muestreo")).map(normalize);
}

export async function getEquipoMuestreoById(id) {
  return normalize(await apiGet(`/api/catalogos/equipos-muestreo/${id}`));
}

export async function createEquipoMuestreo(data) {
  return apiPost("/api/catalogos/equipos-muestreo", toNamedPayload(data, NAME));
}

export async function updateEquipoMuestreo(id, data) {
  return apiPut(`/api/catalogos/equipos-muestreo/${id}`, toNamedPayload(data, NAME));
}

export async function toggleEquipoMuestreoStatus(id) {
  return apiPut(`/api/catalogos/equipos-muestreo/toggle-equipo-muestreo-status/${id}`);
}
