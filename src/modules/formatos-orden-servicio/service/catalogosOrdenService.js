/**
 * Service: catálogos auxiliares para el formulario de orden.
 * GET /api/FormatosCampoMuestra (listado para el selector idFormatoCampo).
 */
import { apiGet } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

export async function getFormatosCampo() {
  const res = await apiGet("/api/FormatosCampoMuestra");
  return asList(res).map((raw) => ({
    idFormatoCampo: raw.idFormatoCampo ?? raw.IdFormatoCampo,
    comunidad: raw.comunidad ?? raw.Comunidad ?? "",
    muestraCaptadaCampo: raw.muestraCaptadaCampo ?? raw.MuestraCaptadaCampo ?? "",
    estadoCampo: raw.estadoCampo ?? raw.EstadoCampo ?? "",
  }));
}

export function labelFormatoCampo(f) {
  const id = f.idFormatoCampo ?? "";
  const parte = f.comunidad || f.muestraCaptadaCampo || `Campo ${id}`;
  return `#${id} — ${parte}`;
}
