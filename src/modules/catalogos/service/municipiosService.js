/**
 * Service: Municipios
 * API: /api/catalogos/municipios (?idDepartamento= opcional)
 * UI `nombreMunicipio` ↔ API `Nombre` + IdDepartamento.
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList, normalizeNamedItem } from "../../../utils/apiList.js";

function normalize(raw) {
  const base = normalizeNamedItem(raw, {
    idKey: "idMunicipio",
    nameKey: "nombreMunicipio",
  });
  return {
    ...base,
    idDepartamento: raw.idDepartamento ?? raw.IdDepartamento,
  };
}

function toPayload(data) {
  return {
    nombre: String(data.nombre ?? data.nombreMunicipio ?? "").trim(),
    idDepartamento: Number(data.idDepartamento),
    activo: data.activo !== false && data.Activo !== false,
  };
}

export async function getMunicipios(idDepartamento) {
  const query =
    idDepartamento != null && idDepartamento !== ""
      ? `?idDepartamento=${idDepartamento}`
      : "";
  return asList(await apiGet(`/api/catalogos/municipios${query}`)).map(normalize);
}

export async function getMunicipioById(id) {
  return normalize(await apiGet(`/api/catalogos/municipios/${id}`));
}

export async function createMunicipio(data) {
  return apiPost("/api/catalogos/municipios", toPayload({ ...data, activo: true }));
}

export async function updateMunicipio(id, data) {
  return apiPut(`/api/catalogos/municipios/${id}`, toPayload(data));
}

export async function deleteMunicipio(id) {
  return apiDelete(`/api/catalogos/municipios/${id}`);
}

export async function toggleMunicipioStatus(id) {
  return apiPut(`/api/catalogos/municipios/toggle-municipio-status/${id}`);
}
