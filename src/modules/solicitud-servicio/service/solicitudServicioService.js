const STORAGE_KEY = "solicitud_servicio_last_v1";

export function saveSolicitudServicioLocal(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    alert("Solicitud guardada (simulado).");
  } catch {
    alert("No se pudo guardar localmente.");
  }
}
