import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../auth/api";// Importamos las funciones de la capa de API para realizar las solicitudes HTTP para interactuar con el backend.

export async function getCargos() {
  const res = await apiGet("/api/catalogos/cargos");
  return res ?? [];
}// Nota: El operador de coalescencia nula (??) asegura que se devuelva un array vacío si res es null o undefined.

export async function getCargoById(id) {
  return await apiGet(`/api/catalogos/cargos/${id}`);
}// El endpoint para obtener un cargo por ID.

export async function createCargo(data) {
  return await apiPost(
    "/api/catalogos/cargos",
    data
  );
}// El endpoint para crear un nuevo cargo, enviando los datos necesarios en el cuerpo de la solicitud.

export async function updateCargo(id, data) {
  return await apiPut(
    `/api/catalogos/cargos/${id}`,
    data
  );
}// El endpoint para actualizar un cargo existente.

/* export async function deleteCargo(id) {
  return await apiDelete(`/api/catalogos/cargos/${id}`);
}*/ // El endpoint para eliminar un cargo por ID.

export async function toggleCargoStatus(id) {
  return await apiPut(
    `/api/catalogos/cargos/toggle-cargos-status/${id}`
  );
}// El endpoint para alternar el estado de un cargo (activo/inactivo) por ID.