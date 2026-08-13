/**
 * Service: Muestras
 * API: /api/catalogos/muestras
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

function horaInput(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length >= 5 ? text.slice(0, 5) : text;
}

function fechaInput(value) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return "";
}

export function normalizeMuestraFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const estado = raw.estado ?? raw.Estado ?? "Activo";
  return {
    idMuestra: raw.idMuestra ?? raw.IdMuestra,
    identificacion: raw.identificacion ?? raw.Identificacion ?? "",
    elevacion: raw.elevacion ?? raw.Elevacion ?? "",
    latitud: raw.latitud ?? raw.Latitud ?? "",
    longitud: raw.longitud ?? raw.Longitud ?? "",
    fechaToma: fechaInput(raw.fechaToma ?? raw.FechaToma),
    horaToma: horaInput(raw.horaToma ?? raw.HoraToma),
    cantidadEnvases: raw.cantidadEnvases ?? raw.CantidadEnvases ?? 1,
    estado,
    activo: String(estado).toLowerCase() !== "inactivo",
    fechaCreacion: raw.fechaCreacion ?? raw.FechaCreacion ?? null,
    usuarioCreacion: raw.usuarioCreacion ?? raw.UsuarioCreacion ?? "",
    idMatriz: raw.idMatriz ?? raw.IdMatriz,
    idFuente: raw.idFuente ?? raw.IdFuente,
    idDepartamento: raw.idDepartamento ?? raw.IdDepartamento,
    idMunicipio: raw.idMunicipio ?? raw.IdMunicipio,
    nombreMatriz: raw.nombreMatriz ?? raw.NombreMatriz ?? "",
    nombreFuente: raw.nombreFuente ?? raw.NombreFuente ?? "",
    nombreDepartamento: raw.nombreDepartamento ?? raw.NombreDepartamento ?? "",
    nombreMunicipio: raw.nombreMunicipio ?? raw.NombreMunicipio ?? "",
  };
}

function toApiPayload(data) {
  return {
    identificacion: String(data.identificacion ?? "").trim(),
    elevacion: String(data.elevacion ?? "").trim() || null,
    latitud: String(data.latitud ?? "").trim() || null,
    longitud: String(data.longitud ?? "").trim() || null,
    fechaToma: data.fechaToma || null,
    horaToma: data.horaToma ? (data.horaToma.length === 5 ? `${data.horaToma}:00` : data.horaToma) : null,
    cantidadEnvases: Number(data.cantidadEnvases) || 1,
    estado: String(data.estado ?? "Activo").trim() || "Activo",
    idMatriz: Number(data.idMatriz) || 0,
    idFuente: Number(data.idFuente) || 0,
    idDepartamento: Number(data.idDepartamento) || 0,
    idMunicipio: Number(data.idMunicipio) || 0,
    usuarioCreacion: data.usuarioCreacion || null,
  };
}

export async function getMuestras() {
  const res = await apiGet("/api/catalogos/muestras");
  return asList(res).map(normalizeMuestraFromApi);
}

export async function getMuestraById(id) {
  const res = await apiGet(`/api/catalogos/muestras/${id}`);
  return normalizeMuestraFromApi(res);
}

export async function createMuestra(data) {
  return await apiPost("/api/catalogos/muestras", toApiPayload(data));
}

export async function updateMuestra(id, data) {
  return await apiPut(`/api/catalogos/muestras/${id}`, toApiPayload(data));
}

export async function deleteMuestra(id) {
  return await apiDelete(`/api/catalogos/muestras/${id}`);
}

export async function toggleMuestraStatus(item) {
  return updateMuestra(item.idMuestra, {
    ...item,
    estado: item.activo ? "Inactivo" : "Activo",
  });
}
