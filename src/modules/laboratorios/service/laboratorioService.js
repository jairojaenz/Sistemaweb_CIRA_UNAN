import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../auth/api";

export async function getLaboratorios() {
  const res = await apiGet("/api/catalogos/laboratorios");
  console.log("Laboratorios obtenidos:", res);
  return res ?? [];
}

export async function getLaboratorioById(id) {
  return await apiGet(`/api/catalogos/laboratorios/${id}`);
}

export async function createLaboratorio(data) {
  return await apiPost(
    "/api/catalogos/laboratorios",
    data
  );
}

export async function updateLaboratorio(id, data) {
  return await apiPut(
    `/api/catalogos/laboratorios/${id}`,
    data
  );
}

export async function deleteLaboratorio(id) {
  return await apiDelete(`/api/catalogos/laboratorios/${id}`);
}

export async function toggleLaboratorioStatus(id) {
  return await apiPut(
    `/api/catalogos/laboratorios/toggle-lab-status/${id}`
  );
}