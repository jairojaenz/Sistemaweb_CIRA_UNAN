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

/** Vista planetaria completa (Geolocalización / globo). */
export const GLOBE_RANGE = 28_500_000;
export const GLOBE_TILT = 0;
export const GLOBE_HEADING = 0;
export const GLOBE_ROTATION_MS = 90_000;

export function camaraGloboDesdeCentro(center) {
  const punto = center || NICARAGUA_CENTER;
  return {
    center: { lat: punto.lat, lng: punto.lng, altitude: 0 },
    range: GLOBE_RANGE,
    tilt: GLOBE_TILT,
    heading: GLOBE_HEADING,
  };
}

export const PUNTO_RANGE_MIN = 380;
export const PUNTO_RANGE_MAX = 2_500_000;

export function rangoDesdeZoom(zoom) {
  const z = Number(zoom);
  const seguro = Number.isFinite(z) ? z : 6.4;
  const estimado = Math.round(1100000 * Math.pow(0.5, seguro - 6));
  return Math.min(PUNTO_RANGE_MAX, Math.max(PUNTO_RANGE_MIN, estimado));
}

/** En 3D la cámara debe seguir inclinada al alejar; solo el globo va en picada. */
export function inclinacionSegunRango(range) {
  const r = Number(range);
  if (!Number.isFinite(r) || r >= 8_000_000) return GLOBE_TILT;
  if (r >= 600_000) return 52;
  return TILT_3D;
}

function centroActual3d(mapa3d) {
  const c = mapa3d?.center;
  const lat = Number(c?.lat);
  const lng = Number(c?.lng);
  const altitude = Number(c?.altitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { lat: NICARAGUA_CENTER.lat, lng: NICARAGUA_CENTER.lng, altitude: 0 };
  }
  return { lat, lng, altitude: Number.isFinite(altitude) ? altitude : 0 };
}

export function aplicarInclinacion3d(mapa3d, range) {
  if (!mapa3d) return;
  const r = Number.isFinite(Number(range)) ? Number(range) : numeroEnMapa3d(mapa3d, "range", 0);
  const tilt = inclinacionSegunRango(r);
  if (Math.abs(numeroEnMapa3d(mapa3d, "tilt", 0) - tilt) > 0.4) {
    mapa3d.tilt = tilt;
  }
}

export function acotarRangoPunto(mapa3d, fallback = PUNTO_RANGE_MIN) {
  if (!mapa3d) return fallback;
  const r = Number(mapa3d.range);
  const base = Number.isFinite(r) ? r : fallback;
  const acotado = Math.min(PUNTO_RANGE_MAX, Math.max(PUNTO_RANGE_MIN, base));
  if (Math.abs(acotado - base) > 2) mapa3d.range = acotado;
  return acotado;
}

/** factor < 1 acerca; factor > 1 aleja. Conserva la inclinación 3D. */
export function ajustarRango3d(mapa3d, factor) {
  if (!mapa3d) return;
  mapa3d.stopCameraAnimation?.();
  const r = acotarRangoPunto(mapa3d);
  const next = Math.min(PUNTO_RANGE_MAX, Math.max(PUNTO_RANGE_MIN, r * factor));
  const camera = {
    center: centroActual3d(mapa3d),
    range: next,
    tilt: inclinacionSegunRango(next),
    heading: numeroEnMapa3d(mapa3d, "heading", HEADING_3D),
  };
  if (typeof mapa3d.flyCameraTo === "function") {
    mapa3d.flyCameraTo({ endCamera: camera, durationMillis: 420 });
    return;
  }
  Object.assign(mapa3d, camera);
}

/** Si el gesto de zoom aplana la cámara, recupera la inclinación 3D. */
export function vincularMantenerInclinacion3d(mapa3d) {
  if (!mapa3d) return () => {};
  let rafId = 0;

  const restaurar = () => {
    const range = numeroEnMapa3d(mapa3d, "range", 0);
    aplicarInclinacion3d(mapa3d, range);
  };

  const programar = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(restaurar);
  };

  const onSteady = (ev) => {
    if (ev?.isSteady === true) restaurar();
  };

  mapa3d.addEventListener?.("gmp-steadychange", onSteady);
  const quitarWheel = enlazarEnContenedorMapa(mapa3d, "wheel", programar, {
    passive: true,
    capture: true,
  });

  return () => {
    cancelAnimationFrame(rafId);
    mapa3d.removeEventListener?.("gmp-steadychange", onSteady);
    quitarWheel();
  };
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

export function crearMapa3d(lib, host, { center, zoom, idCapa, restringirNicaragua = true } = {}) {
  const { Map3DElement } = lib;
  if (!Map3DElement) {
    throw new Error("Google Maps no devolvió Map3DElement");
  }
  const punto = center || NICARAGUA_CENTER;
  const zoomEfectivo = zoom ?? (restringirNicaragua ? 6.4 : 4.2);
  const camaraGlobo = camaraGloboDesdeCentro(punto);
  const base = {
    mode: modoMapa3d(idCapa),
    center: restringirNicaragua ? { lat: punto.lat, lng: punto.lng, altitude: 0 } : camaraGlobo.center,
    range: restringirNicaragua ? rangoDesdeZoom(zoomEfectivo) : camaraGlobo.range,
    tilt: restringirNicaragua ? TILT_3D : camaraGlobo.tilt,
    heading: restringirNicaragua ? HEADING_3D : camaraGlobo.heading,
    defaultUIHidden: true,
    gestureHandling: "GREEDY",
  };
  let mapa;
  try {
    mapa = new Map3DElement(
      restringirNicaragua ? { ...base, bounds: NICARAGUA_BOUNDS } : base,
    );
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

function numeroEnMapa3d(mapa3d, prop, fallback) {
  const n = Number(mapa3d?.[prop]);
  return Number.isFinite(n) ? n : fallback;
}

function nodosEscuchaMapa(mapa3d) {
  const nodos = [mapa3d].filter(Boolean);
  if (mapa3d?.parentElement) nodos.push(mapa3d.parentElement);
  return nodos;
}

function enlazarEnContenedorMapa(mapa3d, tipo, handler, opciones) {
  const quitar = [];
  nodosEscuchaMapa(mapa3d).forEach((n) => {
    n.addEventListener(tipo, handler, opciones);
    quitar.push(() =>
      n.removeEventListener(tipo, handler, opciones?.capture ? { capture: true } : undefined),
    );
  });
  return () => quitar.forEach((fn) => fn());
}

function aplicarCentroOrbita(mapa3d, centroFijo) {
  if (!mapa3d || !centroFijo) return;
  mapa3d.center = {
    lat: centroFijo.lat,
    lng: centroFijo.lng,
    altitude: centroFijo.altitude ?? 0,
  };
}

function enlazarDetenerAnimacionAlArrastrar(mapa3d, detener) {
  mapa3d.addEventListener?.("gmp-dragstart", detener);
  return () => mapa3d.removeEventListener?.("gmp-dragstart", detener);
}

/**
 * Giro automático alrededor del pin. Cualquier zoom o arrastre detiene el giro
 * y deja el mapa 3D libre (trackpad, botones +/-, mover el mapa).
 */
function vincularOrbitaContinua(mapa3d, { durationMillis, centroFijo, alDetenerse }) {
  let activo = true;
  let rafId = 0;
  let ultimoTs = 0;
  const gradosPorMs = 360 / durationMillis;
  const quitarGestos = [];

  const paso = (ts) => {
    if (!activo) return;
    aplicarCentroOrbita(mapa3d, centroFijo);
    if (ultimoTs > 0) {
      const dt = Math.min(ts - ultimoTs, 48);
      let heading = numeroEnMapa3d(mapa3d, "heading", 0);
      heading = (heading + gradosPorMs * dt) % 360;
      mapa3d.heading = heading < 0 ? heading + 360 : heading;
    }
    ultimoTs = ts;
    rafId = requestAnimationFrame(paso);
  };

  const cancelarOrbita = () => {
    if (!activo) return;
    activo = false;
    cancelAnimationFrame(rafId);
    mapa3d.stopCameraAnimation?.();
    quitarGestos.forEach((fn) => fn());
    quitarGestos.length = 0;
  };

  const liberarNavegacion = () => {
    cancelarOrbita();
    alDetenerse?.();
  };

  const lanzarOrbita = () => {
    if (!activo) return;
    cancelAnimationFrame(rafId);
    ultimoTs = 0;
    aplicarCentroOrbita(mapa3d, centroFijo);
    rafId = requestAnimationFrame(paso);

    quitarGestos.push(enlazarDetenerAnimacionAlArrastrar(mapa3d, liberarNavegacion));
    quitarGestos.push(
      enlazarEnContenedorMapa(mapa3d, "wheel", liberarNavegacion, { passive: true, capture: true }),
    );
    quitarGestos.push(
      enlazarEnContenedorMapa(mapa3d, "touchstart", (ev) => {
        if (ev.touches?.length >= 2) liberarNavegacion();
      }, { passive: true }),
    );
  };

  return {
    iniciar: lanzarOrbita,
    limpiar: cancelarOrbita,
  };
}

/**
 * Orbita la cámara alrededor del centro (planeta girando). Devuelve función de limpieza.
 */
export function iniciarRotacionGlobo(
  mapa3d,
  { center, durationMillis = GLOBE_ROTATION_MS, alDetenerse } = {},
) {
  if (!mapa3d) return () => {};

  const centroOrbita = camaraGloboDesdeCentro(center).center;
  const orbita = vincularOrbitaContinua(mapa3d, {
    durationMillis,
    centroFijo: centroOrbita,
    alDetenerse,
  });

  let fallbackId = 0;
  let iniciado = false;

  const orbitar = () => {
    if (iniciado) return;
    iniciado = true;
    orbita.iniciar();
  };

  const alEstabilizar = (ev) => {
    if (ev?.isSteady === true) orbitar();
  };

  mapa3d.addEventListener?.("gmp-steadychange", alEstabilizar);
  fallbackId = window.setTimeout(orbitar, 900);

  return () => {
    window.clearTimeout(fallbackId);
    mapa3d.removeEventListener?.("gmp-steadychange", alEstabilizar);
    orbita.limpiar();
  };
}

export const PUNTO_ORBIT_MS = 48_000;

export function camaraPuntoOrbita({ lat, lng, zoom }) {
  return {
    center: { lat, lng, altitude: 0 },
    range: rangoDesdeZoom(zoom ?? 14),
    tilt: TILT_3D,
    heading: HEADING_3D,
  };
}

export function anclarCamaraEnPunto(mapa3d, { lat, lng, zoom }) {
  if (!mapa3d) return;
  const cam = camaraPuntoOrbita({ lat, lng, zoom });
  mapa3d.center = cam.center;
  mapa3d.range = cam.range;
  mapa3d.tilt = cam.tilt;
  mapa3d.heading = cam.heading;
  acotarRangoPunto(mapa3d, cam.range);
}

export function iniciarOrbitaAlrededorPunto(
  mapa3d,
  { lat, lng, durationMillis = PUNTO_ORBIT_MS, alDetenerse } = {},
) {
  if (!mapa3d) return () => {};
  const centroOrbita = { lat, lng, altitude: 0 };
  const orbita = vincularOrbitaContinua(mapa3d, {
    durationMillis,
    centroFijo: centroOrbita,
    alDetenerse,
  });
  orbita.iniciar();
  return () => orbita.limpiar();
}

/** Vuela al marcador y, al llegar, orbita alrededor en bucle. Devuelve limpieza. */
export function volarYOrbitarPunto3d(
  mapa3d,
  { lat, lng, zoom },
  {
    flyDurationMillis = 1400,
    orbitDurationMillis = PUNTO_ORBIT_MS,
    orbitaAlFinal = true,
    alDetenerse,
  } = {},
) {
  if (!mapa3d) return () => {};

  const camera = camaraPuntoOrbita({ lat, lng, zoom });
  mapa3d.stopCameraAnimation?.();

  let cleanupOrbita = () => {};
  let orbitaIniciada = false;

  const comenzarOrbita = () => {
    if (orbitaIniciada || !orbitaAlFinal) return;
    orbitaIniciada = true;
    mapa3d.stopCameraAnimation?.();
    anclarCamaraEnPunto(mapa3d, { lat, lng, zoom });
    cleanupOrbita = iniciarOrbitaAlrededorPunto(mapa3d, {
      lat,
      lng,
      durationMillis: orbitDurationMillis,
      alDetenerse,
    });
  };

  const onFinVuelo = () => comenzarOrbita();
  const fallbackId = window.setTimeout(comenzarOrbita, flyDurationMillis + 250);

  if (typeof mapa3d.flyCameraTo === "function") {
    mapa3d.addEventListener("gmp-animationend", onFinVuelo, { once: true });
    mapa3d.flyCameraTo({ endCamera: camera, durationMillis: flyDurationMillis });
  } else {
    window.clearTimeout(fallbackId);
    Object.assign(mapa3d, camera);
    comenzarOrbita();
  }

  return () => {
    window.clearTimeout(fallbackId);
    mapa3d.removeEventListener?.("gmp-animationend", onFinVuelo);
    cleanupOrbita();
    mapa3d.stopCameraAnimation?.();
  };
}

export function volarAPunto3d(mapa3d, { lat, lng, zoom }) {
  if (!mapa3d) return;
  const camera = camaraPuntoOrbita({ lat, lng, zoom });
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

export function opcionesMapaNicaragua(maps, { center, zoom, mapTypeId = "hybrid", zoomControl = true } = {}) {
  return {
    center: center || NICARAGUA_CENTER,
    zoom: zoom ?? 6.4,
    minZoom: 6,
    maxZoom: 20,
    mapTypeId,
    disableDefaultUI: true,
    zoomControl,
    ...(zoomControl
      ? { zoomControlOptions: { position: maps.ControlPosition?.TOP_LEFT ?? 1 } }
      : {}),
    gestureHandling: "greedy",
    restriction: {
      latLngBounds: NICARAGUA_BOUNDS,
      strictBounds: false,
    },
  };
}
