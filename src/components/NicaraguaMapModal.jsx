/**
 * Modal de mapa para marcar coordenadas.
 * MapLibre GL + máscaras oficiales (hillshade y terreno 3D de Mapterhorn).
 * https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/
 * https://maplibre.org/maplibre-gl-js/docs/examples/add-a-hillshade-layer/
 */
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const NICARAGUA_CENTER = { lat: 12.8654, lng: -85.2072 };
const NICARAGUA_BOUNDS = [
  [-87.85, 10.65],
  [-82.55, 15.15],
];

const PIN_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 32 42" aria-hidden="true">
  <path fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"
    d="M16 1C8.3 1 2 7.3 2 15c0 10.5 14 25 14 25s14-14.5 14-25C30 7.3 23.7 1 16 1z"/>
  <circle cx="16" cy="15" r="5" fill="#fff"/>
</svg>`;

const CAPAS_BASE = [
  { id: "satelite", label: "Satélite" },
  { id: "calles", label: "Calles" },
  { id: "relieve", label: "Relieve" },
];

/** DEM de Mapterhorn (el que usa MapLibre en sus ejemplos de 3D y hillshade). */
const MAPTERHORN_DEM = {
  type: "raster-dem",
  url: "https://tiles.mapterhorn.com/tilejson.json",
};

/** Estilo raster + máscaras oficiales de MapLibre (hillshade + terreno 3D). */
function crearEstilo() {
  return {
    version: 8,
    sources: {
      satelite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "© Esri",
        maxzoom: 19,
      },
      etiquetas: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 19,
      },
      calles: {
        type: "raster",
        tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap, © CARTO",
        maxzoom: 19,
      },
      relieve: {
        type: "raster",
        tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap, SRTM | © OpenTopoMap",
        maxzoom: 17,
      },
      // Fuentes separadas: MapLibre recomienda una para 3D y otra para la máscara.
      terrainSource: { ...MAPTERHORN_DEM },
      hillshadeSource: { ...MAPTERHORN_DEM },
    },
    layers: [
      { id: "capa-satelite", type: "raster", source: "satelite" },
      { id: "capa-etiquetas", type: "raster", source: "etiquetas" },
      {
        id: "capa-calles",
        type: "raster",
        source: "calles",
        layout: { visibility: "none" },
      },
      {
        id: "capa-relieve",
        type: "raster",
        source: "relieve",
        layout: { visibility: "none" },
      },
      {
        id: "capa-hillshade",
        type: "hillshade",
        source: "hillshadeSource",
        layout: { visibility: "visible" },
        paint: {
          "hillshade-method": "standard",
          "hillshade-illumination-direction": 315,
          "hillshade-shadow-color": "#473B24",
          "hillshade-highlight-color": "#FFFFFF",
          "hillshade-accent-color": "#000000",
          "hillshade-exaggeration": 0.5,
        },
      },
    ],
    sky: {},
  };
}

function visibilidad(map, id, visible) {
  if (!map?.getLayer(id)) return;
  map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
}

function aplicarCapaBase(map, base) {
  visibilidad(map, "capa-satelite", base === "satelite");
  visibilidad(map, "capa-etiquetas", base === "satelite");
  visibilidad(map, "capa-calles", base === "calles");
  visibilidad(map, "capa-relieve", base === "relieve");
}

function aplicarMascara(map, activa) {
  visibilidad(map, "capa-hillshade", activa);
}

function aplicar3d(map, activa) {
  if (!map) return;
  try {
    if (activa) {
      map.setTerrain({ source: "terrainSource", exaggeration: 1 });
      map.easeTo({ pitch: 55, bearing: -18, duration: 700 });
    } else {
      map.setTerrain(null);
      map.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    }
  } catch (err) {
    console.warn("No se pudo aplicar la vista 3D:", err);
  }
}

export function parseLatLng(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function formatLatLng({ lat, lng }) {
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
}

export default function NicaraguaMapModal({
  open,
  initialValue = "",
  initialZoom,
  onConfirm,
  onCancel,
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const positionRef = useRef(NICARAGUA_CENTER);
  const [position, setPosition] = useState(NICARAGUA_CENTER);
  const [capaBase, setCapaBase] = useState("satelite");
  const [mascara, setMascara] = useState(true);
  const [vista3d, setVista3d] = useState(true);

  const updatePosition = (next) => {
    positionRef.current = next;
    setPosition(next);
  };

  const confirmar = () => {
    onConfirm(formatLatLng(positionRef.current));
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirmar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onConfirm]);

  useEffect(() => {
    if (!open) return undefined;

    const start = parseLatLng(initialValue) ?? NICARAGUA_CENTER;
    updatePosition(start);

    let cancelled = false;
    let map;

    import("maplibre-gl")
      .then((mod) => {
        if (cancelled || !mapEl.current) return;
        const maplibregl = mod.default ?? mod;

        const pinEl = document.createElement("div");
        pinEl.innerHTML = PIN_HTML;
        pinEl.style.cssText = "width:36px;height:48px;cursor:grab;line-height:0;";

        const zoom = initialZoom ?? (parseLatLng(initialValue) ? 12 : 7);
        const created = new maplibregl.Map({
          container: mapEl.current,
          style: crearEstilo(),
          center: [start.lng, start.lat],
          zoom,
          minZoom: 6,
          maxZoom: 18,
          maxPitch: 85,
          maxBounds: NICARAGUA_BOUNDS,
          attributionControl: true,
        });

        created.addControl(
          new maplibregl.NavigationControl({
            visualizePitch: true,
            showZoom: true,
            showCompass: true,
          }),
          "top-left",
        );
        created.addControl(
          new maplibregl.TerrainControl({
            source: "terrainSource",
            exaggeration: 1,
          }),
          "top-left",
        );

        const marker = new maplibregl.Marker({
          element: pinEl,
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([start.lng, start.lat])
          .addTo(created);

        const apply = (lngLat) => {
          marker.setLngLat(lngLat);
          updatePosition({ lat: lngLat.lat, lng: lngLat.lng });
        };

        marker.on("dragend", () => apply(marker.getLngLat()));
        created.on("click", (e) => apply(e.lngLat));

        created.on("load", () => {
          if (cancelled) return;
          aplicarCapaBase(created, "satelite");
          aplicarMascara(created, true);
          aplicar3d(created, true);
          created.resize();
        });

        map = created;
        mapRef.current = created;

        window.setTimeout(() => {
          if (!cancelled && map) map.resize();
        }, 80);
      })
      .catch((err) => {
        console.error("No se pudo iniciar el mapa:", err);
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
      if (map) {
        map.remove();
        map = undefined;
      }
    };
  }, [open, initialValue, initialZoom]);

  function cambiarCapa(id) {
    setCapaBase(id);
    aplicarCapaBase(mapRef.current, id);
  }

  function cambiarMascara(activa) {
    setMascara(activa);
    aplicarMascara(mapRef.current, activa);
  }

  function cambiar3d(activa) {
    setVista3d(activa);
    aplicar3d(mapRef.current, activa);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={confirmar}
    >
      <div
        className="flex h-[72vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-100 px-6 py-3">
          <h3 className="text-lg font-semibold text-blue-900">
            Ubicación en el mapa de Nicaragua
          </h3>
          <p className="mt-0.5 text-sm text-gray-600">
            Arrastre el pin o toque el mapa. Clic derecho y arrastre para girar en
            3D. El botón 3D muestra el relieve en volumen.
          </p>
        </div>

        <div className="relative min-h-0 w-full flex-1">
          <div ref={mapEl} className="absolute inset-0 h-full w-full" />
          <div
            className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex overflow-hidden rounded-lg bg-white shadow-md">
              {CAPAS_BASE.map((capa) => (
                <button
                  key={capa.id}
                  type="button"
                  onClick={() => cambiarCapa(capa.id)}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    capaBase === capa.id
                      ? "bg-blue-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {capa.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md">
              <input
                type="checkbox"
                checked={mascara}
                onChange={(e) => cambiarMascara(e.target.checked)}
              />
              Máscara de relieve
            </label>
            <button
              type="button"
              onClick={() => cambiar3d(!vista3d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-md ${
                vista3d
                  ? "bg-blue-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              3D
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <p className="text-sm text-gray-700">
            Coordenadas:{" "}
            <span className="font-semibold text-blue-900">
              {formatLatLng(position)}
            </span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Usar estas coordenadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
