import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaEye, FaPlus, FaSearch, FaSpinner, FaTimes, FaTrash } from "react-icons/fa";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";
import { getFormatosCampo, labelFormatoCampo } from "../service/catalogosOrdenService.js";
import {
  createOrdenServicio,
  deleteOrdenServicio,
  getOrdenesServicio,
  updateOrdenServicio,
} from "../service/formatoOrdenServicioService.js";

const ESTADOS_ORDEN = ["Pendiente", "En proceso", "Completada", "Cancelada"];

const initialForm = {
  numeroOrden: "",
  fechaRecepcionMuestra: "",
  estadoOrden: "Pendiente",
  idUsuario: "",
  idFormatoCampo: "",
  idTipoMuestreo: "",
  analisisOrden: false,
  muestreoOrden: false,
  hojaObservacionOrden: false,
  informeTecnicoOrden: false,
  otro1Orden: "",
  otro2Orden: "",
  observacionOrden: "",
};

function labelUsuario(u) {
  const nombre = u.nombreUsuario ?? u.NombreUsuario ?? "";
  const apellido = u.apellidoUsuario ?? u.ApellidoUsuario ?? "";
  return `${nombre} ${apellido}`.trim() || nombre;
}

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
}

function mapOrdenToForm(orden, usuarios) {
  const u = usuarios.find(
    (x) => (x.nombreUsuario ?? x.NombreUsuario) === orden.usuario
  );
  return {
    numeroOrden: String(orden.numeroOrden ?? ""),
    fechaRecepcionMuestra: toDatetimeLocalValue(orden.fechaRecepcionMuestra),
    estadoOrden: orden.estadoOrden || "Pendiente",
    idUsuario: String(u?.idUsuario ?? u?.IdUsuario ?? ""),
    idFormatoCampo: String(orden.formatoCampo ?? ""),
    idTipoMuestreo: "",
    analisisOrden: !!orden.analisisOrden,
    muestreoOrden: !!orden.muestreoOrden,
    hojaObservacionOrden: !!orden.hojaObservacionOrden,
    informeTecnicoOrden: !!orden.informeTecnicoOrden,
    otro1Orden: orden.otro1Orden ?? "",
    otro2Orden: orden.otro2Orden ?? "",
    observacionOrden: orden.observacionOrden ?? "",
  };
}

function validateForm(form) {
  const errors = {};
  if (!String(form.numeroOrden).trim()) errors.numeroOrden = "Requerido";
  if (!form.fechaRecepcionMuestra) errors.fechaRecepcionMuestra = "Requerido";
  if (!String(form.estadoOrden).trim()) errors.estadoOrden = "Requerido";
  if (!form.idUsuario) errors.idUsuario = "Seleccione un usuario";
  if (!form.idFormatoCampo) errors.idFormatoCampo = "Seleccione un formato de campo";
  if (!form.idTipoMuestreo) errors.idTipoMuestreo = "Indique el ID del tipo de muestreo";
  return errors;
}

export default function FormatosOrdenServicioPage() {
  const { addToast } = useToast();

  const [ordenes, setOrdenes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [formatosCampo, setFormatosCampo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState(null);
  const [detailOrden, setDetailOrden] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrdenesServicio();
      setOrdenes(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadCatalogs = useCallback(async () => {
    try {
      setCatalogsLoading(true);
      const [users, campos] = await Promise.all([getUsuarios(), getFormatosCampo()]);
      setUsuarios((users ?? []).filter((u) => u.activo !== false && u.Activo !== false));
      setFormatosCampo(campos);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setCatalogsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOrdenes();
    loadCatalogs();
  }, [loadOrdenes, loadCatalogs]);

  const filteredOrdenes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ordenes;
    return ordenes.filter((o) => {
      const texto = [
        o.numeroOrden,
        o.estadoOrden,
        o.usuario,
        o.tipoMuestreo,
        o.formatoCampo,
      ]
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [ordenes, search]);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    const nextVal = type === "checkbox" ? checked : value;
    const merged = { ...form, [name]: nextVal };
    setForm(merged);
    const errors = validateForm(merged);
    setFormErrors((prev) => ({ ...prev, [name]: errors[name] ?? "" }));
  }

  function closeModal() {
    setModalOpen(false);
    setEditingOrden(null);
    setFormErrors({});
  }

  function openCreateModal() {
    setDetailOrden(null);
    setEditingOrden(null);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setForm({ ...initialForm, fechaRecepcionMuestra: localNow });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(orden) {
    setDetailOrden(null);
    setEditingOrden(orden);
    setForm(mapOrdenToForm(orden, usuarios));
    setFormErrors({});
    setModalOpen(true);
  }

  function openDetailModal(orden) {
    setDetailOrden(orden);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      if (editingOrden?.idFormatoOrden) {
        await updateOrdenServicio(editingOrden.idFormatoOrden, form);
        addToast("Orden de servicio actualizada", "success");
      } else {
        await createOrdenServicio(form);
        addToast("Orden de servicio creada", "success");
      }
      closeModal();
      await loadOrdenes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.idFormatoOrden;
    try {
      setDeletingId(id);
      await deleteOrdenServicio(id);
      addToast("Orden eliminada", "success");
      setConfirmDelete(null);
      await loadOrdenes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  const catalogsReady = !catalogsLoading;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          disabled={!catalogsReady}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <FaPlus className="h-4 w-4" />
          Nueva orden de servicio
        </button>
      </div>

      {!catalogsReady && (
        <p className="text-sm text-amber-700">
          Cargando catálogos (usuarios y formatos de campo)…
        </p>
      )}

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar por número, estado, usuario…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">Nº orden</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Recepción</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Usuario</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Tipo muestreo</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando órdenes…</span>
                </td>
              </tr>
            ) : filteredOrdenes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                  {search ? "No se encontraron órdenes" : "No hay órdenes de servicio registradas"}
                </td>
              </tr>
            ) : (
              filteredOrdenes.map((orden) => (
                <tr key={orden.idFormatoOrden} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">{orden.numeroOrden}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {orden.estadoOrden}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 sm:px-6">{formatFecha(orden.fechaRecepcionMuestra)}</td>
                  <td className="px-4 py-3 sm:px-6">{orden.usuario}</td>
                  <td className="px-4 py-3 sm:px-6">{orden.tipoMuestreo}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEditModal(orden)}
                        className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Ver detalle"
                        onClick={() => openDetailModal(orden)}
                        className="rounded p-1.5 text-blue-900 hover:bg-slate-100"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        disabled={deletingId === orden.idFormatoOrden}
                        onClick={() => setConfirmDelete(orden)}
                        className="rounded p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === orden.idFormatoOrden ? (
                          <FaSpinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <FaTrash className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingOrden ? "Editar orden de servicio" : "Nueva orden de servicio"}
              </h2>
              <button type="button" onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Número de orden" name="numeroOrden" type="number" value={form.numeroOrden} error={formErrors.numeroOrden} onChange={handleFormChange} />
                <Field label="Estado" name="estadoOrden" as="select" value={form.estadoOrden} error={formErrors.estadoOrden} onChange={handleFormChange}>
                  {ESTADOS_ORDEN.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </Field>
                <Field label="Fecha recepción muestra" name="fechaRecepcionMuestra" type="datetime-local" value={form.fechaRecepcionMuestra} error={formErrors.fechaRecepcionMuestra} onChange={handleFormChange} className="sm:col-span-2" />
                <Field label="Usuario responsable" name="idUsuario" as="select" value={form.idUsuario} error={formErrors.idUsuario} onChange={handleFormChange}>
                  <option value="">— Seleccionar —</option>
                  {usuarios.map((u) => {
                    const id = u.idUsuario ?? u.IdUsuario;
                    return (
                      <option key={id} value={id}>{labelUsuario(u)}</option>
                    );
                  })}
                </Field>
                <Field label="Formato de campo" name="idFormatoCampo" as="select" value={form.idFormatoCampo} error={formErrors.idFormatoCampo} onChange={handleFormChange}>
                  <option value="">— Seleccionar —</option>
                  {formatosCampo.map((f) => (
                    <option key={f.idFormatoCampo} value={f.idFormatoCampo}>{labelFormatoCampo(f)}</option>
                  ))}
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="ID tipo de muestreo"
                    name="idTipoMuestreo"
                    type="number"
                    value={form.idTipoMuestreo}
                    error={formErrors.idTipoMuestreo}
                    onChange={handleFormChange}
                    hint={
                      editingOrden?.tipoMuestreo
                        ? `Actual en BD: «${editingOrden.tipoMuestreo}». No hay GET de tipos en la API; use el ID de la tabla TiposMuestreo.`
                        : "No existe endpoint GET de tipos de muestreo; indique el IdTipoMuestreo de la base de datos."
                    }
                  />
                </div>
              </div>

              <fieldset className="rounded-lg border border-gray-200 p-4">
                <legend className="px-1 text-sm font-medium text-gray-700">Documentos incluidos</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Check name="analisisOrden" label="Análisis" checked={form.analisisOrden} onChange={handleFormChange} />
                  <Check name="muestreoOrden" label="Muestreo" checked={form.muestreoOrden} onChange={handleFormChange} />
                  <Check name="hojaObservacionOrden" label="Hoja de observación" checked={form.hojaObservacionOrden} onChange={handleFormChange} />
                  <Check name="informeTecnicoOrden" label="Informe técnico" checked={form.informeTecnicoOrden} onChange={handleFormChange} />
                </div>
              </fieldset>

              <Field label="Otro 1" name="otro1Orden" value={form.otro1Orden} onChange={handleFormChange} />
              <Field label="Otro 2" name="otro2Orden" value={form.otro2Orden} onChange={handleFormChange} />
              <Field label="Observaciones" name="observacionOrden" as="textarea" value={form.observacionOrden} onChange={handleFormChange} />

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
                  {editingOrden ? "Guardar cambios" : "Crear orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle orden #{detailOrden.numeroOrden}</h2>
              <button type="button" onClick={() => setDetailOrden(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-3 p-6 text-sm">
              <DetailRow label="Estado" value={detailOrden.estadoOrden} />
              <DetailRow label="Recepción muestra" value={formatFecha(detailOrden.fechaRecepcionMuestra)} />
              <DetailRow label="Usuario" value={detailOrden.usuario} />
              <DetailRow label="Formato campo (ID)" value={detailOrden.formatoCampo} />
              <DetailRow label="Tipo muestreo" value={detailOrden.tipoMuestreo} />
              <DetailRow label="Análisis" value={detailOrden.analisisOrden ? "Sí" : "No"} />
              <DetailRow label="Muestreo" value={detailOrden.muestreoOrden ? "Sí" : "No"} />
              <DetailRow label="Hoja observación" value={detailOrden.hojaObservacionOrden ? "Sí" : "No"} />
              <DetailRow label="Informe técnico" value={detailOrden.informeTecnicoOrden ? "Sí" : "No"} />
              {detailOrden.otro1Orden && <DetailRow label="Otro 1" value={detailOrden.otro1Orden} />}
              {detailOrden.otro2Orden && <DetailRow label="Otro 2" value={detailOrden.otro2Orden} />}
              {detailOrden.observacionOrden && <DetailRow label="Observaciones" value={detailOrden.observacionOrden} />}
              <DetailRow label="Creado" value={formatFecha(detailOrden.fechaCreacionOrden)} />
              <DetailRow label="Por" value={detailOrden.usuarioCreacionOrden || "—"} />
            </dl>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar orden de servicio"
        message={`¿Eliminar la orden Nº ${confirmDelete?.numeroOrden}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function Field({ label, name, value, error, onChange, type = "text", as, hint, className = "", children }) {
  const id = `orden-${name}`;
  const base = "input w-full";
  const errCls = error ? "border-red-500" : "";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {as === "select" ? (
        <select id={id} name={name} value={value} onChange={onChange} className={`${base} ${errCls}`}>
          {children}
        </select>
      ) : as === "textarea" ? (
        <textarea id={id} name={name} value={value} onChange={onChange} rows={3} className={`${base} ${errCls}`} />
      ) : (
        <input id={id} name={name} type={type} value={value} onChange={onChange} className={`${base} ${errCls}`} />
      )}
      {hint && <p className="mt-1 text-xs text-amber-700">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Check({ name, label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="rounded border-gray-300" />
      {label}
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}
