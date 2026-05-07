import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanMuestreoStepper from "./PlanMuestreoStepper.jsx";
import { clearDraft, loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { ROUTES } from "../../../router/routes.js";

function FirmaBlock({ title, nameValue, onName, dateValue, onDate, timeValue, onTime }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <label className="text-xs font-semibold text-gray-700">{title}</label>
        <input className="input mt-1" placeholder="Nombre o firma" value={nameValue} onChange={onName} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700">Fecha de finalización</label>
        <input className="input mt-1" type="date" value={dateValue} onChange={onDate} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700">Hora de finalización</label>
        <input className="input mt-1" type="time" value={timeValue} onChange={onTime} />
      </div>
    </div>
  );
}

export default function PlanMuestreoPaso3() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => loadDraft());

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const paso3 = draft.paso3;
  const setPaso3 = (patch) => {
    setDraft((prev) => ({ ...prev, paso3: { ...prev.paso3, ...patch } }));
  };

  const handleCreate = () => {
    // En este punto se integraría el envío a la API.
    // Por ahora, se deja simulado y se limpia el borrador.
    localStorage.setItem("plan_muestreo_last_created_v1", JSON.stringify(draft));
    alert("Plan de muestreo creado (simulado).");
    clearDraft();
    navigate(ROUTES.dashboard);
  };

  return (
    <div className="w-full pb-4">
      <div className="mx-auto max-w-6xl px-0 py-2 md:px-2">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <PlanMuestreoStepper step={3} />

          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Observaciones relacionadas al muestreo:
              </label>
              <textarea
                className="textarea mt-1"
                rows={4}
                value={paso3.observacionesMuestreo}
                onChange={(e) => setPaso3({ observacionesMuestreo: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Observaciones / Comentarios del coordinador del muestreo:
              </label>
              <textarea
                className="textarea mt-1"
                rows={4}
                value={paso3.observacionesCoordinador}
                onChange={(e) =>
                  setPaso3({ observacionesCoordinador: e.target.value })
                }
              />
            </div>

            <FirmaBlock
              title="Nombre o firma de quien elabora el plan de muestreo"
              nameValue={paso3.elaboraNombreFirma}
              onName={(e) => setPaso3({ elaboraNombreFirma: e.target.value })}
              dateValue={paso3.elaboraFecha}
              onDate={(e) => setPaso3({ elaboraFecha: e.target.value })}
              timeValue={paso3.elaboraHora}
              onTime={(e) => setPaso3({ elaboraHora: e.target.value })}
            />

            <FirmaBlock
              title="Nombre o firma, del usuario o su representante"
              nameValue={paso3.usuarioNombreFirma}
              onName={(e) => setPaso3({ usuarioNombreFirma: e.target.value })}
              dateValue={paso3.usuarioFecha}
              onDate={(e) => setPaso3({ usuarioFecha: e.target.value })}
              timeValue={paso3.usuarioHora}
              onTime={(e) => setPaso3({ usuarioHora: e.target.value })}
            />

            <FirmaBlock
              title="Nombre o firma de quien entrega el plan de muestreo a APE"
              nameValue={paso3.entregaNombreFirma}
              onName={(e) => setPaso3({ entregaNombreFirma: e.target.value })}
              dateValue={paso3.entregaFecha}
              onDate={(e) => setPaso3({ entregaFecha: e.target.value })}
              timeValue={paso3.entregaHora}
              onTime={(e) => setPaso3({ entregaHora: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold px-6 py-2 rounded-lg"
              onClick={() => navigate(ROUTES.planMuestreoPaso(2))}
            >
              Atrás
            </button>
            <button
              className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg"
              onClick={handleCreate}
            >
              Crear
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-600">
            Contactos APE: Oficinas: 2278-8987/82, Ext. 8318 y 8317. Denis Herrera:
            8391-2846 (logo). Sandra Vásquez 8994-6598 (logo).
          </div>
        </div>
      </div>
    </div>
  );
}

