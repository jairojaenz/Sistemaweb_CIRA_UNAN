/**
 * Cédula Nicaragua: **000-000000-0000F** (13 dígitos + letra mayúscula verificadora).
 *
 * @param {string} value
 * @returns {string}
 */
export function formatCedulaNicaragua(value) {
  const upper = String(value ?? "").toUpperCase();
  let digits = "";
  let letter = "";
  for (const ch of upper) {
    if (/\d/.test(ch) && digits.length < 13) {
      digits += ch;
      continue;
    }
    if (/[A-Z]/.test(ch) && digits.length === 13 && !letter) {
      letter = ch;
      break;
    }
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 9);
  const c = digits.slice(9, 13);
  return letter ? `${a}-${b}-${c}${letter}` : `${a}-${b}-${c}`;
}

/** Formato exacto enviado al API: 3-6-4 dígitos y una letra A-Z al final. */
export const CEDULA_NICARAGUA_REGEX = /^\d{3}-\d{6}-\d{4}[A-Z]$/;
