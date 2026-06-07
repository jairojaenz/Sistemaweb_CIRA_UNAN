import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaEye, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";

import { useToast } from "../../../components/ToastContext.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";

import {
  createMedioRecepcion,
  getMediosRecepcion,
  toggleMedioRecepcionStatus,
  updateMedioRecepcion,
} from "../service/medioRecepcionService.js";// Estado inicial del formulario de medio de recepción

const initialForm = {
  nombreMedioRecepcion: "",
};// Función de validación para campos individuales del formulario

function validateField(name, value) {
  if (!String(value ?? "").trim()) {
    return "Este campo es requerido";
  }
  return "";
}// Validación en tiempo real para los campos del formulario

export default function GestionMediosRecepcionPage() {
  const { addToast } = useToast();

  const [mediosRecepcion, setMediosRecepcion] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingMedioRecepcion, setEditingMedioRecepcion] = useState(null);

  const [form, setForm] = useState({ ...initialForm });

  const [formErrors, setFormErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);

  const [togglingId, setTogglingId] = useState(null);

  const [detailMedioRecepcion, setDetailMedioRecepcion] = useState(null);

  const loadMediosRecepcion = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMediosRecepcion();
      setMediosRecepcion(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);// Cargar medios de recepción al montar el componente

  useEffect(() => {
    loadMediosRecepcion();
  }, [loadMediosRecepcion]);// Filtrar medios de recepción según el término de búsqueda

  const filteredMediosRecepcion = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return mediosRecepcion;
    return mediosRecepcion.filter((medio) => {
      return (
        medio.nombreMedioRecepcion
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [mediosRecepcion, search]); // Manejar cambios en los campos del formulario y validación en tiempo real

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
      "nombreMedioRecepcion",
    ];
    for (const field of fields) {
      const value = form[field] || "";
      if (!value) return false;
      const error = validateField(field, value);
      if (error) return false;
    }
    return true;
  }// Abrir modal de creación de medio de recepción

  function openCreateModal() {
    setEditingMedioRecepcion(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setModalOpen(true);
  }// Editar medio de recepción

  function openDetailModal(medio) {
    setDetailMedioRecepcion(medio);
}

function closeDetailModal() {
  setDetailMedioRecepcion(null);
}

  function openEditModal(medio) {
    setEditingMedioRecepcion(medio);
    setForm({
      nombreMedioRecepcion: medio.nombreMedioRecepcion || "",
    });
    setFormErrors({});
    setModalOpen(true);
  }// Cerrar modal de creación/edición

  function closeModal() {
    setModalOpen(false);
    setEditingMedioRecepcion(null);
    setFormErrors({});
  }// Guardar medio de recepción (crear o actualizar)

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid()) return;

    setSaving(true);

    try {
      if (editingMedioRecepcion) {
        await updateMedioRecepcion(
          editingMedioRecepcion.idMedioRecepcion,
          form
        );

        addToast(
          "Medio de recepción actualizado exitosamente",
          "success"
        );
      } else {
        await createMedioRecepcion(form);

        addToast(
          "Medio de recepción creado exitosamente",
          "success"
        );
      }

      closeModal();

      await loadMediosRecepcion();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(medio) {
    setTogglingId(medio.idMedioRecepcion);
    try {
      await toggleMedioRecepcionStatus(
        medio.idMedioRecepcion
      );
      addToast(
        medio.activo
          ? "Medio de recepción desactivado exitosamente"
          : "Medio de recepción activado exitosamente",
        "success"
      );
      setMediosRecepcion((prev) =>
        prev.map((item) =>
          item.idMedioRecepcion ===
          medio.idMedioRecepcion 
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
  }// Renderizar la interfaz de gestión de medios de recepción  

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo Medio de Recepción
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
                    Cargando medios de recepción...
                  </span>
                </td>
              </tr>
            ) : filteredMediosRecepcion.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-500 sm:px-6"
                >
                  {search
                    ? "No se encontraron medios de recepción"
                    : "No hay medios de recepción registrados"}
                </td>
              </tr>
            ) : (
              filteredMediosRecepcion.map(
                (medio) => (
                  <tr
                    key={medio.idMedioRecepcion}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {
                        medio.nombreMedioRecepcion
                      }
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          medio.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            medio.activo
                              ? "bg-green-800"
                              : "bg-red-800"
                          }`} // 
                        />

                        {medio.activo
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
                              medio.activo
                            }
                            disabled={
                              togglingId ===
                              medio.idMedioRecepcion
                            }
                            onChange={() =>
                              setConfirmToggle(
                                medio
                              )
                            }
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                        </label>
                        
                        <button
                          type="button"
                          title="Editar medio de recepción"
                          onClick={() =>
                            openEditModal(
                              medio 
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
                            medio
                          )
                        }
                        className="rounded p-1.5 text-blue-900 hover:bg-slate-100">
                         <FaEye className="h-4 w-4" />
                         </button>

                        {togglingId ===
                          medio.idMedioRecepcion && (
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
                {editingMedioRecepcion
                  ? "Editar Medio de Recepción"
                  : "Nuevo Medio de Recepción"}
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
                label="Nombre del Medio de Recepción"
                name="nombreMedioRecepcion"
                value={form.nombreMedioRecepcion}
                error={
                  formErrors.nombreMedioRecepcion
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

                  {editingMedioRecepcion
                    ? "Guardar Cambios"
                    : "Crear Medio de Recepción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailMedioRecepcion && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Detalle del medio de recepción
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
              detailMedioRecepcion.nombreMedioRecepcion
            }
          />

          <DetailRow
            label="Estado"
            value={
              detailMedioRecepcion.activo
                ? "Activo"
                : "Inactivo"
            }
          />

          <DetailRow
            label="ID medio de recepción"
            value={
              detailMedioRecepcion.idMedioRecepcion
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
        } el medio de recepción "${
          confirmToggle?.nombreMedioRecepcion || ""
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