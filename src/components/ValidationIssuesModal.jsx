import { CircleAlert, ClipboardList, X } from "lucide-react";

/**
 * Modal de validación: campos vacíos, formato incorrecto o error al guardar.
 */
export default function ValidationIssuesModal({
  open,
  title,
  description,
  issues = [],
  apiMessage = "",
  onClose,
  onGoToStep,
  primaryLabel,
}) {
  if (!open) return null;

  const grouped = issues.reduce((acc, item) => {
    const key = item.stepLabel || `Paso ${item.step ?? ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const firstStep = issues[0]?.step;
  const count = issues.length;
  const defaultPrimary =
    firstStep != null ? `Ir al paso ${firstStep}` : "Entendido";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="validation-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <CircleAlert className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="validation-modal-title" className="text-lg font-bold text-blue-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
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

        <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-6 py-5">
          {apiMessage ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                Motivo
              </p>
              <p className="mt-1 text-sm font-medium text-red-800">{apiMessage}</p>
            </div>
          ) : null}

          {count > 0 ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden />
              {count === 1 ? "1 pendiente" : `${count} pendientes`}
            </div>
          ) : null}

          {count > 0 ? (
            <div className="space-y-5">
              {Object.entries(grouped).map(([stepLabel, items]) => (
                <div key={stepLabel}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-900">
                      {stepLabel}
                    </p>
                    {onGoToStep && items[0]?.step != null ? (
                      <button
                        type="button"
                        onClick={() => onGoToStep(items[0].step)}
                        className="text-xs font-semibold text-blue-800 hover:underline"
                      >
                        Ir a este paso
                      </button>
                    ) : null}
                  </div>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={`${item.step}-${item.field}-${item.tipo}`}
                        className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              item.tipo === "formato"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.tipo === "formato" ? "Formato" : "Requerido"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{item.detalle}</p>
                        {item.formato ? (
                          <p className="mt-1.5 text-xs text-gray-500">
                            <span className="font-semibold text-gray-600">Cómo resolverlo:</span>{" "}
                            {item.formato}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {!apiMessage && count === 0 ? (
            <p className="text-sm text-gray-600">
              Ocurrió un error inesperado. Intente de nuevo o revise los datos del formulario.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
          {onGoToStep && firstStep != null ? (
            <button
              type="button"
              onClick={() => onGoToStep(firstStep)}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {primaryLabel || defaultPrimary}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {primaryLabel || "Entendido"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
