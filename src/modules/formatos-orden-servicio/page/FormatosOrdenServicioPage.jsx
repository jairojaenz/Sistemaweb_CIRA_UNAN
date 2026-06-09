import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import { FaEdit, FaEye, FaSearch, FaSpinner, FaTimes, FaTrash } from "react-icons/fa";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import { getDepartamentos, getMunicipios, getUsuarios } from "../../usuarios/service/usuarioService.js";
import { getFormatosCampo, labelFormatoCampo } from "../service/catalogosOrdenService.js";
import {
  createOrdenServicio,
  deleteOrdenServicio,
  getOrdenesServicio,
  updateOrdenServicio,
} from "../service/formatoOrdenServicioService.js";
import { formatTelefonoLocal, telefonoLocalError } from "../../../utils/phoneFormat.js";
import OrdenServicioFormView from "./OrdenServicioFormView.jsx";

const COMPOUESTO_OPTION_KEYS = ["compuesto8h", "compuesto12h", "compuesto16h", "compuesto24h"];

const DRAFT_KEY = "orden_servicio_draft_v1";

const emptyDetalleRow = (n = 1) => ({
  numeroMuestra: String(n).padStart(2, "0"),
  analisis: "",
  codigoLab: "",
});

const emptyControlRecepcionRow = () => ({
  laboratorio: "",
  recibidoPor: "",
  fechaEntregaResultados: "",
});

const initialForm = {
  numeroOrden: "",
  proformaNo: "",
  fecha: "",
  usuarioEmpresa: "",
  atencionA: "",
  telefono: "",
  celular: "",
  extension: "",
  correo: "",
  direccion: "",
  departamento: "",
  municipio: "",
  analisisOrden: false,
  muestreoOrden: false,
  hojaObservacionOrden: false,
  informeTecnicoOrden: false,
  otroServicio: "",
  modalidadMuestreo: "puntual",
  compuesto8h: false,
  compuesto12h: false,
  compuesto16h: false,
  compuesto24h: false,
  modalidadMuestreoOtros: "",
  detalleMuestras: [emptyDetalleRow(1)],
  controlRecepcion: [emptyControlRecepcionRow()],
  idUsuario: "",
  idFormatoCampo: "",
  estadoOrden: "Pendiente",
  muestreoPor: "usuario",
  transportePor: "usuario",
  incluirNormaInforme: "si",
  especificarLab: "",
  especificarNorma: "",
  observacionOrden: "",
  firmaUsuario: "",
  firmaApe: "",
};

function labelUsuario(u) {
  const nombre = u.nombreUsuario ?? u.NombreUsuario ?? "";
  const apellido = u.apellidoUsuario ?? u.ApellidoUsuario ?? "";
  return `${nombre} ${apellido}`.trim() || nombre;
}

function toDateInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
}

function mapOrdenToForm(orden, usuarios) {
  const u = usuarios.find((x) => (x.nombreUsuario ?? x.NombreUsuario) === orden.usuario);
  const tipo = String(orden.tipoMuestreo ?? "").toLowerCase();
  let modalidadMuestreo = "puntual";
  if (tipo.includes("compuesto")) modalidadMuestreo = "compuesto";
  else if (tipo.includes("otro")) modalidadMuestreo = "otros";
  return {
    ...initialForm,
    numeroOrden: String(orden.numeroOrden ?? ""),
    proformaNo: orden.otro1Orden ?? "",
    fecha: toDateInputValue(orden.fechaRecepcionMuestra),
    usuarioEmpresa: orden.usuario ?? "",
    modalidadMuestreo,
    estadoOrden: orden.estadoOrden || "Pendiente",
    idUsuario: String(u?.idUsuario ?? u?.IdUsuario ?? ""),
    idFormatoCampo: String(orden.formatoCampo ?? ""),
    analisisOrden: !!orden.analisisOrden,
    muestreoOrden: !!orden.muestreoOrden,
    hojaObservacionOrden: !!orden.hojaObservacionOrden,
    informeTecnicoOrden: !!orden.informeTecnicoOrden,
    otroServicio: orden.otro2Orden ?? "",
    especificarNorma: orden.otro2Orden ?? "",
    observacionOrden: orden.observacionOrden ?? "",
  };
}

function validateForm(form) {
  const errors = {};
  if (!String(form.numeroOrden).trim()) errors.numeroOrden = "Requerido";
  if (!form.fecha) errors.fecha = "Requerido";
  if (!String(form.usuarioEmpresa).trim()) errors.usuarioEmpresa = "Requerido";

  const errTelefono = telefonoLocalError(form.telefono, { label: "Teléfono" });
  if (errTelefono) errors.telefono = errTelefono;

  const errCelular = telefonoLocalError(form.celular, { label: "Celular" });
  if (errCelular) errors.celular = errCelular;

  if (form.modalidadMuestreo === "compuesto") {
    const seleccionadas = COMPOUESTO_OPTION_KEYS.filter((key) => form[key]).length;
    if (seleccionadas !== 1) {
      errors.compuestoOpcion = "Seleccione una sola opción para muestreo compuesto";
    }
  }

  if (form.modalidadMuestreo === "otros" && !String(form.modalidadMuestreoOtros ?? "").trim()) {
    errors.modalidadMuestreoOtros = "Especifique el tipo de muestreo";
  }

  return errors;
}

function firstUsuarioId(usuarios) {
  const u = usuarios[0];
  return u?.idUsuario ?? u?.IdUsuario ?? null;
}

function firstFormatoCampoId(formatosCampo) {
  return formatosCampo[0]?.idFormatoCampo ?? null;
}

/** La API exige idTipoMuestreo; se infiere de la modalidad elegida en el formulario. */
function idTipoMuestreoFromModalidad(modalidadMuestreo) {
  if (modalidadMuestreo === "compuesto") return 2;
  if (modalidadMuestreo === "otros") return 3;
  return 1;
}

function formToApiPayload(form, { usuarios = [], formatosCampo = [] } = {}) {
  const fechaIso = form.fecha ? new Date(`${form.fecha}T12:00:00`).toISOString() : new Date().toISOString();
  const idUsuario = Number(form.idUsuario) || Number(firstUsuarioId(usuarios)) || 0;
  const idFormatoCampo = Number(form.idFormatoCampo) || Number(firstFormatoCampoId(formatosCampo)) || 0;

  return {
    numeroOrden: form.numeroOrden,
    fechaRecepcionMuestra: fechaIso,
    estadoOrden: form.estadoOrden || "Pendiente",
    idUsuario,
    idFormatoCampo,
    idTipoMuestreo: idTipoMuestreoFromModalidad(form.modalidadMuestreo),
    analisisOrden: form.analisisOrden,
    muestreoOrden: form.muestreoOrden,
    hojaObservacionOrden: form.hojaObservacionOrden,
    informeTecnicoOrden: form.informeTecnicoOrden,
    otro1Orden: form.proformaNo?.trim() || form.otroServicio?.trim() || null,
    otro2Orden: form.especificarNorma?.trim() || null,
    observacionOrden: buildObservacionOrden(form),
  };
}

function buildObservacionOrden(form) {
  const partes = [];
  if (form.modalidadMuestreo === "otros" && form.modalidadMuestreoOtros?.trim()) {
    partes.push(`Tipo de muestreo (otros): ${form.modalidadMuestreoOtros.trim()}`);
  }
  if (form.observacionOrden?.trim()) partes.push(form.observacionOrden.trim());
  return partes.length > 0 ? partes.join("\n") : null;
}

function normalizeFormState(data) {
  const merged = { ...initialForm, ...data };

  if (!Array.isArray(merged.detalleMuestras) || merged.detalleMuestras.length === 0) {
    merged.detalleMuestras = [emptyDetalleRow(1)];
  }

  if (!Array.isArray(merged.controlRecepcion) || merged.controlRecepcion.length === 0) {
    merged.controlRecepcion = [
      {
        laboratorio: data.laboratorio ?? "",
        recibidoPor: data.recibidoPor ?? "",
        fechaEntregaResultados: data.fechaEntregaResultados ?? "",
      },
    ];
  }

  return merged;
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return normalizeFormState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export default function FormatosOrdenServicioPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editIdParam } = useParams();

  const isCreateRoute = location.pathname.endsWith("/nueva");
  const isEditRoute = Boolean(editIdParam) && location.pathname.includes("/editar");
  const isFormRoute = isCreateRoute || isEditRoute;

  const [ordenes, setOrdenes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [formatosCampo, setFormatosCampo] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      const [users, campos, deps, muns] = await Promise.all([
        getUsuarios(),
        getFormatosCampo(),
        getDepartamentos(),
        getMunicipios(),
      ]);
      setUsuarios((users ?? []).filter((u) => u.activo !== false && u.Activo !== false));
      setFormatosCampo(campos);
      setDepartamentos(deps ?? []);
      setMunicipios(muns ?? []);
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

  useEffect(() => {
    if (!isFormRoute) return;

    if (isCreateRoute) {
      setEditingOrden(null);
      const draft = loadDraft();
      const today = new Date().toISOString().slice(0, 10);
      setForm(draft ?? { ...initialForm, fecha: today });
      setFormErrors({});
      return;
    }

    if (isEditRoute && editIdParam) {
      const orden = ordenes.find((o) => String(o.idFormatoOrden) === String(editIdParam));
      if (orden) {
        setEditingOrden(orden);
        setForm(mapOrdenToForm(orden, usuarios));
        setFormErrors({});
      }
    }
  }, [isFormRoute, isCreateRoute, isEditRoute, editIdParam, ordenes, usuarios]);

  const departamentoMap = useMemo(() => {
    const map = {};
    for (const d of departamentos) {
      const id = d.idDepartamento ?? d.IdDepartamento;
      const nombre = d.nombreDepartamento ?? d.NombreDepartamento ?? d.nombre ?? "";
      if (id != null && nombre) map[nombre] = id;
    }
    return map;
  }, [departamentos]);

  const municipiosFiltrados = useMemo(() => {
    const depId = departamentoMap[form.departamento];
    if (!depId) return [];
    return municipios.filter((m) => (m.idDepartamento ?? m.IdDepartamento) === depId);
  }, [municipios, departamentoMap, form.departamento]);

  const filteredOrdenes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ordenes;
    return ordenes.filter((o) => {
      const texto = [o.numeroOrden, o.estadoOrden, o.usuario, o.tipoMuestreo, o.formatoCampo]
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [ordenes, search]);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    let nextVal = type === "checkbox" ? checked : value;

    if (name === "telefono" || name === "celular") {
      nextVal = formatTelefonoLocal(value);
    }

    if (name === "modalidadMuestreo") {
      setForm((prev) => ({
        ...prev,
        modalidadMuestreo: value,
        compuesto8h: false,
        compuesto12h: false,
        compuesto16h: false,
        compuesto24h: false,
        modalidadMuestreoOtros: value === "otros" ? prev.modalidadMuestreoOtros : "",
      }));
      setFormErrors((prev) => ({
        ...prev,
        compuestoOpcion: "",
        modalidadMuestreoOtros: "",
      }));
      return;
    }

    if (COMPOUESTO_OPTION_KEYS.includes(name) && type === "checkbox") {
      setForm((prev) => {
        const cleared = {
          compuesto8h: false,
          compuesto12h: false,
          compuesto16h: false,
          compuesto24h: false,
        };
        if (checked) {
          cleared[name] = true;
        }
        const merged = { ...prev, ...cleared };
        const errors = validateForm(merged);
        setFormErrors((e) => ({
          ...e,
          compuestoOpcion: errors.compuestoOpcion ?? "",
        }));
        return merged;
      });
      return;
    }

    if (name === "departamento") {
      setForm((prev) => ({ ...prev, departamento: value, municipio: "" }));
      return;
    }

    setForm((prev) => {
      const merged = { ...prev, [name]: nextVal };
      const errors = validateForm(merged);
      setFormErrors((e) => ({ ...e, [name]: errors[name] ?? "" }));
      return merged;
    });
  }

  function handleDetalleChange(index, field, value) {
    setForm((prev) => {
      const detalleMuestras = [...prev.detalleMuestras];
      detalleMuestras[index] = { ...detalleMuestras[index], [field]: value };
      return { ...prev, detalleMuestras };
    });
  }

  function handleAddDetalleRow() {
    setForm((prev) => ({
      ...prev,
      detalleMuestras: [...prev.detalleMuestras, emptyDetalleRow(prev.detalleMuestras.length + 1)],
    }));
  }

  function handleRemoveDetalleRow(index) {
    setForm((prev) => ({
      ...prev,
      detalleMuestras: prev.detalleMuestras.filter((_, i) => i !== index),
    }));
  }

  function handleControlRecepcionChange(index, field, value) {
    setForm((prev) => {
      const controlRecepcion = [...prev.controlRecepcion];
      controlRecepcion[index] = { ...controlRecepcion[index], [field]: value };
      return { ...prev, controlRecepcion };
    });
  }

  function handleAddControlRecepcionRow() {
    setForm((prev) => ({
      ...prev,
      controlRecepcion: [...prev.controlRecepcion, emptyControlRecepcionRow()],
    }));
  }

  function handleRemoveControlRecepcionRow(index) {
    setForm((prev) => ({
      ...prev,
      controlRecepcion: prev.controlRecepcion.filter((_, i) => i !== index),
    }));
  }

  function closeFormView() {
    setEditingOrden(null);
    setFormErrors({});
    navigate(ROUTES.formatosOrdenServicio);
  }

  function openEditForm(orden) {
    setDetailOrden(null);
    navigate(ROUTES.formatosOrdenServicioEditar(orden.idFormatoOrden));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast("Complete los campos requeridos", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = formToApiPayload(form, { usuarios, formatosCampo });
      if (!payload.idUsuario || !payload.idFormatoCampo) {
        addToast("No hay usuarios o formatos de campo en el catálogo para registrar la orden.", "error");
        return;
      }
      if (editingOrden?.idFormatoOrden) {
        await updateOrdenServicio(editingOrden.idFormatoOrden, payload);
        addToast("Orden de servicio actualizada", "success");
      } else {
        await createOrdenServicio(payload);
        addToast("Orden de servicio enviada correctamente", "success");
        clearDraft();
      }
      closeFormView();
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

  if (isFormRoute) {
    if (isEditRoute && !editingOrden && !loading) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
          <p className="text-gray-700">No se encontró la orden de servicio solicitada.</p>
          <button
            type="button"
            onClick={closeFormView}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Volver al listado
          </button>
        </div>
      );
    }

    return (
      <OrdenServicioFormView
        form={form}
        formErrors={formErrors}
        onChange={handleFormChange}
        onDetalleChange={handleDetalleChange}
        onAddDetalleRow={handleAddDetalleRow}
        onRemoveDetalleRow={handleRemoveDetalleRow}
        onControlRecepcionChange={handleControlRecepcionChange}
        onAddControlRecepcionRow={handleAddControlRecepcionRow}
        onRemoveControlRecepcionRow={handleRemoveControlRecepcionRow}
        onSubmit={handleSubmit}
        onCancel={closeFormView}
        saving={saving}
        catalogsLoading={catalogsLoading}
        departamentos={departamentos}
        municipiosFiltrados={municipiosFiltrados}
      />
    );
  }

  const tabClass = ({ isActive }) =>
    [
      "rounded-lg px-4 py-2 text-sm font-semibold transition",
      isActive ? "bg-blue-900 text-white shadow" : "text-blue-900 hover:bg-blue-50",
    ].join(" ");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        <NavLink to={ROUTES.formatosOrdenServicio} end className={tabClass}>
          Listado
        </NavLink>
        <NavLink to={ROUTES.formatosOrdenServicioNueva} className={tabClass}>
          Crear orden
        </NavLink>
      </div>

      {!catalogsReady && (
        <p className="text-sm text-amber-700">
          Cargando catálogos… Puede abrir el formulario; los selectores se completarán al cargar.
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
                <td colSpan={6} className="px-4 py-12 text-center sm:px-6">
                  <p className="text-gray-600">
                    {search ? "No se encontraron órdenes" : "No hay órdenes de servicio registradas"}
                  </p>
                  {!search && (
                    <p className="mt-2 text-sm text-gray-500">
                      Use la pestaña &quot;Crear orden&quot; para registrar una nueva.
                    </p>
                  )}
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
                        onClick={() => openEditForm(orden)}
                        className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Ver detalle"
                        onClick={() => setDetailOrden(orden)}
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

      {detailOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle orden #{detailOrden.numeroOrden}</h2>
              <button
                type="button"
                onClick={() => setDetailOrden(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
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
              {detailOrden.otro1Orden && <DetailRow label="Proforma / otro" value={detailOrden.otro1Orden} />}
              {detailOrden.otro2Orden && <DetailRow label="Norma / otro" value={detailOrden.otro2Orden} />}
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

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}
