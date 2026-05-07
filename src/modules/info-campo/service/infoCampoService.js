/** Persistencia local hasta integrar API (opcional). */
const STORAGE_KEY = "info_campo_last_v1";

export function saveInfoCampoLocal(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    alert("Información de campo guardada (simulado).");
  } catch {
    alert("No se pudo guardar localmente.");
  }
}
