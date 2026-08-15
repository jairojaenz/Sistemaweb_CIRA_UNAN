/**
 * Service: Formatos de ensayo y resultados
 * API: /api/FormatosEnsayo (ensayos, create-ensayo, update-ensayo, delete-ensayo).
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosEnsayo";

/** DateOnly / ISO → yyyy-MM-dd para <input type="date">. */
function fechaInput(value) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return "";
}

/** DateTime → yyyy-MM-ddTHH:mm para <input type="datetime-local">. */
function fechaHoraInput(value) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return text.slice(0, 16);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return `${text.slice(0, 10)}T00:00`;
  return "";
}

/** Normaliza la respuesta de la API al shape que usan listado y formulario. */
export function normalizeEnsayoFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idFormatoEnsayo: raw.idFormatoEnsayo ?? raw.IdFormatoEnsayo,
    datosCampo: !!(raw.datosCampo ?? raw.DatosCampo),
    fechaInicio: fechaInput(raw.fechaInicio ?? raw.FechaInicio),
    fechaFin: fechaInput(raw.fechaFin ?? raw.FechaFin),
    planMuestreo: raw.planMuestreo ?? raw.PlanMuestreo ?? "",
    condicionesAmbientales: raw.condicionesAmbientales ?? raw.CondicionesAmbientales ?? "",
    condicionesItem: raw.condicionesItem ?? raw.CondicionesItem ?? "",
    clave: raw.clave ?? raw.Clave ?? "",
    equivalencia: raw.equivalencia ?? raw.Equivalencia ?? "",
    observaciones: raw.observaciones ?? raw.Observaciones ?? "",
    usuarioElaboracion: raw.usuarioElaboracion ?? raw.UsuarioElaboracion ?? "",
    fechaElaboracion: fechaHoraInput(raw.fechaElaboracion ?? raw.FechaElaboracion),
    idLaboratorio: raw.idLaboratorio ?? raw.IdLaboratorio,
    nombreLaboratorio: raw.nombreLaboratorio ?? raw.NombreLaboratorio ?? "",
    idFormatoOrden: raw.idFormatoOrden ?? raw.IdFormatoOrden,
    numeroOrden: raw.numeroOrden ?? raw.NumeroOrden,
    resultados: (raw.resultados ?? raw.Resultados ?? []).map((r) => ({
      idResultadosFormatoEnsayo: r.idResultadosFormatoEnsayo ?? r.IdResultadosFormatoEnsayo,
      idMuestraxAnalisis: r.idMuestraxAnalisis ?? r.IdMuestraxAnalisis,
      idMuestra: r.idMuestra ?? r.IdMuestra,
      identificacionMuestra: r.identificacionMuestra ?? r.IdentificacionMuestra ?? "",
      idAnalisis: r.idAnalisis ?? r.IdAnalisis,
      nombreAnalisis: r.nombreAnalisis ?? r.NombreAnalisis ?? "",
      metodo: r.metodo ?? r.Metodo ?? "",
      limiteRangoCuantificacion: r.limiteRangoCuantificacion ?? r.LimiteRangoCuantificacion ?? "",
      resultado: r.resultado ?? r.Resultado ?? "",
      incertidumbre: r.incertidumbre ?? r.Incertidumbre ?? "",
      unidad: r.unidad ?? r.Unidad ?? "",
      meq: r.meq ?? r.Meq ?? "",
      valorMaximoAdmisible: r.valorMaximoAdmisible ?? r.ValorMaximoAdmisible ?? "",
    })),
  };
}

/**
 * Arma Create/UpdateEnsayoRequestDto.
 * Omite filas sin muestra+análisis para no disparar la validación del backend.
 */
export function formToEnsayoPayload(form) {
  const fechaElaboracion = form.fechaElaboracion
    ? new Date(form.fechaElaboracion).toISOString()
    : new Date().toISOString();
  return {
    datosCampo: !!form.datosCampo,
    fechaInicio: form.fechaInicio,
    fechaFin: form.fechaFin,
    planMuestreo: form.planMuestreo || "",
    condicionesAmbientales: form.condicionesAmbientales || "",
    condicionesItem: form.condicionesItem || "",
    clave: form.clave || null,
    equivalencia: form.equivalencia || null,
    observaciones: form.observaciones || null,
    usuarioElaboracion: form.usuarioElaboracion || "",
    fechaElaboracion,
    idLaboratorio: Number(form.idLaboratorio) || 0,
    idFormatoOrden: Number(form.idFormatoOrden) || 0,
    resultados: (form.resultados ?? [])
      .filter((r) => Number(r.idMuestraxAnalisis) > 0 || (Number(r.idMuestra) > 0 && Number(r.idAnalisis) > 0))
      .map((r) => ({
        idMuestraxAnalisis: Number(r.idMuestraxAnalisis) || null,
        idMuestra: Number(r.idMuestra) || null,
        idAnalisis: Number(r.idAnalisis) || null,
        metodo: r.metodo || null,
        limiteRangoCuantificacion: r.limiteRangoCuantificacion || null,
        resultado: r.resultado || null,
        incertidumbre: r.incertidumbre || null,
        unidad: r.unidad || null,
        meq: r.meq || null,
        valorMaximoAdmisible: r.valorMaximoAdmisible || null,
      })),
  };
}

export async function getEnsayos() {
  return asList(await apiGet(`${API_BASE}/ensayos`)).map(normalizeEnsayoFromApi);
}

export async function getEnsayoById(id) {
  return normalizeEnsayoFromApi(await apiGet(`${API_BASE}/ensayos/${id}`));
}

export async function createEnsayo(payload) {
  return apiPost(`${API_BASE}/create-ensayo`, payload);
}

export async function updateEnsayo(id, payload) {
  return apiPut(`${API_BASE}/update-ensayo/${id}`, payload);
}

export async function deleteEnsayo(id) {
  return apiDelete(`${API_BASE}/delete-ensayo/${id}`);
}
