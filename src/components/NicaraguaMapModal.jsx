/**
 * Modal de mapa para marcar coordenadas (Google Maps).
 */
import { useEffect, useRef, useState } from "react";
import {
  CAPAS_BASE,
  NICARAGUA_CENTER,
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
  solicitarPantallaCompleta,
} from "../utils/googleMapsNicaragua.js";
import IconoPantallaCompleta from "./IconoPantallaCompleta.jsx";

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
  const pantallaRef = useRef(null);
  const mapEl = useRef(null);
  const map3dHost = useRef(null);
  const mapRef = useRef(null);
  const mapa3dRef = useRef(null);
  const markerRef = useRef(null);
  const positionRef = useRef(NICARAGUA_CENTER);
  const [position, setPosition] = useState(NICARAGUA_CENTER);
  const [capaBase, setCapaBase] = useState("satelite");
  const [errorMapa, setErrorMapa] = useState("");
  const [completo, setCompleto] = useState(false);
  const [vista3d, setVista3d] = useState(false);
  const vista3dRef = useRef(false);

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
          opcionesMapaNicaragua(maps, {
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
        vista3dRef.current = false;
        setVista3d(false);
        destruirMapa3d(map3dHost.current);
        mapa3dRef.current = null;
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
      destruirMapa3d(map3dHost.current);
      mapa3dRef.current = null;
      mapRef.current = null;
    };
  }, [open, initialValue, initialZoom]);

  useEffect(() => {
    return escucharPantallaCompleta(() => {
      setCompleto(estaEnPantallaCompleta(pantallaRef.current));
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
    try {
      const lib = await cargarMaps3d();
      if (!vista3dRef.current) return;
      const actual = positionRef.current;
      mapa3dRef.current = crearMapa3d(lib, map3dHost.current, {
        center: actual,
        zoom: mapRef.current?.getZoom?.() ?? 12,
        idCapa: "satelite",
      });
      const Ctor = lib.Marker3DInteractiveElement || lib.Marker3DElement;
      if (Ctor) {
        const pin = new Ctor({
          position: { lat: actual.lat, lng: actual.lng, altitude: 0 },
          altitudeMode: "CLAMP_TO_GROUND",
          label: "Ubicación",
        });
        mapa3dRef.current.append(pin);
      }
      setCapaBase("satelite");
    } catch (err) {
      vista3dRef.current = false;
      setVista3d(false);
      setErrorMapa(
        err?.message ||
          "No se pudo abrir la vista 3D. En Google Cloud activa Maps JavaScript API y Map Tiles API.",
      );
    }
  }

  function alternarVista3d() {
    const next = !vista3dRef.current;
    vista3dRef.current = next;
    setVista3d(next);
    if (next) {
      activarVista3d();
      return;
    }
    destruirMapa3d(map3dHost.current);
    mapa3dRef.current = null;
    window.setTimeout(() => redimensionarMapa(mapRef.current), 80);
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
            Arrastre el pin o toque el mapa. En 3D puede girar el mapa con Ctrl + arrastrar.
          </p>
        </div>

        <div
          ref={pantallaRef}
          className={`relative min-h-0 w-full flex-1 bg-white ${completo ? "h-full" : ""}`}
        >
          <div ref={mapEl} className={`absolute inset-0 h-full w-full ${vista3d ? "invisible" : ""}`} />
          <div
            ref={map3dHost}
            className={`dash-demanda-map absolute inset-0 h-full w-full ${vista3d ? "" : "hidden"}`}
          />
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
          <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
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
