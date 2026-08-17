import { useState } from "react";
import { Mountain } from "lucide-react";

const MIN_M = 0;
const MAX_M = 2500;
const STEP_M = 5;

export async function fetchElevacion(lat, lng) {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo obtener la elevación");
  const data = await res.json();
  const value = Number(data?.elevation?.[0]);
  if (!Number.isFinite(value)) throw new Error("Elevación no disponible");
  return Math.round(value);
}

export default function ElevationField({
  id = "muestra-elevacion",
  label = "Elevación (msnm)",
  value,
  onChange,
  latitud,
  longitud,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const numeric = Number(value);
  const hasValue = value !== "" && Number.isFinite(numeric);
  const sliderValue = hasValue ? Math.min(MAX_M, Math.max(MIN_M, numeric)) : 0;
  const canFetch = Number.isFinite(Number(latitud)) && Number.isFinite(Number(longitud));

  const setMeters = (next) => {
    const n = Number(next);
    if (!Number.isFinite(n)) {
      onChange("");
      return;
    }
    onChange(String(Math.round(n)));
  };

  const obtenerDelPunto = async () => {
    if (!canFetch) return;
    setLoading(true);
    setError("");
    try {
      const meters = await fetchElevacion(Number(latitud), Number(longitud));
      onChange(String(meters));
    } catch {
      setError("No se pudo leer la altura de ese punto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {label ? (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <div className="rounded-lg border border-gray-300 bg-white p-3">
        <div className="flex items-center gap-2">
          <Mountain className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
          <button
            type="button"
            className="rounded-md border border-gray-200 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => setMeters((hasValue ? numeric : 0) - STEP_M)}
          >
            −
          </button>
          <input
            id={id}
            type="number"
            min={MIN_M}
            max={MAX_M}
            step={1}
            className="input text-center"
            placeholder="0"
            value={value}
            onChange={(e) => setMeters(e.target.value)}
          />
          <span className="shrink-0 text-sm font-medium text-gray-600">m s.n.m.</span>
          <button
            type="button"
            className="rounded-md border border-gray-200 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => setMeters((hasValue ? numeric : 0) + STEP_M)}
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={MIN_M}
          max={MAX_M}
          step={STEP_M}
          value={sliderValue}
          onChange={(e) => setMeters(e.target.value)}
          className="mt-3 w-full accent-emerald-700"
          aria-label="Ajustar elevación"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">Metros sobre el nivel del mar</p>
          <button
            type="button"
            disabled={!canFetch || loading}
            onClick={obtenerDelPunto}
            className="text-xs font-semibold text-blue-800 underline hover:text-blue-900 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {loading ? "Consultando altura…" : "Usar altura del punto"}
          </button>
        </div>
        {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
