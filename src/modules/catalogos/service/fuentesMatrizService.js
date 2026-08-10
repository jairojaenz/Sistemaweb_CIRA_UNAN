/**
 * Service: Fuentes de matriz
 * API: /api/catalogos/fuentes-matriz
 * UI `nombreFuente` ↔ API `Nombre` (+ idMatriz).
 * No hay toggle HTTP dedicado: se hace con PUT (activo invertido).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";

function normalizeFuente(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    idFuente: raw.idFuente ?? raw.IdFuente,
    nombreFuente: raw.nombreFuente ?? raw.nombre ?? raw.Nombre ?? "",
    nombre: raw.nombre ?? raw.Nombre ?? raw.nombreFuente ?? "",
    idMatriz: raw.idMatriz ?? raw.IdMatriz,
    activo: raw.activo !== false && raw.Activo !== false,
  };
}

function toApiPayload(data) {
  return {
    nombre: String(data.nombre ?? data.nombreFuente ?? data.Nombre ?? "").trim(),
    idMatriz: Number(data.idMatriz ?? data.IdMatriz),
    activo: data.activo !== false && data.Activo !== false,
  };
}

export async function getFuentesMatriz() {
  const res = await apiGet("/api/catalogos/fuentes-matriz");
  return asList(res).map(normalizeFuente);
}

export async function getFuenteMatrizById(id) {
  return normalizeFuente(await apiGet(`/api/catalogos/fuentes-matriz/${id}`));
}

export async function createFuenteMatriz(data) {
  return await apiPost("/api/catalogos/fuentes-matriz", toApiPayload(data));
}

export async function updateFuenteMatriz(id, data) {
  return await apiPut(`/api/catalogos/fuentes-matriz/${id}`, toApiPayload(data));
}

export async function deleteFuenteMatriz(id) {
  return await apiDelete(`/api/catalogos/fuentes-matriz/${id}`);
}

/** Toggle vía update (el controller no expone /toggle-...). */
export async function toggleFuenteMatrizStatus(item) {
  return updateFuenteMatriz(item.idFuente, {
    nombreFuente: item.nombreFuente ?? item.nombre,
    idMatriz: item.idMatriz,
    activo: !item.activo,
  });
}
