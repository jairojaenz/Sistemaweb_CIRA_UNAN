/**
 * Service: Solicitudes de servicio
 * API: /api/FormatosSolicitudServicio
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosSolicitudServicio";

/** Unifica camelCase/PascalCase y alias viejos del listado. */
export function normalizeSolicitudFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const fechaRecepcion = raw.fechaRecepcion ?? raw.FechaRecepcion ?? raw.fechaRecepcionSolicitud ?? "";
  return {
    ...raw,
    idFormatoSolicitud: raw.idFormatoSolicitud ?? raw.IdFormatoSolicitud,
    numeroSolicitud: raw.numeroSolicitud ?? raw.NumeroSolicitud ?? "",
    fechaRecepcion,
    fechaRecepcionSolicitud: fechaRecepcion,
    idCliente: raw.idCliente ?? raw.IdCliente,
    idUsuario: raw.idUsuario ?? raw.IdUsuario,
    idMedioRecepcion: raw.idMedioRecepcion ?? raw.IdMedioRecepcion,
    idServicios: raw.idServicios ?? raw.IdServicios ?? [],
    cliente: raw.cliente ?? raw.Cliente ?? "",
    correoCliente: raw.correoCliente ?? raw.CorreoCliente ?? "",
    usuario: raw.usuario ?? raw.Usuario ?? "",
    estado: raw.estado ?? raw.Estado ?? "",
    matriz: raw.matriz ?? raw.Matriz ?? "",
    matrices: raw.matrices ?? raw.Matrices ?? [],
    servicio: raw.servicio ?? raw.Servicio ?? "",
    servicios: raw.servicios ?? raw.Servicios ?? [],
    numMuestras: raw.numMuestras ?? raw.NumMuestras ?? 0,
    direccionMuestreo: raw.direccionMuestreo ?? raw.DireccionMuestreo ?? "",
    observacion: raw.observacion ?? raw.Observacion ?? raw.observacionSolicitud ?? "",
    observacionSolicitud: raw.observacion ?? raw.Observacion ?? raw.observacionSolicitud ?? "",
    fechaEnvioProforma: raw.fechaEnvioProforma ?? raw.FechaEnvioProforma ?? "",
    num1ContactoSolicitud: raw.num1ContactoSolicitud ?? raw.Num1ContactoSolicitud ?? "",
    detalles: raw.detalles ?? raw.Detalles ?? [],
  };
}

export async function getSolicitudes() {
  const res = await apiGet(API_BASE);
  return asList(res).map(normalizeSolicitudFromApi);
}

export async function getSolicitudById(id) {
  return normalizeSolicitudFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createSolicitudServicio(payload) {
  return apiPost(`${API_BASE}/create-solicitud`, payload);
}

export async function updateSolicitudServicio(id, payload) {
  return apiPut(`${API_BASE}/update-solicitud/${id}`, payload);
}

export async function deleteSolicitudServicio(id) {
  return apiDelete(`${API_BASE}/delete-solicitud/${id}`);
}
