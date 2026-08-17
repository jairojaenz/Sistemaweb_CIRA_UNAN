const PREFIX = "info_campo_draft_v1";

export function getEmptyForm() {
  return {
    usuario: "",
    identificacion: "",
    lugar: "",
    comunidad: "",
    departamento: "",
    municipio: "",
    elevacion: "",
    coordenadasN: "",
    coordenadasE: "",
    fecha: "",
    hora: "",
    ensayos: [],
    ensayoTipoTemp: "",
    ensayoTecnicaTemp: "",
    ensayoIdTemp: "",
    temperatura: "",
    ph: "",
    conductividad: "",
    potencialRedox: "",
    cloroResidual: "",
    salinidad: "",
    oxigenoDisuelto: "",
    satOxigeno: "",
    compuestoHoras: "",
    compuestoHorasOpcion: "",
    compuestoHorasOtro: "",
    quienTomaMuestra: "",
    instructivoCliente: "",
    instructivoClienteOtro: "",
    procedimientoCIRA: "",
    procedimientoCIRAOtro: "",
    observaciones: "",
    muestraCapturadaPor: "",
    verificacionNombre: "",
    verificacionFecha: "",
    inicialesAnalista: "",
    codigoMuestra: "",
    idProforma: "",
    idMuestra: "",
    idMatriz: "",
    idFuente: "",
    idTipoMuestreo: "",
    idDepartamento: "",
    idMunicipio: "",
    idsEquipos: [],
  };
}

export function draftKey(idCampo) {
  const id = Number(idCampo);
  return Number.isFinite(id) && id > 0 ? `${PREFIX}:edit:${id}` : `${PREFIX}:nuevo`;
}

export function loadDraft(idCampo) {
  try {
    const raw = localStorage.getItem(draftKey(idCampo));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const formSource = parsed.form && typeof parsed.form === "object" ? parsed.form : parsed;
    const step = Number(parsed.step);
    return {
      form: { ...getEmptyForm(), ...formSource },
      step: step >= 1 && step <= 3 ? step : 1,
      coordsInput: String(parsed.coordsInput ?? ""),
    };
  } catch {
    return null;
  }
}

export function saveDraft(idCampo, { form, step, coordsInput }) {
  try {
    localStorage.setItem(
      draftKey(idCampo),
      JSON.stringify({
        form,
        step,
        coordsInput: coordsInput ?? "",
        savedAt: Date.now(),
      }),
    );
  } catch {
    // localStorage lleno o modo privado
  }
}

export function clearDraft(idCampo) {
  try {
    localStorage.removeItem(draftKey(idCampo));
  } catch {
    // ignore
  }
}
