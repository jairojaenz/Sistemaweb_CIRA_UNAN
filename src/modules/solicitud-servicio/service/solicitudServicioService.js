/**
 * Service: Solicitudes de servicio
 * API: /api/FormatosSolicitudServicio
 * CRUD alineado con FormatosSolicitudServicioController.
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosSolicitudServicio";

export async function getSolicitudes() {
  const res = await apiGet(API_BASE);
  return asList(res);
}

export async function getSolicitudById(id) {
  return apiGet(`${API_BASE}/${id}`);
}

export async function createSolicitudServicio(payload) {
  return apiPost(`${API_BASE}/create-solicitud`, payload);
}

export async function updateSolicitudServicio(id, payload) {
  return apiPut(`${API_BASE}/update-solicitud/${id}`, payload);
}

export async function deleteSolicitudServicio(id) {
  return apiDelete(`${API_BASE}/delete-solicitud/${id}`);
}
