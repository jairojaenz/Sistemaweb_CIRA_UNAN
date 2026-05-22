import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../auth/api";// Importamos las funciones de la capa de API para realizar las solicitudes HTTP para interactuar con el backend.

export async function getServicios() {
  const res = await apiGet("/api/catalogos/servicios");
  return res ?? [];
}// Nota: El operador de coalescencia nula (??) asegura que se devuelva un array vacío si res es null o undefined.

export async function getServicioById(id) {
  return await apiGet(`/api/catalogos/servicios/${id}`);
}//| El endpoint para obtener un servicio por ID.

export async function createServicio(data) {
  return await apiPost(
    "/api/catalogos/servicios",
    data
  );
}// El endpoint para crear un nuevo servicio, enviando los datos necesarios en el cuerpo de la solicitud.

export async function updateServicio(id, data) {
  return await apiPut(
    `/api/catalogos/servicios/${id}`,
    data
  );
}// El endpoint para actualizar un servicio existente.

export async function deleteServicio(id) {
  return await apiDelete(`/api/catalogos/servicios/${id}`);
}// El endpoint para eliminar un servicio por ID.

export async function toggleServicioStatus(id) {
  return await apiPut(
    `/api/catalogos/servicios/toggle-servicio-status/${id}`
  );
}// El endpoint para alternar el estado de un servicio (activo/inactivo) por ID.