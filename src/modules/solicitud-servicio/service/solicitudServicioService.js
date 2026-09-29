/**
 * Service: Solicitudes de servicio
 * API: /api/FormatosSolicitudServicio
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosSolicitudServicio";

function pick(raw, ...keys) {
  for (const key of keys) {
    if (raw?.[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
}

function normalizeMatriz(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    idMatriz: pick(raw, "idMatriz", "IdMatriz", "id", "Id"),
    nombreMatriz: pick(raw, "nombreMatriz", "NombreMatriz", "nombre", "Nombre") ?? "",
    numMuestras: Number(pick(raw, "numMuestras", "NumMuestras", "cantidad", "Cantidad") ?? 0),
  };
}

function normalizeDetalle(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    idAnalisis: pick(raw, "idAnalisis", "IdAnalisis"),
    idGrupoAnalisis: pick(raw, "idGrupoAnalisis", "IdGrupoAnalisis"),
    nombreAnalisis: pick(raw, "nombreAnalisis", "NombreAnalisis", "analisis", "Analisis") ?? "",
    abreviacionAnalisis: pick(raw, "abreviacionAnalisis", "AbreviacionAnalisis") ?? "",
    nombreTecnicaTexto: pick(raw, "nombreTecnicaTexto", "NombreTecnicaTexto") ?? "",
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 1),
    nombreLaboratorio: pick(raw, "nombreLaboratorio", "NombreLaboratorio") ?? "",
    precioAnalisis: pick(raw, "precioAnalisis", "PrecioAnalisis"),
  };
}

/** Unifica camelCase/PascalCase y alias viejos del listado. */
export function normalizeSolicitudFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const fechaRecepcion = pick(raw, "fechaRecepcion", "FechaRecepcion", "fechaRecepcionSolicitud", "FechaRecepcionSolicitud") ?? "";
  const servicios = asArray(pick(raw, "servicios", "Servicios", "servicio", "Servicio"));
  const idServicios = asArray(pick(raw, "idServicios", "IdServicios") ?? servicios)
    .map((item) => typeof item === "object" ? pick(item, "idServicio", "IdServicio", "id", "Id") : item)
    .map(Number)
    .filter((id) => Number.isFinite(id) && id > 0);
  const matrices = asArray(pick(raw, "matrices", "Matrices", "matricesSolicitud", "MatricesSolicitud"))
    .map(normalizeMatriz)
    .filter((item) => item && typeof item === "object");
  const detalles = asArray(pick(raw, "detalles", "Detalles", "detallesSolicitud", "DetallesSolicitud"))
    .map(normalizeDetalle)
    .filter((item) => item && typeof item === "object");
  return {
    ...raw,
    idFormatoSolicitud: pick(raw, "idFormatoSolicitud", "IdFormatoSolicitud"),
    numeroSolicitud: pick(raw, "numeroSolicitud", "NumeroSolicitud", "solicitudNo", "SolicitudNo") ?? "",
    fechaRecepcion,
    fechaRecepcionSolicitud: fechaRecepcion,
    idCliente: pick(raw, "idCliente", "IdCliente"),
    idUsuario: pick(raw, "idUsuario", "IdUsuario"),
    idMedioRecepcion: pick(raw, "idMedioRecepcion", "IdMedioRecepcion"),
    idServicios,
    cliente: pick(raw, "cliente", "Cliente", "nombreUsuario", "NombreUsuario") ?? "",
    correoCliente: pick(raw, "correoCliente", "CorreoCliente", "correo", "Correo") ?? "",
    usuario: pick(raw, "usuario", "Usuario") ?? "",
    estado: pick(raw, "estado", "Estado") ?? "",
    matriz: pick(raw, "matriz", "Matriz") ?? "",
    matrices,
    servicio: pick(raw, "servicio", "Servicio") ?? "",
    servicios,
    numMuestras: Number(pick(raw, "numMuestras", "NumMuestras", "totalMuestrasSolicitud", "TotalMuestrasSolicitud") ?? 0),
    direccionMuestreo: pick(raw, "direccionMuestreo", "DireccionMuestreo") ?? "",
    firmaSolicitud: pick(raw, "firmaSolicitud", "FirmaSolicitud") ?? "",
    recibidoPorSolicitud: pick(raw, "recibidoPorSolicitud", "RecibidoPorSolicitud") ?? "",
    observacion: pick(raw, "observacion", "Observacion", "observacionSolicitud", "ObservacionSolicitud") ?? "",
    observacionSolicitud: pick(raw, "observacion", "Observacion", "observacionSolicitud", "ObservacionSolicitud") ?? "",
    fechaEnvioProforma: pick(raw, "fechaEnvioProforma", "FechaEnvioProforma") ?? "",
    idContactoSolicitud: pick(raw, "idContactoSolicitud", "IdContactoSolicitud"),
    num1ContactoSolicitud: pick(raw, "num1ContactoSolicitud", "Num1ContactoSolicitud", "contacto1Telefono", "Contacto1Telefono") ?? "",
    num2ContactoSolicitud: pick(raw, "num2ContactoSolicitud", "Num2ContactoSolicitud", "contacto2Telefono", "Contacto2Telefono") ?? "",
    nombreContactoSolicitud: pick(raw, "nombreContactoSolicitud", "NombreContactoSolicitud", "contacto1Nombre", "Contacto1Nombre") ?? "",
    nombreContacto2Solicitud: pick(raw, "nombreContacto2Solicitud", "NombreContacto2Solicitud", "contacto2Nombre", "Contacto2Nombre") ?? "",
    direccionCliente: pick(raw, "direccionCliente", "DireccionCliente", "direccionUsuario", "DireccionUsuario") ?? "",
    numeroRuc: pick(raw, "numeroRuc", "NumeroRuc", "ruc", "Ruc") ?? "",
    cedulaCliente: pick(raw, "cedulaCliente", "CedulaCliente", "cedula", "Cedula") ?? "",
    detalles,
  };
}

export async function getSolicitudes() {
  const res = await apiGet(API_BASE);
  return asList(res).map(normalizeSolicitudFromApi);
}

export async function getSolicitudById(id) {
  return normalizeSolicitudFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createSolicitudServicio(payload) {
  return apiPost(`${API_BASE}/create-solicitud`, payload);
}

export async function updateSolicitudServicio(id, payload) {
  return apiPut(`${API_BASE}/update-solicitud/${id}`, payload);
}

export async function deleteSolicitudServicio(id) {
  return apiDelete(`${API_BASE}/delete-solicitud/${id}`);
}
