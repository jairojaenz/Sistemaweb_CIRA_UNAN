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
  wide = false,
  areaBanner = "ÁREA DE PROYECCIÓN Y EXTENSIÓN",
}) {
  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-gradient-to-b from-blue-50 to-white text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">
        {areaBanner}
      </div>

      {/* Stepper: mismo contenedor max-w-5xl que SolicitudServicioPage */}
      <div className="mx-auto w-full max-w-5xl px-6 pt-12">
        <PlanMuestreoStepper step={step} />
      </div>

      <div
        className={`mx-auto w-full px-6 pb-12 ${wide ? "max-w-7xl" : "max-w-5xl"}`}
      >
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="p-8 md:p-10">{children}</div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-8 py-6 md:px-10">
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
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
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

        <div className="mt-10 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} UNAN Managua - CIRA | Plan de Muestreo
          </p>
        </div>
      </div>
    </div>
  );
}
