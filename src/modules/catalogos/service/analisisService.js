/**
 * Service: Análisis
 * API: /api/catalogos/analisis
 * El wizard de solicitud necesita idAnalisis (no texto libre).
 */
import { apiGet } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

export function normalizeAnalisisFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idAnalisis: raw.idAnalisis ?? raw.IdAnalisis,
    nombreAnalisis: raw.nombreAnalisis ?? raw.NombreAnalisis ?? "",
    abreviacionAnalisis: raw.abreviacionAnalisis ?? raw.AbreviacionAnalisis ?? "",
    descripcionAnalisis: raw.descripcionAnalisis ?? raw.DescripcionAnalisis ?? "",
    precioAnalisis: raw.precioAnalisis ?? raw.PrecioAnalisis ?? 0,
    activo: raw.activo !== false && raw.Activo !== false,
  };
}

export async function getAnalisis() {
  const res = await apiGet("/api/catalogos/analisis");
  return asList(res).map(normalizeAnalisisFromApi);
}
