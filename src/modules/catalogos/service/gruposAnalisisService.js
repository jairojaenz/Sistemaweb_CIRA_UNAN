/**
 * Service: Grupos de análisis
 * API: /api/catalogos/grupos-analisis
 * Campos ya coinciden (nombreGrupo, precioGrupo, idLaboratorio).
 * Toggle = PUT con activo invertido (sin ruta toggle).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";

export async function getGruposAnalisis() {
  const res = await apiGet("/api/catalogos/grupos-analisis");
  return asList(res);
}

export async function getGrupoAnalisisById(id) {
  return await apiGet(`/api/catalogos/grupos-analisis/${id}`);
}

export async function createGrupoAnalisis(data) {
  return await apiPost("/api/catalogos/grupos-analisis", data);
}

export async function updateGrupoAnalisis(id, data) {
  return await apiPut(`/api/catalogos/grupos-analisis/${id}`, data);
}

export async function deleteGrupoAnalisis(id) {
  return await apiDelete(`/api/catalogos/grupos-analisis/${id}`);
}

export async function toggleGrupoAnalisisStatus(item) {
  return updateGrupoAnalisis(item.idGrupoAnalisis, {
    nombreGrupo: item.nombreGrupo,
    precioGrupo: item.precioGrupo,
    idLaboratorio: item.idLaboratorio,
    activo: !item.activo,
  });
}
