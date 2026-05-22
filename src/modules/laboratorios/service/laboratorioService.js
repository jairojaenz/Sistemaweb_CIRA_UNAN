import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../auth/api";// Importamos las funciones de la capa de API para realizar las solicitudes HTTP para interactuar con el backend.

export async function getLaboratorios() {
  const res = await apiGet("/api/catalogos/laboratorios");
  //console.log("Laboratorios obtenidos:", res);
  return res ?? [];
}// Nota: El operador de coalescencia nula (??) asegura que se devuelva un array vacío si res es null o undefined.

export async function getLaboratorioById(id) {
  return await apiGet(`/api/catalogos/laboratorios/${id}`);
}//| El endpoint para obtener un laboratorio por ID.

export async function createLaboratorio(data) {
  return await apiPost(
    "/api/catalogos/laboratorios",
    data
  );
}// El endpoint para crear un nuevo laboratorio, enviando los datos necesarios en el cuerpo de la solicitud.

export async function updateLaboratorio(id, data) {
  return await apiPut(
    `/api/catalogos/laboratorios/${id}`,
    data
  );
}// El endpoint para actualizar un laboratorio existente.

export async function deleteLaboratorio(id) {
  return await apiDelete(`/api/catalogos/laboratorios/${id}`);
}// El endpoint para eliminar un laboratorio por ID.

export async function toggleLaboratorioStatus(id) {
  return await apiPut(
    `/api/catalogos/laboratorios/toggle-lab-status/${id}`
  );
}// El endpoint para alternar el estado de un laboratorio (activo/inactivo) por ID.