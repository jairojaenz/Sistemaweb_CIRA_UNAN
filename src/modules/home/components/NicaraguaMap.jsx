import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAPAS_BASE,
  cargarGoogleMaps,
  googleMapsApiKey,
  iconoPin,
  mapTypeDeCapa,
  opcionesMapaNicaragua,
} from "../../../utils/googleMapsNicaragua.js";

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
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const markersRef = useRef([]);
  const infoRef = useRef(null);
  const featuresRef = useRef([]);
  const [capaBase, setCapaBase] = useState("satelite");
  const [errorMapa, setErrorMapa] = useState("");

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
          opcionesMapaNicaragua({ zoom: 6.4, mapTypeId: mapTypeDeCapa("satelite") }),
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
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, [sinKey]);

  useEffect(() => {
    if (mapRef.current && mapsRef.current) {
      syncMarkers(mapsRef.current, mapRef.current, features, markersRef, infoRef);
    }
  }, [features]);

  function cambiarCapa(id) {
    setCapaBase(id);
    if (mapRef.current) mapRef.current.setMapTypeId(mapTypeDeCapa(id));
  }

  function irAPunto(feature) {
    if (!feature || !mapRef.current) return;
    mapRef.current.panTo({ lat: feature.properties.lat, lng: feature.properties.lng });
    mapRef.current.setZoom(11);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="relative">
        <div
          ref={mapEl}
          className="dash-demanda-map h-[340px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10"
        />
        <div className="absolute left-2 top-2 z-10 flex overflow-hidden rounded-lg bg-[#251d50]/90 shadow-md ring-1 ring-white/10">
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
        <div className="absolute right-2 top-2 z-10 flex overflow-hidden rounded-lg bg-[#251d50]/90 shadow-md ring-1 ring-white/10">
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
        {sinKey || errorMapa ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/80 px-4 text-center text-xs text-amber-100">
            {sinKey
              ? "Pega tu API key de Google Maps en .env.development (VITE_GOOGLE_MAPS_API_KEY) y reinicia npm run dev."
              : errorMapa}
          </div>
        ) : null}
        {estado === "cargando" && !sinKey ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/45 text-xs text-sky-100">
            {esClientes ? "Cargando clientes…" : "Cargando planes de muestreo…"}
          </div>
        ) : null}
        {estado === "vacio" && !sinKey && !errorMapa ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-[#251d50]/45 text-xs text-slate-200">
            {esClientes
              ? "No hay clientes con coordenadas"
              : "No hay planes de muestreo con coordenadas"}
          </div>
        ) : null}
      </div>

      <div className="flex h-[340px] min-h-0 flex-col">
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
