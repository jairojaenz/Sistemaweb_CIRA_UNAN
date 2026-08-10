/**
 * Service: Técnicas de análisis
 * API: /api/catalogos/tecnicas-analisis
 * Toggle = PUT con activo invertido (sin ruta toggle).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";

export async function getTecnicasAnalisis() {
  const res = await apiGet("/api/catalogos/tecnicas-analisis");
  return asList(res);
}

export async function getTecnicaAnalisisById(id) {
  return await apiGet(`/api/catalogos/tecnicas-analisis/${id}`);
}

export async function createTecnicaAnalisis(data) {
  return await apiPost("/api/catalogos/tecnicas-analisis", data);
}

export async function updateTecnicaAnalisis(id, data) {
  return await apiPut(`/api/catalogos/tecnicas-analisis/${id}`, data);
}

export async function deleteTecnicaAnalisis(id) {
  return await apiDelete(`/api/catalogos/tecnicas-analisis/${id}`);
}

export async function toggleTecnicaAnalisisStatus(item) {
  return updateTecnicaAnalisis(item.idTecnicaAnalisis, {
    nombreTecnica: item.nombreTecnica,
    descripcionTecnica: item.descripcionTecnica ?? null,
    idLaboratorio: item.idLaboratorio,
    activo: !item.activo,
  });
}
