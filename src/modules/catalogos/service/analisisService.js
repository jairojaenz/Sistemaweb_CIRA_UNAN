/**
 * Service: Catálogo de análisis
 * API: /api/catalogos/analisis
 * El wizard de solicitud solo usa getAnalisis(); el CRUD de AnalisisPage usa el resto.
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/catalogos/analisis";

export function normalizeAnalisisFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idAnalisis: raw.idAnalisis ?? raw.IdAnalisis,
    nombreAnalisis: raw.nombreAnalisis ?? raw.NombreAnalisis ?? "",
    abreviacionAnalisis: raw.abreviacionAnalisis ?? raw.AbreviacionAnalisis ?? "",
    descripcionAnalisis: raw.descripcionAnalisis ?? raw.DescripcionAnalisis ?? "",
    precioAnalisis: raw.precioAnalisis ?? raw.PrecioAnalisis ?? 0,
    // Si Activo no viene, se asume true (el DTO viejo a veces no lo mandaba).
    activo: raw.activo !== false && raw.Activo !== false,
    fechaCreacionAnalisis: raw.fechaCreacionAnalisis ?? raw.FechaCreacionAnalisis ?? null,
    idLaboratorio: raw.idLaboratorio ?? raw.IdLaboratorio,
    nombreLaboratorio: raw.nombreLaboratorio ?? raw.NombreLaboratorio ?? "",
    idGrupoAnalisis: raw.idGrupoAnalisis ?? raw.IdGrupoAnalisis ?? null,
    nombreGrupo: raw.nombreGrupo ?? raw.NombreGrupo ?? "",
  };
}

/** Body de Create/UpdateAnalisisRequestDto. Grupo 0 → null (es opcional). */
function toPayload(data, activo = true) {
  const grupo = Number(data.idGrupoAnalisis);
  return {
    nombreAnalisis: String(data.nombreAnalisis ?? "").trim(),
    abreviacionAnalisis: String(data.abreviacionAnalisis ?? "").trim(),
    descripcionAnalisis: String(data.descripcionAnalisis ?? "").trim() || null,
    precioAnalisis: Number(data.precioAnalisis) || 0,
    activo,
    idLaboratorio: Number(data.idLaboratorio) || 0,
    idGrupoAnalisis: grupo > 0 ? grupo : null,
  };
}

export async function getAnalisis() {
  const res = await apiGet(API_BASE);
  return asList(res).map(normalizeAnalisisFromApi);
}

export async function getAnalisisById(id) {
  return normalizeAnalisisFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createAnalisis(data) {
  return apiPost(API_BASE, toPayload(data, true));
}

export async function updateAnalisis(id, data) {
  return apiPut(`${API_BASE}/${id}`, toPayload(data, data.activo !== false));
}

export async function deleteAnalisis(id) {
  return apiDelete(`${API_BASE}/${id}`);
}

/** No hay ruta toggle: se reenvía el PUT con activo invertido. */
export async function toggleAnalisisStatus(item) {
  return updateAnalisis(item.idAnalisis, {
    ...item,
    activo: !item.activo,
  });
}
