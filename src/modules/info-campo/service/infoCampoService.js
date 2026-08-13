/**
 * Service: Información de campo
 * API: /api/FormatosCampoMuestra
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosCampoMuestra";

export function normalizeCampoFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    idFormatoCampo: raw.idFormatoCampo ?? raw.IdFormatoCampo,
    comunidad: raw.comunidad ?? raw.Comunidad ?? "",
    observacion: raw.observacion ?? raw.Observacion ?? "",
    muestraCaptada: raw.muestraCaptada ?? raw.MuestraCaptada ?? "",
    estado: raw.estado ?? raw.Estado ?? "",
    idProforma: raw.idProforma ?? raw.IdProforma,
    numeroProforma: raw.numeroProforma ?? raw.NumeroProforma ?? "",
    idMuestra: raw.idMuestra ?? raw.IdMuestra,
    identificacionMuestra: raw.identificacionMuestra ?? raw.IdentificacionMuestra ?? "",
    idUsuario: raw.idUsuario ?? raw.IdUsuario,
    usuario: raw.usuario ?? raw.Usuario ?? "",
    idTipoMuestreo: raw.idTipoMuestreo ?? raw.IdTipoMuestreo,
    tipoMuestreo: raw.tipoMuestreo ?? raw.TipoMuestreo ?? "",
    idMatriz: raw.idMatriz ?? raw.IdMatriz,
    matriz: raw.matriz ?? raw.Matriz ?? "",
    idFuente: raw.idFuente ?? raw.IdFuente,
    fuente: raw.fuente ?? raw.Fuente ?? "",
    parametros: raw.parametros ?? raw.Parametros ?? null,
    idsEquipos: raw.idsEquipos ?? raw.IdsEquipos ?? [],
    idsMuestraxAnalisis: raw.idsMuestraxAnalisis ?? raw.IdsMuestraxAnalisis ?? [],
    idsAnalisis: raw.idsAnalisis ?? raw.IdsAnalisis ?? [],
    ensayos: (raw.ensayos ?? raw.Ensayos ?? []).map((e) => ({
      idMuestraxAnalisis: e.idMuestraxAnalisis ?? e.IdMuestraxAnalisis,
      idAnalisis: e.idAnalisis ?? e.IdAnalisis,
      nombreAnalisis: e.nombreAnalisis ?? e.NombreAnalisis ?? "",
    })),
  };
}

export async function getFormatosCampo() {
  const res = await apiGet(API_BASE);
  return asList(res).map(normalizeCampoFromApi);
}

export async function getFormatoCampoById(id) {
  return normalizeCampoFromApi(await apiGet(`${API_BASE}/${id}`));
}

export async function createInfoCampo(payload) {
  return apiPost(API_BASE, payload);
}

export async function updateInfoCampo(id, payload) {
  return apiPut(`${API_BASE}/${id}`, payload);
}

export async function deleteInfoCampo(id) {
  return apiDelete(`${API_BASE}/${id}`);
}

/**
 * Mapea el wizard InfoCampoPage al CreateCampoMuestraRequestDto.
 */
export function formToCampoPayload(form, { idUsuario } = {}) {
  return {
    comunidad: form.comunidad || null,
    observacion: form.observaciones || null,
    muestraCaptada: form.muestraCapturadaPor || form.identificacion || "",
    estado: "Pendiente",
    idProforma: Number(form.idProforma) || 0,
    idMuestra: Number(form.idMuestra) || 0,
    idUsuario: Number(idUsuario || form.idUsuario) || 0,
    idTipoMuestreo: Number(form.idTipoMuestreo) || 0,
    idMatriz: Number(form.idMatriz) || 0,
    idFuente: Number(form.idFuente) || 0,
    parametros: {
      temperatura: form.temperatura || null,
      cloroResidual: form.cloroResidual || null,
      ph: form.ph || null,
      salinidad: form.salinidad || null,
      conductividadElectrica: form.conductividad || null,
      oxigenoDisuelto: form.oxigenoDisuelto || null,
      potencialRedox: form.potencialRedox || null,
      saturacionOxigeno: form.satOxigeno || null,
    },
    idsEquipos: (form.idsEquipos ?? []).map(Number).filter((id) => id > 0),
    idsAnalisis: (form.ensayos ?? [])
      .map((e) => Number(e.idAnalisis))
      .filter((id) => id > 0),
  };
}
