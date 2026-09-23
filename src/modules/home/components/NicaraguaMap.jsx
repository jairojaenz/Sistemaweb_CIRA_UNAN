import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAPAS_BASE,
  cargarGoogleMaps,
  cargarMaps3d,
  crearMapa3d,
  iniciarRotacionGlobo,
  iniciarOrbitaAlrededorPunto,
  destruirMapa3d,
  escucharPantallaCompleta,
  estaEnPantallaCompleta,
  googleMapsApiKey,
  iconoPin,
  mapTypeDeCapa,
  modoMapa3d,
  opcionesMapaNicaragua,
  redimensionarMapa,
  salirPantallaCompleta,
  sincronizarMarcadores3d,
  solicitarPantallaCompleta,
  volarYOrbitarPunto3d,
  ajustarRango3d,
  vincularMantenerInclinacion3d,
} from "../../../utils/googleMapsNicaragua.js";
import IconoPantallaCompleta from "../../../components/IconoPantallaCompleta.jsx";

const MODOS = [
  { id: "clientes", label: "Clientes" },
  { id: "muestras", label: "Muestras" },
];

function numero(value) {
  const n = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function parseTextoCoordenadas(texto) {
  const raw = String(texto ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return normalizarLatLng(parts[0], parts[1]);
}

function normalizarLatLng(latRaw, lngRaw) {
  const lat = numero(latRaw);
  const lng = numero(lngRaw);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    if (lng >= -90 && lng <= 90 && lat >= -180 && lat <= 180) {
      return { lat: lng, lng: lat };
    }
    return null;
  }
  return { lat, lng };
}

function featurePunto({ id, lat, lng, nombre, departamento, municipio, origen, matriz, plan, idGrupo }) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      id,
      idGrupo: idGrupo || id,
      nombre: nombre || "Punto",
      departamento: departamento || "",
      municipio: municipio || "",
      origen: origen || "",
      matriz: matriz || "",
      plan: plan || "",
      lat,
      lng,
    },
  };
}

function featuresDesdeApi(puntos) {
  return (puntos ?? [])
    .map((item, index) => {
      const coords =
        normalizarLatLng(item.latitud ?? item.Latitud, item.longitud ?? item.Longitud) ||
        parseTextoCoordenadas(item.coordenadas ?? item.Coordenadas);
      if (!coords) return null;
      return featurePunto({
        id: item.id ?? item.Id ?? `punto-${index}`,
        lat: coords.lat,
        lng: coords.lng,
        nombre: item.nombre ?? item.Nombre,
        departamento: item.departamento ?? item.Departamento,
        municipio: item.municipio ?? item.Municipio,
        origen: item.origen ?? item.Origen,
        matriz: item.matriz ?? item.Matriz,
        plan: item.plan ?? item.Plan,
        idGrupo: item.idGrupo ?? item.IdGrupo,
      });
    })
    .filter(Boolean);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(props) {
  const extra = [props.municipio, props.matriz, props.plan].filter(Boolean).join(" · ");
  return `<div class="dash-map-popup">
    <p class="dash-map-popup-title">${escapeHtml(props.nombre)}</p>
    ${props.departamento ? `<p class="dash-map-popup-meta">${escapeHtml(props.departamento)}</p>` : ""}
    ${extra ? `<p class="dash-map-popup-meta">${escapeHtml(extra)}</p>` : ""}
    <p class="dash-map-popup-src">${escapeHtml(props.origen)}</p>
  </div>`;
}

function syncMarkers(maps, map, features, markersRef, infoRef) {
  markersRef.current.forEach((m) => m.setMap(null));
  const icon = iconoPin(maps);
  markersRef.current = (features ?? []).map((f) => {
    const marker = new maps.Marker({
      map,
      position: { lat: f.properties.lat, lng: f.properties.lng },
      icon,
      title: f.properties.nombre,
    });
    marker.addListener("click", () => {
      if (!infoRef.current) infoRef.current = new maps.InfoWindow();
      infoRef.current.setContent(popupHtml(f.properties));
      infoRef.current.open({ map, anchor: marker });
    });
    return marker;
  });
}

export default function NicaraguaMap({
  puntos = [],
  modo = "muestras",
  onModo,
  cargando = false,
  alturaMapa = "h-[340px]",
  vista3dInicial = false,
  mapaGlobo = false,
  rellenoPantalla = false,
}) {
  const pantallaRef = useRef(null);
  const mapEl = useRef(null);
  const map3dHost = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const mapa3dRef = useRef(null);
  const lib3dRef = useRef(null);
  const markersRef = useRef([]);
  const infoRef = useRef(null);
  const featuresRef = useRef([]);
  const [capaBase, setCapaBase] = useState("satelite");
  const [errorMapa, setErrorMapa] = useState("");
  const [error3d, setError3d] = useState("");
  const [completo, setCompleto] = useState(false);
  const [vista3d, setVista3d] = useState(false);
  const [cargando3d, setCargando3d] = useState(false);
  const vista3dRef = useRef(false);
  const rotacionGloboCleanupRef = useRef(null);
  const mantenerTiltCleanupRef = useRef(null);
  const puntoOrbitaRef = useRef(null);
  const centroGloboRef = useRef(null);
  const [giroOrbitalActivo, setGiroOrbitalActivo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [listaOculta, setListaOculta] = useState(false);

  function avisoGiroDetenido() {
    setGiroOrbitalActivo(false);
  }

  function pararGiroOrbital() {
    rotacionGloboCleanupRef.current?.();
    rotacionGloboCleanupRef.current = null;
    mapa3dRef.current?.stopCameraAnimation?.();
    setGiroOrbitalActivo(false);
  }

  function iniciarGiroOrbital() {
    const mapa = mapa3dRef.current;
    if (!mapa || !vista3dRef.current) return;

    rotacionGloboCleanupRef.current?.();
    rotacionGloboCleanupRef.current = null;

    const rangeActual = Number(mapa.range);
    const tiltActual = Number(mapa.tilt);
    const centro = mapa.center;
    const latPunto = puntoOrbitaRef.current?.lat ?? Number(centro?.lat);
    const lngPunto = puntoOrbitaRef.current?.lng ?? Number(centro?.lng);
    if (!Number.isFinite(latPunto) || !Number.isFinite(lngPunto)) return;

    rotacionGloboCleanupRef.current = iniciarOrbitaAlrededorPunto(mapa, {
      lat: latPunto,
      lng: lngPunto,
      range: Number.isFinite(rangeActual) ? rangeActual : undefined,
      tilt: Number.isFinite(tiltActual) ? tiltActual : undefined,
      alDetenerse: avisoGiroDetenido,
    });
    setGiroOrbitalActivo(true);
  }

  function alternarGiroOrbital() {
    if (giroOrbitalActivo) {
      pararGiroOrbital();
      return;
    }
    iniciarGiroOrbital();
  }

  const features = useMemo(() => featuresDesdeApi(puntos), [puntos]);
  const listaLateral = useMemo(() => {
    const seen = new Map();
    features.forEach((f) => {
      const key = f.properties.idGrupo || f.properties.id;
      if (!seen.has(key)) seen.set(key, f);
    });
    const items = [...seen.values()];
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => {
      const nombre = String(f.properties.nombre || "").toLowerCase();
      const plan = String(f.properties.plan || "").toLowerCase();
      return nombre.includes(q) || plan.includes(q);
    });
  }, [features, busqueda]);
  featuresRef.current = features;

  useEffect(() => {
    setBusqueda("");
  }, [modo]);

  useEffect(() => {
    const id = window.setTimeout(() => redimensionarMapa(mapRef.current), 80);
    return () => window.clearTimeout(id);
  }, [listaOculta]);
  const estado = cargando ? "cargando" : features.length ? "listo" : "vacio";
  const esClientes = modo === "clientes";
  const sinKey = !googleMapsApiKey();

  useEffect(() => {
    if (sinKey || !mapEl.current) return undefined;

    let cancelled = false;

    cargarGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapEl.current) return;
        mapsRef.current = maps;
        const created = new maps.Map(
          mapEl.current,
          opcionesMapaNicaragua(maps, {
            zoom: 6.4,
            mapTypeId: mapTypeDeCapa("satelite"),
            zoomControl: false,
          }),
        );
        mapRef.current = created;
        syncMarkers(maps, created, featuresRef.current, markersRef, infoRef);
      })
      .catch((err) => {
        if (!cancelled) setErrorMapa(err?.message || "No se pudo cargar Google Maps");
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (infoRef.current) {
        infoRef.current.close();
        infoRef.current = null;
      }
      pararGiroOrbital();
      mantenerTiltCleanupRef.current?.();
      mantenerTiltCleanupRef.current = null;
      destruirMapa3d(map3dHost.current);
      mapa3dRef.current = null;
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, [sinKey]);

  useEffect(() => {
    if (!vista3dInicial || sinKey) return undefined;
    const id = window.setTimeout(() => {
      if (!vista3dRef.current && map3dHost.current) {
        vista3dRef.current = true;
        setVista3d(true);
        activarVista3d();
      }
    }, 500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con vista3dInicial
  }, [vista3dInicial, sinKey]);

  useEffect(() => {
    if (mapRef.current && mapsRef.current && !vista3dRef.current) {
      syncMarkers(mapsRef.current, mapRef.current, features, markersRef, infoRef);
    }
    if (vista3dRef.current && mapa3dRef.current && lib3dRef.current) {
      sincronizarMarcadores3d(lib3dRef.current, mapa3dRef.current, features, irAPunto);
    }
  }, [features]);

  useEffect(() => {
    return escucharPantallaCompleta(() => {
      const activo = estaEnPantallaCompleta(pantallaRef.current);
      setCompleto(activo);
      window.setTimeout(() => redimensionarMapa(mapRef.current), 80);
    });
  }, []);

  function alternarPantallaCompleta() {
    if (estaEnPantallaCompleta(pantallaRef.current)) {
      salirPantallaCompleta();
      return;
    }
    solicitarPantallaCompleta(pantallaRef.current);
  }

  function cambiarCapa(id) {
    setCapaBase(id);
    if (vista3dRef.current && mapa3dRef.current) {
      mapa3dRef.current.mode = modoMapa3d(id);
      return;
    }
    if (mapRef.current) mapRef.current.setMapTypeId(mapTypeDeCapa(id));
  }

  async function activarVista3d() {
    if (!map3dHost.current) return;
    setCargando3d(true);
    setError3d("");
    try {
      const lib = await cargarMaps3d();
      if (!vista3dRef.current) return;
      lib3dRef.current = lib;
      const center = mapRef.current?.getCenter?.();
      const centroMapa = center ? { lat: center.lat(), lng: center.lng() } : undefined;
      mapa3dRef.current = crearMapa3d(lib, map3dHost.current, {
        center: centroMapa,
        zoom: mapRef.current?.getZoom?.() ?? (mapaGlobo ? 4.2 : 6.4),
        idCapa: "satelite",
        restringirNicaragua: !mapaGlobo,
      });
      mantenerTiltCleanupRef.current?.();
      mantenerTiltCleanupRef.current = vincularMantenerInclinacion3d(mapa3dRef.current);
      sincronizarMarcadores3d(lib, mapa3dRef.current, featuresRef.current, irAPunto);
      centroGloboRef.current = centroMapa;
      puntoOrbitaRef.current = null;
      pararGiroOrbital();
      if (mapaGlobo) {
        rotacionGloboCleanupRef.current = iniciarRotacionGlobo(mapa3dRef.current, {
          center: centroMapa,
          alDetenerse: avisoGiroDetenido,
        });
        setGiroOrbitalActivo(true);
      }
      setCapaBase("satelite");
    } catch (err) {
      vista3dRef.current = false;
      setVista3d(false);
      setError3d(
        err?.message ||
          "No se pudo abrir la vista 3D. En Google Cloud activa Maps JavaScript API y Map Tiles API.",
      );
    } finally {
      setCargando3d(false);
    }
  }

  function apagarVista3d() {
    pararGiroOrbital();
    mantenerTiltCleanupRef.current?.();
    mantenerTiltCleanupRef.current = null;
    destruirMapa3d(map3dHost.current);
    mapa3dRef.current = null;
    window.setTimeout(() => redimensionarMapa(mapRef.current), 80);
  }

  function alternarVista3d() {
    const next = !vista3dRef.current;
    vista3dRef.current = next;
    setVista3d(next);
    if (next) {
      activarVista3d();
      return;
    }
    apagarVista3d();
  }

  function cambiarZoom(delta) {
    if (vista3dRef.current && mapa3dRef.current) {
      pararGiroOrbital();
      ajustarRango3d(mapa3dRef.current, delta > 0 ? 0.72 : 1.38);
      return;
    }
    if (!mapRef.current) return;
    const actual = mapRef.current.getZoom?.();
    if (actual == null) return;
    const min = 6;
    const max = 20;
    mapRef.current.setZoom(Math.min(max, Math.max(min, actual + delta)));
  }

  function irAPunto(feature) {
    if (!feature) return;
    if (vista3dRef.current && mapa3dRef.current) {
      puntoOrbitaRef.current = {
        lat: feature.properties.lat,
        lng: feature.properties.lng,
        zoom: 16,
      };
      pararGiroOrbital();
      setGiroOrbitalActivo(true);
      rotacionGloboCleanupRef.current = volarYOrbitarPunto3d(
        mapa3dRef.current,
        {
          lat: feature.properties.lat,
          lng: feature.properties.lng,
          zoom: 16,
        },
        {
          orbitaAlFinal: true,
          alDetenerse: avisoGiroDetenido,
        },
      );
      return;
    }
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat: feature.properties.lat, lng: feature.properties.lng });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 14));
  }

  const mapaShellClass = rellenoPantalla
    ? "h-full rounded-none ring-0"
    : `rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 ${completo ? "h-full" : alturaMapa}`;

  return (
    <div
      ref={pantallaRef}
      className={`dash-mapa-fs grid ${
        rellenoPantalla
          ? `geoloc-mapa-fs h-full min-h-0 flex-1 gap-0 bg-black ${
              listaOculta ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_16rem]"
            }`
          : `${listaOculta ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_11rem]"} gap-4 bg-gray-100 dark:bg-[#0d053c] ${completo ? "h-full p-4" : ""}`
      }`}
    >
      <div className={`relative min-h-0 ${rellenoPantalla || completo ? "h-full" : ""}`}>
        <div
          ref={mapEl}
          className={`dash-demanda-map w-full overflow-hidden ${mapaShellClass} ${vista3d ? "invisible" : ""}`}
        />
        <div
          ref={map3dHost}
          className={`dash-demanda-map absolute inset-0 overflow-hidden ${mapaShellClass} ${
            vista3d ? "" : "hidden"
          }`}
        />
        <div className="absolute left-2 top-2 z-20 flex flex-col gap-1.5">
          <div
            className={`flex overflow-hidden rounded-lg ${
              rellenoPantalla
                ? "geoloc-mapa-control"
                : "bg-white/95 shadow-md ring-1 ring-slate-200 dark:bg-[#251d50]/90 dark:ring-white/10"
            }`}
          >
            {MODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onModo?.(m.id)}
                className={`px-2.5 py-1 text-[10px] font-semibold ${
                  modo === m.id
                    ? rellenoPantalla
                      ? "geoloc-mapa-control-activo"
                      : "bg-sky-400 text-[#07111f]"
                    : `geoloc-mapa-control-inactivo ${
                        rellenoPantalla
                          ? ""
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      }`
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {!sinKey && !errorMapa ? (
            <div
              className={`flex w-10 flex-col overflow-hidden rounded ${
                rellenoPantalla
                  ? "geoloc-mapa-control geoloc-mapa-btn-flotante"
                  : "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] dark:bg-[#251d50]/95 dark:ring-1 dark:ring-white/10"
              }`}
              aria-label="Zoom del mapa"
            >
              <button
                type="button"
                onClick={() => cambiarZoom(1)}
                title="Acercar"
                aria-label="Acercar"
                className={`flex h-10 w-10 items-center justify-center text-xl font-light leading-none ${
                  rellenoPantalla
                    ? "text-slate-200 hover:bg-white/10 hover:text-white"
                    : "text-[#666] hover:bg-slate-50 hover:text-[#333] dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                +
              </button>
              <div
                className={`h-px shrink-0 ${rellenoPantalla ? "bg-white/15" : "bg-slate-200 dark:bg-white/15"}`}
              />
              <button
                type="button"
                onClick={() => cambiarZoom(-1)}
                title="Alejar"
                aria-label="Alejar"
                className={`flex h-10 w-10 items-center justify-center text-xl font-light leading-none ${
                  rellenoPantalla
                    ? "text-slate-200 hover:bg-white/10 hover:text-white"
                    : "text-[#666] hover:bg-slate-50 hover:text-[#333] dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                −
              </button>
            </div>
          ) : null}
        </div>
        <div
          className={`absolute right-2 top-2 z-20 flex overflow-hidden rounded-lg ${
            rellenoPantalla
              ? "geoloc-mapa-control"
              : "bg-white/95 shadow-md ring-1 ring-slate-200 dark:bg-[#251d50]/90 dark:ring-white/10"
          }`}
        >
          {CAPAS_BASE.map((capa) => (
            <button
              key={capa.id}
              type="button"
              onClick={() => cambiarCapa(capa.id)}
              className={`px-2.5 py-1 text-[10px] font-semibold ${
                capaBase === capa.id
                  ? rellenoPantalla
                    ? "geoloc-mapa-control-activo"
                    : "bg-sky-400 text-[#07111f]"
                  : `geoloc-mapa-control-inactivo ${
                      rellenoPantalla
                        ? ""
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                    }`
              }`}
            >
              {capa.label}
            </button>
          ))}
        </div>
        {listaOculta ? (
          <button
            type="button"
            onClick={() => setListaOculta(false)}
            title={esClientes ? "Mostrar clientes" : "Mostrar planes de muestreo"}
            aria-label={esClientes ? "Mostrar clientes" : "Mostrar planes de muestreo"}
            className={
              rellenoPantalla
                ? "geoloc-lista-abrir geoloc-mapa-btn-flotante absolute right-0 top-1/2 z-20 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-l-lg"
                : "absolute right-0 top-1/2 z-20 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-l-lg bg-white text-slate-600 shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:text-slate-900 dark:bg-[#251d50] dark:text-slate-200"
            }
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12.78 4.22a.75.75 0 010 1.06L8.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={alternarVista3d}
            title={vista3d ? "Salir de vista 3D" : "Vista 3D"}
            aria-label={vista3d ? "Salir de vista 3D" : "Vista 3D"}
            aria-pressed={vista3d}
            className={`geoloc-mapa-btn-flotante flex h-10 w-10 items-center justify-center rounded text-[13px] font-bold ${
              vista3d
                ? "geoloc-mapa-btn-flotante--activo"
                : rellenoPantalla
                  ? ""
                  : "bg-white text-[#666] shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:text-[#333]"
            }`}
          >
            3D
          </button>
          {vista3d && !sinKey ? (
            <button
              type="button"
              onClick={alternarGiroOrbital}
              title={giroOrbitalActivo ? "Desactivar giro orbital" : "Activar giro orbital"}
              aria-label={giroOrbitalActivo ? "Desactivar giro orbital" : "Activar giro orbital"}
              aria-pressed={giroOrbitalActivo}
              className={`geoloc-mapa-btn-flotante flex h-10 w-10 items-center justify-center rounded text-lg ${
                giroOrbitalActivo
                  ? "geoloc-mapa-btn-flotante--activo"
                  : rellenoPantalla
                    ? ""
                    : "bg-white text-[#666] shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:text-[#333]"
              }`}
            >
              <span className={giroOrbitalActivo ? "inline-block animate-spin" : ""} aria-hidden>
                ↻
              </span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={alternarPantallaCompleta}
            title={completo ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label={completo ? "Salir de pantalla completa" : "Pantalla completa"}
            className={`geoloc-mapa-btn-flotante flex h-10 w-10 items-center justify-center rounded ${
              rellenoPantalla
                ? ""
                : "bg-white text-[#666] shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:text-[#333]"
            }`}
          >
            <IconoPantallaCompleta activo={completo} />
          </button>
        </div>
        {error3d ? (
          <div className="absolute bottom-14 left-2 right-14 z-20 rounded-lg bg-white/95 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-slate-200 dark:bg-[#251d50]/90 dark:text-amber-100 dark:ring-white/10">
            {error3d}
          </div>
        ) : null}
        {sinKey || errorMapa ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 px-4 text-center text-xs text-amber-800 dark:bg-[#251d50]/80 dark:text-amber-100">
            {sinKey
              ? "Pega tu API key de Google Maps en .env.development (VITE_GOOGLE_MAPS_API_KEY) y reinicia npm run dev."
              : errorMapa}
          </div>
        ) : null}
        {cargando3d ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-xs text-slate-700 dark:bg-[#251d50]/45 dark:text-sky-100">
            Cargando vista 3D…
          </div>
        ) : null}
        {estado === "cargando" && !sinKey && !vista3d ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-xs text-slate-700 dark:bg-[#251d50]/45 dark:text-sky-100">
            {esClientes ? "Cargando clientes…" : "Cargando planes de muestreo…"}
          </div>
        ) : null}
        {estado === "vacio" && !sinKey && !errorMapa && !vista3d ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 text-xs text-slate-600 dark:bg-[#251d50]/45 dark:text-slate-200">
            {esClientes
              ? "No hay clientes con coordenadas"
              : "No hay planes de muestreo con coordenadas"}
          </div>
        ) : null}
      </div>

      <div
        className={`dash-mapa-lista flex min-h-0 flex-col ${
          listaOculta ? "hidden" : ""
        } ${
          rellenoPantalla
            ? "h-full border-l border-white/10 bg-black py-2 pl-2 pr-1"
            : completo
              ? "h-full"
              : alturaMapa
        }`}
      >
        <div className="mb-2 flex shrink-0 items-center gap-1 px-1">
          <p
            className={`min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] ${
              rellenoPantalla ? "geoloc-lista-titulo text-slate-400" : "text-slate-500"
            }`}
          >
            {esClientes ? "Clientes" : "Planes de muestreo"}
          </p>
          <button
            type="button"
            onClick={() => setListaOculta(true)}
            title="Ocultar lista"
            aria-label="Ocultar lista"
            className={
              rellenoPantalla
                ? "geoloc-lista-cerrar flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            }
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M5.22 5.22a.75.75 0 011.06 0L10 8.94l3.72-3.72a.75.75 0 111.06 1.06L11.06 10l3.72 3.72a.75.75 0 11-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 01-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="relative mb-2 shrink-0 px-1">
          <svg
            className={`pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 ${
              rellenoPantalla ? "text-slate-500" : "text-slate-400"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M8.5 3a5.5 5.5 0 013.96 9.24l3.15 3.15a.75.75 0 11-1.06 1.06l-3.15-3.15A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={esClientes ? "Buscar cliente..." : "Buscar por nombre..."}
            aria-label={esClientes ? "Filtrar clientes por nombre" : "Filtrar muestras por nombre"}
            className={
              rellenoPantalla
                ? "geoloc-lista-busqueda w-full rounded-xl py-1.5 pl-7 pr-2 text-[11px] outline-none"
                : "w-full rounded-xl bg-white py-1.5 pl-7 pr-2 text-[11px] text-slate-700 ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:ring-blue-300 dark:bg-[#251d50] dark:text-slate-200 dark:ring-white/10 dark:placeholder:text-slate-500 dark:focus:ring-sky-400/40"
            }
          />
        </div>
        <ul className="dash-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
          {listaLateral.length ? (
            listaLateral.map((f, i) => (
              <li key={f.properties.id}>
                <button
                  type="button"
                  onClick={() => irAPunto(f)}
                  className={
                    rellenoPantalla
                      ? "geoloc-lista-btn flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-left transition"
                      : "flex w-full items-center gap-2 rounded-2xl bg-white px-2.5 py-2 text-left ring-1 ring-slate-200 transition hover:ring-blue-300 dark:bg-[#251d50] dark:ring-white/10 dark:hover:ring-sky-400/40"
                  }
                >
                  <span
                    className={
                      rellenoPantalla
                        ? "geoloc-lista-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                        : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-800 dark:bg-sky-400/15 dark:text-sky-200"
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="geoloc-lista-texto min-w-0 flex-1">
                    <span className="block truncate text-[11px]">
                      {f.properties.plan || f.properties.nombre}
                    </span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li
              className={`px-2.5 text-[11px] ${rellenoPantalla ? "geoloc-lista-vacio" : "text-slate-500"}`}
            >
              {busqueda.trim()
                ? "Sin coincidencias"
                : esClientes
                  ? "Sin clientes aún"
                  : "Sin planes aún"}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
