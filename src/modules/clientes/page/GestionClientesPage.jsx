import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEllipsisV, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { ROUTES } from "../../../router/routes.js";
import { useAuth } from "../../../auth/AuthContext.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import SignaturePad, { FIRMA_CANVAS_ALTO, FIRMA_CANVAS_ANCHO } from "../../../components/SignaturePad.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { getDepartamentos, getMunicipios } from "../../usuarios/service/usuarioService.js";
import { CEDULA_NICARAGUA_REGEX, formatCedulaNicaragua } from "../../../utils/cedulaNicaraguaFormat.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import { createCliente, getClientes, toggleClienteStatus, updateCliente } from "../service/clienteService.js";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const TIPOS_CLIENTE = ["Individuo", "Empresa", "Institución", "ONG", "Otro"];

const TIPO_INDIVIDUO = "Individuo";

/** Tipos jurídicos que identifican con RUC (no cédula de persona natural). */
const TIPOS_RUC_OBLIGATORIO = new Set(["Empresa", "Institución", "ONG"]);

function tipoRequiereRucObligatorio(tipo) {
  return TIPOS_RUC_OBLIGATORIO.has(tipo);
}

const CAMPOS_TELEFONO_LOCAL = new Set(["TelefonoCliente", "CelularCliente"]);

const initialForm = {
  NombreCliente: "",
  ApellidoCliente: "",
  NombreContacto: "",
  TelefonoCliente: "",
  CelularCliente: "",
  CorreoCliente: "",
  DireccionCliente: "",
  CedulaCliente: "",
  NumeroRuc: "",
  NombreDepartamento: "",
  NombreMunicipio: "",
  NombreTipoCliente: "Individuo",
  Activo: true,
};

/** Mapea un cliente del API (camelCase) al estado del formulario de alta/edición. */
function mapClienteToForm(c) {
  const tipo = c.tiposCliente ?? c.nombreTipoCliente ?? TIPO_INDIVIDUO;
  const esInd = tipo === TIPO_INDIVIDUO;
  return {
    NombreCliente: c.nombreCliente ?? "",
    ApellidoCliente: c.apellidoCliente ?? "",
    NombreContacto: !esInd ? String(c.nombreContacto ?? c.NombreContacto ?? "").trim() : "",
    TelefonoCliente: formatTelefonoLocal(c.telefonoCliente ?? ""),
    CelularCliente: formatTelefonoLocal(c.celularCliente ?? ""),
    CorreoCliente: c.correoCliente ?? "",
    DireccionCliente: c.direccionCliente ?? "",
    CedulaCliente: esInd ? formatCedulaNicaragua(c.cedulaCliente ?? "") : "",
    NumeroRuc: !esInd ? String(c.numeroRuc ?? c.NumeroRuc ?? "").trim() : "",
    NombreDepartamento: c.departamento ?? c.nombreDepartamento ?? "",
    NombreMunicipio: c.municipio ?? c.nombreMunicipio ?? "",
    NombreTipoCliente: tipo,
    Activo: c.activo !== false,
  };
}

function isClienteActivo(c) {
  return c.activo !== false;
}

export default function GestionClientesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [departamentos, setDepartamentos] = useState([]);
  const [allMunicipios, setAllMunicipios] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [detailCliente, setDetailCliente] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [menuClienteId, setMenuClienteId] = useState(null);
  const [clienteInactivoAviso, setClienteInactivoAviso] = useState(null);

  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [firmaFile, setFirmaFile] = useState(null);
  const [signatureResetVersion, setSignatureResetVersion] = useState(0);
  const [saving, setSaving] = useState(false);

  const idUsuarioActual = user?.idUsuario ?? user?.id ?? 0;

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadCatalogs = useCallback(async () => {
    try {
      setCatalogsLoading(true);
      const [d, m] = await Promise.all([getDepartamentos(), getMunicipios()]);
      setDepartamentos(d ?? []);
      setAllMunicipios(m ?? []);
    } catch {
      addToast("Error al cargar departamentos y municipios", "error");
    } finally {
      setCatalogsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    if (menuClienteId == null) return;
    const cerrarMenu = () => setMenuClienteId(null);
    document.addEventListener("click", cerrarMenu);
    return () => document.removeEventListener("click", cerrarMenu);
  }, [menuClienteId]);

  function irCrearSolicitud(cliente) {
    setMenuClienteId(null);
    if (!isClienteActivo(cliente)) {
      setClienteInactivoAviso(cliente);
      return;
    }
    const id = cliente.idCliente;
    if (!id) return;
    try {
      sessionStorage.setItem(`solicitud-cliente-${id}`, JSON.stringify(cliente));
    } catch {
      /* sessionStorage no disponible */
    }
    navigate(ROUTES.solicitudServicioCliente(id), { state: { cliente } });
  }

  const departamentoMap = useMemo(() => {
    const map = {};
    for (const dep of departamentos) {
      map[dep.nombreDepartamento] = dep.idDepartamento;
    }
    return map;
  }, [departamentos]);

  const filteredMunicipios = useMemo(() => {
    const depId = departamentoMap[form.NombreDepartamento];
    if (!depId) return [];
    return allMunicipios.filter((m) => m.idDepartamento === depId);
  }, [allMunicipios, departamentoMap, form.NombreDepartamento]);

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    const ruc = String(c.numeroRuc ?? c.NumeroRuc ?? "").toLowerCase();
    return (
      c.nombreCliente?.toLowerCase().includes(q) ||
      c.apellidoCliente?.toLowerCase().includes(q) ||
      c.correoCliente?.toLowerCase().includes(q) ||
      c.cedulaCliente?.toLowerCase().includes(q) ||
      ruc.includes(q) ||
      String(c.nombreContacto ?? c.NombreContacto ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  function validateField(name, value, mergedForm) {
    const tipo = mergedForm.NombreTipoCliente;
    const esInd = tipo === TIPO_INDIVIDUO;
    const rucObl = tipoRequiereRucObligatorio(tipo);

    if (name === "CedulaCliente") {
      if (!esInd) return "";
      const v = String(value ?? "").trim();
      if (!v) return "La cédula es obligatoria para tipo Individuo";
      if (!CEDULA_NICARAGUA_REGEX.test(v)) {
        return "Formato nicaragüense: 000-000000-0000F (13 dígitos y una letra mayúscula al final)";
      }
      return "";
    }
    if (name === "NumeroRuc") {
      if (esInd) return "";
      if (editingClienteId != null) return "";
      if (rucObl) {
        const v = String(value ?? "").trim();
        if (!v) return "El número RUC es obligatorio para Empresa, Institución u ONG";
        return "";
      }
      return "";
    }
    if (name === "NombreContacto") {
      if (esInd) return "";
      if (!String(value ?? "").trim()) {
        return "El nombre de contacto es obligatorio para este tipo de cliente";
      }
      return "";
    }
    if (
      [
        "NombreCliente",
        "ApellidoCliente",
        "CorreoCliente",
        "NombreDepartamento",
        "NombreMunicipio",
        "NombreTipoCliente",
      ].includes(name) &&
      !String(value ?? "").trim()
    ) {
      return "Este campo es requerido";
    }
    if (name === "CorreoCliente" && value && !EMAIL_REGEX.test(value)) {
      return "Formato de correo inválido";
    }
    return "";
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    let nextVal = type === "checkbox" ? checked : value;
    if (type !== "checkbox" && CAMPOS_TELEFONO_LOCAL.has(name)) {
      nextVal = formatTelefonoLocal(value);
    }
    if (type !== "checkbox" && name === "CedulaCliente") {
      nextVal = formatCedulaNicaragua(value);
    }

    const merged = { ...form, [name]: type === "checkbox" ? checked : nextVal };
    if (name === "NombreDepartamento") {
      merged.NombreMunicipio = "";
    }
    if (name === "NombreTipoCliente") {
      if (nextVal === TIPO_INDIVIDUO) {
        merged.NumeroRuc = "";
        merged.NombreContacto = "";
      } else {
        merged.CedulaCliente = "";
      }
    }

    setForm(merged);

    const valForError = type === "checkbox" ? (checked ? "x" : "") : merged[name];
    setFormErrors((prev) => {
      const nextErr = { ...prev, [name]: validateField(name, valForError, merged) };
      if (name === "NombreTipoCliente") {
        nextErr.CedulaCliente = validateField("CedulaCliente", merged.CedulaCliente, merged);
        nextErr.NumeroRuc = validateField("NumeroRuc", merged.NumeroRuc, merged);
        nextErr.NombreContacto = validateField("NombreContacto", merged.NombreContacto, merged);
      }
      if (name === "NombreDepartamento") {
        nextErr.NombreMunicipio = "";
      }
      return nextErr;
    });
  }

  function isFormValid() {
    const baseFields = [
      "NombreCliente",
      "ApellidoCliente",
      "CorreoCliente",
      "NombreDepartamento",
      "NombreMunicipio",
      "NombreTipoCliente",
    ];
    for (const f of baseFields) {
      const val = form[f] || "";
      if (!String(val).trim()) return false;
      if (validateField(f, val, form)) return false;
    }
    if (form.NombreTipoCliente === TIPO_INDIVIDUO) {
      if (validateField("CedulaCliente", form.CedulaCliente, form)) return false;
    } else {
      if (editingClienteId == null && validateField("NumeroRuc", form.NumeroRuc, form)) return false;
      if (validateField("NombreContacto", form.NombreContacto, form)) return false;
    }
    if (editingClienteId == null && !firmaFile) return false;
    return true;
  }

  function closeClienteModal() {
    setCreateModalOpen(false);
    setEditingClienteId(null);
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
  }

  function openCreateModal() {
    setDetailCliente(null);
    setEditingClienteId(null);
    setForm({ ...initialForm, Activo: true });
    setFormErrors({});
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
    setCreateModalOpen(true);
  }

  function openEditModal(c) {
    setDetailCliente(null);
    setEditingClienteId(c.idCliente);
    setForm(mapClienteToForm(c));
    setFormErrors({});
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
    setCreateModalOpen(true);
  }

  function openDetailModal(c) {
    setCreateModalOpen(false);
    setEditingClienteId(null);
    setDetailCliente(c);
  }

  function closeDetailModal() {
    setDetailCliente(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;
    const payload = { ...form, IdUsuario: idUsuarioActual };
    if (payload.NombreTipoCliente === TIPO_INDIVIDUO) {
      payload.NumeroRuc = "";
      payload.NombreContacto = "";
    } else {
      payload.CedulaCliente = "";
    }
    setSaving(true);
    try {
      if (editingClienteId != null) {
        await updateCliente(editingClienteId, payload, firmaFile);
        addToast("Cliente actualizado correctamente.", "success");
      } else {
        await createCliente(payload, firmaFile);
        addToast("Cliente creado exitosamente", "success");
      }
      closeClienteModal();
      setFormErrors({});
      await loadClientes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(cliente) {
    setToggling(cliente.idCliente);
    try {
      await toggleClienteStatus(cliente.idCliente);
      const estabaActivo = isClienteActivo(cliente);
      addToast(
        estabaActivo ? "Cliente desactivado exitosamente" : "Cliente activado exitosamente",
        "success"
      );
      setClientes((prev) =>
        prev.map((c) =>
          c.idCliente === cliente.idCliente ? { ...c, activo: !estabaActivo } : c
        )
      );
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setToggling(null);
      setConfirmToggle(null);
    }
  }

  const fullName = (c) => `${c.nombreCliente || ""} ${c.apellidoCliente || ""}`.trim();

  const esIndividuoForm = form.NombreTipoCliente === TIPO_INDIVIDUO;
  const rucObligatorioForm = tipoRequiereRucObligatorio(form.NombreTipoCliente);

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-white text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">Clientes</div>

      <main className="flex flex-grow justify-center bg-white py-6 px-4 sm:py-8">
        <div className="flex w-full max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              <FaPlus className="h-4 w-4" />
              Nuevo Cliente
            </button>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, contacto, correo, cédula o RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold sm:px-6">Nombre</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Correo</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Teléfono</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Ubicación</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Tipo</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
                  <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                      <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                      <span className="mt-2 block">Cargando clientes...</span>
                    </td>
                  </tr>
                ) : filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                      {search ? "No se encontraron clientes" : "No hay clientes registrados"}
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((c) => (
                    <tr key={c.idCliente} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">{fullName(c)}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-600 sm:px-6">
                        {c.correoCliente}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 sm:px-6">
                        {formatTelefonoLocal(c.celularCliente || c.telefonoCliente || "") || "—"}
                      </td>
                      <td className="max-w-[180px] px-4 py-3 text-gray-600 sm:px-6">
                        <span className="line-clamp-2">
                          {[c.municipio, c.departamento].filter(Boolean).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 sm:px-6">{c.tiposCliente || "—"}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isClienteActivo(c)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isClienteActivo(c) ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          {isClienteActivo(c) ? "Activo" : "Inhabilitado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isClienteActivo(c)}
                              disabled={toggling === c.idCliente}
                              onChange={() => setConfirmToggle(c)}
                            />
                            <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                          </label>

                          <div className="relative">
                            <button
                              type="button"
                              title="Más acciones"
                              aria-expanded={menuClienteId === c.idCliente}
                              aria-haspopup="menu"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuClienteId((prev) =>
                                  prev === c.idCliente ? null : c.idCliente
                                );
                              }}
                              className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                            >
                              <FaEllipsisV className="h-4 w-4" />
                            </button>
                            {menuClienteId === c.idCliente && (
                              <div
                                role="menu"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => {
                                    openEditModal(c);
                                    setMenuClienteId(null);
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => {
                                    openDetailModal(c);
                                    setMenuClienteId(null);
                                  }}
                                >
                                  Ver
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => irCrearSolicitud(c)}
                                >
                                  Crear Solicitud
                                </button>
                              </div>
                            )}
                          </div>

                          {toggling === c.idCliente && (
                            <FaSpinner className="h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-blue-900 py-2 text-center text-white">
        <p>© {new Date().getFullYear()} CIRA - UNAN Managua | Gestión de Clientes</p>
      </footer>

      {detailCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle del cliente</h2>
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
                <DetailRow label="Nombre" value={detailCliente.nombreCliente} />
                <DetailRow label="Apellido" value={detailCliente.apellidoCliente} />
                <DetailRow
                  label="Teléfono"
                  value={formatTelefonoLocal(detailCliente.telefonoCliente || "") || "—"}
                />
                <DetailRow
                  label="Celular"
                  value={formatTelefonoLocal(detailCliente.celularCliente || "") || "—"}
                />
                <DetailRow label="Correo" value={detailCliente.correoCliente} />
                <DetailRow label="Dirección" value={detailCliente.direccionCliente} />
                <DetailRow label="Tipo de cliente" value={detailCliente.tiposCliente} />
                {(detailCliente.tiposCliente ?? detailCliente.nombreTipoCliente ?? TIPO_INDIVIDUO) ===
                TIPO_INDIVIDUO ? (
                  <DetailRow label="Cédula" value={detailCliente.cedulaCliente} />
                ) : (
                  <>
                    <DetailRow
                      label="Número RUC"
                      value={detailCliente.numeroRuc ?? detailCliente.NumeroRuc}
                    />
                    <DetailRow
                      label="Nombre de contacto"
                      value={detailCliente.nombreContacto ?? detailCliente.NombreContacto}
                    />
                  </>
                )}
                <DetailRow label="Departamento" value={detailCliente.departamento} />
                <DetailRow label="Municipio" value={detailCliente.municipio} />
                <DetailRow
                  label="Estado"
                  value={detailCliente.activo !== false ? "Activo" : "Inactivo"}
                />
                <DetailRow label="ID cliente" value={detailCliente.idCliente} />
                <DetailRow label="ID usuario registro" value={detailCliente.idUsuario} />
                <DetailRow label="Fecha de creación" value={formatFecha(detailCliente.fechaCreacionCliente)} />
              </dl>

              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Firma</p>
                <p className="mb-2 text-xs text-gray-500">
                  Si la firma llega en Base64 desde el servidor, se decodifica automáticamente para mostrarla.
                </p>
                <div className="flex justify-center rounded-md border border-gray-200 bg-gray-50 p-4">
                  <FirmaDisplay src={detailCliente.firmaCliente} />
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingClienteId != null ? "Actualizar cliente" : "Nuevo Cliente"}
              </h2>
              <button
                type="button"
                onClick={closeClienteModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Nombre"
                  name="NombreCliente"
                  value={form.NombreCliente}
                  error={formErrors.NombreCliente}
                  onChange={handleFormChange}
                  required
                />
                <InputField
                  label="Apellido"
                  name="ApellidoCliente"
                  value={form.ApellidoCliente}
                  error={formErrors.ApellidoCliente}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Teléfono"
                  name="TelefonoCliente"
                  value={form.TelefonoCliente}
                  onChange={handleFormChange}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0000-0000"
                />
                <InputField
                  label="Celular"
                  name="CelularCliente"
                  value={form.CelularCliente}
                  onChange={handleFormChange}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0000-0000"
                />
              </div>

              <InputField
                label="Correo"
                name="CorreoCliente"
                type="email"
                value={form.CorreoCliente}
                error={formErrors.CorreoCliente}
                onChange={handleFormChange}
                required
              />

              <InputField
                label="Dirección"
                name="DireccionCliente"
                value={form.DireccionCliente}
                onChange={handleFormChange}
              />

              <SelectField
                label="Tipo de cliente"
                name="NombreTipoCliente"
                value={form.NombreTipoCliente}
                error={formErrors.NombreTipoCliente}
                onChange={handleFormChange}
                options={TIPOS_CLIENTE.map((t) => ({ nombreTipoCliente: t }))}
                optionValue="nombreTipoCliente"
                optionLabel="nombreTipoCliente"
                loading={false}
                required
              />

              {esIndividuoForm ? (
                <div className="max-w-md">
                  <InputField
                    label="Cédula"
                    name="CedulaCliente"
                    value={form.CedulaCliente}
                    error={formErrors.CedulaCliente}
                    onChange={handleFormChange}
                    required
                    placeholder="000-000000-0000F"
                    maxLength={16}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formato nicaragüense: 000-000000-0000F (13 dígitos y letra mayúscula al final).
                  </p>
                </div>
              ) : (
                <>
                  {editingClienteId == null ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <InputField
                        label="Número RUC"
                        name="NumeroRuc"
                        value={form.NumeroRuc}
                        error={formErrors.NumeroRuc}
                        onChange={handleFormChange}
                        required={rucObligatorioForm}
                        placeholder={
                          rucObligatorioForm ? "Obligatorio para Empresa, Institución u ONG" : "Opcional (tipo Otro)"
                        }
                      />
                      <InputField
                        label="Nombre de contacto"
                        name="NombreContacto"
                        value={form.NombreContacto}
                        error={formErrors.NombreContacto}
                        onChange={handleFormChange}
                        required
                        placeholder="Persona de contacto"
                      />
                    </div>
                  ) : (
                    <div className="max-w-md">
                      <InputField
                        label="Nombre de contacto"
                        name="NombreContacto"
                        value={form.NombreContacto}
                        error={formErrors.NombreContacto}
                        onChange={handleFormChange}
                        required
                        placeholder="Persona de contacto"
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {editingClienteId != null
                      ? "El número RUC no se edita aquí (el API de actualización no lo recibe). Puede actualizar el nombre de contacto."
                      : rucObligatorioForm
                        ? "Empresa, Institución u ONG: el RUC es obligatorio. El nombre de contacto también es obligatorio."
                        : "Tipo Otro: el RUC es opcional; el nombre de contacto es obligatorio."}
                  </p>
                </>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label="Departamento"
                  name="NombreDepartamento"
                  value={form.NombreDepartamento}
                  error={formErrors.NombreDepartamento}
                  onChange={handleFormChange}
                  options={departamentos}
                  optionValue="nombreDepartamento"
                  optionLabel="nombreDepartamento"
                  loading={catalogsLoading}
                  required
                />
                <SelectField
                  label="Municipio"
                  name="NombreMunicipio"
                  value={form.NombreMunicipio}
                  error={formErrors.NombreMunicipio}
                  onChange={handleFormChange}
                  options={filteredMunicipios}
                  optionValue="nombreMunicipio"
                  optionLabel="nombreMunicipio"
                  loading={catalogsLoading}
                  disabled={!form.NombreDepartamento}
                  required
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="Activo"
                  checked={form.Activo}
                  onChange={handleFormChange}
                  className="rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                />
                Cliente activo
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Firma digital del cliente
                  {editingClienteId == null && <span className="ml-0.5 text-red-500">*</span>}
                </p>
                <p className="mb-2 text-xs text-gray-500">
                  Área de captura {FIRMA_CANVAS_ANCHO}×{FIRMA_CANVAS_ALTO} px (apaisada, PNG).
                </p>
                {editingClienteId != null && (
                  <p className="mb-2 text-xs text-gray-600">
                    La firma guardada se conserva. Dibuje de nuevo solo si desea reemplazarla.
                  </p>
                )}
                <SignaturePad
                  resetVersion={signatureResetVersion}
                  disabled={saving}
                  onChange={setFirmaFile}
                />
                {editingClienteId == null && !firmaFile && (
                  <p className="mt-1 text-xs text-amber-700">Debe firmar en el recuadro para crear el cliente.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeClienteModal}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || saving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
                  {editingClienteId != null ? "Guardar cambios" : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmToggle}
        title="Cambiar Estado"
        message={`¿Está seguro de que desea ${confirmToggle && isClienteActivo(confirmToggle) ? "desactivar" : "activar"} al cliente "${confirmToggle ? fullName(confirmToggle) : ""}"?`}
        confirmText={confirmToggle && isClienteActivo(confirmToggle) ? "Desactivar" : "Activar"}
        confirmClass={
          confirmToggle && isClienteActivo(confirmToggle)
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />

      <ConfirmDialog
        open={!!clienteInactivoAviso}
        title="Usuario inactivo"
        message={`El usuario "${clienteInactivoAviso ? fullName(clienteInactivoAviso) : ""}" se encuentra inactivo. Actívelo antes de crear una solicitud de servicio.`}
        confirmText="Entendido"
        showCancel={false}
        confirmClass="bg-amber-600 hover:bg-amber-700"
        onConfirm={() => setClienteInactivoAviso(null)}
        onCancel={() => setClienteInactivoAviso(null)}
      />

    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

function DetailRow({ label, value }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 sm:grid-cols-3 sm:gap-2">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">{display}</dd>
    </div>
  );
}

/** Interpreta firma: URL, `data:image`, Base64 crudo, o prefijo `DATA:` en mayúsculas (respuesta GET). */
function parseFirmaContenido(src) {
  if (!src || typeof src !== "string") return null;
  let s = src.trim();
  if (s.length >= 5 && s.slice(0, 5).toUpperCase() === "DATA:") {
    s = `data:${s.slice(5)}`;
  }
  if (/^data:image\//i.test(s)) {
    s = s.replace(/^data:([^;]+);([^,]+),/i, (_, mime, enc) => `data:${mime.toLowerCase()};${enc.toLowerCase()},`);
    return { kind: "url", url: s };
  }
  if (s.startsWith("http://") || s.startsWith("https://")) return { kind: "url", url: s };
  const compact = s.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(compact) && compact.length >= 32) {
    return { kind: "b64", b64: compact };
  }
  return { kind: "text", text: s };
}

function FirmaDisplay({ src }) {
  const parsed = useMemo(() => parseFirmaContenido(src), [src]);
  const [mime, setMime] = useState("image/png");

  useEffect(() => {
    setMime("image/png");
  }, [src]);

  const boxStyle = {
    maxWidth: FIRMA_CANVAS_ANCHO,
    aspectRatio: `${FIRMA_CANVAS_ANCHO} / ${FIRMA_CANVAS_ALTO}`,
  };
  const boxClass =
    "relative mx-auto flex w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-white";

  if (!parsed) {
    return (
      <div className={boxClass} style={boxStyle}>
        <p className="px-2 text-center text-sm text-gray-500">Sin firma registrada.</p>
      </div>
    );
  }

  const imgClass = "h-full w-full object-contain";

  if (parsed.kind === "url") {
    return (
      <div className={boxClass} style={boxStyle}>
        <img src={parsed.url} alt="Firma del cliente" width={FIRMA_CANVAS_ANCHO} height={FIRMA_CANVAS_ALTO} className={imgClass} />
      </div>
    );
  }

  if (parsed.kind === "b64") {
    const dataUrl = `data:${mime};base64,${parsed.b64}`;
    return (
      <div className={boxClass} style={boxStyle}>
        <img
          src={dataUrl}
          alt="Firma del cliente (decodificada desde Base64)"
          width={FIRMA_CANVAS_ANCHO}
          height={FIRMA_CANVAS_ALTO}
          className={imgClass}
          onError={() => {
            if (mime === "image/png") setMime("image/jpeg");
          }}
        />
      </div>
    );
  }

  return (
    <div className={boxClass} style={boxStyle}>
      <p className="max-h-full overflow-auto px-2 text-center text-xs text-gray-600" title={parsed.text.slice(0, 120)}>
        No se pudo interpretar la firma como imagen (no es URL ni Base64 de imagen reconocible).
      </p>
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
  disabled,
  placeholder,
  maxLength,
  inputMode,
  autoComplete,
}) {
  const id = `cli-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`input ${error ? "border-red-400 ring-1 ring-red-400" : ""} ${disabled ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  error,
  onChange,
  options,
  optionValue,
  optionLabel,
  loading,
  disabled,
  required,
}) {
  const id = `cli-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={`select ${error ? "border-red-400 ring-1 ring-red-400" : ""}`}
      >
        <option value="">
          {loading ? "Cargando..." : disabled ? "Seleccione un departamento primero" : `Seleccione ${label.toLowerCase()}`}
        </option>
        {options.map((opt, i) => (
          <option key={opt[optionValue] ?? i} value={opt[optionValue]}>
            {opt[optionLabel]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
