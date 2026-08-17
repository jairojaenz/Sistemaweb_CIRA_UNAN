import { parseLatLng } from "../../../components/NicaraguaMapModal.jsx";

export const SOLICITUD_STEP_LABELS = [
  "Información del Solicitante",
  "Servicio Solicitado",
  "Observaciones y Confirmación",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function trim(value) {
  return String(value ?? "").trim();
}

function issue({ step, field, label, tipo, detalle, formato }) {
  return {
    step,
    stepLabel: `Paso ${step} — ${SOLICITUD_STEP_LABELS[step - 1]}`,
    field,
    label,
    tipo,
    detalle,
    formato,
  };
}

/**
 * Recorre el formulario y devuelve los problemas por paso.
 * @param {object} form
 * @param {{ steps?: number[] }} [options]
 */
export function collectSolicitudIssues(form, { steps = [1, 2, 3] } = {}) {
  const issues = [];
  const include = (step) => steps.includes(step);

  if (include(1)) {
    if (!trim(form.nombreUsuario)) {
      issues.push(
        issue({
          step: 1,
          field: "nombreUsuario",
          label: "Nombre del usuario",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Escriba el nombre del cliente, empresa o institución.",
        }),
      );
    }

    if (!trim(form.direccionUsuario)) {
      issues.push(
        issue({
          step: 1,
          field: "direccionUsuario",
          label: "Dirección",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Indique la dirección completa del solicitante.",
        }),
      );
    }

    if (!trim(form.correo)) {
      issues.push(
        issue({
          step: 1,
          field: "correo",
          label: "Correo electrónico",
          tipo: "vacio",
          detalle: "Este campo es obligatorio y está vacío.",
          formato: "Ejemplo: correo@empresa.com",
        }),
      );
    } else if (!EMAIL_REGEX.test(trim(form.correo))) {
      issues.push(
        issue({
          step: 1,
          field: "correo",
          label: "Correo electrónico",
          tipo: "formato",
          detalle: "El correo no tiene un formato válido.",
          formato: "Use un correo con @ y dominio, por ejemplo: correo@empresa.com",
        }),
      );
    }

    if (!Number(form.medioRecepcion)) {
      issues.push(
        issue({
          step: 1,
          field: "medioRecepcion",
          label: "Medio de recepción",
          tipo: "vacio",
          detalle: "No ha seleccionado cómo se recibió la solicitud.",
          formato: "Elija una tarjeta: correo, teléfono, presencial u otra del catálogo.",
        }),
      );
    }
  }

  if (include(2)) {
    if (!Array.isArray(form.tipoServicio) || form.tipoServicio.length === 0) {
      issues.push(
        issue({
          step: 2,
          field: "tipoServicio",
          label: "Servicio solicitado",
          tipo: "vacio",
          detalle: "Debe seleccionar al menos un tipo de servicio.",
          formato: "Marque una o más tarjetas de servicio (análisis, muestreo, etc.).",
        }),
      );
    }

    if (!Array.isArray(form.matriz) || form.matriz.length === 0) {
      issues.push(
        issue({
          step: 2,
          field: "matriz",
          label: "Matriz",
          tipo: "vacio",
          detalle: "Debe seleccionar al menos una matriz.",
          formato: "Pulse una tarjeta de matriz y asigne la cantidad de muestras con + / −.",
        }),
      );
    }

    const analisisValidos = (form.analisisSolicitados ?? []).some((a) => Number(a.idAnalisis) > 0);
    if (!analisisValidos) {
      issues.push(
        issue({
          step: 2,
          field: "analisisSolicitados",
          label: "Análisis solicitados",
          tipo: "vacio",
          detalle: "No hay un análisis válido del catálogo.",
          formato: "Haga clic en Agregar y elija un análisis de la lista.",
        }),
      );
    }

    const tieneDireccion = trim(form.ubicacionMuestreo);
    const tieneGps = !!parseLatLng(form.coordenadasGps);
    if (form.modoUbicacion === "gps") {
      if (!tieneGps) {
        issues.push(
          issue({
            step: 2,
            field: "ubicacionMuestreo",
            label: "Ubicación de muestreo (GPS)",
            tipo: "vacio",
            detalle: "No se ha marcado el punto de muestreo en el mapa.",
            formato: "Abra el mapa y pulse el sitio exacto en Nicaragua.",
          }),
        );
      }
    } else if (!tieneDireccion) {
      issues.push(
        issue({
          step: 2,
          field: "ubicacionMuestreo",
          label: "Ubicación de muestreo",
          tipo: "vacio",
          detalle: "No hay dirección ni coordenadas GPS.",
          formato: "Escriba la dirección del sitio o cambie a GPS y márquelo en el mapa.",
        }),
      );
    }
  }

  if (include(3)) {
    if (!Number(form.firma)) {
      issues.push(
        issue({
          step: 3,
          field: "firma",
          label: "Firma del usuario",
          tipo: "vacio",
          detalle: "Debe indicar quién firma la solicitud.",
          formato: "Seleccione un usuario activo en la lista desplegable.",
        }),
      );
    }

    if (!Number(form.recibidoPor)) {
      issues.push(
        issue({
          step: 3,
          field: "recibidoPor",
          label: "Solicitud recibida por",
          tipo: "vacio",
          detalle: "Debe indicar quién recibió la solicitud.",
          formato: "Seleccione un usuario activo en la lista desplegable.",
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
