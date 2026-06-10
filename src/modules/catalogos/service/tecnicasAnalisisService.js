import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getTecnicasAnalisis() {
  const res = await apiGet("/api/catalogos/tecnicas-analisis");
  return res ?? [];
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

export async function toggleTecnicaAnalisisStatus(tecnica) {
  return updateTecnicaAnalisis(tecnica.idTecnicaAnalisis, {
    nombreTecnica: tecnica.nombreTecnica,
    descripcionTecnica: tecnica.descripcionTecnica ?? "",
    idLaboratorio: tecnica.idLaboratorio,
    activo: !tecnica.activo,
  });
}
