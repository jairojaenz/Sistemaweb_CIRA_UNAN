import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEye, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { useAuth } from "../../../auth/AuthContext.jsx";
import SignaturePad from "../../../components/SignaturePad.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { getDepartamentos, getMunicipios } from "../../usuarios/service/usuarioService.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import { createCliente, getClientes } from "../service/clienteService.js";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const TIPOS_CLIENTE = ["Individuo", "Empresa", "Institución", "ONG", "Otro"];

const CAMPOS_TELEFONO_LOCAL = new Set(["TelefonoCliente", "CelularCliente"]);

const initialForm = {
  NombreCliente: "",
  ApellidoCliente: "",
  TelefonoCliente: "",
  CelularCliente: "",
  CorreoCliente: "",
  DireccionCliente: "",
  CedulaCliente: "",
  NombreDepartamento: "",
  NombreMunicipio: "",
  NombreTipoCliente: "Individuo",
  Activo: true,
};

export default function GestionClientesPage() {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [departamentos, setDepartamentos] = useState([]);
  const [allMunicipios, setAllMunicipios] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailCliente, setDetailCliente] = useState(null);

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
    return (
      c.nombreCliente?.toLowerCase().includes(q) ||
      c.apellidoCliente?.toLowerCase().includes(q) ||
      c.correoCliente?.toLowerCase().includes(q) ||
      c.cedulaCliente?.toLowerCase().includes(q)
    );
  });

  function validateField(name, value) {
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
    const updates = { [name]: nextVal };
    if (name === "NombreDepartamento") {
      updates.NombreMunicipio = "";
    }
    setForm((prev) => ({ ...prev, ...updates }));
    const error = validateField(
      name,
      type === "checkbox" ? (checked ? "x" : "") : nextVal
    );
    setFormErrors((prev) => ({ ...prev, [name]: error }));
    if (name === "NombreDepartamento") {
      setFormErrors((prev) => ({ ...prev, NombreMunicipio: "" }));
    }
  }

  function isFormValid() {
    const fields = [
      "NombreCliente",
      "ApellidoCliente",
      "CorreoCliente",
      "NombreDepartamento",
      "NombreMunicipio",
      "NombreTipoCliente",
    ];
    for (const f of fields) {
      const val = form[f] || "";
      if (!String(val).trim()) return false;
      if (validateField(f, val)) return false;
    }
    if (!firmaFile) return false;
    return true;
  }

  function openCreateModal() {
    setDetailCliente(null);
    setForm({ ...initialForm, Activo: true });
    setFormErrors({});
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
    setCreateModalOpen(true);
  }

  function openDetailModal(c) {
    setCreateModalOpen(false);
    setDetailCliente(c);
  }

  function closeDetailModal() {
    setDetailCliente(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;
    const payload = { ...form, IdUsuario: idUsuarioActual };
    setSaving(true);
    try {
      await createCliente(payload, firmaFile);
      addToast("Cliente creado exitosamente", "success");
      setCreateModalOpen(false);
      setFirmaFile(null);
      setSignatureResetVersion((v) => v + 1);
      await loadClientes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const fullName = (c) => `${c.nombreCliente || ""} ${c.apellidoCliente || ""}`.trim();

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
              placeholder="Buscar por nombre, correo o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-3 font-semibold sm:px-4">Nombre</th>
                  <th className="px-3 py-3 font-semibold sm:px-4">Correo</th>
                  <th className="px-3 py-3 font-semibold sm:px-4">Teléfono</th>
                  <th className="px-3 py-3 font-semibold sm:px-4">Ubicación</th>
                  <th className="px-3 py-3 font-semibold sm:px-4">Tipo</th>
                  <th className="px-3 py-3 font-semibold sm:px-4">Estado</th>
                  <th className="px-3 py-3 font-semibold sm:px-4">Ver</th>
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
                      <td className="px-3 py-2 font-medium text-gray-900 sm:px-4">{fullName(c)}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-gray-600 sm:px-4">
                        {c.correoCliente}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 sm:px-4">
                        {formatTelefonoLocal(c.celularCliente || c.telefonoCliente || "") || "—"}
                      </td>
                      <td className="max-w-[180px] px-3 py-2 text-gray-600 sm:px-4">
                        <span className="line-clamp-2">
                          {[c.municipio, c.departamento].filter(Boolean).join(", ") || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 sm:px-4">{c.tiposCliente || "—"}</td>
                      <td className="px-3 py-2 sm:px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            c.activo !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              c.activo !== false ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          {c.activo !== false ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-4">
                        <button
                          type="button"
                          title="Ver detalle del cliente"
                          onClick={() => openDetailModal(c)}
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-100"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
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
                <DetailRow label="Cédula" value={detailCliente.cedulaCliente} />
                <DetailRow label="Departamento" value={detailCliente.departamento} />
                <DetailRow label="Municipio" value={detailCliente.municipio} />
                <DetailRow label="Tipo de cliente" value={detailCliente.tiposCliente} />
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
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
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
              <h2 className="text-lg font-semibold text-gray-800">Nuevo Cliente</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
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

              <InputField
                label="Cédula"
                name="CedulaCliente"
                value={form.CedulaCliente}
                onChange={handleFormChange}
              />

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
                  <span className="ml-0.5 text-red-500">*</span>
                </p>
                <SignaturePad
                  resetVersion={signatureResetVersion}
                  disabled={saving}
                  onChange={setFirmaFile}
                />
                {!firmaFile && (
                  <p className="mt-1 text-xs text-amber-700">Debe firmar en el recuadro para crear el cliente.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
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
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

function FirmaDisplay({ src }) {
  if (!src || typeof src !== "string") {
    return <p className="text-sm text-gray-500">Sin firma registrada.</p>;
  }
  const normalized = src.startsWith("DATA:") ? `data:${src.slice(5)}` : src;
  const isImg =
    /^data:image\//i.test(normalized) ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://");
  if (isImg) {
    return (
      <img
        src={normalized}
        alt="Firma del cliente"
        className="max-h-48 max-w-full rounded border border-gray-200 object-contain"
      />
    );
  }
  return (
    <p className="break-all text-xs text-gray-600" title="Contenido de firma (no es imagen incrustada)">
      Firma almacenada (vista previa no disponible en este formato).
    </p>
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
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`input ${error ? "border-red-400 ring-1 ring-red-400" : ""}`}
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
