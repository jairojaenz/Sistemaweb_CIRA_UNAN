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
