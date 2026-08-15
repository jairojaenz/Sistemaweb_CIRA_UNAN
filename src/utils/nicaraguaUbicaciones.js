/**
 * Centros aproximados de los departamentos de Nicaragua (WGS84).
 * El catálogo de departamentos no guarda lat/lng; esto sirve para abrir el mapa
 * ya centrado en el departamento elegido y capturar el punto exacto.
 */
const CENTROS_DEPARTAMENTO = {
  boaco: { lat: 12.4724, lng: -85.6586 },
  carazo: { lat: 11.8495, lng: -86.199 },
  chinandega: { lat: 12.6294, lng: -87.1311 },
  chontales: { lat: 12.1063, lng: -85.3645 },
  esteli: { lat: 13.0918, lng: -86.3538 },
  granada: { lat: 11.9344, lng: -85.956 },
  jinotega: { lat: 13.091, lng: -86.0006 },
  leon: { lat: 12.4379, lng: -86.878 },
  madriz: { lat: 13.4833, lng: -86.5825 },
  managua: { lat: 12.1364, lng: -86.2514 },
  masaya: { lat: 11.9739, lng: -86.0942 },
  matagalpa: { lat: 12.9256, lng: -85.9175 },
  "nueva segovia": { lat: 13.6232, lng: -86.4752 },
  rivas: { lat: 11.4372, lng: -85.8263 },
  "rio san juan": { lat: 11.1236, lng: -84.7778 },
  raan: { lat: 14.0478, lng: -83.3888 },
  raccn: { lat: 14.0478, lng: -83.3888 },
  "costa caribe norte": { lat: 14.0478, lng: -83.3888 },
  raas: { lat: 12.0137, lng: -83.7635 },
  raccs: { lat: 12.0137, lng: -83.7635 },
  "costa caribe sur": { lat: 12.0137, lng: -83.7635 },
};

function normalizeNombre(nombre) {
  return String(nombre ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Devuelve { lat, lng } del departamento, o null si el nombre no se reconoce. */
export function getCentroDepartamento(nombre) {
  const n = normalizeNombre(nombre);
  if (!n) return null;
  if (CENTROS_DEPARTAMENTO[n]) return CENTROS_DEPARTAMENTO[n];
  if (n.includes("caribe norte") || n.includes("raan") || n.includes("raccn")) {
    return CENTROS_DEPARTAMENTO.raan;
  }
  if (n.includes("caribe sur") || n.includes("raas") || n.includes("raccs")) {
    return CENTROS_DEPARTAMENTO.raas;
  }
  if (n.includes("san juan")) return CENTROS_DEPARTAMENTO["rio san juan"];
  if (n.includes("nueva segovia")) return CENTROS_DEPARTAMENTO["nueva segovia"];
  for (const [clave, centro] of Object.entries(CENTROS_DEPARTAMENTO)) {
    if (n.includes(clave) || clave.includes(n)) return centro;
  }
  return null;
}
