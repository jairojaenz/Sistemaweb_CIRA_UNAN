import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaEye, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import {
  createMatriz,
  getMatrices,
  normalizeMatrizFromApi,
  toggleMatrizStatus,
  updateMatriz,
} from "../service/matrizService.js";

const initialForm = {
  nombreMatriz: "",
  activo: true,
};

function mapMatrizToForm(m) {
  return {
    nombreMatriz: m.nombreMatriz ?? "",
    activo: m.activo !== false,
  };
}

function isMatrizActiva(m) {
  return m.activo !== false;
}

function validateField(name, value) {
  if (name === "nombreMatriz" && !String(value ?? "").trim()) {
    return "Este campo es requerido";
  }
  return "";
}

export default function MatrizPage() {
  const { addToast } = useToast();

  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailMatriz, setDetailMatriz] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadMatrices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMatrices();
      setMatrices(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadMatrices();
  }, [loadMatrices]);

  const filteredMatrices = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return matrices;
    return matrices.filter((m) => m.nombreMatriz?.toLowerCase().includes(q));
  }, [matrices, search]);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    const nextVal = type === "checkbox" ? checked : value;
    const merged = { ...form, [name]: nextVal };
    setForm(merged);
    setFormErrors((prev) => ({
      ...prev,
      [name]: validateField(name, merged[name]),
    }));
  }

  function isFormValid() {
    return !validateField("nombreMatriz", form.nombreMatriz);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function openCreateModal() {
    setDetailMatriz(null);
    setEditingId(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(m) {
    setDetailMatriz(null);
    setEditingId(m.idMatriz);
    setForm(mapMatrizToForm(m));
    setFormErrors({});
    setModalOpen(true);
  }

  function openDetailModal(m) {
    setModalOpen(false);
    setEditingId(null);
    setDetailMatriz(normalizeMatrizFromApi(m));
  }

  function closeDetailModal() {
    setDetailMatriz(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;
    setSaving(true);
    try {
      if (editingId != null) {
        await updateMatriz(editingId, form);
        addToast("Matriz actualizada correctamente.", "success");
      } else {
        await createMatriz(form);
        addToast("Matriz creada exitosamente", "success");
      }
      closeModal();
      await loadMatrices();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(matriz) {
    setTogglingId(matriz.idMatriz);
    try {
      await toggleMatrizStatus(matriz);
      const estabaActiva = isMatrizActiva(matriz);
      addToast(
        estabaActiva ? "Matriz desactivada exitosamente" : "Matriz activada exitosamente",
        "success"
      );
      setMatrices((prev) =>
        prev.map((m) =>
          m.idMatriz === matriz.idMatriz ? { ...m, activo: !estabaActiva } : m
        )
      );
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setTogglingId(null);
      setConfirmToggle(null);
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-white text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">Matrices</div>

      <main className="flex flex-grow justify-center bg-white py-6 px-4 sm:py-8">
        <div className="flex w-full max-w-6xl flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              <FaPlus className="h-4 w-4" />
              Nueva Matriz
            </button>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de matriz..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold sm:px-6">Nombre</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                      <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                      <span className="mt-2 block">Cargando matrices...</span>
                    </td>
                  </tr>
                ) : filteredMatrices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                      {search ? "No se encontraron matrices" : "No hay matrices registradas"}
                    </td>
                  </tr>
                ) : (
                  filteredMatrices.map((m) => (
                    <tr key={m.idMatriz} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                        {m.nombreMatriz}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isMatrizActiva(m)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isMatrizActiva(m) ? "bg-green-800" : "bg-red-800"
                            }`}
                          />
                          {isMatrizActiva(m) ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isMatrizActiva(m)}
                              disabled={togglingId === m.idMatriz}
                              onChange={() => setConfirmToggle(m)}
                            />
                            <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                          </label>

                          <button
                            type="button"
                            title="Editar matriz"
                            onClick={() => openEditModal(m)}
                            className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() => openDetailModal(m)}
                            className="rounded p-1.5 text-blue-900 hover:bg-slate-100"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>

                          {togglingId === m.idMatriz && (
                            <FaSpinner className="h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-blue-900 py-2 text-center text-white">
        <p>© {new Date().getFullYear()} CIRA - UNAN Managua | Gestión de Matrices</p>
      </footer>

      {detailMatriz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de la matriz</h2>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <dl className="space-y-3">
                <DetailRow label="ID" value={detailMatriz.idMatriz} />
                <DetailRow label="Nombre" value={detailMatriz.nombreMatriz} />
                <DetailRow
                  label="Estado"
                  value={isMatrizActiva(detailMatriz) ? "Activo" : "Inactivo"}
                />
              </dl>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId != null ? "Actualizar matriz" : "Nueva Matriz"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
              <InputField
                label="Nombre de la matriz"
                name="nombreMatriz"
                value={form.nombreMatriz}
                error={formErrors.nombreMatriz}
                onChange={handleFormChange}
                required
                placeholder="Ej. Agua, Suelo, Aire..."
              />

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleFormChange}
                  className="rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                />
                Matriz activa
              </label>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || saving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
                  {editingId != null ? "Guardar cambios" : "Crear Matriz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmToggle}
        title="Cambiar Estado"
        message={`¿Está seguro de que desea ${
          confirmToggle && isMatrizActiva(confirmToggle) ? "desactivar" : "activar"
        } la matriz "${confirmToggle?.nombreMatriz ?? ""}"?`}
        confirmText={
          confirmToggle && isMatrizActiva(confirmToggle) ? "Desactivar" : "Activar"
        }
        confirmClass={
          confirmToggle && isMatrizActiva(confirmToggle)
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />

    </div>
  );
}

function DetailRow({ label, value }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 sm:grid-cols-3 sm:gap-2">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">{display}</dd>
    </div>
  );
}

function InputField({ label, name, value, error, onChange, required, placeholder }) {
  const id = `matriz-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={id}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? "border-red-400 ring-1 ring-red-400" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
