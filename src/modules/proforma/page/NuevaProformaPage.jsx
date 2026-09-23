import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Loader2,
  MessageSquareText,
  Receipt,
  Save,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { useAuth } from "../../../auth/AuthContext";
import { useToast } from "../../../components/ToastContext";
import { IconField, WizardStepIntro, ICON_INPUT } from "../../../components/formFields.jsx";
import { ROUTES } from "../../../router/routes";
import { createProforma, getSolicitudById, getTiposMuestreo } from "../service/proformaService";
import { getTecnicasAnalisis } from "../../catalogos/service/tecnicasAnalisisService";

const initialForm = {
  fechaProforma: new Date(),
  fechaEntregaEnvases: null,
  compararResultadosNorma: "",
  fechaMuestreoProforma: null,
  sumaProforma: 0,
  descuentoProforma: 0,
  observacionProforma: "",
  nombreTipoMuestreo: "",
};

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <>
      <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900 dark:text-sky-100">
        <span className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" aria-hidden />
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden /> : null}
        {title}
      </h3>
      {description ? (
        <p className="mb-5 ml-4 text-sm text-gray-500 dark:text-slate-400">{description}</p>
      ) : (
        <div className="mb-5" />
      )}
    </>
  );
}

function formatCordoba(value) {
  return `C$${Number(value ?? 0).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`;
}

export default function NuevaProformaPage() {
  const { idSolicitud } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [solicitud, setSolicitud] = useState(null);
  const [solicitudLoading, setSolicitudLoading] = useState(!!idSolicitud);
  const [tiposMuestreo, setTiposMuestreo] = useState([]);
  const [tiposLoading, setTiposLoading] = useState(true);
  const [tecnicasList, setTecnicasList] = useState([]);
  const [detallesTecnicas, setDetallesTecnicas] = useState({});
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

  const loadTecnicas = useCallback(async () => {
    try {
      const data = await getTecnicasAnalisis();
      setTecnicasList(data.filter((t) => t.activo !== false));
    } catch {
      addToast("Error al cargar técnicas de análisis", "error");
    }
  }, [addToast]);

  useEffect(() => {
    loadTecnicas();
  }, [loadTecnicas]);

  const loadSolicitud = useCallback(async () => {
    if (!idSolicitud) return;
    try {
      setSolicitudLoading(true);
      const data = await getSolicitudById(idSolicitud);
      setSolicitud(data);
      const suma = (data.detalles ?? []).reduce(
        (acc, d) => acc + Number(d.precioAnalisis ?? 0) * Number(d.cantidad ?? 1),
        0,
      );
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

  const introDescription = idSolicitud
    ? `Cotización vinculada a la solicitud #${idSolicitud}. Revise análisis, fechas y montos antes de guardar.`
    : "Complete fechas, tipo de muestreo y montos para registrar la proforma.";

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  }

  function handleTecnicaChange(idAnalisis, idTecnicaAnalisis) {
    setDetallesTecnicas((prev) => ({ ...prev, [idAnalisis]: idTecnicaAnalisis }));
  }

  function handleDateChange(field) {
    return (date) => {
      setForm((prev) => ({ ...prev, [field]: date }));
    };
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
      const toDateString = (d) => (d instanceof Date ? d.toISOString().split("T")[0] : "");

      const payload = {
        ...form,
        fechaProforma: toDateString(form.fechaProforma),
        fechaEntregaEnvases: toDateString(form.fechaEntregaEnvases),
        fechaMuestreoProforma: toDateString(form.fechaMuestreoProforma),
        subTotalProforma: calculated.subTotal,
        ivaProforma: calculated.iva,
        totalProforma: calculated.total,
        idFormatoSolicitud: idSolicitud ? Number(idSolicitud) : 0,
        idUsuario: user?.idUsuario ?? user?.id ?? 0,
        detallesTecnicas: Object.entries(detallesTecnicas)
          .filter(([, idTecnica]) => idTecnica)
          .map(([idAnalisis, idTecnica]) => {
            const detalle = (solicitud?.detalles ?? []).find(
              (d) => Number(d.idAnalisis) === Number(idAnalisis),
            );
            return {
              idAnalisis: Number(idAnalisis),
              idTecnicaAnalisis: idTecnica,
              cantidad: Number(detalle?.cantidad) > 0 ? Number(detalle.cantidad) : 1,
            };
          }),
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
    <form onSubmit={handleSubmit} className="campo-wizard flex min-h-full flex-1 flex-col">
      <div className="campo-wizard-banner py-2.5 text-center text-sm font-bold text-blue-950 sm:text-base">
        ÁREA DE PROYECCIÓN Y EXTENSIÓN — COTIZACIÓN
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="campo-wizard-card">
          <div className="campo-wizard-card-progress w-full" aria-hidden />
          <div className="campo-wizard-step-body campo-wizard-step-pane campo-wizard-step-body--proforma">
            <div className="proforma-form-intro flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <WizardStepIntro title="Nueva proforma" description={introDescription} />
              <Link
                to={idSolicitud ? ROUTES.solicitudServicio : ROUTES.proformas}
                className="campo-btn-outline shrink-0 self-start px-4 py-2 text-sm"
              >
                ← Volver
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {idSolicitud && solicitudLoading && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-14 text-slate-500 dark:border-white/15 dark:text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  <span>Cargando información de la solicitud…</span>
                </div>
              )}

              {idSolicitud && !solicitudLoading && !solicitud && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/35 dark:bg-red-950/30 dark:text-red-200">
                  No se pudo cargar la información de la solicitud.
                </div>
              )}

              {idSolicitud && solicitud && (
                <section className="campo-section proforma-solicitud-section">
                  <h3 className="!mb-1.5 !text-sm !font-semibold uppercase tracking-[0.2em] !text-slate-500 dark:!text-slate-400">
                    Información de la Solicitud
                  </h3>
                  <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    <ReadOnlyField label="N° Solicitud" value={solicitud.numeroSolicitud} />
                    <ReadOnlyField label="Cliente" value={solicitud.cliente} />
                    <ReadOnlyField label="Fecha recepción" value={solicitud.fechaRecepcionSolicitud} />
                    <ReadOnlyField label="Matriz" value={solicitud.matriz} />
                    <ReadOnlyField label="Servicio" value={solicitud.servicio} />
                    <ReadOnlyField label="Usuario" value={solicitud.usuario} />
                    <ReadOnlyField label="Medio recepción" value={solicitud.mediosRecepcion} />
                    <ReadOnlyField label="Contacto" value={solicitud.num1ContactoSolicitud} />
                    <ReadOnlyField label="Correo" value={solicitud.correoCliente} />
                  </div>

                  {solicitud.detalles?.length > 0 && (
                    <div className="mt-2 theme-table overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase text-gray-600">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Análisis</th>
                            <th className="px-3 py-2 font-semibold">Abrev.</th>
                            <th className="px-3 py-2 font-semibold text-right">Cantidad</th>
                            <th className="px-3 py-2 font-semibold">Técnica</th>
                            <th className="px-3 py-2 font-semibold text-right">Precio Unit.</th>
                            <th className="px-3 py-2 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {solicitud.detalles.map((d, i) => {
                            const cantidad = Number(d.cantidad ?? 1);
                            const precioUnit = Number(d.precioAnalisis ?? 0);
                            const totalLinea = cantidad * precioUnit;
                            return (
                              <tr key={d.idDetalleSolicitud ?? i}>
                                <td className="px-3 py-2 font-medium text-gray-800">{d.nombreAnalisis}</td>
                                <td className="px-3 py-2 text-gray-600">{d.abreviacionAnalisis || "—"}</td>
                                <td className="px-3 py-2 text-right">{cantidad}</td>
                                <td className="px-3 py-2">
                                  <select
                                    value={detallesTecnicas[d.idAnalisis] ?? ""}
                                    onChange={(e) =>
                                      handleTecnicaChange(d.idAnalisis, Number(e.target.value))
                                    }
                                    className="select w-44"
                                  >
                                    <option value="">Seleccione...</option>
                                    {tecnicasList.map((t) => (
                                      <option key={t.idTecnicaAnalisis} value={t.idTecnicaAnalisis}>
                                        {t.nombreTecnica}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {formatCordoba(precioUnit)}
                                </td>
                                <td className="px-3 py-2 text-right">{formatCordoba(totalLinea)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="text-sm font-semibold text-gray-800">
                          <tr>
                            <td colSpan={5} className="px-3 py-2 text-right">
                              Total análisis
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatCordoba(form.sumaProforma)}
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
                </section>
              )}

              <section className="campo-section">
                <SectionHeader
                  icon={CalendarDays}
                  title="Datos de la proforma"
                  description="Fechas clave, tipo de muestreo y norma de referencia"
                />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <IconField
                    id="fechaProforma"
                    icon={CalendarDays}
                    tone="bg-sky-50 text-sky-700"
                    label="Fecha proforma"
                    required
                    error={formErrors.fechaProforma}
                    filledValue={form.fechaProforma}
                  >
                    <DatePicker
                      id="fechaProforma"
                      onChange={handleDateChange("fechaProforma")}
                      value={form.fechaProforma}
                      className="date-picker-input"
                    />
                  </IconField>

                  <IconField
                    id="fechaEntregaEnvases"
                    icon={CalendarDays}
                    tone="bg-amber-50 text-amber-700"
                    label="Fecha entrega envases"
                    filledValue={form.fechaEntregaEnvases}
                  >
                    <DatePicker
                      id="fechaEntregaEnvases"
                      onChange={handleDateChange("fechaEntregaEnvases")}
                      value={form.fechaEntregaEnvases}
                      className="date-picker-input"
                    />
                  </IconField>

                  <IconField
                    id="fechaMuestreoProforma"
                    icon={CalendarDays}
                    tone="bg-emerald-50 text-emerald-700"
                    label="Fecha muestreo"
                    filledValue={form.fechaMuestreoProforma}
                  >
                    <DatePicker
                      id="fechaMuestreoProforma"
                      onChange={handleDateChange("fechaMuestreoProforma")}
                      value={form.fechaMuestreoProforma}
                      className="date-picker-input"
                    />
                  </IconField>

                  <IconField
                    id="nombreTipoMuestreo"
                    icon={FlaskConical}
                    tone="bg-indigo-50 text-indigo-700"
                    label="Tipo de muestreo"
                    filledValue={form.nombreTipoMuestreo}
                  >
                    <select
                      id="nombreTipoMuestreo"
                      name="nombreTipoMuestreo"
                      value={form.nombreTipoMuestreo}
                      onChange={handleChange}
                      className={ICON_INPUT}
                      disabled={tiposLoading}
                    >
                      <option value="">Seleccione…</option>
                      {tiposMuestreo.map((t) => (
                        <option key={t.idTipoMuestreo} value={t.nombreTipoMuestreo}>
                          {t.nombreTipoMuestreo}
                        </option>
                      ))}
                    </select>
                  </IconField>

                  <div className="md:col-span-2 lg:col-span-3">
                    <IconField
                      id="compararResultadosNorma"
                      icon={ClipboardList}
                      tone="bg-violet-50 text-violet-700"
                      label="Norma de comparación"
                      filledValue={form.compararResultadosNorma}
                    >
                      <input
                        id="compararResultadosNorma"
                        type="text"
                        name="compararResultadosNorma"
                        value={form.compararResultadosNorma}
                        onChange={handleChange}
                        className={ICON_INPUT}
                        placeholder="Ej. NOM, norma técnica o criterio acordado"
                      />
                    </IconField>
                  </div>
                </div>
              </section>

              <section className="campo-section">
                <SectionHeader
                  icon={Receipt}
                  title="Montos"
                  description="Descuento opcional; subtotal, IVA (15 %) y total se calculan automáticamente"
                />

                <div className="campo-wizard-summary mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Total a cotizar
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                      {formatCordoba(calculated.total)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 font-medium text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/40 dark:text-sky-200">
                      Subtotal {formatCordoba(calculated.subTotal)}
                    </span>
                    <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
                      IVA {formatCordoba(calculated.iva)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <ReadOnlyNumber label="Suma" value={form.sumaProforma} />
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="descuentoProforma"
                      className="text-sm font-medium text-gray-700 dark:text-slate-200"
                    >
                      Descuento
                    </label>
                    <input
                      id="descuentoProforma"
                      type="number"
                      name="descuentoProforma"
                      value={form.descuentoProforma}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={ICON_INPUT}
                    />
                  </div>
                  <ReadOnlyNumber label="Subtotal" value={calculated.subTotal} />
                  <ReadOnlyNumber label="IVA (15 %)" value={calculated.iva} />
                  <ReadOnlyNumber label="Total" value={calculated.total} emphasis />
                </div>
              </section>

              <section className="campo-section">
                <SectionHeader
                  icon={MessageSquareText}
                  title="Observaciones"
                  description="Notas adicionales que aparecerán en la proforma"
                />
                <textarea
                  name="observacionProforma"
                  value={form.observacionProforma}
                  onChange={handleChange}
                  rows={4}
                  className={`${ICON_INPUT} min-h-[6rem] resize-y`}
                  placeholder="Condiciones comerciales, plazos, aclaraciones…"
                />
              </section>
            </div>

            <div className="campo-wizard-footer sticky bottom-0 z-10 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-5 sm:px-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Los montos incluyen IVA cuando corresponda según la configuración del sistema.
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <Link
                  to={idSolicitud ? ROUTES.solicitudServicio : ROUTES.proformas}
                  className="campo-btn-outline px-4 py-2 text-sm"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="campo-btn-primary campo-btn-primary--save px-5 py-2 text-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Guardando…" : "Guardar proforma"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-slate-400">
          © {new Date().getFullYear()} UNAN Managua — CIRA · Proformas
        </p>
      </div>
    </form>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-slate-100">{value || "—"}</span>
    </div>
  );
}

function ReadOnlyNumber({ label, value, emphasis = false }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <div
        className={`flex h-11 items-center rounded-lg border px-3 text-sm tabular-nums ${
          emphasis
            ? "border-emerald-400/50 bg-emerald-50/80 font-bold text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/35 dark:text-emerald-200"
            : "border-gray-200 bg-gray-50/90 text-gray-800 dark:border-white/10 dark:bg-[#251d50]/80 dark:text-slate-100"
        }`}
      >
        {formatCordoba(value)}
      </div>
    </div>
  );
}
