export const ICON_INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-800 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";

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

export function CatalogChoiceCard({ selected, onClick, icon: Icon, tone, label, disabled, hint }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-white text-gray-400"
          : selected
            ? selectedCardFromTone(tone)
            : "border-gray-200 bg-gray-50/80 hover:border-blue-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-semibold leading-snug ${selected ? "text-blue-900" : "text-gray-800"}`}>
            {label}
          </span>
          {hint ? <span className="mt-0.5 block text-xs font-normal text-gray-500">{hint}</span> : null}
        </span>
      </div>
    </button>
  );
}

export function IconField({ id, icon: Icon, tone, label, required, error, hint, children, className = "" }) {
  return (
    <div className={`rounded-xl border bg-gray-50/80 p-4 ${error ? "border-red-300" : "border-gray-200"} ${className}`}>
      <div className="mb-3 flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <label htmlFor={id} className="text-sm font-semibold text-gray-800">
            {label} {required ? <span className="text-red-500">*</span> : null}
          </label>
          {hint ? <p className="text-xs font-normal text-gray-500">{hint}</p> : null}
        </div>
      </div>
      {children}
      {error ? <p className="mt-2 text-xs font-medium text-red-500">{error}</p> : null}
    </div>
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

export function HoraChoiceCard({ label, selected, icon: Icon, onClick }) {
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
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className={`text-sm font-semibold ${selected ? estilo.labelOn : estilo.labelIdle}`}>
        {label}
      </span>
    </button>
  );
}
