import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaEye, FaSpinner, FaTimes, FaTrash} from "react-icons/fa";

import { useToast } from "../../../components/ToastContext.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";

import {
  createServicio,
  getServicios,
  toggleServicioStatus,
  updateServicio,
} from "../service/servicioService.js";// Estado inicial del formulario de servicio

const initialForm = {
  nombreServicio: "",
};// Función de validación para campos individuales del formulario

function validateField(name, value) {
  if (!String(value ?? "").trim()) {
    return "Este campo es requerido";
  }
  return "";
}// Validación en tiempo real para los campos del formulario

export default function GestionServiciosPage() {
  const { addToast } = useToast();

  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingServicio, setEditingServicio] = useState(null);

  const [form, setForm] = useState({ ...initialForm });

  const [formErrors, setFormErrors] = useState({});

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] = useState(null);

  const [togglingId, setTogglingId] = useState(null);

  const [detailServicio, setDetailServicio] = useState(null);

  const loadServicios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getServicios();
      setServicios(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);// Cargar servicios al montar el componente

  useEffect(() => {
    loadServicios();
  }, [loadServicios]);// Filtrar servicios según el término de búsqueda

  const filteredServicios = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return servicios;
    return servicios.filter((servicio) => {
      return (
        servicio.nombreServicio
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [servicios, search]); // Manejar cambios en los campos del formulario y validación en tiempo real

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
      "nombreServicio",
    ];
    for (const field of fields) {
      const value = form[field] || "";
      if (!value) return false;
      const error = validateField(field, value);
      if (error) return false;
    }
    return true;
  }// Abrir modal de creación de servicio

  function openCreateModal() {
    setEditingServicio(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setModalOpen(true);
  }// Editar servicio

  function openDetailModal(servicio) {
    setDetailServicio(servicio);
}

function closeDetailModal() {
  setDetailServicio(null);
}

  function openEditModal(servicio) {
    setEditingServicio(servicio);
    setForm({
      nombreServicio: servicio.nombreServicio || "",
    });
    setFormErrors({});
    setModalOpen(true);
  }// Cerrar modal de creación/edición

  function closeModal() {
    setModalOpen(false);
    setEditingServicio(null);
    setFormErrors({});
  }// Guardar servicio (crear o actualizar)

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isFormValid()) return;

    setSaving(true);

    try {
      if (editingServicio) {
        await updateServicio(
          editingServicio.idServicio,
          form
        );

        addToast(
          "Servicio actualizado exitosamente",
          "success"
        );
      } else {
        await createServicio(form);

        addToast(
          "Servicio creado exitosamente",
          "success"
        );
      }

      closeModal();

      await loadServicios();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }
  
  async function handleToggleStatus(servicio) {
    setTogglingId(servicio.idServicio);
    try {
      await toggleServicioStatus(
        servicio.idServicio
      );
      addToast(
        servicio.activo
          ? "Servicio desactivado exitosamente"
          : "Servicio activado exitosamente",
        "success"
      );
      setServicios((prev) =>
        prev.map((item) =>
          item.idServicio ===
          servicio.idServicio 
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
  }// Renderizar la interfaz de gestión de servicios

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo Servicio
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
                    Cargando servicios...
                  </span>
                </td>
              </tr>
            ) : filteredServicios.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-gray-500 sm:px-6"
                >
                  {search
                    ? "No se encontraron servicios"
                    : "No hay servicios registrados"}
                </td>
              </tr>
            ) : (
              filteredServicios.map(
                (servicio) => (
                  <tr
                    key={servicio.idServicio}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {
                        servicio.nombreServicio
                      }
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          servicio.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            servicio.activo
                              ? "bg-green-800"
                              : "bg-red-800"
                          }`} // 
                        />

                        {servicio.activo
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
                              servicio.activo
                            }
                            disabled={
                              togglingId ===
                              servicio.idServicio
                            }
                            onChange={() =>
                              setConfirmToggle(
                                servicio
                              )
                            }
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                        </label>
                        
                        <button
                          type="button"
                          title="Editar servicio"
                          onClick={() =>
                            openEditModal(
                              servicio
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
                            servicio
                          )
                        }
                        className="rounded p-1.5 text-blue-900 hover:bg-slate-100">
                         <FaEye className="h-4 w-4" />
                         </button>

                        {togglingId ===
                          servicio.idServicio && (
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
                {editingServicio
                  ? "Editar Servicio"
                  : "Nuevo Servicio"}
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
                label="Nombre del Servicio"
                name="nombreServicio"
                value={form.nombreServicio}
                error={
                  formErrors.nombreServicio
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

                  {editingServicio
                    ? "Guardar Cambios"
                    : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailServicio && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Detalle del servicio
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
              detailServicio.nombreServicio
            }
          />

          <DetailRow
            label="Estado"
            value={
              detailServicio.activo
                ? "Activo"
                : "Inactivo"
            }
          />

          <DetailRow
            label="ID Servicio"
            value={
              detailServicio.idServicio
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
        } el servicio "${
          confirmToggle?.nombreServicio || ""
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