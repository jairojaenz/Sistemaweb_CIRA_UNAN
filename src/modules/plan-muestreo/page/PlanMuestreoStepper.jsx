import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";

/** Mismo stepper que SolicitudServicioPage (espaciado justify-between + flex-1). */
const STEP_LABELS = ["Identificación", "Detalle del muestreo", "Cierre y firmas"];

export default function PlanMuestreoStepper({ step }) {
  return <WizardStepIndicator currentStep={step} totalSteps={3} labels={STEP_LABELS} />;
}
