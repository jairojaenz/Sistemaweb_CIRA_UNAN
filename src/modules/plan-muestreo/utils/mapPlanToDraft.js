import { getEmptyDraft } from "../service/planMuestreoDraftStorage.js";

function timeToInput(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length >= 5 ? text.slice(0, 5) : text;
}

function dateToInput(value) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return "";
}

/**
 * Convierte GET plan/{id} al draft del wizard para editar.
 */
export function mapPlanToDraft(plan) {
  const empty = getEmptyDraft();
  const ensayos = plan.ensayos ?? [];
  const idsEnsayos = (plan.idsAnalisis ?? ensayos.map((e) => e.idAnalisis)).filter((id) => Number(id) > 0);
  const nombres = ensayos.map((e) => e.nombreAnalisis).filter(Boolean);
  const tipoEnvase = ensayos.find((e) => e.tipoEnvaseMuestra)?.tipoEnvaseMuestra ?? "";
  const tipoNombre = String(plan.tiposMuestreo ?? "").toLowerCase();
  const tipoMuestreo = tipoNombre.includes("compuesto") ? "compuesto" : "puntual";

  return {
    ...empty,
    idFormatoMuestreo: plan.idFormatoMuestreo,
    paso1: {
      ...empty.paso1,
      codigoReferencia: plan.codReferencia ?? "",
      usuarioProyecto: plan.usuarioProyecto ?? "",
      proformaNo: plan.formatosProforma ?? "",
      idProforma: plan.idProforma ? String(plan.idProforma) : "",
      idMuestra: plan.idMuestra ? String(plan.idMuestra) : "",
      direccionUsuario: plan.direccionUsuario ?? "",
      atencionA: plan.atencionA ?? "",
      telefono: plan.telefono ?? "",
      personaContacto: plan.contactoCoordinacion ?? "",
      telefonoContacto: plan.celularContacto ?? "",
      direccionSitio: plan.direccionSitio ?? "",
      fechaMuestreo: dateToInput(plan.fechaMuestreo),
      horaSalida: timeToInput(plan.horaSalida),
      horaRegreso: timeToInput(plan.horaRegreso),
    },
    paso2: {
      ...empty.paso2,
      tipoMuestreo,
      horaPuntual: timeToInput(plan.horaPuntual),
      compuestoHoras: [
        ...String(plan.horasCompuesto ?? "")
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        ...(plan.otroTiempoCompuesto ? ["Otro"] : []),
      ],
      compuestoOtroTiempo: plan.otroTiempoCompuesto ?? "",
      coordinador: plan.coordinador ?? "",
      reemplazoCoordinador: plan.reemplazoCoordinador ?? "",
      idTipoMuestreo: plan.idTipoMuestreo || "",
      detalle: (plan.puntos ?? []).length
        ? plan.puntos.map((p) => ({
            ...empty.paso2.detalle[0],
            lugarMuestreo: p.lugarMuestreo ?? "",
            identificacionMuestra: p.identificacionMuestra ?? "",
            coordenadas: p.coordenadas ?? "",
            idMatriz: p.idMatriz ? String(p.idMatriz) : "",
            matriz: p.matriz ?? "",
            idFuente: p.idFuente ? String(p.idFuente) : "",
            fuente: p.fuente ?? "",
            tipoEnvaseVolumen: p.tipoEnvaseVolumen ?? "",
            idPreservante: p.idPreservante ? String(p.idPreservante) : "",
            preservantes: p.preservantes ?? "",
            idsEnsayos: (p.idsAnalisis ?? []).map(String),
            ensayosSolicitados: (p.nombresAnalisis ?? []).join(", "),
          }))
        : [
            {
              ...empty.paso2.detalle[0],
              identificacionMuestra: plan.muestra ?? "",
              idsEnsayos,
              ensayosSolicitados: nombres.join(", "),
              tipoEnvaseVolumen: tipoEnvase,
            },
          ],
    },
    paso3: {
      ...empty.paso3,
      observacionesMuestreo: plan.observaciones ?? "",
      observacionesCoordinador: plan.observacionCoordinador ?? "",
      elaboraIdUsuario: plan.idUsuarioElaboracion ? String(plan.idUsuarioElaboracion) : "",
      elaboraNombreFirma: plan.usuarioElaboracion ?? "",
      elaboraFecha: dateToInput(plan.fechaElaboracion),
      elaboraHora: timeToInput(plan.horaElaboracion),
      usuarioIdUsuario: plan.idUsuarioFinalizacion ? String(plan.idUsuarioFinalizacion) : "",
      usuarioNombreFirma: plan.clienteFinalizacion ?? "",
      usuarioFecha: dateToInput(plan.fechaFinalizacion),
      usuarioHora: timeToInput(plan.horaFinalizacion),
      entregaIdUsuario: plan.idUsuarioEntrega ? String(plan.idUsuarioEntrega) : "",
      entregaNombreFirma: plan.usuarioEntrega ?? "",
      entregaFecha: dateToInput(plan.fechaEntrega),
      entregaHora: timeToInput(plan.horaEntrega),
    },
  };
}
