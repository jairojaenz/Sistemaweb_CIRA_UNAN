import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import { FaEdit, FaEye, FaSearch, FaSpinner, FaTrash } from "react-icons/fa";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import OrdenServicioDetalleModal from "../components/OrdenServicioDetalleModal.jsx";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import { getDepartamentos, getMunicipios, getUsuarios } from "../../usuarios/service/usuarioService.js";
import { getLaboratorios } from "../../laboratorios/service/laboratorioService.js";
import { getFormatosCampo, labelFormatoCampo } from "../service/catalogosOrdenService.js";
import { getTiposMuestreo } from "../../catalogos/service/tiposMuestreoService.js";
import {
  flagsFromCompuestoHoras,
  formToOrdenServicioPayload,
  modalidadFromTipoNombre,
} from "../utils/formToOrdenServicioPayload.js";
import {
  createOrdenServicio,
  deleteOrdenServicio,
  getOrdenServicioById,
  getOrdenesServicio,
  updateOrdenServicio,
} from "../service/formatoOrdenServicioService.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import { collectOrdenIssues, issuesToFormErrors } from "../utils/ordenValidation.js";
import { getSolicitudById } from "../../solicitud-servicio/service/solicitudServicioService.js";
import {
  assignCodigosAsignados,
  findProformaBySolicitud,
  formatCodigoAsignado,
  mapSolicitudToOrdenForm,
  suggestNextNumeroOrden,
} from "../utils/mapSolicitudToOrdenForm.js";
import { getProformas } from "../../proforma/service/proformaService.js";
import OrdenServicioFormView from "./OrdenServicioFormView.jsx";
import OrdenPrefillWarningModal from "../components/OrdenPrefillWarningModal.jsx";

const COMPOUESTO_OPTION_KEYS = ["compuesto8h", "compuesto12h", "compuesto16h", "compuesto24h"];

const DRAFT_KEY = "orden_servicio_draft_v1";

const emptyDetalleRow = (n = 1, codigoSecuencia = n) => ({
  numeroMuestra: String(n).padStart(2, "0"),
  analisis: "",
  idAnalisis: "",
  idMuestra: "",
  codigoAsignado: formatCodigoAsignado(codigoSecuencia),
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
  modalidadMuestreo: "",
  compuesto8h: false,
  compuesto12h: false,
  compuesto16h: false,
  compuesto24h: false,
  compuestoOtroTiempo: "",
  modalidadMuestreoOtros: "",
  detalleMuestras: [emptyDetalleRow(1)],
  controlRecepcion: [emptyControlRecepcionRow()],
  idUsuario: "",
  idFormatoCampo: "",
  idTipoMuestreo: "",
  estadoOrden: "Pendiente",
  muestreoPor: "usuario",
  transportePor: "usuario",
  incluirNormaInforme: "si",
  especificarLab: "",
  especificarNorma: "",
  observacionOrden: "",
  firmaUsuario: "",
  firmaApe: "",
  idFirmaUsuario: "",
  idFirmaApe: "",
  idFormatoSolicitud: "",
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
  if (orden.modalidadMuestreoOtros) modalidadMuestreo = "otros";
  const horasFlags = flagsFromCompuestoHoras(orden.compuestoHorasOrden);
  const wizardMuestras = (orden.detalleMuestras ?? []).filter(
    (d) => d.numeroMuestra || d.analisisSolicitado,
  );
  const pivotMuestras = orden.detalles ?? [];
  const detalleFuente = wizardMuestras.length ? wizardMuestras : pivotMuestras;
  const controlRecepcion = (orden.controlRecepcion ?? []).length
    ? orden.controlRecepcion.map((row) => ({
        laboratorio: row.laboratorio ?? "",
        recibidoPor: row.recibidoPor ?? "",
        fechaEntregaResultados: String(row.fechaEntregaResultados ?? "").slice(0, 10),
      }))
    : [emptyControlRecepcionRow()];

  return {
    ...initialForm,
    numeroOrden: String(orden.numeroOrden ?? ""),
    proformaNo: orden.otro1Orden ?? "",
    fecha: toDateInputValue(orden.fechaRecepcionMuestra),
    usuarioEmpresa: orden.usuarioEmpresaOrden || orden.usuario || "",
    atencionA: orden.atencionAOrden ?? "",
    telefono: orden.telefonoOrden ?? "",
    celular: orden.celularOrden ?? "",
    extension: orden.extensionOrden ?? "",
    correo: orden.correoOrden ?? "",
    direccion: orden.direccionOrden ?? "",
    departamento: orden.departamentoOrden ?? "",
    municipio: orden.municipioOrden ?? "",
    modalidadMuestreo,
    modalidadMuestreoOtros: orden.modalidadMuestreoOtros ?? "",
    ...horasFlags,
    estadoOrden: orden.estadoOrden || "Pendiente",
    idUsuario: String(orden.idUsuario || u?.idUsuario || u?.IdUsuario || ""),
    idFormatoCampo: String(orden.idFormatoCampo || orden.formatoCampo || ""),
    idTipoMuestreo: String(orden.idTipoMuestreo || ""),
    analisisOrden: !!orden.analisisOrden,
    muestreoOrden: !!orden.muestreoOrden,
    hojaObservacionOrden: !!orden.hojaObservacionOrden,
    informeTecnicoOrden: !!orden.informeTecnicoOrden,
    otroServicio: orden.otro2Orden ?? "",
    especificarNorma: orden.otro2Orden ?? "",
    especificarLab: orden.especificarLabOrden ?? "",
    observacionOrden: orden.observacionOrden ?? "",
    muestreoPor: orden.muestreoPorOrden || "usuario",
    transportePor: orden.transportePorOrden || "usuario",
    incluirNormaInforme: orden.incluirNormaInforme ? "si" : "no",
    firmaUsuario: orden.firmaUsuarioOrden ?? "",
    firmaApe: orden.firmaApeOrden ?? "",
    idFormatoSolicitud: orden.idFormatoSolicitud ? String(orden.idFormatoSolicitud) : "",
    idFirmaUsuario: (() => {
      const firmante = findUsuarioByNombre(usuarios, orden.firmaUsuarioOrden);
      return firmante ? String(firmante.idUsuario ?? firmante.IdUsuario) : "";
    })(),
    idFirmaApe: (() => {
      const receptor = findUsuarioByNombre(usuarios, orden.firmaApeOrden);
      return receptor ? String(receptor.idUsuario ?? receptor.IdUsuario) : "";
    })(),
    controlRecepcion,
    detalleMuestras: detalleFuente.length
      ? detalleFuente.map((d, index) => ({
          numeroMuestra: d.numeroMuestra || String(index + 1).padStart(2, "0"),
          analisis: d.analisisSolicitado ?? d.analisis ?? "",
          idAnalisis: d.idsAnalisis?.[0] ?? "",
          idMuestra: d.idMuestra ?? "",
          codigoAsignado: d.codigoAsignado || formatCodigoAsignado(index + 1),
        }))
      : [emptyDetalleRow(1)],
  };
}

function validateForm(form, extras) {
  return issuesToFormErrors(collectOrdenIssues(form, extras));
}

function firstUsuarioId(usuarios) {
  const u = usuarios[0];
  return u?.idUsuario ?? u?.IdUsuario ?? null;
}

function findUsuarioById(usuarios, id) {
  if (id == null || id === "") return null;
  return usuarios.find((x) => String(x.idUsuario ?? x.IdUsuario) === String(id)) ?? null;
}

function findUsuarioByNombre(usuarios, nombre) {
  const n = String(nombre ?? "").trim().toLowerCase();
  if (!n) return null;
  return (
    usuarios.find((x) => labelUsuario(x).toLowerCase() === n) ||
    usuarios.find((x) => String(x.nombreUsuario ?? x.NombreUsuario ?? "").trim().toLowerCase() === n) ||
    null
  );
}

function firstFormatoCampoId(formatosCampo) {
  return formatosCampo[0]?.idFormatoCampo ?? null;
}

function normalizeFormState(data) {
  const merged = { ...initialForm, ...data };

  if (!Array.isArray(merged.detalleMuestras) || merged.detalleMuestras.length === 0) {
    merged.detalleMuestras = [emptyDetalleRow(1)];
  } else {
    merged.detalleMuestras = assignCodigosAsignados(merged.detalleMuestras);
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
  const { user } = useAuth();
  const { addToast } = useToast();
  const idUsuarioSesion = user?.idUsuario ?? user?.id ?? user?.Id ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editIdParam, idSolicitud: solicitudIdParam } = useParams();

  const isCreateRoute = location.pathname.includes("/nueva");
  const isCreateFromSolicitud = isCreateRoute && Boolean(solicitudIdParam);
  const isEditRoute = Boolean(editIdParam) && location.pathname.includes("/editar");
  const isFormRoute = isCreateRoute || isEditRoute;

  const [ordenes, setOrdenes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [formatosCampo, setFormatosCampo] = useState([]);
  const [tiposMuestreo, setTiposMuestreo] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editingOrden, setEditingOrden] = useState(null);
  const [detailOrden, setDetailOrden] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequestRef = useRef(0);
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [solicitudOrigen, setSolicitudOrigen] = useState(null);
  const [solicitudPrefillLoading, setSolicitudPrefillLoading] = useState(false);
  const [prefillWarning, setPrefillWarning] = useState(null);
  const [formStartStep, setFormStartStep] = useState(1);
  const prefillWarnedRef = useRef(null);

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
      const [users, campos, tipos, deps, muns, labs] = await Promise.all([
        getUsuarios(),
        getFormatosCampo(),
        getTiposMuestreo(),
        getDepartamentos(),
        getMunicipios(),
        getLaboratorios(),
      ]);
      setUsuarios((users ?? []).filter((u) => u.activo !== false && u.Activo !== false));
      setFormatosCampo(campos);
      setTiposMuestreo((tipos ?? []).filter((t) => t.activo !== false));
      setDepartamentos(deps ?? []);
      setMunicipios(muns ?? []);
      setLaboratorios((labs ?? []).filter((l) => l.activo !== false && l.Activo !== false));
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
    if (!isCreateRoute || isCreateFromSolicitud || isEditRoute) return;
    addToast(
      "Para crear una orden elija una solicitud: menú ⋮ → Crear Orden de servicio.",
      "info",
    );
    navigate(ROUTES.solicitudServicio, { replace: true });
  }, [isCreateRoute, isCreateFromSolicitud, isEditRoute, addToast, navigate]);

  useEffect(() => {
    if (!isFormRoute) return;

    if (isCreateFromSolicitud) {
      if (catalogsLoading || loading) return;

      let cancelled = false;

      async function loadSolicitudPrefill() {
        try {
          setSolicitudPrefillLoading(true);
          const [data, proformas] = await Promise.all([
            getSolicitudById(solicitudIdParam),
            getProformas(),
          ]);
          if (cancelled) return;

          const today = new Date().toISOString().slice(0, 10);
          const base = { ...initialForm, fecha: today };
          const proforma = findProformaBySolicitud(proformas, solicitudIdParam);
          const numeroOrden = suggestNextNumeroOrden(ordenes);
          const proformaNo = proforma?.numeroProforma ?? proforma?.NumeroProforma ?? "";
          const tipoMuestreoNombre = proforma?.tiposMuestreo ?? proforma?.TiposMuestreo ?? "";

          setEditingOrden(null);
          setSolicitudOrigen(data);
          const mapped = mapSolicitudToOrdenForm(data, {
            initialForm: {
              ...base,
              idFormatoSolicitud: String(solicitudIdParam),
            },
            usuarios,
            idUsuarioSesion,
            numeroOrden,
            proformaNo,
            tipoMuestreoNombre,
            proforma,
          });
          if (tipoMuestreoNombre) {
            const match = tiposMuestreo.find((t) => {
              const n = String(t.nombreTipoMuestreo ?? t.nombre ?? "").toLowerCase();
              return n && tipoMuestreoNombre.toLowerCase().includes(n);
            });
            if (match) mapped.idTipoMuestreo = String(match.idTipoMuestreo);
          }
          setForm(mapped);
          if (!tipoMuestreoNombre && prefillWarnedRef.current !== String(solicitudIdParam)) {
            prefillWarnedRef.current = String(solicitudIdParam);
            const numeroSolicitud = data.numeroSolicitud ?? data.NumeroSolicitud ?? "";
            setPrefillWarning({
              kind: proforma ? "sin-tipo-muestreo" : "sin-proforma",
              numeroSolicitud,
            });
          }
          setFormErrors({});
        } catch (err) {
          if (!cancelled) {
            addToast(err?.message || "No se pudo cargar la solicitud", "error");
            navigate(ROUTES.solicitudServicio);
          }
        } finally {
          if (!cancelled) setSolicitudPrefillLoading(false);
        }
      }

      loadSolicitudPrefill();
      return () => {
        cancelled = true;
      };
    }

    if (isEditRoute && editIdParam) {
      setSolicitudOrigen(null);
      let cancelled = false;
      (async () => {
        try {
          const detalle = await getOrdenServicioById(editIdParam);
          if (cancelled) return;
          setEditingOrden(detalle);
          setForm(mapOrdenToForm(detalle, usuarios));
          setFormErrors({});
        } catch {
          const orden = ordenes.find((o) => String(o.idFormatoOrden) === String(editIdParam));
          if (orden) {
            setEditingOrden(orden);
            setForm(mapOrdenToForm(orden, usuarios));
            setFormErrors({});
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [
    isFormRoute,
    isCreateRoute,
    isCreateFromSolicitud,
    isEditRoute,
    editIdParam,
    solicitudIdParam,
    ordenes,
    usuarios,
    tiposMuestreo,
    catalogsLoading,
    loading,
    addToast,
    navigate,
    idUsuarioSesion,
  ]);

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
        compuestoOtroTiempo: "",
        modalidadMuestreoOtros: value === "otros" ? prev.modalidadMuestreoOtros : "",
        idTipoMuestreo: (() => {
          const match = tiposMuestreo.find((t) => modalidadFromTipoNombre(t.nombreTipoMuestreo ?? t.nombre) === value);
          return match ? String(match.idTipoMuestreo) : "";
        })(),
      }));
      setFormErrors((prev) => ({
        ...prev,
        compuestoOpcion: "",
        modalidadMuestreoOtros: "",
        idTipoMuestreo: "",
      }));
      return;
    }

    if (name === "compuestoOtroTiempo") {
      setForm((prev) => ({
        ...prev,
        compuestoOtroTiempo: value,
      }));
      setFormErrors((prev) => ({ ...prev, compuestoOpcion: "" }));
      return;
    }

    if (COMPOUESTO_OPTION_KEYS.includes(name) && type === "checkbox") {
      setForm((prev) => {
        const merged = { ...prev, [name]: checked };
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

    if (name === "idTipoMuestreo") {
      const tipo = tiposMuestreo.find((t) => String(t.idTipoMuestreo) === String(value));
      const modalidad = modalidadFromTipoNombre(tipo?.nombreTipoMuestreo ?? tipo?.nombre);
      setForm((prev) => ({
        ...prev,
        idTipoMuestreo: value,
        modalidadMuestreo: modalidad,
        compuesto8h: modalidad === "compuesto" ? prev.compuesto8h : false,
        compuesto12h: modalidad === "compuesto" ? prev.compuesto12h : false,
        compuesto16h: modalidad === "compuesto" ? prev.compuesto16h : false,
        compuesto24h: modalidad === "compuesto" ? prev.compuesto24h : false,
        compuestoOtroTiempo: modalidad === "compuesto" ? prev.compuestoOtroTiempo : "",
        modalidadMuestreoOtros: modalidad === "otros" ? prev.modalidadMuestreoOtros : "",
      }));
      setFormErrors((prev) => ({ ...prev, idTipoMuestreo: "", compuestoOpcion: "", modalidadMuestreoOtros: "" }));
      return;
    }

    if (name === "idUsuario") {
      const u = usuarios.find((x) => String(x.idUsuario ?? x.IdUsuario) === value);
      const nombre = u ? labelUsuario(u) : "";
      setForm((prev) => ({
        ...prev,
        idUsuario: value,
        usuarioEmpresa: nombre || prev.usuarioEmpresa,
      }));
      return;
    }

    if (name === "idFirmaUsuario" || name === "idFirmaApe") {
      const u = findUsuarioById(usuarios, value);
      const nombreField = name === "idFirmaUsuario" ? "firmaUsuario" : "firmaApe";
      setForm((prev) => ({
        ...prev,
        [name]: value,
        [nombreField]: u ? labelUsuario(u) : "",
      }));
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
    setForm((prev) => {
      const nextIndex = prev.detalleMuestras.length + 1;
      return {
        ...prev,
        detalleMuestras: [
          ...prev.detalleMuestras,
          emptyDetalleRow(nextIndex, nextIndex),
        ],
      };
    });
  }

  function handleRemoveDetalleRow(index) {
    setForm((prev) => ({
      ...prev,
      detalleMuestras: assignCodigosAsignados(
        prev.detalleMuestras.filter((_, i) => i !== index),
      ),
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

  function closeDetalle() {
    detailRequestRef.current += 1;
    setDetailOrden(null);
    setDetailLoading(false);
  }

  async function abrirDetalle(orden) {
    const req = ++detailRequestRef.current;
    setDetailOrden(orden);
    setDetailLoading(true);
    try {
      const full = await getOrdenServicioById(orden.idFormatoOrden);
      if (detailRequestRef.current !== req) return;
      setDetailOrden(full ?? orden);
    } catch (err) {
      if (detailRequestRef.current !== req) return;
      addToast(err.message || "No se pudo cargar el detalle completo de la orden.", "error");
    } finally {
      if (detailRequestRef.current === req) setDetailLoading(false);
    }
  }

  function openEditForm(orden) {
    closeDetalle();
    navigate(ROUTES.formatosOrdenServicioEditar(orden.idFormatoOrden));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const extras = {
      usuarios,
      formatosCampo,
      idUsuarioSesion,
      catalogsReady: !catalogsLoading,
    };
    const issues = collectOrdenIssues(form, extras);
    setFormErrors(issuesToFormErrors(issues));
    if (issues.length > 0) {
      const validationError = new Error("Revise los campos indicados para crear la orden.");
      validationError.issues = issues;
      throw validationError;
    }

    try {
      setSaving(true);
      const payload = formToOrdenServicioPayload(form, {
        tiposMuestreo,
        idUsuarioSesion,
        idFormatoSolicitud:
          solicitudIdParam ||
          form.idFormatoSolicitud ||
          solicitudOrigen?.idFormatoSolicitud ||
          solicitudOrigen?.IdFormatoSolicitud ||
          null,
      });
      if (!payload.idUsuario) {
        throw new Error(
          "No se pudo determinar el usuario responsable. Inicie sesión o seleccione un usuario en el paso 1.",
        );
      }
      if (!payload.idFormatoCampo) {
        throw new Error("Seleccione un formato de campo en el paso 1.");
      }
      if (!payload.idTipoMuestreo) {
        throw new Error(
          form.modalidadMuestreo === "otros"
            ? "Para guardar «Otro» registre ese tipo en el catálogo de tipos de muestreo, o elija Puntual o Compuesto."
            : "Seleccione el tipo de muestreo en el paso 2.",
        );
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
    if (isCreateFromSolicitud && solicitudPrefillLoading) {
      return (
        <div className="flex flex-1 items-center justify-center gap-2 py-20 text-gray-500">
          <FaSpinner className="h-6 w-6 animate-spin" />
          <span>Cargando datos de la solicitud…</span>
        </div>
      );
    }

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
      <>
      <OrdenServicioFormView
        form={form}
        formErrors={formErrors}
        onFormErrors={setFormErrors}
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
        isEditing={Boolean(editingOrden?.idFormatoOrden)}
        catalogsLoading={catalogsLoading}
        idUsuarioSesion={idUsuarioSesion}
        departamentos={departamentos}
        municipiosFiltrados={municipiosFiltrados}
        usuarios={usuarios}
        laboratorios={laboratorios}
        formatosCampo={formatosCampo}
        tiposMuestreo={tiposMuestreo}
        solicitudOrigen={
          solicitudOrigen?.numeroSolicitud ??
          solicitudOrigen?.NumeroSolicitud ??
          (solicitudIdParam ? `#${solicitudIdParam}` : null)
        }
        initialStep={formStartStep}
      />
      <OrdenPrefillWarningModal
        open={Boolean(prefillWarning)}
        kind={prefillWarning?.kind}
        numeroSolicitud={prefillWarning?.numeroSolicitud}
        onClose={() => setPrefillWarning(null)}
        onContinueHere={() => {
          setPrefillWarning(null);
          setFormStartStep(2);
        }}
        onGoToProforma={() => {
          setPrefillWarning(null);
          if (prefillWarning?.kind === "sin-tipo-muestreo") {
            navigate(ROUTES.proformas);
            return;
          }
          navigate(ROUTES.nuevaProformaFromSolicitud(solicitudIdParam));
        }}
      />
      </>
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
        <NavLink to={ROUTES.solicitudServicio} className={tabClass}>
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
                        onClick={() => abrirDetalle(orden)}
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

      {detailOrden || detailLoading ? (
        <OrdenServicioDetalleModal
          detail={detailOrden}
          loading={detailLoading}
          formatosCampo={formatosCampo}
          usuarios={usuarios}
          onClose={closeDetalle}
          onEdit={detailOrden ? () => openEditForm(detailOrden) : undefined}
        />
      ) : null}

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

