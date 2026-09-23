import {
  accentFromTone,
  campoAccentFilledClasses,
  catalogChoiceButtonClasses,
  catalogIconSurfaceClasses,
  campoTieneValor,
} from "../utils/catalogIcons.js";
import { Check } from "lucide-react";

export const ICON_INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-800 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-sky-400/25 dark:bg-[#251d50] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:disabled:bg-[#1a1250] dark:disabled:text-slate-500";

export function selectedCardFromTone(tone = "") {
  const pairs = [
    ["amber", "border-amber-400 bg-amber-100 shadow-sm shadow-amber-100"],
    ["sky", "border-sky-400 bg-sky-100 shadow-sm shadow-sky-100"],
    ["indigo", "border-indigo-400 bg-indigo-100 shadow-sm shadow-indigo-100"],
    ["violet", "border-violet-400 bg-violet-100 shadow-sm shadow-violet-100"],
    ["teal", "border-teal-400 bg-teal-100 shadow-sm shadow-teal-100"],
    ["emerald", "border-emerald-400 bg-emerald-100 shadow-sm shadow-emerald-100"],
    ["cyan", "border-cyan-400 bg-cyan-100 shadow-sm shadow-cyan-100"],
    ["orange", "border-orange-400 bg-orange-100 shadow-sm shadow-orange-100"],
    ["rose", "border-rose-400 bg-rose-100 shadow-sm shadow-rose-100"],
    ["slate", "border-slate-400 bg-slate-100 shadow-sm shadow-slate-100"],
  ];
  const found = pairs.find(([key]) => tone.includes(key));
  return found ? found[1] : "border-blue-900 bg-blue-50 shadow-sm";
}

export function CatalogChoiceCard({ selected, onClick, icon, tone, label, disabled, hint }) {
  const ChoiceIcon = icon;
  const accent = accentFromTone(tone);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      data-accent={accent}
      className={`p-4 text-left ${catalogChoiceButtonClasses(tone, { selected: selected && !disabled, disabled, extra: "w-full" })}`}
    >
      <div className="flex items-center gap-3">
        <span className={catalogIconSurfaceClasses(tone, "lg")}>
          <ChoiceIcon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-semibold leading-snug ${
              selected ? "text-blue-950 dark:text-sky-100" : "text-gray-800 dark:text-slate-200"
            }`}
          >
            {label}
          </span>
          {hint ? <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-slate-300">{hint}</span> : null}
        </span>
        {selected && !disabled ? (
          <span className={`catalog-choice-check catalog-choice-check--${accent}`}>
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function IconField({
  id,
  icon,
  tone,
  label,
  required,
  error,
  hint,
  filledValue,
  children,
  className = "",
}) {
  const FieldIcon = icon;
  const conValor = campoTieneValor(filledValue);
  const wrapClass = [
    campoAccentFilledClasses(tone, filledValue, "campo-field"),
    error ? "campo-field--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={wrapClass}>
      <div className="mb-3 flex items-start gap-2.5">
        <span className={catalogIconSurfaceClasses(tone, "field")}>
          <FieldIcon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <label
            htmlFor={id}
            className={`text-sm font-semibold ${
              conValor ? "text-blue-950 dark:text-slate-100" : "text-gray-800 dark:text-slate-100"
            }`}
          >
            {label} {required ? <span className="text-red-500">*</span> : null}
          </label>
          {hint ? (
            <p
              className={`text-xs font-normal leading-snug ${
                conValor ? "text-slate-600 dark:text-slate-300" : "text-gray-500 dark:text-slate-400"
              }`}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      {children}
      {error ? <p className="mt-2 text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

export function WizardStepIntro({ title, description }) {
  return (
    <header className="campo-step-intro">
      <h2 className="text-xl font-bold tracking-tight text-blue-950 dark:text-white sm:text-2xl md:text-[1.65rem]">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-[0.9375rem]">
        {description}
      </p>
    </header>
  );
}

const ESTILO_HORA = {
  "8 h": {
    iconIdle: "bg-sky-100 text-sky-600",
    iconOn: "bg-sky-600 text-white",
    cardIdle: "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/70",
    cardOn: "border-sky-400 bg-sky-100 shadow-sm shadow-sky-100",
    labelIdle: "text-slate-700",
    labelOn: "text-sky-900",
  },
  "10 h": {
    iconIdle: "bg-teal-100 text-teal-600",
    iconOn: "bg-teal-600 text-white",
    cardIdle: "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/70",
    cardOn: "border-teal-400 bg-teal-100 shadow-sm shadow-teal-100",
    labelIdle: "text-slate-700",
    labelOn: "text-teal-900",
  },
  "12 h": {
    iconIdle: "bg-amber-100 text-amber-600",
    iconOn: "bg-amber-500 text-white",
    cardIdle: "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/70",
    cardOn: "border-amber-400 bg-amber-100 shadow-sm shadow-amber-100",
    labelIdle: "text-slate-700",
    labelOn: "text-amber-950",
  },
  "16 h": {
    iconIdle: "bg-violet-100 text-violet-600",
    iconOn: "bg-violet-600 text-white",
    cardIdle: "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/70",
    cardOn: "border-violet-400 bg-violet-100 shadow-sm shadow-violet-100",
    labelIdle: "text-slate-700",
    labelOn: "text-violet-950",
  },
  "24 h": {
    iconIdle: "bg-indigo-100 text-indigo-600",
    iconOn: "bg-indigo-600 text-white",
    cardIdle: "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/70",
    cardOn: "border-indigo-400 bg-indigo-100 shadow-sm shadow-indigo-100",
    labelIdle: "text-slate-700",
    labelOn: "text-indigo-950",
  },
  Otro: {
    iconIdle: "bg-slate-100 text-slate-500",
    iconOn: "bg-slate-600 text-white",
    cardIdle: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
    cardOn: "border-slate-400 bg-slate-100 shadow-sm shadow-slate-100",
    labelIdle: "text-slate-700",
    labelOn: "text-slate-900",
  },
};

export function HoraChoiceCard({ label, selected, icon, onClick }) {
  const HoraIcon = icon;
  const estilo = ESTILO_HORA[label] ?? ESTILO_HORA.Otro;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[4.75rem] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition ${
        selected ? estilo.cardOn : estilo.cardIdle
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
          selected ? estilo.iconOn : estilo.iconIdle
        }`}
      >
        <HoraIcon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className={`text-sm font-semibold ${selected ? estilo.labelOn : estilo.labelIdle}`}>
        {label}
      </span>
    </button>
  );
}
