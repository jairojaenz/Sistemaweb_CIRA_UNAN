import { NeonTube } from "./HudPanel";

function MiniSpark({ values, color = "#7dd3fc" }) {
  const nums = values.filter((n) => Number.isFinite(n));
  if (nums.length < 2) return null;
  const max = Math.max(...nums);
  const min = Math.min(...nums);
  const w = 72;
  const h = 22;
  const pts = nums.map((n, i) => {
    const x = (i / (nums.length - 1)) * w;
    const y = h - 3 - ((n - min) / (max - min || 1)) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-16 overflow-visible" aria-hidden>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

export default function TopClientesList({
  clientes,
  pagina = 1,
  tamano = 20,
  total = 0,
  totalPaginas = 1,
  onPagina,
  cargando = false,
}) {
  const max = Math.max(...clientes.map((c) => c.muestras), 1);
  const offset = (pagina - 1) * tamano;
  const hayPaginas = total > tamano;

  return (
    <div>
      <div className="dash-scroll h-64 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
        {cargando && !clientes.length ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando clientes…</p>
        ) : (
          clientes.map((cliente, index) => {
            const puesto = offset + index + 1;
            const pct = Math.round((cliente.muestras / max) * 100);
            const from = puesto <= 2 ? "#22d3ee" : puesto <= 4 ? "#818cf8" : "#fbbf24";
            const to = puesto <= 2 ? "#2563eb" : puesto <= 4 ? "#4338ca" : "#d97706";
            return (
              <div
                key={cliente.idCliente ?? cliente.name}
                className="rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200 dark:bg-[#251d50] dark:ring-white/10"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-800 ring-1 ring-blue-200 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-300/30">
                    {puesto}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{cliente.name}</span>
                  {cliente.spark ? <MiniSpark values={cliente.spark} color={from} /> : null}
                  <span className="text-sm font-semibold tabular-nums text-blue-800 dark:text-sky-200">{cliente.muestras}</span>
                </div>
                <NeonTube pct={pct} from={from} to={to} />
              </div>
            );
          })
        )}
      </div>

      {hayPaginas ? (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Página {pagina} de {totalPaginas} · {total} clientes
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagina <= 1 || cargando}
              onClick={() => onPagina?.(pagina - 1)}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] text-slate-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagina >= totalPaginas || cargando}
              onClick={() => onPagina?.(pagina + 1)}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] text-slate-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
