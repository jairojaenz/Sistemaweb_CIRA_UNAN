/**
 * Modal de errores al crear la orden: campo, paso y formato esperado.
 */
export default function OrdenValidationModal({
  open,
  issues = [],
  apiMessage = "",
  isEditing = false,
  onClose,
  onGoToStep,
}) {
  if (!open) return null;

  const grouped = issues.reduce((acc, item) => {
    const key = item.stepLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const firstStep = issues[0]?.step ?? 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-blue-900">
          {isEditing ? "No se pudo guardar la orden" : "No se pudo crear la orden"}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Revise los campos indicados. Cada uno muestra el paso donde está y cómo debe llenarse.
        </p>

        {apiMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <p className="font-semibold">Respuesta del servidor</p>
            <p className="mt-0.5">{apiMessage}</p>
          </div>
        )}

        {issues.length > 0 && (
          <div className="mt-4 space-y-4">
            {Object.entries(grouped).map(([stepLabel, items]) => (
              <div key={stepLabel}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-900">{stepLabel}</p>
                  <button
                    type="button"
                    onClick={() => onGoToStep(items[0].step)}
                    className="text-xs font-semibold text-blue-800 hover:underline"
                  >
                    Ir a este paso
                  </button>
                </div>
                <ul className="mt-2 space-y-2">
                  {items.map((item) => (
                    <li
                      key={`${item.step}-${item.field}`}
                      className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <p className="font-semibold text-gray-800">
                        {item.label}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.tipo === "vacio"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.tipo === "vacio" ? "Vacío" : "Formato"}
                        </span>
                      </p>
                      <p className="mt-1 text-gray-600">{item.detalle}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        <span className="font-semibold">Cómo llenarlo:</span> {item.formato}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!apiMessage && issues.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">Ocurrió un error al guardar. Intente de nuevo.</p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cerrar
          </button>
          {issues.length > 0 && (
            <button
              type="button"
              onClick={() => onGoToStep(firstStep)}
              className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Ir al {issues[0].stepLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
