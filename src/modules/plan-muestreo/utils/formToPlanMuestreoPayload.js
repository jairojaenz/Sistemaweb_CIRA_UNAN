/**
 * Convierte el draft del wizard (pasos 1-3) al body de create/update PlanMuestreo.
 */

function timeOrDefault(value, fallback = "08:00:00") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.length === 5 ? `${text}:00` : text;
}

function timeOrNull(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
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

function dateOrNull(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function trimOrNull(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

/** puntual / compuesto → id de catálogo si el usuario no eligió uno. */
export function idTipoMuestreoFromDraft(paso2) {
  const fromForm = Number(paso2?.idTipoMuestreo);
  if (fromForm > 0) return fromForm;
  if (paso2?.tipoMuestreo === "compuesto") return 2;
  return 1;
}

export function formToPlanMuestreoPayload(draft, { idUsuario } = {}) {
  const p1 = draft.paso1 ?? {};
  const p2 = draft.paso2 ?? {};
  const p3 = draft.paso3 ?? {};
  const detalle = Array.isArray(p2.detalle) ? p2.detalle : [];
  const puntos = detalle.map((row) => ({
    lugarMuestreo: trimOrNull(row.lugarMuestreo),
    identificacionMuestra: trimOrNull(row.identificacionMuestra),
    coordenadas: trimOrNull(row.coordenadas),
    idMatriz: Number(row.idMatriz) || null,
    matriz: trimOrNull(row.matriz),
    idFuente: Number(row.idFuente) || null,
    fuente: trimOrNull(row.fuente),
    tipoEnvaseVolumen: trimOrNull(row.tipoEnvaseVolumen),
    idPreservante: Number(row.idPreservante) || null,
    preservantes: trimOrNull(row.preservantes),
    idsAnalisis: (row.idsEnsayos ?? []).map(Number).filter((id) => id > 0),
  }));
  const idsAnalisis = puntos.flatMap((p) => p.idsAnalisis);
  const tipoEnvase = puntos.map((p) => p.tipoEnvaseVolumen).find(Boolean) || null;
  const horasCompuesto = (p2.compuestoHoras ?? []).filter((h) => h && h !== "Otro");

  return {
    codReferencia: p1.codigoReferencia || "SIN-REF",
    usuarioProyecto: trimOrNull(p1.usuarioProyecto),
    direccionUsuario: trimOrNull(p1.direccionUsuario),
    atencionA: trimOrNull(p1.atencionA),
    telefono: trimOrNull(p1.telefono),
    direccionSitio: trimOrNull(p1.direccionSitio),
    fechaMuestreo: dateOrNull(p1.fechaMuestreo),
    contactoCoordinacion: p1.personaContacto || p1.atencionA || "",
    celularContacto: p1.telefonoContacto || p1.telefono || "",
    horaSalida: timeOrDefault(p1.horaSalida),
    horaRegreso: timeOrDefault(p1.horaRegreso, "17:00:00"),
    coordinador: p2.coordinador || "",
    reemplazoCoordinador: p2.reemplazoCoordinador || "",
    horaPuntual: p2.tipoMuestreo === "puntual" ? timeOrNull(p2.horaPuntual) : null,
    horasCompuesto: horasCompuesto.length ? horasCompuesto.join(", ") : null,
    otroTiempoCompuesto: trimOrNull(p2.compuestoOtroTiempo),
    observaciones: trimOrNull(p3.observacionesMuestreo),
    observacionCoordinador: trimOrNull(p3.observacionesCoordinador),
    usuarioElaboracion: p3.elaboraNombreFirma || "",
    idUsuarioElaboracion: Number(p3.elaboraIdUsuario) || null,
    fechaElaboracion: dateOrToday(p3.elaboraFecha),
    horaElaboracion: timeOrDefault(p3.elaboraHora),
    clienteFinalizacion: p3.usuarioNombreFirma || "",
    idUsuarioFinalizacion: Number(p3.usuarioIdUsuario) || null,
    fechaFinalizacion: dateOrToday(p3.usuarioFecha),
    horaFinalizacion: timeOrDefault(p3.usuarioHora),
    usuarioEntrega: p3.entregaNombreFirma || "",
    idUsuarioEntrega: Number(p3.entregaIdUsuario) || null,
    fechaEntrega: dateOrToday(p3.entregaFecha),
    horaEntrega: timeOrDefault(p3.entregaHora),
    numeroProforma: p1.proformaNo || null,
    idProforma: Number(p1.idProforma) || null,
    idUsuario: Number(idUsuario) || null,
    idTipoMuestreo: idTipoMuestreoFromDraft(p2),
    idMuestra: Number(p1.idMuestra) || 0,
    idsAnalisis,
    tipoEnvaseMuestra: tipoEnvase,
    puntos,
  };
}
