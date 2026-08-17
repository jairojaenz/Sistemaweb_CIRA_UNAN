import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";
import { PLAN_STEP_LABELS } from "../utils/planMuestreoValidation.js";

export default function PlanMuestreoStepper({ step }) {
  return <WizardStepIndicator currentStep={step} totalSteps={3} labels={PLAN_STEP_LABELS} />;
}
