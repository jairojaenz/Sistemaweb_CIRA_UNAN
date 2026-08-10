/**
 * Service: Servicios
 * API: /api/catalogos/servicios
 * UI `nombreServicio` ↔ API `Nombre`.
 */
import { apiGet, apiPost, apiPut, apiDelete } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idServicio";
const NAME = "nombreServicio";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getServicios() {
  return asList(await apiGet("/api/catalogos/servicios")).map(normalize);
}

export async function getServicioById(id) {
  return normalize(await apiGet(`/api/catalogos/servicios/${id}`));
}

export async function createServicio(data) {
  return apiPost("/api/catalogos/servicios", toNamedPayload(data, NAME));
}

export async function updateServicio(id, data) {
  return apiPut(`/api/catalogos/servicios/${id}`, toNamedPayload(data, NAME));
}

export async function deleteServicio(id) {
  return apiDelete(`/api/catalogos/servicios/${id}`);
}

export async function toggleServicioStatus(id) {
  return apiPut(`/api/catalogos/servicios/toggle-servicio-status/${id}`);
}
