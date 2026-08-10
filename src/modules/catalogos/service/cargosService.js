/**
 * Service: Cargos
 * API: /api/catalogos/cargos
 *
 * El UI usa `nombreCargo`; el DTO de la API usa `Nombre`.
 * normalizeNamedItem / toNamedPayload hacen ese puente para listar/crear/editar.
 */
import { apiGet, apiPost, apiPut, apiDelete } from "../../../auth/api";
import { asList, normalizeNamedItem, toNamedPayload } from "../../../utils/apiList.js";

const ID = "idCargo";
const NAME = "nombreCargo";

function normalize(raw) {
  return normalizeNamedItem(raw, { idKey: ID, nameKey: NAME });
}

/** GET listado → array con nombreCargo / activo. */
export async function getCargos() {
  return asList(await apiGet("/api/catalogos/cargos")).map(normalize);
}

export async function getCargoById(id) {
  return normalize(await apiGet(`/api/catalogos/cargos/${id}`));
}

/** POST: envía { nombre, activo } al backend. */
export async function createCargo(data) {
  return apiPost("/api/catalogos/cargos", toNamedPayload(data, NAME));
}

export async function updateCargo(id, data) {
  return apiPut(`/api/catalogos/cargos/${id}`, toNamedPayload(data, NAME));
}

export async function deleteCargo(id) {
  return apiDelete(`/api/catalogos/cargos/${id}`);
}

/** PUT toggle dedicado del API. */
export async function toggleCargoStatus(id) {
  return apiPut(`/api/catalogos/cargos/toggle-cargos-status/${id}`);
}
