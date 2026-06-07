import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaEye, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";

import { useToast } from "../../../components/ToastContext.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";

import {
  createPreservante,
  getPreservantes,
  togglePreservanteStatus,
  updatePreservante,
} from "../service/preservanteServicio.js";// Estado inicial del formulario de preservante

const initialForm = {
  nombrePreservante: "",
};// Función de validación para campos individuales del formulario

function validateField(name, value) {
  if (!String(value ?? "").trim()) {
    return "Este campo es requerido";
  }
  return "";
}// Validación en tiempo real para los campos del formulario

export default function GestionPreservantesPage() {
  const { addToast } = useToast();

  const [preservantes, setPreservantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingPreservante, setEditingPreservante] = useState(null);

  const [form, setForm] = useState({ ...initialForm });

  const [formErrors, setFormErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);

  const [togglingId, setTogglingId] = useState(null);

  const [detailPreservante, setDetailPreservante] = useState(null);

  const loadPreservantes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPreservantes();
      setPreservantes(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);// Cargar preservantes al montar el componente

  useEffect(() => {
    loadPreservantes();
  }, [loadPreservantes]);// Filtrar preservantes según el término de búsqueda

  const filteredPreservantes = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return preservantes;
    return preservantes.filter((preservante) => {
      return (
        preservante.nombrePreservante
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [preservantes, search]); // Manejar cambios en los campos del formulario y validación en tiempo real

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    const error = validateField(name, value);
    setFormErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }// Validar todo el formulario antes de enviar

  function isFormValid() {
    const fields = [
      "nombrePreservante",
    ];
    for (const field of fields) {
      const value = form[field] || "";
      if (!value) return false;
      const error = validateField(field, value);
      if (error) return false;
    }
    return true;
  }// Abrir modal de creación de preservante

  function openCreateModal() {
    setEditingPreservante(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setModalOpen(true);
  }// Editar preservante existente

  function openDetailModal(preservante) {
    setDetailPreservante(preservante);
}

function closeDetailModal() {
  setDetailPreservante(null);
}

  function openEditModal(preservante) {
    setEditingPreservante(preservante);
    setForm({
      nombrePreservante: preservante.nombrePreservante || "",
    });
    setFormErrors({});
    setModalOpen(true);
  }// Cerrar modal de creación/edición

  function closeModal() {
    setModalOpen(false);
    setEditingPreservante(null);
    setFormErrors({});
  }// Guardar preservante (crear o actualizar)

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid()) return;

    setSaving(true);

    try {
      if (editingPreservante) {
        await updatePreservante(
          editingPreservante.idPreservante,
          form
        );

        addToast(
          "Preservante actualizado exitosamente",
          "success"
        );
      } else {
        await createPreservante(form);

        addToast(
          "Preservante creado exitosamente",
          "success"
        );
      }

      closeModal();

      await loadPreservantes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(preservante) {
    setTogglingId(preservante.idPreservante);
    try {
      await togglePreservanteStatus(
        preservante.idPreservante
      );
      addToast(
        preservante.activo
          ? "Preservante desactivado exitosamente"
          : "Preservante activado exitosamente",
        "success"
      );
      setPreservantes((prev) =>
        prev.map((item) =>
          item.idPreservante ===
          preservante.idPreservante 
            ? {
                ...item,
                activo: !item.activo,
              }
            : item
        )
      );
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setTogglingId(null);
      setConfirmToggle(null);
    }
  }// Renderizar la interfaz de gestión de preservantes

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo Preservante
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />

        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Nombre
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Estado
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Acciones
                <div className="flex items-center gap-2"></div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-500 sm:px-6"
                >
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />

                  <span className="mt-2 block">
                    Cargando preservantes...
                  </span>
                </td>
              </tr>
            ) : filteredPreservantes.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-500 sm:px-6"
                >
                  {search
                    ? "No se encontraron preservantes"
                    : "No hay preservantes registrados"}
                </td>
              </tr>
            ) : (
              filteredPreservantes.map(
                (preservante) => (
                  <tr
                    key={preservante.idPreservante}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {
                        preservante.nombrePreservante
                      }
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          preservante.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            preservante.activo
                              ? "bg-green-800"
                              : "bg-red-800"
                          }`} // 
                        />

                        {preservante.activo
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={
                              preservante.activo
                            }
                            disabled={
                              togglingId ===
                              preservante.idPreservante
                            }
                            onChange={() =>
                              setConfirmToggle(
                                preservante
                              )
                            }
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                        </label>
                        
                        <button
                          type="button"
                          title="Editar preservante"
                          onClick={() =>
                            openEditModal(
                              preservante
                            )
                          }
                          className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>

                      <button
                        type="button"
                        title="Ver detalle"
                        onClick={() => 
                          openDetailModal(
                            preservante
                          )
                        }
                        className="rounded p-1.5 text-blue-900 hover:bg-slate-100">
                         <FaEye className="h-4 w-4" />
                         </button>

                        {togglingId ===
                          preservante.idPreservante && (
                          <FaSpinner className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
       
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingPreservante
                  ? "Editar Preservante"
                  : "Nuevo Preservante"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
              noValidate
            >
              <InputField
                label="Nombre del Preservante"
                name="nombrePreservante"
                value={form.nombrePreservante}
                error={
                  formErrors.nombrePreservante
                }
                onChange={handleFormChange}
                required
              />

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
                  disabled={
                    !isFormValid() || saving
                  }
                  className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <FaSpinner className="h-4 w-4 animate-spin" />
                  )}

                  {editingPreservante
                    ? "Guardar Cambios"
                    : "Crear Preservante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailPreservante && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Detalle del preservante
        </h2>

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
          <DetailRow
            label="Nombre"
            value={
              detailPreservante.nombrePreservante
            }
          />

          <DetailRow
            label="Estado"
            value={
              detailPreservante.activo
                ? "Activo"
                : "Inactivo"
            }
          />

          <DetailRow
            label="ID Preservante"
            value={
              detailPreservante.idPreservante
            }
          />
        </dl>

        <div className="flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={closeDetailModal}
            className="rounded-md bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      <ConfirmDialog
        open={!!confirmToggle}
        title="Cambiar Estado"
        message={`¿Está seguro de que desea ${
          confirmToggle?.activo
            ? "desactivar"
            : "activar"
        } el preservante "${
          confirmToggle?.nombrePreservante || ""
        }"?`}
        confirmText={
          confirmToggle?.activo
            ? "Desactivar"
            : "Activar"
        }
        confirmClass={
          confirmToggle?.activo
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }
        onConfirm={() =>
          handleToggleStatus(confirmToggle)
        }
        onCancel={() =>
          setConfirmToggle(null)
        }
      />
      
    </div>
  );
}

function InputField({
  label,
  name,
  type = "text",
  value,
  error,
  onChange,
  required,
  placeholder,
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}

        {required && (
          <span className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${
          error
            ? "border-red-400 ring-1 ring-red-400"
            : ""
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-2 sm:grid-cols-3">
      <dt className="text-sm font-medium text-gray-600">
        {label}
      </dt>

      <dd className="text-sm text-gray-900 sm:col-span-2">
        {value || "—"}
      </dd>
    </div>
  );
}