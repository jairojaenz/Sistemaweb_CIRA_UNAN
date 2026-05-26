import { apiGet, apiPost, apiPut } from "../../../auth/api";

export { getSolicitudById } from "../../solicitud-servicio/service/solicitudServicioService.js";

export async function getProformas() {
  const res = await apiGet("/api/FormatosProforma/proforma");
  return res ?? [];
}

export async function getTiposMuestreo() {
  const res = await apiGet("/api/catalogos/tipos-muestreo");
  return res ?? [];
}

export async function createProforma(data) {
  return await apiPost("/api/FormatosProforma/create-proforma", data);
}

export async function updateProforma(id, data) {
  return await apiPut(`/api/FormatosProforma/update-proforma/${id}`, data);
}
