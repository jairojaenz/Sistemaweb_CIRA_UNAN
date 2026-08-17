import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarDays,
  FileText,
  FlaskConical,
  Hash,
  Landmark,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  PhoneCall,
  UserCheck,
  UserRound,
} from "lucide-react";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import { loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { collectPlanIssues, issuesToFormErrors, PLAN_STEP_LABELS } from "../utils/planMuestreoValidation.js";
import { ROUTES } from "../../../router/routes.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import { getProformas } from "../../proforma/service/proformaService.js";
import { getMuestras } from "../../catalogos/service/muestrasService.js";
import { ICON_INPUT, IconField } from "../../../components/formFields.jsx";
import ValidationIssuesModal from "../../../components/ValidationIssuesModal.jsx";

export default function PlanMuestreoPaso1() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromProforma = location.state?.fromProforma;

  const [proformas, setProformas] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [errors, setErrors] = useState({});
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);

  const loadCatalogos = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([getProformas(), getMuestras()]);
      setProformas(p ?? []);
      setMuestras((m ?? []).filter((x) => x.activo !== false));
    } catch {
      // El wizard sigue usable; el POST validará FKs.
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  const [draft, setDraft] = useState(() => {
    const draft = loadDraft();
    if (!fromProforma) return draft;
    const { cliente } = fromProforma;

    const detalleRows = (fromProforma.detalles ?? []).map((d) => ({
      lugarMuestreo: "",
      identificacionMuestra: "",
      coordenadas: "",
      matriz: "",
      idMatriz: "",
      fuente: "",
      idFuente: "",
      ensayosSolicitados: d.nombreAnalisis || "",
      idsEnsayos: d.idAnalisis ? [String(d.idAnalisis)] : [],
      tipoEnvaseVolumen: "",
      preservantes: "",
      idPreservante: "",
    }));

    return {
      ...draft,
      paso1: {
        ...draft.paso1,
        usuarioProyecto: `${cliente.nombreCliente} ${cliente.apellidoCliente}`.trim(),
        proformaNo: fromProforma.numeroProforma || "",
        idProforma: fromProforma.idProforma || "",
        direccionUsuario: cliente.direccionCliente || "",
        telefono: formatTelefonoLocal(cliente.telefonoCliente || cliente.celularCliente || ""),
        atencionA: `${cliente.nombreCliente} ${cliente.apellidoCliente}`.trim(),
        personaContacto: `${cliente.nombreCliente} ${cliente.apellidoCliente}`.trim(),
        telefonoContacto: formatTelefonoLocal(cliente.telefonoCliente || cliente.celularCliente || ""),
      },
      paso2: detalleRows.length > 0
        ? { ...draft.paso2, detalle: detalleRows }
        : draft.paso2,
    };
  });

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (fromProforma) {
      navigate(ROUTES.planMuestreoPaso(1), { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const paso1 = draft.paso1;

  const setPaso1 = (patch) => {
    setDraft((prev) => ({ ...prev, paso1: { ...prev.paso1, ...patch } }));
    const keys = Object.keys(patch);
    if (keys.some((k) => errors[k])) {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  const irAlPaso2 = () => {
    const issues = collectPlanIssues(draft, { steps: [1] });
    if (issues.length > 0) {
      setErrors(issuesToFormErrors(issues));
      setValidationIssues(issues);
      setValidationOpen(true);
      return;
    }
    setErrors({});
    navigate(ROUTES.planMuestreoPaso(2));
  };

  return (
    <>
      <PlanMuestreoLayout
        step={1}
        wide
        compact
        previousDisabled
        onPrevious={() => {}}
        onNext={irAlPaso2}
      >
        <div className="space-y-8">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Identificación del plan</h2>
            <p className="text-gray-600">
              Datos del usuario, contactos y programación del muestreo, como en el formato CIRA.
            </p>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-blue-900" />
              Datos generales
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Código, proyecto, proforma y dirección del usuario</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <IconField
                id="plan-codigoReferencia"
                icon={Hash}
                tone="bg-blue-50 text-blue-800"
                label="Código de referencia"
                hint="Identificador interno del plan"
              >
                <input
                  id="plan-codigoReferencia"
                  className={ICON_INPUT}
                  value={paso1.codigoReferencia}
                  onChange={(e) => setPaso1({ codigoReferencia: e.target.value })}
                  placeholder="Ej. PM-2026-001"
                />
              </IconField>
              <IconField
                id="plan-usuarioProyecto"
                icon={Briefcase}
                tone="bg-indigo-50 text-indigo-700"
                label="Usuario / Proyecto"
                hint="Nombre del usuario o proyecto"
                required
                error={errors.usuarioProyecto}
              >
                <input
                  id="plan-usuarioProyecto"
                  className={ICON_INPUT}
                  value={paso1.usuarioProyecto}
                  onChange={(e) => setPaso1({ usuarioProyecto: e.target.value })}
                  placeholder="Nombre del usuario o proyecto"
                />
              </IconField>
              <IconField
                id="plan-idProforma"
                icon={FileText}
                tone="bg-violet-50 text-violet-700"
                label="Proforma N°"
                hint="Proforma asociada al plan"
                required
                error={errors.idProforma}
              >
                <select
                  id="plan-idProforma"
                  className={ICON_INPUT}
                  value={paso1.idProforma || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = proformas.find((x) => String(x.idProforma) === String(id));
                    setPaso1({
                      idProforma: id,
                      proformaNo: p?.numeroProforma ?? p?.NumeroProforma ?? paso1.proformaNo,
                    });
                  }}
                >
                  <option value="">Seleccione una proforma</option>
                  {proformas.map((p) => (
                    <option key={p.idProforma} value={p.idProforma}>
                      {p.numeroProforma ?? p.NumeroProforma ?? `Proforma #${p.idProforma}`}
                    </option>
                  ))}
                </select>
              </IconField>
              <IconField
                id="plan-direccionUsuario"
                icon={Landmark}
                tone="bg-amber-50 text-amber-800"
                label="Dirección del usuario"
                hint="Dirección del usuario o empresa"
                required
                error={errors.direccionUsuario}
              >
                <input
                  id="plan-direccionUsuario"
                  className={ICON_INPUT}
                  value={paso1.direccionUsuario}
                  onChange={(e) => setPaso1({ direccionUsuario: e.target.value })}
                  placeholder="Dirección del usuario o empresa"
                />
              </IconField>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-yellow-400" />
              Contacto
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Persona de atención y coordinación del muestreo</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <IconField
                id="plan-atencionA"
                icon={UserRound}
                tone="bg-sky-50 text-sky-700"
                label="Con atención a"
                hint="Persona a quien se dirige el plan"
              >
                <input
                  id="plan-atencionA"
                  className={ICON_INPUT}
                  value={paso1.atencionA}
                  onChange={(e) => setPaso1({ atencionA: e.target.value })}
                  placeholder="Nombre de la persona"
                />
              </IconField>
              <IconField
                id="plan-telefono"
                icon={Phone}
                tone="bg-emerald-50 text-emerald-700"
                label="Teléfono"
                hint="Teléfono de atención"
              >
                <input
                  id="plan-telefono"
                  className={ICON_INPUT}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0000-0000"
                  value={paso1.telefono}
                  onChange={(e) => setPaso1({ telefono: formatTelefonoLocal(e.target.value) })}
                />
              </IconField>
              <IconField
                id="plan-personaContacto"
                icon={UserCheck}
                tone="bg-indigo-50 text-indigo-700"
                label="Persona de contacto"
                hint="Quien coordina el muestreo"
              >
                <input
                  id="plan-personaContacto"
                  className={ICON_INPUT}
                  value={paso1.personaContacto}
                  onChange={(e) => setPaso1({ personaContacto: e.target.value })}
                  placeholder="Nombre de quien coordina el muestreo"
                />
              </IconField>
              <IconField
                id="plan-telefonoContacto"
                icon={PhoneCall}
                tone="bg-teal-50 text-teal-700"
                label="Teléfono de coordinación"
                hint="Teléfono de la persona de contacto"
              >
                <input
                  id="plan-telefonoContacto"
                  className={ICON_INPUT}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0000-0000"
                  value={paso1.telefonoContacto}
                  onChange={(e) => setPaso1({ telefonoContacto: formatTelefonoLocal(e.target.value) })}
                />
              </IconField>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-blue-900" />
              Sitio y programación
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Lugar a muestrear, fecha y horarios de salida y regreso</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <IconField
                id="plan-direccionSitio"
                icon={MapPin}
                tone="bg-rose-50 text-rose-700"
                label="Dirección del sitio(s) a muestrear"
                hint="Ubicación o sitios donde se tomará la muestra"
                required
                error={errors.direccionSitio}
                className="md:col-span-3"
              >
                <input
                  id="plan-direccionSitio"
                  className={ICON_INPUT}
                  value={paso1.direccionSitio}
                  onChange={(e) => setPaso1({ direccionSitio: e.target.value })}
                  placeholder="Ubicación o sitios donde se tomará la muestra"
                />
              </IconField>
              <IconField
                id="plan-fechaMuestreo"
                icon={CalendarDays}
                tone="bg-amber-50 text-amber-700"
                label="Fecha del muestreo"
                hint="Día programado para el muestreo"
                required
                error={errors.fechaMuestreo}
              >
                <input
                  id="plan-fechaMuestreo"
                  type="date"
                  className={ICON_INPUT}
                  value={paso1.fechaMuestreo}
                  onChange={(e) => setPaso1({ fechaMuestreo: e.target.value })}
                />
              </IconField>
              <IconField
                id="plan-horaSalida"
                icon={LogOut}
                tone="bg-red-50 text-red-600"
                label="Hora de salida"
                hint="Salida hacia el sitio"
              >
                <input
                  id="plan-horaSalida"
                  type="time"
                  className={ICON_INPUT}
                  value={paso1.horaSalida}
                  onChange={(e) => setPaso1({ horaSalida: e.target.value })}
                />
              </IconField>
              <IconField
                id="plan-horaRegreso"
                icon={LogIn}
                tone="bg-emerald-50 text-emerald-600"
                label="Hora de regreso"
                hint="Regreso al laboratorio"
              >
                <input
                  id="plan-horaRegreso"
                  type="time"
                  className={ICON_INPUT}
                  value={paso1.horaRegreso}
                  onChange={(e) => setPaso1({ horaRegreso: e.target.value })}
                />
              </IconField>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-yellow-400" />
              Vinculación en sistema
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Requerido por la API; no aparece en el formato impreso</p>
            <IconField
              id="plan-idMuestra"
              icon={FlaskConical}
              tone="bg-violet-50 text-violet-700"
              label="Muestra"
              hint="Muestra del catálogo asociada al plan"
              required
              error={errors.idMuestra}
            >
              <select
                id="plan-idMuestra"
                className={ICON_INPUT}
                value={paso1.idMuestra || ""}
                onChange={(e) => setPaso1({ idMuestra: e.target.value })}
              >
                <option value="">Seleccione una muestra</option>
                {muestras.map((m) => (
                  <option key={m.idMuestra} value={m.idMuestra}>
                    {m.identificacion || `Muestra #${m.idMuestra}`}
                  </option>
                ))}
              </select>
            </IconField>
          </section>
        </div>
      </PlanMuestreoLayout>

      <ValidationIssuesModal
        open={validationOpen}
        title="No puede continuar al siguiente paso"
        description={`Revise los campos pendientes del paso 1 — ${PLAN_STEP_LABELS[0]}.`}
        issues={validationIssues}
        onClose={() => setValidationOpen(false)}
        onGoToStep={() => setValidationOpen(false)}
        primaryLabel="Ir a corregir"
      />
    </>
  );
}
