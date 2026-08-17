/**
 * Formulario de ensayo: cabecera + resultados por muestra/análisis.
 * "Cargar muestras" lee la orden y arma una fila por cada muestra/análisis.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Beaker,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Droplets,
  FlaskConical,
  Gauge,
  Hash,
  KeyRound,
  Loader2,
  MapPin,
  Microscope,
  Percent,
  Plus,
  Scale,
  ShieldAlert,
  StickyNote,
  TestTube,
  Thermometer,
  Trash2,
  UserRound,
  Wind,
} from "lucide-react";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import ValidationIssuesModal from "../../../components/ValidationIssuesModal.jsx";
import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";
import { CatalogChoiceCard, ICON_INPUT, IconField } from "../../../components/formFields.jsx";
import { ROUTES } from "../../../router/routes.js";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getMuestras } from "../../catalogos/service/muestrasService.js";
import { getOrdenesServicio, getOrdenServicioById } from "../../formatos-orden-servicio/service/formatoOrdenServicioService.js";
import { getLaboratorios } from "../../laboratorios/service/laboratorioService.js";
import {
  createEnsayo,
  formToEnsayoPayload,
  getEnsayoById,
  updateEnsayo,
} from "../service/ensayoService.js";
import { collectEnsayoIssues, ENSAYO_SECTION_LABELS, issuesToFormErrors } from "../utils/ensayoValidation.js";

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function nowDateTimeLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}T${h}:${min}`;
}

function emptyResultado() {
  return {
    idMuestra: "",
    idAnalisis: "",
    idMuestraxAnalisis: "",
    identificacionMuestra: "",
    nombreAnalisis: "",
    metodo: "",
    limiteRangoCuantificacion: "",
    resultado: "",
    incertidumbre: "",
    unidad: "",
    meq: "",
    valorMaximoAdmisible: "",
  };
}

function sessionUserName(user) {
  return [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim();
}

export default function EnsayoPage() {
  const { idEnsayo } = useParams();
  const isEdit = Boolean(idEnsayo);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [laboratorios, setLaboratorios] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [analisis, setAnalisis] = useState([]);
  const [errors, setErrors] = useState({});
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validationApiMessage, setValidationApiMessage] = useState("");
  const [validationTitle, setValidationTitle] = useState("");
  const [validationDescription, setValidationDescription] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    datosCampo: false,
    fechaInicio: todayIso(),
    fechaFin: todayIso(),
    planMuestreo: "",
    condicionesAmbientales: "",
    condicionesItem: "",
    clave: "",
    equivalencia: "",
    observaciones: "",
    usuarioElaboracion: sessionUserName(user),
    fechaElaboracion: nowDateTimeLocal(),
    idLaboratorio: "",
    idFormatoOrden: "",
    resultados: [emptyResultado()],
  });

  const analisisMap = useMemo(() => {
    const map = {};
    analisis.forEach((a) => {
      map[String(a.idAnalisis)] = a.nombreAnalisis;
    });
    return map;
  }, [analisis]);

  const muestraMap = useMemo(() => {
    const map = {};
    muestras.forEach((m) => {
      map[String(m.idMuestra)] = m.identificacion;
    });
    return map;
  }, [muestras]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [labs, ords, mues, anal] = await Promise.all([
          getLaboratorios(),
          getOrdenesServicio(),
          getMuestras(),
          getAnalisis(),
        ]);
        if (cancelled) return;
        setLaboratorios(labs);
        setOrdenes(ords);
        setMuestras(mues);
        setAnalisis(anal);

        if (isEdit) {
          const detalle = await getEnsayoById(idEnsayo);
          if (cancelled) return;
          setForm({
            datosCampo: detalle.datosCampo,
            fechaInicio: detalle.fechaInicio || todayIso(),
            fechaFin: detalle.fechaFin || todayIso(),
            planMuestreo: detalle.planMuestreo || "",
            condicionesAmbientales: detalle.condicionesAmbientales || "",
            condicionesItem: detalle.condicionesItem || "",
            clave: detalle.clave || "",
            equivalencia: detalle.equivalencia || "",
            observaciones: detalle.observaciones || "",
            usuarioElaboracion: detalle.usuarioElaboracion || sessionUserName(user),
            fechaElaboracion: detalle.fechaElaboracion || nowDateTimeLocal(),
            idLaboratorio: detalle.idLaboratorio ? String(detalle.idLaboratorio) : "",
            idFormatoOrden: detalle.idFormatoOrden ? String(detalle.idFormatoOrden) : "",
            resultados: (detalle.resultados ?? []).length
              ? detalle.resultados.map((r) => ({
                  ...emptyResultado(),
                  ...r,
                  idMuestra: r.idMuestra ? String(r.idMuestra) : "",
                  idAnalisis: r.idAnalisis ? String(r.idAnalisis) : "",
                  idMuestraxAnalisis: r.idMuestraxAnalisis ? String(r.idMuestraxAnalisis) : "",
                }))
              : [emptyResultado()],
          });
        }
      } catch (err) {
        addToast(err?.message || "No se pudieron cargar los datos", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [addToast, idEnsayo, isEdit, user]);

  function updateResultado(index, patch) {
    setForm((p) => ({
      ...p,
      resultados: p.resultados.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  }

  async function cargarDesdeOrden(idOrden) {
    if (!idOrden) {
      setErrors((p) => ({ ...p, idFormatoOrden: "Seleccione una orden para cargar sus muestras." }));
      return;
    }
    try {
      const orden = await getOrdenServicioById(idOrden);
      const filas = [];
      for (const d of orden.detalles ?? []) {
        const ids = (d.idsAnalisis ?? []).filter((id) => Number(id) > 0);
        if (ids.length === 0) {
          filas.push({
            ...emptyResultado(),
            idMuestra: d.idMuestra ? String(d.idMuestra) : "",
            identificacionMuestra: d.identificacion || "",
          });
        } else {
          ids.forEach((idAnalisis) => {
            filas.push({
              ...emptyResultado(),
              idMuestra: d.idMuestra ? String(d.idMuestra) : "",
              identificacionMuestra: d.identificacion || "",
              idAnalisis: String(idAnalisis),
              nombreAnalisis: analisisMap[String(idAnalisis)] || "",
            });
          });
        }
      }
      setForm((p) => ({
        ...p,
        idFormatoOrden: String(idOrden),
        resultados: filas.length ? filas : [emptyResultado()],
      }));
      addToast("Se cargaron las muestras de la orden", "success");
    } catch (err) {
      addToast(err?.message || "No se pudo cargar la orden", "error");
    }
  }

  function mostrarValidacion(issues, { title, description, apiMessage = "" } = {}) {
    setErrors(issuesToFormErrors(issues));
    setValidationIssues(issues);
    setValidationApiMessage(apiMessage);
    setValidationTitle(title);
    setValidationDescription(description);
    setValidationOpen(true);
  }

  function goNext() {
    const issues = collectEnsayoIssues(form, { steps: [currentStep] });
    if (issues.length) {
      mostrarValidacion(issues, {
        title: "No puede continuar al siguiente paso",
        description: `Revise los campos pendientes del paso ${currentStep} — ${ENSAYO_SECTION_LABELS[currentStep - 1]}.`,
      });
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const issues = collectEnsayoIssues(form, { steps: [1, 2, 3] });
    if (issues.length) {
      mostrarValidacion(issues, {
        title: isEdit ? "No se pudo guardar el ensayo" : "Complete los datos del formato",
        description: "Revise los campos pendientes antes de crear o actualizar el formato de ensayo.",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = formToEnsayoPayload({
        ...form,
        usuarioElaboracion: form.usuarioElaboracion || sessionUserName(user),
      });
      if (isEdit) {
        await updateEnsayo(idEnsayo, payload);
        addToast("Ensayo actualizado", "success");
      } else {
        await createEnsayo(payload);
        addToast("Ensayo creado", "success");
      }
      navigate(ROUTES.ensayos);
    } catch (err) {
      mostrarValidacion([], {
        title: "No se pudo guardar el ensayo",
        description: "El servidor rechazó el registro. Revise el motivo e intente de nuevo.",
        apiMessage: err?.message || "No se pudo guardar el ensayo",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-blue-900">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (currentStep < 3) goNext();
      }}
      className="min-h-full w-full bg-gray-100 text-gray-800"
    >
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">
        ÁREA DE PROYECCIÓN Y EXTENSIÓN
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-blue-900">
                {isEdit ? "Editar formato de ensayo" : "Nuevo formato de ensayo"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Vincule laboratorio y orden, registre condiciones y capture los resultados por muestra.
              </p>
            </div>

            <WizardStepIndicator currentStep={currentStep} labels={ENSAYO_SECTION_LABELS} />

            <div className="flex flex-col gap-6">
              {currentStep === 1 ? (
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Identificación
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">
                  Laboratorio, orden de servicio y origen de los datos
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="ensayo-laboratorio"
                    icon={Microscope}
                    tone="bg-violet-50 text-violet-700"
                    label="Laboratorio"
                    hint="Laboratorio que realiza el ensayo"
                    required
                    error={errors.idLaboratorio}
                  >
                    <select
                      id="ensayo-laboratorio"
                      className={ICON_INPUT}
                      value={form.idLaboratorio}
                      onChange={(e) => setForm((p) => ({ ...p, idLaboratorio: e.target.value }))}
                    >
                      <option value="">Seleccione un laboratorio</option>
                      {laboratorios.map((l) => (
                        <option key={l.idLaboratorio} value={l.idLaboratorio}>
                          {l.nombreLaboratorio}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  <IconField
                    id="ensayo-orden"
                    icon={ClipboardList}
                    tone="bg-indigo-50 text-indigo-700"
                    label="Orden de servicio"
                    hint="Puede cargar las muestras de la orden"
                    required
                    error={errors.idFormatoOrden}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        id="ensayo-orden"
                        className={ICON_INPUT}
                        value={form.idFormatoOrden}
                        onChange={(e) => setForm((p) => ({ ...p, idFormatoOrden: e.target.value }))}
                      >
                        <option value="">Seleccione una orden</option>
                        {ordenes.map((o) => (
                          <option key={o.idFormatoOrden} value={o.idFormatoOrden}>
                            Orden {o.numeroOrden ?? o.idFormatoOrden}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => cargarDesdeOrden(form.idFormatoOrden)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-blue-900 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                      >
                        <Download className="h-4 w-4" />
                        Cargar muestras
                      </button>
                    </div>
                  </IconField>
                  <IconField
                    id="ensayo-usuario"
                    icon={UserRound}
                    tone="bg-sky-50 text-sky-700"
                    label="Elaboró"
                    hint="Usuario que registra el formato"
                  >
                    <input
                      id="ensayo-usuario"
                      className={ICON_INPUT}
                      value={form.usuarioElaboracion || sessionUserName(user) || "Usuario actual"}
                      disabled
                    />
                  </IconField>
                  <IconField
                    id="ensayo-fechaElaboracion"
                    icon={CalendarDays}
                    tone="bg-blue-50 text-blue-800"
                    label="Fecha de elaboración"
                    hint="Registro del formato"
                  >
                    <input
                      id="ensayo-fechaElaboracion"
                      type="datetime-local"
                      className={ICON_INPUT}
                      value={form.fechaElaboracion}
                      onChange={(e) => setForm((p) => ({ ...p, fechaElaboracion: e.target.value }))}
                    />
                  </IconField>
                </div>

                <p className="mb-3 mt-5 text-sm font-semibold text-gray-800">Origen de los datos</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CatalogChoiceCard
                    selected={form.datosCampo === true}
                    icon={MapPin}
                    tone="bg-emerald-100 text-emerald-700"
                    label="Incluye datos de campo"
                    hint="El ensayo usa mediciones tomadas en campo"
                    onClick={() => setForm((p) => ({ ...p, datosCampo: true }))}
                  />
                  <CatalogChoiceCard
                    selected={form.datosCampo === false}
                    icon={Microscope}
                    tone="bg-indigo-100 text-indigo-700"
                    label="Solo laboratorio"
                    hint="Sin mediciones de campo"
                    onClick={() => setForm((p) => ({ ...p, datosCampo: false }))}
                  />
                </div>
              </section>
              ) : null}

              {currentStep === 2 ? (
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-yellow-400" />
                  Periodo y condiciones
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">
                  Fechas del ensayo, plan de muestreo y condiciones del ítem
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="ensayo-fechaInicio"
                    icon={CalendarDays}
                    tone="bg-amber-50 text-amber-700"
                    label="Fecha de inicio"
                    hint="Día en que inicia el ensayo"
                    required
                    error={errors.fechaInicio}
                  >
                    <input
                      id="ensayo-fechaInicio"
                      type="date"
                      className={ICON_INPUT}
                      value={form.fechaInicio}
                      onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
                    />
                  </IconField>
                  <IconField
                    id="ensayo-fechaFin"
                    icon={CalendarCheck}
                    tone="bg-teal-50 text-teal-700"
                    label="Fecha de fin"
                    hint="Día en que concluye el ensayo"
                    required
                    error={errors.fechaFin}
                  >
                    <input
                      id="ensayo-fechaFin"
                      type="date"
                      className={ICON_INPUT}
                      value={form.fechaFin}
                      onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
                    />
                  </IconField>
                  <IconField
                    id="ensayo-plan"
                    icon={ClipboardList}
                    tone="bg-blue-50 text-blue-800"
                    label="Plan de muestreo"
                    hint="Referencia o código del plan"
                    required
                    error={errors.planMuestreo}
                    className="md:col-span-2"
                  >
                    <input
                      id="ensayo-plan"
                      className={ICON_INPUT}
                      value={form.planMuestreo}
                      onChange={(e) => setForm((p) => ({ ...p, planMuestreo: e.target.value }))}
                      placeholder="Plan o referencia de muestreo"
                    />
                  </IconField>
                  <IconField
                    id="ensayo-amb"
                    icon={Wind}
                    tone="bg-sky-50 text-sky-700"
                    label="Condiciones ambientales"
                    hint="Temperatura, humedad u otras"
                    required
                    error={errors.condicionesAmbientales}
                  >
                    <input
                      id="ensayo-amb"
                      className={ICON_INPUT}
                      value={form.condicionesAmbientales}
                      onChange={(e) => setForm((p) => ({ ...p, condicionesAmbientales: e.target.value }))}
                      placeholder="Condiciones del ambiente"
                    />
                  </IconField>
                  <IconField
                    id="ensayo-item"
                    icon={Thermometer}
                    tone="bg-cyan-50 text-cyan-700"
                    label="Condiciones del ítem"
                    hint="Estado de la muestra al ensayar"
                    required
                    error={errors.condicionesItem}
                  >
                    <input
                      id="ensayo-item"
                      className={ICON_INPUT}
                      value={form.condicionesItem}
                      onChange={(e) => setForm((p) => ({ ...p, condicionesItem: e.target.value }))}
                      placeholder="Condición del ítem"
                    />
                  </IconField>
                  <IconField
                    id="ensayo-clave"
                    icon={KeyRound}
                    tone="bg-amber-50 text-amber-800"
                    label="Clave"
                    hint="Clave o código interno (opcional)"
                  >
                    <input
                      id="ensayo-clave"
                      className={ICON_INPUT}
                      value={form.clave}
                      onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))}
                      placeholder="Clave"
                    />
                  </IconField>
                  <IconField
                    id="ensayo-equivalencia"
                    icon={Scale}
                    tone="bg-violet-50 text-violet-700"
                    label="Equivalencia"
                    hint="Equivalencia o conversión (opcional)"
                  >
                    <input
                      id="ensayo-equivalencia"
                      className={ICON_INPUT}
                      value={form.equivalencia}
                      onChange={(e) => setForm((p) => ({ ...p, equivalencia: e.target.value }))}
                      placeholder="Equivalencia"
                    />
                  </IconField>
                  <IconField
                    id="ensayo-obs"
                    icon={StickyNote}
                    tone="bg-stone-100 text-stone-700"
                    label="Observaciones"
                    hint="Notas adicionales del ensayo"
                    className="md:col-span-2"
                  >
                    <textarea
                      id="ensayo-obs"
                      className={`${ICON_INPUT} min-h-[88px] resize-y`}
                      value={form.observaciones}
                      onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                      placeholder="Observaciones"
                    />
                  </IconField>
                </div>
              </section>
              ) : null}

              {currentStep === 3 ? (
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                      <span className="h-7 w-1 rounded-full bg-blue-900" />
                      Resultados
                    </h3>
                    <p className="ml-4 mt-1 text-sm text-gray-500">
                      Cada tarjeta es un resultado de muestra y análisis
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, resultados: [...p.resultados, emptyResultado()] }))}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar resultado
                  </button>
                </div>
                {errors.resultados ? (
                  <p className="mb-3 text-xs font-medium text-red-500">{errors.resultados}</p>
                ) : null}

                <div className="space-y-4">
                  {form.resultados.map((fila, index) => (
                    <article key={index} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-blue-900">Resultado {index + 1}</p>
                            <p className="truncate text-xs text-gray-500">
                              {fila.identificacionMuestra || muestraMap[fila.idMuestra] || "Sin muestra"}
                              {fila.nombreAnalisis || analisisMap[fila.idAnalisis]
                                ? ` · ${fila.nombreAnalisis || analisisMap[fila.idAnalisis]}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          title="Eliminar resultado"
                          disabled={form.resultados.length <= 1}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              resultados: p.resultados.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Eliminar resultado</span>
                        </button>
                      </header>
                      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
                        <IconField
                          id={`ensayo-muestra-${index}`}
                          icon={FlaskConical}
                          tone="bg-cyan-50 text-cyan-700"
                          label="Muestra"
                          hint="Identificación"
                          required
                          error={errors[`muestra-${index}`]}
                          className="lg:col-span-2"
                        >
                          <select
                            id={`ensayo-muestra-${index}`}
                            className={ICON_INPUT}
                            value={fila.idMuestra}
                            onChange={(e) =>
                              updateResultado(index, {
                                idMuestra: e.target.value,
                                identificacionMuestra: muestraMap[e.target.value] || "",
                              })
                            }
                          >
                            <option value="">Seleccione una muestra</option>
                            {muestras.map((m) => (
                              <option key={m.idMuestra} value={m.idMuestra}>
                                {m.identificacion || `Muestra #${m.idMuestra}`}
                              </option>
                            ))}
                          </select>
                        </IconField>
                        <IconField
                          id={`ensayo-analisis-${index}`}
                          icon={TestTube}
                          tone="bg-violet-50 text-violet-700"
                          label="Análisis"
                          hint="Ensayo solicitado"
                          required
                          error={errors[`analisis-${index}`]}
                          className="lg:col-span-2"
                        >
                          <select
                            id={`ensayo-analisis-${index}`}
                            className={ICON_INPUT}
                            value={fila.idAnalisis}
                            onChange={(e) =>
                              updateResultado(index, {
                                idAnalisis: e.target.value,
                                nombreAnalisis: analisisMap[e.target.value] || "",
                              })
                            }
                          >
                            <option value="">Seleccione un análisis</option>
                            {analisis.map((a) => (
                              <option key={a.idAnalisis} value={a.idAnalisis}>
                                {a.nombreAnalisis}
                              </option>
                            ))}
                          </select>
                        </IconField>
                        <IconField
                          id={`ensayo-metodo-${index}`}
                          icon={BookOpen}
                          tone="bg-indigo-50 text-indigo-700"
                          label="Método"
                          hint="Método analítico"
                        >
                          <input
                            id={`ensayo-metodo-${index}`}
                            className={ICON_INPUT}
                            value={fila.metodo}
                            onChange={(e) => updateResultado(index, { metodo: e.target.value })}
                            placeholder="Método"
                          />
                        </IconField>
                        <IconField
                          id={`ensayo-resultado-${index}`}
                          icon={Hash}
                          tone="bg-blue-50 text-blue-800"
                          label="Resultado"
                          hint="Valor obtenido"
                        >
                          <input
                            id={`ensayo-resultado-${index}`}
                            className={ICON_INPUT}
                            value={fila.resultado}
                            onChange={(e) => updateResultado(index, { resultado: e.target.value })}
                            placeholder="Resultado"
                          />
                        </IconField>
                        <IconField
                          id={`ensayo-unidad-${index}`}
                          icon={Beaker}
                          tone="bg-teal-50 text-teal-700"
                          label="Unidad"
                          hint="Unidad de medida"
                        >
                          <input
                            id={`ensayo-unidad-${index}`}
                            className={ICON_INPUT}
                            value={fila.unidad}
                            onChange={(e) => updateResultado(index, { unidad: e.target.value })}
                            placeholder="mg/L"
                          />
                        </IconField>
                        <IconField
                          id={`ensayo-limite-${index}`}
                          icon={Gauge}
                          tone="bg-amber-50 text-amber-700"
                          label="Límite / rango"
                          hint="Cuantificación"
                        >
                          <input
                            id={`ensayo-limite-${index}`}
                            className={ICON_INPUT}
                            value={fila.limiteRangoCuantificacion}
                            onChange={(e) =>
                              updateResultado(index, { limiteRangoCuantificacion: e.target.value })
                            }
                            placeholder="Límite"
                          />
                        </IconField>
                        <IconField
                          id={`ensayo-incert-${index}`}
                          icon={Percent}
                          tone="bg-orange-50 text-orange-700"
                          label="Incertidumbre"
                          hint="Incertidumbre del método"
                        >
                          <input
                            id={`ensayo-incert-${index}`}
                            className={ICON_INPUT}
                            value={fila.incertidumbre}
                            onChange={(e) => updateResultado(index, { incertidumbre: e.target.value })}
                            placeholder="Incertidumbre"
                          />
                        </IconField>
                        <IconField
                          id={`ensayo-meq-${index}`}
                          icon={Droplets}
                          tone="bg-sky-50 text-sky-700"
                          label="Meq"
                          hint="Miliequivalentes"
                        >
                          <input
                            id={`ensayo-meq-${index}`}
                            className={ICON_INPUT}
                            value={fila.meq}
                            onChange={(e) => updateResultado(index, { meq: e.target.value })}
                            placeholder="Meq"
                          />
                        </IconField>
                        <IconField
                          id={`ensayo-vma-${index}`}
                          icon={ShieldAlert}
                          tone="bg-rose-50 text-rose-700"
                          label="VMA"
                          hint="Valor máximo admisible"
                          className="md:col-span-2 lg:col-span-2"
                        >
                          <input
                            id={`ensayo-vma-${index}`}
                            className={ICON_INPUT}
                            value={fila.valorMaximoAdmisible}
                            onChange={(e) =>
                              updateResultado(index, { valorMaximoAdmisible: e.target.value })
                            }
                            placeholder="VMA"
                          />
                        </IconField>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-8 py-6 md:px-10">
            <button
              type="button"
              onClick={currentStep === 1 ? () => navigate(ROUTES.ensayos) : goPrev}
              className="flex items-center gap-2 rounded-lg border-2 border-blue-900 px-6 py-2 font-semibold text-blue-900 transition-all hover:bg-blue-50"
            >
              <ChevronLeft className="h-5 w-5" />
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </button>
            <div className="text-sm font-semibold text-gray-600">
              Paso {currentStep} de 3 — {ENSAYO_SECTION_LABELS[currentStep - 1]}
            </div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg"
              >
                Siguiente
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isEdit ? "Guardar cambios" : "Crear ensayo"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ValidationIssuesModal
        open={validationOpen}
        title={validationTitle || "Complete los datos del formato"}
        description={
          validationDescription ||
          "Revise los campos pendientes antes de crear o actualizar el formato de ensayo."
        }
        issues={validationIssues}
        apiMessage={validationApiMessage}
        onClose={() => setValidationOpen(false)}
        onGoToStep={(step) => {
          setValidationOpen(false);
          if (step) setCurrentStep(step);
        }}
        primaryLabel="Ir a corregir"
      />
    </form>
  );
}
