/**
 * Convierte el draft del wizard (pasos 1-3) al body de create-PlanMuestreo.
 */

function timeOrDefault(value, fallback = "08:00:00") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.length === 5 ? `${text}:00` : text;
}

function dateOrToday(value) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** puntual / compuesto → id de catálogo si el usuario no eligió uno. */
export function idTipoMuestreoFromDraft(paso2) {
  const fromForm = Number(paso2?.idTipoMuestreo);
  if (fromForm > 0) return fromForm;
  if (paso2?.tipoMuestreo === "compuesto") return 2;
  return 1;
}

export function notaTipoMuestreo(paso2) {
  if (paso2?.tipoMuestreo === "puntual") {
    return paso2.horaPuntual
      ? `Muestreo puntual a las ${paso2.horaPuntual}`
      : "Muestreo puntual";
  }
  const horas = (paso2?.compuestoHoras ?? []).filter((h) => h !== "Otro");
  const partes = [...horas];
  if (paso2?.compuestoOtroTiempo) partes.push(`Otro: ${paso2.compuestoOtroTiempo}`);
  return partes.length
    ? `Muestreo compuesto (${partes.join(", ")})`
    : "Muestreo compuesto";
}

export function formToPlanMuestreoPayload(draft, { idUsuario } = {}) {
  const p1 = draft.paso1 ?? {};
  const p2 = draft.paso2 ?? {};
  const p3 = draft.paso3 ?? {};
  const nota = notaTipoMuestreo(p2);
  const obs = String(p3.observacionesMuestreo ?? "").trim();

  return {
    codReferencia: p1.codigoReferencia || "SIN-REF",
    contactoCoordinacion: p1.personaContacto || p1.atencionA || "",
    celularContacto: p1.telefonoContacto || p1.telefono || "",
    horaSalida: timeOrDefault(p1.horaSalida),
    horaRegreso: timeOrDefault(p1.horaRegreso, "17:00:00"),
    coordinador: p2.coordinador || "",
    reemplazoCoordinador: p2.reemplazoCoordinador || "",
    observaciones: obs ? `${nota}. ${obs}` : nota,
    observacionCoordinador: p3.observacionesCoordinador || null,
    usuarioElaboracion: p3.elaboraNombreFirma || "",
    fechaElaboracion: dateOrToday(p3.elaboraFecha),
    horaElaboracion: timeOrDefault(p3.elaboraHora),
    clienteFinalizacion: p3.usuarioNombreFirma || "",
    fechaFinalizacion: dateOrToday(p3.usuarioFecha),
    horaFinalizacion: timeOrDefault(p3.usuarioHora),
    usuarioEntrega: p3.entregaNombreFirma || "",
    fechaEntrega: dateOrToday(p3.entregaFecha),
    horaEntrega: timeOrDefault(p3.entregaHora),
    numeroProforma: p1.proformaNo || null,
    idProforma: Number(p1.idProforma) || null,
    idUsuario: Number(idUsuario) || null,
    idTipoMuestreo: idTipoMuestreoFromDraft(p2),
    idMuestra: Number(p1.idMuestra) || 0,
  };
}
