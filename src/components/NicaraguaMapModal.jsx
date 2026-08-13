import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const NICARAGUA_CENTER = { lat: 12.8654, lng: -85.2072 };
const NICARAGUA_BOUNDS = [
  [10.65, -87.85],
  [15.15, -82.55],
];

const PIN_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" aria-hidden="true">
  <path fill="#dc2626" stroke="#7f1d1d" stroke-width="1.2"
    d="M16 1C8.3 1 2 7.3 2 15c0 10.5 14 25 14 25s14-14.5 14-25C30 7.3 23.7 1 16 1z"/>
  <circle cx="16" cy="15" r="5" fill="#fff"/>
</svg>`;

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

function resolveLeaflet(mod) {
  return mod?.default ?? mod;
}

export default function NicaraguaMapModal({
  open,
  initialValue = "",
  onConfirm,
  onCancel,
}) {
  const mapEl = useRef(null);
  const positionRef = useRef(NICARAGUA_CENTER);
  const [position, setPosition] = useState(NICARAGUA_CENTER);

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

    import("leaflet")
      .then((mod) => {
        if (cancelled || !mapEl.current) return;
        const L = resolveLeaflet(mod);
        if (!L?.map || !L.divIcon) {
          throw new Error("Leaflet no se cargó correctamente");
        }

        const redPinIcon = L.divIcon({
          className: "nicaragua-map-pin",
          html: PIN_HTML,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -38],
        });

        const created = L.map(mapEl.current, {
          center: [start.lat, start.lng],
          zoom: parseLatLng(initialValue) ? 12 : 7,
          minZoom: 6,
          maxZoom: 18,
          maxBounds: NICARAGUA_BOUNDS,
          maxBoundsViscosity: 0.85,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(created);

        const marker = L.marker([start.lat, start.lng], {
          draggable: true,
          icon: redPinIcon,
        }).addTo(created);

        const apply = (latlng) => {
          marker.setLatLng(latlng);
          updatePosition({ lat: latlng.lat, lng: latlng.lng });
        };

        marker.on("dragend", () => apply(marker.getLatLng()));
        created.on("click", (e) => apply(e.latlng));
        map = created;

        window.setTimeout(() => {
          if (!cancelled && map) map.invalidateSize();
        }, 120);
      })
      .catch((err) => {
        console.error("No se pudo iniciar el mapa:", err);
      });

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = undefined;
      }
    };
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={confirmar}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-blue-900">
            Ubicación en el mapa de Nicaragua
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Arrastre el pin rojo o toque el mapa. Enter o clic fuera guarda las
            coordenadas.
          </p>
        </div>

        <div className="relative h-[42vh] min-h-[240px] max-h-[380px] w-full shrink">
          <div ref={mapEl} className="absolute inset-0 h-full w-full" />
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
