import { useEffect, useRef, useState } from "react";
import { Beaker, ChevronDown, Search, X } from "lucide-react";

function labelAnalisis(item) {
  const nombre = item.nombreAnalisis || "";
  const abre = item.abreviacionAnalisis || "";
  if (nombre && abre && abre !== nombre) return `${nombre} (${abre})`;
  return nombre || abre || `Análisis #${item.idAnalisis}`;
}

export default function EnsayosMultiSelect({
  id,
  opciones = [],
  selectedIds = [],
  onChange,
  placeholder = "Seleccione uno o más ensayos",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const ids = selectedIds.map(String);
  const selected = opciones.filter((o) => ids.includes(String(o.idAnalisis)));

  const filtered = opciones.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(o.nombreAnalisis ?? "").toLowerCase().includes(q) ||
      String(o.abreviacionAnalisis ?? "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggle = (idAnalisis) => {
    const value = String(idAnalisis);
    const next = ids.includes(value)
      ? ids.filter((x) => x !== value)
      : [...ids, value];
    onChange(next);
  };

  const remove = (idAnalisis) => {
    onChange(ids.filter((x) => x !== String(idAnalisis)));
  };

  return (
    <div ref={rootRef} className="w-full">
      <div
        className={`overflow-hidden rounded-lg border bg-white ${
          open ? "border-blue-900 ring-2 ring-blue-900/20" : "border-gray-300"
        }`}
      >
        <button
          id={id}
          type="button"
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-multiselectable="true"
        >
          <Beaker className="h-4 w-4 shrink-0 text-blue-900/60" />
          <span className="min-w-0 flex-1 text-sm">
            {selected.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              <span className="font-medium text-blue-900">
                {selected.length} ensayo{selected.length === 1 ? "" : "s"}{" "}
                seleccionado{selected.length === 1 ? "" : "s"}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-500 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-gray-100 bg-slate-50 px-3 py-2">
            {selected.map((item) => (
              <span
                key={item.idAnalisis}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-medium text-blue-900"
              >
                <span className="truncate">{labelAnalisis(item)}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-blue-50"
                  onClick={() => remove(item.idAnalisis)}
                >
                  <X className="h-3 w-3" aria-hidden />
                  <span className="sr-only">Quitar {item.nombreAnalisis}</span>
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {open ? (
          <div className="border-t border-gray-200">
            <div className="relative border-b border-gray-100 p-2">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                placeholder="Buscar ensayo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <ul
              className="max-h-64 overflow-y-auto py-1"
              role="listbox"
              aria-multiselectable="true"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-500">
                  {opciones.length === 0
                    ? "No hay ensayos en el catálogo"
                    : "Sin coincidencias"}
                </li>
              ) : (
                filtered.map((item) => {
                  const checked = ids.includes(String(item.idAnalisis));
                  return (
                    <li key={item.idAnalisis} role="option" aria-selected={checked}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 text-sm ${
                          checked ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-blue-900"
                          checked={checked}
                          onChange={() => toggle(item.idAnalisis)}
                        />
                        <span className="min-w-0 leading-5">
                          <span className="block font-medium text-gray-900">
                            {item.nombreAnalisis || labelAnalisis(item)}
                          </span>
                          {item.abreviacionAnalisis &&
                          item.abreviacionAnalisis !== item.nombreAnalisis ? (
                            <span className="block text-xs text-gray-500">
                              {item.abreviacionAnalisis}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function idsEnsayosFromRow(row, catalogo = []) {
  if (Array.isArray(row?.idsEnsayos) && row.idsEnsayos.length > 0) {
    return row.idsEnsayos.map(String);
  }
  const text = String(row?.ensayosSolicitados ?? "").trim();
  if (!text || catalogo.length === 0) return [];
  const names = text.split(/[,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  return catalogo
    .filter((a) => {
      const nombre = String(a.nombreAnalisis ?? "").toLowerCase();
      const abre = String(a.abreviacionAnalisis ?? "").toLowerCase();
      return names.includes(nombre) || (abre && names.includes(abre));
    })
    .map((a) => String(a.idAnalisis));
}

export function labelsEnsayos(ids, catalogo = []) {
  const set = new Set((ids ?? []).map(String));
  return catalogo
    .filter((a) => set.has(String(a.idAnalisis)))
    .map((a) => a.abreviacionAnalisis || a.nombreAnalisis);
}
