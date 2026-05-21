'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const fuentesPorMatriz = {
  'agua-natural': ['Río', 'Lago', 'Mar', 'Pozo excavado', 'Pozo perforado', 'Manantial', 'Estero', 'Lluvia', 'Otro'],
  'agua-potable': ['Agua Envasada', 'Tanque de almacenamiento', 'Grifo', 'Otro'],
  'agua-residual': ['Industrial', 'Doméstica', 'Industrial tratada', 'Doméstica tratada', 'Cisterna', 'Otro'],
  suelo: ['Uso agrícola', 'Uso forestal', 'Uso pecuario', 'Natural', 'Otro'],
  sedimento: ['Marino', 'Lacustre', 'Fluvial', 'Residual', 'Otro'],
  lodos: ['Primarios', 'Secundarios', 'Otro'],
};

export default function FormWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    usuario: '',
    identificacion: '',
    lugar: '',
    comunidad: '',
    departamento: '',
    municipio: '',
    elevacion: '',
    coordenadasN: '',
    coordenadasE: '',
    fecha: '',
    hora: '',
    ensayos: [],
    ensayoTipoTemp: '',
    ensayoTecnicaTemp: '',
    matriz: '',
    matrizOtra: '',
    fuente: '',
    fuenteOtra: '',
    temperatura: '',
    ph: '',
    conductividad: '',
    potencialRedox: '',
    cloroResidual: '',
    salinidad: '',
    oxigenoDisuelto: '',
    satOxigeno: '',
    tipoMuestreo: '',
    compuestoHoras: '',
    tipoMuestreoOtro: '',
    equipos: '',
    quienTomaMuestra: '',
    instructivoCliente: '',
    instructivoClienteOtro: '',
    procedimientoCIRA: '',
    procedimientoCIRAOtro: '',
    observaciones: '',
    muestraCapturadaPor: '',
    verificacionFecha: '',
    inicialesAnalista: '',
    codigoMuestra: '',
  });

  const [errors, setErrors] = useState({});

  const requiredFields = {
    usuario: true,
    identificacion: true,
    lugar: true,
    departamento: true,
    municipio: true,
    fecha: true,
    hora: true,
    ensayos: true,
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      Object.keys(requiredFields).forEach((field) => {
        if (field === 'ensayos') {
          if (!Array.isArray(formData.ensayos) || formData.ensayos.length === 0) {
            newErrors[field] = 'Agregue al menos un ensayo';
          }
        } else if (field !== 'ensayos' && !formData[field]?.toString().trim()) {
          newErrors[field] = 'Campo requerido';
        }
      });
    }

    if (step === 2) {
      if (!formData.matriz) newErrors.matriz = 'Seleccione una matriz';
      if (!formData.fuente) newErrors.fuente = 'Seleccione una fuente';
      if (!formData.tipoMuestreo) newErrors.tipoMuestreo = 'Seleccione un tipo de muestreo';
      if (!formData.equipos.trim()) newErrors.equipos = 'Especifique los equipos utilizados';
    }

    if (step === 3) {
      if (!formData.quienTomaMuestra) newErrors.quienTomaMuestra = 'Seleccione quién tomó la muestra';
      if (formData.quienTomaMuestra === 'cliente' && !formData.instructivoCliente) {
        newErrors.instructivoCliente = 'Seleccione un instructivo';
      }
      if (formData.quienTomaMuestra === 'tecnico' && !formData.procedimientoCIRA) {
        newErrors.procedimientoCIRA = 'Seleccione un procedimiento';
      }
      if (!formData.muestraCapturadaPor.trim()) newErrors.muestraCapturadaPor = 'Campo requerido';
      if (!formData.verificacionFecha.trim()) newErrors.verificacionFecha = 'Campo requerido';
      if (!formData.inicialesAnalista.trim()) newErrors.inicialesAnalista = 'Campo requerido';
      if (!formData.codigoMuestra.trim()) newErrors.codigoMuestra = 'Campo requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const isTextOnlyField = (fieldName) => {
    const textOnlyFields = ['usuario', 'identificacion', 'lugar', 'comunidad', 'departamento', 'municipio', 'matrizOtra', 'fuenteOtra', 'tipoMuestreoOtro', 'instructivoClienteOtro', 'procedimientoCIRAOtro', 'muestraCapturadaPor', 'verificacionFecha', 'inicialesAnalista'];
    return textOnlyFields.includes(fieldName);
  };

  const isNumberOnlyField = (fieldName) => {
    const numberOnlyFields = ['elevacion', 'coordenadasN', 'coordenadasE', 'temperatura', 'ph', 'conductividad', 'potencialRedox', 'cloroResidual', 'salinidad', 'oxigenoDisuelto', 'satOxigeno'];
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
    if (formData.ensayoTipoTemp.trim() && formData.ensayoTecnicaTemp.trim()) {
      setFormData((prev) => ({
        ...prev,
        ensayos: [...prev.ensayos, { tipoAnalisis: prev.ensayoTipoTemp, tecnica: prev.ensayoTecnicaTemp }],
        ensayoTipoTemp: '',
        ensayoTecnicaTemp: '',
      }));
    }
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

  const handleSubmit = () => {
    if (validateStep(3)) {
      console.log('Formulario completado:', formData);
      alert('Formulario enviado exitosamente. Datos guardados en la consola.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      
      {/* Header 
      <header className="bg-blue-900 text-white py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <img
            src="/logo-cira.png"
            alt="Logo CIRA - Centro de Investigación de Recursos Acuáticos"
            className="h-16 mb-2 md:mb-0"
          />
          <div className="text-center">
            <h2 className="text-xl font-bold">INFORMACIÓN DE CAMPO DE MUESTRAS</h2>
            <p className="text-sm">FOR-CIRA-ATACC-27 V5 — UNAN Managua / CIRA</p>
          </div>
        </div>
      </header> */}

      {/* Subencabezado */}
      <div className="bg-yellow-400 text-blue-900 text-center py-2 font-semibold">
        ÁREA TÉCNICA, ASEGURAMIENTO Y CONTROL DE LA CALIDAD
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Step Indicator - Top */}
        <div className="mb-12">
          <div className="flex justify-between items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-md ${
                    step < currentStep
                      ? 'bg-yellow-400 text-white'
                      : step === currentStep
                        ? 'bg-primary text-white ring-4 ring-blue-200'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                <p className={`text-sm font-semibold mt-3 text-center ${step === currentStep ? 'text-primary' : 'text-gray-600'}`}>
                  Paso {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Step 1: Información de la Muestra */}
          {currentStep === 1 && (
            <div className="p-8 md:p-10 space-y-10">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">Información de la Muestra</h2>
                <p className="text-gray-600">Complete los datos de identificación y ubicación de la muestra</p>
              </div>

              {/* Datos principales */}
              <div>
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-primary rounded-full"></div>
                  Datos principales
                </h3>
                <p className="text-sm text-gray-500 mb-6 ml-4">Información básica de la muestra</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
                  <div className="relative group">
                    <input
                      type="text"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleChange}
                      placeholder="Nombre del usuario"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.usuario
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Usuario <span className="text-red-500">*</span>
                    </label>
                    {errors.usuario && <p className="text-red-500 text-xs mt-1">{errors.usuario}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="identificacion"
                      value={formData.identificacion}
                      onChange={handleChange}
                      placeholder="Ej: #1, M-001"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.identificacion
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Identificación de la Muestra <span className="text-red-500">*</span>
                    </label>
                    {errors.identificacion && <p className="text-red-500 text-xs mt-1">{errors.identificacion}</p>}
                  </div>
                </div>
              </div>

              {/* Ubicación Geográfica */}
              <div>
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-accent rounded-full"></div>
                  Ubicación Geográfica
                </h3>
                <p className="text-sm text-gray-500 mb-6 ml-4">Especifique la localización del sitio de muestreo</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
                  <div className="relative group">
                    <input
                      type="text"
                      name="lugar"
                      value={formData.lugar}
                      onChange={handleChange}
                      placeholder="Nombre del lugar"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.lugar
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Lugar <span className="text-red-500">*</span>
                    </label>
                    {errors.lugar && <p className="text-red-500 text-xs mt-1">{errors.lugar}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="comunidad"
                      value={formData.comunidad}
                      onChange={handleChange}
                      placeholder="Nombre de la comunidad"
                      className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-border focus:border-primary transition-colors"
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Comunidad
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                      placeholder="Buscar departamento..."
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.departamento
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    {errors.departamento && <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="municipio"
                      value={formData.municipio}
                      onChange={handleChange}
                      placeholder="Seleccione un departamento primero"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${errors.municipio
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Municipio <span className="text-red-500">*</span>
                    </label>
                    {errors.municipio && <p className="text-red-500 text-xs mt-1">{errors.municipio}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="elevacion"
                      value={formData.elevacion}
                      onChange={handleChange}
                      placeholder="Metros sobre el nivel del mar"
                      className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-border focus:border-primary transition-colors"
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Elevación (msnm)
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="coordenadasN"
                      value={formData.coordenadasN}
                      onChange={handleChange}
                      placeholder="Ej: 1354321"
                      className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-border focus:border-primary transition-colors"
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Coordenadas N (Norte)
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="coordenadasE"
                      value={formData.coordenadasE}
                      onChange={handleChange}
                      placeholder="Ej: 567890"
                      className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-border focus:border-primary transition-colors"
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Coordenadas E (Este)
                    </label>
                  </div>
                </div>
              </div>

              {/* Muestreo */}
              <div>
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-primary rounded-full"></div>
                  Muestreo
                </h3>
                <p className="text-sm text-gray-500 mb-6 ml-4">Información técnica del proceso de muestreo</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
                  <div className="relative group">
                    <input
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      className={`w-full px-0 py-3 border-b-2 bg-transparent focus:outline-none transition-colors ${errors.fecha
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Fecha de toma de muestra <span className="text-red-500">*</span>
                    </label>
                    {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="time"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                      className={`w-full px-0 py-3 border-b-2 bg-transparent focus:outline-none transition-colors ${errors.hora
                        ? 'border-red-500 text-red-600'
                        : 'border-border focus:border-primary'
                        }`}
                    />
                    <label className="absolute left-0 -top-4 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-6 group-focus-within:text-primary">
                      Hora de toma de muestra <span className="text-red-500">*</span>
                    </label>
                    {errors.hora && <p className="text-red-500 text-xs mt-1">{errors.hora}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                            <div className="w-1 h-7 bg-primary rounded-full"></div>
                            Ensayos Solicitados
                          </h3>
                          <p className="text-sm text-gray-500 ml-4">Agregue los análisis requeridos</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddEnsayo}
                          disabled={!formData.ensayoTipoTemp.trim() || !formData.ensayoTecnicaTemp.trim()}
                          className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 ml-4">
                        <div className="relative group">
                          <input
                            type="text"
                            name="ensayoTipoTemp"
                            value={formData.ensayoTipoTemp}
                            onChange={handleChange}
                            placeholder="Ej: pH"
                            className="w-full px-4 py-2 border-2 border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                          />
                          <label className="absolute left-4 -top-2.5 text-xs font-semibold text-gray-700 bg-gray-50 px-1">
                            Tipo de Análisis
                          </label>
                        </div>
                        <div className="relative group">
                          <input
                            type="text"
                            name="ensayoTecnicaTemp"
                            value={formData.ensayoTecnicaTemp}
                            onChange={handleChange}
                            placeholder="Ej: Potenciometría"
                            className="w-full px-4 py-2 border-2 border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                          />
                          <label className="absolute left-4 -top-2.5 text-xs font-semibold text-gray-700 bg-gray-50 px-1">
                            Técnica
                          </label>
                        </div>
                      </div>

                      {formData.ensayos.length > 0 ? (
                        <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden ml-4 mt-6">
                          <table className="w-full">
                            <thead className="bg-primary text-white">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tipo de Análisis</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">Técnica</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {formData.ensayos.map((ensayo, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      placeholder="Tipo de análisis"
                                      className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                      value={ensayo.tipoAnalisis}
                                      onChange={(e) => handleEnsayoChange(index, 'tipoAnalisis', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      placeholder="Técnica"
                                      className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                      value={ensayo.tecnica}
                                      onChange={(e) => handleEnsayoChange(index, 'tecnica', e.target.value)}
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEnsayo(index)}
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
                          <p className="text-sm text-gray-600">No hay ensayos agregados. Complete los campos y haga clic en "Agregar".</p>
                        </div>
                      )}

                      {errors.ensayos && <p className="text-red-500 text-xs mt-3 ml-4">{errors.ensayos}</p>}
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-primary rounded-full"></div>
                  Matriz <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4 ml-4">Seleccione solo 1</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-4">
                  {[
                    { value: 'agua-natural', label: 'Agua Natural' },
                    { value: 'agua-potable', label: 'Agua Potable' },
                    { value: 'agua-residual', label: 'Agua Residual' },
                    { value: 'suelo', label: 'Suelo' },
                    { value: 'sedimento', label: 'Sedimento' },
                    { value: 'lodos', label: 'Lodos' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, matriz: option.value, matrizOtra: '' }));
                        if (errors.matriz) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.matriz;
                            return newErrors;
                          });
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all font-semibold ${formData.matriz === option.value
                        ? 'border-primary bg-blue-100 shadow-md text-primary'
                        : 'border-border hover:border-primary/50 bg-white text-foreground'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, matriz: 'otro' }));
                      if (errors.matriz) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.matriz;
                          return newErrors;
                        });
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all font-semibold ${formData.matriz === 'otro'
                      ? 'border-primary bg-blue-100 shadow-md text-primary'
                      : 'border-border hover:border-primary/50 bg-white text-foreground'
                      }`}
                  >
                    Otro
                  </button>
                </div>

                {formData.matriz === 'otro' && (
                  <div className="mt-6 ml-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="relative group">
                      <input
                        type="text"
                        name="matrizOtra"
                        value={formData.matrizOtra}
                        onChange={handleChange}
                        placeholder="Especifique la matriz"
                        className="w-full md:w-96 px-4 py-2 border border-border rounded-lg bg-white placeholder-transparent focus:outline-none focus:border-primary transition-colors"
                      />
                      <label className="absolute left-4 -top-2.5 text-xs font-semibold text-gray-700 bg-blue-50 px-1">
                        Especifique la matriz
                      </label>
                    </div>
                  </div>
                )}

                {errors.matriz && <p className="text-red-500 text-xs mt-2 ml-4">{errors.matriz}</p>}
              </div>

              {/* FUENTE */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-accent rounded-full"></div>
                  Fuente <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4 ml-4">Seleccione solo 1</p>

                {!formData.matriz ? (
                  <div className="ml-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600">Primero debe seleccionar una matriz</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-4">
                    {fuentesPorMatriz[formData.matriz]?.map((fuente) => {
                      const fuenteValue = fuente.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <button
                          key={fuenteValue}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, fuente: fuenteValue, fuenteOtra: '' }));
                            if (errors.fuente) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.fuente;
                                return newErrors;
                              });
                            }
                          }}
                          className={`p-3 rounded-lg border-2 transition-all font-semibold ${formData.fuente === fuenteValue
                            ? 'border-primary bg-blue-100 shadow-md text-primary'
                            : 'border-border hover:border-primary/50 bg-white text-foreground'
                            }`}
                        >
                          {fuente}
                        </button>
                      );
                    })}
                  </div>
                )}

                {formData.fuente === 'otro' && (
                  <div className="mt-6 ml-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="relative group">
                      <input
                        type="text"
                        name="fuenteOtra"
                        value={formData.fuenteOtra}
                        onChange={handleChange}
                        placeholder="Especifique la fuente"
                        className="w-full md:w-96 px-4 py-2 border border-border rounded-lg bg-white placeholder-transparent focus:outline-none focus:border-primary transition-colors"
                      />
                      <label className="absolute left-4 -top-2.5 text-xs font-semibold text-gray-700 bg-blue-50 px-1">
                        Especifique la fuente
                      </label>
                    </div>
                  </div>
                )}

                {errors.fuente && <p className="text-red-500 text-xs mt-2 ml-4">{errors.fuente}</p>}
              </div>

              {/* PARÁMETROS DE CAMPO */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-secondary rounded-full"></div>
                  Parámetros de Campo
                </h3>
                <p className="text-sm text-gray-500 mb-6 ml-4">Ingrese los valores medidos (opcional)</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 ml-4">
                  {[
                    { name: 'temperatura', label: 'Temperatura', unit: '°C' },
                    { name: 'ph', label: 'pH', unit: 'pH' },
                    { name: 'conductividad', label: 'Conductividad', unit: 'µS/cm' },
                    { name: 'potencialRedox', label: 'Potencial Redox', unit: 'mV' },
                    { name: 'cloroResidual', label: 'Cloro residual', unit: 'mg/l' },
                    { name: 'salinidad', label: 'Salinidad', unit: '‰' },
                    { name: 'oxigenoDisuelto', label: 'Oxígeno Disuelto', unit: 'mg/l' },
                    { name: 'satOxigeno', label: 'Saturación O₂', unit: '%' },
                  ].map((param) => (
                    <div key={param.name} className="relative group">
                      <input
                        type="text"
                        name={param.name}
                        value={formData[param.name]}
                        onChange={handleChange}
                        placeholder={param.unit}
                        className="w-full px-0 py-3 border-b-2 bg-transparent focus:outline-none border-border focus:border-primary transition-colors text-center font-semibold"
                      />
                      <label className="absolute left-0 -top-6 text-xs font-semibold text-gray-700">
                        {param.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* TIPO DE MUESTREO */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-primary rounded-full"></div>
                  Tipo de Muestreo <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4 ml-4">Seleccione solo 1</p>

                <div className="flex gap-4 ml-4 flex-wrap">
                  {[
                    { value: 'puntual', label: 'Puntual' },
                    { value: 'compuesto', label: 'Compuesto' },
                    { value: 'otro', label: 'Otro' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, tipoMuestreo: option.value, compuestoHoras: '', tipoMuestreoOtro: '' }));
                        if (errors.tipoMuestreo) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.tipoMuestreo;
                            return newErrors;
                          });
                        }
                      }}
                      className={`px-6 py-3 rounded-lg border-2 transition-all font-semibold ${formData.tipoMuestreo === option.value
                        ? 'border-primary bg-blue-100 text-primary shadow-md'
                        : 'border-border hover:border-primary/50 bg-white text-foreground'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {formData.tipoMuestreo === 'compuesto' && (
                  <div className="mt-6 ml-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-primary mb-4">Seleccione la duración del muestreo:</p>
                    <div className="space-y-3">
                      {[
                        { value: '8-horas', label: 'Compuesto de 8 horas' },
                        { value: '24-horas', label: 'Compuesto de 24 horas' },
                        { value: 'otro', label: 'Otro' },
                      ].map((suboption) => (
                        <label key={suboption.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="compuestoHoras"
                            value={suboption.value}
                            checked={formData.compuestoHoras === suboption.value}
                            onChange={handleChange}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">{suboption.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tipoMuestreo === 'otro' && (
                  <div className="mt-6 ml-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="relative group">
                      <input
                        type="text"
                        name="tipoMuestreoOtro"
                        value={formData.tipoMuestreoOtro}
                        onChange={handleChange}
                        placeholder="Especifique el tipo de muestreo"
                        className="w-full md:w-96 px-4 py-2 border border-border rounded-lg bg-white placeholder-transparent focus:outline-none focus:border-primary transition-colors"
                      />
                      <label className="absolute left-4 -top-2.5 text-xs font-semibold text-gray-700 bg-blue-50 px-1">
                        Especifique el tipo de muestreo
                      </label>
                    </div>
                  </div>
                )}

                {errors.tipoMuestreo && <p className="text-red-500 text-xs mt-2 ml-4">{errors.tipoMuestreo}</p>}
              </div>

              {/* EQUIPOS UTILIZADOS */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-accent rounded-full"></div>
                  Equipos Utilizados <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4 ml-4">Liste los instrumentos empleados</p>

                <div className="relative group ml-4">
                  <textarea
                    name="equipos"
                    value={formData.equipos}
                    onChange={handleChange}
                    placeholder="Ej: Termómetro digital, Medidor de pH, Turbidímetro"
                    className={`w-full px-4 py-3 border-2 rounded-lg bg-transparent focus:outline-none resize-none ${errors.equipos
                      ? 'border-red-500 text-red-600'
                      : 'border-border focus:border-primary'
                      }`}
                    rows={3}
                  />
                  <label className="absolute left-4 -top-2.5 text-xs font-semibold text-gray-700 bg-gray-50 px-1">
                    Especifique los equipos <span className="text-red-500">*</span>
                  </label>
                  {errors.equipos && <p className="text-red-500 text-xs mt-2">{errors.equipos}</p>}
                </div>
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
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-primary rounded-full"></div>
                  ¿Quién tomó la muestra? <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4 ml-4">Seleccione solo 1</p>

                <div className="flex gap-4 ml-4 flex-wrap">
                  {[
                    { value: 'cliente', label: 'Cliente' },
                    { value: 'tecnico', label: 'Técnico del CIRA' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          quienTomaMuestra: option.value,
                          instructivoCliente: '',
                          instructivoClienteOtro: '',
                          procedimientoCIRA: '',
                          procedimientoCIRAOtro: '',
                        }));
                        if (errors.quienTomaMuestra) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.quienTomaMuestra;
                            return newErrors;
                          });
                        }
                      }}
                      className={`px-6 py-3 rounded-lg border-2 transition-all font-semibold ${
                        formData.quienTomaMuestra === option.value
                          ? 'border-primary bg-blue-100 text-primary shadow-md'
                          : 'border-border hover:border-primary/50 bg-white text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {errors.quienTomaMuestra && <p className="text-red-500 text-xs mt-2 ml-4">{errors.quienTomaMuestra}</p>}
              </div>

              {/* INSTRUCTIVOS/PROCEDIMIENTOS CONDICIONALES */}
              {formData.quienTomaMuestra === 'cliente' && (
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-accent">
                  <h3 className="text-lg font-bold text-primary mb-4">Instructivo Operativo <span className="text-red-500">*</span></h3>
                  <div className="relative">
                    <select
                      name="instructivoCliente"
                      value={formData.instructivoCliente}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.instructivoCliente
                          ? 'border-red-500'
                          : 'border-border focus:border-primary'
                      }`}
                    >
                      <option value="">Seleccione un instructivo</option>
                      <option value="INO-TM-APE-01">INO-TM-APE-01</option>
                      <option value="INO-TM-APE-02">INO-TM-APE-02</option>
                      <option value="INO-TM-APE-03">INO-TM-APE-03</option>
                      <option value="INO-TM-APE-04">INO-TM-APE-04</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  {errors.instructivoCliente && <p className="text-red-500 text-xs mt-2">{errors.instructivoCliente}</p>}

                  {formData.instructivoCliente === 'otro' && (
                    <div className="mt-4 relative group">
                      <input
                        type="text"
                        name="instructivoClienteOtro"
                        value={formData.instructivoClienteOtro}
                        onChange={handleChange}
                        placeholder="Especifique el instructivo utilizado"
                        className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-border focus:border-primary transition-colors"
                      />
                      <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700">
                        Especifique el instructivo
                      </label>
                    </div>
                  )}
                </div>
              )}

              {formData.quienTomaMuestra === 'tecnico' && (
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-600">
                  <h3 className="text-lg font-bold text-primary mb-4">Procedimiento CIRA <span className="text-red-500">*</span></h3>
                  <div className="relative">
                    <select
                      name="procedimientoCIRA"
                      value={formData.procedimientoCIRA}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.procedimientoCIRA
                          ? 'border-red-500'
                          : 'border-border focus:border-primary'
                      }`}
                    >
                      <option value="">Seleccione un procedimiento</option>
                      <option value="PROC-01">PROC-01</option>
                      <option value="PROC-02">PROC-02</option>
                      <option value="PROC-03">PROC-03</option>
                      <option value="PROC-04">PROC-04</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  {errors.procedimientoCIRA && <p className="text-red-500 text-xs mt-2">{errors.procedimientoCIRA}</p>}

                  {formData.procedimientoCIRA === 'otro' && (
                    <div className="mt-4 relative group">
                      <input
                        type="text"
                        name="procedimientoCIRAOtro"
                        value={formData.procedimientoCIRAOtro}
                        onChange={handleChange}
                        placeholder="Especifique el procedimiento utilizado"
                        className="w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none border-border focus:border-primary transition-colors"
                      />
                      <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700">
                        Especifique el procedimiento
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* OBSERVACIONES */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-3">
                  <div className="w-1 h-7 bg-accent rounded-full"></div>
                  Observaciones
                </h3>
                <p className="text-sm text-gray-500 mb-6 ml-4">Opcional</p>

                <div className="ml-4">
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Agregue cualquier observación relevante sobre la toma de muestra..."
                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-transparent focus:outline-none focus:border-primary transition-colors resize-none"
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
                          {formData.municipio && formData.departamento ? `${formData.municipio}, ${formData.departamento}` : 'No especificado'}
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
                          {formData.matriz ? formData.matriz.replace('-', ' ').toUpperCase() : 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fuente</p>
                        <p className="font-medium text-foreground">{formData.fuente || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo Muestreo</p>
                        <p className="font-medium text-foreground">
                          {formData.tipoMuestreo === 'compuesto' ? `Compuesto (${formData.compuestoHoras})` : formData.tipoMuestreo || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERIFICACIÓN FINAL */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-primary mb-6">Verificación Final</h3>

                <div className="space-y-6">
                  <div className="relative group">
                    <input
                      type="text"
                      name="muestraCapturadaPor"
                      value={formData.muestraCapturadaPor}
                      onChange={handleChange}
                      placeholder="Nombre de quien captó la muestra"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${
                        errors.muestraCapturadaPor
                          ? 'border-red-500 text-red-600'
                          : 'border-border focus:border-primary'
                      }`}
                    />
                    <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-8 group-focus-within:text-primary">
                      Muestra captada por <span className="text-red-500">*</span>
                    </label>
                    {errors.muestraCapturadaPor && <p className="text-red-500 text-xs mt-1">{errors.muestraCapturadaPor}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="verificacionFecha"
                      value={formData.verificacionFecha}
                      onChange={handleChange}
                      placeholder="Nombre y fecha de verificación"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${
                        errors.verificacionFecha
                          ? 'border-red-500 text-red-600'
                          : 'border-border focus:border-primary'
                      }`}
                    />
                    <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-8 group-focus-within:text-primary">
                      Nombre y fecha de verificación <span className="text-red-500">*</span>
                    </label>
                    {errors.verificacionFecha && <p className="text-red-500 text-xs mt-1">{errors.verificacionFecha}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="inicialesAnalista"
                      value={formData.inicialesAnalista}
                      onChange={handleChange}
                      placeholder="Ej: JD"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${
                        errors.inicialesAnalista
                          ? 'border-red-500 text-red-600'
                          : 'border-border focus:border-primary'
                      }`}
                      maxLength={3}
                    />
                    <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-8 group-focus-within:text-primary">
                      Iniciales del analista a cargo <span className="text-red-500">*</span>
                    </label>
                    {errors.inicialesAnalista && <p className="text-red-500 text-xs mt-1">{errors.inicialesAnalista}</p>}
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      name="codigoMuestra"
                      value={formData.codigoMuestra}
                      onChange={handleChange}
                      placeholder="Ej: LAB-2024-001"
                      className={`w-full px-0 py-3 border-b-2 bg-transparent placeholder-transparent focus:outline-none transition-colors ${
                        errors.codigoMuestra
                          ? 'border-red-500 text-red-600'
                          : 'border-border focus:border-primary'
                      }`}
                    />
                    <label className="absolute left-0 -top-6 text-sm font-semibold text-gray-700 transition-all group-focus-within:-top-8 group-focus-within:text-primary">
                      Código de la muestra asignado por el laboratorio <span className="text-red-500">*</span>
                    </label>
                    {errors.codigoMuestra && <p className="text-red-500 text-xs mt-1">{errors.codigoMuestra}</p>}
                  </div>
                </div>
              </div>

              {/* MENSAJE FINAL */}
              <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg">
                <p className="text-sm text-foreground font-semibold flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  FIN DEL DOCUMENTO - Verifique que toda la información sea correcta antes de enviar.
                </p>
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
          <div className="bg-gray-50 px-8 md:px-10 py-6 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 text-primary border-2 border-primary rounded-lg hover:bg-blue-50 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-all font-semibold"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>

            <div className="text-sm font-semibold text-gray-600">
              Paso {currentStep} de 3
            </div>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Guardar
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
         {/* Footer */}
        <div className="mt-10 text-center text-sm text-gray-500">
          <p>© 2026 UNAN Managua - CIRA | Sistema de Gestión de Ingreso de Muestras Ambientales SGIMA</p>
        </div>
      </div>
    </div>
  );
}
