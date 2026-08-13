const STORAGE_KEY = "plan_muestreo_draft_v1";

export function getEmptyDraft() {
  return {
    idFormatoMuestreo: null,
    paso1: {
      codigoReferencia: "",
      usuarioProyecto: "",
      proformaNo: "",
      idProforma: "",
      idMuestra: "",
      direccionUsuario: "",
      atencionA: "",
      telefono: "",
      personaContacto: "",
      telefonoContacto: "",
      direccionSitio: "",
      fechaMuestreo: "",
      horaSalida: "",
      horaRegreso: "",
    },
    paso2: {
      tipoMuestreo: "puntual", // puntual | compuesto
      horaPuntual: "",
      compuestoHoras: [],
      compuestoOtroTiempo: "",
      coordinador: "",
      reemplazoCoordinador: "",
      detalle: [
        {
          lugarMuestreo: "",
          identificacionMuestra: "",
          coordenadas: "",
          matriz: "",
          fuente: "",
          ensayosSolicitados: "",
          idsEnsayos: [],
          tipoEnvaseVolumen: "",
          preservantes: "",
        },
      ],
    },
    paso3: {
      observacionesMuestreo: "",
      observacionesCoordinador: "",
      elaboraNombreFirma: "",
      elaboraFecha: "",
      elaboraHora: "",
      usuarioNombreFirma: "",
      usuarioFecha: "",
      usuarioHora: "",
      entregaNombreFirma: "",
      entregaFecha: "",
      entregaHora: "",
    },
  };
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyDraft();
    const parsed = JSON.parse(raw);
    if (!parsed) return getEmptyDraft();
    const empty = getEmptyDraft();
    const paso2 = { ...empty.paso2, ...(parsed.paso2 ?? {}) };
    if (paso2.tipoMuestreo === "otros") {
      paso2.tipoMuestreo = "compuesto";
    }
    return {
      ...empty,
      ...parsed,
      idFormatoMuestreo: parsed.idFormatoMuestreo ?? null,
      paso1: { ...empty.paso1, ...(parsed.paso1 ?? {}) },
      paso2,
      paso3: { ...empty.paso3, ...(parsed.paso3 ?? {}) },
    };
  } catch {
    return getEmptyDraft();
  }
}

export function saveDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

