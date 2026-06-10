import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getGruposAnalisis() {
  const res = await apiGet("/api/catalogos/grupos-analisis");
  return res ?? [];
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

export async function toggleGrupoAnalisisStatus(grupo) {
  return updateGrupoAnalisis(grupo.idGrupoAnalisis, {
    nombreGrupo: grupo.nombreGrupo,
    precioGrupo: grupo.precioGrupo,
    idLaboratorio: grupo.idLaboratorio,
    activo: !grupo.activo,
  });
}
