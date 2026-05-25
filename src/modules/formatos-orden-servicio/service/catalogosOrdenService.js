import { apiGet } from "../../../auth/api.js";

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export async function getFormatosCampo() {
  const res = await apiGet("/api/FormatosCampoMuestra");
  return normalizeListResponse(res).map((raw) => ({
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
