import { useState } from "react";
import { NeonTube } from "./HudPanel";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const sweep = endDeg - startDeg;
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export default function GaugeChart({
  value = 78,
  programados = 42,
  ejecutados = 33,
  aTiempo = 84,
  size = 240,
  strokeWidth = 20,
}) {
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = (size - 52) / 2;
  const [hovered, setHovered] = useState(false);
  const angle = (value / 100) * 180;
  const needle = polarToCartesian(cx, cy, r - 4, angle);
  const pendientes = Math.max(0, programados - ejecutados);

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="flex justify-center">
        <div className="rounded-[32px] bg-slate-50 px-4 pb-2 pt-4 shadow-inner ring-1 ring-slate-200 dark:bg-[#251d50] dark:shadow-[inset_0_10px_28px_rgba(0,0,0,0.45)] dark:ring-white/10">
          <svg
            width={size}
            height={size / 2 + 52}
            viewBox={`0 0 ${size} ${size / 2 + 52}`}
            className="overflow-visible"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <defs>
              <linearGradient id="gaugeHudGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="55%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <filter id="gaugeHudGlow" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation={hovered ? 5 : 2.8} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {[0, 25, 50, 75, 100].map((tick) => {
              const inner = polarToCartesian(cx, cy, r + 14, (tick / 100) * 180);
              const outer = polarToCartesian(cx, cy, r + 20, (tick / 100) * 180);
              return (
                <line
                  key={tick}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(148,163,184,0.45)"
                  strokeWidth="1.5"
                />
              );
            })}
            <path
              d={describeArc(cx, cy, r - 14, 0, 180)}
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="1.5"
              strokeDasharray="3 5"
              strokeLinecap="round"
            />
            <path
              d={describeArc(cx, cy, r, 0, 180)}
              fill="none"
              stroke="rgba(148,163,184,0.18)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d={describeArc(cx, cy, r, 0, angle)}
              fill="none"
              stroke="url(#gaugeHudGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeHudGlow)"
            />
            <circle cx={needle.x} cy={needle.y} r="6" fill="#fff" />
            <circle cx={needle.x} cy={needle.y} r="3" fill="#38bdf8" />
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-800 dark:fill-white" fontSize="38" fontWeight="700">
              {value}%
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="11">
              Ejecutados vs programados
            </text>
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: programados, l: "Programados", c: "text-blue-800 dark:text-sky-200" },
            { n: ejecutados, l: "Ejecutados", c: "text-teal-700 dark:text-cyan-200" },
            { n: pendientes, l: "Pendientes", c: "text-amber-700 dark:text-amber-200" },
          ].map((item) => (
            <div key={item.l} className="rounded-2xl bg-slate-50 px-2 py-2.5 text-center ring-1 ring-slate-200 dark:bg-[#251d50] dark:ring-white/10">
              <p className={`text-xl font-bold tabular-nums ${item.c}`}>{item.n}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.l}</p>
            </div>
          ))}
        </div>
        <NeonTube pct={value} from="#22d3ee" to="#2563eb" label="Cumplimiento" value={`${value}%`} />
        <NeonTube pct={aTiempo} from="#fbbf24" to="#d97706" label="Planes a tiempo" value={`${aTiempo}%`} />
      </div>
    </div>
  );
}
