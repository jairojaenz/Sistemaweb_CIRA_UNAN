import { useState } from "react";

const MONTHS = {
  Ene: "Enero",
  Feb: "Febrero",
  Mar: "Marzo",
  Abr: "Abril",
  May: "Mayo",
  Jun: "Junio",
  Jul: "Julio",
  Ago: "Agosto",
  Sep: "Septiembre",
  Oct: "Octubre",
  Nov: "Noviembre",
  Dic: "Diciembre",
};

const PROFORMA_TONES = [
  { deep: "#0369a1", mid: "#06b6d4", glow: "#67e8f9" },
  { deep: "#1d4ed8", mid: "#2563eb", glow: "#7dd3fc" },
  { deep: "#1e40af", mid: "#3b82f6", glow: "#93c5fd" },
  { deep: "#3730a3", mid: "#4f46e5", glow: "#a5b4fc" },
  { deep: "#5b21b6", mid: "#7c3aed", glow: "#c4b5fd" },
  { deep: "#155e75", mid: "#0891b2", glow: "#22d3ee" },
  { deep: "#0f766e", mid: "#14b8a6", glow: "#5eead4" },
  { deep: "#047857", mid: "#10b981", glow: "#6ee7b7" },
  { deep: "#075985", mid: "#0ea5e9", glow: "#38bdf8" },
  { deep: "#1e3a8a", mid: "#1d4ed8", glow: "#60a5fa" },
  { deep: "#312e81", mid: "#6366f1", glow: "#818cf8" },
  { deep: "#115e59", mid: "#0d9488", glow: "#2dd4bf" },
];

const ORDEN_TONES = [
  { deep: "#b45309", mid: "#f59e0b", glow: "#fde68a" },
  { deep: "#c2410c", mid: "#f97316", glow: "#fdba74" },
  { deep: "#9a3412", mid: "#ea580c", glow: "#fb923c" },
  { deep: "#be123c", mid: "#f43f5e", glow: "#fb7185" },
  { deep: "#a16207", mid: "#eab308", glow: "#facc15" },
  { deep: "#9f1239", mid: "#e11d48", glow: "#fda4af" },
  { deep: "#b91c1c", mid: "#ef4444", glow: "#fca5a5" },
  { deep: "#c2410c", mid: "#ff6b00", glow: "#ffb020" },
  { deep: "#92400e", mid: "#d97706", glow: "#fbbf24" },
  { deep: "#7c2d12", mid: "#f97316", glow: "#fdba74" },
  { deep: "#881337", mid: "#e11d48", glow: "#fb7185" },
  { deep: "#991b1b", mid: "#dc2626", glow: "#f87171" },
];

function niceMax(n) {
  const steps = [200, 400, 500, 600, 800, 1000, 1200];
  return steps.find((s) => s >= n * 1.1) || Math.ceil(n / 100) * 100;
}

function Tube({ value, ceiling, tone, onEnter, onLeave }) {
  const pct = Math.max(0, Math.min(100, (value / ceiling) * 100));

  return (
    <div
      className="relative h-full w-[13px] cursor-pointer sm:w-[17px]"
      style={{ background: `${tone.mid}26` }}
      onMouseEnter={(e) => onEnter(e, tone.mid)}
      onMouseLeave={onLeave}
    >
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: `${pct}%`,
          background: `linear-gradient(to top, ${tone.deep} 0%, ${tone.mid} 58%, ${tone.glow} 100%)`,
          boxShadow: `0 0 16px ${tone.mid}cc, 0 0 4px ${tone.glow}`,
        }}
      />
    </div>
  );
}

export default function ConversionBarChart({ data = [] }) {
  const peak = Math.max(1, ...data.flatMap((d) => [d.proformas || 0, d.ordenes || 0]));
  const ceiling = niceMax(peak);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(ceiling * p));
  const [tip, setTip] = useState(null);

  return (
    <>
      <div className="relative h-72">
        <div className="flex h-[calc(100%-1.5rem)]">
          <div className="flex w-8 flex-col-reverse justify-between py-0.5 pr-1 text-right text-[11px] text-slate-500 dark:text-slate-400">
            {ticks.map((t) => (
              <span key={t} className="leading-none">
                {t}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="pointer-events-none absolute inset-0 flex flex-col-reverse justify-between">
              {ticks.map((t) => (
                <div key={t} className="border-t border-dotted border-slate-400/50 dark:border-slate-500/25" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-stretch justify-between gap-1 px-1">
              {data.map((row, i) => (
                <div key={row.mes} className="flex h-full min-w-0 flex-1 items-stretch justify-center gap-1">
                  <Tube
                    value={row.proformas}
                    ceiling={ceiling}
                    tone={PROFORMA_TONES[i % PROFORMA_TONES.length]}
                    onEnter={(_, color) =>
                      setTip({
                        mes: row.mes,
                        name: "Proformas",
                        value: row.proformas,
                        color,
                      })
                    }
                    onLeave={() => setTip(null)}
                  />
                  <Tube
                    value={row.ordenes}
                    ceiling={ceiling}
                    tone={ORDEN_TONES[i % ORDEN_TONES.length]}
                    onEnter={(_, color) =>
                      setTip({
                        mes: row.mes,
                        name: "Órdenes",
                        value: row.ordenes,
                        color,
                      })
                    }
                    onLeave={() => setTip(null)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex pl-8 pr-1 text-[11px] text-slate-500 dark:text-slate-400">
          {data.map((row) => (
            <span key={row.mes} className="min-w-0 flex-1 text-center">
              {row.mes}
            </span>
          ))}
        </div>
        {tip ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg dark:border-sky-300/25 dark:bg-[#251d50]/95 dark:shadow-[0_16px_40px_rgba(14,165,233,0.22)]">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {MONTHS[tip.mes] || tip.mes}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-white">
              <span className="h-2 w-2 rounded-full" style={{ background: tip.color }} />
              <span className="text-slate-500 dark:text-slate-300">{tip.name}</span>
              <span className="ml-3 font-semibold tabular-nums">{tip.value}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-2">
          <span className="flex h-2.5 overflow-hidden">
            {PROFORMA_TONES.slice(0, 4).map((t) => (
              <span key={t.mid} className="h-2.5 w-1.5" style={{ background: t.mid }} />
            ))}
          </span>
          Proformas emitidas
        </span>
        <span className="flex items-center gap-2">
          <span className="flex h-2.5 overflow-hidden">
            {ORDEN_TONES.slice(0, 4).map((t) => (
              <span key={t.mid} className="h-2.5 w-1.5" style={{ background: t.mid }} />
            ))}
          </span>
          Órdenes confirmadas
        </span>
      </div>
    </>
  );
}
