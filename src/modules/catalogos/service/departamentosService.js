import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getDepartamentos() {
  const res = await apiGet("/api/catalogos/departamentos");
  return res ?? [];
}

export async function getDepartamentoById(id) {
  return await apiGet(`/api/catalogos/departamentos/${id}`);
}

export async function createDepartamento(data) {
  return await apiPost("/api/catalogos/departamentos", data);
}

export async function updateDepartamento(id, data) {
  return await apiPut(`/api/catalogos/departamentos/${id}`, data);
}

export async function deleteDepartamento(id) {
  return await apiDelete(`/api/catalogos/departamentos/${id}`);
}

export async function toggleDepartamentoStatus(id) {
  return await apiPut(`/api/catalogos/departamentos/toggle-departamento-status/${id}`);
}
