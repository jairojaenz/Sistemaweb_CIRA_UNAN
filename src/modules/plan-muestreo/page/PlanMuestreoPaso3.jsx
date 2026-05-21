import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import { clearDraft, loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { ROUTES } from "../../../router/routes.js";

function FirmaBlock({ nameLabel, nameValue, onName, dateValue, onDate, timeValue, onTime }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
      <div>
        <label className="text-xs font-semibold text-gray-700">{nameLabel}</label>
        <input
          className="input mt-1 w-full"
          placeholder="Nombre o firma"
          value={nameValue}
          onChange={onName}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700">Fecha de finalización</label>
        <input
          className="input mt-1 w-full"
          type="date"
          value={dateValue}
          onChange={onDate}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700">Hora de finalización</label>
        <input
          className="input mt-1 w-full"
          type="time"
          value={timeValue}
          onChange={onTime}
        />
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
    localStorage.setItem("plan_muestreo_last_created_v1", JSON.stringify(draft));
    alert("Plan de muestreo creado (simulado).");
    clearDraft();
    navigate(ROUTES.dashboard);
  };

  return (
    <PlanMuestreoLayout
      step={3}
      isLastStep
      onPrevious={() => navigate(ROUTES.planMuestreoPaso(2))}
      onSubmit={handleCreate}
      submitLabel="Crear"
    >
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
            onChange={(e) => setPaso3({ observacionesCoordinador: e.target.value })}
          />
        </div>

        <FirmaBlock
          nameLabel="Quien elabora el plan de muestreo"
          nameValue={paso3.elaboraNombreFirma}
          onName={(e) => setPaso3({ elaboraNombreFirma: e.target.value })}
          dateValue={paso3.elaboraFecha}
          onDate={(e) => setPaso3({ elaboraFecha: e.target.value })}
          timeValue={paso3.elaboraHora}
          onTime={(e) => setPaso3({ elaboraHora: e.target.value })}
        />

        <FirmaBlock
          nameLabel="Usuario o su representante"
          nameValue={paso3.usuarioNombreFirma}
          onName={(e) => setPaso3({ usuarioNombreFirma: e.target.value })}
          dateValue={paso3.usuarioFecha}
          onDate={(e) => setPaso3({ usuarioFecha: e.target.value })}
          timeValue={paso3.usuarioHora}
          onTime={(e) => setPaso3({ usuarioHora: e.target.value })}
        />

        <FirmaBlock
          nameLabel="Quien entrega el plan de muestreo a APE"
          nameValue={paso3.entregaNombreFirma}
          onName={(e) => setPaso3({ entregaNombreFirma: e.target.value })}
          dateValue={paso3.entregaFecha}
          onDate={(e) => setPaso3({ entregaFecha: e.target.value })}
          timeValue={paso3.entregaHora}
          onTime={(e) => setPaso3({ entregaHora: e.target.value })}
        />

        <div className="text-xs text-gray-600">
          Contactos APE: Oficinas: 2278-8987/82, Ext. 8318 y 8317. Denis Herrera:
          8391-2846 (logo). Sandra Vásquez 8994-6598 (logo).
        </div>
      </div>
    </PlanMuestreoLayout>
  );
}
