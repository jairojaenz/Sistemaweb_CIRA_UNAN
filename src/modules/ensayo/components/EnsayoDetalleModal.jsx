import { X } from "lucide-react";

function texto(value) {
  const t = String(value ?? "").trim();
  return t || "—";
}

function formatFecha(value) {
  const t = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const [y, m, d] = t.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return t || "—";
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

export default function EnsayoDetalleModal({ detail, onClose }) {
  const resultados = detail?.resultados ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-blue-900">Detalle de ensayo</h2>
            <p className="text-sm text-slate-500">
              Orden {detail?.numeroOrden ?? `#${detail?.idFormatoOrden ?? "—"}`}
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
          <p className="p-6 text-sm text-gray-500">Cargando detalle del ensayo…</p>
        ) : (
          <div className="space-y-6 p-6">
            <Section title="Identificación">
              <Grid>
                <Row label="Orden de servicio" value={texto(detail.numeroOrden ?? `#${detail.idFormatoOrden}`)} />
                <Row label="Laboratorio" value={texto(detail.nombreLaboratorio)} />
                <Row label="Elaboró" value={texto(detail.usuarioElaboracion)} />
                <Row label="Datos de campo" value={detail.datosCampo ? "Sí" : "No"} />
              </Grid>
            </Section>

            <Section title="Periodo y condiciones" bar="yellow">
              <Grid>
                <Row label="Fecha de inicio" value={formatFecha(detail.fechaInicio)} />
                <Row label="Fecha de fin" value={formatFecha(detail.fechaFin)} />
                <Row label="Plan de muestreo" value={texto(detail.planMuestreo)} wide />
                <Row label="Condiciones ambientales" value={texto(detail.condicionesAmbientales)} />
                <Row label="Condiciones del ítem" value={texto(detail.condicionesItem)} />
                <Row label="Clave" value={texto(detail.clave)} />
                <Row label="Equivalencia" value={texto(detail.equivalencia)} />
                <Row label="Observaciones" value={texto(detail.observaciones)} wide />
              </Grid>
            </Section>

            <Section title="Resultados">
              {resultados.length === 0 ? (
                <p className="text-sm text-gray-500">No hay resultados capturados.</p>
              ) : (
                <div className="space-y-3">
                  {resultados.map((r, idx) => (
                    <article key={r.idResultadosFormatoEnsayo ?? idx} className="rounded-xl border border-gray-200 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                        Resultado {idx + 1}
                      </p>
                      <Grid>
                        <Row label="Muestra" value={texto(r.identificacionMuestra)} />
                        <Row label="Análisis" value={texto(r.nombreAnalisis)} />
                        <Row label="Método" value={texto(r.metodo)} />
                        <Row label="Resultado" value={texto(r.resultado)} />
                        <Row label="Unidad" value={texto(r.unidad)} />
                        <Row label="Límite / rango" value={texto(r.limiteRangoCuantificacion)} />
                        <Row label="Incertidumbre" value={texto(r.incertidumbre)} />
                        <Row label="Meq" value={texto(r.meq)} />
                        <Row label="VMA" value={texto(r.valorMaximoAdmisible)} />
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
