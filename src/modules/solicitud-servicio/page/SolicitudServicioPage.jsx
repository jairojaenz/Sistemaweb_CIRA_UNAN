import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { ChevronLeft, ChevronRight, FileCheck, MapPin, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { parseLatLng } from "../../../components/NicaraguaMapModal.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";
import { ROUTES } from "../../../router/routes.js";
import { getClienteById, normalizeClienteFromApi } from "../../clientes/service/clienteService.js";
import {
  createSolicitudServicio,
  getSolicitudById,
  updateSolicitudServicio,
} from "../service/solicitudServicioService.js";
import { formToSolicitudPayload, toInputDate } from "../utils/formToSolicitudPayload.js";
import { mapClienteToSolicitudPrefill, nombreCompletoCliente } from "../utils/mapClienteToSolicitud.js";
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
  const [errorGuardado, setErrorGuardado] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

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

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nombreUsuario?.trim()) newErrors.nombreUsuario = 'Campo requerido';
      if (!formData.direccionUsuario?.trim()) newErrors.direccionUsuario = 'Campo requerido';
      if (!formData.correo?.trim()) newErrors.correo = 'Campo requerido';
      if (!Number(formData.medioRecepcion)) newErrors.medioRecepcion = 'Seleccione un medio de recepción';
    }

    if (step === 2) {
      if (!Array.isArray(formData.tipoServicio) || formData.tipoServicio.length === 0) {
        newErrors.tipoServicio = "Seleccione al menos un servicio";
      }
      if (!formData.matriz || !Array.isArray(formData.matriz) || formData.matriz.length === 0) {
        newErrors.matriz = "Seleccione al menos una matriz";
      }
      const analisisValidos = (formData.analisisSolicitados ?? []).some((a) => Number(a.idAnalisis) > 0);
      if (!analisisValidos) newErrors.analisisSolicitados = "Seleccione al menos un análisis del catálogo";
      const tieneDireccion = String(formData.ubicacionMuestreo ?? "").trim();
      const tieneGps = !!parseLatLng(formData.coordenadasGps);
      if (formData.modoUbicacion === "gps") {
        if (!tieneGps) newErrors.ubicacionMuestreo = "Marque el punto de muestreo en el mapa";
      } else if (!tieneDireccion) {
        newErrors.ubicacionMuestreo = "Escriba la dirección o marque el GPS en el mapa";
      }
    }

    if (step === 3) {
      if (!Number(formData.firma)) newErrors.firma = "Seleccione la firma del usuario";
      if (!Number(formData.recibidoPor)) newErrors.recibidoPor = "Seleccione quién recibió la solicitud";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    if (!idCliente || Number.isNaN(idCliente)) {
      addToast(
        isEdit
          ? "No se pudo identificar el cliente de la solicitud."
          : "Debe crear la solicitud desde un cliente (Gestión de Clientes).",
        "error",
      );
      return;
    }

    const idUsuario = Number(formData.firma) || Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);
    if (!idUsuario) {
      addToast("Seleccione la firma del usuario en el paso 3.", "error");
      setCurrentStep(3);
      return;
    }

    if (!formData.medioRecepcion) {
      addToast("Seleccione el medio de recepción en el paso 1.", "error");
      setCurrentStep(1);
      return;
    }

    try {
      setSaving(true);
      setErrorGuardado("");
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
      setErrorGuardado(mensaje);
    } finally {
      setSaving(false);
    }
  };

  // Contenido por paso (funciones de render, no componentes, para no remontar al escribir)
  const renderStep1 = () => (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-blue-900 mb-2">Información del Solicitante</h2>
        <p className="text-[#6a7282]">Complete los datos del cliente, empresa o institución</p>
      </div>

      {/* Datos principales */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-blue-900 rounded-full"></div>
          Datos principales
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Información básica de la solicitud</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
          <div className="relative group">
            <input
              type="text"
              name="solicitudNo"
              value={formData.solicitudNo}
              onChange={handleChange}
              placeholder="Ej: SOL-2024-001"
              className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900 peer-placeholder-shown:top-3">
              Solicitud No.
            </label>
          </div>

          <div className="relative group">
            <input
              type="date"
              name="fechaRecepcion"
              value={formData.fechaRecepcion}
              onChange={handleChange}
              className="w-full px-0 py-3 border-b-2 bg-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:text-blue-900">
              Fecha de recepción
            </label>
          </div>
        </div>
      </div>

      {/* Medio de recepción */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-accent rounded-full"></div>
          Medio de recepción
        </h3>
        <p className="text-sm text-[#6a7282] mb-4 ml-4">Seleccione solo 1</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-4">
          {loadingReceptionMethods ? (
            [1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                disabled
                className="p-4 rounded-lg border-2 transition-all font-semibold border-gray-300 bg-white text-gray-400"
              >
                Cargando...
              </button>
            ))
          ) : receptionMethods.length > 0 ? (
            receptionMethods.map((method) => {
              const id = Number(method.idMedioRecepcion);
              const seleccionado = Number(formData.medioRecepcion) === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={seleccionado}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, medioRecepcion: id }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.medioRecepcion;
                      return next;
                    });
                  }}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    seleccionado
                      ? "border-blue-900 bg-blue-100 shadow-md text-blue-900"
                      : "border-gray-300 hover:border-blue-900/50 bg-white text-gray-700"
                  }`}
                >
                  {method.nombreMedioRecepcion || method.nombre}
                </button>
              );
            })
          ) : (
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-[#6a7282]">No hay medios de recepción disponibles.</p>
            </div>
          )}
        </div>
        {(receptionMethodsError || errors.medioRecepcion) && (
          <p className="text-red-500 text-xs mt-2 ml-4">
            {errors.medioRecepcion || receptionMethodsError}
          </p>
        )}
      </div>

      {/* Información del Usuario */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-primary rounded-full"></div>
          Información del Usuario
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Datos del cliente, empresa o institución</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
          <div className="relative group md:col-span-2">
            <input
              type="text"
              name="nombreUsuario"
              value={formData.nombreUsuario}
              onChange={handleChange}
              placeholder="Nombre completo"
              className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.nombreUsuario ? 'border-red-500' : 'border-gray-300 focus:border-blue-900'
                } peer`}
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              Nombre del usuario <span className="text-red-500">*</span>
            </label>
            {errors.nombreUsuario && <p className="text-red-500 text-xs mt-1">{errors.nombreUsuario}</p>}
          </div>

          <div className="relative group md:col-span-2">
            <input
              type="text"
              name="direccionUsuario"
              value={formData.direccionUsuario}
              onChange={handleChange}
              placeholder="Dirección completa"
              className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.direccionUsuario ? 'border-red-500' : 'border-gray-300 focus:border-blue-900'
                } peer`}
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              Dirección <span className="text-red-500">*</span>
            </label>
            {errors.direccionUsuario && <p className="text-red-500 text-xs mt-1">{errors.direccionUsuario}</p>}
          </div>

          <div className="relative group">
            <input
              type="text"
              name="ruc"
              value={formData.ruc}
              onChange={handleChange}
              placeholder="RUC"
              className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              No. RUC
            </label>
          </div>

          <div className="relative group">
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="Cédula"
              className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              No. de cédula
            </label>
          </div>

          <div className="relative group md:col-span-2">
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.correo ? 'border-red-500' : 'border-gray-300 focus:border-blue-900'
                } peer`}
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
          </div>
        </div>
      </div>

      {/* Datos de Contacto */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-blue-900 rounded-full"></div>
          Datos de Contacto
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Información de contacto principal y secundario</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-4">
          <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-900">
            <p className="text-sm font-semibold text-blue-900 mb-4">Contacto 1 - Principal</p>
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  name="contacto1Nombre"
                  value={formData.contacto1Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del contacto"
                  className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
                />
                <label className="absolute left-0 -top-4 text-xs font-semibold text-gray-700 peer-focus:text-blue-900">Nombre</label>
              </div>
              <div className="relative group">
                <input
                  type="tel"
                  name="contacto1Telefono"
                  value={formData.contacto1Telefono}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
                />
                <label className="absolute left-0 -top-4 text-xs font-semibold text-gray-700 peer-focus:text-blue-900">Teléfono</label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-[#fbbf24]">
            <p className="text-sm font-semibold text-[#6a7282] mb-4">Contacto 2 - Secundario</p>
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  name="contacto2Nombre"
                  value={formData.contacto2Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del contacto"
                  className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
                />
                <label className="absolute left-0 -top-4 text-xs font-semibold text-gray-700 peer-focus:text-blue-900">Nombre</label>
              </div>
              <div className="relative group">
                <input
                  type="tel"
                  name="contacto2Telefono"
                  value={formData.contacto2Telefono}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
                />
                <label className="absolute left-0 -top-4 text-xs font-semibold text-gray-700 peer-focus:text-blue-900">Teléfono</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2 Component
  const renderStep2 = () => (
    <div className="space-y-10">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-blue-900 mb-2">Servicio Solicitado</h2>
        <p className="text-[#6a7282]">Seleccione el tipo de servicio y especifique los detalles</p>
      </div>

      {/* Service Type Selection */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-blue-900 rounded-full"></div>
          Servicio Solicitado <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-[#6a7282] mb-4 ml-4">Puede seleccionar más de uno</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-4">
          {loadingServiceTypes ? (
            [1, 2, 3, 4].map((i) => (
              <button
                key={i}
                type="button"
                disabled
                className="p-4 rounded-lg border-2 transition-all font-semibold border-gray-300 bg-white text-gray-400"
              >
                Cargando...
              </button>
            ))
          ) : serviceTypes.length > 0 ? (
            serviceTypes.map((service) => {
              const id = Number(service.idServicio);
              const seleccionados = Array.isArray(formData.tipoServicio) ? formData.tipoServicio : [];
              const seleccionado = seleccionados.some((x) => Number(x) === id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={seleccionado}
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
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    seleccionado
                      ? "border-blue-900 bg-blue-100 shadow-md text-blue-900"
                      : "border-gray-300 hover:border-blue-900/50 bg-white text-gray-700"
                  }`}
                >
                  {service.nombreServicio || service.nombre}
                </button>
              );
            })
          ) : (
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-[#6a7282]">No hay servicios disponibles.</p>
            </div>
          )}
        </div>
        {serviceTypesError && <p className="text-red-500 text-xs mt-2 ml-4">{serviceTypesError}</p>}
        {errors.tipoServicio && <p className="text-red-500 text-xs mt-2 ml-4">{errors.tipoServicio}</p>}
      </div>

      {/* Matrix Selection */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-accent rounded-full"></div>
          Matriz <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-[#6a7282] mb-4 ml-4">Seleccione y asigne muestras por matriz</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-4">
          {loadingMatrices ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border-2 bg-white text-gray-400">Cargando...</div>
            ))
          ) : matrices.length > 0 ? (
            matrices.map((matrix) => {
              const id = Number(matrix.idMatriz);
              const entry = (formData.matriz || []).find((m) => Number(m.idMatriz) === id);
              const count = entry?.numMuestras ?? 0;
              const isActive = count > 0;

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
                  className={`relative cursor-pointer rounded-xl border-2 p-4 text-left transition-all ${
                    isActive
                      ? "border-blue-900 bg-blue-50 shadow-sm"
                      : "border-gray-300 bg-white hover:border-blue-900/50"
                  }`}
                >
                  {count > 0 && (
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        {count}
                      </span>
                    </div>
                  )}
                  <div className="flex h-16 items-center justify-center">
                    <span className="font-semibold text-gray-800">
                      {matrix.nombreMatriz || matrix.nombre}
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
            <div className="col-span-2 md:col-span-3">
              <p className="text-sm text-[#6a7282]">No hay matrices disponibles.</p>
            </div>
          )}
        </div>

        <div className="mt-3 ml-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Total de muestras: {formData.numeroMuestras}</span>
        </div>

        {errorMatrices && <p className="text-red-500 text-xs mt-2 ml-4">{errorMatrices}</p>}
        {errors.matriz && <p className="text-red-500 text-xs mt-2 ml-4">{errors.matriz}</p>}
      </div>

      {/* Number of Samples */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-primary rounded-full"></div>
          Muestras
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Especifique la cantidad de muestras</p>

        <div className="ml-4 relative group max-w-xs">
          <input
            type="number"
            name="numeroMuestras"
            value={formData.numeroMuestras}
            readOnly
            placeholder="0"
            className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-gray-300 peer text-center font-semibold text-lg text-blue-900 cursor-not-allowed"
          />
          <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700">
            No. de muestras (Automático)
          </label>
        </div>
      </div>

      {/* Analysis Requested */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
              <div className="w-1 h-7 bg-accent rounded-full"></div>
              Análisis Solicitados
            </h3>
            <p className="text-sm text-[#6a7282] ml-4">Agregue los análisis requeridos</p>
          </div>
          <button
            type="button"
            onClick={handleAddAnalysis}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {formData.analisisSolicitados.length > 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden ml-4 mt-6">
            <table className="w-full">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tipo de Análisis</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Técnica</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.analisisSolicitados.map((analysis, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <select
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
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
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        readOnly
                        placeholder="Abreviatura del catálogo"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded bg-gray-50 text-gray-600"
                        value={analysis.tecnica}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveAnalysis(index)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ml-4 mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
            <p className="text-sm text-[#6a7282]">No hay análisis agregados. Haga clic en "Agregar" para añadir uno.</p>
          </div>
        )}
        {errors.analisisSolicitados && (
          <p className="mt-2 ml-4 text-xs text-red-600">{errors.analisisSolicitados}</p>
        )}
      </div>

      {/* Dirección escrita o GPS: basta con una de las dos. */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-primary rounded-full"></div>
          Ubicación de Muestreo <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-[#6a7282] mb-4 ml-4">
          Indique la dirección o marque el punto en el mapa (GPS)
        </p>

        <div className="ml-4 mb-4 flex overflow-hidden rounded-lg border-2 border-gray-200">
          <button
            type="button"
            onClick={() => {
              setFormData((p) => ({ ...p, modoUbicacion: "direccion" }));
              setErrors((p) => {
                const next = { ...p };
                delete next.ubicacionMuestreo;
                return next;
              });
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold ${
              formData.modoUbicacion === "direccion"
                ? "bg-blue-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Escribir dirección
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData((p) => ({ ...p, modoUbicacion: "gps" }));
              setErrors((p) => {
                const next = { ...p };
                delete next.ubicacionMuestreo;
                return next;
              });
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold ${
              formData.modoUbicacion === "gps"
                ? "bg-blue-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Marcar GPS en el mapa
          </button>
        </div>

        <div className="ml-4">
          {formData.modoUbicacion === "gps" ? (
            <div className="flex gap-2">
              <input
                className={`input cursor-pointer flex-1 ${errors.ubicacionMuestreo ? "border-red-400 ring-1 ring-red-400" : ""}`}
                readOnly
                placeholder="Marque el punto en el mapa"
                value={formData.coordenadasGps}
                onClick={() => setMapOpen(true)}
              />
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                onClick={() => setMapOpen(true)}
              >
                <MapPin className="h-4 w-4" />
                Mapa
              </button>
            </div>
          ) : (
            <textarea
              name="ubicacionMuestreo"
              value={formData.ubicacionMuestreo}
              onChange={handleChange}
              placeholder="Ej. Barrio X, frente a la iglesia, Managua"
              className={`w-full resize-none rounded-lg border-2 bg-transparent px-4 py-3 focus:border-blue-900 focus:outline-none ${
                errors.ubicacionMuestreo ? "border-red-400" : "border-gray-300"
              }`}
              rows={3}
            />
          )}
          {errors.ubicacionMuestreo && (
            <p className="mt-2 text-xs text-red-500">{errors.ubicacionMuestreo}</p>
          )}
        </div>
      </div>

      {/* Summary */}
      {( (Array.isArray(formData.tipoServicio) ? formData.tipoServicio.length > 0 : !!formData.tipoServicio)
        || (Array.isArray(formData.matriz) ? formData.matriz.length > 0 : !!formData.matriz)
        || formData.analisisSolicitados.length > 0) && (
        <div className="bg-blue-50 border-l-4 border-blue-900 p-6 rounded-lg">
          <p className="text-sm text-gray-700 font-semibold">
            Resumen: <span className="text-blue-900 font-bold">{selectedServiceLabels()}</span> |
            <span className="text-blue-900 font-bold"> {selectedMatrixLabels()}</span> |
            <span className="text-blue-900 font-bold"> {formData.analisisSolicitados.length} análisis agregado(s)</span>
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow">
          <FileCheck className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Observaciones y Confirmación</h2>
          <p className="text-sm text-[#6a7282]">Revise su solicitud y agregue comentarios adicionales</p>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-blue-900 bg-blue-50 p-6">
        <h3 className="mb-4 flex items-center gap-3 text-lg font-bold text-blue-900">
          <div className="h-7 w-1 rounded-full bg-blue-900" />
          Resumen de su Solicitud
        </h3>
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
          <div className="mt-5 overflow-hidden rounded-lg border border-blue-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-white text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Tipo de análisis</th>
                  <th className="px-4 py-2">Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formData.analisisSolicitados.map((analysis, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-gray-700">{analysis.tipoAnalisis || "—"}</td>
                    <td className="px-4 py-2 text-gray-700">{analysis.tecnica || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
            <div className="h-7 w-1 rounded-full bg-[#fbbf24]" />
            Observaciones
          </h3>
          <p className="mb-4 ml-4 text-sm text-[#6a7282]">Opcional · máximo 200 caracteres</p>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            maxLength={200}
            placeholder="Agregue cualquier observación, comentario o requerimiento especial para esta solicitud..."
            className="ml-4 w-[calc(100%-1rem)] resize-none rounded-lg border-2 border-gray-300 bg-white px-4 py-3 focus:border-blue-900 focus:outline-none"
            rows={5}
          />
          <p className="mt-1 ml-4 text-right text-xs text-gray-400">
            {String(formData.observaciones ?? "").length}/200
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
            <div className="h-7 w-1 rounded-full bg-blue-900" />
            Verificación Final
          </h3>
          <p className="mb-6 ml-4 text-sm text-[#6a7282]">Complete la información de verificación</p>
          <div className="ml-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="relative group">
              <select
                name="firma"
                value={formData.firma}
                onChange={handleChange}
                disabled={loadingUsuarios}
                className={`w-full border-b-2 bg-transparent px-0 py-3 focus:outline-none ${errors.firma ? "border-red-500" : "border-gray-300 focus:border-blue-900"}`}
              >
                <option value="">{loadingUsuarios ? "Cargando usuarios…" : "Seleccione un usuario"}</option>
                {usuarios.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {nombreUsuarioLista(u)}
                  </option>
                ))}
              </select>
              <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 group-focus-within:text-blue-900">
                Firma del usuario
              </label>
              {errors.firma && <p className="mt-1 text-xs text-red-500">{errors.firma}</p>}
            </div>
            <div className="relative group">
              <select
                name="recibidoPor"
                value={formData.recibidoPor}
                onChange={handleChange}
                disabled={loadingUsuarios}
                className={`w-full border-b-2 bg-transparent px-0 py-3 focus:outline-none ${errors.recibidoPor ? "border-red-500" : "border-gray-300 focus:border-blue-900"}`}
              >
                <option value="">{loadingUsuarios ? "Cargando usuarios…" : "Seleccione un usuario"}</option>
                {usuarios.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {nombreUsuarioLista(u)}
                  </option>
                ))}
              </select>
              <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 group-focus-within:text-blue-900">
                Solicitud recibida por
              </label>
              {errors.recibidoPor && <p className="mt-1 text-xs text-red-500">{errors.recibidoPor}</p>}
            </div>
            <div className="relative group sm:col-span-2">
              <input
                type="date"
                name="fechaProforma"
                value={formData.fechaProforma}
                onChange={handleChange}
                className="w-full border-b-2 border-gray-300 bg-transparent px-0 py-3 focus:border-blue-900 focus:outline-none"
              />
              <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 group-focus-within:text-blue-900">
                Fecha de envío de la proforma
              </label>
            </div>
          </div>
          <p className="mt-5 ml-4 text-xs text-[#6a7282]">
            Al seleccionar la firma acepta los términos y condiciones del servicio
          </p>
        </div>
      </div>
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

      <ConfirmDialog
        open={!!errorGuardado}
        title={isEdit ? "No se pudo actualizar la solicitud" : "No se pudo crear la solicitud"}
        message={errorGuardado}
        confirmText="Entendido"
        showCancel={false}
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => setErrorGuardado("")}
        onCancel={() => setErrorGuardado("")}
      />
    </div>
  );
}
