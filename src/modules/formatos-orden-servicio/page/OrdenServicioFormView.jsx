import { useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  MapPin,
  Plus,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";
import { labelFormatoCampo } from "../service/catalogosOrdenService.js";
import OrdenValidationModal from "../components/OrdenValidationModal.jsx";
import {
  collectOrdenIssues,
  issuesForStep,
  issuesToFormErrors,
  mapApiErrorToIssues,
} from "../utils/ordenValidation.js";

const TOTAL_STEPS = 3;
const STEP_LABELS = ["Cliente", "Servicios solicitados", "Logística y cierre"];

const HORAS_COMPUESTO = [
  { key: "compuesto8h", label: "8 h" },
  { key: "compuesto12h", label: "12 h" },
  { key: "compuesto16h", label: "16 h" },
  { key: "compuesto24h", label: "24 h" },
];

const SERVICIOS_OPCIONES = [
  { name: "analisisOrden", label: "Análisis", desc: "Determinación en laboratorio", icon: FlaskConical },
  { name: "muestreoOrden", label: "Muestreo in situ", desc: "Toma de muestra en campo", icon: MapPin },
  { name: "hojaObservacionOrden", label: "Hoja de observación", desc: "Registro de condiciones", icon: FileText },
  { name: "informeTecnicoOrden", label: "Informe técnico", desc: "Documento de resultados", icon: BarChart3 },
];

function labelUsuario(u) {
  const nombre = u.nombreUsuario ?? u.NombreUsuario ?? "";
  const apellido = u.apellidoUsuario ?? u.ApellidoUsuario ?? "";
  return `${nombre} ${apellido}`.trim() || nombre;
}

function validationExtras(formViewProps) {
  return {
    usuarios: formViewProps.usuarios ?? [],
    formatosCampo: formViewProps.formatosCampo ?? [],
    idUsuarioSesion: formViewProps.idUsuarioSesion ?? null,
    catalogsReady: !formViewProps.catalogsLoading,
  };
}

function SectionHeader({ accent = "bg-blue-900", title, subtitle }) {
  return (
    <div className="mb-6">
      <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
        <span className={`h-7 w-1 shrink-0 rounded-full ${accent}`} />
        {title}
      </h3>
      {subtitle && <p className="ml-4 text-sm text-[#6a7282]">{subtitle}</p>}
    </div>
  );
}

function FloatInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = " ",
  error,
  required,
  className = "",
}) {
  const id = `orden-${name}`;
  return (
    <div className={`relative group ${className}`}>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`peer w-full border-b-2 bg-transparent px-0 py-3 placeholder-transparent transition-colors focus:outline-none ${
          error ? "border-red-500" : "border-gray-300 focus:border-blue-900"
        }`}
      />
      <label
        htmlFor={id}
        className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-blue-900"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-slate-50/80 p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function ChoiceButton({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 ${className} ${
        active
          ? "border-blue-900 bg-blue-900 text-white shadow-md"
          : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50/50"
      }`}
    >
      {children}
    </button>
  );
}

function ServiceCard({ name, label, desc, icon: Icon, checked, onChange }) {
  return (
    <label
      className={`group flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-5 transition-all duration-200 ${
        checked
          ? "border-blue-900 bg-gradient-to-br from-blue-50 to-white shadow-md ring-1 ring-blue-100"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
            checked ? "bg-blue-900 text-white" : "bg-gray-100 text-blue-900 group-hover:bg-blue-100"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
        />
      </div>
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
      </div>
    </label>
  );
}

export default function OrdenServicioFormView({
  form,
  formErrors = {},
  onChange,
  onDetalleChange,
  onAddDetalleRow,
  onRemoveDetalleRow,
  onControlRecepcionChange,
  onAddControlRecepcionRow,
  onRemoveControlRecepcionRow,
  onSubmit,
  onCancel,
  onFormErrors,
  saving,
  isEditing = false,
  catalogsLoading = false,
  idUsuarioSesion = null,
  departamentos,
  municipiosFiltrados,
  usuarios = [],
  formatosCampo = [],
  tiposMuestreo = [],
  solicitudOrigen = null,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [apiMessage, setApiMessage] = useState("");
  const compuesto = form.modalidadMuestreo === "compuesto";
  const otros = form.modalidadMuestreo === "otros";
  const extras = validationExtras({ usuarios, formatosCampo, idUsuarioSesion, catalogsLoading });

  function goNext() {
    const stepIssues = issuesForStep(
      collectOrdenIssues(form, { ...extras, includeCatalogIssues: currentStep === 1 }),
      currentStep,
    );
    onFormErrors?.(issuesToFormErrors(stepIssues));
    if (stepIssues.length > 0) return;
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStepFromModal(step) {
    setValidationOpen(false);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    // Enter en un input o un clic reciclado no deben crear la orden fuera del paso 3.
    if (currentStep < TOTAL_STEPS) {
      goNext();
      return;
    }

    const issues = collectOrdenIssues(form, extras);
    onFormErrors?.(issuesToFormErrors(issues));
    if (issues.length > 0) {
      setValidationIssues(issues);
      setApiMessage("");
      setValidationOpen(true);
      return;
    }

    try {
      await onSubmit(e);
    } catch (err) {
      if (err?.issues?.length) {
        setValidationIssues(err.issues);
        setApiMessage("");
      } else {
        const known = mapApiErrorToIssues(err?.message);
        setValidationIssues(known);
        setApiMessage(known.length > 0 ? "" : (err?.message ?? "No se pudo guardar la orden."));
      }
      setValidationOpen(true);
    }
  }

  function setRadio(name, value) {
    onChange({ target: { name, value, type: "radio" } });
  }

  function setCheckbox(name, checked) {
    onChange({ target: { name, type: "checkbox", checked } });
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-gray-100">
      <div className="bg-yellow-400 py-2.5 text-center text-sm font-bold tracking-wide text-blue-900">
        ORDEN DE SERVICIO DE LABORATORIO — CIRA · UNAN-Managua
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-10 xl:max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-blue-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al listado
          </button>
          {catalogsLoading && (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              <FaSpinner className="h-3 w-3 animate-spin" />
              Cargando catálogos…
            </span>
          )}
        </div>

        {solicitudOrigen && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-medium">Orden vinculada a la solicitud</p>
            <p className="mt-0.5 text-blue-800">
              Se cargaron los datos del cliente y del servicio desde la solicitud{" "}
              <span className="font-semibold">{solicitudOrigen}</span>.
            </p>
          </div>
        )}

        <WizardStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} />

        <form id="orden-servicio-form" onSubmit={handleFinalSubmit} noValidate>
          <div className="w-full overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="p-8 md:p-10">
              {/* ── SECCIÓN 1: CLIENTE ── */}
              {currentStep === 1 && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-3xl font-bold text-blue-900">Información del cliente</h2>
                    <p className="mt-1 text-[#6a7282]">
                      Datos de la orden, contacto y ubicación. Campos con{" "}
                      <span className="text-red-500">*</span> son obligatorios.
                    </p>
                  </div>

                  <div>
                    <SectionHeader title="Datos de la orden" subtitle="Número, proforma y fecha de recepción" />
                    <div className="ml-4 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                      <FloatInput
                        label="Orden Nº"
                        name="numeroOrden"
                        type="number"
                        value={form.numeroOrden}
                        onChange={onChange}
                        error={formErrors.numeroOrden}
                        required
                      />
                      <FloatInput
                        label="Proforma Nº"
                        name="proformaNo"
                        value={form.proformaNo}
                        onChange={onChange}
                      />
                      <FloatInput
                        label="Fecha de recepción"
                        name="fecha"
                        type="date"
                        value={form.fecha}
                        onChange={onChange}
                        error={formErrors.fecha}
                        required
                      />
                    </div>
                  </div>

                  <Panel>
                    <SectionHeader
                      accent="bg-amber-400"
                      title="Vinculación en sistema"
                      subtitle="Obligatorios para crear la orden: usuario responsable y formato de campo"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="orden-idUsuario" className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Usuario del sistema <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="orden-idUsuario"
                          name="idUsuario"
                          value={form.idUsuario}
                          onChange={onChange}
                          className={`select ${formErrors.idUsuario ? "border-red-500" : ""}`}
                        >
                          <option value="">Seleccione usuario</option>
                          {usuarios.map((u) => {
                            const id = u.idUsuario ?? u.IdUsuario;
                            return (
                              <option key={id} value={String(id)}>
                                {labelUsuario(u)}
                              </option>
                            );
                          })}
                        </select>
                        {formErrors.idUsuario && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.idUsuario}</p>
                        )}
                        {usuarios.length === 0 && !catalogsLoading && (
                          <p className="mt-1 text-xs text-amber-700">No hay usuarios activos. Regístrelos en Gestión de Usuarios.</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="orden-idFormatoCampo" className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Formato de campo <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="orden-idFormatoCampo"
                          name="idFormatoCampo"
                          value={form.idFormatoCampo}
                          onChange={onChange}
                          className={`select ${formErrors.idFormatoCampo ? "border-red-500" : ""}`}
                        >
                          <option value="">Seleccione formato</option>
                          {formatosCampo.map((f) => (
                            <option key={f.idFormatoCampo} value={String(f.idFormatoCampo)}>
                              {labelFormatoCampo(f)}
                            </option>
                          ))}
                        </select>
                        {formErrors.idFormatoCampo && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.idFormatoCampo}</p>
                        )}
                        {formatosCampo.length === 0 && !catalogsLoading && (
                          <p className="mt-1 text-xs text-amber-700">No hay formatos de campo. Créelos en Información de Campo.</p>
                        )}
                      </div>
                    </div>
                  </Panel>

                  <div>
                    <SectionHeader
                      accent="bg-blue-600"
                      title="Contacto"
                      subtitle="Empresa, persona de contacto y medios de comunicación"
                    />
                    <div className="ml-4 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                      <FloatInput
                        label="Usuario / Empresa"
                        name="usuarioEmpresa"
                        value={form.usuarioEmpresa}
                        onChange={onChange}
                        error={formErrors.usuarioEmpresa}
                        required
                        className="md:col-span-2 lg:col-span-3"
                      />
                      <FloatInput label="Atención a" name="atencionA" value={form.atencionA} onChange={onChange} />
                      <FloatInput
                        label="Correo electrónico"
                        name="correo"
                        type="email"
                        value={form.correo}
                        onChange={onChange}
                        error={formErrors.correo}
                      />
                      <FloatInput
                        label="Teléfono"
                        name="telefono"
                        value={form.telefono}
                        onChange={onChange}
                        error={formErrors.telefono}
                      />
                      <FloatInput
                        label="Celular"
                        name="celular"
                        value={form.celular}
                        onChange={onChange}
                        error={formErrors.celular}
                      />
                      <FloatInput label="Ext." name="extension" value={form.extension} onChange={onChange} />
                    </div>
                  </div>

                  <div>
                    <SectionHeader accent="bg-emerald-600" title="Ubicación" subtitle="Dirección y departamento" />
                    <div className="ml-4 grid grid-cols-1 gap-8 md:grid-cols-2">
                      <FloatInput
                        label="Dirección"
                        name="direccion"
                        value={form.direccion}
                        onChange={onChange}
                        className="md:col-span-2"
                      />
                      <div>
                        <label htmlFor="orden-departamento" className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Departamento
                        </label>
                        <select
                          id="orden-departamento"
                          name="departamento"
                          value={form.departamento}
                          onChange={onChange}
                          className="select"
                        >
                          <option value="">Seleccione departamento</option>
                          {departamentos.map((d) => {
                            const nombre = d.nombreDepartamento ?? d.NombreDepartamento ?? d.nombre ?? "";
                            return (
                              <option key={nombre} value={nombre}>
                                {nombre}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="orden-municipio" className="mb-1.5 block text-sm font-semibold text-gray-700">
                          Municipio
                        </label>
                        <select
                          id="orden-municipio"
                          name="municipio"
                          value={form.municipio}
                          onChange={onChange}
                          className="select"
                        >
                          <option value="">
                            {form.departamento ? "Seleccione municipio" : "Primero elija departamento"}
                          </option>
                          {municipiosFiltrados.map((m) => {
                            const nombre = m.nombreMunicipio ?? m.NombreMunicipio ?? m.nombre ?? "";
                            return (
                              <option key={nombre} value={nombre}>
                                {nombre}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECCIÓN 2: SERVICIOS SOLICITADOS + TABLAS ── */}
              {currentStep === 2 && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900 sm:text-3xl">Servicios solicitados</h2>
                    <p className="mt-1 text-[#6a7282]">
                      Servicios, tipo de muestreo, detalle de muestras y control de recepción
                    </p>
                  </div>

                  <div>
                    <SectionHeader title="Servicios requeridos" subtitle="Seleccione uno o más servicios" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {SERVICIOS_OPCIONES.map((s) => (
                        <ServiceCard
                          key={s.name}
                          name={s.name}
                          label={s.label}
                          desc={s.desc}
                          icon={s.icon}
                          checked={form[s.name]}
                          onChange={onChange}
                        />
                      ))}
                    </div>
                    <div className="mt-5 ml-4">
                      <FloatInput
                        label="Otro servicio (especifique)"
                        name="otroServicio"
                        value={form.otroServicio}
                        onChange={onChange}
                        className="md:max-w-xl lg:max-w-2xl"
                      />
                    </div>
                  </div>

                  <Panel>
                    <SectionHeader
                      accent="bg-amber-400"
                      title="Tipo de muestreo solicitado"
                      subtitle="El catálogo es obligatorio; la modalidad detalla el muestreo en el formulario"
                    />
                    <div className="mb-5 max-w-xl">
                      <label htmlFor="orden-idTipoMuestreo" className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Tipo de muestreo (catálogo) <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="orden-idTipoMuestreo"
                        name="idTipoMuestreo"
                        value={form.idTipoMuestreo}
                        onChange={onChange}
                        className={`select ${formErrors.idTipoMuestreo ? "border-red-500" : ""}`}
                      >
                        <option value="">Seleccione tipo de muestreo</option>
                        {tiposMuestreo.map((t) => (
                          <option key={t.idTipoMuestreo} value={String(t.idTipoMuestreo)}>
                            {t.nombreTipoMuestreo || t.nombre}
                          </option>
                        ))}
                      </select>
                      {formErrors.idTipoMuestreo && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.idTipoMuestreo}</p>
                      )}
                      {tiposMuestreo.length === 0 && !catalogsLoading && (
                        <p className="mt-1 text-xs text-amber-700">
                          No hay tipos de muestreo activos. Cárguelos en el catálogo.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <ChoiceButton
                        active={form.modalidadMuestreo === "puntual"}
                        onClick={() => setRadio("modalidadMuestreo", "puntual")}
                      >
                        Puntual
                      </ChoiceButton>
                      <ChoiceButton
                        active={form.modalidadMuestreo === "compuesto"}
                        onClick={() => setRadio("modalidadMuestreo", "compuesto")}
                      >
                        Compuesto
                      </ChoiceButton>
                      <ChoiceButton
                        active={form.modalidadMuestreo === "otros"}
                        onClick={() => setRadio("modalidadMuestreo", "otros")}
                      >
                        Otros
                      </ChoiceButton>
                    </div>

                    {otros && (
                      <div className="mt-5 md:max-w-lg lg:max-w-xl">
                        <FloatInput
                          label="Especifique el tipo de muestreo"
                          name="modalidadMuestreoOtros"
                          value={form.modalidadMuestreoOtros}
                          onChange={onChange}
                          error={formErrors.modalidadMuestreoOtros}
                          required
                        />
                      </div>
                    )}

                    {compuesto && (
                      <div className="mt-5">
                        <p className="mb-3 text-sm font-semibold text-gray-700">Duración del compuesto</p>
                        <div className="flex flex-wrap gap-3">
                          {HORAS_COMPUESTO.map(({ key, label }) => (
                            <ChoiceButton
                              key={key}
                              active={form[key]}
                              onClick={() => setCheckbox(key, !form[key])}
                              className="min-w-[4.5rem]"
                            >
                              {label}
                            </ChoiceButton>
                          ))}
                        </div>
                        {formErrors.compuestoOpcion && (
                          <p className="mt-2 text-xs text-red-600">{formErrors.compuestoOpcion}</p>
                        )}
                      </div>
                    )}
                  </Panel>

                  <div>
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <SectionHeader
                        title="Detalle de muestras"
                        subtitle="Registre cada muestra y el análisis o medición solicitada"
                      />
                      <button
                        type="button"
                        onClick={onAddDetalleRow}
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 hover:shadow-lg"
                      >
                        <Plus className="h-4 w-4" />
                        Añadir muestra
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                      <table className="w-full min-w-[580px] text-left text-sm">
                        <thead>
                          <tr className="bg-blue-900 text-xs uppercase tracking-wide text-white">
                            <th className="w-12 px-4 py-3.5 font-semibold">#</th>
                            <th className="px-4 py-3.5 font-semibold">Nº muestra / medición</th>
                            <th className="px-4 py-3.5 font-semibold">Análisis solicitado</th>
                            <th className="px-4 py-3.5 font-semibold">Código asignado</th>
                            <th className="w-14 px-2 py-3.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {form.detalleMuestras.map((row, index) => (
                            <tr key={index} className="transition-colors hover:bg-blue-50/30">
                              <td className="px-4 py-3 text-center text-xs font-bold text-blue-900">
                                {String(index + 1).padStart(2, "0")}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.numeroMuestra}
                                  onChange={(e) => onDetalleChange(index, "numeroMuestra", e.target.value)}
                                  className="input border-gray-200"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.analisis}
                                  onChange={(e) => onDetalleChange(index, "analisis", e.target.value)}
                                  className="input border-gray-200"
                                  placeholder="DQO, DBO5, pH…"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.codigoAsignado ?? row.codigoLab ?? ""}
                                  onChange={(e) =>
                                    onDetalleChange(index, "codigoAsignado", e.target.value)
                                  }
                                  className={`input bg-gray-50 font-mono text-sm ${
                                    formErrors[`detalleMuestras.${index}.codigoAsignado`]
                                      ? "border-red-500"
                                      : "border-gray-200"
                                  }`}
                                  placeholder="AR-0001"
                                />
                                {formErrors[`detalleMuestras.${index}.codigoAsignado`] && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {formErrors[`detalleMuestras.${index}.codigoAsignado`]}
                                  </p>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {form.detalleMuestras.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveDetalleRow(index)}
                                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                                    title="Eliminar fila"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {formErrors.detalleMuestras && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.detalleMuestras}</p>
                    )}
                    {form.detalleMuestras.length === 0 && (
                      <p className="mt-3 text-center text-sm text-gray-500">
                        No hay muestras registradas. Use el botón «Añadir muestra».
                      </p>
                    )}
                  </div>

                  <Panel>
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <SectionHeader
                        accent="bg-amber-400"
                        title="Control de recepción"
                        subtitle="Uso interno del laboratorio al recibir las muestras"
                      />
                      <button
                        type="button"
                        onClick={onAddControlRecepcionRow}
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border-2 border-blue-900 px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4" />
                        Añadir fila
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <table className="w-full min-w-[600px] text-left text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                            <th className="px-4 py-3 font-semibold">Laboratorio</th>
                            <th className="px-4 py-3 font-semibold">Recibido por</th>
                            <th className="px-4 py-3 font-semibold">Fecha entrega resultados</th>
                            <th className="w-14 px-2 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {form.controlRecepcion.map((row, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.laboratorio}
                                  onChange={(e) => onControlRecepcionChange(index, "laboratorio", e.target.value)}
                                  className="input"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row.recibidoPor}
                                  onChange={(e) => onControlRecepcionChange(index, "recibidoPor", e.target.value)}
                                  className="input"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="date"
                                  value={row.fechaEntregaResultados}
                                  onChange={(e) =>
                                    onControlRecepcionChange(index, "fechaEntregaResultados", e.target.value)
                                  }
                                  className="input"
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                {form.controlRecepcion.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveControlRecepcionRow(index)}
                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </div>
              )}

              {/* ── SECCIÓN 3: LOGÍSTICA, DEMÁS CAMPOS Y FIRMAS ── */}
              {currentStep === 3 && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900 sm:text-3xl">Logística y cierre</h2>
                    <p className="mt-1 text-[#6a7282]">
                      Muestreo, transporte, normativa, observaciones y firmas de conformidad
                    </p>
                  </div>

                  <Panel>
                    <SectionHeader
                      accent="bg-amber-400"
                      title="Estado de la orden"
                      subtitle="Obligatorio al crear: indica en qué etapa queda el registro"
                    />
                    <div className="max-w-md">
                      <label htmlFor="orden-estadoOrden" className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Estado <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="orden-estadoOrden"
                        name="estadoOrden"
                        value={form.estadoOrden}
                        onChange={onChange}
                        className={`select ${formErrors.estadoOrden ? "border-red-500" : ""}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Completada">Completada</option>
                        <option value="Anulada">Anulada</option>
                      </select>
                      {formErrors.estadoOrden && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.estadoOrden}</p>
                      )}
                    </div>
                  </Panel>

                  <Panel>
                    <SectionHeader
                      accent="bg-blue-600"
                      title="Muestreo y transporte"
                      subtitle="Responsables de la toma de muestra y el traslado"
                    />
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div>
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <MapPin className="h-4 w-4 text-blue-900" />
                          Muestreo realizado por
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <ChoiceButton
                            active={form.muestreoPor === "usuario"}
                            onClick={() => setRadio("muestreoPor", "usuario")}
                          >
                            Usuario
                          </ChoiceButton>
                          <ChoiceButton
                            active={form.muestreoPor === "cira"}
                            onClick={() => setRadio("muestreoPor", "cira")}
                          >
                            Personal CIRA
                          </ChoiceButton>
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Truck className="h-4 w-4 text-blue-900" />
                          Transporte a cargo del
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <ChoiceButton
                            active={form.transportePor === "usuario"}
                            onClick={() => setRadio("transportePor", "usuario")}
                          >
                            Usuario
                          </ChoiceButton>
                          <ChoiceButton
                            active={form.transportePor === "cira"}
                            onClick={() => setRadio("transportePor", "cira")}
                          >
                            CIRA
                          </ChoiceButton>
                        </div>
                      </div>
                    </div>
                  </Panel>

                  <Panel>
                    <SectionHeader title="Normativa e informe" subtitle="Inclusión de normas en el documento final" />
                    <div className="mb-5 flex flex-wrap gap-3">
                      <ChoiceButton
                        active={form.incluirNormaInforme === "si"}
                        onClick={() => setRadio("incluirNormaInforme", "si")}
                      >
                        Sí, incluir norma
                      </ChoiceButton>
                      <ChoiceButton
                        active={form.incluirNormaInforme === "no"}
                        onClick={() => setRadio("incluirNormaInforme", "no")}
                      >
                        No fue solicitado
                      </ChoiceButton>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <FloatInput
                        label="Laboratorio específico"
                        name="especificarLab"
                        value={form.especificarLab}
                        onChange={onChange}
                      />
                      <FloatInput
                        label="Norma / Decreto"
                        name="especificarNorma"
                        value={form.especificarNorma}
                        onChange={onChange}
                      />
                    </div>
                  </Panel>

                  <div>
                    <SectionHeader title="Observaciones" subtitle="Requerimientos especiales o condiciones de entrega" />
                    <div className="ml-4">
                      <textarea
                        id="orden-observacionOrden"
                        name="observacionOrden"
                        rows={4}
                        value={form.observacionOrden}
                        onChange={onChange}
                        className="textarea w-full resize-y rounded-xl border-gray-200 focus:ring-blue-900"
                        placeholder="Escriba aquí cualquier nota adicional…"
                        maxLength={200}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Máximo 200 caracteres ({String(form.observacionOrden ?? "").length}/200).
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-10">
                    <SectionHeader
                      accent="bg-emerald-600"
                      title="Protocolo de firmas"
                      subtitle="Al final del formulario — conformidad del usuario y recepción CIRA"
                    />
                    <div className="grid gap-8 lg:grid-cols-2">
                      <Panel className="bg-white">
                        <p className="mb-4 text-sm font-bold text-blue-900">Firma del usuario</p>
                        <FloatInput
                          label="Nombre completo"
                          name="firmaUsuario"
                          value={form.firmaUsuario}
                          onChange={onChange}
                        />
                        <div className="mt-5 rounded-xl border-2 border-dashed border-gray-200 bg-slate-50 px-6 py-12 text-center">
                          <User className="mx-auto h-9 w-9 text-gray-300" />
                          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                            Firma del usuario
                          </p>
                          <p className="mt-1 text-xs text-gray-400">Nombre y sello</p>
                        </div>
                      </Panel>

                      <Panel className="bg-white">
                        <p className="mb-4 text-sm font-bold text-blue-900">
                          Firma — Área de Proyección y Extensión
                        </p>
                        <FloatInput
                          label="Nombre del receptor (APE)"
                          name="firmaApe"
                          value={form.firmaApe}
                          onChange={onChange}
                        />
                        <div className="mt-5 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 px-6 py-12 text-center">
                          <FlaskConical className="mx-auto h-9 w-9 text-blue-300" />
                          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-blue-700">
                            Recepción CIRA
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Área de Proyección y Extensión</p>
                        </div>
                      </Panel>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      step < currentStep
                        ? "h-2.5 w-2.5 bg-yellow-400"
                        : step === currentStep
                          ? "h-3.5 w-3.5 bg-blue-900 ring-2 ring-blue-200"
                          : "h-2 w-2 bg-gray-300"
                    }`}
                  />
                  {index < TOTAL_STEPS - 1 && (
                    <div
                      className={`h-0.5 w-8 transition-all duration-300 ${
                        step < currentStep ? "bg-yellow-400" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-10">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStep === 1}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-2.5 text-sm font-semibold transition-all ${
                  currentStep === 1
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "border-blue-900 text-blue-900 hover:bg-blue-50"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                Anterior
              </button>

              <span className="text-center text-sm font-semibold text-gray-500">
                Paso {currentStep} de {TOTAL_STEPS} — {STEP_LABELS[currentStep - 1]}
              </span>

              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg"
                >
                  Siguiente
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-950 hover:shadow-lg disabled:opacity-50"
                >
                  {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
                  {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear orden"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <OrdenValidationModal
        open={validationOpen}
        issues={validationIssues}
        apiMessage={apiMessage}
        isEditing={isEditing}
        onClose={() => setValidationOpen(false)}
        onGoToStep={goToStepFromModal}
      />
    </div>
  );
}
