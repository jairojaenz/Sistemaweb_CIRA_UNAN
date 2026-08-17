export const ENSAYO_SECTION_LABELS = ["Identificación", "Periodo y condiciones", "Resultados"];

function trim(value) {
  return String(value ?? "").trim();
}

function issue({ step, field, label, tipo, detalle, formato }) {
  return {
    step,
    stepLabel: `Paso ${step} — ${ENSAYO_SECTION_LABELS[step - 1]}`,
    field,
    label,
    tipo,
    detalle,
    formato,
  };
}

function filaResultadoValida(r) {
  return Number(r?.idMuestraxAnalisis) > 0 || (Number(r?.idMuestra) > 0 && Number(r?.idAnalisis) > 0);
}

/**
 * Recorre el formulario de formato de ensayo y devuelve los pendientes.
 * @param {object} form
 * @param {{ steps?: number[] }} [options]
 */
export function collectEnsayoIssues(form, { steps = [1, 2, 3] } = {}) {
  const issues = [];
  const resultados = form?.resultados ?? [];
  const include = (step) => steps.includes(step);

  if (include(1) && !Number(form?.idLaboratorio)) {
    issues.push(
      issue({
        step: 1,
        field: "idLaboratorio",
        label: "Laboratorio",
        tipo: "vacio",
        detalle: "Debe indicar el laboratorio que realiza el ensayo.",
        formato: "Seleccione un laboratorio en la lista.",
      }),
    );
  }

  if (include(1) && !Number(form?.idFormatoOrden)) {
    issues.push(
      issue({
        step: 1,
        field: "idFormatoOrden",
        label: "Orden de servicio",
        tipo: "vacio",
        detalle: "Debe asociar el ensayo a una orden de servicio.",
        formato: "Seleccione la orden y, si desea, cargue sus muestras.",
      }),
    );
  }

  if (include(2) && !trim(form?.fechaInicio)) {
    issues.push(
      issue({
        step: 2,
        field: "fechaInicio",
        label: "Fecha de inicio",
        tipo: "vacio",
        detalle: "Indique el día en que inicia el ensayo.",
        formato: "Seleccione la fecha en el calendario.",
      }),
    );
  }

  if (include(2) && !trim(form?.fechaFin)) {
    issues.push(
      issue({
        step: 2,
        field: "fechaFin",
        label: "Fecha de fin",
        tipo: "vacio",
        detalle: "Indique el día en que concluye el ensayo.",
        formato: "Seleccione la fecha en el calendario.",
      }),
    );
  } else if (include(2) && trim(form?.fechaInicio) && trim(form.fechaFin) < trim(form.fechaInicio)) {
    issues.push(
      issue({
        step: 2,
        field: "fechaFin",
        label: "Fecha de fin",
        tipo: "formato",
        detalle: "La fecha de fin no puede ser anterior a la de inicio.",
        formato: "Elija una fecha igual o posterior a la de inicio.",
      }),
    );
  }

  if (include(2) && !trim(form?.planMuestreo)) {
    issues.push(
      issue({
        step: 2,
        field: "planMuestreo",
        label: "Plan de muestreo",
        tipo: "vacio",
        detalle: "Este campo es obligatorio y está vacío.",
        formato: "Indique el plan o referencia de muestreo.",
      }),
    );
  }

  if (include(2) && !trim(form?.condicionesAmbientales)) {
    issues.push(
      issue({
        step: 2,
        field: "condicionesAmbientales",
        label: "Condiciones ambientales",
        tipo: "vacio",
        detalle: "Describa las condiciones ambientales del ensayo.",
        formato: "Ejemplo: temperatura, humedad o ambiente del laboratorio.",
      }),
    );
  }

  if (include(2) && !trim(form?.condicionesItem)) {
    issues.push(
      issue({
        step: 2,
        field: "condicionesItem",
        label: "Condiciones del ítem",
        tipo: "vacio",
        detalle: "Describa el estado o condición del ítem ensayado.",
        formato: "Indique cómo se recibió o conservó la muestra.",
      }),
    );
  }

  if (include(3)) {
    const validos = resultados.filter(filaResultadoValida);
    if (validos.length === 0) {
      issues.push(
        issue({
          step: 3,
          field: "resultados",
          label: "Resultados",
          tipo: "vacio",
          detalle: "Debe registrar al menos un resultado con muestra y análisis.",
          formato: "Seleccione la muestra y el análisis en cada tarjeta, o cargue las muestras de la orden.",
        }),
      );
    }

    resultados.forEach((r, index) => {
      const n = index + 1;
      if (!Number(r.idMuestra) && !Number(r.idMuestraxAnalisis)) {
        issues.push(
          issue({
            step: 3,
            field: `muestra-${index}`,
            label: `Resultado ${n} — Muestra`,
            tipo: "vacio",
            detalle: "Esta tarjeta no tiene muestra seleccionada.",
            formato: "Elija la muestra del catálogo.",
          }),
        );
      }
      if (!Number(r.idAnalisis) && !Number(r.idMuestraxAnalisis)) {
        issues.push(
          issue({
            step: 3,
            field: `analisis-${index}`,
            label: `Resultado ${n} — Análisis`,
            tipo: "vacio",
            detalle: "Cada resultado debe tener un análisis asociado.",
            formato: "Seleccione el análisis o cargue las muestras desde la orden.",
          }),
        );
      }
    });
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

export function issuesForStep(issues, step) {
  return issues.filter((item) => item.step === step);
}
