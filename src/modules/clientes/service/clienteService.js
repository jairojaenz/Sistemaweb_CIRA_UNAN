import { apiDelete, apiGet, apiPostFormData, apiPut, apiPutFormData } from "../../../auth/api.js";

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.clientes)) return res.data.clientes;
  if (Array.isArray(res?.clientes)) return res.clientes;
  if (Array.isArray(res?.Clientes)) return res.Clientes;
  return [];
}

/**
 * Campos multipart en **PascalCase** (mismos nombres que el API).
 * @param {{ omitNumeroRuc?: boolean }} [options] — si `true` (solo **actualizar** cliente), no se envía `NumeroRuc`
 *   porque el `PUT` no lo define en el contrato.
 */
function appendClienteFormFields(fd, data, options = {}) {
  const { omitNumeroRuc = false } = options;
  fd.append("NombreCliente", data.NombreCliente ?? "");
  fd.append("ApellidoCliente", data.ApellidoCliente ?? "");
  fd.append("NombreContacto", data.NombreContacto ?? "");
  fd.append("TelefonoCliente", data.TelefonoCliente ?? "");
  fd.append("CelularCliente", data.CelularCliente ?? "");
  fd.append("CorreoCliente", data.CorreoCliente ?? "");
  fd.append("DireccionCliente", data.DireccionCliente ?? "");
  fd.append("CedulaCliente", data.CedulaCliente ?? "");
  if (!omitNumeroRuc) {
    fd.append("NumeroRuc", data.NumeroRuc ?? "");
  }
  fd.append("Activo", data.Activo === false ? "false" : "true");
  fd.append("NombreDepartamento", data.NombreDepartamento ?? "");
  fd.append("NombreMunicipio", data.NombreMunicipio ?? "");
  fd.append("NombreTipoCliente", data.NombreTipoCliente ?? "");
  fd.append("IdUsuario", String(data.IdUsuario ?? 0));
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
  appendClienteFormFields(fd, data);
  if (firmaFile) fd.append("FirmaCliente", firmaFile);
  return await apiPostFormData("/api/Clientes/create-cliente", fd);
}

/**
 * `PUT /api/Clientes/update-cliente/{idCliente}` — multipart/form-data.
 *
 * Campos del cuerpo (como en Swagger): `NombreCliente`, `ApellidoCliente`, `TelefonoCliente`,
 * `CelularCliente`, `CorreoCliente`, `DireccionCliente`, `CedulaCliente`, `NombreContacto`,
 * `Activo`, `NombreDepartamento`, `NombreMunicipio`, `NombreTipoCliente`, `IdUsuario`.
 * Opcional: archivo `FirmaCliente` si el usuario dibuja una firma nueva.
 * **No** se envía `NumeroRuc` en esta operación.
 *
 * @param {number} idCliente — mismo valor que el parámetro de ruta `id` del API.
 * @param {object} data
 * @param {File|null} [firmaFile]
 */
export async function updateCliente(idCliente, data, firmaFile) {
  const fd = new FormData();
  appendClienteFormFields(fd, data, { omitNumeroRuc: true });
  if (firmaFile) fd.append("FirmaCliente", firmaFile);
  return await apiPutFormData(`/api/Clientes/update-cliente/${idCliente}`, fd);
}

export async function deleteCliente(idCliente) {
  return await apiDelete(`/api/Clientes/delete-cliente/${idCliente}`);
}

export async function toggleClienteStatus(idCliente) {
  return await apiPut(`/api/Clientes/toggle-cliente-status/${idCliente}`);
}
