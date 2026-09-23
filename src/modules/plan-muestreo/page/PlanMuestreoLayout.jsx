import { ChevronLeft, ChevronRight } from "lucide-react";
import WizardFormStepIndicator from "../../../components/WizardFormStepIndicator.jsx";
import { PLAN_STEP_LABELS } from "../utils/planMuestreoValidation.js";

/**
 * Layout compartido Plan de Muestreo (shell visual alineado con Información de Campo / Solicitud).
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
  const maxWidth = wide ? "max-w-6xl" : "max-w-6xl";

  return (
    <div className="campo-wizard flex min-h-full flex-1 flex-col">
      <div className="campo-wizard-banner py-2.5 text-center text-sm font-bold text-blue-950 sm:text-base">
        {areaBanner}
      </div>

      <div
        className={`mx-auto w-full flex-1 px-4 sm:px-6 ${maxWidth} ${
          compact ? "py-6 sm:py-8" : "py-8 sm:py-10"
        }`}
      >
        <WizardFormStepIndicator currentStep={step} labels={PLAN_STEP_LABELS} />

        <div className="campo-wizard-card">
          <div
            className="campo-wizard-card-progress"
            style={{ width: `${(step / 3) * 100}%` }}
            aria-hidden
          />
          <div className="campo-wizard-step-body campo-wizard-step-pane">{children}</div>

          <div className="campo-wizard-footer sticky bottom-0 z-10 flex items-center justify-between gap-3 px-6 py-5 sm:px-8 md:px-10">
            <button
              type="button"
              onClick={onPrevious}
              disabled={previousDisabled}
              className="campo-btn-outline disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-5 w-5" />
              Anterior
            </button>

            <div className="rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
              Paso {step} de 3
            </div>

            {isLastStep ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitDisabled}
                className="campo-btn-primary campo-btn-primary--save disabled:opacity-60"
              >
                {submitLabel}
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button type="button" onClick={onNext} className="campo-btn-primary">
                {nextLabel}
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className={`text-center text-sm text-gray-500 dark:text-slate-400 ${compact ? "mt-6" : "mt-10"}`}>
          <p>© {new Date().getFullYear()} UNAN Managua - CIRA | Plan de Muestreo</p>
        </div>
      </div>
    </div>
  );
}
