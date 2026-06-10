import { apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getEquiposMuestreo() {
  const res = await apiGet("/api/catalogos/equipos-muestreo");
  return res ?? [];
}

export async function getEquipoMuestreoById(id) {
  return await apiGet(`/api/catalogos/equipos-muestreo/${id}`);
}

export async function createEquipoMuestreo(data) {
  return await apiPost("/api/catalogos/equipos-muestreo", data);
}

export async function updateEquipoMuestreo(id, data) {
  return await apiPut(`/api/catalogos/equipos-muestreo/${id}`, data);
}

export async function toggleEquipoMuestreoStatus(id) {
  return await apiPut(`/api/catalogos/equipos-muestreo/toggle-equipo-muestreo-status/${id}`);
}
