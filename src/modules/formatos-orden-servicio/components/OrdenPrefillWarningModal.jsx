import { CircleAlert, FileText, ListChecks, X } from "lucide-react";

/**
 * Aviso al crear una orden desde una solicitud que no trae proforma
 * (o la proforma no tiene tipo de muestreo).
 */
export default function OrdenPrefillWarningModal({
  open,
  kind = "sin-proforma",
  numeroSolicitud = "",
  onClose,
  onGoToProforma,
  onContinueHere,
}) {
  if (!open) return null;

  const solicitud = numeroSolicitud ? ` ${numeroSolicitud}` : "";
  const sinProforma = kind === "sin-proforma";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orden-prefill-title"
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <CircleAlert className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="orden-prefill-title" className="text-lg font-bold text-blue-900">
              {sinProforma
                ? "Esta solicitud aún no tiene proforma"
                : "Falta el tipo de muestreo en la proforma"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {sinProforma
                ? `La orden se abrió desde la solicitud${solicitud}, pero no hay una proforma vinculada.`
                : `Hay proforma para la solicitud${solicitud}, pero no indica el tipo de muestreo.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Por qué aparece</p>
            <p className="mt-1 text-sm text-amber-950">
              Al crear la orden desde una solicitud, el sistema copia el número de proforma y el tipo de
              muestreo. Sin esos datos no puede rellenar el campo <span className="font-semibold">Proforma N°</span> ni
              el tipo de muestreo del paso 2. La API exige un tipo de muestreo para guardar la orden.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-900">
              Qué debe hacer (recomendado)
            </p>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
                <p className="font-semibold text-gray-900">1. Crear o completar la proforma</p>
                <p className="mt-1 text-gray-600">
                  Vaya a <span className="font-semibold">Solicitudes de Servicios</span>, menú de acciones (⋮) de esta
                  solicitud, <span className="font-semibold">Crear Proforma</span>. También puede entrar a{" "}
                  <span className="font-semibold">Proformas</span> en el menú lateral.
                </p>
              </li>
              <li className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
                <p className="font-semibold text-gray-900">2. Elegir el tipo de muestreo</p>
                <p className="mt-1 text-gray-600">
                  En el formulario de proforma, campo <span className="font-semibold">Tipo de Muestreo</span>{" "}
                  (Puntual, Compuesto, etc.). Guarde la proforma.
                </p>
              </li>
              <li className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
                <p className="font-semibold text-gray-900">3. Volver a crear la orden</p>
                <p className="mt-1 text-gray-600">
                  En la misma solicitud, menú ⋮ → <span className="font-semibold">Crear Orden de servicio</span>. El
                  sistema copiará Proforma N° y el tipo de muestreo.
                </p>
              </li>
            </ol>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-semibold">Si desea continuar ahora</p>
            <p className="mt-1">
              Puede llenar el tipo de muestreo a mano en el <span className="font-semibold">paso 2 — Servicios
              solicitados</span> de esta orden. El número de proforma quedará vacío hasta que exista una proforma
              vinculada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onContinueHere}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <ListChecks className="h-4 w-4" />
            Completar en el paso 2
          </button>
          <button
            type="button"
            onClick={onGoToProforma}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <FileText className="h-4 w-4" />
            {sinProforma ? "Ir a crear la proforma" : "Ir a la proforma"}
          </button>
        </div>
      </div>
    </div>
  );
}
