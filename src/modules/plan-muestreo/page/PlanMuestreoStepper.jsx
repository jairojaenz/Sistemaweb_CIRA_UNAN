import WizardFormStepIndicator from "../../../components/WizardFormStepIndicator.jsx";
import { PLAN_STEP_LABELS } from "../utils/planMuestreoValidation.js";

/** @deprecated El layout incluye el stepper; conservado por compatibilidad. */
export default function PlanMuestreoStepper({ step }) {
  return <WizardFormStepIndicator currentStep={step} labels={PLAN_STEP_LABELS} />;
}
