import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaEye,
  FaFileInvoiceDollar,
  FaPlus,
  FaSave,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { useAuth } from "../../../auth/AuthContext";
import { useToast } from "../../../components/ToastContext";
import { ROUTES } from "../../../router/routes";
import { getProformas, updateProforma } from "../service/proformaService";

const initialEditForm = {
  fechaProforma: "",
  fechaEntregaEnvases: "",
  compararResultadosNorma: "",
  fechaMuestreoProforma: "",
  sumaProforma: 0,
  descuentoProforma: 0,
  subTotalProforma: 0,
  ivaProforma: 0,
  totalProforma: 0,
  observacionProforma: "",
  estado: "Pendiente",
  nombreFuente: "",
  nombreTipoMuestreo: "",
  idFormatoSolicitud: 0,
  idUsuario: 0,
};

export default function ProformaPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [detailProforma, setDetailProforma] = useState(null);
  const [editProforma, setEditProforma] = useState(null);
  const [editForm, setEditForm] = useState({ ...initialEditForm });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProformas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProformas();
      setProformas(data);
    } catch (err) {
      addToast(err?.message || "Error al cargar las proformas", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProformas();
  }, [loadProformas]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return proformas;
    return proformas.filter((p) =>
      [
        p.numeroProforma,
        p.cliente?.nombreCliente,
        p.cliente?.apellidoCliente,
        p.estado,
        p.usuario,
      ]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [search, proformas]);

  function estadoBadge(estado) {
    const cls =
      estado === "Aprobada"
        ? "bg-green-100 text-green-800"
        : estado === "Rechazada"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800";
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {estado}
      </span>
    );
  }

  function openDetailModal(p) {
    setDetailProforma(p);
  }

  function closeDetailModal() {
    setDetailProforma(null);
  }

  function toDateOrNull(value) {
    return value ? new Date(value + "T00:00:00") : null;
  }

  function openEditModal(p) {
    setEditProforma(p);
    setEditForm({
      fechaProforma: toDateOrNull(p.fechaProforma),
      fechaEntregaEnvases: toDateOrNull(p.fechaEntregaEnvases),
      compararResultadosNorma: p.compararResultadosNorma || "",
      fechaMuestreoProforma: toDateOrNull(p.fechaMuestreoProforma),
      sumaProforma: p.sumaProforma ?? 0,
      descuentoProforma: p.descuentoProforma ?? 0,
      subTotalProforma: p.subTotalProforma ?? 0,
      ivaProforma: p.ivaProforma ?? 0,
      totalProforma: p.totalProforma ?? 0,
      observacionProforma: p.observacionProforma || "",
      estado: p.estado || "Pendiente",
      nombreFuente: p.fuentesMatriz || "",
      nombreTipoMuestreo: p.tiposMuestreo || "",
      idFormatoSolicitud: p.formatoSolicitud ?? 0,
      idUsuario: user?.idUsuario ?? user?.id ?? 0,
    });
    setEditFormErrors({});
  }

  function closeEditModal() {
    setEditProforma(null);
    setEditFormErrors({});
  }

  function handleDateChange(field) {
    return (date) => {
      setEditForm((prev) => ({ ...prev, [field]: date }));
    };
  }

  function handleFormChange(e) {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  }

  function validateForm() {
    const errors = {};
    if (!editForm.fechaProforma) errors.fechaProforma = "Requerido";
    if (!editForm.estado) errors.estado = "Requerido";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const toDateString = (d) =>
        d instanceof Date ? d.toISOString().split("T")[0] : "";

      const payload = {
        ...editForm,
        fechaProforma: toDateString(editForm.fechaProforma),
        fechaEntregaEnvases: toDateString(editForm.fechaEntregaEnvases),
        fechaMuestreoProforma: toDateString(editForm.fechaMuestreoProforma),
      };

      await updateProforma(editProforma.idProforma, payload);
      addToast("Proforma actualizada exitosamente", "success");
      closeEditModal();
      await loadProformas();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <FaFileInvoiceDollar className="h-7 w-7 text-blue-900" />
          <div>
            <h1 className="text-2xl font-semibold text-blue-900">Proformas</h1>
            <p className="text-sm text-slate-500">Consulta las proformas registradas en el sistema.</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar proforma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">N° Proforma</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Cliente</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Fecha</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Total</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Usuario</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Detalles</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando proformas...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  {search ? "No se encontraron proformas" : "No hay proformas registradas"}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.idProforma} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">{p.numeroProforma}</td>
                  <td className="px-4 py-3 sm:px-6">
                    {p.cliente?.nombreCliente} {p.cliente?.apellidoCliente}
                  </td>
                  <td className="px-4 py-3 sm:px-6">{p.fechaProforma}</td>
                  <td className="px-4 py-3 sm:px-6">
                    {p.totalProforma != null
                      ? `C$${Number(p.totalProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 sm:px-6">{estadoBadge(p.estado)}</td>
                  <td className="px-4 py-3 sm:px-6">{p.usuario}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {p.detalles?.length ?? 0} análisis
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Ver detalle"
                        onClick={() => openDetailModal(p)}
                        className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEditModal(p)}
                        className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailProforma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de Proforma</h2>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="N° Proforma" value={detailProforma.numeroProforma} />
                <DetailRow label="N° Solicitud" value={detailProforma.numeroSolicitud} />
                <DetailRow label="Cliente" value={`${detailProforma.cliente?.nombreCliente ?? ""} ${detailProforma.cliente?.apellidoCliente ?? ""}`} />
                <DetailRow label="Teléfono" value={detailProforma.cliente?.telefonoCliente} />
                <DetailRow label="Celular" value={detailProforma.cliente?.celularCliente} />
                <DetailRow label="Correo" value={detailProforma.cliente?.correoCliente} />
                <DetailRow label="Dirección" value={detailProforma.cliente?.direccionCliente} />
                <DetailRow label="Cédula/RUC" value={detailProforma.cliente?.cedulaCliente || detailProforma.cliente?.numeroRuc || "—"} />
                <DetailRow label="Fecha Proforma" value={detailProforma.fechaProforma} />
                <DetailRow label="Fecha Entrega" value={detailProforma.fechaEntregaEnvases} />
                <DetailRow label="Fecha Muestreo" value={detailProforma.fechaMuestreoProforma} />
                <DetailRow label="Estado" value={detailProforma.estado} />
                <DetailRow label="Fuente / Matriz" value={detailProforma.fuentesMatriz} />
                <DetailRow label="Tipo Muestreo" value={detailProforma.tiposMuestreo} />
                <div className="sm:col-span-2">
                  <DetailRow label="Norma de comparación" value={detailProforma.compararResultadosNorma} />
                </div>
                <DetailRow label="Creado por" value={detailProforma.usuarioCreacionProforma} />
                <DetailRow label="Fecha creación" value={detailProforma.fechaCreacionProforma} />
              </div>

              {/* Analysis details */}
              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Detalles de análisis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-200 text-xs uppercase text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Análisis</th>
                        <th className="px-3 py-2 font-semibold">Técnica</th>
                        <th className="px-3 py-2 font-semibold text-right">Cantidad</th>
                        <th className="px-3 py-2 font-semibold text-right">Precio Unit.</th>
                        <th className="px-3 py-2 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {detailProforma.detalles?.map((d) => (
                        <tr key={d.idDetalleProforma}>
                          <td className="px-3 py-2 font-medium text-gray-800">{d.nombreAnalisis}</td>
                          <td className="px-3 py-2 text-gray-600">{d.nombreTecnica}</td>
                          <td className="px-3 py-2 text-right">{d.cantidadDetalleProforma}</td>
                          <td className="px-3 py-2 text-right">
                            C${Number(d.precioUnitarioDetalle).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            C${Number(d.totalDetalleProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matrices */}
              {detailProforma.matrices?.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Matrices
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-200 text-xs uppercase text-gray-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Matriz</th>
                          <th className="px-3 py-2 font-semibold text-right">N° Muestras</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {detailProforma.matrices.map((m) => (
                          <tr key={m.idMatriz}>
                            <td className="px-3 py-2 font-medium text-gray-800">{m.nombreMatriz}</td>
                            <td className="px-3 py-2 text-right">{m.numMuestras}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between border-b py-1">
                    <span className="text-gray-600">Suma</span>
                    <span className="font-medium">
                      C${Number(detailProforma.sumaProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b py-1">
                    <span className="text-gray-600">Descuento</span>
                    <span className="font-medium">
                      -C${Number(detailProforma.descuentoProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b py-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      C${Number(detailProforma.subTotalProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b py-1">
                    <span className="text-gray-600">IVA</span>
                    <span className="font-medium">
                      C${Number(detailProforma.ivaProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-base font-bold text-blue-900">
                    <span>Total</span>
                    <span>
                      C${Number(detailProforma.totalProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observations */}
              {detailProforma.observacionProforma && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-600">Observación</p>
                  <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {detailProforma.observacionProforma}
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProforma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Editar Proforma — {editProforma.numeroProforma}
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label="Fecha Proforma" error={editFormErrors.fechaProforma}>
                  <DatePicker disabled onChange={handleDateChange("fechaProforma")} value={editForm.fechaProforma} className="date-picker-input" />
                </FieldGroup>

                <FieldGroup label="Fecha Entrega Envases">
                  <DatePicker onChange={handleDateChange("fechaEntregaEnvases")} value={editForm.fechaEntregaEnvases} className="date-picker-input" />
                </FieldGroup>

                <FieldGroup label="Fecha Muestreo">
                  <DatePicker onChange={handleDateChange("fechaMuestreoProforma")} value={editForm.fechaMuestreoProforma} className="date-picker-input" />
                </FieldGroup>

                <FieldGroup label="Estado" error={editFormErrors.estado}>
                  <select
                    name="estado"
                    value={editForm.estado}
                    onChange={handleFormChange}
                    className="select"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </FieldGroup>

                <FieldGroup label="Fuente / Matriz">
                  <input
                    type="text"
                    name="nombreFuente"
                    value={editForm.nombreFuente}
                    onChange={handleFormChange}
                    className="input"
                  />
                </FieldGroup>

                <FieldGroup label="Tipo de Muestreo">
                  <input
                    type="text"
                    name="nombreTipoMuestreo"
                    value={editForm.nombreTipoMuestreo}
                    onChange={handleFormChange}
                    className="input"
                  />
                </FieldGroup>

                <div className="sm:col-span-3">
                  <FieldGroup label="Norma de comparación">
                    <input
                      type="text"
                      name="compararResultadosNorma"
                      value={editForm.compararResultadosNorma}
                      onChange={handleFormChange}
                      className="input"
                    />
                  </FieldGroup>
                </div>
              </div>

              {/* Matrices — read-only */}
              {editProforma.matrices?.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Matrices
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-200 text-xs uppercase text-gray-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Matriz</th>
                          <th className="px-3 py-2 font-semibold text-right">N° Muestras</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {editProforma.matrices.map((m) => (
                          <tr key={m.idMatriz}>
                            <td className="px-3 py-2 font-medium text-gray-800">{m.nombreMatriz}</td>
                            <td className="px-3 py-2 text-right">{m.numMuestras}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Montos</h3>
                <div className="grid gap-4 sm:grid-cols-5">
                  <FieldGroup label="Suma">
                    <input
                      type="number"
                      name="sumaProforma"
                      value={editForm.sumaProforma}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="input"
                    />
                  </FieldGroup>

                  <FieldGroup label="Descuento">
                    <input
                      type="number"
                      name="descuentoProforma"
                      value={editForm.descuentoProforma}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="input"
                    />
                  </FieldGroup>

                  <FieldGroup label="Subtotal">
                    <input
                      type="number"
                      name="subTotalProforma"
                      value={editForm.subTotalProforma}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="input"
                    />
                  </FieldGroup>

                  <FieldGroup label="IVA">
                    <input
                      type="number"
                      name="ivaProforma"
                      value={editForm.ivaProforma}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="input"
                    />
                  </FieldGroup>

                  <FieldGroup label="Total">
                    <input
                      type="number"
                      name="totalProforma"
                      value={editForm.totalProforma}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="input"
                    />
                  </FieldGroup>
                </div>
              </div>

              <FieldGroup label="Observación">
                <textarea
                  name="observacionProforma"
                  value={editForm.observacionProforma}
                  onChange={handleFormChange}
                  rows={3}
                  className="textarea"
                />
              </FieldGroup>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaSave className="h-4 w-4" />}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-2 sm:grid-cols-3">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

function FieldGroup({ label, children, error }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
