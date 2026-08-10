/**
 * Service: Matrices
 * API: /api/catalogos/matrices
 * UI `nombreMatriz` ↔ API `Nombre`. Toggle vía PUT (sin ruta toggle).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

/**
 * Unifica respuesta GET (camelCase / PascalCase) en un solo shape.
 * @param {object} raw
 */
export function normalizeMatrizFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const activo = raw.activo !== false && raw.Activo !== false;
  return {
    ...raw,
    idMatriz: raw.idMatriz ?? raw.IdMatriz,
    nombreMatriz: raw.nombreMatriz ?? raw.nombre ?? raw.Nombre ?? "",
    activo,
  };
}

function toApiPayload(data) {
  return {
    // API Matriz DTO usa Nombre
    nombre: String(data.nombreMatriz ?? data.NombreMatriz ?? data.nombre ?? "").trim(),
    activo: data.activo !== false && data.Activo !== false,
  };
}

export async function getMatrices() {
  const res = await apiGet("/api/catalogos/matrices");
  return asList(res).map(normalizeMatrizFromApi);
}

export async function getMatrizById(id) {
  const res = await apiGet(`/api/catalogos/matrices/${id}`);
  return normalizeMatrizFromApi(res);
}

export async function createMatriz(data) {
  return await apiPost("/api/catalogos/matrices", toApiPayload(data));
}

export async function updateMatriz(id, data) {
  return await apiPut(`/api/catalogos/matrices/${id}`, toApiPayload(data));
}

export async function deleteMatriz(id) {
  return await apiDelete(`/api/catalogos/matrices/${id}`);
}

/** Alterna activo/inactivo vía PUT (el API no expone toggle dedicado). */
export async function toggleMatrizStatus(matriz) {
  return updateMatriz(matriz.idMatriz, {
    nombreMatriz: matriz.nombreMatriz,
    activo: !matriz.activo,
  });
}
