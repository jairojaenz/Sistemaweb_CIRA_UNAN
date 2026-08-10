import { useState } from "react";
import { FaEye, FaEyeSlash, FaKey, FaSpinner, FaTimes } from "react-icons/fa";
import { changePassword } from "../modules/auth/service/authService.js";

/**
 * Modal para cambiar contraseña (POST /api/auth/change-password).
 * Tras éxito la API invalida sesiones → el padre debe cerrar sesión y volver al login.
 *
 * @param {{ open: boolean, onClose: () => void, onSuccess: () => void | Promise<void> }} props
 */
export default function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function resetForm() {
    setActual("");
    setNueva("");
    setConfirmacion("");
    setShowActual(false);
    setShowNueva(false);
    setError("");
    setSaving(false);
  }

  function handleClose() {
    if (saving) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!actual.trim()) {
      setError("Ingrese la contraseña actual.");
      return;
    }
    if (nueva.length < 6) {
      setError("La contraseña nueva debe tener al menos 6 caracteres.");
      return;
    }
    if (nueva !== confirmacion) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    if (nueva === actual) {
      setError("La contraseña nueva debe ser diferente a la actual.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(actual, nueva);
      resetForm();
      await onSuccess?.();
    } catch (err) {
      setError(err?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
        role="dialog"
        aria-labelledby="change-password-title"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3
            id="change-password-title"
            className="flex items-center gap-2 text-lg font-semibold text-gray-800"
          >
            <FaKey className="h-4 w-4 text-blue-900" />
            Cambiar contraseña
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          <p className="text-sm text-gray-600">
            Tras cambiar la contraseña se cerrará la sesión y deberá iniciar sesión de nuevo.
          </p>

          <PasswordField
            label="Contraseña actual"
            value={actual}
            onChange={setActual}
            show={showActual}
            onToggleShow={() => setShowActual((v) => !v)}
            autoComplete="current-password"
            disabled={saving}
          />
          <PasswordField
            label="Contraseña nueva"
            value={nueva}
            onChange={setNueva}
            show={showNueva}
            onToggleShow={() => setShowNueva((v) => !v)}
            autoComplete="new-password"
            disabled={saving}
            hint="Mínimo 6 caracteres"
          />
          <PasswordField
            label="Confirmar contraseña nueva"
            value={confirmacion}
            onChange={setConfirmacion}
            show={showNueva}
            onToggleShow={() => setShowNueva((v) => !v)}
            autoComplete="new-password"
            disabled={saving}
          />

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  disabled,
  hint,
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          className="input w-full pr-10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
          tabIndex={-1}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
