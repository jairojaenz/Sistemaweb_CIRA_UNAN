/**
 * Google Maps centrado en Nicaragua.
 * La clave se lee de VITE_GOOGLE_MAPS_API_KEY (.env.development).
 */

export const NICARAGUA_CENTER = { lat: 12.8654, lng: -85.2072 };

export const NICARAGUA_BOUNDS = {
  south: 10.65,
  west: -87.85,
  north: 15.15,
  east: -82.55,
};

export const CAPAS_BASE = [
  { id: "satelite", label: "Satélite", mapTypeId: "hybrid" },
  { id: "calles", label: "Calles", mapTypeId: "roadmap" },
  { id: "relieve", label: "Relieve", mapTypeId: "terrain" },
];

export function googleMapsApiKey() {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
}

const TIPOS = Object.fromEntries(CAPAS_BASE.map((c) => [c.id, c.mapTypeId]));

export function mapTypeDeCapa(id) {
  return TIPOS[id] || "hybrid";
}

let carga = null;

export function cargarGoogleMaps() {
  const key = googleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error("Falta VITE_GOOGLE_MAPS_API_KEY"));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (carga) return carga;

  carga = new Promise((resolve, reject) => {
    const existente = document.getElementById("cira-google-maps");
    if (existente) {
      existente.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existente.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps")), { once: true });
      return;
    }

    const callback = "__ciraGoogleMapsListo";
    window[callback] = () => {
      delete window[callback];
      resolve(window.google.maps);
    };

    const script = document.createElement("script");
    script.id = "cira-google-maps";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}&language=es&v=weekly`;
    script.onerror = () => {
      carga = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return carga;
}

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 32 42">
  <path fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"
    d="M16 1C8.3 1 2 7.3 2 15c0 10.5 14 25 14 25s14-14.5 14-25C30 7.3 23.7 1 16 1z"/>
  <circle cx="16" cy="15" r="5" fill="#fff"/>
</svg>`;

export function iconoPin(maps, size = { w: 28, h: 38 }) {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG)}`,
    scaledSize: new maps.Size(size.w, size.h),
    anchor: new maps.Point(size.w / 2, size.h),
  };
}

export function opcionesMapaNicaragua({ center, zoom, mapTypeId = "hybrid" } = {}) {
  return {
    center: center || NICARAGUA_CENTER,
    zoom: zoom ?? 6.4,
    minZoom: 6,
    maxZoom: 18,
    mapTypeId,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: 1 },
    gestureHandling: "greedy",
    restriction: {
      latLngBounds: NICARAGUA_BOUNDS,
      strictBounds: false,
    },
  };
}
