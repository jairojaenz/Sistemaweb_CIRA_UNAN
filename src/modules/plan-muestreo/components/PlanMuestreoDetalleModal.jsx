import { FaTimes } from "react-icons/fa";

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

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
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

export default function PlanMuestreoDetalleModal({ plan, loading, onClose }) {
  const ensayos = plan?.ensayos ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Detalle del plan</h2>
            {plan?.codReferencia ? (
              <p className="text-sm text-slate-500">{plan.codReferencia}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {loading || !plan ? (
          <p className="p-6 text-sm text-gray-500">Cargando detalle del plan…</p>
        ) : (
          <div className="space-y-6 p-6">
            <Section title="Identificación">
              <Grid>
                <Row label="Código de referencia" value={texto(plan.codReferencia)} />
                <Row label="Usuario / Proyecto" value={texto(plan.usuarioProyecto)} />
                <Row label="Proforma" value={texto(plan.formatosProforma)} />
                <Row label="Dirección del usuario" value={texto(plan.direccionUsuario)} />
                <Row label="Con atención a" value={texto(plan.atencionA)} />
                <Row label="Teléfono" value={texto(plan.telefono)} />
                <Row label="Contacto de coordinación" value={texto(plan.contactoCoordinacion)} />
                <Row label="Celular de contacto" value={texto(plan.celularContacto)} />
                <Row label="Dirección del sitio" value={texto(plan.direccionSitio)} />
                <Row label="Fecha del muestreo" value={formatFecha(plan.fechaMuestreo)} />
                <Row label="Hora de salida" value={formatHora(plan.horaSalida)} />
                <Row label="Hora de regreso" value={formatHora(plan.horaRegreso)} />
                <Row label="Muestra" value={texto(plan.muestra)} />
                <Row label="Registrado por" value={texto(plan.usuario)} />
              </Grid>
            </Section>

            <Section title="Detalle del muestreo">
              <Grid>
                <Row label="Tipo de muestreo" value={texto(plan.tiposMuestreo)} />
                <Row
                  label="Hora / intervalo"
                  value={
                    plan.horaPuntual
                      ? `Puntual a las ${formatHora(plan.horaPuntual)}`
                      : [plan.horasCompuesto, plan.otroTiempoCompuesto].filter(Boolean).join(" · ") || "—"
                  }
                />
                <Row label="Coordinador" value={texto(plan.coordinador)} />
                <Row label="Reemplazo del coordinador" value={texto(plan.reemplazoCoordinador)} />
              </Grid>

              {(plan.puntos ?? []).length > 0 ? (
                <div className="mt-4 space-y-3">
                  {plan.puntos.map((p, idx) => (
                    <article key={p.idPuntoPlan ?? idx} className="rounded-lg border border-gray-200 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                        Punto de muestreo {p.orden || idx + 1}
                      </p>
                      <Grid>
                        <Row label="Lugar" value={texto(p.lugarMuestreo)} />
                        <Row label="Identificación" value={texto(p.identificacionMuestra)} />
                        <Row label="Coordenadas" value={texto(p.coordenadas)} wide />
                        <Row label="Matriz" value={texto(p.matriz)} />
                        <Row label="Fuente" value={texto(p.fuente)} />
                        <Row label="Tipo de envase" value={texto(p.tipoEnvaseVolumen)} />
                        <Row label="Preservantes" value={texto(p.preservantes)} />
                        <Row
                          label="Ensayos"
                          value={texto((p.nombresAnalisis ?? []).join(", "))}
                          wide
                        />
                      </Grid>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Ensayo / análisis</th>
                        <th className="px-3 py-2 font-semibold">Tipo de envase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ensayos.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-3 py-3 text-gray-500">
                            Sin puntos ni ensayos asociados
                          </td>
                        </tr>
                      ) : (
                        ensayos.map((e, idx) => (
                          <tr key={e.idMuestraxAnalisis ?? e.idAnalisis ?? idx}>
                            <td className="px-3 py-2 text-gray-900">
                              {texto(e.nombreAnalisis || (e.idAnalisis ? `Análisis #${e.idAnalisis}` : ""))}
                            </td>
                            <td className="px-3 py-2 text-gray-700">{texto(e.tipoEnvaseMuestra)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Observaciones">
              <Grid>
                <Row label="Observaciones del muestreo" value={texto(plan.observaciones)} wide />
                <Row label="Comentarios del coordinador" value={texto(plan.observacionCoordinador)} wide />
              </Grid>
            </Section>

            <Section title="Firmas y cierre">
              <div className="space-y-4">
                <article className="rounded-lg border border-gray-200 bg-slate-50/70 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                    Elaboró
                  </p>
                  <Grid>
                    <Row label="Nombre y firma" value={texto(plan.usuarioElaboracion)} />
                    <Row
                      label="Fecha y hora"
                      value={`${formatFecha(plan.fechaElaboracion)} · ${formatHora(plan.horaElaboracion)}`}
                    />
                  </Grid>
                </article>
                <article className="rounded-lg border border-gray-200 bg-slate-50/70 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                    Recibido por el usuario
                  </p>
                  <Grid>
                    <Row label="Nombre y firma" value={texto(plan.clienteFinalizacion)} />
                    <Row
                      label="Fecha y hora"
                      value={`${formatFecha(plan.fechaFinalizacion)} · ${formatHora(plan.horaFinalizacion)}`}
                    />
                  </Grid>
                </article>
                <article className="rounded-lg border border-gray-200 bg-slate-50/70 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                    Entrega
                  </p>
                  <Grid>
                    <Row label="Nombre y firma" value={texto(plan.usuarioEntrega)} />
                    <Row
                      label="Fecha y hora"
                      value={`${formatFecha(plan.fechaEntrega)} · ${formatHora(plan.horaEntrega)}`}
                    />
                  </Grid>
                </article>
              </div>
            </Section>

            <div className="flex justify-end border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
