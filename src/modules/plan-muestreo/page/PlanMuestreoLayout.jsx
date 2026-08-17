import { ChevronLeft, ChevronRight } from "lucide-react";
import PlanMuestreoStepper from "./PlanMuestreoStepper.jsx";

/**
 * Layout compartido Plan de Muestreo: barra amarilla, pasos fuera del card, formulario en card blanco.
 */
export default function PlanMuestreoLayout({
  step,
  children,
  onPrevious,
  onNext,
  onSubmit,
  previousDisabled = false,
  isLastStep = false,
  nextLabel = "Siguiente",
  submitLabel = "Crear",
  submitDisabled = false,
  wide = false,
  compact = false,
  areaBanner = "ÁREA DE PROYECCIÓN Y EXTENSIÓN",
}) {
  const maxWidth = wide ? "max-w-7xl" : "max-w-5xl";
  return (
    <div className="min-h-full w-full bg-gray-100 text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">
        {areaBanner}
      </div>

      <div className={`mx-auto w-full px-6 ${maxWidth} ${compact ? "pt-6" : "pt-12"}`}>
        <PlanMuestreoStepper step={step} />
      </div>

      <div
        className={`mx-auto w-full px-6 ${maxWidth} ${compact ? "pb-8" : "pb-12"}`}
      >
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className={compact ? "p-5 md:p-6" : "p-8 md:p-10"}>{children}</div>

          <div
            className={`flex items-center justify-between border-t border-gray-200 bg-gray-50 ${
              compact ? "px-5 py-4 md:px-6" : "px-8 py-6 md:px-10"
            }`}
          >
            <button
              type="button"
              onClick={onPrevious}
              disabled={previousDisabled}
              className={`flex items-center gap-2 rounded-lg border-2 px-6 py-2 font-semibold transition-all ${
                previousDisabled
                  ? "cursor-not-allowed border-gray-300 text-gray-400"
                  : "border-blue-900 text-blue-900 hover:bg-blue-50"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              Anterior
            </button>

            <div className="text-sm font-semibold text-gray-600">Paso {step} de 3</div>

            {isLastStep ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitDisabled}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-60"
              >
                {submitLabel}
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg"
              >
                {nextLabel}
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className={`text-center text-sm text-gray-500 ${compact ? "mt-6" : "mt-10"}`}>
          <p>
            © {new Date().getFullYear()} UNAN Managua - CIRA | Plan de Muestreo
          </p>
        </div>
      </div>
    </div>
  );
}
