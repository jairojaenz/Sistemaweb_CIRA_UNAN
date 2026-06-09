/**
 * Formato de teléfono local **0000-0000** (hasta 8 dígitos).
 * El valor guardado y enviado al API es un **string** (p. ej. `"2222-5555"`).
 *
 * @param {string} value — texto pegado o tecleado (se ignoran caracteres no numéricos)
 * @returns {string}
 */
export function formatTelefonoLocal(value) {
  const d = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (d.length === 0) return "";
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

/** 8 dígitos; el primero debe ser 2, 5, 7 u 8. */
const TELEFONO_LOCAL_REGEX = /^[2578]\d{7}$/;

export function digitsTelefonoLocal(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidTelefonoLocal(value, { required = false } = {}) {
  const d = digitsTelefonoLocal(value);
  if (d.length === 0) return !required;
  return TELEFONO_LOCAL_REGEX.test(d);
}

export function telefonoLocalError(value, { required = false, label = "Teléfono" } = {}) {
  const d = digitsTelefonoLocal(value);
  if (d.length === 0) return required ? `${label} es requerido` : "";
  if (!TELEFONO_LOCAL_REGEX.test(d)) {
    return `${label}: 8 dígitos, debe iniciar con 2, 5, 7 u 8`;
  }
  return "";
}
