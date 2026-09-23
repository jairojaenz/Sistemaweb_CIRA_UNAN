import { Check } from "lucide-react";

/** Stepper visual 1-2-3 (Información de Campo, Solicitud de Servicio, etc.). */
export default function WizardFormStepIndicator({ currentStep, labels = [] }) {
  const total = labels.length || 3;
  const progress =
    total <= 1 ? 100 : Math.min(100, Math.max(0, ((currentStep - 1) / (total - 1)) * 100));

  return (
    <nav className="campo-wizard-stepper" aria-label="Progreso del formulario">
      <div className="campo-wizard-stepper-rail" aria-hidden>
        <div className="campo-wizard-stepper-rail-fill" style={{ width: `${progress}%` }} />
      </div>
      <ol className="campo-wizard-stepper-list">
        {labels.map((label, index) => {
          const step = index + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          let stateClass = "is-pending";
          if (done) stateClass = "is-done";
          else if (active) stateClass = "is-active";

          return (
            <li
              key={label}
              className={`campo-wizard-stepper-item ${stateClass}`}
              aria-current={active ? "step" : undefined}
            >
              <span className="campo-wizard-stepper-dot">
                {done ? <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden /> : step}
              </span>
              <span className="campo-wizard-stepper-label">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
