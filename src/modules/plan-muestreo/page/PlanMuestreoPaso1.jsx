import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import { loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { ROUTES } from "../../../router/routes.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";

export default function PlanMuestreoPaso1() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => loadDraft());

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const paso1 = draft.paso1;

  const setPaso1 = (patch) => {
    setDraft((prev) => ({ ...prev, paso1: { ...prev.paso1, ...patch } }));
  };

  return (
    <PlanMuestreoLayout
      step={1}
      previousDisabled
      onPrevious={() => {}}
      onNext={() => navigate(ROUTES.planMuestreoPaso(2))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Código de referencia
          </label>
          <input
            className="input mt-1"
            value={paso1.codigoReferencia}
            onChange={(e) => setPaso1({ codigoReferencia: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Usuario / Proyecto
          </label>
          <input
            className="input mt-1"
            value={paso1.usuarioProyecto}
            onChange={(e) => setPaso1({ usuarioProyecto: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Proforma N°</label>
          <input
            className="input mt-1"
            value={paso1.proformaNo}
            onChange={(e) => setPaso1({ proformaNo: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Dirección del usuario
          </label>
          <input
            className="input mt-1"
            value={paso1.direccionUsuario}
            onChange={(e) => setPaso1({ direccionUsuario: e.target.value })}
          />
        </div>

        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Con atención a
            </label>
            <input
              className="input mt-1"
              value={paso1.atencionA}
              onChange={(e) => setPaso1({ atencionA: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Teléfono</label>
            <input
              className="input mt-1"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0000-0000"
              value={paso1.telefono}
              onChange={(e) =>
                setPaso1({ telefono: formatTelefonoLocal(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Persona de contacto para la coordinación del muestreo
            </label>
            <input
              className="input mt-1"
              value={paso1.personaContacto}
              onChange={(e) => setPaso1({ personaContacto: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Teléfono</label>
            <input
              className="input mt-1"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0000-0000"
              value={paso1.telefonoContacto}
              onChange={(e) =>
                setPaso1({
                  telefonoContacto: formatTelefonoLocal(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">
            Dirección del sitio(s) a muestrear
          </label>
          <input
            className="input mt-1"
            value={paso1.direccionSitio}
            onChange={(e) => setPaso1({ direccionSitio: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">
            Fecha del muestreo
          </label>
          <input
            type="date"
            className="input mt-1"
            value={paso1.fechaMuestreo}
            onChange={(e) => setPaso1({ fechaMuestreo: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Hora de salida
            </label>
            <input
              type="time"
              className="input mt-1"
              value={paso1.horaSalida}
              onChange={(e) => setPaso1({ horaSalida: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Hora de regreso
            </label>
            <input
              type="time"
              className="input mt-1"
              value={paso1.horaRegreso}
              onChange={(e) => setPaso1({ horaRegreso: e.target.value })}
            />
          </div>
        </div>
      </div>
    </PlanMuestreoLayout>
  );
}
