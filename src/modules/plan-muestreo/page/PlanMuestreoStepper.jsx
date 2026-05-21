import WizardStepIndicator from "../../../components/WizardStepIndicator.jsx";

/** Mismo stepper que SolicitudServicioPage (espaciado justify-between + flex-1). */
export default function PlanMuestreoStepper({ step }) {
  return <WizardStepIndicator currentStep={step} />;
}
