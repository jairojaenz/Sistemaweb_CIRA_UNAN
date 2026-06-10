import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getTiposMuestreo() {
  const res = await apiGet("/api/catalogos/tipos-muestreo");
  return res ?? [];
}

export async function getTipoMuestreoById(id) {
  return await apiGet(`/api/catalogos/tipos-muestreo/${id}`);
}

export async function createTipoMuestreo(data) {
  return await apiPost("/api/catalogos/tipos-muestreo", data);
}

export async function updateTipoMuestreo(id, data) {
  return await apiPut(`/api/catalogos/tipos-muestreo/${id}`, data);
}

export async function deleteTipoMuestreo(id) {
  return await apiDelete(`/api/catalogos/tipos-muestreo/${id}`);
}

export async function toggleTipoMuestreoStatus(id) {
  return await apiPut(`/api/catalogos/tipos-muestreo/toggle-tipo-muestreo-status/${id}`);
}
