/**
 * Indicador de pasos 1-2-3 (compartido Solicitud de Servicio y Plan de Muestreo).
 * Usa justify-between + flex-1 para el mismo espaciado en todos los pasos.
 */
export default function WizardStepIndicator({ currentStep, totalSteps = 3, labels }) {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center px-1">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold shadow-md transition-all duration-300 sm:h-14 sm:w-14 sm:text-lg ${
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
              className={`mt-2 text-center text-xs font-semibold sm:mt-3 sm:text-sm ${
                n === currentStep ? "text-blue-900" : "text-gray-600"
              }`}
            >
              {labels?.[n - 1] ?? `Paso ${n}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
