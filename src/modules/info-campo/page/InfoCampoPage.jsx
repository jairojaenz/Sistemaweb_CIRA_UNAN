import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  Beaker,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  Droplets,
  FileText,
  FlaskConical,
  Hash,
  HardHat,
  Landmark,
  Map as MapIcon,
  MapPin,
  Mountain,
  PenLine,
  Percent,
  Plus,
  StickyNote,
  Tag,
  TestTube,
  Thermometer,
  Trash2,
  UserCheck,
  UserRound,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import ElevationField, { fetchElevacion } from '../../../components/ElevationField.jsx';
import { formatLatLng, parseLatLng } from '../../../components/NicaraguaMapModal.jsx';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { useToast } from '../../../components/ToastContext.jsx';
import ValidationIssuesModal from '../../../components/ValidationIssuesModal.jsx';
import WizardStepIndicator from '../../../components/WizardStepIndicator.jsx';
import {
  CAMPO_STEP_LABELS,
  collectCampoIssues,
  issuesToFormErrors,
} from '../utils/campoValidation.js';
import { ROUTES } from '../../../router/routes.js';
import {
  asignarEstilosUnicos,
  estiloEquipo,
  estiloFuente,
  estiloMatriz,
  estiloTipoMuestreo,
} from '../../../utils/catalogIcons.js';
import { getCentroDepartamento } from '../../../utils/nicaraguaUbicaciones.js';
import { getProformas } from '../../proforma/service/proformaService.js';
import { getMuestras } from '../../catalogos/service/muestrasService.js';
import { getMatrices } from '../../catalogos/service/matrizService.js';
import { getFuentesMatriz } from '../../catalogos/service/fuentesMatrizService.js';
import { getTiposMuestreo } from '../../catalogos/service/tiposMuestreoService.js';
import { getEquiposMuestreo } from '../../catalogos/service/equiposMuestreoService.js';
import { getAnalisis } from '../../catalogos/service/analisisService.js';
import { getDepartamentos } from '../../catalogos/service/departamentosService.js';
import { getMunicipios } from '../../catalogos/service/municipiosService.js';
import {
  campoToForm,
  createInfoCampo,
  formToCampoPayload,
  getFormatoCampoById,
  INSTRUCTIVOS,
  PROCEDIMIENTOS,
  updateInfoCampo,
} from '../service/infoCampoService.js';
import {
  clearDraft,
  getEmptyForm,
  loadDraft,
  saveDraft,
} from '../service/infoCampoDraftStorage.js';

function coordsFromForm(form) {
  const n = String(form?.coordenadasN ?? "").trim();
  const e = String(form?.coordenadasE ?? "").trim();
  if (!n || !e) return "";
  const parsed = parseLatLng(`${n}, ${e}`);
  return parsed ? formatLatLng(parsed) : `${n}, ${e}`;
}

function etiquetaTipoMuestreo(option) {
  const n = String(option?.nombreTipoMuestreo || option?.nombre || "").trim();
  if (!n) return "";
  if (/completo/i.test(n) && !/compuesto/i.test(n)) {
    return n.replace(/completo/gi, "Compuesto");
  }
  return n;
}

function esTipoCompuesto(option) {
  const n = String(option?.nombreTipoMuestreo || option?.nombre || "");
  return /compuesto|completo/i.test(n);
}

const PARAMETROS_CAMPO = [
  { name: "temperatura", label: "Temperatura", unit: "°C", icon: Thermometer, tone: "bg-orange-50 text-orange-700" },
  { name: "ph", label: "pH", unit: "pH", icon: Droplets, tone: "bg-teal-50 text-teal-700" },
  { name: "conductividad", label: "Conductividad", unit: "µS/cm", icon: Zap, tone: "bg-amber-50 text-amber-700" },
  { name: "potencialRedox", label: "Potencial Redox", unit: "mV", icon: Activity, tone: "bg-violet-50 text-violet-700" },
  { name: "cloroResidual", label: "Cloro residual", unit: "mg/l", icon: TestTube, tone: "bg-sky-50 text-sky-700" },
  { name: "salinidad", label: "Salinidad", unit: "‰", icon: Waves, tone: "bg-cyan-50 text-cyan-700" },
  { name: "oxigenoDisuelto", label: "Oxígeno disuelto", unit: "mg/l", icon: Wind, tone: "bg-blue-50 text-blue-800" },
  { name: "satOxigeno", label: "Saturación O₂", unit: "%", icon: Percent, tone: "bg-emerald-50 text-emerald-700" },
];

function CatalogChoiceCard({ selected, onClick, icon: Icon, tone, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-blue-900 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-gray-50/80 hover:border-blue-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className={`text-sm font-semibold leading-snug ${selected ? "text-blue-900" : "text-gray-800"}`}>
          {label}
        </span>
      </div>
    </button>
  );
}

const ICON_INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-800 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";

function IconField({ id, icon: Icon, tone, label, required, error, hint, children }) {
  return (
    <div className={`rounded-xl border bg-gray-50/80 p-4 ${error ? "border-red-300" : "border-gray-200"}`}>
      <div className="mb-3 flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <label htmlFor={id} className="text-sm font-semibold text-gray-800">
            {label} {required ? <span className="text-red-500">*</span> : null}
          </label>
          {hint ? <p className="text-xs font-normal text-gray-500">{hint}</p> : null}
        </div>
      </div>
      {children}
      {error ? <p className="mt-2 text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

const HORAS_COMPUESTO_RAPIDAS = ["8", "12", "16", "24"];

const NicaraguaMapModal = lazy(() => import("../../../components/NicaraguaMapModal.jsx"));

export default function FormWizard() {
  const navigate = useNavigate();
  const { idCampo: idCampoParam } = useParams();
  const idCampo = idCampoParam ? Number(idCampoParam) : null;
  const isEdit = Number.isFinite(idCampo) && idCampo > 0;
  const storedDraft = loadDraft(idCampo);
  const [currentStep, setCurrentStep] = useState(() => storedDraft?.step ?? 1);
  const [formData, setFormData] = useState(() => ({
    ...getEmptyForm(),
    ...(storedDraft?.form ?? {}),
  }));

  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [proformas, setProformas] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [matricesApi, setMatricesApi] = useState([]);
  const [fuentesApi, setFuentesApi] = useState([]);
  const [tiposApi, setTiposApi] = useState([]);
  const [equiposApi, setEquiposApi] = useState([]);
  const [analisisApi, setAnalisisApi] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [errors, setErrors] = useState({});
  const [mapOpen, setMapOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validationApiMessage, setValidationApiMessage] = useState("");
  const [validationTitle, setValidationTitle] = useState("");
  const [validationDescription, setValidationDescription] = useState("");
  const [coordsInput, setCoordsInput] = useState(
    () => storedDraft?.coordsInput || coordsFromForm(storedDraft?.form) || "",
  );
  const [catalogosLoading, setCatalogosLoading] = useState(true);
  const [draftReady, setDraftReady] = useState(() => !isEdit || Boolean(storedDraft));

  useEffect(() => {
    let mounted = true;
    async function loadCatalogos() {
      try {
        setCatalogosLoading(true);
        const [p, m, mats, ftes, tipos, eqs, ans, deps, muns] = await Promise.all([
          getProformas(),
          getMuestras(),
          getMatrices(),
          getFuentesMatriz(),
          getTiposMuestreo(),
          getEquiposMuestreo(),
          getAnalisis(),
          getDepartamentos(),
          getMunicipios(),
        ]);
        if (!mounted) return;
        setProformas(p ?? []);
        setMuestras((m ?? []).filter((x) => x.activo !== false));
        setMatricesApi((mats ?? []).filter((x) => x.activo !== false && Number(x.idMatriz) > 0));
        setFuentesApi((ftes ?? []).filter((x) => x.activo !== false && Number(x.idFuente) > 0));
        setTiposApi((tipos ?? []).filter((x) => x.activo !== false));
        setEquiposApi((eqs ?? []).filter((x) => x.activo !== false));
        setAnalisisApi((ans ?? []).filter((x) => x.activo !== false));
        setDepartamentos((deps ?? []).filter((x) => x.activo !== false));
        setMunicipios((muns ?? []).filter((x) => x.activo !== false));
      } catch {
        if (mounted) addToast("No se pudieron cargar los catálogos de campo", "error");
      } finally {
        if (mounted) setCatalogosLoading(false);
      }
    }
    loadCatalogos();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  useEffect(() => {
    if (!isEdit) return;
    if (loadDraft(idCampo)) {
      setDraftReady(true);
      return;
    }
    let mounted = true;
    async function loadCampo() {
      try {
        const c = await getFormatoCampoById(idCampo);
        if (!mounted) return;
        const loaded = campoToForm(c);
        setFormData((prev) => ({ ...prev, ...loaded }));
        setCoordsInput(coordsFromForm(loaded));
        setDraftReady(true);
      } catch (err) {
        if (mounted) addToast(err?.message || "No se pudo cargar el formato de campo", "error");
      }
    }
    loadCampo();
    return () => {
      mounted = false;
    };
  }, [isEdit, idCampo, addToast]);

  useEffect(() => {
    if (!draftReady) return;
    saveDraft(idCampo, { form: formData, step: currentStep, coordsInput });
  }, [draftReady, formData, currentStep, coordsInput, idCampo]);

  useEffect(() => {
    if (isEdit || !user) return;
    const nombre = [user.nombre, user.apellido].filter(Boolean).join(" ").trim();
    if (!nombre) return;
    setFormData((prev) => (prev.usuario ? prev : { ...prev, usuario: nombre }));
  }, [user, isEdit]);

  const municipiosFiltrados = municipios.filter(
    (m) => String(m.idDepartamento) === String(formData.idDepartamento),
  );

  const mapStart = useMemo(() => {
    const existentes = parseLatLng(
      coordsFromForm({
        coordenadasN: formData.coordenadasN,
        coordenadasE: formData.coordenadasE,
      }),
    );
    if (existentes) return { coords: formatLatLng(existentes), zoom: 13 };
    const depto = departamentos.find(
      (d) => String(d.idDepartamento) === String(formData.idDepartamento),
    );
    const centro = getCentroDepartamento(depto?.nombreDepartamento);
    if (centro) return { coords: formatLatLng(centro), zoom: 10 };
    return { coords: "", zoom: 7 };
  }, [formData.coordenadasN, formData.coordenadasE, formData.idDepartamento, departamentos]);
  const fuentesFiltradas = useMemo(
    () =>
      fuentesApi.filter(
        (f) =>
          Boolean(formData.idMatriz) &&
          String(f.idMatriz ?? f.IdMatriz) === String(formData.idMatriz),
      ),
    [fuentesApi, formData.idMatriz],
  );
  const tipoSeleccionado = tiposApi.find((t) => String(t.idTipoMuestreo) === String(formData.idTipoMuestreo));
  const esCompuesto = esTipoCompuesto(tipoSeleccionado);

  function extrasValidacion() {
    return { fuentesApi, tiposApi };
  }

  function mostrarValidacion({ issues = [], apiMessage = "", title, description }) {
    setErrors(issuesToFormErrors(issues));
    setValidationIssues(issues);
    setValidationApiMessage(apiMessage);
    setValidationTitle(title);
    setValidationDescription(description);
    setValidationOpen(true);
  }

  function irAlPasoDesdeModal(step) {
    setValidationOpen(false);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleNext = () => {
    const issues = collectCampoIssues(formData, { steps: [currentStep], ...extrasValidacion() });
    if (issues.length > 0) {
      mostrarValidacion({
        issues,
        title: "No puede continuar al siguiente paso",
        description: `Revise los campos pendientes del paso ${currentStep} — ${CAMPO_STEP_LABELS[currentStep - 1]}.`,
      });
      return;
    }
    setErrors({});
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isTextOnlyField = (fieldName) => {
    const textOnlyFields = ['usuario', 'identificacion', 'lugar', 'comunidad', 'departamento', 'municipio', 'matrizOtra', 'fuenteOtra', 'tipoMuestreoOtro', 'instructivoClienteOtro', 'procedimientoCIRAOtro', 'muestraCapturadaPor', 'verificacionNombre', 'inicialesAnalista'];
    return textOnlyFields.includes(fieldName);
  };

  const isNumberOnlyField = (fieldName) => {
    const numberOnlyFields = ['temperatura', 'ph', 'conductividad', 'potencialRedox', 'cloroResidual', 'salinidad', 'oxigenoDisuelto', 'satOxigeno'];
    return numberOnlyFields.includes(fieldName);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (isTextOnlyField(name)) {
      const textOnlyRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]*$/;
      if (!textOnlyRegex.test(value)) {
        return;
      }
    }

    if (isNumberOnlyField(name)) {
      const numberOnlyRegex = /^[0-9.]*$/;
      if (!numberOnlyRegex.test(value)) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddEnsayo = () => {
    const idAnalisis = Number(formData.ensayoIdTemp);
    const fromCatalog = analisisApi.find((a) => Number(a.idAnalisis) === idAnalisis);
    if (!fromCatalog) return;
    if ((formData.ensayos ?? []).some((e) => Number(e.idAnalisis) === idAnalisis)) {
      addToast("Ese análisis ya está en la lista.", "error");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ensayos: [...prev.ensayos, {
        idAnalisis: fromCatalog.idAnalisis,
        tipoAnalisis: fromCatalog.nombreAnalisis,
        tecnica: fromCatalog.abreviacionAnalisis || prev.ensayoTecnicaTemp,
      }],
      ensayoTipoTemp: '',
      ensayoTecnicaTemp: '',
      ensayoIdTemp: '',
    }));
  };

  const handleRemoveEnsayo = (index) => {
    setFormData((prev) => ({
      ...prev,
      ensayos: prev.ensayos.filter((_, i) => i !== index),
    }));
  };

  const handleEnsayoChange = (index, field, value) => {
    setFormData((prev) => {
      const newEnsayos = [...prev.ensayos];
      newEnsayos[index] = { ...newEnsayos[index], [field]: value };
      return { ...prev, ensayos: newEnsayos };
    });
  };

  const handleSubmit = async () => {
    const issues = collectCampoIssues(formData, { steps: [1, 2, 3], ...extrasValidacion() });
    const idUsuario = Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);
    if (!idUsuario) {
      issues.push({
        step: 3,
        stepLabel: `Paso 3 — ${CAMPO_STEP_LABELS[2]}`,
        field: "idUsuario",
        label: "Usuario de sesión",
        tipo: "formato",
        detalle: "No se pudo identificar el usuario de la sesión actual.",
        formato: "Cierre sesión e inicie de nuevo antes de guardar el formato.",
      });
    }

    if (issues.length > 0) {
      mostrarValidacion({
        issues,
        title: isEdit
          ? "No se pudo actualizar la información de campo"
          : "No se pudo crear la información de campo",
        description:
          "Faltan datos requeridos o hay un valor inválido. Corrija los campos indicados e intente de nuevo.",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = formToCampoPayload(formData, { idUsuario });
      if (isEdit) {
        await updateInfoCampo(idCampo, payload);
        addToast("Información de campo actualizada correctamente.", "success");
      } else {
        await createInfoCampo(payload);
        addToast("Información de campo guardada correctamente.", "success");
      }
      clearDraft(idCampo);
      navigate(ROUTES.infoCampo);
    } catch (err) {
      mostrarValidacion({
        issues: [],
        apiMessage: err?.message || "No se pudo guardar la información de campo.",
        title: isEdit
          ? "No se pudo actualizar la información de campo"
          : "No se pudo crear la información de campo",
        description: "El servidor rechazó el registro. Revise el motivo e intente de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gray-100">
      <div className="bg-yellow-400 text-center py-2 font-semibold text-blue-900">
        ÁREA TÉCNICA, ASEGURAMIENTO Y CONTROL DE LA CALIDAD
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <WizardStepIndicator
          currentStep={currentStep}
          labels={CAMPO_STEP_LABELS}
        />

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {currentStep === 1 && (
            <div className="space-y-8 p-6 sm:p-8 md:p-10">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Información de la Muestra</h2>
                <p className="text-gray-600">Complete los datos de identificación y ubicación de la muestra</p>
              </div>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Vínculos con la solicitud
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Proforma y muestra asociadas a este formato</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="id-proforma"
                    icon={FileText}
                    tone="bg-indigo-50 text-indigo-700"
                    label="Proforma"
                    hint="Número de proforma asociada"
                    required
                    error={errors.idProforma}
                  >
                    <select
                      id="id-proforma"
                      className={ICON_INPUT}
                      value={formData.idProforma}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, idProforma: e.target.value }));
                        if (errors.idProforma) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.idProforma;
                            return next;
                          });
                        }
                      }}
                    >
                      <option value="">Seleccione</option>
                      {proformas.map((p) => (
                        <option key={p.idProforma} value={p.idProforma}>
                          {p.numeroProforma ?? `Proforma #${p.idProforma}`}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  <IconField
                    id="id-muestra"
                    icon={Beaker}
                    tone="bg-sky-50 text-sky-700"
                    label="Muestra"
                    hint="Identificación registrada en el catálogo"
                    required
                    error={errors.idMuestra}
                  >
                    <select
                      id="id-muestra"
                      className={ICON_INPUT}
                      value={formData.idMuestra}
                      onChange={(e) => {
                        const id = e.target.value;
                        const muestra = muestras.find((m) => String(m.idMuestra) === String(id));
                        const idMatriz = muestra?.idMatriz ? String(muestra.idMatriz) : "";
                        const fuenteDeLaMuestra = fuentesApi.find(
                          (f) =>
                            String(f.idFuente) === String(muestra?.idFuente) &&
                            String(f.idMatriz ?? f.IdMatriz) === idMatriz,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          idMuestra: id,
                          identificacion: muestra?.identificacion || "",
                          idMatriz,
                          idFuente: fuenteDeLaMuestra ? String(fuenteDeLaMuestra.idFuente) : "",
                        }));
                        if (errors.idMuestra) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.idMuestra;
                            return next;
                          });
                        }
                      }}
                    >
                      <option value="">Seleccione</option>
                      {muestras.map((m) => (
                        <option key={m.idMuestra} value={m.idMuestra}>
                          {m.identificacion || `Muestra #${m.idMuestra}`}
                        </option>
                      ))}
                    </select>
                  </IconField>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Datos principales
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Se completan según la sesión y la muestra elegida</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="usuario-campo"
                    icon={UserRound}
                    tone="bg-slate-100 text-slate-700"
                    label="Usuario"
                    hint="Usuario de la sesión actual"
                  >
                    <input
                      id="usuario-campo"
                      type="text"
                      readOnly
                      value={formData.usuario}
                      className={`${ICON_INPUT} bg-gray-50 text-gray-700`}
                    />
                  </IconField>
                  <IconField
                    id="identificacion-muestra"
                    icon={Hash}
                    tone="bg-blue-50 text-blue-800"
                    label="Identificación de la muestra"
                    hint="Se toma de la muestra seleccionada"
                  >
                    <input
                      id="identificacion-muestra"
                      type="text"
                      readOnly
                      value={formData.identificacion}
                      placeholder="Se toma de la muestra seleccionada"
                      className={`${ICON_INPUT} bg-gray-50 text-gray-700`}
                    />
                  </IconField>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-yellow-400" />
                  Ubicación geográfica
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Localización del sitio de muestreo</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="lugar-muestreo"
                    icon={MapPin}
                    tone="bg-rose-50 text-rose-700"
                    label="Lugar"
                    hint="Nombre del sitio de muestreo"
                    required
                    error={errors.lugar}
                  >
                    <input
                      id="lugar-muestreo"
                      type="text"
                      name="lugar"
                      value={formData.lugar}
                      onChange={handleChange}
                      placeholder="Nombre del lugar"
                      className={ICON_INPUT}
                    />
                  </IconField>
                  <IconField
                    id="comunidad-muestreo"
                    icon={Landmark}
                    tone="bg-amber-50 text-amber-800"
                    label="Comunidad"
                    hint="Comunidad o localidad cercana"
                  >
                    <input
                      id="comunidad-muestreo"
                      type="text"
                      name="comunidad"
                      value={formData.comunidad}
                      onChange={handleChange}
                      placeholder="Nombre de la comunidad"
                      className={ICON_INPUT}
                    />
                  </IconField>
                  <IconField
                    id="id-departamento"
                    icon={MapIcon}
                    tone="bg-yellow-50 text-yellow-800"
                    label="Departamento"
                    hint="Departamento de Nicaragua"
                    required
                    error={errors.idDepartamento}
                  >
                    <select
                      id="id-departamento"
                      className={ICON_INPUT}
                      value={formData.idDepartamento}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          idDepartamento: e.target.value,
                          idMunicipio: "",
                        }));
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.idDepartamento;
                          delete next.idMunicipio;
                          return next;
                        });
                      }}
                    >
                      <option value="">Seleccione</option>
                      {departamentos.map((d) => (
                        <option key={d.idDepartamento} value={d.idDepartamento}>
                          {d.nombreDepartamento}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  <IconField
                    id="id-municipio"
                    icon={Building2}
                    tone="bg-stone-100 text-stone-700"
                    label="Municipio"
                    hint="Primero elija un departamento"
                    required
                    error={errors.idMunicipio}
                  >
                    <select
                      id="id-municipio"
                      disabled={!formData.idDepartamento}
                      className={ICON_INPUT}
                      value={formData.idMunicipio}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, idMunicipio: e.target.value }));
                        if (errors.idMunicipio) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.idMunicipio;
                            return next;
                          });
                        }
                      }}
                    >
                      <option value="">
                        {formData.idDepartamento ? "Seleccione" : "Seleccione un departamento primero"}
                      </option>
                      {municipiosFiltrados.map((m) => (
                        <option key={m.idMunicipio} value={m.idMunicipio}>
                          {m.nombreMunicipio}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  <div className="md:col-span-2">
                    <IconField
                      id="coordenadas-muestreo"
                      icon={Compass}
                      tone="bg-cyan-50 text-cyan-700"
                      label="Coordenadas"
                      hint="Latitud y longitud. Puede escribirlas o marcarlas en el mapa"
                    >
                      <div className="flex gap-2">
                        <input
                          id="coordenadas-muestreo"
                          className={`${ICON_INPUT} flex-1`}
                          inputMode="decimal"
                          placeholder="latitud, longitud  (ej. 12.136400, -86.251400)"
                          value={coordsInput}
                          onChange={(e) => {
                            const text = e.target.value;
                            if (!/^[-0-9.,;\s]*$/.test(text)) return;
                            setCoordsInput(text);
                            const parsed = parseLatLng(text);
                            if (parsed) {
                              setFormData((prev) => ({
                                ...prev,
                                coordenadasN: parsed.lat.toFixed(6),
                                coordenadasE: parsed.lng.toFixed(6),
                              }));
                            } else if (!text.trim()) {
                              setFormData((prev) => ({
                                ...prev,
                                coordenadasN: "",
                                coordenadasE: "",
                              }));
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseLatLng(coordsInput);
                            if (parsed) setCoordsInput(formatLatLng(parsed));
                          }}
                        />
                        <button
                          type="button"
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                          onClick={() => setMapOpen(true)}
                        >
                          <MapPin className="h-4 w-4" />
                          Mapa
                        </button>
                      </div>
                    </IconField>
                  </div>
                  <div className="md:col-span-2">
                    <IconField
                      id="info-campo-elevacion"
                      icon={Mountain}
                      tone="bg-emerald-50 text-emerald-700"
                      label="Elevación"
                      hint="Metros sobre el nivel del mar"
                    >
                      <ElevationField
                        id="info-campo-elevacion"
                        label=""
                        value={formData.elevacion}
                        onChange={(elevacion) => setFormData((prev) => ({ ...prev, elevacion }))}
                        latitud={formData.coordenadasN}
                        longitud={formData.coordenadasE}
                      />
                    </IconField>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Muestreo
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Fecha y hora de la toma de muestra</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="fecha-toma-muestra"
                    icon={CalendarDays}
                    tone="bg-amber-50 text-amber-700"
                    label="Fecha de toma de muestra"
                    hint="Día en que se recolectó la muestra"
                    required
                    error={errors.fecha}
                  >
                    <input
                      id="fecha-toma-muestra"
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      className={ICON_INPUT}
                    />
                  </IconField>
                  <IconField
                    id="hora-toma-muestra"
                    icon={Clock}
                    tone="bg-sky-50 text-sky-700"
                    label="Hora de toma de muestra"
                    hint="Hora en que se recolectó la muestra"
                    required
                    error={errors.hora}
                  >
                    <input
                      id="hora-toma-muestra"
                      type="time"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                      className={ICON_INPUT}
                    />
                  </IconField>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                      <span className="h-7 w-1 rounded-full bg-yellow-400" />
                      Ensayos solicitados
                    </h3>
                    <p className="ml-4 text-sm text-gray-500">Agregue al menos un análisis del catálogo</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEnsayo}
                    disabled={!formData.ensayoIdTemp}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <IconField
                    id="ensayo-tipo"
                    icon={FlaskConical}
                    tone="bg-violet-50 text-violet-700"
                    label="Tipo de análisis"
                    hint="Seleccione un análisis del catálogo"
                  >
                    <select
                      id="ensayo-tipo"
                      className={ICON_INPUT}
                      value={formData.ensayoIdTemp}
                      onChange={(e) => {
                        const id = e.target.value;
                        const item = analisisApi.find((a) => String(a.idAnalisis) === String(id));
                        setFormData((prev) => ({
                          ...prev,
                          ensayoIdTemp: id,
                          ensayoTipoTemp: item?.nombreAnalisis ?? prev.ensayoTipoTemp,
                          ensayoTecnicaTemp: item?.abreviacionAnalisis ?? prev.ensayoTecnicaTemp,
                        }));
                      }}
                    >
                      <option value="">Seleccione un análisis</option>
                      {analisisApi.map((a) => (
                        <option key={a.idAnalisis} value={a.idAnalisis}>
                          {a.nombreAnalisis}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  <IconField
                    id="ensayo-tecnica"
                    icon={Activity}
                    tone="bg-teal-50 text-teal-700"
                    label="Técnica"
                    hint="Se completa al elegir el análisis; puede editarla"
                  >
                    <input
                      id="ensayo-tecnica"
                      type="text"
                      name="ensayoTecnicaTemp"
                      className={ICON_INPUT}
                      value={formData.ensayoTecnicaTemp}
                      onChange={handleChange}
                      placeholder="Ej: Potenciometría"
                    />
                  </IconField>
                </div>

                {formData.ensayos.length > 0 ? (
                  <div className="space-y-3">
                    {formData.ensayos.map((ensayo, index) => (
                      <div
                        key={`${ensayo.idAnalisis}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                          <FlaskConical className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800">{ensayo.tipoAnalisis}</p>
                          <input
                            type="text"
                            className={`${ICON_INPUT} mt-2`}
                            value={ensayo.tecnica}
                            onChange={(e) => handleEnsayoChange(index, "tecnica", e.target.value)}
                            placeholder="Técnica"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnsayo(index)}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          aria-label="Quitar ensayo"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-5 text-center">
                    <p className="text-sm text-gray-600">
                      No hay ensayos agregados. Seleccione un análisis y haga clic en Agregar.
                    </p>
                  </div>
                )}
                {errors.ensayos ? <p className="mt-3 text-xs font-medium text-red-500">{errors.ensayos}</p> : null}
              </section>
            </div>
          )}

          {/* Step 2: Características de Muestreo */}
          {currentStep === 2 && (
            <div className="p-8 md:p-10 space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">Características de Muestreo</h2>
                <p className="text-gray-600">Complete los detalles técnicos del muestreo realizado</p>
              </div>

              {/* MATRIZ */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Matriz <span className="text-red-500">*</span>
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Seleccione una del catálogo</p>

                {catalogosLoading ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-gray-600">Cargando matrices del catálogo…</p>
                  </div>
                ) : matricesApi.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-gray-600">No hay matrices activas en el catálogo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {asignarEstilosUnicos(matricesApi, (option) => option.nombreMatriz, estiloMatriz).map(
                      ({ item: option, estilo }) => (
                        <CatalogChoiceCard
                          key={option.idMatriz}
                          selected={String(formData.idMatriz) === String(option.idMatriz)}
                          icon={estilo.icon}
                          tone={estilo.tone}
                          label={option.nombreMatriz}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              idMatriz: String(option.idMatriz),
                              idFuente: "",
                            }));
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.idMatriz;
                              delete next.idFuente;
                              return next;
                            });
                          }}
                        />
                      ),
                    )}
                  </div>
                )}
                {errors.idMatriz && <p className="mt-2 text-xs font-medium text-red-500">{errors.idMatriz}</p>}
              </div>

              {/* FUENTE */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-yellow-400" />
                  Fuente <span className="text-red-500">*</span>
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Según la matriz seleccionada</p>

                {!formData.idMatriz ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-gray-600">Primero debe seleccionar una matriz</p>
                  </div>
                ) : catalogosLoading ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-gray-600">Cargando fuentes del catálogo…</p>
                  </div>
                ) : fuentesFiltradas.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-gray-600">
                      Esta matriz no tiene fuentes activas en el catálogo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {asignarEstilosUnicos(
                      fuentesFiltradas,
                      (fuente) => fuente.nombreFuente || fuente.nombre,
                      estiloFuente,
                    ).map(({ item: fuente, estilo }) => {
                      const nombre = fuente.nombreFuente || fuente.nombre;
                      return (
                        <CatalogChoiceCard
                          key={fuente.idFuente}
                          selected={String(formData.idFuente) === String(fuente.idFuente)}
                          icon={estilo.icon}
                          tone={estilo.tone}
                          label={nombre}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, idFuente: String(fuente.idFuente) }));
                            if (errors.idFuente) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.idFuente;
                                return next;
                              });
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                {errors.idFuente && <p className="mt-2 text-xs font-medium text-red-500">{errors.idFuente}</p>}
              </div>

              {/* PARÁMETROS DE CAMPO */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Parámetros de campo
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Valores medidos en sitio. Todos son opcionales.</p>

                <div className="ml-0 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {PARAMETROS_CAMPO.map((param) => {
                    const Icon = param.icon;
                    return (
                      <div
                        key={param.name}
                        className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition focus-within:border-blue-800 focus-within:ring-2 focus-within:ring-blue-800/15"
                      >
                        <div className="mb-3 flex items-center gap-2.5">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${param.tone}`}>
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <label htmlFor={`param-${param.name}`} className="text-sm font-semibold text-gray-800">
                            {param.label}
                          </label>
                        </div>
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3">
                          <input
                            id={`param-${param.name}`}
                            type="text"
                            inputMode="decimal"
                            name={param.name}
                            value={formData[param.name]}
                            onChange={handleChange}
                            placeholder="—"
                            className="w-full bg-transparent py-2.5 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-300"
                          />
                          <span className="shrink-0 pl-2 text-xs font-medium text-gray-500">{param.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIPO DE MUESTREO */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-yellow-400" />
                  Tipo de muestreo <span className="text-red-500">*</span>
                </h3>
                <p className="mb-4 ml-4 text-sm text-gray-500">Seleccione uno del catálogo</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {asignarEstilosUnicos(
                    tiposApi,
                    (option) => etiquetaTipoMuestreo(option),
                    estiloTipoMuestreo,
                  ).map(({ item: option, estilo }) => {
                    const activo = String(formData.idTipoMuestreo) === String(option.idTipoMuestreo);
                    const compuesto = esTipoCompuesto(option);
                    return (
                      <CatalogChoiceCard
                        key={option.idTipoMuestreo}
                        selected={activo}
                        icon={estilo.icon}
                        tone={estilo.tone}
                        label={etiquetaTipoMuestreo(option)}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            idTipoMuestreo: String(option.idTipoMuestreo),
                            compuestoHoras: compuesto ? prev.compuestoHoras : "",
                            compuestoHorasOpcion: compuesto ? prev.compuestoHorasOpcion : "",
                            compuestoHorasOtro: compuesto ? prev.compuestoHorasOtro : "",
                          }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.idTipoMuestreo;
                            if (!compuesto) delete next.compuestoHoras;
                            return next;
                          });
                        }}
                      />
                    );
                  })}
                </div>

                {esCompuesto && (
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
                        <Clock className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Duración del muestreo compuesto</p>
                        <p className="text-xs text-gray-600">Indique las horas o use Otros si el tiempo es distinto.</p>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {HORAS_COMPUESTO_RAPIDAS.map((h) => {
                        const activo =
                          formData.compuestoHorasOpcion !== "otros" &&
                          String(formData.compuestoHoras) === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                compuestoHoras: h,
                                compuestoHorasOpcion: "horas",
                                compuestoHorasOtro: "",
                              }));
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.compuestoHoras;
                                return next;
                              });
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                              activo
                                ? "border-blue-900 bg-blue-900 text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-400"
                            }`}
                          >
                            {h} h
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            compuestoHorasOpcion: "otros",
                            compuestoHoras: "",
                          }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.compuestoHoras;
                            return next;
                          });
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                          formData.compuestoHorasOpcion === "otros"
                            ? "border-blue-900 bg-blue-900 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        Otros
                      </button>
                    </div>

                    {formData.compuestoHorasOpcion === "otros" ? (
                      <label className="block text-sm font-semibold text-gray-700">
                        Especifique
                        <input
                          type="text"
                          className="input mt-1.5 bg-white"
                          value={formData.compuestoHorasOtro}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              compuestoHorasOpcion: "otros",
                              compuestoHorasOtro: e.target.value,
                            }));
                            if (errors.compuestoHoras) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.compuestoHoras;
                                return next;
                              });
                            }
                          }}
                          placeholder="Ej. 36 horas, 3 días, cada 2 h durante 48 h"
                        />
                      </label>
                    ) : (
                      <label className="block text-sm font-semibold text-gray-700">
                        Cantidad de horas
                        <div className="mt-1.5 flex items-center rounded-lg border border-gray-200 bg-white px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-full bg-transparent py-2.5 text-sm font-semibold outline-none"
                            value={formData.compuestoHoras}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!/^[0-9.]*$/.test(value)) return;
                              setFormData((prev) => ({
                                ...prev,
                                compuestoHoras: value,
                                compuestoHorasOpcion: "horas",
                                compuestoHorasOtro: "",
                              }));
                              if (errors.compuestoHoras) {
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.compuestoHoras;
                                  return next;
                                });
                              }
                            }}
                            placeholder="Ej. 8"
                          />
                          <span className="shrink-0 pl-2 text-xs font-medium text-gray-500">horas</span>
                        </div>
                      </label>
                    )}
                    {errors.compuestoHoras ? (
                      <p className="mt-2 text-xs font-medium text-red-500">{errors.compuestoHoras}</p>
                    ) : null}
                  </div>
                )}
                {errors.idTipoMuestreo && <p className="mt-2 text-xs font-medium text-red-500">{errors.idTipoMuestreo}</p>}
              </div>

              {/* EQUIPOS UTILIZADOS */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Equipos utilizados <span className="text-red-500">*</span>
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Seleccione los instrumentos del catálogo</p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {asignarEstilosUnicos(
                    equiposApi,
                    (eq) => eq.nombreEquipo || eq.nombre,
                    estiloEquipo,
                  ).map(({ item: eq, estilo }) => {
                    const checked = (formData.idsEquipos ?? []).map(Number).includes(Number(eq.idEquipo));
                    return (
                      <CatalogChoiceCard
                        key={eq.idEquipo}
                        selected={checked}
                        icon={estilo.icon}
                        tone={estilo.tone}
                        label={eq.nombreEquipo || eq.nombre}
                        onClick={() => {
                          setFormData((prev) => {
                            const actual = (prev.idsEquipos ?? []).map(Number);
                            const id = Number(eq.idEquipo);
                            const idsEquipos = actual.includes(id)
                              ? actual.filter((x) => x !== id)
                              : [...actual, id];
                            return { ...prev, idsEquipos };
                          });
                          if (errors.idsEquipos) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.idsEquipos;
                              return next;
                            });
                          }
                        }}
                      />
                    );
                  })}
                </div>
                {errors.idsEquipos && <p className="mt-3 text-xs font-medium text-red-500">{errors.idsEquipos}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Procedimientos y Verificación */}
          {currentStep === 3 && (
            <div className="p-8 md:p-10 space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">Procedimientos y Verificación</h2>
                <p className="text-gray-600">Información final y verificación del proceso de muestreo</p>
              </div>

              {/* ¿QUIÉN TOMA LA MUESTRA? */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  ¿Quién tomó la muestra? <span className="text-red-500">*</span>
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Seleccione una opción</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CatalogChoiceCard
                    selected={formData.quienTomaMuestra === "cliente"}
                    icon={UserRound}
                    tone="bg-sky-50 text-sky-700"
                    label="Cliente"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        quienTomaMuestra: "cliente",
                        instructivoCliente: "",
                        instructivoClienteOtro: "",
                        procedimientoCIRA: "",
                        procedimientoCIRAOtro: "",
                      }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.quienTomaMuestra;
                        delete next.instructivoCliente;
                        delete next.procedimientoCIRA;
                        return next;
                      });
                    }}
                  />
                  <CatalogChoiceCard
                    selected={formData.quienTomaMuestra === "tecnico"}
                    icon={HardHat}
                    tone="bg-amber-50 text-amber-700"
                    label="Técnico del CIRA"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        quienTomaMuestra: "tecnico",
                        instructivoCliente: "",
                        instructivoClienteOtro: "",
                        procedimientoCIRA: "",
                        procedimientoCIRAOtro: "",
                      }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.quienTomaMuestra;
                        delete next.instructivoCliente;
                        delete next.procedimientoCIRA;
                        return next;
                      });
                    }}
                  />
                </div>
                {errors.quienTomaMuestra && (
                  <p className="mt-2 text-xs font-medium text-red-500">{errors.quienTomaMuestra}</p>
                )}
              </div>

              {formData.quienTomaMuestra === "cliente" && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                    <span className="h-7 w-1 rounded-full bg-yellow-400" />
                    Instructivo operativo <span className="text-red-500">*</span>
                  </h3>
                  <p className="mb-5 ml-4 text-sm text-gray-500">Documento que siguió el cliente</p>
                  <div className="flex flex-wrap gap-2">
                    {INSTRUCTIVOS.map((codigo) => (
                      <button
                        key={codigo}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            instructivoCliente: codigo,
                            instructivoClienteOtro: "",
                          }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.instructivoCliente;
                            return next;
                          });
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          formData.instructivoCliente === codigo
                            ? "border-blue-900 bg-blue-900 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {codigo}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, instructivoCliente: "otro" }));
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.instructivoCliente;
                          return next;
                        });
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        formData.instructivoCliente === "otro"
                          ? "border-blue-900 bg-blue-900 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400"
                      }`}
                    >
                      Otro
                    </button>
                  </div>
                  {formData.instructivoCliente === "otro" && (
                    <input
                      type="text"
                      name="instructivoClienteOtro"
                      value={formData.instructivoClienteOtro}
                      onChange={handleChange}
                      placeholder="Especifique el instructivo utilizado"
                      className="input mt-4"
                    />
                  )}
                  {errors.instructivoCliente && (
                    <p className="mt-2 text-xs font-medium text-red-500">{errors.instructivoCliente}</p>
                  )}
                </div>
              )}

              {formData.quienTomaMuestra === "tecnico" && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                    <span className="h-7 w-1 rounded-full bg-yellow-400" />
                    Procedimiento CIRA <span className="text-red-500">*</span>
                  </h3>
                  <p className="mb-5 ml-4 text-sm text-gray-500">Procedimiento aplicado por el técnico</p>
                  <div className="flex flex-wrap gap-2">
                    {PROCEDIMIENTOS.map((codigo) => (
                      <button
                        key={codigo}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            procedimientoCIRA: codigo,
                            procedimientoCIRAOtro: "",
                          }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.procedimientoCIRA;
                            return next;
                          });
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          formData.procedimientoCIRA === codigo
                            ? "border-blue-900 bg-blue-900 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {codigo}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, procedimientoCIRA: "otro" }));
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.procedimientoCIRA;
                          return next;
                        });
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        formData.procedimientoCIRA === "otro"
                          ? "border-blue-900 bg-blue-900 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400"
                      }`}
                    >
                      Otro
                    </button>
                  </div>
                  {formData.procedimientoCIRA === "otro" && (
                    <input
                      type="text"
                      name="procedimientoCIRAOtro"
                      value={formData.procedimientoCIRAOtro}
                      onChange={handleChange}
                      placeholder="Especifique el procedimiento utilizado"
                      className="input mt-4"
                    />
                  )}
                  {errors.procedimientoCIRA && (
                    <p className="mt-2 text-xs font-medium text-red-500">{errors.procedimientoCIRA}</p>
                  )}
                </div>
              )}

              {/* OBSERVACIONES */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-yellow-400" />
                  Observaciones
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Opcional. Notas relevantes de la toma de muestra.</p>
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <StickyNote className="h-4 w-4" aria-hidden />
                  </span>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Agregue cualquier observación relevante..."
                    className="min-h-[96px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-800"
                    rows={3}
                  />
                </div>
              </div>

              {/* RESUMEN DINÁMICO */}
              <div className="bg-blue-50 border-l-4 border-primary p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-4">Resumen de la Información de Muestra</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-2">Información Básica</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Usuario</p>
                        <p className="font-medium text-foreground">{formData.usuario || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ID Muestra</p>
                        <p className="font-medium text-foreground">{formData.identificacion || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lugar</p>
                        <p className="font-medium text-foreground">{formData.lugar || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Municipio/Departamento</p>
                        <p className="font-medium text-foreground">
                          {(() => {
                            const mun = municipios.find((m) => String(m.idMunicipio) === String(formData.idMunicipio));
                            const dep = departamentos.find((d) => String(d.idDepartamento) === String(formData.idDepartamento));
                            return mun && dep
                              ? `${mun.nombreMunicipio}, ${dep.nombreDepartamento}`
                              : "No especificado";
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comunidad</p>
                        <p className="font-medium text-foreground">{formData.comunidad || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Coordenadas</p>
                        <p className="font-medium text-foreground">{coordsFromForm(formData) || "No especificado"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Elevación</p>
                        <p className="font-medium text-foreground">
                          {formData.elevacion ? `${formData.elevacion} msnm` : "No especificado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-foreground text-sm mb-2">Características</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Matriz</p>
                        <p className="font-medium text-foreground">
                          {matricesApi.find((m) => String(m.idMatriz) === String(formData.idMatriz))?.nombreMatriz || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fuente</p>
                        <p className="font-medium text-foreground">
                          {fuentesApi.find((f) => String(f.idFuente) === String(formData.idFuente))?.nombreFuente
                            || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo Muestreo</p>
                        <p className="font-medium text-foreground">
                          {esCompuesto && (formData.compuestoHorasOpcion === "otros"
                            ? formData.compuestoHorasOtro
                            : formData.compuestoHoras)
                            ? `${etiquetaTipoMuestreo(tipoSeleccionado)} (${
                                formData.compuestoHorasOpcion === "otros"
                                  ? formData.compuestoHorasOtro
                                  : `${formData.compuestoHoras} h`
                              })`
                            : etiquetaTipoMuestreo(tipoSeleccionado) || "No especificado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERIFICACIÓN FINAL */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Verificación final
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">Datos de captura, revisión y código de laboratorio</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="muestra-captada-por"
                    icon={UserCheck}
                    tone="bg-sky-50 text-sky-700"
                    label="Muestra captada por"
                    hint="Nombre de quien recolectó la muestra"
                    required
                    error={errors.muestraCapturadaPor}
                  >
                    <input
                      id="muestra-captada-por"
                      type="text"
                      name="muestraCapturadaPor"
                      value={formData.muestraCapturadaPor}
                      onChange={handleChange}
                      placeholder="Nombre completo"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-800"
                    />
                  </IconField>

                  <IconField
                    id="verificacion-nombre"
                    icon={ClipboardList}
                    tone="bg-indigo-50 text-indigo-700"
                    label="Nombre de quien verifica"
                    hint="Persona que revisa el formato"
                    required
                    error={errors.verificacionNombre}
                  >
                    <input
                      id="verificacion-nombre"
                      type="text"
                      name="verificacionNombre"
                      value={formData.verificacionNombre}
                      onChange={handleChange}
                      placeholder="Nombre completo"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-800"
                    />
                  </IconField>

                  <IconField
                    id="verificacion-fecha"
                    icon={CalendarCheck}
                    tone="bg-amber-50 text-amber-700"
                    label="Fecha de verificación"
                    hint="Día en que se verificó el formato"
                    required
                    error={errors.verificacionFecha}
                  >
                    <input
                      id="verificacion-fecha"
                      type="date"
                      name="verificacionFecha"
                      value={formData.verificacionFecha}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, verificacionFecha: e.target.value }));
                        if (errors.verificacionFecha) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.verificacionFecha;
                            return next;
                          });
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-800"
                    />
                  </IconField>

                  <IconField
                    id="iniciales-analista"
                    icon={PenLine}
                    tone="bg-teal-50 text-teal-700"
                    label="Iniciales del analista"
                    hint="Hasta 3 caracteres"
                    required
                    error={errors.inicialesAnalista}
                  >
                    <input
                      id="iniciales-analista"
                      type="text"
                      name="inicialesAnalista"
                      value={formData.inicialesAnalista}
                      onChange={handleChange}
                      placeholder="Ej. JD"
                      maxLength={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold uppercase tracking-widest text-gray-900 outline-none focus:border-blue-800"
                    />
                  </IconField>

                  <div className="md:col-span-2">
                    <IconField
                      id="codigo-muestra"
                      icon={Tag}
                      tone="bg-emerald-50 text-emerald-700"
                      label="Código de la muestra"
                      hint="Código asignado por el laboratorio"
                      required
                      error={errors.codigoMuestra}
                    >
                      <input
                        id="codigo-muestra"
                        type="text"
                        name="codigoMuestra"
                        value={formData.codigoMuestra}
                        onChange={handleChange}
                        placeholder="Ej. LAB-2026-001"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-800"
                      />
                    </IconField>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dots Indicator */}
          <div className="bg-gray-50 px-8 md:px-10 py-6 border-t border-gray-200 flex justify-center items-center gap-3">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    step < currentStep
                      ? 'bg-yellow-400 w-3 h-3'
                      : step === currentStep
                        ? 'bg-primary w-3 h-3'
                        : 'bg-gray-300'
                  }`}
                ></div>
                {index < 2 && (
                  <div
                    className={`h-0.5 w-6 transition-all duration-300 ${
                      step < currentStep ? 'bg-yellow-400' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-5 sm:px-8 md:px-10">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 rounded-lg border-2 border-blue-900 px-6 py-2 font-semibold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
            >
              <ChevronLeft className="h-5 w-5" />
              Anterior
            </button>

            <div className="text-sm font-semibold text-gray-600">
              Paso {currentStep} de 3
            </div>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-blue-950"
              >
                Siguiente
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Guardando…" : isEdit ? "Actualizar" : "Guardar"}
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
         {/* Footer */}
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>© 2026 UNAN Managua - CIRA | Sistema de Gestión de Ingreso de Muestras Ambientales SGIMA</p>
        </div>
      </div>

      {mapOpen ? (
        <Suspense fallback={null}>
          <NicaraguaMapModal
            open
            initialValue={mapStart.coords}
            initialZoom={mapStart.zoom}
            onConfirm={async (coords) => {
              const parsed = parseLatLng(coords);
              if (parsed) {
                const lat = parsed.lat.toFixed(6);
                const lng = parsed.lng.toFixed(6);
                setCoordsInput(formatLatLng(parsed));
                setFormData((prev) => ({
                  ...prev,
                  coordenadasN: lat,
                  coordenadasE: lng,
                }));
                try {
                  const meters = await fetchElevacion(parsed.lat, parsed.lng);
                  setFormData((prev) => ({ ...prev, elevacion: String(meters) }));
                } catch {
                  // El usuario puede ajustar la elevación a mano.
                }
              }
              setMapOpen(false);
            }}
            onCancel={() => setMapOpen(false)}
          />
        </Suspense>
      ) : null}

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
    </div>
  );
}
