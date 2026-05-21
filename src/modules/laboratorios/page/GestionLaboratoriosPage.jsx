import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaEye, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";

import { useToast } from "../../../components/ToastContext.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";

import {
  createLaboratorio,
  deleteLaboratorio,
  getLaboratorios,
  toggleLaboratorioStatus,
  updateLaboratorio,
} from "../service/laboratorioService.js";// Estado inicial del formulario de laboratorio

const initialForm = {
  nombreLaboratorio: "",
  abreviacionLaboratorio: "",
};// Función de validación para campos individuales del formulario

function validateField(name, value) {
  if (!String(value ?? "").trim()) {
    return "Este campo es requerido";
  }
  return "";
}// Validación en tiempo real para los campos del formulario

export default function GestionLaboratoriosPage() {
  const { addToast } = useToast();

  const [laboratorios, setLaboratorios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingLaboratorio, setEditingLaboratorio] = useState(null);

  const [form, setForm] = useState({ ...initialForm });

  const [formErrors, setFormErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);

  const [togglingId, setTogglingId] = useState(null);

  const [detailLaboratorio, setDetailLaboratorio] = useState(null);

  const loadLaboratorios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLaboratorios();
      setLaboratorios(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);// Cargar laboratorios al montar el componente

  useEffect(() => {
    loadLaboratorios();
  }, [loadLaboratorios]);// Filtrar laboratorios según el término de búsqueda

  const filteredLaboratorios = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return laboratorios;
    return laboratorios.filter((laboratorio) => {
      return (
        laboratorio.nombreLaboratorio
          ?.toLowerCase()
          .includes(query) ||
        laboratorio.abreviacionLaboratorio
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [laboratorios, search]); // Manejar cambios en los campos del formulario y validación en tiempo real

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
      "nombreLaboratorio",
      "abreviacionLaboratorio",
    ];
    for (const field of fields) {
      const value = form[field] || "";
      if (!value) return false;
      const error = validateField(field, value);
      if (error) return false;
    }
    return true;
  }// Abrir modal de creación de laboratorio

  function openCreateModal() {
    setEditingLaboratorio(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setModalOpen(true);
  }// Editar laboratorio  

  function openDetailModal(laboratorio) {
  setDetailLaboratorio(laboratorio);
}

function closeDetailModal() {
  setDetailLaboratorio(null);
}

  function openEditModal(laboratorio) {
    setEditingLaboratorio(laboratorio);
    setForm({
      nombreLaboratorio: laboratorio.nombreLaboratorio || "",
      abreviacionLaboratorio: laboratorio.abreviacionLaboratorio || "",
    });
    setFormErrors({});
    setModalOpen(true);
  }// Cerrar modal de creación/edición

  function closeModal() {
    setModalOpen(false);
    setEditingLaboratorio(null);
    setFormErrors({});
  }// Guardar laboratorio (crear o actualizar)

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid()) return;

    setSaving(true);

    try {
      if (editingLaboratorio) {
        await updateLaboratorio(
          editingLaboratorio.idLaboratorio,
          form
        );

        addToast(
          "Laboratorio actualizado exitosamente",
          "success"
        );
      } else {
        await createLaboratorio(form);

        addToast(
          "Laboratorio creado exitosamente",
          "success"
        );
      }

      closeModal();

      await loadLaboratorios();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }// 

  async function handleDelete(laboratorio) {
    try {
      await deleteLaboratorio(
        laboratorio.idLaboratorio
      );
      addToast(
        "Laboratorio eliminado exitosamente",
        "success"
      );
      await loadLaboratorios();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setConfirmDelete(null);
    }
  }// Cambiar estado de activo/inactivo del laboratorio

  async function handleToggleStatus(laboratorio) {
    setTogglingId(laboratorio.idLaboratorio);
    try {
      await toggleLaboratorioStatus(
        laboratorio.idLaboratorio
      );
      addToast(
        laboratorio.activo
          ? "Laboratorio desactivado exitosamente"
          : "Laboratorio activado exitosamente",
        "success"
      );
      setLaboratorios((prev) =>
        prev.map((item) =>
          item.idLaboratorio ===
          laboratorio.idLaboratorio
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
  }// Renderizar la interfaz de gestión de laboratorios

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo Laboratorio
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          type="text"
          placeholder="Buscar por nombre o abreviación..."
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
                Abreviación
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
                    Cargando laboratorios...
                  </span>
                </td>
              </tr>
            ) : filteredLaboratorios.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-500 sm:px-6"
                >
                  {search
                    ? "No se encontraron laboratorios"
                    : "No hay laboratorios registrados"}
                </td>
              </tr>
            ) : (
              filteredLaboratorios.map(
                (laboratorio) => (
                  <tr
                    key={laboratorio.idLaboratorio}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {
                        laboratorio.nombreLaboratorio
                      }
                    </td>

                    <td className="px-4 py-3 text-gray-600 sm:px-6">
                      {
                        laboratorio.abreviacionLaboratorio
                      }
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          laboratorio.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            laboratorio.activo
                              ? "bg-green-800"
                              : "bg-red-800"
                          }`} // 
                        />

                        {laboratorio.activo
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
                              laboratorio.activo
                            }
                            disabled={
                              togglingId ===
                              laboratorio.idLaboratorio
                            }
                            onChange={() =>
                              setConfirmToggle(
                                laboratorio
                              )
                            }
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                        </label>
                        
                        <button
                          type="button"
                          title="Editar laboratorio"
                          onClick={() =>
                            openEditModal(
                              laboratorio
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
                            laboratorio
                          )
                        }
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100">
                         <FaEye className="h-4 w-4" />
                         </button>

                        {togglingId ===
                          laboratorio.idLaboratorio && (
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
                {editingLaboratorio
                  ? "Editar Laboratorio"
                  : "Nuevo Laboratorio"}
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
                label="Nombre del Laboratorio"
                name="nombreLaboratorio"
                value={form.nombreLaboratorio}
                error={
                  formErrors.nombreLaboratorio
                }
                onChange={handleFormChange}
                required
              />

              <InputField
                label="Abreviación"
                name="abreviacionLaboratorio"
                value={
                  form.abreviacionLaboratorio
                }
                error={
                  formErrors.abreviacionLaboratorio
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

                  {editingLaboratorio
                    ? "Guardar Cambios"
                    : "Crear Laboratorio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detailLaboratorio && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Detalle del laboratorio
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
              detailLaboratorio.nombreLaboratorio
            }
          />

          <DetailRow
            label="Abreviación"
            value={
              detailLaboratorio.abreviacionLaboratorio
            }
          />

          <DetailRow
            label="Estado"
            value={
              detailLaboratorio.activo
                ? "Activo"
                : "Inactivo"
            }
          />

          <DetailRow
            label="ID Laboratorio"
            value={
              detailLaboratorio.idLaboratorio
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
        } el laboratorio "${
          confirmToggle?.nombreLaboratorio || ""
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