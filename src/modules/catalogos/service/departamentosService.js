/**
 * Service: Departamentos
 * API: /api/catalogos/departamentos
 * UI `nombreDepartamento` ↔ API `Nombre`.
 * Create solo envía { nombre } (el DTO create no incluye Activo).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idDepartamento";
const NAME = "nombreDepartamento";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getDepartamentos() {
  return asList(await apiGet("/api/catalogos/departamentos")).map(normalize);
}

export async function getDepartamentoById(id) {
  return normalize(await apiGet(`/api/catalogos/departamentos/${id}`));
}

export async function createDepartamento(data) {
  return apiPost("/api/catalogos/departamentos", {
    nombre: String(data.nombre ?? data[NAME] ?? "").trim(),
  });
}

export async function updateDepartamento(id, data) {
  return apiPut(`/api/catalogos/departamentos/${id}`, toNamedPayload(data, NAME));
}

export async function deleteDepartamento(id) {
  return apiDelete(`/api/catalogos/departamentos/${id}`);
}

export async function toggleDepartamentoStatus(id) {
  return apiPut(`/api/catalogos/departamentos/toggle-departamento-status/${id}`);
}
