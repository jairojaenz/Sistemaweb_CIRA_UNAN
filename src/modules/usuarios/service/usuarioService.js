/**
 * Service: Usuarios (solo Administrador en API y rutas).
 * API: /api/User/...
 * GET devuelve Nombre/Correo/Firma; el UI usa nombreUsuario/correoUsuario/firmaUsuario.
 */
import { apiGet, apiPostFormData, apiPutFormData, apiDelete, apiPut } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";
import { getMunicipios as getMunicipiosCatalogo } from "../../catalogos/service/municipiosService.js";

export function normalizeUsuarioFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    idUsuario: raw.idUsuario ?? raw.IdUsuario,
    nombreUsuario: raw.nombreUsuario ?? raw.NombreUsuario ?? raw.nombre ?? raw.Nombre ?? "",
    apellidoUsuario: raw.apellidoUsuario ?? raw.ApellidoUsuario ?? raw.apellido ?? raw.Apellido ?? "",
    correoUsuario: raw.correoUsuario ?? raw.CorreoUsuario ?? raw.correo ?? raw.Correo ?? "",
    celularUsuario: raw.celularUsuario ?? raw.CelularUsuario ?? raw.celular ?? raw.Celular ?? "",
    cedulaUsuario: raw.cedulaUsuario ?? raw.CedulaUsuario ?? raw.cedula ?? raw.Cedula ?? "",
    firmaUsuario: raw.firmaUsuario ?? raw.FirmaUsuario ?? raw.firma ?? raw.Firma ?? "",
    cargo: raw.cargo ?? raw.Cargo ?? "",
    departamento: raw.departamento ?? raw.Departamento ?? "",
    municipio: raw.municipio ?? raw.Municipio ?? "",
    laboratorio: raw.laboratorio ?? raw.Laboratorio ?? "",
    activo: raw.activo !== false && raw.Activo !== false,
  };
}

/** GET /api/User/get-users → { users: [...] } o array. */
export async function getUsuarios() {
  const res = await apiGet("/api/User/get-users");
  return asList(res).map(normalizeUsuarioFromApi);
}

export async function getUsuarioById(id) {
  return normalizeUsuarioFromApi(await apiGet(`/api/User/get-user/${id}`));
}

export { getCargos } from "../../catalogos/service/cargosService.js";
export { getDepartamentos } from "../../catalogos/service/departamentosService.js";
export { getMunicipios } from "../../catalogos/service/municipiosService.js";
export { getLaboratorios } from "../../laboratorios/service/laboratorioService.js";

export async function getMunicipiosByDepartamento(idDepartamento) {
  return getMunicipiosCatalogo(idDepartamento);
}

export async function createUsuario(data, firmaFile) {
  const fd = new FormData();
  fd.append("NombreUsuario", data.NombreUsuario);
  fd.append("ApellidoUsuario", data.ApellidoUsuario);
  fd.append("CorreoUsuario", data.CorreoUsuario);
  fd.append("Password", data.Password);
  fd.append("Cargo", data.Cargo);
  fd.append("NombreDep", data.NombreDep);
  fd.append("NombreMunic", data.NombreMunic);
  fd.append("Laboratorio", data.Laboratorio);
  if (data.CelularUsuario) fd.append("CelularUsuario", data.CelularUsuario);
  if (data.CedulaUsuario) fd.append("CedulaUsuario", data.CedulaUsuario);
  if (firmaFile) fd.append("FirmaUsuario", firmaFile);
  return await apiPostFormData("/api/User/create-user", fd);
}

export async function updateUsuario(id, data, firmaFile) {
  const fd = new FormData();
  fd.append("NombreUsuario", data.NombreUsuario);
  fd.append("ApellidoUsuario", data.ApellidoUsuario);
  fd.append("CorreoUsuario", data.CorreoUsuario);
  fd.append("Cargo", data.Cargo);
  fd.append("NombreDep", data.NombreDep);
  fd.append("NombreMunic", data.NombreMunic);
  fd.append("Laboratorio", data.Laboratorio);
  if (data.CelularUsuario) fd.append("CelularUsuario", data.CelularUsuario);
  if (data.CedulaUsuario) fd.append("CedulaUsuario", data.CedulaUsuario);
  if (data.PasswordNueva) fd.append("PasswordNueva", data.PasswordNueva);
  if (firmaFile) fd.append("FirmaUsuario", firmaFile);
  return await apiPutFormData(`/api/User/update-user/${id}`, fd);
}

export async function deleteUsuario(id) {
  return await apiDelete(`/api/User/delete-user/${id}`);
}

export async function toggleUsuarioStatus(id) {
  return await apiPut(`/api/User/toggle-user-status/${id}`);
}
