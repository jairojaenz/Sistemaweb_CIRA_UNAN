export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmClass = "bg-red-600 hover:bg-red-700",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Procesando…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
