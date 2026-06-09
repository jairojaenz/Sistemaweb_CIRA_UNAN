import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileCheck, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";
import { ROUTES } from "../../../router/routes.js";
import { normalizeClienteFromApi } from "../../clientes/service/clienteService.js";
import { saveSolicitudServicioLocal } from "../service/solicitudServicioService.js";
import { mapClienteToSolicitudPrefill, nombreCompletoCliente } from "../utils/mapClienteToSolicitud.js";
import { getMediosRecepcion } from "../../catalogos/service/medioRecepcionService.js";
import { getServicios } from "../../catalogos/service/servicioService.js";
import { getMatrices } from "../../catalogos/service/matrizService.js";

function isClienteActivo(c) {
  return c?.activo !== false;
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
  ubicacionMuestreo: "",
  observaciones: "",
  firma: "",
  recibidoPor: "",
  fechaProforma: "",
  inicialesAnalista: "",
};

export default function SolicitudServicioPage() {
  const { addToast } = useToast();
  const { idCliente: idClienteParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const idCliente = idClienteParam ? Number(idClienteParam) : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ...initialFormData });

  const [errors, setErrors] = useState({});
  const [avisoClienteInactivo, setAvisoClienteInactivo] = useState(false);

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

  // Medios de recepción (desde API)
  const [receptionMethods, setReceptionMethods] = useState([]);
  const [loadingReceptionMethods, setLoadingReceptionMethods] = useState(false);
  const [receptionMethodsError, setReceptionMethodsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadMedios() {
      setLoadingReceptionMethods(true);
      setReceptionMethodsError(null);
      try {
        const data = await getMediosRecepcion();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        const normalized = list.map((m) => ({
          id: m.idMedioRecepcion ?? m.id ?? m.value ?? m.codigo ?? m.nombreMedioRecepcion ?? m.nombre ?? m.label,
          label: m.nombreMedioRecepcion ?? m.nombre ?? m.label ?? String(m.idMedioRecepcion ?? m.id ?? ""),
        }));
        setReceptionMethods(normalized);
      } catch (err) {
        if (!mounted) return;
        setReceptionMethodsError("No se pudo cargar los medios de recepción");
      } finally {
        if (!mounted) return;
        setLoadingReceptionMethods(false);
      }
    }
    loadMedios();
    return () => {
      mounted = false;
    };
  }, []);

  // Tipos de servicio (desde API)
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
  const [serviceTypesError, setServiceTypesError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadServicios() {
      setLoadingServiceTypes(true);
      setServiceTypesError(null);
      try {
        const data = await getServicios();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        const normalized = list.map((s) => ({
          id: s.idServicio ?? s.id ?? s.value ?? s.codigo ?? s.nombreServicio ?? s.nombre ?? s.label,
          label: s.nombreServicio ?? s.nombre ?? s.label ?? String(s.idServicio ?? s.id ?? ""),
        }));
        setServiceTypes(normalized);
      } catch (err) {
        if (!mounted) return;
        setServiceTypesError("No se pudo cargar los tipos de servicio");
      } finally {
        if (!mounted) return;
        setLoadingServiceTypes(false);
      }
    }
    loadServicios();
    return () => { mounted = false; };
  }, []);

  // Matrices (desde API)
  const [matrices, setMatrices] = useState([]);
  const [loadingMatrices, setLoadingMatrices] = useState(false);
  const [errorMatrices, setErrorMatrices] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadMatrices() {
      setLoadingMatrices(true);
      setErrorMatrices(null);
      try {
        const data = await getMatrices();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        const normalized = list.map((m) => ({
          id: m.idMatriz ?? m.id ?? m.value ?? m.codigo ?? m.nombreMatriz ?? m.nombre ?? m.label,
          label: m.nombreMatriz ?? m.nombre ?? m.label ?? String(m.idMatriz ?? m.id ?? ""),
        }));
        setMatrices(normalized);
      } catch (err) {
        if (!mounted) return;
        setErrorMatrices('No se pudo cargar las matrices');
      } finally {
        if (!mounted) return;
        setLoadingMatrices(false);
      }
    }
    loadMatrices();
    return () => { mounted = false; };
  }, []);

  // Auto-sync numeroMuestras with sum of matriz[].numMuestras
  useEffect(() => {
    const total = Array.isArray(formData.matriz)
      ? formData.matriz.reduce((sum, m) => sum + (m.numMuestras || 0), 0)
      : 0;
    setFormData(prev => ({ ...prev, numeroMuestras: total }));
  }, [formData.matriz]);

  function selectedServiceLabels() {
    const ids = Array.isArray(formData.tipoServicio) ? formData.tipoServicio : (formData.tipoServicio ? [formData.tipoServicio] : []);
    if (!ids || ids.length === 0) return 'No especificado';
    return ids.map(id => (serviceTypes.find(s => s.id === id)?.label || id)).join(', ');
  }
  function selectedMatrixLabels() {
    const entries = Array.isArray(formData.matriz) ? formData.matriz : (formData.matriz ? [formData.matriz] : []);
    if (!entries || entries.length === 0) return 'No especificada';
    return entries.map(e => {
      const label = matrices.find(m => m.id === e.idMatriz)?.label || e.idMatriz;
      return `${label} (${e.numMuestras})`;
    }).join(', ');
  }

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nombreUsuario?.trim()) newErrors.nombreUsuario = 'Campo requerido';
      if (!formData.direccionUsuario?.trim()) newErrors.direccionUsuario = 'Campo requerido';
      if (!formData.correo?.trim()) newErrors.correo = 'Campo requerido';
    }

    if (step === 2) {
      if (!formData.tipoServicio || (Array.isArray(formData.tipoServicio) && formData.tipoServicio.length === 0)) newErrors.tipoServicio = 'Seleccione al menos un servicio';
      if (!formData.matriz || !Array.isArray(formData.matriz) || formData.matriz.length === 0) newErrors.matriz = 'Seleccione al menos una matriz';
    }

    if (step === 3) {
      if (!formData.firma?.trim()) newErrors.firma = 'Campo requerido';
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
      analisisSolicitados: [...prev.analisisSolicitados, { tipoAnalisis: '', tecnica: '' }],
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

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    const ok = saveSolicitudServicioLocal({
      ...formData,
      idCliente: idCliente && !Number.isNaN(idCliente) ? idCliente : undefined,
    });
    if (ok) {
      addToast("Solicitud guardada correctamente.", "success");
    } else {
      addToast("No se pudo guardar la solicitud.", "error");
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
            receptionMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, medioRecepcion: method.id }))}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${formData.medioRecepcion === method.id
                  ? 'border-blue-900 bg-blue-100 shadow-md text-blue-900'
                  : 'border-gray-300 hover:border-blue-900/50 bg-white text-gray-700'
                  }`}
              >
                {method.label}
              </button>
            ))
          ) : (
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-[#6a7282]">No hay medios de recepción disponibles.</p>
            </div>
          )}
        </div>
        {receptionMethodsError && <p className="text-red-500 text-xs mt-2 ml-4">{receptionMethodsError}</p>}
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
      <div className="bg-gray-50 p-6 rounded-lg">
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
        <p className="text-sm text-[#6a7282] mb-4 ml-4">Seleccione solo 1</p>

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
              const isSelected = Array.isArray(formData.tipoServicio)
                ? formData.tipoServicio.includes(service.id)
                : formData.tipoServicio === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setFormData(prev => {
                    const current = Array.isArray(prev.tipoServicio) ? prev.tipoServicio : (prev.tipoServicio ? [prev.tipoServicio] : []);
                    const exists = current.includes(service.id);
                    const next = exists ? current.filter(i => i !== service.id) : [...current, service.id];
                    return { ...prev, tipoServicio: next };
                  })}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${isSelected
                    ? 'border-blue-900 bg-blue-100 shadow-md text-blue-900'
                    : 'border-gray-300 hover:border-blue-900/50 bg-white text-gray-700'
                    }`}
                >
                  {service.label}
                </button>
              );
            })
          ) : (
            <div className="col-span-2 md:col-span-4">
              <p className="text-sm text-[#6a7282]">No hay tipos de servicio disponibles.</p>
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
            [1,2,3,4].map(i => (
              <div key={i} className="p-4 rounded-lg border-2 bg-white text-gray-400">Cargando...</div>
            ))
          ) : matrices.length > 0 ? (
            matrices.map(matrix => {
              const entry = (formData.matriz || []).find(m => m.idMatriz === matrix.id);
              const count = entry?.numMuestras ?? 0;
              const isActive = count > 0;
              return (
                <div
                  key={matrix.id}
                  onClick={() => {
                    const id = matrix.id;
                    setFormData(prev => {
                      const arr = Array.isArray(prev.matriz) ? [...prev.matriz] : [];
                      const idx = arr.findIndex(x => x.idMatriz === id);
                      if (idx >= 0) {
                        arr[idx] = { ...arr[idx], numMuestras: arr[idx].numMuestras + 1 };
                      } else {
                        arr.push({ idMatriz: id, numMuestras: 1 });
                      }
                      return { ...prev, matriz: arr };
                    });
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                    isActive ? 'border-blue-900 bg-blue-50 shadow-sm' : 'border-gray-300 bg-white hover:border-blue-900/50'
                  }`}
                >
                  {count > 0 && (
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{count}</span>
                    </div>
                  )}
                  <div className="flex h-16 items-center justify-center">
                    <span className="font-semibold text-gray-800">{matrix.label}</span>
                  </div>
                  {count > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = matrix.id;
                          setFormData(prev => {
                            const arr = Array.isArray(prev.matriz) ? [...prev.matriz] : [];
                            const idx = arr.findIndex(x => x.idMatriz === id);
                            if (idx >= 0) {
                              const current = arr[idx].numMuestras;
                              if (current <= 1) {
                                arr.splice(idx, 1);
                              } else {
                                arr[idx] = { ...arr[idx], numMuestras: current - 1 };
                              }
                            }
                            return { ...prev, matriz: arr };
                          });
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100"
                      >
                        -
                      </button>
                      <div className="min-w-8 rounded-full bg-slate-100 px-3 py-1 text-center text-sm font-semibold text-slate-700">{count}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = matrix.id;
                          setFormData(prev => {
                            const arr = Array.isArray(prev.matriz) ? [...prev.matriz] : [];
                            const idx = arr.findIndex(x => x.idMatriz === id);
                            if (idx >= 0) {
                              arr[idx] = { ...arr[idx], numMuestras: arr[idx].numMuestras + 1 };
                            } else {
                              arr.push({ idMatriz: id, numMuestras: 1 });
                            }
                            return { ...prev, matriz: arr };
                          });
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
                      <input
                        type="text"
                        placeholder="Ej: Sólidos Suspendidos Totales"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        value={analysis.tipoAnalisis}
                        onChange={(e) => handleAnalysisChange(index, 'tipoAnalisis', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Ej: Gravimetría"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        value={analysis.tecnica}
                        onChange={(e) => handleAnalysisChange(index, 'tecnica', e.target.value)}
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
      </div>

      {/* Sampling Location */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-primary rounded-full"></div>
          Ubicación de Muestreo
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Dirección y/o coordenadas de los puntos</p>

        <div className="ml-4">
          <textarea
            name="ubicacionMuestreo"
            value={formData.ubicacionMuestreo}
            onChange={handleChange}
            placeholder="Especifique la ubicación exacta donde se realizará el muestreo..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-transparent focus:outline-none focus:border-blue-900 transition-colors resize-none"
            rows={4}
          />
          <p className="mt-2 text-xs text-[#6a7282]">Incluya coordenadas GPS si están disponibles (formato: Latitud, Longitud)</p>
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
    <div className="space-y-10">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-lg">
          <FileCheck className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900 mb-2">Observaciones y Confirmación</h2>
        <p className="text-[#6a7282]">Revise su solicitud y agregue comentarios adicionales</p>
      </div>

      {/* Observations */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-[#fbbf24] rounded-full"></div>
          Observaciones
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Opcional</p>

        <div className="ml-4">
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            placeholder="Agregue cualquier observación, comentario o requerimiento especial para esta solicitud..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-transparent focus:outline-none focus:border-blue-900 transition-colors resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-blue-50 border-l-4 border-blue-900 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-4">Resumen de su Solicitud</h3>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">INFORMACIÓN DEL SOLICITANTE</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Solicitud No.</p>
                <p className="font-semibold text-gray-800">{formData.solicitudNo || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Correo</p>
                <p className="font-semibold text-gray-800">{formData.correo || 'No especificado'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 text-xs mb-1">Nombre</p>
                <p className="font-semibold text-gray-800">{formData.nombreUsuario || 'No especificado'}</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-300" />

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">SERVICIO SOLICITADO</h4>
            <div>
              <p className="text-gray-500 text-xs mb-1">Tipo de servicio</p>
              <p className="font-semibold text-gray-800">{selectedServiceLabels()}</p>
            </div>
            <div className="mt-3">
              <p className="text-gray-500 text-xs mb-1">Matriz</p>
              <p className="font-semibold text-gray-800">{selectedMatrixLabels()}</p>
            </div>

            {formData.analisisSolicitados.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-500 text-xs mb-2">Análisis solicitados:</p>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Tipo de Análisis</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Técnica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.analisisSolicitados.map((analysis, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-gray-700">{analysis.tipoAnalisis || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{analysis.tecnica || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Digital Signature */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-primary rounded-full"></div>
          Verificación Final
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Complete la información de verificación</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
          <div className="relative group">
            <input
              type="text"
              name="firma"
              value={formData.firma}
              onChange={handleChange}
              placeholder="Nombre completo como firma digital"
              className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.firma ? 'border-red-500' : 'border-gray-300 focus:border-blue-900'
                } peer`}
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              Firma del usuario
            </label>
            {errors.firma && <p className="text-red-500 text-xs mt-1">{errors.firma}</p>}
          </div>

          <div className="relative group">
            <input
              type="text"
              name="recibidoPor"
              value={formData.recibidoPor}
              onChange={handleChange}
              placeholder="Nombre del funcionario"
              className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              Solicitud recibida por
            </label>
          </div>

          <div className="relative group">
            <input
              type="date"
              name="fechaProforma"
              value={formData.fechaProforma}
              onChange={handleChange}
              className="w-full px-0 py-3 border-b-2 bg-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:text-blue-900">
              Fecha de envío de la proforma
            </label>
          </div>

          <div className="relative group">
            <input
              type="text"
              name="inicialesAnalista"
              value={formData.inicialesAnalista}
              onChange={handleChange}
              placeholder="Ej: ABC"
              className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors border-gray-300 focus:border-blue-900 peer uppercase"
            />
            <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all peer-focus:-top-4 peer-focus:text-blue-900">
              Iniciales del Analista
            </label>
          </div>
        </div>

        <p className="mt-4 ml-4 text-xs text-[#6a7282]">Al ingresar su firma acepta los términos y condiciones del servicio</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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

      <div className="max-w-5xl mx-auto px-6 py-12">
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

          <div className="bg-gray-50 px-8 md:px-10 py-6 border-t border-gray-200 flex justify-center items-center gap-3">
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

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-8 py-6 md:px-10">
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
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-blue-950 hover:shadow-lg"
              >
                Guardar
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          <p>© 2026 UNAN Managua - CIRA | Sistema de Gestión de Ingreso de Muestras Ambientales SGIMA</p>
        </div>
      </div>

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
    </div>
  );
}
