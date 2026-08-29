export default function AnalisisCapsuleChart({ data }) {
  const max = Math.max(...data.map((d) => d.cantidad), 1);

  return (
    <div className="dash-scroll h-64 overflow-x-auto overflow-y-hidden px-1 pt-2">
      <div className="flex h-full min-w-full items-end justify-evenly gap-3">
      {data.map((item) => {
        const pct = Math.round((item.cantidad / max) * 100);
        const deep = item.deep || item.color;
        const mid = item.color;
        const glow = item.glow || item.color;

        return (
          <div key={item.name} className="flex min-w-[4.75rem] shrink-0 flex-col items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-white">{item.cantidad}</span>
            <div
              className="relative h-44 w-7 overflow-hidden rounded-full shadow-[inset_0_8px_16px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
              style={{ background: `${mid}26` }}
            >
              <div
                className="absolute bottom-0 left-0 w-full rounded-full"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(to top, ${deep} 0%, ${mid} 58%, ${glow} 100%)`,
                  boxShadow: `0 0 16px ${mid}cc, 0 0 4px ${glow}`,
                }}
              />
            </div>
            <span className="h-8 w-full text-center text-[10px] leading-tight text-slate-400">{item.name}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}
