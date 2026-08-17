import { X } from "lucide-react";

function texto(value) {
  const t = String(value ?? "").trim();
  return t || "—";
}

function formatHora(value) {
  const t = String(value ?? "").trim();
  if (!t) return "—";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function formatFecha(value) {
  const t = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const [y, m, d] = t.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return t || "—";
}

const ESTADO_CLASE = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En tránsito": "bg-sky-100 text-sky-800",
  Recibida: "bg-emerald-100 text-emerald-800",
  Cerrada: "bg-slate-100 text-slate-700",
};

export function EstadoCustodiaBadge({ estado }) {
  const label = texto(estado);
  const clase = ESTADO_CLASE[estado] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${clase}`}>
      {label}
    </span>
  );
}

function Section({ title, bar = "blue", children }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-3 text-sm font-bold text-blue-900">
        <span className={`h-5 w-1 rounded-full ${bar === "yellow" ? "bg-yellow-400" : "bg-blue-900"}`} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ children }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>;
}

function Row({ label, value, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function CustodiaDetalleModal({ detail, onClose }) {
  const detalles = detail?.detalles ?? [];
  const entregas = detail?.entregas ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-blue-900">Detalle de custodia</h2>
            <p className="text-sm text-slate-500">
              {detail?.identificacionMuestra || `Campo #${detail?.idFormatoCampo ?? "—"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!detail ? (
          <p className="p-6 text-sm text-gray-500">Cargando detalle de la custodia…</p>
        ) : (
          <div className="space-y-6 p-6">
            <Section title="Identificación">
              <Grid>
                <Row label="Muestra" value={texto(detail.identificacionMuestra)} />
                <Row label="Formato de campo" value={`#${detail.idFormatoCampo || "—"}`} />
                <Row label="Usuario" value={texto(detail.usuario || detail.usuarioCreacion)} />
                <Row label="Estado" value={<EstadoCustodiaBadge estado={detail.estado} />} />
              </Grid>
            </Section>

            <Section title="Muestras y análisis" bar="yellow">
              {detalles.length === 0 ? (
                <p className="text-sm text-gray-500">No hay muestras registradas en esta cadena.</p>
              ) : (
                <div className="space-y-3">
                  {detalles.map((d, idx) => (
                    <article key={d.idDetalleCustodia ?? idx} className="rounded-xl border border-gray-200 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                        Muestra {idx + 1}
                      </p>
                      <Grid>
                        <Row label="Identificación" value={texto(d.identificacion)} />
                        <Row
                          label="Análisis solicitados"
                          value={texto(d.analisisSolicitado)}
                          wide
                        />
                      </Grid>
                    </article>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Entregas">
              {entregas.length === 0 ? (
                <p className="text-sm text-gray-500">No hay entregas registradas.</p>
              ) : (
                <div className="space-y-3">
                  {entregas.map((e, idx) => (
                    <article key={e.idDetalleEntregaCustodia ?? idx} className="rounded-xl border border-gray-200 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                        Entrega {idx + 1}
                      </p>
                      <Grid>
                        <Row label="Fecha de entrega" value={formatFecha(e.fechaEntrega)} />
                        <Row label="Hora de entrega" value={formatHora(e.horaEntrega)} />
                        <Row label="Fecha de recibido" value={formatFecha(e.fechaRecibido)} />
                        <Row label="Hora de recibido" value={formatHora(e.horaRecibido)} />
                        <Row label="Usuario" value={texto(e.usuario)} />
                        <Row label="Cliente" value={texto(e.cliente)} />
                      </Grid>
                    </article>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
