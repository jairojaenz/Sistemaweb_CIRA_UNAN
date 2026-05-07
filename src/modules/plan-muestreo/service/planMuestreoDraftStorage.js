const STORAGE_KEY = "plan_muestreo_draft_v1";

export function getEmptyDraft() {
  return {
    paso1: {
      codigoReferencia: "",
      usuarioProyecto: "",
      proformaNo: "",
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
      tipoMuestreo: "puntual", // puntual | compuesto | otros
      compuestoHoras: [],
      otrosHoras: [],
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
    return parsed ?? getEmptyDraft();
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

