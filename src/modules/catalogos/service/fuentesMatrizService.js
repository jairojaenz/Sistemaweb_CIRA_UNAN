import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getFuentesMatriz() {
  const res = await apiGet("/api/catalogos/fuentes-matriz");
  return res ?? [];
}

export async function getFuenteMatrizById(id) {
  return await apiGet(`/api/catalogos/fuentes-matriz/${id}`);
}

export async function createFuenteMatriz(data) {
  return await apiPost("/api/catalogos/fuentes-matriz", data);
}

export async function updateFuenteMatriz(id, data) {
  return await apiPut(`/api/catalogos/fuentes-matriz/${id}`, data);
}

export async function deleteFuenteMatriz(id) {
  return await apiDelete(`/api/catalogos/fuentes-matriz/${id}`);
}

export async function toggleFuenteMatrizStatus(fuente) {
  return updateFuenteMatriz(fuente.idFuente, {
    nombreFuente: fuente.nombreFuente,
    idMatriz: fuente.idMatriz,
    activo: !fuente.activo,
  });
}
