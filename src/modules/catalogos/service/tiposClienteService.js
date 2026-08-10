/**
 * Service: Tipos de cliente
 * API: /api/catalogos/tipos-cliente
 * UI `nombreTipoCliente` ↔ API `Nombre`.
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idTipoCliente";
const NAME = "nombreTipoCliente";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

export async function getTiposCliente() {
  return asList(await apiGet("/api/catalogos/tipos-cliente")).map(normalize);
}

export async function getTipoClienteById(id) {
  return normalize(await apiGet(`/api/catalogos/tipos-cliente/${id}`));
}

export async function createTipoCliente(data) {
  return apiPost("/api/catalogos/tipos-cliente", toNamedPayload(data, NAME));
}

export async function updateTipoCliente(id, data) {
  return apiPut(`/api/catalogos/tipos-cliente/${id}`, toNamedPayload(data, NAME));
}

export async function deleteTipoCliente(id) {
  return apiDelete(`/api/catalogos/tipos-cliente/${id}`);
}

export async function toggleTipoClienteStatus(id) {
  return apiPut(`/api/catalogos/tipos-cliente/toggle-tipo-cliente-status/${id}`);
}
