import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../auth/api";// Importamos las funciones de la capa de API para realizar las solicitudes HTTP para interactuar con el backend.

export async function getMediosRecepcion() {
  const res = await apiGet("/api/catalogos/medios-recepcion");
  return res ?? [];
}// Nota: El operador de coalescencia nula (??) asegura que se devuelva un array vacío si res es null o undefined.

export async function getMedioRecepcionById(id) {
  return await apiGet(`/api/catalogos/medios-recepcion/${id}`);
}//| El endpoint para obtener un medio de recepción por ID.

export async function createMedioRecepcion(data) {
  return await apiPost(
    "/api/catalogos/medios-recepcion",
    data
  );
}// El endpoint para crear un nuevo medio de recepción, enviando los datos necesarios en el cuerpo de la solicitud.

export async function updateMedioRecepcion(id, data) {
  return await apiPut(
    `/api/catalogos/medios-recepcion/${id}`,
    data
  );
}// El endpoint para actualizar un medio de recepción existente.

export async function deleteMedioRecepcion(id) {
  return await apiDelete(`/api/catalogos/medios-recepcion/${id}`);
}// El endpoint para eliminar un medio de recepción por ID.

export async function toggleMedioRecepcionStatus(id) {
  return await apiPut(
    `/api/catalogos/medios-recepcion/toggle-mediorec-status/${id}`
  );
}// El endpoint para alternar el estado de un medio de recepción (activo/inactivo) por ID.