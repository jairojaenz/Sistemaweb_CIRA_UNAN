import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api";

export async function getTiposCliente() {
  const res = await apiGet("/api/catalogos/tipos-cliente");
  return res ?? [];
}

export async function getTipoClienteById(id) {
  return await apiGet(`/api/catalogos/tipos-cliente/${id}`);
}

export async function createTipoCliente(data) {
  return await apiPost("/api/catalogos/tipos-cliente", data);
}

export async function updateTipoCliente(id, data) {
  return await apiPut(`/api/catalogos/tipos-cliente/${id}`, data);
}

export async function deleteTipoCliente(id) {
  return await apiDelete(`/api/catalogos/tipos-cliente/${id}`);
}

export async function toggleTipoClienteStatus(id) {
  return await apiPut(`/api/catalogos/tipos-cliente/toggle-tipo-cliente-status/${id}`);
}
