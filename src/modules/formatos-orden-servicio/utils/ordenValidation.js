/**
 * Validación de la orden de servicio para el wizard (pasos 1–3).
 * Cada issue indica paso, campo, si está vacío o mal llenado, y el formato esperado.
 */
import { telefonoLocalError } from "../../../utils/phoneFormat.js";

export const ORDEN_STEP_LABELS = ["Cliente", "Servicios solicitados", "Logística y cierre"];

const COMPOUESTO_KEYS = ["compuesto8h", "compuesto12h", "compuesto16h", "compuesto24h"];
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const CODIGO_MUESTRA_REGEX = /^[A-Za-z]{1,4}-\d{3,6}$/;

function issue({ step, field, label, tipo, detalle, formato }) {
  return {
    step,
    stepLabel: `Paso ${step} — ${ORDEN_STEP_LABELS[step - 1]}`,
    field,
    label,
    tipo, // "vacio" | "formato"
    detalle,
    formato,
  };
}

function trim(value) {
  return String(value ?? "").trim();
}

/**
 * Recorre el formulario y devuelve la lista de problemas (vacío o formato).
 * @returns {Array<{step:number,stepLabel:string,field:string,label:string,tipo:string,detalle:string,formato:string}>}
 */
export function collectOrdenIssues(form, extras = {}) {
  const {
    usuarios = [],
    formatosCampo = [],
    idUsuarioSesion = null,
    catalogsReady = true,
    includeCatalogIssues = true,
  } = extras;
  const issues = [];

  // ── Paso 1: Cliente ──
  if (!trim(form.numeroOrden)) {
    issues.push(
      issue({
        step: 1,
        field: "numeroOrden",
        label: "Orden Nº",
        tipo: "vacio",
        detalle: "Este campo está vacío.",
        formato: "Número entero mayor que 0 (ejemplo: 15).",
      }),
    );
  } else if (!/^\d+$/.test(trim(form.numeroOrden)) || Number(form.numeroOrden) <= 0) {
    issues.push(
      issue({
        step: 1,
        field: "numeroOrden",
        label: "Orden Nº",
        tipo: "formato",
        detalle: "El valor no es un número de orden válido.",
        formato: "Solo dígitos, mayor que 0 (ejemplo: 15).",
      }),
    );
  }

  if (!trim(form.fecha)) {
    issues.push(
      issue({
        step: 1,
        field: "fecha",
        label: "Fecha de recepción",
        tipo: "vacio",
        detalle: "Este campo está vacío.",
        formato: "Fecha con el selector (AAAA-MM-DD).",
      }),
    );
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(trim(form.fecha)) || Number.isNaN(new Date(`${form.fecha}T12:00:00`).getTime())) {
    issues.push(
      issue({
        step: 1,
        field: "fecha",
        label: "Fecha de recepción",
        tipo: "formato",
        detalle: "La fecha no tiene un formato válido.",
        formato: "Use el calendario del campo (AAAA-MM-DD).",
      }),
    );
  }

  if (!trim(form.usuarioEmpresa)) {
    issues.push(
      issue({
        step: 1,
        field: "usuarioEmpresa",
        label: "Usuario / Empresa",
        tipo: "vacio",
        detalle: "Este campo está vacío.",
        formato: "Nombre de la persona o empresa (solo texto).",
      }),
    );
  }

  if (trim(form.correo) && !EMAIL_REGEX.test(trim(form.correo))) {
    issues.push(
      issue({
        step: 1,
        field: "correo",
        label: "Correo electrónico",
        tipo: "formato",
        detalle: "El correo no tiene un formato válido.",
        formato: "ejemplo@dominio.com",
      }),
    );
  }

  const errTelefono = telefonoLocalError(form.telefono, { label: "Teléfono" });
  if (errTelefono) {
    issues.push(
      issue({
        step: 1,
        field: "telefono",
        label: "Teléfono",
        tipo: "formato",
        detalle: errTelefono,
        formato: "8 dígitos con guion: 0000-0000. Debe iniciar con 2, 5, 7 u 8.",
      }),
    );
  }

  const errCelular = telefonoLocalError(form.celular, { label: "Celular" });
  if (errCelular) {
    issues.push(
      issue({
        step: 1,
        field: "celular",
        label: "Celular",
        tipo: "formato",
        detalle: errCelular,
        formato: "8 dígitos con guion: 0000-0000. Debe iniciar con 2, 5, 7 u 8.",
      }),
    );
  }

  if (catalogsReady && includeCatalogIssues) {
    if (!Number(form.idUsuario) && !Number(idUsuarioSesion)) {
      issues.push(
        issue({
          step: 1,
          field: "idUsuario",
          label: "Usuario del sistema",
          tipo: "vacio",
          detalle:
            usuarios.length === 0
              ? "No hay usuarios activos para asociar la orden."
              : "Debe seleccionar el usuario responsable de la orden.",
          formato: "Elija un usuario de la lista «Usuario del sistema» en el paso 1.",
        }),
      );
    }

    if (!Number(form.idFormatoCampo)) {
      issues.push(
        issue({
          step: 1,
          field: "idFormatoCampo",
          label: "Formato de campo",
          tipo: "vacio",
          detalle: "Debe vincular un formato de campo. La API lo exige para crear la orden.",
          formato: "Seleccione un formato en el paso 1 o cree uno en Información de Campo.",
        }),
      );
    }
  }

  // ── Paso 2: Servicios ──
  if (!Number(form.idTipoMuestreo) && form.modalidadMuestreo !== "otros") {
    issues.push(
      issue({
        step: 2,
        field: "idTipoMuestreo",
        label: "Tipo de muestreo",
        tipo: "vacio",
        detalle: "Debe elegir un tipo de muestreo.",
        formato: "Seleccione un tipo del catálogo u «Otro» si necesita especificar uno distinto.",
      }),
    );
  }

  if (form.modalidadMuestreo === "compuesto") {
    const seleccionadas = COMPOUESTO_KEYS.filter((key) => form[key]).length;
    const otroTiempo = trim(form.compuestoOtroTiempo);
    if (seleccionadas === 0 && !otroTiempo) {
      issues.push(
        issue({
          step: 2,
          field: "compuestoOpcion",
          label: "Duración del muestreo compuesto",
          tipo: "vacio",
          detalle: "No eligió la duración del muestreo compuesto.",
          formato: "Marque una o más duraciones (8 h, 12 h, 16 h, 24 h) u Otro si el tiempo es distinto.",
        }),
      );
    }
  }

  if (form.modalidadMuestreo === "otros" && !trim(form.modalidadMuestreoOtros)) {
    issues.push(
      issue({
        step: 2,
        field: "modalidadMuestreoOtros",
        label: "Tipo de muestreo (otros)",
        tipo: "vacio",
        detalle: "Eligió «Otros» pero no describió el tipo de muestreo.",
        formato: "Texto breve (ejemplo: muestreo integrado cada 2 horas).",
      }),
    );
  }

  const filas = Array.isArray(form.detalleMuestras) ? form.detalleMuestras : [];
  const filasConAnalisis = filas.filter((row) => trim(row.analisis));
  if (form.analisisOrden && filasConAnalisis.length === 0) {
    issues.push(
      issue({
        step: 2,
        field: "detalleMuestras",
        label: "Análisis solicitado (detalle de muestras)",
        tipo: "vacio",
        detalle: "Marcó el servicio «Análisis» pero no indicó ningún análisis en la tabla.",
        formato: "En al menos una fila escriba el análisis (ejemplo: pH, DQO, DBO5).",
      }),
    );
  }

  filas.forEach((row, index) => {
    const n = index + 1;
    const codigo = trim(row.codigoAsignado ?? row.codigoLab);
    if (codigo && !CODIGO_MUESTRA_REGEX.test(codigo)) {
      issues.push(
        issue({
          step: 2,
          field: `detalleMuestras.${index}.codigoAsignado`,
          label: `Código asignado (fila ${n})`,
          tipo: "formato",
          detalle: `El código «${codigo}» no coincide con el formato del laboratorio.`,
          formato: "Letras, guion y números: AR-0001",
        }),
      );
    }
  });

  // ── Paso 3: logística ──
  if (!trim(form.estadoOrden)) {
    issues.push(
      issue({
        step: 3,
        field: "estadoOrden",
        label: "Estado de la orden",
        tipo: "vacio",
        detalle: "Debe indicar el estado de la orden.",
        formato: "Elija Pendiente, En proceso, Completada o Anulada.",
      }),
    );
  }

  return issues;
}

/** Mapa field → mensaje corto para pintar bajo los inputs. */
export function issuesToFormErrors(issues) {
  const errors = {};
  for (const item of issues) {
    if (!errors[item.field]) errors[item.field] = item.detalle;
  }
  return errors;
}

export function issuesForStep(issues, step) {
  return issues.filter((item) => item.step === step);
}

/** Convierte un mensaje conocido de la API en issues con paso y formato. */
export function mapApiErrorToIssues(message) {
  const msg = String(message ?? "").trim();
  if (!msg) return [];

  const lower = msg.toLowerCase();
  if (lower.includes("usuario no existe") || lower.includes("usuario responsable")) {
    return [
      issue({
        step: 1,
        field: "idUsuario",
        label: "Usuario del sistema",
        tipo: "formato",
        detalle: msg,
        formato: "Seleccione un usuario activo de la lista en el paso 1.",
      }),
    ];
  }
  if (lower.includes("formato de campo")) {
    return [
      issue({
        step: 1,
        field: "idFormatoCampo",
        label: "Formato de campo",
        tipo: "formato",
        detalle: msg,
        formato: "Seleccione un formato de campo existente en el paso 1.",
      }),
    ];
  }
  if (lower.includes("tipo de muestreo")) {
    return [
      issue({
        step: 2,
        field: "modalidadMuestreo",
        label: "Tipo de muestreo solicitado",
        tipo: "formato",
        detalle: msg,
        formato: "Elija Puntual, Compuesto u Otros en el paso 2.",
      }),
    ];
  }
  return [];
}
