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
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-white text-gray-800">
      <main className="flex flex-grow justify-center bg-white py-8 px-4">
        <div className="w-full max-w-5xl space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
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

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => navigate(ROUTES.planMuestreoPaso(2))}
            >
              Atrás
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white hover:bg-blue-800"
              onClick={handleCreate}
            >
              Crear
            </button>
          </div>

          <div className="text-xs text-gray-600">
            Contactos APE: Oficinas: 2278-8987/82, Ext. 8318 y 8317. Denis Herrera:
            8391-2846 (logo). Sandra Vásquez 8994-6598 (logo).
          </div>
        </div>
      </main>

      <footer className="bg-blue-900 py-2 text-center text-white">
        <p>© {new Date().getFullYear()} CIRA - UNAN Managua | Plan de Muestreo</p>
      </footer>
    </div>
  );
}

