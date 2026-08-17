import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext.jsx";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Compass,
  FlaskConical,
  House,
  IdCard,
  Layers,
  Mail,
  MapPin,
  PenLine,
  Phone,
  PhoneCall,
  Plus,
  Receipt,
  StickyNote,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { parseLatLng } from "../../../components/NicaraguaMapModal.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import ValidationIssuesModal from "../../../components/ValidationIssuesModal.jsx";
import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";
import {
  collectSolicitudIssues,
  issuesToFormErrors,
  SOLICITUD_STEP_LABELS,
} from "../utils/solicitudValidation.js";
import { ROUTES } from "../../../router/routes.js";
import { getClienteById, normalizeClienteFromApi } from "../../clientes/service/clienteService.js";
import {
  createSolicitudServicio,
  getSolicitudById,
  updateSolicitudServicio,
} from "../service/solicitudServicioService.js";
import { formToSolicitudPayload, toInputDate } from "../utils/formToSolicitudPayload.js";
import { mapClienteToSolicitudPrefill, nombreCompletoCliente } from "../utils/mapClienteToSolicitud.js";
import { asignarEstilosUnicos, estiloMatriz, estiloMedio, estiloServicio } from "../../../utils/catalogIcons.js";
import { getMediosRecepcion } from "../../catalogos/service/medioRecepcionService.js";
import { getServicios } from "../../catalogos/service/servicioService.js";
import { getMatrices } from "../../catalogos/service/matrizService.js";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";

const NicaraguaMapModal = lazy(() => import("../../../components/NicaraguaMapModal.jsx"));

function isClienteActivo(c) {
  return c?.activo !== false;
}

function nombreUsuarioLista(u) {
  const nombre = u?.nombreUsuario ?? u?.nombre ?? u?.Nombre ?? "";
  const apellido = u?.apellidoUsuario ?? u?.apellido ?? u?.Apellido ?? "";
  return `${nombre} ${apellido}`.trim() || u?.correoUsuario || u?.correo || `Usuario #${u?.idUsuario ?? u?.id ?? ""}`;
}

function CatalogChoiceCard({ selected, onClick, icon: Icon, tone, label, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-white text-gray-400"
          : selected
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

function IconField({ id, icon: Icon, tone, label, required, error, hint, children, className = "" }) {
  return (
    <div className={`rounded-xl border bg-gray-50/80 p-4 ${error ? "border-red-300" : "border-gray-200"} ${className}`}>
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

const initialFormData = {
  solicitudNo: "",
  fechaRecepcion: "",
  medioRecepcion: "",
  nombreUsuario: "",
  direccionUsuario: "",
  ruc: "",
  cedula: "",
  correo: "",
  contacto1Nombre: "",
  contacto1Telefono: "",
  contacto2Nombre: "",
  contacto2Telefono: "",
  tipoServicio: [],
  matriz: [],
  matrizOtra: "",
  numeroMuestras: 0,
  analisisSolicitados: [],
  modoUbicacion: "direccion", // "direccion" | "gps" — basta con una de las dos.
  ubicacionMuestreo: "",
  coordenadasGps: "",
  observaciones: "",
  firma: "",
  recibidoPor: "",
  fechaProforma: "",
};

export default function SolicitudServicioPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const { idCliente: idClienteParam, idSolicitud: idSolicitudParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Crear: /solicitud-servicio/:idCliente  |  Editar: /solicitud-servicio/editar/:idSolicitud
  const idSolicitud = idSolicitudParam ? Number(idSolicitudParam) : null;
  const isEdit = Number.isFinite(idSolicitud) && idSolicitud > 0;
  const [idClienteEdit, setIdClienteEdit] = useState(null);
  const idCliente = isEdit
    ? idClienteEdit
    : idClienteParam
      ? Number(idClienteParam)
      : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ...initialFormData });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [avisoClienteInactivo, setAvisoClienteInactivo] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validationApiMessage, setValidationApiMessage] = useState("");
  const [validationTitle, setValidationTitle] = useState("");
  const [validationDescription, setValidationDescription] = useState("");

  const clienteDesdeNavegacion = useMemo(() => {
    if (!idCliente || Number.isNaN(idCliente)) return null;
    let raw = null;
    if (location.state?.cliente?.idCliente === idCliente) {
      raw = location.state.cliente;
    } else {
      try {
        const stored = sessionStorage.getItem(`solicitud-cliente-${idCliente}`);
        raw = stored ? JSON.parse(stored) : null;
      } catch {
        raw = null;
      }
    }
    return raw ? normalizeClienteFromApi(raw) : null;
  }, [idCliente, location.state]);

  const etiquetaCliente = clienteDesdeNavegacion
    ? nombreCompletoCliente(clienteDesdeNavegacion)
    : idCliente
      ? `Cliente #${idCliente}`
      : "";

  useEffect(() => {
    if (isEdit) return;
    if (!idCliente || Number.isNaN(idCliente) || !clienteDesdeNavegacion) return;
    if (!isClienteActivo(clienteDesdeNavegacion)) {
      setAvisoClienteInactivo(true);
      return;
    }
    const prefill = mapClienteToSolicitudPrefill(clienteDesdeNavegacion);
    // Normalize tipoServicio from prefill to an array if needed
    const normalizedPrefill = { ...prefill };
    if (normalizedPrefill?.tipoServicio && !Array.isArray(normalizedPrefill.tipoServicio)) {
      normalizedPrefill.tipoServicio = [normalizedPrefill.tipoServicio];
    }
    setFormData((prev) => ({ ...prev, ...normalizedPrefill }));
  }, [idCliente, clienteDesdeNavegacion]);

  function cerrarAvisoInactivo() {
    setAvisoClienteInactivo(false);
    navigate(ROUTES.gestionClientes);
  }

  // Medios de recepción: catálogo GET /api/catalogos/medios-recepcion (solo activos).
  const [receptionMethods, setReceptionMethods] = useState([]);
  const [loadingReceptionMethods, setLoadingReceptionMethods] = useState(false);
  const [receptionMethodsError, setReceptionMethodsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingReceptionMethods(true);
        setReceptionMethodsError(null);
        const lista = await getMediosRecepcion();
        if (cancelled) return;
        setReceptionMethods(
          lista.filter((m) => m.activo !== false && Number(m.idMedioRecepcion) > 0),
        );
      } catch (err) {
        if (!cancelled) {
          setReceptionMethods([]);
          setReceptionMethodsError(err.message || "No se pudieron cargar los medios de recepción");
        }
      } finally {
        if (!cancelled) setLoadingReceptionMethods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Usuarios activos para Firma y Recibido por (GET /api/User/get-users).
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsuarios(true);
        const lista = await getUsuarios();
        if (cancelled) return;
        const activos = lista.filter((u) => u.activo !== false && Number(u.idUsuario) > 0);
        setUsuarios(activos);
      } catch {
        if (cancelled) return;
        const idSesion = Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);
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

  // Prefill firma con el usuario de sesión si aún no hay selección.
  useEffect(() => {
    const idSesion = Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);
    if (!idSesion) return;
    setFormData((p) => (p.firma ? p : { ...p, firma: String(idSesion) }));
  }, [user]);

  // Servicios: GET /api/catalogos/servicios (solo activos). Se pueden elegir varios.
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
  const [serviceTypesError, setServiceTypesError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingServiceTypes(true);
        setServiceTypesError(null);
        const lista = await getServicios();
        if (cancelled) return;
        setServiceTypes(
          lista.filter((s) => s.activo !== false && Number(s.idServicio) > 0),
        );
      } catch (err) {
        if (!cancelled) {
          setServiceTypes([]);
          setServiceTypesError(err.message || "No se pudieron cargar los servicios");
        }
      } finally {
        if (!cancelled) setLoadingServiceTypes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Matrices: GET /api/catalogos/matrices (solo activas). Cada una lleva idMatriz + cantidad.
  const [matrices, setMatrices] = useState([]);
  const [loadingMatrices, setLoadingMatrices] = useState(false);
  const [errorMatrices, setErrorMatrices] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMatrices(true);
        setErrorMatrices(null);
        const lista = await getMatrices();
        if (cancelled) return;
        setMatrices(
          lista.filter((m) => m.activo !== false && Number(m.idMatriz) > 0),
        );
      } catch (err) {
        if (!cancelled) {
          setMatrices([]);
          setErrorMatrices(err.message || "No se pudieron cargar las matrices");
        }
      } finally {
        if (!cancelled) setLoadingMatrices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Catálogo de análisis: el POST exige idAnalisis, no texto libre.
  const [analisisCatalogo, setAnalisisCatalogo] = useState([]);
  useEffect(() => {
    let mounted = true;
    getAnalisis()
      .then((data) => {
        if (!mounted) return;
        setAnalisisCatalogo((data ?? []).filter((a) => a.activo !== false));
      })
      .catch(() => {
        if (mounted) addToast("No se pudo cargar el catálogo de análisis", "error");
      });
    return () => {
      mounted = false;
    };
  }, [addToast]);

  // Edición: carga la solicitud y rellena el wizard.
  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    async function loadSolicitud() {
      try {
        const s = await getSolicitudById(idSolicitud);
        if (!mounted) return;
        setIdClienteEdit(s.idCliente ?? null);
        let prefillCliente = {};
        if (s.idCliente) {
          try {
            const cliente = await getClienteById(s.idCliente);
            prefillCliente = mapClienteToSolicitudPrefill(cliente);
          } catch {
            /* el wizard sigue con los datos de la solicitud */
          }
        }
        setFormData((prev) => ({
          ...prev,
          ...prefillCliente,
          solicitudNo: s.numeroSolicitud ?? "",
          fechaRecepcion: toInputDate(s.fechaRecepcion),
          medioRecepcion: s.idMedioRecepcion ? Number(s.idMedioRecepcion) : "",
          nombreUsuario: s.cliente ?? prefillCliente.nombreUsuario ?? "",
          correo: s.correoCliente ?? prefillCliente.correo ?? "",
          tipoServicio: (s.idServicios ?? []).map(Number).filter((id) => id > 0),
          matriz: (s.matrices ?? []).map((m) => ({
            idMatriz: Number(m.idMatriz ?? m.IdMatriz),
            numMuestras: m.numMuestras ?? m.NumMuestras ?? 0,
          })),
          numeroMuestras: s.numMuestras ?? 0,
          analisisSolicitados: (s.detalles ?? []).map((d) => ({
            idAnalisis: Number(d.idAnalisis ?? d.IdAnalisis) || "",
            tipoAnalisis: d.nombreAnalisis ?? d.NombreAnalisis ?? "",
            tecnica: d.abreviacionAnalisis ?? d.AbreviacionAnalisis ?? "",
            cantidad: d.cantidad ?? 1,
          })),
          ubicacionMuestreo: parseLatLng(s.direccionMuestreo) ? "" : (s.direccionMuestreo ?? ""),
          coordenadasGps: parseLatLng(s.direccionMuestreo)
            ? String(s.direccionMuestreo).trim()
            : "",
          modoUbicacion: parseLatLng(s.direccionMuestreo) ? "gps" : "direccion",
          observaciones: s.observacion ?? "",
          fechaProforma: toInputDate(s.fechaEnvioProforma),
          firma: s.idUsuario ? String(s.idUsuario) : prev.firma,
          estado: s.estado ?? "Pendiente",
        }));
      } catch (err) {
        if (mounted) addToast(err?.message || "No se pudo cargar la solicitud", "error");
      }
    }
    loadSolicitud();
    return () => {
      mounted = false;
    };
  }, [isEdit, idSolicitud, addToast]);

  // Auto-sync numeroMuestras with sum of matriz[].numMuestras
  useEffect(() => {
    const total = Array.isArray(formData.matriz)
      ? formData.matriz.reduce((sum, m) => sum + (m.numMuestras || 0), 0)
      : 0;
    setFormData(prev => ({ ...prev, numeroMuestras: total }));
  }, [formData.matriz]);

  function selectedServiceLabels() {
    const ids = Array.isArray(formData.tipoServicio)
      ? formData.tipoServicio
      : formData.tipoServicio
        ? [formData.tipoServicio]
        : [];
    if (ids.length === 0) return "No especificado";
    return ids
      .map(
        (id) =>
          serviceTypes.find((s) => Number(s.idServicio) === Number(id))?.nombreServicio || id,
      )
      .join(", ");
  }
  function selectedMatrixLabels() {
    const entries = Array.isArray(formData.matriz) ? formData.matriz : [];
    if (entries.length === 0) return "No especificada";
    return entries
      .map((e) => {
        const label =
          matrices.find((m) => Number(m.idMatriz) === Number(e.idMatriz))
            ?.nombreMatriz || e.idMatriz;
        return `${label} (${e.numMuestras})`;
      })
      .join(", ");
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

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddAnalysis = () => {
    setFormData(prev => ({
      ...prev,
      analisisSolicitados: [...prev.analisisSolicitados, { idAnalisis: '', tipoAnalisis: '', tecnica: '', cantidad: 1 }],
    }));
  };

  const handleRemoveAnalysis = (index) => {
    setFormData(prev => ({
      ...prev,
      analisisSolicitados: prev.analisisSolicitados.filter((_, i) => i !== index),
    }));
  };

  const handleAnalysisChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.analisisSolicitados];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, analisisSolicitados: updated };
    });
  };

  const handleAnalysisSelect = (index, idAnalisis) => {
    const item = analisisCatalogo.find((a) => String(a.idAnalisis) === String(idAnalisis));
    setFormData((prev) => {
      const updated = [...prev.analisisSolicitados];
      updated[index] = {
        ...updated[index],
        idAnalisis,
        tipoAnalisis: item?.nombreAnalisis ?? "",
        tecnica: item?.abreviacionAnalisis ?? "",
      };
      return { ...prev, analisisSolicitados: updated };
    });
  };

  const handleNext = () => {
    const issues = collectSolicitudIssues(formData, { steps: [currentStep] });
    if (issues.length > 0) {
      mostrarValidacion({
        issues,
        title: "No puede continuar al siguiente paso",
        description: `Revise los campos pendientes del paso ${currentStep} — ${SOLICITUD_STEP_LABELS[currentStep - 1]}.`,
      });
      return;
    }
    setErrors({});
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const issues = collectSolicitudIssues(formData, { steps: [1, 2, 3] });

    if (!idCliente || Number.isNaN(idCliente)) {
      issues.unshift({
        step: 1,
        stepLabel: `Paso 1 — ${SOLICITUD_STEP_LABELS[0]}`,
        field: "idCliente",
        label: "Cliente vinculado",
        tipo: "formato",
        detalle: isEdit
          ? "No se pudo identificar el cliente de esta solicitud."
          : "La solicitud debe crearse desde un cliente activo.",
        formato: "Abra Gestión de Clientes y cree la solicitud desde un usuario activo.",
      });
    }

    if (issues.length > 0) {
      mostrarValidacion({
        issues,
        title: isEdit ? "No se pudo actualizar la solicitud" : "No se pudo crear la solicitud",
        description:
          "Faltan datos requeridos o hay un valor inválido. Corrija los campos indicados e intente de nuevo.",
      });
      return;
    }

    const idUsuario = Number(formData.firma) || Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);

    try {
      setSaving(true);
      const payload = formToSolicitudPayload(formData, { idCliente, idUsuario });
      if (isEdit) {
        await updateSolicitudServicio(idSolicitud, payload);
        addToast("Solicitud actualizada correctamente.", "success");
      } else {
        await createSolicitudServicio(payload);
        addToast("Solicitud registrada correctamente.", "success");
      }
      navigate(ROUTES.solicitudServicio);
    } catch (err) {
      const mensaje = err?.message || "No se pudo registrar la solicitud.";
      mostrarValidacion({
        issues: [],
        apiMessage: mensaje,
        title: isEdit ? "No se pudo actualizar la solicitud" : "No se pudo crear la solicitud",
        description: "El servidor rechazó el registro. Revise el motivo e intente de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Contenido por paso (funciones de render, no componentes, para no remontar al escribir)
  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Información del Solicitante</h2>
        <p className="text-gray-600">Complete los datos del cliente, empresa o institución</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-blue-900" />
          Datos principales
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Información básica de la solicitud</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconField
            id="solicitud-no"
            icon={ClipboardList}
            tone="bg-blue-50 text-blue-800"
            label="Solicitud No."
            hint="Identificador interno de la solicitud"
          >
            <input
              id="solicitud-no"
              type="text"
              name="solicitudNo"
              value={formData.solicitudNo}
              onChange={handleChange}
              placeholder="Ej: SOL-2024-001"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="fecha-recepcion"
            icon={CalendarDays}
            tone="bg-amber-50 text-amber-700"
            label="Fecha de recepción"
            hint="Día en que se recibió la solicitud"
          >
            <input
              id="fecha-recepcion"
              type="date"
              name="fechaRecepcion"
              value={formData.fechaRecepcion}
              onChange={handleChange}
              className={ICON_INPUT}
            />
          </IconField>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-yellow-400" />
          Medio de recepción
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Seleccione solo 1</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loadingReceptionMethods ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-400">
                Cargando...
              </div>
            ))
          ) : receptionMethods.length > 0 ? (
            asignarEstilosUnicos(
              receptionMethods,
              (method) => method.nombreMedioRecepcion || method.nombre,
              estiloMedio,
            ).map(({ item: method, estilo }) => {
              const id = Number(method.idMedioRecepcion);
              const label = method.nombreMedioRecepcion || method.nombre;
              return (
                <CatalogChoiceCard
                  key={id}
                  selected={Number(formData.medioRecepcion) === id}
                  icon={estilo.icon}
                  tone={estilo.tone}
                  label={label}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, medioRecepcion: id }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.medioRecepcion;
                      return next;
                    });
                  }}
                />
              );
            })
          ) : (
            <p className="col-span-full text-sm text-gray-500">No hay medios de recepción disponibles.</p>
          )}
        </div>
        {(receptionMethodsError || errors.medioRecepcion) && (
          <p className="mt-3 text-xs font-medium text-red-500">
            {errors.medioRecepcion || receptionMethodsError}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-blue-900" />
          Información del Usuario
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Datos del cliente, empresa o institución</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconField
            id="nombre-usuario"
            icon={Building2}
            tone="bg-slate-100 text-slate-700"
            label="Nombre del usuario"
            hint="Cliente, empresa o institución"
            required
            error={errors.nombreUsuario}
            className="md:col-span-2"
          >
            <input
              id="nombre-usuario"
              type="text"
              name="nombreUsuario"
              value={formData.nombreUsuario}
              onChange={handleChange}
              placeholder="Nombre completo"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="direccion-usuario"
            icon={House}
            tone="bg-amber-50 text-amber-800"
            label="Dirección"
            hint="Dirección completa del solicitante"
            required
            error={errors.direccionUsuario}
            className="md:col-span-2"
          >
            <input
              id="direccion-usuario"
              type="text"
              name="direccionUsuario"
              value={formData.direccionUsuario}
              onChange={handleChange}
              placeholder="Dirección completa"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="ruc-usuario"
            icon={Receipt}
            tone="bg-indigo-50 text-indigo-700"
            label="No. RUC"
            hint="Registro único de contribuyente"
          >
            <input
              id="ruc-usuario"
              type="text"
              name="ruc"
              value={formData.ruc}
              onChange={handleChange}
              placeholder="RUC"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="cedula-usuario"
            icon={IdCard}
            tone="bg-sky-50 text-sky-700"
            label="No. de cédula"
            hint="Documento de identidad"
          >
            <input
              id="cedula-usuario"
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="Cédula"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="correo-usuario"
            icon={Mail}
            tone="bg-violet-50 text-violet-700"
            label="Correo electrónico"
            hint="Correo de contacto del solicitante"
            required
            error={errors.correo}
            className="md:col-span-2"
          >
            <input
              id="correo-usuario"
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className={ICON_INPUT}
            />
          </IconField>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-yellow-400" />
          Datos de Contacto
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Información de contacto principal y secundario</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconField
            id="contacto1-nombre"
            icon={UserRound}
            tone="bg-sky-50 text-sky-700"
            label="Contacto 1 — Nombre"
            hint="Contacto principal"
          >
            <input
              id="contacto1-nombre"
              type="text"
              name="contacto1Nombre"
              value={formData.contacto1Nombre}
              onChange={handleChange}
              placeholder="Nombre del contacto"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="contacto1-telefono"
            icon={Phone}
            tone="bg-emerald-50 text-emerald-700"
            label="Contacto 1 — Teléfono"
            hint="Teléfono principal"
          >
            <input
              id="contacto1-telefono"
              type="tel"
              name="contacto1Telefono"
              value={formData.contacto1Telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="contacto2-nombre"
            icon={Users}
            tone="bg-slate-100 text-slate-700"
            label="Contacto 2 — Nombre"
            hint="Contacto secundario"
          >
            <input
              id="contacto2-nombre"
              type="text"
              name="contacto2Nombre"
              value={formData.contacto2Nombre}
              onChange={handleChange}
              placeholder="Nombre del contacto"
              className={ICON_INPUT}
            />
          </IconField>
          <IconField
            id="contacto2-telefono"
            icon={PhoneCall}
            tone="bg-teal-50 text-teal-700"
            label="Contacto 2 — Teléfono"
            hint="Teléfono secundario"
          >
            <input
              id="contacto2-telefono"
              type="tel"
              name="contacto2Telefono"
              value={formData.contacto2Telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className={ICON_INPUT}
            />
          </IconField>
        </div>
      </section>
    </div>
  );

  // Step 2 Component
  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Servicio Solicitado</h2>
        <p className="text-gray-600">Seleccione el tipo de servicio y especifique los detalles</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-blue-900" />
          Servicio Solicitado <span className="text-red-500">*</span>
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Puede seleccionar más de uno</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loadingServiceTypes ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-400">
                Cargando...
              </div>
            ))
          ) : serviceTypes.length > 0 ? (
            asignarEstilosUnicos(
              serviceTypes,
              (service) => service.nombreServicio || service.nombre,
              estiloServicio,
            ).map(({ item: service, estilo }) => {
              const id = Number(service.idServicio);
              const seleccionados = Array.isArray(formData.tipoServicio) ? formData.tipoServicio : [];
              const seleccionado = seleccionados.some((x) => Number(x) === id);
              const label = service.nombreServicio || service.nombre;
              return (
                <CatalogChoiceCard
                  key={id}
                  selected={seleccionado}
                  icon={estilo.icon}
                  tone={estilo.tone}
                  label={label}
                  onClick={() => {
                    setFormData((prev) => {
                      const actual = Array.isArray(prev.tipoServicio) ? prev.tipoServicio : [];
                      const yaEsta = actual.some((x) => Number(x) === id);
                      return {
                        ...prev,
                        tipoServicio: yaEsta
                          ? actual.filter((x) => Number(x) !== id)
                          : [...actual, id],
                      };
                    });
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.tipoServicio;
                      return next;
                    });
                  }}
                />
              );
            })
          ) : (
            <p className="col-span-full text-sm text-gray-500">No hay servicios disponibles.</p>
          )}
        </div>
        {serviceTypesError && <p className="mt-3 text-xs font-medium text-red-500">{serviceTypesError}</p>}
        {errors.tipoServicio && <p className="mt-3 text-xs font-medium text-red-500">{errors.tipoServicio}</p>}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-yellow-400" />
          Matriz <span className="text-red-500">*</span>
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Seleccione y asigne muestras por matriz</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loadingMatrices ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-400">
                Cargando...
              </div>
            ))
          ) : matrices.length > 0 ? (
            asignarEstilosUnicos(
              matrices,
              (matrix) => matrix.nombreMatriz || matrix.nombre,
              estiloMatriz,
            ).map(({ item: matrix, estilo }) => {
              const id = Number(matrix.idMatriz);
              const entry = (formData.matriz || []).find((m) => Number(m.idMatriz) === id);
              const count = entry?.numMuestras ?? 0;
              const isActive = count > 0;
              const label = matrix.nombreMatriz || matrix.nombre;
              const Icon = estilo.icon;

              function setCantidad(deltaOrStart) {
                setFormData((prev) => {
                  const arr = Array.isArray(prev.matriz) ? [...prev.matriz] : [];
                  const idx = arr.findIndex((x) => Number(x.idMatriz) === id);
                  if (deltaOrStart === "start") {
                    if (idx < 0) arr.push({ idMatriz: id, numMuestras: 1 });
                    else arr[idx] = { ...arr[idx], numMuestras: arr[idx].numMuestras + 1 };
                  } else if (idx >= 0) {
                    const next = arr[idx].numMuestras + deltaOrStart;
                    if (next <= 0) arr.splice(idx, 1);
                    else arr[idx] = { ...arr[idx], numMuestras: next };
                  } else if (deltaOrStart > 0) {
                    arr.push({ idMatriz: id, numMuestras: 1 });
                  }
                  return { ...prev, matriz: arr };
                });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.matriz;
                  return next;
                });
              }

              return (
                <div
                  key={id}
                  onClick={() => setCantidad("start")}
                  className={`relative cursor-pointer rounded-xl border p-4 text-left transition ${
                    isActive
                      ? "border-blue-900 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-gray-50/80 hover:border-blue-300"
                  }`}
                >
                  {count > 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      {count}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${estilo.tone}`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className={`text-sm font-semibold leading-snug ${isActive ? "text-blue-900" : "text-gray-800"}`}>
                      {label}
                    </span>
                  </div>
                  {count > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCantidad(-1);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100"
                      >
                        -
                      </button>
                      <div className="min-w-8 rounded-full bg-slate-100 px-3 py-1 text-center text-sm font-semibold text-slate-700">
                        {count}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCantidad(1);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-gray-500">No hay matrices disponibles.</p>
          )}
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Total de muestras: {formData.numeroMuestras}
          </span>
        </div>
        {errorMatrices && <p className="mt-3 text-xs font-medium text-red-500">{errorMatrices}</p>}
        {errors.matriz && <p className="mt-3 text-xs font-medium text-red-500">{errors.matriz}</p>}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-blue-900" />
          Muestras
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Cantidad calculada según las matrices seleccionadas</p>
        <div className="max-w-xs">
          <IconField
            id="numero-muestras"
            icon={Layers}
            tone="bg-indigo-50 text-indigo-700"
            label="No. de muestras"
            hint="Se completa de forma automática"
          >
            <input
              id="numero-muestras"
              type="number"
              name="numeroMuestras"
              value={formData.numeroMuestras}
              readOnly
              className={`${ICON_INPUT} bg-gray-50 text-center font-semibold text-blue-900`}
            />
          </IconField>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-yellow-400" />
              Análisis Solicitados
            </h3>
            <p className="ml-4 text-sm text-gray-500">Agregue los análisis requeridos</p>
          </div>
          <button
            type="button"
            onClick={handleAddAnalysis}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        {formData.analisisSolicitados.length > 0 ? (
          <div className="space-y-3">
            {formData.analisisSolicitados.map((analysis, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <FlaskConical className="h-4 w-4" aria-hidden />
                </span>
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <select
                    className={ICON_INPUT}
                    value={analysis.idAnalisis || ""}
                    onChange={(e) => handleAnalysisSelect(index, e.target.value)}
                  >
                    <option value="">Seleccione un análisis</option>
                    {analisisCatalogo.map((a) => (
                      <option key={a.idAnalisis} value={a.idAnalisis}>
                        {a.nombreAnalisis}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    readOnly
                    placeholder="Abreviatura del catálogo"
                    className={`${ICON_INPUT} bg-gray-50 text-gray-600`}
                    value={analysis.tecnica}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAnalysis(index)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  aria-label="Quitar análisis"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-5 text-center">
            <p className="text-sm text-gray-600">
              No hay análisis agregados. Haga clic en Agregar para añadir uno.
            </p>
          </div>
        )}
        {errors.analisisSolicitados && (
          <p className="mt-3 text-xs font-medium text-red-500">{errors.analisisSolicitados}</p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-blue-900" />
          Ubicación de Muestreo <span className="text-red-500">*</span>
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">
          Indique la dirección o marque el punto en el mapa (GPS)
        </p>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CatalogChoiceCard
            selected={formData.modoUbicacion === "direccion"}
            icon={House}
            tone="bg-amber-50 text-amber-800"
            label="Escribir dirección"
            onClick={() => {
              setFormData((p) => ({ ...p, modoUbicacion: "direccion" }));
              setErrors((p) => {
                const next = { ...p };
                delete next.ubicacionMuestreo;
                return next;
              });
            }}
          />
          <CatalogChoiceCard
            selected={formData.modoUbicacion === "gps"}
            icon={Compass}
            tone="bg-cyan-50 text-cyan-700"
            label="Marcar GPS en el mapa"
            onClick={() => {
              setFormData((p) => ({ ...p, modoUbicacion: "gps" }));
              setErrors((p) => {
                const next = { ...p };
                delete next.ubicacionMuestreo;
                return next;
              });
            }}
          />
        </div>
        {formData.modoUbicacion === "gps" ? (
          <IconField
            id="coordenadas-gps"
            icon={MapPin}
            tone="bg-cyan-50 text-cyan-700"
            label="Coordenadas"
            hint="Marque el punto en el mapa de Nicaragua"
            required
            error={errors.ubicacionMuestreo}
          >
            <div className="flex gap-2">
              <input
                id="coordenadas-gps"
                className={`${ICON_INPUT} flex-1 cursor-pointer`}
                readOnly
                placeholder="Marque el punto en el mapa"
                value={formData.coordenadasGps}
                onClick={() => setMapOpen(true)}
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
        ) : (
          <IconField
            id="ubicacion-muestreo"
            icon={House}
            tone="bg-rose-50 text-rose-700"
            label="Dirección"
            hint="Descripción del sitio de muestreo"
            required
            error={errors.ubicacionMuestreo}
          >
            <textarea
              id="ubicacion-muestreo"
              name="ubicacionMuestreo"
              value={formData.ubicacionMuestreo}
              onChange={handleChange}
              placeholder="Ej. Barrio X, frente a la iglesia, Managua"
              className="min-h-[96px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-800"
              rows={3}
            />
          </IconField>
        )}
      </section>

      {( (Array.isArray(formData.tipoServicio) ? formData.tipoServicio.length > 0 : !!formData.tipoServicio)
        || (Array.isArray(formData.matriz) ? formData.matriz.length > 0 : !!formData.matriz)
        || formData.analisisSolicitados.length > 0) && (
        <div className="rounded-lg border-l-4 border-blue-900 bg-blue-50 p-6">
          <p className="text-sm font-semibold text-gray-700">
            Resumen: <span className="font-bold text-blue-900">{selectedServiceLabels()}</span> |
            <span className="font-bold text-blue-900"> {selectedMatrixLabels()}</span> |
            <span className="font-bold text-blue-900"> {formData.analisisSolicitados.length} análisis agregado(s)</span>
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Observaciones y Confirmación</h2>
        <p className="text-gray-600">Revise su solicitud y agregue comentarios adicionales</p>
      </div>

      <div className="rounded-lg border-l-4 border-blue-900 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-bold text-blue-900">Resumen de su Solicitud</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="mb-1 text-xs text-gray-500">Solicitud No.</p>
            <p className="font-semibold text-gray-800">{formData.solicitudNo || "No especificado"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500">Nombre</p>
            <p className="font-semibold text-gray-800">{formData.nombreUsuario || "No especificado"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500">Correo</p>
            <p className="font-semibold text-gray-800">{formData.correo || "No especificado"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500">Tipo de servicio</p>
            <p className="font-semibold text-gray-800">{selectedServiceLabels()}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-gray-500">Matriz</p>
            <p className="font-semibold text-gray-800">{selectedMatrixLabels()}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-gray-500">Ubicación de muestreo</p>
            <p className="font-semibold text-gray-800">
              {formData.modoUbicacion === "gps"
                ? formData.coordenadasGps || "No especificado"
                : formData.ubicacionMuestreo || "No especificado"}
            </p>
          </div>
        </div>
        {formData.analisisSolicitados.length > 0 && (
          <div className="mt-5 space-y-2">
            {formData.analisisSolicitados.map((analysis, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-blue-100 bg-white p-4"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <FlaskConical className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{analysis.tipoAnalisis || "—"}</p>
                  <p className="text-xs text-gray-500">{analysis.tecnica || "Sin técnica"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-yellow-400" />
          Observaciones
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Opcional. Máximo 200 caracteres.</p>
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <StickyNote className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              maxLength={200}
              placeholder="Agregue cualquier observación, comentario o requerimiento especial para esta solicitud..."
              className="min-h-[96px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-800"
              rows={4}
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {String(formData.observaciones ?? "").length}/200
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
          <span className="h-7 w-1 rounded-full bg-blue-900" />
          Verificación final
        </h3>
        <p className="mb-5 ml-4 text-sm text-gray-500">Complete la información de verificación</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <IconField
            id="firma-usuario"
            icon={PenLine}
            tone="bg-sky-50 text-sky-700"
            label="Firma del usuario"
            hint="Usuario que firma la solicitud"
            required
            error={errors.firma}
          >
            <select
              id="firma-usuario"
              name="firma"
              value={formData.firma}
              onChange={handleChange}
              disabled={loadingUsuarios}
              className={ICON_INPUT}
            >
              <option value="">{loadingUsuarios ? "Cargando usuarios…" : "Seleccione un usuario"}</option>
              {usuarios.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {nombreUsuarioLista(u)}
                </option>
              ))}
            </select>
          </IconField>
          <IconField
            id="recibido-por"
            icon={UserCheck}
            tone="bg-indigo-50 text-indigo-700"
            label="Solicitud recibida por"
            hint="Usuario que recibe la solicitud"
            required
            error={errors.recibidoPor}
          >
            <select
              id="recibido-por"
              name="recibidoPor"
              value={formData.recibidoPor}
              onChange={handleChange}
              disabled={loadingUsuarios}
              className={ICON_INPUT}
            >
              <option value="">{loadingUsuarios ? "Cargando usuarios…" : "Seleccione un usuario"}</option>
              {usuarios.map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {nombreUsuarioLista(u)}
                </option>
              ))}
            </select>
          </IconField>
          <IconField
            id="fecha-proforma"
            icon={CalendarCheck}
            tone="bg-amber-50 text-amber-700"
            label="Fecha de envío de la proforma"
            hint="Día en que se enviará la proforma"
            className="md:col-span-2"
          >
            <input
              id="fecha-proforma"
              type="date"
              name="fechaProforma"
              value={formData.fechaProforma}
              onChange={handleChange}
              className={ICON_INPUT}
            />
          </IconField>
        </div>
        <p className="mt-5 text-xs text-gray-500">
          Al seleccionar la firma acepta los términos y condiciones del servicio
        </p>
      </section>
    </div>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gray-100">
      {/* Header  
      <header className="bg-blue-900 text-white py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <div className="text-center md:text-left flex-1">
            <h2 className="text-xl font-bold">SOLICITUD DE SERVICIOS</h2>
            <p className="text-sm">UNAN-MANAGUA / CIRA — FOR-CIRA-APE-04</p>
          </div>
        </div>
      </header> */}

      {/* Subheader */}
      <div className="bg-yellow-400 text-blue-900 text-center py-2 font-semibold">
        ÁREA DE PROYECCIÓN Y EXTENSIÓN
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <WizardStepIndicator currentStep={currentStep} />

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-10">
            {idCliente && !Number.isNaN(idCliente) && (
              <div className="mb-8 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <p className="font-medium">Solicitud vinculada al cliente</p>
                <p className="mt-0.5">
                  {etiquetaCliente}
                  <span className="ml-2 text-blue-700">(ID: {idCliente})</span>
                </p>
              </div>
            )}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          <div className="flex justify-center items-center gap-3 border-t border-gray-200 bg-white px-8 py-6 md:px-10">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                    step < currentStep
                      ? "h-3 w-3 bg-yellow-400"
                      : step === currentStep
                        ? "h-3 w-3 bg-blue-900"
                        : "bg-gray-300"
                  }`}
                />
                {index < 2 && (
                  <div
                    className={`h-0.5 w-6 transition-all duration-300 ${
                      step < currentStep ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-8 py-6 md:px-10">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 rounded-lg border-2 px-6 py-2 font-semibold transition-all ${
                currentStep === 1
                  ? "cursor-not-allowed border-gray-300 text-gray-400"
                  : "border-blue-900 text-blue-900 hover:bg-blue-50"
              }`}
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
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg"
              >
                Siguiente
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-blue-950 hover:shadow-lg disabled:opacity-60"
              >
                {saving ? "Guardando…" : isEdit ? "Actualizar" : "Guardar"}
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          <p>© 2026 UNAN Managua - CIRA | Sistema de Gestión de Ingreso de Muestras Ambientales SGIMA</p>
        </div>
      </div>

      {mapOpen ? (
        <Suspense fallback={null}>
          <NicaraguaMapModal
            open
            initialValue={formData.coordenadasGps}
            initialZoom={formData.coordenadasGps ? 13 : 7}
            onConfirm={(coords) => {
              setFormData((p) => ({ ...p, coordenadasGps: coords, modoUbicacion: "gps" }));
              setErrors((p) => {
                const next = { ...p };
                delete next.ubicacionMuestreo;
                return next;
              });
              setMapOpen(false);
            }}
            onCancel={() => setMapOpen(false)}
          />
        </Suspense>
      ) : null}

      <ConfirmDialog
        open={avisoClienteInactivo}
        title="Usuario inactivo"
        message={`El usuario "${etiquetaCliente || `Cliente #${idCliente}`}" se encuentra inactivo. Actívelo antes de crear una solicitud de servicio.`}
        confirmText="Entendido"
        showCancel={false}
        confirmClass="bg-amber-600 hover:bg-amber-700"
        onConfirm={cerrarAvisoInactivo}
        onCancel={cerrarAvisoInactivo}
      />

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
