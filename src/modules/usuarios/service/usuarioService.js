import { apiGet, apiPostFormData, apiPutFormData, apiDelete, apiPut } from "../../../auth/api";

export async function getUsuarios() {
  const res = await apiGet("/api/User/get-users");
  return res.users ?? [];
}

export async function getUsuarioById(id) {
  return await apiGet(`/api/User/get-user/${id}`);
}

export async function getCargos() {
  return await apiGet("/api/catalogos/cargos");
}

export async function getDepartamentos() {
  return await apiGet("/api/catalogos/departamentos");
}

export async function getMunicipios() {
  return await apiGet("/api/catalogos/municipios");
}

export async function getMunicipiosByDepartamento(idDepartamento) {
  return await apiGet(`/api/catalogos/municipios?idDepartamento=${idDepartamento}`);
}

export async function getLaboratorios() {
  return await apiGet("/api/catalogos/laboratorios");
}

export async function createUsuario(data) {
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
  return await apiPostFormData("/api/User/create-user", fd);
}

export async function updateUsuario(id, data) {
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
  return await apiPutFormData(`/api/User/update-user/${id}`, fd);
}

export async function deleteUsuario(id) {
  return await apiDelete(`/api/User/delete-user/${id}`);
}

export async function toggleUsuarioStatus(id) {
  return await apiPut(`/api/User/toggle-user-status/${id}`);
}
