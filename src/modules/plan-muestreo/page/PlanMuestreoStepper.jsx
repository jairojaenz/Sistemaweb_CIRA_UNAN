import { FaCheck } from "react-icons/fa";

function StepCircle({ active, done, number, label }) {
  const base =
    "w-16 h-16 rounded-full flex items-center justify-center font-bold shadow-sm";
  const cls = done
    ? "bg-blue-900 text-white"
    : active
      ? "bg-blue-900 text-white"
      : "bg-white text-blue-900 border border-gray-200";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${base} ${cls}`}>
        {done ? <FaCheck /> : <span className="text-xl">{number}</span>}
      </div>
      <div className="text-xs font-semibold text-gray-700">PASO {number}</div>
      {label ? <div className="text-xs text-gray-500">{label}</div> : null}
    </div>
  );
}

export default function PlanMuestreoStepper({ step }) {
  return (
    <div className="flex items-start justify-center gap-10 py-6">
      <StepCircle number={1} active={step === 1} done={step > 1} />
      <StepCircle number={2} active={step === 2} done={step > 2} />
      <StepCircle number={3} active={step === 3} done={false} />
    </div>
  );
}

