/**
 * Formulario de cadena de custodia (alta y edición).
 * Tres bloques: identificación (campo + estado), muestras/análisis, entregas.
 * El PUT manda el formulario completo; el backend reemplaza los pivotes.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Beaker,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  FlaskConical,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  PackageCheck,
  Plus,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import ValidationIssuesModal from "../../../components/ValidationIssuesModal.jsx";
import { CatalogChoiceCard, ICON_INPUT, IconField } from "../../../components/formFields.jsx";
import { ROUTES } from "../../../router/routes.js";
import EnsayosMultiSelect from "../../plan-muestreo/components/EnsayosMultiSelect.jsx";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getMuestras } from "../../catalogos/service/muestrasService.js";
import { getClientes } from "../../clientes/service/clienteService.js";
import { getFormatosCampo } from "../../info-campo/service/infoCampoService.js";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";
import {
  createCustodia,
  formToCustodiaPayload,
  getCustodiaById,
  updateCustodia,
} from "../service/custodiaService.js";
import { collectCustodiaIssues, issuesToFormErrors } from "../utils/custodiaValidation.js";

const ESTADOS_CUSTODIA = [
  {
    value: "Pendiente",
    hint: "Aún no sale del laboratorio",
    icon: Clock,
    tone: "bg-amber-100 text-amber-700",
  },
  {
    value: "En tránsito",
    hint: "Muestra en traslado",
    icon: Truck,
    tone: "bg-sky-100 text-sky-700",
  },
  {
    value: "Recibida",
    hint: "Ya llegó al destino",
    icon: PackageCheck,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "Cerrada",
    hint: "Cadena cerrada",
    icon: Lock,
    tone: "bg-slate-100 text-slate-700",
  },
];

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function emptyDetalle() {
  return { idMuestra: "", idsAnalisis: [], idsMuestraxAnalisis: [] };
}

function emptyEntrega(idUsuario) {
  return {
    fechaEntrega: todayIso(),
    horaEntrega: nowTime(),
    fechaRecibido: todayIso(),
    horaRecibido: nowTime(),
    idUsuario: idUsuario ? String(idUsuario) : "",
    idCliente: "",
  };
}

function sessionUserId(user) {
  return Number(user?.idUsuario ?? user?.id ?? user?.Id ?? 0);
}

function sessionUserName(user) {
  return [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim();
}

function labelUsuario(u) {
  const nombre = u?.nombreUsuario ?? u?.nombre ?? "";
  const apellido = u?.apellidoUsuario ?? u?.apellido ?? "";
  return `${nombre} ${apellido}`.trim() || nombre || "Usuario";
}

export default function CustodiaPage() {
  const { idCustodia } = useParams();
  const isEdit = Boolean(idCustodia);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const idUsuarioSesion = sessionUserId(user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campos, setCampos] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [analisis, setAnalisis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [errors, setErrors] = useState({});
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);
  const [validationApiMessage, setValidationApiMessage] = useState("");
  const [form, setForm] = useState({
    estado: "Pendiente",
    idFormatoCampo: "",
    idUsuario: idUsuarioSesion || "",
    usuarioCreacion: sessionUserName(user),
    detalles: [emptyDetalle()],
    entregas: [emptyEntrega(idUsuarioSesion)],
  });

  const analisisActivos = useMemo(
    () => analisis.filter((a) => a.activo !== false),
    [analisis],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [camposData, muestrasData, analisisData] = await Promise.all([
          getFormatosCampo(),
          getMuestras(),
          getAnalisis(),
        ]);
        let clientesData = [];
        let usuariosData = [];
        try {
          clientesData = await getClientes();
        } catch {
          clientesData = [];
        }
        try {
          usuariosData = await getUsuarios();
        } catch {
          usuariosData = [];
        }
        if (cancelled) return;
        setCampos(camposData);
        setMuestras(muestrasData);
        setAnalisis(analisisData);
        setClientes(clientesData);
        setUsuarios(usuariosData);

        if (isEdit) {
          const detalle = await getCustodiaById(idCustodia);
          if (cancelled) return;
          setForm({
            estado: detalle.estado || "Pendiente",
            idFormatoCampo: detalle.idFormatoCampo ? String(detalle.idFormatoCampo) : "",
            idUsuario: detalle.idUsuario || idUsuarioSesion || "",
            usuarioCreacion: detalle.usuarioCreacion || sessionUserName(user),
            detalles: (detalle.detalles ?? []).length
              ? detalle.detalles.map((d) => ({
                  idMuestra: d.idMuestra ? String(d.idMuestra) : "",
                  idsAnalisis: (d.idsAnalisis ?? []).map(String),
                  idsMuestraxAnalisis: d.idsMuestraxAnalisis ?? [],
                }))
              : [emptyDetalle()],
            entregas: (detalle.entregas ?? []).length
              ? detalle.entregas.map((e) => ({
                  ...e,
                  idUsuario: e.idUsuario ? String(e.idUsuario) : "",
                  idCliente: e.idCliente ? String(e.idCliente) : "",
                }))
              : [emptyEntrega(idUsuarioSesion)],
          });
        } else {
          setForm((p) => ({
            ...p,
            idUsuario: idUsuarioSesion || p.idUsuario,
            usuarioCreacion: sessionUserName(user) || p.usuarioCreacion,
          }));
        }
      } catch (err) {
        addToast(err?.message || "No se pudieron cargar los datos", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [addToast, idCustodia, idUsuarioSesion, isEdit, user]);

  const usuarioOptions = useMemo(() => {
    if (usuarios.length) return usuarios;
    if (!idUsuarioSesion) return [];
    return [{ idUsuario: idUsuarioSesion, nombreUsuario: sessionUserName(user) || "Usuario actual" }];
  }, [usuarios, idUsuarioSesion, user]);

  function updateDetalle(index, patch) {
    setForm((p) => ({
      ...p,
      detalles: p.detalles.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));
  }

  function updateEntrega(index, patch) {
    setForm((p) => ({
      ...p,
      entregas: p.entregas.map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const issues = collectCustodiaIssues(form);
    if (issues.length) {
      setErrors(issuesToFormErrors(issues));
      setValidationIssues(issues);
      setValidationApiMessage("");
      setValidationOpen(true);
      return;
    }
    if (!idUsuarioSesion && !Number(form.idUsuario)) {
      addToast("No hay usuario de sesión para asociar la custodia", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = formToCustodiaPayload(form, { idUsuario: idUsuarioSesion || form.idUsuario });
      if (isEdit) {
        await updateCustodia(idCustodia, payload);
        addToast("Custodia actualizada", "success");
      } else {
        await createCustodia(payload);
        addToast("Custodia creada", "success");
      }
      navigate(ROUTES.custodia);
    } catch (err) {
      setValidationIssues([]);
      setValidationApiMessage(err?.message || "No se pudo guardar la custodia");
      setValidationOpen(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-blue-900">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-full w-full bg-gray-100 text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">
        ÁREA DE PROYECCIÓN Y EXTENSIÓN
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-blue-900">
                {isEdit ? "Editar cadena de custodia" : "Nueva cadena de custodia"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Vincule el formato de campo, las muestras con sus análisis y registre las entregas.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
                  <span className="h-7 w-1 rounded-full bg-blue-900" />
                  Identificación
                </h3>
                <p className="mb-5 ml-4 text-sm text-gray-500">
                  Formato de campo de origen y estado de la cadena
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <IconField
                    id="custodia-formatoCampo"
                    icon={ClipboardList}
                    tone="bg-indigo-50 text-indigo-700"
                    label="Formato de campo"
                    hint="Registro de información de campo asociado"
                    required
                    error={errors.idFormatoCampo}
                  >
                    <select
                      id="custodia-formatoCampo"
                      className={ICON_INPUT}
                      value={form.idFormatoCampo}
                      onChange={(e) => setForm((p) => ({ ...p, idFormatoCampo: e.target.value }))}
                    >
                      <option value="">Seleccione un formato de campo</option>
                      {campos.map((c) => (
                        <option key={c.idFormatoCampo} value={c.idFormatoCampo}>
                          #{c.idFormatoCampo} — {c.identificacionMuestra || c.comunidad || "Campo"}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  <IconField
                    id="custodia-usuarioCreacion"
                    icon={UserRound}
                    tone="bg-sky-50 text-sky-700"
                    label="Registrado por"
                    hint="Usuario de la sesión"
                  >
                    <input
                      id="custodia-usuarioCreacion"
                      className={ICON_INPUT}
                      value={form.usuarioCreacion || sessionUserName(user) || "Usuario actual"}
                      disabled
                    />
                  </IconField>
                </div>

                <p className="mb-3 mt-5 text-sm font-semibold text-gray-800">Estado de la cadena</p>
                {errors.estado ? (
                  <p className="mb-3 text-xs font-medium text-red-500">{errors.estado}</p>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ESTADOS_CUSTODIA.map((item) => (
                    <CatalogChoiceCard
                      key={item.value}
                      selected={form.estado === item.value}
                      icon={item.icon}
                      tone={item.tone}
                      label={item.value}
                      hint={item.hint}
                      onClick={() => setForm((p) => ({ ...p, estado: item.value }))}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                      <span className="h-7 w-1 rounded-full bg-yellow-400" />
                      Muestras y análisis
                    </h3>
                    <p className="ml-4 mt-1 text-sm text-gray-500">
                      Cada tarjeta es una muestra de la cadena y los análisis solicitados
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, detalles: [...p.detalles, emptyDetalle()] }))}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar muestra
                  </button>
                </div>
                {errors.detalles ? (
                  <p className="mb-3 text-xs font-medium text-red-500">{errors.detalles}</p>
                ) : null}

                <div className="space-y-4">
                  {form.detalles.map((detalle, index) => {
                    const muestra = muestras.find(
                      (m) => String(m.idMuestra) === String(detalle.idMuestra),
                    );
                    return (
                      <article key={index} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-5 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-blue-900">Muestra {index + 1}</p>
                              <p className="truncate text-xs text-gray-500">
                                {muestra?.identificacion || "Sin muestra seleccionada"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            title="Eliminar muestra"
                            disabled={form.detalles.length <= 1}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                detalles: p.detalles.filter((_, i) => i !== index),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Eliminar muestra</span>
                          </button>
                        </header>
                        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                          <IconField
                            id={`custodia-muestra-${index}`}
                            icon={FlaskConical}
                            tone="bg-cyan-50 text-cyan-700"
                            label="Muestra"
                            hint="Identificación de la muestra"
                            required
                            error={errors[`muestra-${index}`]}
                          >
                            <select
                              id={`custodia-muestra-${index}`}
                              className={ICON_INPUT}
                              value={detalle.idMuestra}
                              onChange={(e) => updateDetalle(index, { idMuestra: e.target.value })}
                            >
                              <option value="">Seleccione una muestra</option>
                              {muestras.map((m) => (
                                <option key={m.idMuestra} value={m.idMuestra}>
                                  {m.identificacion || `Muestra #${m.idMuestra}`}
                                </option>
                              ))}
                            </select>
                          </IconField>
                          <IconField
                            id={`custodia-analisis-${index}`}
                            icon={Beaker}
                            tone="bg-violet-50 text-violet-700"
                            label="Análisis solicitados"
                            hint="Uno o más ensayos de la muestra"
                          >
                            <EnsayosMultiSelect
                              id={`custodia-analisis-${index}`}
                              opciones={analisisActivos}
                              selectedIds={detalle.idsAnalisis}
                              onChange={(ids) => updateDetalle(index, { idsAnalisis: ids })}
                            />
                          </IconField>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                      <span className="h-7 w-1 rounded-full bg-blue-900" />
                      Entregas
                    </h3>
                    <p className="ml-4 mt-1 text-sm text-gray-500">
                      Fechas, horas y responsables de cada entrega y recepción
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        entregas: [...p.entregas, emptyEntrega(idUsuarioSesion)],
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar entrega
                  </button>
                </div>
                {errors.entregas ? (
                  <p className="mb-3 text-xs font-medium text-red-500">{errors.entregas}</p>
                ) : null}

                <div className="space-y-4">
                  {form.entregas.map((entrega, index) => (
                    <article key={index} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-5 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-blue-900">Entrega {index + 1}</p>
                            <p className="truncate text-xs text-gray-500">
                              {entrega.fechaEntrega
                                ? `Entrega el ${entrega.fechaEntrega}`
                                : "Sin fecha de entrega"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          title="Eliminar entrega"
                          disabled={form.entregas.length <= 1}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              entregas: p.entregas.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Eliminar entrega</span>
                        </button>
                      </header>
                      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-4">
                        <IconField
                          id={`custodia-fechaEntrega-${index}`}
                          icon={CalendarDays}
                          tone="bg-amber-50 text-amber-700"
                          label="Fecha de entrega"
                          hint="Día en que se entrega"
                          required
                          error={errors[`fechaEntrega-${index}`]}
                        >
                          <input
                            id={`custodia-fechaEntrega-${index}`}
                            type="date"
                            className={ICON_INPUT}
                            value={entrega.fechaEntrega}
                            onChange={(e) => updateEntrega(index, { fechaEntrega: e.target.value })}
                          />
                        </IconField>
                        <IconField
                          id={`custodia-horaEntrega-${index}`}
                          icon={LogOut}
                          tone="bg-red-50 text-red-600"
                          label="Hora de entrega"
                          hint="Salida de la muestra"
                          required
                          error={errors[`horaEntrega-${index}`]}
                        >
                          <input
                            id={`custodia-horaEntrega-${index}`}
                            type="time"
                            className={ICON_INPUT}
                            value={entrega.horaEntrega}
                            onChange={(e) => updateEntrega(index, { horaEntrega: e.target.value })}
                          />
                        </IconField>
                        <IconField
                          id={`custodia-fechaRecibido-${index}`}
                          icon={CalendarCheck}
                          tone="bg-teal-50 text-teal-700"
                          label="Fecha de recibido"
                          hint="Día en que se recibe"
                          required
                          error={errors[`fechaRecibido-${index}`]}
                        >
                          <input
                            id={`custodia-fechaRecibido-${index}`}
                            type="date"
                            className={ICON_INPUT}
                            value={entrega.fechaRecibido}
                            onChange={(e) => updateEntrega(index, { fechaRecibido: e.target.value })}
                          />
                        </IconField>
                        <IconField
                          id={`custodia-horaRecibido-${index}`}
                          icon={LogIn}
                          tone="bg-emerald-50 text-emerald-600"
                          label="Hora de recibido"
                          hint="Entrada de la muestra"
                          required
                          error={errors[`horaRecibido-${index}`]}
                        >
                          <input
                            id={`custodia-horaRecibido-${index}`}
                            type="time"
                            className={ICON_INPUT}
                            value={entrega.horaRecibido}
                            onChange={(e) => updateEntrega(index, { horaRecibido: e.target.value })}
                          />
                        </IconField>
                        <IconField
                          id={`custodia-usuario-${index}`}
                          icon={UserRound}
                          tone="bg-sky-50 text-sky-700"
                          label="Usuario"
                          hint="Quien entrega o recibe"
                          required
                          error={errors[`idUsuario-${index}`]}
                          className="lg:col-span-2"
                        >
                          <select
                            id={`custodia-usuario-${index}`}
                            className={ICON_INPUT}
                            value={entrega.idUsuario}
                            onChange={(e) => updateEntrega(index, { idUsuario: e.target.value })}
                          >
                            <option value="">Seleccione un usuario</option>
                            {usuarioOptions.map((u) => {
                              const id = u.idUsuario ?? u.IdUsuario;
                              return (
                                <option key={id} value={id}>
                                  {labelUsuario(u)}
                                </option>
                              );
                            })}
                          </select>
                        </IconField>
                        <IconField
                          id={`custodia-cliente-${index}`}
                          icon={Building2}
                          tone="bg-violet-50 text-violet-700"
                          label="Cliente"
                          hint="Destinatario de la entrega"
                          required
                          error={errors[`idCliente-${index}`]}
                          className="lg:col-span-2"
                        >
                          <select
                            id={`custodia-cliente-${index}`}
                            className={ICON_INPUT}
                            value={entrega.idCliente}
                            onChange={(e) => updateEntrega(index, { idCliente: e.target.value })}
                          >
                            <option value="">Seleccione un cliente</option>
                            {clientes.map((c) => (
                              <option key={c.idCliente} value={c.idCliente}>
                                {c.nombreCliente}
                              </option>
                            ))}
                          </select>
                          {clientes.length === 0 ? (
                            <p className="mt-2 text-xs text-amber-700">
                              No hay clientes disponibles. Un administrador debe registrarlos.
                            </p>
                          ) : null}
                        </IconField>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-8 py-6 md:px-10">
            <button
              type="button"
              onClick={() => navigate(ROUTES.custodia)}
              className="flex items-center gap-2 rounded-lg border-2 border-blue-900 px-6 py-2 font-semibold text-blue-900 transition-all hover:bg-blue-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Guardar cambios" : "Crear custodia"}
            </button>
          </div>
        </div>
      </div>

      <ValidationIssuesModal
        open={validationOpen}
        title={validationApiMessage ? "No se pudo guardar la custodia" : "Complete los datos de la cadena"}
        description={
          validationApiMessage
            ? "El servidor rechazó el registro. Revise el motivo e intente de nuevo."
            : "Revise los campos pendientes antes de crear o actualizar la cadena de custodia."
        }
        issues={validationIssues}
        apiMessage={validationApiMessage}
        onClose={() => setValidationOpen(false)}
        primaryLabel="Ir a corregir"
      />
    </form>
  );
}
