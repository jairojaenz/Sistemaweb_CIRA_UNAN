import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  MessageSquare,
  PenLine,
  Phone,
  Send,
  StickyNote,
  UserRound,
} from "lucide-react";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import { ICON_INPUT, IconField } from "../../../components/formFields.jsx";
import ValidationIssuesModal from "../../../components/ValidationIssuesModal.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { clearDraft, loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { createPlanMuestreo, updatePlanMuestreo } from "../service/planMuestreoService.js";
import { formToPlanMuestreoPayload } from "../utils/formToPlanMuestreoPayload.js";
import { collectPlanIssues, issuesToFormErrors, PLAN_STEP_LABELS } from "../utils/planMuestreoValidation.js";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";
import { ROUTES } from "../../../router/routes.js";

function labelUsuario(u) {
  const nombre = u?.nombreUsuario ?? u?.nombre ?? u?.Nombre ?? "";
  const apellido = u?.apellidoUsuario ?? u?.apellido ?? u?.Apellido ?? "";
  return `${nombre} ${apellido}`.trim() || u?.correoUsuario || u?.correo || `Usuario #${u?.idUsuario ?? u?.id ?? ""}`;
}

function idUsuarioSesion(user) {
  return Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);
}

function usuariosConSeleccion(usuarios, selectedId, fallbackNombre) {
  const id = Number(selectedId);
  if (!id || usuarios.some((u) => Number(u.idUsuario) === id)) return usuarios;
  return [
    ...usuarios,
    {
      idUsuario: id,
      nombreUsuario: fallbackNombre || `Usuario #${id}`,
      apellidoUsuario: "",
    },
  ];
}

function FirmaCard({
  number,
  title,
  subtitle,
  icon: Icon,
  tone,
  nameId,
  userId,
  onUserChange,
  usuarios,
  loadingUsuarios,
  dateId,
  dateValue,
  onDate,
  timeId,
  timeValue,
  onTime,
  error,
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-gray-100 bg-slate-50 px-4 py-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-blue-900">
            {number}. {title}
          </p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </header>
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_13rem_12rem]">
        <IconField
          id={nameId}
          icon={Icon}
          tone={tone}
          label="Nombre y firma"
          hint="Usuario responsable de esta firma"
          required
          error={error}
        >
          <select
            id={nameId}
            className={ICON_INPUT}
            value={userId}
            onChange={onUserChange}
            disabled={loadingUsuarios}
          >
            <option value="">{loadingUsuarios ? "Cargando usuarios…" : "Seleccione un usuario"}</option>
            {usuariosConSeleccion(usuarios, userId, "").map((u) => (
              <option key={u.idUsuario} value={u.idUsuario}>
                {labelUsuario(u)}
              </option>
            ))}
          </select>
        </IconField>
        <IconField id={dateId} icon={CalendarDays} tone="bg-amber-50 text-amber-700" label="Fecha" hint="Día de la firma">
          <input id={dateId} className={ICON_INPUT} type="date" value={dateValue} onChange={onDate} />
        </IconField>
        <IconField id={timeId} icon={Clock} tone="bg-sky-50 text-sky-700" label="Hora" hint="Hora de la firma">
          <input id={timeId} className={ICON_INPUT} type="time" value={timeValue} onChange={onTime} />
        </IconField>
      </div>
    </article>
  );
}

export default function PlanMuestreoPaso3() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [draft, setDraft] = useState(() => loadDraft());
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validationApiMessage, setValidationApiMessage] = useState("");
  const [validationTitle, setValidationTitle] = useState("");
  const [validationDescription, setValidationDescription] = useState("");

  const isEdit = Number(draft.idFormatoMuestreo) > 0;

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsuarios(true);
        const lista = await getUsuarios();
        if (cancelled) return;
        setUsuarios((lista ?? []).filter((u) => u.activo !== false && Number(u.idUsuario) > 0));
      } catch {
        if (cancelled) return;
        const idSesion = idUsuarioSesion(user);
        setUsuarios(
          idSesion
            ? [
                {
                  idUsuario: idSesion,
                  nombreUsuario: user?.nombre ?? user?.Nombre ?? "",
                  apellidoUsuario: user?.apellido ?? user?.Apellido ?? "",
                  correoUsuario: user?.correo ?? user?.Correo ?? "",
                },
              ]
            : [],
        );
      } finally {
        if (!cancelled) setLoadingUsuarios(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const idSesion = idUsuarioSesion(user);
    if (!idSesion) return;
    setDraft((prev) => {
      if (prev.paso3?.elaboraIdUsuario) return prev;
      return {
        ...prev,
        paso3: {
          ...prev.paso3,
          elaboraIdUsuario: String(idSesion),
          elaboraNombreFirma: labelUsuario({
            nombreUsuario: user?.nombre ?? user?.Nombre ?? "",
            apellidoUsuario: user?.apellido ?? user?.Apellido ?? "",
          }),
        },
      };
    });
  }, [user]);

  const paso3 = draft?.paso3 ?? {};
  const setPaso3 = (patch) => {
    setDraft((prev) => ({ ...prev, paso3: { ...prev.paso3, ...patch } }));
    const keys = Object.keys(patch);
    if (keys.some((k) => errors[k])) {
      setErrors((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  const setFirmaUsuario = (idKey, nombreKey, rawId) => {
    const id = String(rawId ?? "");
    const u = usuarios.find((x) => String(x.idUsuario) === id);
    setPaso3({ [idKey]: id, [nombreKey]: u ? labelUsuario(u) : "" });
  };

  function irAlPasoDesdeModal(step) {
    setValidationOpen(false);
    if (step === 1) navigate(ROUTES.planMuestreoPaso(1));
    else if (step === 2) navigate(ROUTES.planMuestreoPaso(2));
  }

  const handleCreate = async () => {
    const issues = collectPlanIssues(draft, { steps: [1, 2, 3] });
    const idUsuario = idUsuarioSesion(user);
    if (!idUsuario) {
      issues.push({
        step: 3,
        stepLabel: `Paso 3 — ${PLAN_STEP_LABELS[2]}`,
        field: "idUsuario",
        label: "Usuario de sesión",
        tipo: "formato",
        detalle: "No se pudo identificar el usuario de la sesión actual.",
        formato: "Cierre sesión e inicie de nuevo antes de crear el plan.",
      });
    }

    if (issues.length > 0) {
      setErrors(issuesToFormErrors(issues));
      setValidationIssues(issues);
      setValidationApiMessage("");
      setValidationTitle(isEdit ? "No se pudo actualizar el plan" : "No se pudo crear el plan de muestreo");
      setValidationDescription(
        "Faltan datos requeridos o hay un valor inválido. Corrija los campos indicados e intente de nuevo.",
      );
      setValidationOpen(true);
      return;
    }

    try {
      setSaving(true);
      const payload = formToPlanMuestreoPayload(draft, { idUsuario });
      const idPlan = Number(draft.idFormatoMuestreo);
      if (idPlan > 0) {
        await updatePlanMuestreo(idPlan, payload);
        addToast("Plan de muestreo actualizado correctamente.", "success");
      } else {
        await createPlanMuestreo(payload);
        addToast("Plan de muestreo creado correctamente.", "success");
      }
      clearDraft();
      navigate(ROUTES.planMuestreo);
    } catch (err) {
      setValidationIssues([]);
      setValidationApiMessage(err?.message || "No se pudo crear el plan de muestreo.");
      setValidationTitle(isEdit ? "No se pudo actualizar el plan" : "No se pudo crear el plan de muestreo");
      setValidationDescription("El servidor rechazó el registro. Revise el motivo e intente de nuevo.");
      setValidationOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PlanMuestreoLayout
        step={3}
        wide
        compact
        isLastStep
        onPrevious={() => navigate(ROUTES.planMuestreoPaso(2))}
        onSubmit={handleCreate}
        submitLabel={saving ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
        submitDisabled={saving}
      >
        <div className="space-y-8">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Cierre y firmas</h2>
            <p className="text-gray-600">
              Observaciones finales y responsables que elaboran, reciben y entregan el plan.
            </p>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-yellow-400" />
              Observaciones
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Notas del muestreo y comentarios del coordinador</p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <StickyNote className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor="plan-obs-muestreo" className="text-sm font-semibold text-gray-800">
                    Observaciones relacionadas al muestreo
                  </label>
                  <p className="mb-2 text-xs text-gray-500">Condiciones del sitio, incidencias o notas técnicas</p>
                  <textarea
                    id="plan-obs-muestreo"
                    className="min-h-[96px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-800"
                    rows={3}
                    placeholder="Condiciones del sitio, incidencias o notas técnicas…"
                    value={paso3.observacionesMuestreo ?? ""}
                    onChange={(e) => setPaso3({ observacionesMuestreo: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor="plan-obs-coordinador" className="text-sm font-semibold text-gray-800">
                    Comentarios del coordinador
                  </label>
                  <p className="mb-2 text-xs text-gray-500">Observaciones de quien coordina el muestreo</p>
                  <textarea
                    id="plan-obs-coordinador"
                    className="min-h-[96px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-800"
                    rows={3}
                    placeholder="Observaciones o comentarios del coordinador del muestreo…"
                    value={paso3.observacionesCoordinador ?? ""}
                    onChange={(e) => setPaso3({ observacionesCoordinador: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-blue-900" />
              Responsables y firmas
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Nombre, fecha y hora de cada responsable del plan</p>
            <div className="space-y-4">
              <FirmaCard
                number={1}
                title="Quien elabora el plan"
                subtitle="Personal CIRA que prepara el documento"
                icon={PenLine}
                tone="bg-sky-50 text-sky-700"
                nameId="plan-elabora-nombre"
                userId={paso3.elaboraIdUsuario ?? ""}
                onUserChange={(e) =>
                  setFirmaUsuario("elaboraIdUsuario", "elaboraNombreFirma", e.target.value)
                }
                usuarios={usuarios}
                loadingUsuarios={loadingUsuarios}
                dateId="plan-elabora-fecha"
                dateValue={paso3.elaboraFecha ?? ""}
                onDate={(e) => setPaso3({ elaboraFecha: e.target.value })}
                timeId="plan-elabora-hora"
                timeValue={paso3.elaboraHora ?? ""}
                onTime={(e) => setPaso3({ elaboraHora: e.target.value })}
                error={errors.elaboraIdUsuario}
              />
              <FirmaCard
                number={2}
                title="Usuario o su representante"
                subtitle="Quien recibe o valida el plan de muestreo"
                icon={UserRound}
                tone="bg-indigo-50 text-indigo-700"
                nameId="plan-usuario-nombre"
                userId={paso3.usuarioIdUsuario ?? ""}
                onUserChange={(e) =>
                  setFirmaUsuario("usuarioIdUsuario", "usuarioNombreFirma", e.target.value)
                }
                usuarios={usuarios}
                loadingUsuarios={loadingUsuarios}
                dateId="plan-usuario-fecha"
                dateValue={paso3.usuarioFecha ?? ""}
                onDate={(e) => setPaso3({ usuarioFecha: e.target.value })}
                timeId="plan-usuario-hora"
                timeValue={paso3.usuarioHora ?? ""}
                onTime={(e) => setPaso3({ usuarioHora: e.target.value })}
                error={errors.usuarioIdUsuario}
              />
              <FirmaCard
                number={3}
                title="Quien entrega el plan a APE"
                subtitle="Entrega del plan al Área de Proyección y Extensión"
                icon={Send}
                tone="bg-emerald-50 text-emerald-700"
                nameId="plan-entrega-nombre"
                userId={paso3.entregaIdUsuario ?? ""}
                onUserChange={(e) =>
                  setFirmaUsuario("entregaIdUsuario", "entregaNombreFirma", e.target.value)
                }
                usuarios={usuarios}
                loadingUsuarios={loadingUsuarios}
                dateId="plan-entrega-fecha"
                dateValue={paso3.entregaFecha ?? ""}
                onDate={(e) => setPaso3({ entregaFecha: e.target.value })}
                timeId="plan-entrega-hora"
                timeValue={paso3.entregaHora ?? ""}
                onTime={(e) => setPaso3({ entregaHora: e.target.value })}
                error={errors.entregaIdUsuario}
              />
            </div>
          </section>

          <aside className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Contactos APE</p>
              <p className="mt-0.5 text-blue-800/80">
                Oficinas: 2278-8987 / 82, ext. 8318 y 8317. Denis Herrera: 8391-2846. Sandra Vásquez:
                8994-6598.
              </p>
            </div>
          </aside>
        </div>
      </PlanMuestreoLayout>

      <ValidationIssuesModal
        open={validationOpen}
        title={validationTitle}
        description={validationDescription}
        issues={validationIssues}
        apiMessage={validationApiMessage}
        onClose={() => setValidationOpen(false)}
        onGoToStep={irAlPasoDesdeModal}
        primaryLabel={validationIssues[0]?.step != null ? "Ir a corregir" : "Entendido"}
      />
    </>
  );
}
