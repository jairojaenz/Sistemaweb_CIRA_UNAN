export const PLAN_STEP_LABELS = ["Identificación", "Detalle del muestreo", "Cierre y firmas"];

function trim(value) {
  return String(value ?? "").trim();
}

function issue({ step, field, label, tipo, detalle, formato }) {
  return {
    step,
    stepLabel: `Paso ${step} — ${PLAN_STEP_LABELS[step - 1]}`,
    field,
    label,
    tipo,
    detalle,
    formato,
  };
}

function mismosCoordinadores(paso2) {
  const coordinador = trim(paso2?.coordinador).toLowerCase();
  const reemplazo = trim(paso2?.reemplazoCoordinador).toLowerCase();
  return Boolean(coordinador && reemplazo && coordinador === reemplazo);
}

/**
 * @param {object} draft
 * @param {{ steps?: number[] }} [options]
 */
export function collectPlanIssues(draft, { steps = [1, 2, 3] } = {}) {
  const issues = [];
  const include = (step) => steps.includes(step);
  const p1 = draft?.paso1 ?? {};
  const p2 = draft?.paso2 ?? {};
  const p3 = draft?.paso3 ?? {};

  if (include(1)) {
    if (!trim(p1.usuarioProyecto)) {
      issues.push(
        issue({
          step: 1,
          field: "usuarioProyecto",
          label: "Usuario / Proyecto",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba el nombre del usuario o proyecto.",
        }),
      );
    }
    if (!trim(p1.idProforma) && !trim(p1.proformaNo)) {
      issues.push(
        issue({
          step: 1,
          field: "idProforma",
          label: "Proforma N°",
          tipo: "vacio",
          detalle: "Debe asociar una proforma al plan.",
          formato: "Seleccione una proforma en la lista.",
        }),
      );
    }
    if (!trim(p1.direccionUsuario)) {
      issues.push(
        issue({
          step: 1,
          field: "direccionUsuario",
          label: "Dirección del usuario",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Indique la dirección del usuario o empresa.",
        }),
      );
    }
    if (!trim(p1.direccionSitio)) {
      issues.push(
        issue({
          step: 1,
          field: "direccionSitio",
          label: "Dirección del sitio a muestrear",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba la ubicación o sitios donde se tomará la muestra.",
        }),
      );
    }
    if (!trim(p1.fechaMuestreo)) {
      issues.push(
        issue({
          step: 1,
          field: "fechaMuestreo",
          label: "Fecha del muestreo",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Use el selector de fecha (AAAA-MM-DD).",
        }),
      );
    }
    if (!Number(p1.idMuestra)) {
      issues.push(
        issue({
          step: 1,
          field: "idMuestra",
          label: "Muestra",
          tipo: "vacio",
          detalle: "Debe vincular una muestra del catálogo.",
          formato: "Seleccione una muestra activa en la lista.",
        }),
      );
    }
  }

  if (include(2)) {
    if (p2.tipoMuestreo === "puntual" && !trim(p2.horaPuntual)) {
      issues.push(
        issue({
          step: 2,
          field: "horaPuntual",
          label: "Hora puntual",
          tipo: "vacio",
          detalle: "Eligió muestreo puntual y no indicó la hora.",
          formato: "Pulse Puntual e indique la hora en que se tomó la muestra.",
        }),
      );
    }
    if (p2.tipoMuestreo === "compuesto") {
      const horas = (p2.compuestoHoras ?? []).filter((h) => h && h !== "Otro");
      const otro = trim(p2.compuestoOtroTiempo);
      if (horas.length === 0 && !otro) {
        issues.push(
          issue({
            step: 2,
            field: "compuestoHoras",
            label: "Duración del muestreo compuesto",
            tipo: "vacio",
            detalle: "No hay una duración seleccionada.",
            formato: "Marque 8 h, 10 h, 12 h, 16 h, 24 h u Otro.",
          }),
        );
      }
    }
    if (!trim(p2.coordinador)) {
      issues.push(
        issue({
          step: 2,
          field: "coordinador",
          label: "Coordinador del muestreo",
          tipo: "vacio",
          detalle: "Debe seleccionar al coordinador.",
          formato: "Elija un usuario en la lista de coordinador.",
        }),
      );
    }
    if (!trim(p2.reemplazoCoordinador)) {
      issues.push(
        issue({
          step: 2,
          field: "reemplazoCoordinador",
          label: "Reemplazo del coordinador",
          tipo: "vacio",
          detalle: "Debe seleccionar un reemplazo.",
          formato: "Elija un usuario distinto al coordinador.",
        }),
      );
    } else if (mismosCoordinadores(p2)) {
      issues.push(
        issue({
          step: 2,
          field: "reemplazoCoordinador",
          label: "Reemplazo del coordinador",
          tipo: "formato",
          detalle: "El reemplazo no puede ser la misma persona que el coordinador.",
          formato: "Seleccione otro usuario como reemplazo.",
        }),
      );
    }

    const detalle = Array.isArray(p2.detalle) ? p2.detalle : [];
    if (detalle.length === 0) {
      issues.push(
        issue({
          step: 2,
          field: "detalle",
          label: "Puntos de muestreo",
          tipo: "vacio",
          detalle: "Debe agregar al menos un punto de muestreo.",
          formato: "Pulse Agregar punto y complete los datos.",
        }),
      );
    } else {
      detalle.forEach((row, idx) => {
        const n = idx + 1;
        if (!trim(row.lugarMuestreo)) {
          issues.push(
            issue({
              step: 2,
              field: `lugar-${idx}`,
              label: `Punto ${n} — Lugar de muestreo`,
              tipo: "vacio",
              detalle: "Este campo es obligatorio y está vacío.",
              formato: "Escriba el sitio o estación de este punto.",
            }),
          );
        }
        if (!trim(row.identificacionMuestra)) {
          issues.push(
            issue({
              step: 2,
              field: `identificacion-${idx}`,
              label: `Punto ${n} — Identificación de la muestra`,
              tipo: "vacio",
              detalle: "Este campo es obligatorio y está vacío.",
              formato: "Indique el código o nombre de la muestra.",
            }),
          );
        }
        if (!Number(row.idMatriz)) {
          issues.push(
            issue({
              step: 2,
              field: `matriz-${idx}`,
              label: `Punto ${n} — Matriz`,
              tipo: "vacio",
              detalle: "No ha seleccionado la matriz.",
              formato: "Elija una matriz del catálogo.",
            }),
          );
        }
        const ids = (row.idsEnsayos ?? []).filter((id) => Number(id) > 0);
        if (ids.length === 0) {
          issues.push(
            issue({
              step: 2,
              field: `ensayos-${idx}`,
              label: `Punto ${n} — Ensayos solicitados`,
              tipo: "vacio",
              detalle: "Debe elegir al menos un ensayo.",
              formato: "Abra el selector y marque uno o más análisis.",
            }),
          );
        }
      });
    }
  }

  if (include(3)) {
    if (!Number(p3.elaboraIdUsuario)) {
      issues.push(
        issue({
          step: 3,
          field: "elaboraIdUsuario",
          label: "Quien elabora el plan",
          tipo: "vacio",
          detalle: "Debe seleccionar al usuario que elabora el plan.",
          formato: "Elija un usuario en la firma 1.",
        }),
      );
    }
    if (!Number(p3.usuarioIdUsuario)) {
      issues.push(
        issue({
          step: 3,
          field: "usuarioIdUsuario",
          label: "Usuario o su representante",
          tipo: "vacio",
          detalle: "Debe seleccionar al usuario que recibe o valida el plan.",
          formato: "Elija un usuario en la firma 2.",
        }),
      );
    }
    if (!Number(p3.entregaIdUsuario)) {
      issues.push(
        issue({
          step: 3,
          field: "entregaIdUsuario",
          label: "Quien entrega el plan a APE",
          tipo: "vacio",
          detalle: "Debe seleccionar a quien entrega el plan.",
          formato: "Elija un usuario en la firma 3.",
        }),
      );
    }
  }

  return issues;
}

export function issuesToFormErrors(issues) {
  const errors = {};
  for (const item of issues) {
    if (item.field && !errors[item.field]) {
      errors[item.field] = item.detalle;
    }
  }
  return errors;
}
