import { FaFlask, FaFileInvoiceDollar, FaClipboardCheck, FaIndustry } from "react-icons/fa";

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx.toFixed(1)} ${y0.toFixed(1)}, ${cpx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

function Sparkline({ id, values, color }) {
  const nums = values.filter((n) => Number.isFinite(n));
  if (nums.length < 2) return null;
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const w = 280;
  const h = 48;
  const padLeft = 4;
  const padRight = 52;
  const pts = nums.map((n, i) => {
    const x = padLeft + (i / (nums.length - 1)) * (w - padLeft - padRight);
    const y = h - 8 - ((n - min) / (max - min || 1)) * (h - 16);
    return [x, y];
  });
  const line = smoothPath(pts);
  const last = pts.at(-1);
  const first = pts[0];
  const area = `${line} L${last[0]},${h} L${first[0]},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-12 w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={`kpi-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#kpi-fill-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      {last ? (
        <circle cx={last[0]} cy={last[1]} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
      ) : null}
    </svg>
  );
}

function formatoEntero(n) {
  return Number(n || 0).toLocaleString("es-NI");
}

function formatoDelta(n) {
  const v = Number(n || 0);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function leerKpi(raw) {
  if (!raw || typeof raw !== "object") {
    return { valor: 0, variacion: 0, subtitulo: "Sin datos", spark: [] };
  }
  return {
    valor: Number(raw.valor ?? raw.Valor ?? 0),
    variacion: Number(raw.variacion ?? raw.Variacion ?? 0),
    subtitulo: raw.subtitulo ?? raw.Subtitulo ?? "En el período",
    spark: Array.isArray(raw.spark ?? raw.Spark) ? raw.spark ?? raw.Spark : [],
  };
}

const CARD_META = [
  {
    id: "proformas",
    label: "Proformas emitidas",
    icon: FaFileInvoiceDollar,
    wrap: "from-[#3b82f6] via-[#1d4ed8] to-[#0b1b4a]",
    glow: "rgba(96, 165, 250, 0.55)",
    color: "#bfdbfe",
  },
  {
    id: "ordenes",
    label: "Órdenes confirmadas",
    icon: FaClipboardCheck,
    wrap: "from-[#22d3ee] via-[#0f766e] to-[#042f2e]",
    glow: "rgba(34, 211, 238, 0.5)",
    color: "#a5f3fc",
  },
  {
    id: "muestras",
    label: "Muestras procesadas",
    icon: FaFlask,
    wrap: "from-[#818cf8] via-[#4338ca] to-[#1e1b4b]",
    glow: "rgba(129, 140, 248, 0.55)",
    color: "#c7d2fe",
  },
  {
    id: "clientes",
    label: "Clientes atendidos",
    icon: FaIndustry,
    wrap: "from-[#fbbf24] via-[#d97706] to-[#1e3a8a]",
    glow: "rgba(251, 191, 36, 0.5)",
    color: "#fde68a",
  },
];

const WATER_BUBBLES = [
  { left: "8%", size: 10, dur: 7.5, delay: "0s", wobble: "10px" },
  { left: "18%", size: 18, dur: 11, delay: "1.2s", wobble: "-14px" },
  { left: "30%", size: 8, dur: 6.5, delay: "2.4s", wobble: "16px" },
  { left: "42%", size: 14, dur: 9, delay: "0.6s", wobble: "-10px" },
  { left: "55%", size: 22, dur: 13, delay: "3s", wobble: "12px" },
  { left: "68%", size: 9, dur: 7, delay: "1.8s", wobble: "-18px" },
  { left: "78%", size: 16, dur: 10, delay: "4.1s", wobble: "8px" },
  { left: "88%", size: 7, dur: 6, delay: "2.8s", wobble: "-12px" },
  { left: "12%", size: 6, dur: 5.5, delay: "5s", wobble: "14px" },
  { left: "50%", size: 11, dur: 8.5, delay: "3.6s", wobble: "-8px" },
];

function RisingBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {WATER_BUBBLES.map((b, i) => (
        <span
          key={`${b.left}-${i}`}
          className="dash-kpi-rise"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            "--kpi-wobble": b.wobble,
            "--kpi-dur-s": b.dur,
          }}
        />
      ))}
    </div>
  );
}

export default function KpiStatCards({ kpis = {} }) {
  return (
    <div className="grid gap-6 pt-2 sm:grid-cols-2 xl:grid-cols-4">
      {CARD_META.map((card) => {
        const Icon = card.icon;
        const data = leerKpi(kpis[card.id]);
        return (
          <article
            key={card.id}
            className={`dash-kpi-card group relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br ${card.wrap} px-5 pb-4 pt-5 text-white shadow-[0_24px_40px_-24px_rgba(0,0,0,0.7)] ring-1 ring-white/15 hover:-translate-y-0.5`}
            style={{ "--kpi-glow": card.glow }}
          >
            <RisingBubbles />
            <Icon className="pointer-events-none absolute -bottom-3 -right-3 z-0 h-24 w-24 text-white/[0.08]" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="dash-kpi-orb flex h-12 w-12 items-center justify-center rounded-2xl text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
                  {formatoDelta(data.variacion)}
                </span>
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{card.label}</p>
              <p className="mt-1 text-[32px] font-bold leading-none tracking-tight tabular-nums">
                {formatoEntero(data.valor)}
              </p>
              <p className="mt-1.5 text-xs text-white/70">{data.subtitulo}</p>
              <div className="mt-3">
                <Sparkline id={card.id} values={data.spark} color={card.color} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
