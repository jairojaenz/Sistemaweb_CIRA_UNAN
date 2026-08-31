import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAPAS_BASE,
  cargarGoogleMaps,
  cargarMaps3d,
  crearMapa3d,
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
  volarAPunto3d,
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

  const features = useMemo(() => featuresDesdeApi(puntos), [puntos]);
  const listaLateral = useMemo(() => {
    const seen = new Map();
    features.forEach((f) => {
      const key = f.properties.idGrupo || f.properties.id;
      if (!seen.has(key)) seen.set(key, f);
    });
    return [...seen.values()];
  }, [features]);
  featuresRef.current = features;
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
          opcionesMapaNicaragua(maps, { zoom: 6.4, mapTypeId: mapTypeDeCapa("satelite") }),
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
      destruirMapa3d(map3dHost.current);
      mapa3dRef.current = null;
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, [sinKey]);

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
      mapa3dRef.current = crearMapa3d(lib, map3dHost.current, {
        center: center ? { lat: center.lat(), lng: center.lng() } : undefined,
        zoom: mapRef.current?.getZoom?.() ?? 6.4,
        idCapa: "satelite",
      });
      sincronizarMarcadores3d(lib, mapa3dRef.current, featuresRef.current, irAPunto);
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

  function irAPunto(feature) {
    if (!feature) return;
    if (vista3dRef.current && mapa3dRef.current) {
      volarAPunto3d(mapa3dRef.current, {
        lat: feature.properties.lat,
        lng: feature.properties.lng,
        zoom: 15,
      });
      return;
    }
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat: feature.properties.lat, lng: feature.properties.lng });
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 14));
  }

  return (
    <div
      ref={pantallaRef}
      className={`dash-mapa-fs grid gap-4 bg-[#0d053c] lg:grid-cols-[minmax(0,1fr)_11rem] ${
        completo ? "h-full p-4" : ""
      }`}
    >
      <div className={`relative min-h-0 ${completo ? "h-full" : ""}`}>
        <div
          ref={mapEl}
          className={`dash-demanda-map w-full overflow-hidden rounded-2xl ring-1 ring-white/10 ${
            completo ? "h-full" : "h-[340px]"
          } ${vista3d ? "invisible" : ""}`}
        />
        <div
          ref={map3dHost}
          className={`dash-demanda-map absolute inset-0 overflow-hidden rounded-2xl ring-1 ring-white/10 ${
            vista3d ? "" : "hidden"
          }`}
        />
        <div className="absolute left-2 top-2 z-20 flex overflow-hidden rounded-lg bg-[#251d50]/90 shadow-md ring-1 ring-white/10">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModo?.(m.id)}
              className={`px-2.5 py-1 text-[10px] font-semibold ${
                modo === m.id ? "bg-sky-400 text-[#07111f]" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="absolute right-2 top-2 z-20 flex overflow-hidden rounded-lg bg-[#251d50]/90 shadow-md ring-1 ring-white/10">
          {CAPAS_BASE.map((capa) => (
            <button
              key={capa.id}
              type="button"
              onClick={() => cambiarCapa(capa.id)}
              className={`px-2.5 py-1 text-[10px] font-semibold ${
                capaBase === capa.id ? "bg-sky-400 text-[#07111f]" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {capa.label}
            </button>
          ))}
        </div>
        <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={alternarVista3d}
            title={vista3d ? "Salir de vista 3D" : "Vista 3D"}
            aria-label={vista3d ? "Salir de vista 3D" : "Vista 3D"}
            aria-pressed={vista3d}
            className={`flex h-10 w-10 items-center justify-center rounded text-[13px] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.3)] ${
              vista3d ? "bg-[#1a73e8] text-white" : "bg-white text-[#666] hover:text-[#333]"
            }`}
          >
            3D
          </button>
          <button
            type="button"
            onClick={alternarPantallaCompleta}
            title={completo ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label={completo ? "Salir de pantalla completa" : "Pantalla completa"}
            className="flex h-10 w-10 items-center justify-center rounded bg-white text-[#666] shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:text-[#333]"
          >
            <IconoPantallaCompleta activo={completo} />
          </button>
        </div>
        {error3d ? (
          <div className="absolute bottom-14 left-2 right-14 z-20 rounded-lg bg-[#251d50]/90 px-3 py-2 text-[11px] text-amber-100 ring-1 ring-white/10">
            {error3d}
          </div>
        ) : null}
        {sinKey || errorMapa ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/80 px-4 text-center text-xs text-amber-100">
            {sinKey
              ? "Pega tu API key de Google Maps en .env.development (VITE_GOOGLE_MAPS_API_KEY) y reinicia npm run dev."
              : errorMapa}
          </div>
        ) : null}
        {cargando3d ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/45 text-xs text-sky-100">
            Cargando vista 3D…
          </div>
        ) : null}
        {estado === "cargando" && !sinKey && !vista3d ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/45 text-xs text-sky-100">
            {esClientes ? "Cargando clientes…" : "Cargando planes de muestreo…"}
          </div>
        ) : null}
        {estado === "vacio" && !sinKey && !errorMapa && !vista3d ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/45 text-xs text-slate-200">
            {esClientes
              ? "No hay clientes con coordenadas"
              : "No hay planes de muestreo con coordenadas"}
          </div>
        ) : null}
      </div>

      <div className={`dash-mapa-lista flex min-h-0 flex-col ${completo ? "h-full" : "h-[340px]"}`}>
        <p className="mb-2 shrink-0 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {esClientes ? "Clientes" : "Planes de muestreo"}
        </p>
        <ul className="dash-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
          {listaLateral.length ? (
            listaLateral.map((f, i) => (
              <li key={f.properties.id}>
                <button
                  type="button"
                  onClick={() => irAPunto(f)}
                  className="flex w-full items-center gap-2 rounded-2xl bg-[#251d50] px-2.5 py-2 text-left ring-1 ring-white/10 transition hover:ring-sky-400/40"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-[10px] font-semibold text-sky-200">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] text-slate-200">
                      {f.properties.plan || f.properties.nombre}
                    </span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-2.5 text-[11px] text-slate-500">
              {esClientes ? "Sin clientes aún" : "Sin planes aún"}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
