import { apiGet, apiPostFormData } from "../../../auth/api.js";

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.clientes)) return res.clientes;
  if (Array.isArray(res?.Clientes)) return res.Clientes;
  return [];
}

export async function getClientes() {
  const res = await apiGet("/api/Clientes/clientes");
  return normalizeListResponse(res);
}

/**
 * @param {object} data
 * @param {File|null} [firmaFile]
 */
export async function createCliente(data, firmaFile) {
  const fd = new FormData();
  fd.append("NombreCliente", data.NombreCliente ?? "");
  fd.append("ApellidoCliente", data.ApellidoCliente ?? "");
  fd.append("TelefonoCliente", data.TelefonoCliente ?? "");
  fd.append("CelularCliente", data.CelularCliente ?? "");
  fd.append("CorreoCliente", data.CorreoCliente ?? "");
  fd.append("DireccionCliente", data.DireccionCliente ?? "");
  fd.append("CedulaCliente", data.CedulaCliente ?? "");
  fd.append("Activo", data.Activo === false ? "false" : "true");
  fd.append("NombreDepartamento", data.NombreDepartamento ?? "");
  fd.append("NombreMunicipio", data.NombreMunicipio ?? "");
  fd.append("NombreTipoCliente", data.NombreTipoCliente ?? "");
  fd.append("IdUsuario", String(data.IdUsuario ?? 0));
  if (firmaFile) fd.append("FirmaCliente", firmaFile);
  return await apiPostFormData("/api/Clientes/create-cliente", fd);
}
