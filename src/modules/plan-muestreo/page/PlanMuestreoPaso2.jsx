import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import PlanMuestreoStepper from "./PlanMuestreoStepper.jsx";
import { loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { ROUTES } from "../../../router/routes.js";

const HORAS_COMPUESTO = ["8 h", "10 h", "12 h", "16 h", "24 h", "Otro"];

const MATRICES = ["Agua Natural", "Agua Residual", "Sedimento", "Suelo", "Lodo", "Otro"];
const FUENTES = ["Río", "Lago", "Pozo", "Mar", "Manantial", "Otro"];
const ENVASES = ["Plástico", "Vidrio", "Bolsa", "No aplica", "Otro"];
const PRESERVANTES = ["Hielo", "Ácido nítrico", "Ácido sulfúrico", "No aplica", "Otro"];

function ToggleChip({ checked, label, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export default function PlanMuestreoPaso2() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => loadDraft());

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const paso2 = draft.paso2;

  const setPaso2 = (patch) => {
    setDraft((prev) => ({ ...prev, paso2: { ...prev.paso2, ...patch } }));
  };

  const detalle = paso2.detalle ?? [];

  const tipoLabel = useMemo(() => {
    if (paso2.tipoMuestreo === "puntual") return "Puntual";
    if (paso2.tipoMuestreo === "compuesto") return "Compuesto";
    return "Otros";
  }, [paso2.tipoMuestreo]);

  const updateDetalleRow = (idx, patch) => {
    setDraft((prev) => {
      const next = [...(prev.paso2.detalle ?? [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, paso2: { ...prev.paso2, detalle: next } };
    });
  };

  const emptyDetalleRow = () => ({
    lugarMuestreo: "",
    identificacionMuestra: "",
    coordenadas: "",
    matriz: "",
    fuente: "",
    ensayosSolicitados: "",
    tipoEnvaseVolumen: "",
    preservantes: "",
  });

  const addRow = () => {
    setDraft((prev) => ({
      ...prev,
      paso2: {
        ...prev.paso2,
        detalle: [...(prev.paso2.detalle ?? []), emptyDetalleRow()],
      },
    }));
  };

  const removeRow = (idx) => {
    setDraft((prev) => {
      const rows = [...(prev.paso2.detalle ?? [])];
      if (rows.length <= 1) return prev;
      rows.splice(idx, 1);
      return { ...prev, paso2: { ...prev.paso2, detalle: rows } };
    });
  };

  const toggleHora = (label) => {
    const current = paso2.compuestoHoras ?? [];
    const has = current.includes(label);
    setPaso2({
      compuestoHoras: has ? current.filter((x) => x !== label) : [...current, label],
    });
  };

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-white text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">
        Plan de Muestreo
      </div>

      <main className="flex flex-grow justify-center bg-white py-8 px-4">
        <div className="w-full max-w-7xl space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
          <PlanMuestreoStepper step={2} />

          <div className="border border-gray-200 rounded-md">
            <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">
              TIPO DE MUESTREO
            </div>
            <div className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="tipo"
                    checked={paso2.tipoMuestreo === "puntual"}
                    onChange={() => setPaso2({ tipoMuestreo: "puntual" })}
                  />
                  Puntual
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="tipo"
                    checked={paso2.tipoMuestreo === "compuesto"}
                    onChange={() => setPaso2({ tipoMuestreo: "compuesto" })}
                  />
                  Compuesto
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="tipo"
                    checked={paso2.tipoMuestreo === "otros"}
                    onChange={() => setPaso2({ tipoMuestreo: "otros" })}
                  />
                  Otros
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-5">
                {HORAS_COMPUESTO.map((h) => (
                  <ToggleChip
                    key={h}
                    label={h}
                    checked={(paso2.compuestoHoras ?? []).includes(h)}
                    onChange={() => toggleHora(h)}
                  />
                ))}
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Coordinador del muestreo
                  </label>
                  <input
                    className="input mt-1"
                    value={paso2.coordinador}
                    onChange={(e) => setPaso2({ coordinador: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Reemplazo del coordinador del muestreo
                  </label>
                  <input
                    className="input mt-1"
                    value={paso2.reemplazoCoordinador}
                    onChange={(e) =>
                      setPaso2({ reemplazoCoordinador: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-md mt-6">
            <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">
              DETALLE DEL MUESTREO
            </div>
            <div className="overflow-x-auto px-4 py-4">
              <table className="w-full min-w-[1180px] border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-700">
                    <th className="border p-2 text-left">Lugar de muestreo</th>
                    <th className="border p-2 text-left">Identificación de la muestra</th>
                    <th className="border p-2 text-left">Coordenadas</th>
                    <th className="border p-2 text-left">Matriz</th>
                    <th className="border p-2 text-left">Fuente</th>
                    <th className="border p-2 text-left">Ensayos solicitados</th>
                    <th className="border p-2 text-left">Tipo de envase / Volumen</th>
                    <th className="border p-2 text-left">Preservantes</th>
                    <th className="w-14 border p-2 text-center align-middle"> </th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map((row, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="border p-2">
                        <input
                          className="input"
                          value={row.lugarMuestreo}
                          onChange={(e) =>
                            updateDetalleRow(idx, { lugarMuestreo: e.target.value })
                          }
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          className="input"
                          value={row.identificacionMuestra}
                          onChange={(e) =>
                            updateDetalleRow(idx, {
                              identificacionMuestra: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          className="input"
                          placeholder="Lat, Long"
                          value={row.coordenadas}
                          onChange={(e) =>
                            updateDetalleRow(idx, { coordenadas: e.target.value })
                          }
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          className="select"
                          value={row.matriz}
                          onChange={(e) => updateDetalleRow(idx, { matriz: e.target.value })}
                        >
                          <option value="">Seleccionar</option>
                          {MATRICES.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <select
                          className="select"
                          value={row.fuente}
                          onChange={(e) => updateDetalleRow(idx, { fuente: e.target.value })}
                        >
                          <option value="">Seleccionar</option>
                          {FUENTES.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <input
                          className="input"
                          value={row.ensayosSolicitados}
                          onChange={(e) =>
                            updateDetalleRow(idx, { ensayosSolicitados: e.target.value })
                          }
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          className="select"
                          value={row.tipoEnvaseVolumen}
                          onChange={(e) =>
                            updateDetalleRow(idx, { tipoEnvaseVolumen: e.target.value })
                          }
                        >
                          <option value="">Seleccionar</option>
                          {ENVASES.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <select
                          className="select"
                          value={row.preservantes}
                          onChange={(e) =>
                            updateDetalleRow(idx, { preservantes: e.target.value })
                          }
                        >
                          <option value="">Seleccionar</option>
                          {PRESERVANTES.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2 align-middle text-center">
                        <button
                          type="button"
                          title="Eliminar fila"
                          disabled={detalle.length <= 1}
                          className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => removeRow(idx)}
                        >
                          <FaTrashAlt className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Eliminar fila</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4">
                <button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md"
                  onClick={addRow}
                >
                  + Agregar fila
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                Claves: P = Plástico, V = Vidrio, B = Bolsa, NA = No aplica, INP =
                información no proporcionada (por el usuario)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => navigate(ROUTES.planMuestreoPaso(1))}
            >
              Atrás
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white hover:bg-blue-800"
              onClick={() => navigate(ROUTES.planMuestreoPaso(3))}
            >
              Siguiente
            </button>
          </div>

          <div className="text-xs text-gray-600">
            Estado actual: <span className="font-semibold">{tipoLabel}</span>
          </div>
        </div>
      </main>

      <footer className="bg-blue-900 py-2 text-center text-white">
        <p>© {new Date().getFullYear()} CIRA - UNAN Managua | Plan de Muestreo</p>
      </footer>
    </div>
  );
}

