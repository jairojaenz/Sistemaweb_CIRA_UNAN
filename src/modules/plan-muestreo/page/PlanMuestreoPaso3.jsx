import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, MessageSquare, Phone, User } from "lucide-react";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { clearDraft, loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { createPlanMuestreo, updatePlanMuestreo } from "../service/planMuestreoService.js";
import { formToPlanMuestreoPayload } from "../utils/formToPlanMuestreoPayload.js";
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

function SectionHeader({ accent = "bg-blue-900", title, subtitle }) {
  return (
    <div className="mb-3">
      <h3 className="mb-0.5 flex items-center gap-3 text-lg font-bold text-blue-900">
        <span className={`h-6 w-1 shrink-0 rounded-full ${accent}`} />
        {title}
      </h3>
      {subtitle ? <p className="ml-4 text-sm text-[#6a7282]">{subtitle}</p> : null}
    </div>
  );
}

function Field({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function FirmaCard({
  number,
  title,
  subtitle,
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
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-gray-100 bg-slate-50 px-4 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
          {number}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-blue-900">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </header>
      <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_13rem_14rem]">
        <Field label="Nombre y firma" htmlFor={nameId}>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
            <select
              id={nameId}
              className="input max-w-full pl-10"
              value={userId}
              onChange={onUserChange}
              disabled={loadingUsuarios}
            >
              <option value="">
                {loadingUsuarios ? "Cargando usuarios…" : "Seleccione un usuario"}
              </option>
              {usuariosConSeleccion(usuarios, userId, "").map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {labelUsuario(u)}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Fecha" htmlFor={dateId}>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
            <input
              id={dateId}
              className="input pl-10"
              type="date"
              value={dateValue}
              onChange={onDate}
            />
          </div>
        </Field>
        <Field label="Hora" htmlFor={timeId}>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
            <input
              id={timeId}
              className="input pl-10"
              type="time"
              value={timeValue}
              onChange={onTime}
            />
          </div>
        </Field>
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
  };

  const setFirmaUsuario = (idKey, nombreKey, rawId) => {
    const id = String(rawId ?? "");
    const u = usuarios.find((x) => String(x.idUsuario) === id);
    setPaso3({ [idKey]: id, [nombreKey]: u ? labelUsuario(u) : "" });
  };

  const handleCreate = async () => {
    const idUsuario = idUsuarioSesion(user);
    if (!idUsuario) {
      addToast("No se pudo identificar el usuario de sesión.", "error");
      return;
    }
    if (!Number(paso3.elaboraIdUsuario) || !Number(paso3.usuarioIdUsuario) || !Number(paso3.entregaIdUsuario)) {
      addToast("Seleccione el usuario de cada firma en el paso 3.", "error");
      return;
    }
    if (!draft.paso1?.idProforma && !draft.paso1?.proformaNo) {
      addToast("Seleccione una proforma en el paso 1.", "error");
      navigate(ROUTES.planMuestreoPaso(1));
      return;
    }
    if (!Number(draft.paso1?.idMuestra)) {
      addToast("Seleccione una muestra en el paso 1.", "error");
      navigate(ROUTES.planMuestreoPaso(1));
      return;
    }
    const coordinador = String(draft.paso2?.coordinador ?? "").trim().toLowerCase();
    const reemplazo = String(draft.paso2?.reemplazoCoordinador ?? "").trim().toLowerCase();
    if (coordinador && reemplazo && coordinador === reemplazo) {
      addToast("El reemplazo no puede ser la misma persona que el coordinador del muestreo.", "error");
      navigate(ROUTES.planMuestreoPaso(2));
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
      addToast(err?.message || "No se pudo crear el plan de muestreo.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PlanMuestreoLayout
      step={3}
      wide
      compact
      isLastStep
      onPrevious={() => navigate(ROUTES.planMuestreoPaso(2))}
      onSubmit={handleCreate}
      submitLabel={saving ? "Guardando…" : Number(draft.idFormatoMuestreo) > 0 ? "Actualizar" : "Crear"}
      submitDisabled={saving}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Cierre y firmas</h2>
          <p className="mt-0.5 text-sm text-[#6a7282]">
            Observaciones finales y responsables que elaboran, reciben y entregan el plan.
          </p>
        </div>

        <section className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
          <SectionHeader
            accent="bg-blue-600"
            title="Observaciones"
            subtitle="Notas del muestreo y comentarios del coordinador"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="Observaciones relacionadas al muestreo"
              htmlFor="plan-obs-muestreo"
            >
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-blue-900/50" />
                <textarea
                  id="plan-obs-muestreo"
                  className="textarea min-h-[5.5rem] pl-10"
                  rows={3}
                  placeholder="Condiciones del sitio, incidencias o notas técnicas…"
                  value={paso3.observacionesMuestreo ?? ""}
                  onChange={(e) => setPaso3({ observacionesMuestreo: e.target.value })}
                />
              </div>
            </Field>
            <Field
              label="Comentarios del coordinador"
              htmlFor="plan-obs-coordinador"
            >
              <div className="relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-blue-900/50" />
                <textarea
                  id="plan-obs-coordinador"
                  className="textarea min-h-[5.5rem] pl-10"
                  rows={3}
                  placeholder="Observaciones o comentarios del coordinador del muestreo…"
                  value={paso3.observacionesCoordinador ?? ""}
                  onChange={(e) =>
                    setPaso3({ observacionesCoordinador: e.target.value })
                  }
                />
              </div>
            </Field>
          </div>
        </section>

        <section>
          <SectionHeader
            accent="bg-emerald-600"
            title="Responsables y firmas"
            subtitle="Nombre, fecha y hora de cada responsable del plan"
          />
          <div className="space-y-3">
            <FirmaCard
              number={1}
              title="Quien elabora el plan"
              subtitle="Personal CIRA que prepara el documento"
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
            />
            <FirmaCard
              number={2}
              title="Usuario o su representante"
              subtitle="Quien recibe o valida el plan de muestreo"
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
            />
            <FirmaCard
              number={3}
              title="Quien entrega el plan a APE"
              subtitle="Entrega del plan al Área de Proyección y Extensión"
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
            />
          </div>
        </section>

        <aside className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Contactos APE</p>
            <p className="mt-0.5 text-blue-800/80">
              Oficinas: 2278-8987 / 82, ext. 8318 y 8317. Denis Herrera: 8391-2846.
              Sandra Vásquez: 8994-6598.
            </p>
          </div>
        </aside>
      </div>
    </PlanMuestreoLayout>
  );
}
