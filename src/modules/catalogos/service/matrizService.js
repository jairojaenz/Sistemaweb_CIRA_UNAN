import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

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
    nombreMatriz: raw.nombreMatriz ?? raw.NombreMatriz ?? "",
    activo,
  };
}

function toApiPayload(data) {
  return {
    nombreMatriz: String(data.nombreMatriz ?? data.NombreMatriz ?? "").trim(),
    activo: data.activo !== false && data.Activo !== false,
  };
}

export async function getMatrices() {
  const res = await apiGet("/api/catalogos/matrices");
  return normalizeListResponse(res).map(normalizeMatrizFromApi);
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
