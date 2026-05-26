import { useCallback, useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaFileInvoiceDollar, FaSave, FaSpinner } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { useToast } from "../../../components/ToastContext";
import { ROUTES } from "../../../router/routes";
import { createProforma, getSolicitudById, getTiposMuestreo } from "../service/proformaService";

const initialForm = {
  fechaProforma: "",
  fechaEntregaEnvases: "",
  compararResultadosNorma: "",
  fechaMuestreoProforma: "",
  sumaProforma: 0,
  descuentoProforma: 0,
  observacionProforma: "",
  nombreTipoMuestreo: "",
};

export default function NuevaProformaPage() {
  const { idSolicitud } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [solicitud, setSolicitud] = useState(null);
  const [solicitudLoading, setSolicitudLoading] = useState(!!idSolicitud);
  const [tiposMuestreo, setTiposMuestreo] = useState([]);
  const [tiposLoading, setTiposLoading] = useState(true);
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadTipos = useCallback(async () => {
    try {
      setTiposLoading(true);
      const data = await getTiposMuestreo();
      setTiposMuestreo(data.filter((t) => t.activo !== false));
    } catch {
      addToast("Error al cargar tipos de muestreo", "error");
    } finally {
      setTiposLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadTipos();
  }, [loadTipos]);

  const loadSolicitud = useCallback(async () => {
    if (!idSolicitud) return;
    try {
      setSolicitudLoading(true);
      const data = await getSolicitudById(idSolicitud);
      setSolicitud(data);
      const suma = (data.detalles ?? []).reduce((acc, d) => acc + Number(d.precioAnalisis ?? 0), 0);
      setForm((prev) => ({
        ...prev,
        sumaProforma: suma,
      }));
    } catch (err) {
      addToast(err?.message || "Error al cargar la solicitud", "error");
    } finally {
      setSolicitudLoading(false);
    }
  }, [idSolicitud, addToast]);

  useEffect(() => {
    loadSolicitud();
  }, [loadSolicitud]);

  const calculated = useMemo(() => {
    const suma = Number(form.sumaProforma) || 0;
    const descuento = Number(form.descuentoProforma) || 0;
    const subTotal = Math.max(0, suma - descuento);
    const iva = subTotal * 0.15;
    const total = subTotal + iva;
    return { subTotal, iva, total };
  }, [form.sumaProforma, form.descuentoProforma]);

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  }

  function validate() {
    const errors = {};
    if (!form.fechaProforma) errors.fechaProforma = "Requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        subTotalProforma: calculated.subTotal,
        ivaProforma: calculated.iva,
        totalProforma: calculated.total,
        idFormatoSolicitud: idSolicitud ? Number(idSolicitud) : 0,
        idUsuario: user?.idUsuario ?? user?.id ?? 0,
      };
      await createProforma(payload);
      addToast("Proforma creada exitosamente", "success");
      navigate(ROUTES.proformas);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaFileInvoiceDollar className="h-7 w-7 text-blue-900" />
          <div>
            <h1 className="text-2xl font-semibold text-blue-900">Nueva Proforma</h1>
            <p className="text-sm text-slate-500">
              {idSolicitud
                ? `Creando proforma a partir de la solicitud #${idSolicitud}`
                : "Complete el formulario para crear una nueva proforma."}
            </p>
          </div>
        </div>
        <Link
          to={idSolicitud ? ROUTES.solicitudServicio : ROUTES.proformas}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          <FaArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      {/* Solicitud info — read-only */}
      {idSolicitud && solicitudLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <FaSpinner className="h-5 w-5 animate-spin" />
          <span>Cargando información de la solicitud...</span>
        </div>
      )}

      {idSolicitud && !solicitudLoading && !solicitud && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar la información de la solicitud.
        </div>
      )}

      {idSolicitud && solicitud && (
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Información de la Solicitud
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ReadOnlyField label="N° Solicitud" value={solicitud.numeroSolicitud} />
            <ReadOnlyField label="Cliente" value={solicitud.cliente} />
            <ReadOnlyField label="Fecha recepción" value={solicitud.fechaRecepcionSolicitud} />
            <ReadOnlyField label="Matriz" value={solicitud.matriz} />
            <ReadOnlyField label="Servicio" value={solicitud.servicio} />
            <ReadOnlyField label="Usuario" value={solicitud.usuario} />
            <ReadOnlyField label="Medio recepción" value={solicitud.mediosRecepcion} />
            <ReadOnlyField label="Contacto" value={solicitud.num1ContactoSolicitud} />
          </div>

          {/* Detalles table */}
          {solicitud.detalles?.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-200 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Análisis</th>
                    <th className="px-3 py-2 font-semibold">Abrev.</th>
                    <th className="px-3 py-2 font-semibold">Grupo</th>
                    <th className="px-3 py-2 font-semibold text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {solicitud.detalles.map((d, i) => (
                    <tr key={d.idDetalleSolicitud ?? i}>
                      <td className="px-3 py-2 font-medium text-gray-800">{d.nombreAnalisis}</td>
                      <td className="px-3 py-2 text-gray-600">{d.abreviacionAnalisis || "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{d.nombreGrupoAnalisis || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        C${Number(d.precioAnalisis).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 text-sm font-semibold text-gray-800">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">Total análisis</td>
                    <td className="px-3 py-2 text-right">
                      C${Number(form.sumaProforma).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {solicitud.observacionSolicitud && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Observación: </span>
              {solicitud.observacionSolicitud}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Datos de la Proforma
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Fecha Proforma" error={formErrors.fechaProforma}>
              <input type="date" name="fechaProforma" value={form.fechaProforma} onChange={handleChange} className="input" />
            </FieldGroup>

            <FieldGroup label="Fecha Entrega Envases">
              <input type="date" name="fechaEntregaEnvases" value={form.fechaEntregaEnvases} onChange={handleChange} className="input" />
            </FieldGroup>

            <FieldGroup label="Fecha Muestreo">
              <input type="date" name="fechaMuestreoProforma" value={form.fechaMuestreoProforma} onChange={handleChange} className="input" />
            </FieldGroup>

            <FieldGroup label="Tipo de Muestreo">
              <select name="nombreTipoMuestreo" value={form.nombreTipoMuestreo} onChange={handleChange} className="select" disabled={tiposLoading}>
                <option value="">Seleccione...</option>
                {tiposMuestreo.map((t) => (
                  <option key={t.idTipoMuestreo} value={t.nombreTipoMuestreo}>
                    {t.nombreTipoMuestreo}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <div className="sm:col-span-3">
              <FieldGroup label="Norma de comparación">
                <input type="text" name="compararResultadosNorma" value={form.compararResultadosNorma} onChange={handleChange} className="input" />
              </FieldGroup>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Montos</h3>
          <div className="grid gap-4 sm:grid-cols-5">
            <ReadOnlyNumber label="Suma" value={form.sumaProforma} />
            <FieldGroup label="Descuento">
              <input type="number" name="descuentoProforma" value={form.descuentoProforma} onChange={handleChange} min="0" step="0.01" className="input" />
            </FieldGroup>
            <ReadOnlyNumber label="Subtotal" value={calculated.subTotal} />
            <ReadOnlyNumber label="IVA (15%)" value={calculated.iva} />
            <ReadOnlyNumber label="Total" value={calculated.total} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <FieldGroup label="Observación">
            <textarea name="observacionProforma" value={form.observacionProforma} onChange={handleChange} rows={3} className="textarea" />
          </FieldGroup>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to={idSolicitud ? ROUTES.solicitudServicio : ROUTES.proformas}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancelar
          </Link>
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
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}

function ReadOnlyNumber({ label, value }) {
  const formatted = Number(value ?? 0).toLocaleString("es-NI", { minimumFractionDigits: 2 });
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-800">
        C${formatted}
      </div>
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
