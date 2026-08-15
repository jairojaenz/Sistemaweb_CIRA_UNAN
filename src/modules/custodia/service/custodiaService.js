/**
 * Service: Cadena de custodia
 * Habla con /api/FormatosCustodiaMuestra (GET, GET/{id}, POST, PUT, DELETE).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosCustodiaMuestra";

/** Convierte "2026-08-14T00:00:00" (o DateOnly) al valor que espera <input type="date">. */
function fechaInput(value) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return "";
}

/** Convierte "08:30:00" (TimeOnly) a "08:30" para <input type="time">. */
function horaInput(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length >= 5 ? text.slice(0, 5) : text;
}

/**
 * Unifica camelCase y PascalCase por si la API o un proxy cambia el casing.
 * El resto de la UI siempre usa estas claves.
 */
export function normalizeCustodiaFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idFormatoCustodia: raw.idFormatoCustodia ?? raw.IdFormatoCustodia,
    estado: raw.estado ?? raw.Estado ?? "Pendiente",
    fechaCreacion: raw.fechaCreacion ?? raw.FechaCreacion ?? null,
    usuarioCreacion: raw.usuarioCreacion ?? raw.UsuarioCreacion ?? "",
    idUsuario: raw.idUsuario ?? raw.IdUsuario,
    usuario: raw.usuario ?? raw.Usuario ?? "",
    idFormatoCampo: raw.idFormatoCampo ?? raw.IdFormatoCampo,
    identificacionMuestra: raw.identificacionMuestra ?? raw.IdentificacionMuestra ?? "",
    detalles: (raw.detalles ?? raw.Detalles ?? []).map((d) => ({
      idDetalleCustodia: d.idDetalleCustodia ?? d.IdDetalleCustodia,
      idMuestra: d.idMuestra ?? d.IdMuestra,
      identificacion: d.identificacion ?? d.Identificacion ?? "",
      idsAnalisis: d.idsAnalisis ?? d.IdsAnalisis ?? [],
      idsMuestraxAnalisis: d.idsMuestraxAnalisis ?? d.IdsMuestraxAnalisis ?? [],
      analisisSolicitado: d.analisisSolicitado ?? d.AnalisisSolicitado ?? "",
    })),
    entregas: (raw.entregas ?? raw.Entregas ?? []).map((e) => ({
      idDetalleEntregaCustodia: e.idDetalleEntregaCustodia ?? e.IdDetalleEntregaCustodia,
      fechaEntrega: fechaInput(e.fechaEntrega ?? e.FechaEntrega),
      horaEntrega: horaInput(e.horaEntrega ?? e.HoraEntrega),
      fechaRecibido: fechaInput(e.fechaRecibido ?? e.FechaRecibido),
      horaRecibido: horaInput(e.horaRecibido ?? e.HoraRecibido),
      idUsuario: e.idUsuario ?? e.IdUsuario,
      usuario: e.usuario ?? e.Usuario ?? "",
      idCliente: e.idCliente ?? e.IdCliente,
      cliente: e.cliente ?? e.Cliente ?? "",
    })),
  };
}

/**
 * Arma el JSON que espera Create/UpdateCustodiaMuestraRequestDto.
 * Filtra filas incompletas para no mandar FKs en 0.
 */
export function formToCustodiaPayload(form, { idUsuario } = {}) {
  return {
    estado: form.estado || "Pendiente",
    usuarioCreacion: form.usuarioCreacion || null,
    idUsuario: Number(idUsuario || form.idUsuario) || 0,
    idFormatoCampo: Number(form.idFormatoCampo) || 0,
    detallesMuestras: (form.detalles ?? [])
      .filter((d) => Number(d.idMuestra) > 0)
      .map((d) => ({
        idMuestra: Number(d.idMuestra),
        idsAnalisis: (d.idsAnalisis ?? []).map(Number).filter((id) => id > 0),
        idsMuestraxAnalisis: (d.idsMuestraxAnalisis ?? []).map(Number).filter((id) => id > 0),
      })),
    entregas: (form.entregas ?? [])
      .filter((e) => Number(e.idUsuario) > 0 && Number(e.idCliente) > 0 && e.fechaEntrega && e.fechaRecibido)
      .map((e) => ({
        fechaEntrega: e.fechaEntrega,
        // TimeOnly en la API quiere HH:mm:ss; el input solo da HH:mm.
        horaEntrega: e.horaEntrega ? (e.horaEntrega.length === 5 ? `${e.horaEntrega}:00` : e.horaEntrega) : "00:00:00",
        fechaRecibido: e.fechaRecibido,
        horaRecibido: e.horaRecibido ? (e.horaRecibido.length === 5 ? `${e.horaRecibido}:00` : e.horaRecibido) : "00:00:00",
        idUsuario: Number(e.idUsuario) || 0,
        idCliente: Number(e.idCliente) || 0,
      })),
  };
}

export async function getCustodias() {
  return asList(await apiGet(API_BASE)).map(normalizeCustodiaFromApi);
}

export async function getCustodiaById(id) {
  return normalizeCustodiaFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createCustodia(payload) {
  return apiPost(API_BASE, payload);
}

export async function updateCustodia(id, payload) {
  return apiPut(`${API_BASE}/${id}`, payload);
}

export async function deleteCustodia(id) {
  return apiDelete(`${API_BASE}/${id}`);
}
