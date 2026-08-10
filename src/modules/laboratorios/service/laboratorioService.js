/**
 * Service: Laboratorios
 * API: /api/catalogos/laboratorios
 * UI `nombreLaboratorio` / `abreviacionLaboratorio` ↔ API `Nombre` / `Abreviacion`.
 */
import { apiGet, apiPost, apiPut, apiDelete } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";

function normalize(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    idLaboratorio: raw.idLaboratorio ?? raw.IdLaboratorio,
    nombreLaboratorio: raw.nombreLaboratorio ?? raw.nombre ?? raw.Nombre ?? "",
    abreviacionLaboratorio:
      raw.abreviacionLaboratorio ?? raw.abreviacion ?? raw.Abreviacion ?? "",
    activo: raw.activo !== false && raw.Activo !== false,
  };
}

function toPayload(data) {
  return {
    nombre: String(data.nombre ?? data.nombreLaboratorio ?? "").trim(),
    abreviacion: String(
      data.abreviacion ?? data.abreviacionLaboratorio ?? ""
    ).trim(),
    activo: data.activo !== false && data.Activo !== false,
  };
}

export async function getLaboratorios() {
  return asList(await apiGet("/api/catalogos/laboratorios")).map(normalize);
}

export async function getLaboratorioById(id) {
  return normalize(await apiGet(`/api/catalogos/laboratorios/${id}`));
}

export async function createLaboratorio(data) {
  return apiPost("/api/catalogos/laboratorios", toPayload(data));
}

export async function updateLaboratorio(id, data) {
  return apiPut(`/api/catalogos/laboratorios/${id}`, toPayload(data));
}

export async function deleteLaboratorio(id) {
  return apiDelete(`/api/catalogos/laboratorios/${id}`);
}

export async function toggleLaboratorioStatus(id) {
  return apiPut(`/api/catalogos/laboratorios/toggle-lab-status/${id}`);
}
