export const CAMPO_STEP_LABELS = ["Muestra", "Características", "Verificación"];

function esTipoCompuesto(option) {
  const n = String(option?.nombreTipoMuestreo || option?.nombre || "");
  return /compuesto|completo/i.test(n);
}

function trim(value) {
  return String(value ?? "").trim();
}

function issue({ step, field, label, tipo, detalle, formato }) {
  return {
    step,
    stepLabel: `Paso ${step} — ${CAMPO_STEP_LABELS[step - 1]}`,
    field,
    label,
    tipo,
    detalle,
    formato,
  };
}

/**
 * Recorre el formato de campo y devuelve los problemas por paso.
 * @param {object} form
 * @param {{ steps?: number[], fuentesApi?: object[], tiposApi?: object[] }} [options]
 */
export function collectCampoIssues(form, { steps = [1, 2, 3], fuentesApi = [], tiposApi = [] } = {}) {
  const issues = [];
  const include = (step) => steps.includes(step);

  if (include(1)) {
    if (!trim(form.idProforma)) {
      issues.push(
        issue({
          step: 1,
          field: "idProforma",
          label: "Proforma",
          tipo: "vacio",
          detalle: "Debe asociar una proforma a este formato.",
          formato: "Seleccione un número de proforma en la lista.",
        }),
      );
    }

    if (!trim(form.idMuestra)) {
      issues.push(
        issue({
          step: 1,
          field: "idMuestra",
          label: "Muestra",
          tipo: "vacio",
          detalle: "Debe elegir la muestra del catálogo.",
          formato: "Seleccione una muestra registrada. Eso completa la identificación.",
        }),
      );
    }

    if (!trim(form.lugar)) {
      issues.push(
        issue({
          step: 1,
          field: "lugar",
          label: "Lugar",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba el nombre del sitio de muestreo.",
        }),
      );
    }

    if (!trim(form.idDepartamento)) {
      issues.push(
        issue({
          step: 1,
          field: "idDepartamento",
          label: "Departamento",
          tipo: "vacio",
          detalle: "No ha seleccionado el departamento.",
          formato: "Elija un departamento de Nicaragua en la lista.",
        }),
      );
    }

    if (!trim(form.idMunicipio)) {
      issues.push(
        issue({
          step: 1,
          field: "idMunicipio",
          label: "Municipio",
          tipo: "vacio",
          detalle: "No ha seleccionado el municipio.",
          formato: "Primero elija un departamento y luego el municipio.",
        }),
      );
    }

    if (!trim(form.fecha)) {
      issues.push(
        issue({
          step: 1,
          field: "fecha",
          label: "Fecha de muestreo",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Use el selector de fecha (AAAA-MM-DD).",
        }),
      );
    }

    if (!trim(form.hora)) {
      issues.push(
        issue({
          step: 1,
          field: "hora",
          label: "Hora de muestreo",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Use el selector de hora (HH:MM).",
        }),
      );
    }

    const conId = (form.ensayos ?? []).filter((e) => Number(e.idAnalisis) > 0);
    if (conId.length === 0) {
      issues.push(
        issue({
          step: 1,
          field: "ensayos",
          label: "Ensayos de laboratorio",
          tipo: "vacio",
          detalle: "Debe agregar al menos un ensayo del catálogo.",
          formato: "Seleccione un análisis y pulse Agregar.",
        }),
      );
    }
  }

  if (include(2)) {
    if (!trim(form.idMatriz)) {
      issues.push(
        issue({
          step: 2,
          field: "idMatriz",
          label: "Matriz",
          tipo: "vacio",
          detalle: "Debe seleccionar una matriz.",
          formato: "Pulse una de las tarjetas de matriz (agua potable, residual, suelo, etc.).",
        }),
      );
    }

    if (!trim(form.idFuente)) {
      issues.push(
        issue({
          step: 2,
          field: "idFuente",
          label: "Fuente",
          tipo: "vacio",
          detalle: "Debe seleccionar una fuente.",
          formato: "Elija una fuente compatible con la matriz seleccionada.",
        }),
      );
    } else {
      const fuente = fuentesApi.find((f) => String(f.idFuente) === String(form.idFuente));
      if (!fuente || String(fuente.idMatriz ?? fuente.IdMatriz) !== String(form.idMatriz)) {
        issues.push(
          issue({
            step: 2,
            field: "idFuente",
            label: "Fuente",
            tipo: "formato",
            detalle: "La fuente no corresponde a la matriz elegida.",
            formato: "Seleccione de nuevo una fuente de la matriz actual.",
          }),
        );
      }
    }

    if (!trim(form.idTipoMuestreo)) {
      issues.push(
        issue({
          step: 2,
          field: "idTipoMuestreo",
          label: "Tipo de muestreo",
          tipo: "vacio",
          detalle: "Debe seleccionar un tipo de muestreo.",
          formato: "Elija Simple, Compuesto u otra opción del catálogo.",
        }),
      );
    } else if (esTipoCompuesto(tiposApi.find((t) => String(t.idTipoMuestreo) === String(form.idTipoMuestreo)))) {
      if (form.compuestoHorasOpcion === "otros") {
        if (!trim(form.compuestoHorasOtro)) {
          issues.push(
            issue({
              step: 2,
              field: "compuestoHoras",
              label: "Duración del muestreo compuesto",
              tipo: "vacio",
              detalle: "Eligió “otros” y no indicó las horas.",
              formato: "Escriba la duración en horas, por ejemplo 18.",
            }),
          );
        }
      } else if (!trim(form.compuestoHoras)) {
        issues.push(
          issue({
            step: 2,
            field: "compuestoHoras",
            label: "Duración del muestreo compuesto",
            tipo: "vacio",
            detalle: "Falta la cantidad de horas del muestreo compuesto.",
            formato: "Elija 8, 12, 16 o 24 horas, o “otros” y escríbala.",
          }),
        );
      }
    }

    if (!(form.idsEquipos ?? []).length) {
      issues.push(
        issue({
          step: 2,
          field: "idsEquipos",
          label: "Equipos de muestreo",
          tipo: "vacio",
          detalle: "Debe seleccionar al menos un equipo.",
          formato: "Marque uno o más equipos utilizados en la toma de muestra.",
        }),
      );
    }
  }

  if (include(3)) {
    if (!trim(form.quienTomaMuestra)) {
      issues.push(
        issue({
          step: 3,
          field: "quienTomaMuestra",
          label: "¿Quién tomó la muestra?",
          tipo: "vacio",
          detalle: "Debe indicar si la tomó el cliente o un técnico del CIRA.",
          formato: "Pulse la tarjeta Cliente o Técnico del CIRA.",
        }),
      );
    }

    if (form.quienTomaMuestra === "cliente") {
      if (!trim(form.instructivoCliente)) {
        issues.push(
          issue({
            step: 3,
            field: "instructivoCliente",
            label: "Instructivo operativo",
            tipo: "vacio",
            detalle: "Si la muestra la tomó el cliente, el instructivo es obligatorio.",
            formato: "Seleccione un código de instructivo o “otro” y especifíquelo.",
          }),
        );
      } else if (form.instructivoCliente === "otro" && !trim(form.instructivoClienteOtro)) {
        issues.push(
          issue({
            step: 3,
            field: "instructivoCliente",
            label: "Instructivo operativo",
            tipo: "vacio",
            detalle: "Eligió “otro” y no especificó el instructivo.",
            formato: "Escriba el nombre o código del instructivo utilizado.",
          }),
        );
      }
    }

    if (form.quienTomaMuestra === "tecnico") {
      if (!trim(form.procedimientoCIRA)) {
        issues.push(
          issue({
            step: 3,
            field: "procedimientoCIRA",
            label: "Procedimiento CIRA",
            tipo: "vacio",
            detalle: "Si la muestra la tomó un técnico, el procedimiento es obligatorio.",
            formato: "Seleccione un procedimiento del catálogo o “otro” y especifíquelo.",
          }),
        );
      } else if (form.procedimientoCIRA === "otro" && !trim(form.procedimientoCIRAOtro)) {
        issues.push(
          issue({
            step: 3,
            field: "procedimientoCIRA",
            label: "Procedimiento CIRA",
            tipo: "vacio",
            detalle: "Eligió “otro” y no especificó el procedimiento.",
            formato: "Escriba el procedimiento utilizado.",
          }),
        );
      }
    }

    if (!trim(form.muestraCapturadaPor)) {
      issues.push(
        issue({
          step: 3,
          field: "muestraCapturadaPor",
          label: "Muestra captada por",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba el nombre de quien recolectó la muestra.",
        }),
      );
    }

    if (!trim(form.verificacionNombre)) {
      issues.push(
        issue({
          step: 3,
          field: "verificacionNombre",
          label: "Nombre de quien verifica",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba el nombre de la persona que revisa el formato.",
        }),
      );
    }

    if (!trim(form.verificacionFecha)) {
      issues.push(
        issue({
          step: 3,
          field: "verificacionFecha",
          label: "Fecha de verificación",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Use el selector de fecha (AAAA-MM-DD).",
        }),
      );
    }

    if (!trim(form.inicialesAnalista)) {
      issues.push(
        issue({
          step: 3,
          field: "inicialesAnalista",
          label: "Iniciales del analista",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba las iniciales, por ejemplo ADA.",
        }),
      );
    }

    if (!trim(form.codigoMuestra)) {
      issues.push(
        issue({
          step: 3,
          field: "codigoMuestra",
          label: "Código de laboratorio",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba el código asignado a la muestra en laboratorio.",
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
