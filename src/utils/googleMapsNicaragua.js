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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}&language=es&v=beta`;
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

export function solicitarPantallaCompleta(el) {
  if (!el) return Promise.resolve();
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
  return pedir ? pedir.call(el) : Promise.resolve();
}

export function salirPantallaCompleta() {
  const salir = document.exitFullscreen || document.webkitExitFullscreen;
  return salir ? salir.call(document) : Promise.resolve();
}

export function estaEnPantallaCompleta(el) {
  const actual = document.fullscreenElement || document.webkitFullscreenElement;
  return Boolean(el && actual === el);
}

export function escucharPantallaCompleta(handler) {
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
  };
}

export function redimensionarMapa(map) {
  if (!map || !window.google?.maps?.event) return;
  window.google.maps.event.trigger(map, "resize");
}

export const TILT_3D = 65;
export const HEADING_3D = 32;

export function rangoDesdeZoom(zoom) {
  const z = Number(zoom);
  const seguro = Number.isFinite(z) ? z : 6.4;
  return Math.round(Math.max(900, 1100000 * Math.pow(0.5, seguro - 6)));
}

export async function cargarMaps3d() {
  await cargarGoogleMaps();
  if (!window.google?.maps?.importLibrary) {
    throw new Error("Esta versión de Google Maps no soporta la vista 3D");
  }
  return window.google.maps.importLibrary("maps3d");
}

export function modoMapa3d(idCapa) {
  return idCapa === "calles" ? "HYBRID" : "SATELLITE";
}

export function crearMapa3d(lib, host, { center, zoom, idCapa } = {}) {
  const { Map3DElement } = lib;
  if (!Map3DElement) {
    throw new Error("Google Maps no devolvió Map3DElement");
  }
  const punto = center || NICARAGUA_CENTER;
  const base = {
    mode: modoMapa3d(idCapa),
    center: { lat: punto.lat, lng: punto.lng, altitude: 0 },
    range: rangoDesdeZoom(zoom),
    tilt: TILT_3D,
    heading: HEADING_3D,
  };
  let mapa;
  try {
    mapa = new Map3DElement({
      ...base,
      defaultUIHidden: true,
      gestureHandling: "GREEDY",
      bounds: NICARAGUA_BOUNDS,
    });
  } catch {
    mapa = new Map3DElement(base);
  }
  mapa.style.width = "100%";
  mapa.style.height = "100%";
  mapa.style.display = "block";
  host.replaceChildren(mapa);
  return mapa;
}

export function destruirMapa3d(host) {
  if (host) host.replaceChildren();
}

export function volarAPunto3d(mapa3d, { lat, lng, zoom }) {
  if (!mapa3d) return;
  const camera = {
    center: { lat, lng, altitude: 0 },
    range: rangoDesdeZoom(zoom ?? 14),
    tilt: TILT_3D,
    heading: HEADING_3D,
  };
  if (typeof mapa3d.flyCameraTo === "function") {
    mapa3d.flyCameraTo({ endCamera: camera, durationMillis: 1400 });
    return;
  }
  Object.assign(mapa3d, camera);
}

export function sincronizarMarcadores3d(lib, mapa3d, features, onClick) {
  if (!mapa3d) return [];
  [...mapa3d.querySelectorAll("gmp-marker-3d-interactive, gmp-marker-3d")].forEach((n) => n.remove());
  const Ctor = lib.Marker3DInteractiveElement || lib.Marker3DElement;
  if (!Ctor) return [];
  return (features ?? []).map((f) => {
    const marker = new Ctor({
      position: { lat: f.properties.lat, lng: f.properties.lng, altitude: 0 },
      altitudeMode: "CLAMP_TO_GROUND",
      label: f.properties.plan || f.properties.nombre,
      title: f.properties.nombre,
    });
    if (onClick) {
      marker.addEventListener("gmp-click", () => onClick(f));
    }
    mapa3d.append(marker);
    return marker;
  });
}

export function opcionesMapaNicaragua(maps, { center, zoom, mapTypeId = "hybrid" } = {}) {
  return {
    center: center || NICARAGUA_CENTER,
    zoom: zoom ?? 6.4,
    minZoom: 6,
    maxZoom: 20,
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
