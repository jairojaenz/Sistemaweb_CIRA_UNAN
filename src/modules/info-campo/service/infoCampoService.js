/**
 * Service: Información de campo
 * API: /api/FormatosCampoMuestra
 */
import { apiDelete, apiGet, apiPost, apiPut } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";

const API_BASE = "/api/FormatosCampoMuestra";

export const INSTRUCTIVOS = ["INO-TM-APE-01", "INO-TM-APE-02", "INO-TM-APE-03", "INO-TM-APE-04"];
export const PROCEDIMIENTOS = ["PROC-01", "PROC-02", "PROC-03", "PROC-04"];

function trimOrNull(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function dateFromApi(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
}

function timeFromApi(value) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 5) : "";
}

function timeOrNull(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.length === 5 ? `${text}:00` : text;
}

function dateOrNull(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function idOrEmpty(value) {
  const n = Number(value);
  return n > 0 ? String(n) : "";
}

function parseCompuestoHoras(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return { compuestoHoras: "", compuestoHorasOpcion: "", compuestoHorasOtro: "" };
  }
  const legacy = text.match(/^(8|12|16|24)-horas$/i);
  if (legacy) {
    return { compuestoHoras: legacy[1], compuestoHorasOpcion: "horas", compuestoHorasOtro: "" };
  }
  if (/^\d+([.,]\d+)?(\s*-?\s*h(oras?)?)?$/i.test(text)) {
    const num = text.match(/\d+([.,]\d+)?/);
    return {
      compuestoHoras: num ? num[0].replace(",", ".") : "",
      compuestoHorasOpcion: "horas",
      compuestoHorasOtro: "",
    };
  }
  return { compuestoHoras: "", compuestoHorasOpcion: "otros", compuestoHorasOtro: text };
}

function verificacionParaApi(form) {
  const nombre = String(form.verificacionNombre ?? "").trim();
  const fecha = String(form.verificacionFecha ?? "").trim();
  if (nombre && fecha) return `${nombre} | ${fecha}`;
  return nombre || fecha || null;
}

function parseVerificacion(value) {
  const text = String(value ?? "").trim();
  if (!text) return { verificacionNombre: "", verificacionFecha: "" };
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    const nombre = text
      .replace(iso[0], "")
      .replace(/[\s|—–-]+$/g, "")
      .replace(/^[\s|—–-]+/, "")
      .trim();
    return { verificacionNombre: nombre, verificacionFecha: iso[1] };
  }
  return { verificacionNombre: text, verificacionFecha: "" };
}

function compuestoHorasParaApi(form) {
  if (form.compuestoHorasOpcion === "otros") return trimOrNull(form.compuestoHorasOtro);
  const horas = String(form.compuestoHoras ?? "").trim();
  return horas ? `${horas} horas` : null;
}

function splitCatalogOrOtro(value, catalogo) {
  const text = String(value ?? "").trim();
  if (!text) return { selected: "", otro: "" };
  if (catalogo.includes(text)) return { selected: text, otro: "" };
  return { selected: "otro", otro: text };
}

function normalizeParametros(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    temperatura: raw.temperatura ?? raw.Temperatura ?? "",
    cloroResidual: raw.cloroResidual ?? raw.CloroResidual ?? "",
    ph: raw.ph ?? raw.Ph ?? "",
    salinidad: raw.salinidad ?? raw.Salinidad ?? "",
    conductividadElectrica: raw.conductividadElectrica ?? raw.ConductividadElectrica ?? "",
    oxigenoDisuelto: raw.oxigenoDisuelto ?? raw.OxigenoDisuelto ?? "",
    potencialRedox: raw.potencialRedox ?? raw.PotencialRedox ?? "",
    saturacionOxigeno: raw.saturacionOxigeno ?? raw.SaturacionOxigeno ?? "",
  };
}

export function normalizeCampoFromApi(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const parametros = raw.parametros ?? raw.Parametros ?? null;
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
    lugar: raw.lugar ?? raw.Lugar ?? "",
    idDepartamento: raw.idDepartamento ?? raw.IdDepartamento,
    departamento: raw.departamento ?? raw.Departamento ?? "",
    idMunicipio: raw.idMunicipio ?? raw.IdMunicipio,
    municipio: raw.municipio ?? raw.Municipio ?? "",
    elevacion: raw.elevacion ?? raw.Elevacion ?? "",
    coordenadasN: raw.coordenadasN ?? raw.CoordenadasN ?? "",
    coordenadasE: raw.coordenadasE ?? raw.CoordenadasE ?? "",
    fechaMuestreo: dateFromApi(raw.fechaMuestreo ?? raw.FechaMuestreo),
    horaMuestreo: timeFromApi(raw.horaMuestreo ?? raw.HoraMuestreo),
    horasCompuesto: raw.horasCompuesto ?? raw.HorasCompuesto ?? "",
    quienTomaMuestra: raw.quienTomaMuestra ?? raw.QuienTomaMuestra ?? "",
    instructivoCliente: raw.instructivoCliente ?? raw.InstructivoCliente ?? "",
    procedimientoCira: raw.procedimientoCira ?? raw.ProcedimientoCira ?? "",
    verificacionFecha: raw.verificacionFecha ?? raw.VerificacionFecha ?? "",
    inicialesAnalista: raw.inicialesAnalista ?? raw.InicialesAnalista ?? "",
    codigoMuestra: raw.codigoMuestra ?? raw.CodigoMuestra ?? "",
    fechaCreacion: raw.fechaCreacion ?? raw.FechaCreacion ?? "",
    parametros: normalizeParametros(parametros),
    idsEquipos: (raw.idsEquipos ?? raw.IdsEquipos ?? []).map(Number).filter((id) => id > 0),
    nombresEquipos: (raw.nombresEquipos ?? raw.NombresEquipos ?? []).filter(Boolean),
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

/** Prefill del wizard desde GET by id. */
export function campoToForm(c) {
  const p = c.parametros ?? {};
  const instructivo = splitCatalogOrOtro(c.instructivoCliente, INSTRUCTIVOS);
  const procedimiento = splitCatalogOrOtro(c.procedimientoCira, PROCEDIMIENTOS);
  const compuesto = parseCompuestoHoras(c.horasCompuesto);
  return {
    usuario: c.usuario ?? "",
    identificacion: c.identificacionMuestra ?? "",
    lugar: c.lugar ?? "",
    comunidad: c.comunidad ?? "",
    idDepartamento: idOrEmpty(c.idDepartamento),
    idMunicipio: idOrEmpty(c.idMunicipio),
    departamento: c.departamento ?? "",
    municipio: c.municipio ?? "",
    elevacion: c.elevacion ?? "",
    coordenadasN: c.coordenadasN ?? "",
    coordenadasE: c.coordenadasE ?? "",
    fecha: c.fechaMuestreo ?? "",
    hora: c.horaMuestreo ?? "",
    ensayos: (c.ensayos ?? [])
      .filter((e) => Number(e.idAnalisis) > 0)
      .map((e) => ({
        idAnalisis: e.idAnalisis,
        tipoAnalisis: e.nombreAnalisis ?? "",
        tecnica: "",
      })),
    idProforma: idOrEmpty(c.idProforma),
    idMuestra: idOrEmpty(c.idMuestra),
    idMatriz: idOrEmpty(c.idMatriz),
    idFuente: idOrEmpty(c.idFuente),
    idTipoMuestreo: idOrEmpty(c.idTipoMuestreo),
    idsEquipos: (c.idsEquipos ?? []).map(Number).filter((id) => id > 0),
    temperatura: p.temperatura ?? p.Temperatura ?? "",
    cloroResidual: p.cloroResidual ?? p.CloroResidual ?? "",
    ph: p.ph ?? p.Ph ?? "",
    salinidad: p.salinidad ?? p.Salinidad ?? "",
    conductividad: p.conductividadElectrica ?? p.ConductividadElectrica ?? "",
    oxigenoDisuelto: p.oxigenoDisuelto ?? p.OxigenoDisuelto ?? "",
    potencialRedox: p.potencialRedox ?? p.PotencialRedox ?? "",
    satOxigeno: p.saturacionOxigeno ?? p.SaturacionOxigeno ?? "",
    compuestoHoras: compuesto.compuestoHoras,
    compuestoHorasOpcion: compuesto.compuestoHorasOpcion,
    compuestoHorasOtro: compuesto.compuestoHorasOtro,
    quienTomaMuestra: c.quienTomaMuestra ?? "",
    instructivoCliente: instructivo.selected,
    instructivoClienteOtro: instructivo.otro,
    procedimientoCIRA: procedimiento.selected,
    procedimientoCIRAOtro: procedimiento.otro,
    observaciones: c.observacion ?? "",
    muestraCapturadaPor: c.muestraCaptada ?? "",
    ...parseVerificacion(c.verificacionFecha),
    inicialesAnalista: c.inicialesAnalista ?? "",
    codigoMuestra: c.codigoMuestra ?? "",
  };
}

/**
 * Mapea el wizard InfoCampoPage al Create/UpdateCampoMuestraRequestDto.
 */
export function formToCampoPayload(form, { idUsuario } = {}) {
  const instructivo =
    form.instructivoCliente === "otro"
      ? trimOrNull(form.instructivoClienteOtro)
      : trimOrNull(form.instructivoCliente);
  const procedimiento =
    form.procedimientoCIRA === "otro"
      ? trimOrNull(form.procedimientoCIRAOtro)
      : trimOrNull(form.procedimientoCIRA);

  return {
    comunidad: trimOrNull(form.comunidad),
    observacion: trimOrNull(form.observaciones),
    muestraCaptada: form.muestraCapturadaPor || form.identificacion || "",
    estado: "Pendiente",
    idProforma: Number(form.idProforma) || 0,
    idMuestra: Number(form.idMuestra) || 0,
    idUsuario: Number(idUsuario || form.idUsuario) || 0,
    idTipoMuestreo: Number(form.idTipoMuestreo) || 0,
    idMatriz: Number(form.idMatriz) || 0,
    idFuente: Number(form.idFuente) || 0,
    lugar: trimOrNull(form.lugar),
    idDepartamento: Number(form.idDepartamento) || null,
    idMunicipio: Number(form.idMunicipio) || null,
    elevacion: trimOrNull(form.elevacion),
    coordenadasN: trimOrNull(form.coordenadasN),
    coordenadasE: trimOrNull(form.coordenadasE),
    fechaMuestreo: dateOrNull(form.fecha),
    horaMuestreo: timeOrNull(form.hora),
    horasCompuesto: compuestoHorasParaApi(form),
    quienTomaMuestra: trimOrNull(form.quienTomaMuestra),
    instructivoCliente: instructivo,
    procedimientoCira: procedimiento,
    verificacionFecha: verificacionParaApi(form),
    inicialesAnalista: trimOrNull(form.inicialesAnalista),
    codigoMuestra: trimOrNull(form.codigoMuestra),
    parametros: {
      temperatura: trimOrNull(form.temperatura),
      cloroResidual: trimOrNull(form.cloroResidual),
      ph: trimOrNull(form.ph),
      salinidad: trimOrNull(form.salinidad),
      conductividadElectrica: trimOrNull(form.conductividad),
      oxigenoDisuelto: trimOrNull(form.oxigenoDisuelto),
      potencialRedox: trimOrNull(form.potencialRedox),
      saturacionOxigeno: trimOrNull(form.satOxigeno),
    },
    idsEquipos: (form.idsEquipos ?? []).map(Number).filter((id) => id > 0),
    idsAnalisis: (form.ensayos ?? [])
      .map((e) => Number(e.idAnalisis))
      .filter((id) => id > 0),
  };
}
