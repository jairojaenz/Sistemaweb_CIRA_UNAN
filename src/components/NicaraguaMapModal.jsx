/**
 * Modal de mapa para marcar coordenadas (Google Maps).
 */
import { useEffect, useRef, useState } from "react";
import {
  CAPAS_BASE,
  NICARAGUA_CENTER,
  cargarGoogleMaps,
  googleMapsApiKey,
  iconoPin,
  mapTypeDeCapa,
  opcionesMapaNicaragua,
} from "../utils/googleMapsNicaragua.js";

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
  const markerRef = useRef(null);
  const positionRef = useRef(NICARAGUA_CENTER);
  const [position, setPosition] = useState(NICARAGUA_CENTER);
  const [capaBase, setCapaBase] = useState("satelite");
  const [errorMapa, setErrorMapa] = useState("");

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
    setErrorMapa("");

    if (!googleMapsApiKey()) {
      setErrorMapa("Pega tu API key en .env.development (VITE_GOOGLE_MAPS_API_KEY) y reinicia npm run dev.");
      return undefined;
    }

    let cancelled = false;

    cargarGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapEl.current) return;
        const zoom = initialZoom ?? (parseLatLng(initialValue) ? 12 : 7);
        const created = new maps.Map(
          mapEl.current,
          opcionesMapaNicaragua({
            center: start,
            zoom,
            mapTypeId: mapTypeDeCapa("satelite"),
          }),
        );
        const marker = new maps.Marker({
          map: created,
          position: start,
          draggable: true,
          icon: iconoPin(maps, { w: 36, h: 48 }),
        });

        const apply = (latLng) => {
          const next = { lat: latLng.lat(), lng: latLng.lng() };
          marker.setPosition(next);
          updatePosition(next);
        };

        marker.addListener("dragend", () => apply(marker.getPosition()));
        created.addListener("click", (e) => apply(e.latLng));

        mapRef.current = created;
        markerRef.current = marker;
      })
      .catch((err) => {
        if (!cancelled) setErrorMapa(err?.message || "No se pudo cargar Google Maps");
      });

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, [open, initialValue, initialZoom]);

  function cambiarCapa(id) {
    setCapaBase(id);
    if (mapRef.current) mapRef.current.setMapTypeId(mapTypeDeCapa(id));
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
            Arrastre el pin o toque el mapa para marcar las coordenadas.
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
          </div>
          {errorMapa ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-6 text-center text-sm text-slate-600">
              {errorMapa}
            </div>
          ) : null}
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
