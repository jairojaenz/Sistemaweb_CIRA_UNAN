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
  tipoServicio: "",
  matriz: "",
  matrizOtra: "",
  numeroMuestras: "",
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
    setFormData((prev) => ({ ...prev, ...prefill }));
  }, [idCliente, clienteDesdeNavegacion]);

  function cerrarAvisoInactivo() {
    setAvisoClienteInactivo(false);
    navigate(ROUTES.gestionClientes);
  }

  // Constants
  const receptionMethods = [
    { id: 'phone', label: 'Vía telefónica' },
    { id: 'email', label: 'Vía correo electrónico' },
    { id: 'personal', label: 'Personal' },
    { id: 'whatsapp', label: 'WhatsApp' },
  ];

  const serviceTypes = [
    { id: 'analisis', label: 'Análisis' },
    { id: 'muestreo', label: 'Muestreo' },
    { id: 'informe', label: 'Informe Técnico' },
    { id: 'medicion', label: 'Medición in situ' },
  ];

  const matrices = [
    { id: 'agua-natural', label: 'Agua Natural' },
    { id: 'agua-residual', label: 'Agua Residual' },
    { id: 'lodo', label: 'Lodo' },
    { id: 'sedimento', label: 'Sedimento' },
    { id: 'suelo', label: 'Suelo' },
    { id: 'otro', label: 'Otro' },
  ];

  // Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.nombreUsuario?.trim()) newErrors.nombreUsuario = 'Campo requerido';
      if (!formData.direccionUsuario?.trim()) newErrors.direccionUsuario = 'Campo requerido';
      if (!formData.correo?.trim()) newErrors.correo = 'Campo requerido';
    }

    if (step === 2) {
      if (!formData.tipoServicio) newErrors.tipoServicio = 'Seleccione un servicio';
      if (!formData.matriz) newErrors.matriz = 'Seleccione una matriz';
      if (formData.matriz === 'otro' && !formData.matrizOtra?.trim()) {
        newErrors.matrizOtra = 'Especifique la matriz';
      }
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
          <div className="w-1 h-7 bg-[#fbbf24] rounded-full"></div>
          Medio de recepción
        </h3>
        <p className="text-sm text-[#6a7282] mb-4 ml-4">Seleccione solo 1</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-4">
          {receptionMethods.map(method => (
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
          ))}
        </div>
      </div>

      {/* Información del Usuario */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-[#10b981] rounded-full"></div>
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
          {serviceTypes.map(service => (
            <button
              key={service.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tipoServicio: service.id }))}
              className={`p-4 rounded-lg border-2 transition-all font-semibold ${formData.tipoServicio === service.id
                ? 'border-blue-900 bg-blue-100 shadow-md text-blue-900'
                : 'border-gray-300 hover:border-blue-900/50 bg-white text-gray-700'
                }`}
            >
              {service.label}
            </button>
          ))}
        </div>
        {errors.tipoServicio && <p className="text-red-500 text-xs mt-2 ml-4">{errors.tipoServicio}</p>}
      </div>

      {/* Matrix Selection */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-[#fbbf24] rounded-full"></div>
          Matriz <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-[#6a7282] mb-4 ml-4">Seleccione solo 1</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-4">
          {matrices.map(matrix => (
            <button
              key={matrix.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, matriz: matrix.id }))}
              className={`p-4 rounded-lg border-2 transition-all font-semibold ${formData.matriz === matrix.id
                ? 'border-blue-900 bg-blue-100 shadow-md text-blue-900'
                : 'border-gray-300 hover:border-blue-900/50 bg-white text-gray-700'
                }`}
            >
              {matrix.label}
            </button>
          ))}
        </div>
        {errors.matriz && <p className="text-red-500 text-xs mt-2 ml-4">{errors.matriz}</p>}

        {formData.matriz === 'otro' && (
          <div className="mt-6 ml-4 relative group">
            <input
              type="text"
              name="matrizOtra"
              value={formData.matrizOtra}
              onChange={handleChange}
              placeholder="Especifique la matriz"
              className={`w-full md:w-96 px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none ${errors.matrizOtra ? 'border-red-500' : 'border-gray-300 focus:border-blue-900'
                } peer`}
            />
            <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700 peer-focus:text-blue-900">
              Especifique la matriz
            </label>
            {errors.matrizOtra && <p className="text-red-500 text-xs mt-1">{errors.matrizOtra}</p>}
          </div>
        )}
      </div>

      {/* Number of Samples */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
          <div className="w-1 h-7 bg-[#10b981] rounded-full"></div>
          Muestras
        </h3>
        <p className="text-sm text-[#6a7282] mb-6 ml-4">Especifique la cantidad de muestras</p>

        <div className="ml-4 relative group max-w-xs">
          <input
            type="number"
            name="numeroMuestras"
            value={formData.numeroMuestras}
            onChange={handleChange}
            placeholder="0"
            className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-gray-300 focus:border-blue-900 peer text-center font-semibold text-lg"
          />
          <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700 peer-focus:text-blue-900">
            No. de muestras
          </label>
        </div>
      </div>

      {/* Analysis Requested */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-3">
              <div className="w-1 h-7 bg-blue-900 rounded-full"></div>
              Análisis Solicitados
            </h3>
            <p className="text-sm text-[#6a7282] ml-4">Agregue los análisis requeridos</p>
          </div>
          <button
            type="button"
            onClick={handleAddAnalysis}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all shadow-md hover:shadow-lg font-semibold"
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
          <div className="w-1 h-7 bg-[#fbbf24] rounded-full"></div>
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
      {(formData.tipoServicio || formData.matriz || formData.analisisSolicitados.length > 0) && (
        <div className="bg-blue-50 border-l-4 border-blue-900 p-6 rounded-lg">
          <p className="text-sm text-gray-700 font-semibold">
            Resumen: <span className="text-blue-900 font-bold">{formData.tipoServicio || 'No especificado'}</span> |
            <span className="text-blue-900 font-bold"> {formData.matriz || 'No especificada'}</span> |
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
              <p className="font-semibold text-gray-800">{formData.tipoServicio || 'No especificado'}</p>
            </div>
            <div className="mt-3">
              <p className="text-gray-500 text-xs mb-1">Matriz</p>
              <p className="font-semibold text-gray-800">{formData.matriz || 'No especificada'}</p>
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
          <div className="w-1 h-7 bg-[#10b981] rounded-full"></div>
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

      {/* Success Message */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div>
            <p className="text-sm font-bold text-green-800 mb-1">¡Casi listo!</p>
            <p className="text-sm text-gray-700">Verifique que toda la información sea correcta y haga clic en "Guarda" para completar su solicitud de servicio.</p>
          </div>
        </div>
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
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
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
