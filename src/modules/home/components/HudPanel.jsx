export function GlowTooltip({
  active,
  payload,
  label,
  labelFormatter,
  nameMap = {},
  suffix = "",
}) {
  if (!active || !payload?.length) return null;
  const title = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="rounded-2xl border border-sky-300/25 bg-[#251d50]/95 px-3.5 py-2.5 shadow-[0_16px_40px_rgba(14,165,233,0.22)]">
      {title ? (
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{title}</p>
      ) : null}
      <ul className="space-y-1">
        {payload
          .filter((item) => item.tooltipType !== "none" && item.name !== "anteriorFill")
          .map((item) => (
          <li key={item.dataKey} className="flex items-center gap-2 text-sm text-white">
            <span className="h-2 w-2 rounded-full" style={{ background: item.payload?.color || item.color || item.fill }} />
            <span className="text-slate-300">{nameMap[item.name] || item.name}</span>
            <span className="ml-auto font-semibold tabular-nums">
              {item.value}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NeonTube({ pct, from = "#22d3ee", to = "#2563eb", label, value }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div>
      {label || value != null ? (
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="tabular-nums text-sky-200">{value ?? `${width}%`}</span>
        </div>
      ) : null}
      <div className="relative h-3 overflow-visible rounded-full bg-[#050d18] shadow-[inset_0_2px_6px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${from}, ${to})`,
            boxShadow: `0 0 12px ${from}66`,
          }}
        />
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white"
          style={{
            left: `calc(${width}% - 7px)`,
            boxShadow: `0 0 10px ${from}`,
            outline: `2px solid ${from}`,
          }}
        />
      </div>
    </div>
  );
}

export default function HudPanel({ title, subtitle, className = "", children }) {
  return (
    <section className={`dash-glass relative overflow-hidden rounded-[28px] bg-[#251d50] p-5 text-white ring-1 ring-sky-400/20 ${className}`}>
      {title ? (
        <>
          <h2 className="relative text-[15px] font-semibold tracking-tight text-white">{title}</h2>
          {subtitle ? <p className="relative mb-5 mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}
