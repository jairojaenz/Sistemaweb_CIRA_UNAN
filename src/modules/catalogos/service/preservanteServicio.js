import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../auth/api";// Importamos las funciones de la capa de API para realizar las solicitudes HTTP para interactuar con el backend.

export async function getPreservantes() {
  const res = await apiGet("/api/catalogos/preservantes");
  return res ?? [];
}// Nota: El operador de coalescencia nula (??) asegura que se devuelva un array vacío si res es null o undefined.

export async function getPreservanteById(id) {
  return await apiGet(`/api/catalogos/preservantes/${id}`);
}// El endpoint para obtener un preservante por ID.

export async function createPreservante(data) {
  return await apiPost(
    "/api/catalogos/preservantes",
    data
  );
}// El endpoint para crear un nuevo preservante, enviando los datos necesarios en el cuerpo de la solicitud.

export async function updatePreservante(id, data) {
  return await apiPut(
    `/api/catalogos/preservantes/${id}`,
    data
  );
}// El endpoint para actualizar un preservante existente.

/* export async function deletePreservante(id) {
  return await apiDelete(`/api/catalogos/preservantes/${id}`);
}*/ // El endpoint para eliminar un preservante por ID.

export async function togglePreservanteStatus(id) {
  return await apiPut(
    `/api/catalogos/preservantes/toggle-preservante-status/${id}`
  );
}// El endpoint para alternar el estado de un preservante (activo/inactivo) por ID.