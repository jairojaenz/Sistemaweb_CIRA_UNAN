import { apiDelete, apiGet, apiPostFormData, apiPut, apiPutFormData } from "../../../auth/api.js";

const TIPO_INDIVIDUO = "Individuo";

function normalizeListResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.clientes)) return res.data.clientes;
  if (Array.isArray(res?.clientes)) return res.clientes;
  if (Array.isArray(res?.Clientes)) return res.Clientes;
  return [];
}

function resolveTipoCliente(c) {
  return c.tiposCliente ?? c.nombreTipoCliente ?? c.NombreTipoCliente ?? TIPO_INDIVIDUO;
}

function resolveActivo(c) {
  if (c.activo === false || c.Activo === false) return false;
  return true;
}

/**
 * Unifica la respuesta GET (`camelCase`) y respuestas legacy (`PascalCase`) en un solo shape.
 * @param {object} raw
 */
export function normalizeClienteFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const tipo = resolveTipoCliente(raw);
  const departamento =
    raw.departamento ?? raw.nombreDepartamento ?? raw.NombreDepartamento ?? "";
  const municipio = raw.municipio ?? raw.nombreMunicipio ?? raw.NombreMunicipio ?? "";
  return {
    ...raw,
    idCliente: raw.idCliente ?? raw.IdCliente,
    nombreCliente: raw.nombreCliente ?? raw.NombreCliente ?? "",
    apellidoCliente: raw.apellidoCliente ?? raw.ApellidoCliente ?? "",
    telefonoCliente: raw.telefonoCliente ?? raw.TelefonoCliente ?? "",
    celularCliente: raw.celularCliente ?? raw.CelularCliente ?? "",
    correoCliente: raw.correoCliente ?? raw.CorreoCliente ?? "",
    direccionCliente: raw.direccionCliente ?? raw.DireccionCliente ?? "",
    cedulaCliente: raw.cedulaCliente ?? raw.CedulaCliente ?? "",
    numeroRuc: String(raw.numeroRuc ?? raw.NumeroRuc ?? "").trim(),
    nombreContacto: raw.nombreContacto ?? raw.NombreContacto ?? null,
    firmaCliente: raw.firmaCliente ?? raw.FirmaCliente ?? "",
    fechaCreacionCliente: raw.fechaCreacionCliente ?? raw.FechaCreacionCliente ?? null,
    idUsuario: raw.idUsuario ?? raw.IdUsuario ?? null,
    departamento,
    municipio,
    tiposCliente: tipo,
    nombreTipoCliente: tipo,
    nombreDepartamento: departamento,
    nombreMunicipio: municipio,
    activo: resolveActivo(raw),
  };
}

/**
 * Cédula o RUC para tablas: si hay `cedulaCliente` se muestra; si no, `numeroRuc`.
 * @param {object} c
 */
export function identificacionCliente(c) {
  if (!c) return "—";
  const cedula = String(c.cedulaCliente ?? "").trim();
  if (cedula) return cedula;
  const ruc = String(c.numeroRuc ?? "").trim();
  return ruc || "—";
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
  return normalizeListResponse(res).map(normalizeClienteFromApi);
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
