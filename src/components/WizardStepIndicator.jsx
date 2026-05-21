/**
 * Indicador de pasos 1-2-3 (compartido Solicitud de Servicio y Plan de Muestreo).
 * Usa justify-between + flex-1 para el mismo espaciado en todos los pasos.
 */
export default function WizardStepIndicator({ currentStep, totalSteps = 3 }) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold shadow-md transition-all duration-300 ${
                n < currentStep
                  ? "bg-yellow-400 text-white"
                  : n === currentStep
                    ? "bg-blue-900 text-white ring-4 ring-blue-200"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {n < currentStep ? "✓" : n}
            </div>
            <p
              className={`mt-3 text-center text-sm font-semibold ${
                n === currentStep ? "text-blue-900" : "text-gray-600"
              }`}
            >
              Paso {n}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
