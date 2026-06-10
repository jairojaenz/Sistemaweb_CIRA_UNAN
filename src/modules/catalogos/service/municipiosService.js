import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getMunicipios(idDepartamento) {
  const query = idDepartamento ? `?idDepartamento=${idDepartamento}` : "";
  const res = await apiGet(`/api/catalogos/municipios${query}`);
  return res ?? [];
}

export async function getMunicipioById(id) {
  return await apiGet(`/api/catalogos/municipios/${id}`);
}

export async function createMunicipio(data) {
  return await apiPost("/api/catalogos/municipios", data);
}

export async function updateMunicipio(id, data) {
  return await apiPut(`/api/catalogos/municipios/${id}`, data);
}

export async function deleteMunicipio(id) {
  return await apiDelete(`/api/catalogos/municipios/${id}`);
}

export async function toggleMunicipioStatus(id) {
  return await apiPut(`/api/catalogos/municipios/toggle-municipio-status/${id}`);
}
