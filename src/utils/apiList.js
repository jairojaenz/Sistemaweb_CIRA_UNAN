/**
 * Helpers para listados y catálogos simples (API `Nombre` ↔ UI `nombreX`).
 */

/** Normaliza respuestas de listados de la API (array directo o envuelto). */
export function asList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.Users)) return res.Users;
  return [];
}

/**
 * Normaliza un ítem donde la API usa `Nombre`/`Activo`
 * y el front usa p. ej. `nombreCargo` + `idCargo`.
 */
export function normalizeNamedItem(raw, { idKey, nameKey } = {}) {
  if (!raw || typeof raw !== "object") return raw;

  const id =
    raw[idKey] ??
    raw[idKey?.replace(/^id/, "Id")] ??
    null;

  const nombre = raw[nameKey] ?? raw.nombre ?? raw.Nombre ?? "";

  return {
    ...raw,
    [idKey]: id,
    [nameKey]: nombre,
    nombre,
    activo: raw.activo !== false && raw.Activo !== false,
  };
}

/** Body create/update: API espera { nombre, activo?, ...extras }. */
export function toNamedPayload(data, nameKey, extras = {}) {
  return {
    nombre: String(data.nombre ?? data[nameKey] ?? data.Nombre ?? "").trim(),
    activo: data.activo !== false && data.Activo !== false,
    ...extras,
  };
}
