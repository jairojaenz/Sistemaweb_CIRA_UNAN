export const CUSTODIA_SECTION_LABELS = ["Identificación", "Muestras y análisis", "Entregas"];

function trim(value) {
  return String(value ?? "").trim();
}

function issue({ step, field, label, tipo, detalle, formato }) {
  return {
    step,
    stepLabel: CUSTODIA_SECTION_LABELS[step - 1],
    field,
    label,
    tipo,
    detalle,
    formato,
  };
}

/**
 * Recorre el formulario de cadena de custodia y devuelve los pendientes.
 */
export function collectCustodiaIssues(form) {
  const issues = [];
  const detalles = form?.detalles ?? [];
  const entregas = form?.entregas ?? [];

  if (!Number(form?.idFormatoCampo)) {
    issues.push(
      issue({
        step: 1,
        field: "idFormatoCampo",
        label: "Formato de campo",
        tipo: "vacio",
        detalle: "Debe asociar la custodia a un formato de campo.",
        formato: "Seleccione el formato de campo en la lista.",
      }),
    );
  }

  if (!trim(form?.estado)) {
    issues.push(
      issue({
        step: 1,
        field: "estado",
        label: "Estado",
        tipo: "vacio",
        detalle: "Indique el estado de la cadena de custodia.",
        formato: "Elija Pendiente, En tránsito, Recibida o Cerrada.",
      }),
    );
  }

  const detallesConMuestra = detalles.filter((d) => Number(d.idMuestra) > 0);
  if (detallesConMuestra.length === 0) {
    issues.push(
      issue({
        step: 2,
        field: "detalles",
        label: "Muestras",
        tipo: "vacio",
        detalle: "Debe registrar al menos una muestra en la cadena.",
        formato: "Seleccione la muestra en cada tarjeta.",
      }),
    );
  }

  detalles.forEach((d, index) => {
    if (!Number(d.idMuestra)) {
      issues.push(
        issue({
          step: 2,
          field: `muestra-${index}`,
          label: `Muestra ${index + 1}`,
          tipo: "vacio",
          detalle: "Esta tarjeta no tiene muestra seleccionada.",
          formato: "Elija la muestra del catálogo.",
        }),
      );
    }
  });

  if (entregas.length === 0) {
    issues.push(
      issue({
        step: 3,
        field: "entregas",
        label: "Entregas",
        tipo: "vacio",
        detalle: "Debe registrar al menos una entrega.",
        formato: "Complete fecha, hora, usuario y cliente de la entrega.",
      }),
    );
  }

  entregas.forEach((e, index) => {
    const n = index + 1;
    if (!trim(e.fechaEntrega)) {
      issues.push(
        issue({
          step: 3,
          field: `fechaEntrega-${index}`,
          label: `Fecha de entrega ${n}`,
          tipo: "vacio",
          detalle: "Indique el día en que se entrega la muestra.",
          formato: "Seleccione la fecha en el calendario.",
        }),
      );
    }
    if (!trim(e.horaEntrega)) {
      issues.push(
        issue({
          step: 3,
          field: `horaEntrega-${index}`,
          label: `Hora de entrega ${n}`,
          tipo: "vacio",
          detalle: "Indique la hora de entrega.",
          formato: "Use el selector de hora.",
        }),
      );
    }
    if (!trim(e.fechaRecibido)) {
      issues.push(
        issue({
          step: 3,
          field: `fechaRecibido-${index}`,
          label: `Fecha de recibido ${n}`,
          tipo: "vacio",
          detalle: "Indique el día en que se recibe la muestra.",
          formato: "Seleccione la fecha en el calendario.",
        }),
      );
    }
    if (!trim(e.horaRecibido)) {
      issues.push(
        issue({
          step: 3,
          field: `horaRecibido-${index}`,
          label: `Hora de recibido ${n}`,
          tipo: "vacio",
          detalle: "Indique la hora de recepción.",
          formato: "Use el selector de hora.",
        }),
      );
    }
    if (!Number(e.idUsuario)) {
      issues.push(
        issue({
          step: 3,
          field: `idUsuario-${index}`,
          label: `Usuario de entrega ${n}`,
          tipo: "vacio",
          detalle: "Debe indicar quién entrega o recibe en laboratorio.",
          formato: "Seleccione un usuario.",
        }),
      );
    }
    if (!Number(e.idCliente)) {
      issues.push(
        issue({
          step: 3,
          field: `idCliente-${index}`,
          label: `Cliente de entrega ${n}`,
          tipo: "vacio",
          detalle: "Debe asociar un cliente a la entrega.",
          formato: "Seleccione el cliente en la lista.",
        }),
      );
    }
  });

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
