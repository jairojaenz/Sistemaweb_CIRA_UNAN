import { useState, useEffect, useCallback, useMemo } from "react";
import { FaPlus, FaEdit, FaEye, FaTrash, FaTimes, FaSpinner, FaSearch } from "react-icons/fa";
import { useToast } from "../../../components/ToastContext";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import ConfirmDialog from "../../../components/ConfirmDialog";
import SignaturePad from "../../../components/SignaturePad.jsx";
import FirmaDisplay from "../../../components/FirmaDisplay.jsx";
import {
  getUsuarios, createUsuario, updateUsuario, deleteUsuario, toggleUsuarioStatus,
  getCargos, getDepartamentos, getMunicipios, getLaboratorios,
} from "../service/usuarioService";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const initialForm = {
  NombreUsuario: "",
  ApellidoUsuario: "",
  CorreoUsuario: "",
  Password: "",
  PasswordNueva: "",
  Cargo: "",
  NombreDep: "",
  NombreMunic: "",
  Laboratorio: "",
  CelularUsuario: "",
  CedulaUsuario: "",
};

export default function GestionUsuariosPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [cargos, setCargos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [allMunicipios, setAllMunicipios] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [firmaFile, setFirmaFile] = useState(null);
  const [signatureResetVersion, setSignatureResetVersion] = useState(0);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [detailUser, setDetailUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsers(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadCatalogs = useCallback(async () => {
    try {
      setCatalogsLoading(true);
      const [c, d, m, l] = await Promise.all([
        getCargos(), getDepartamentos(), getMunicipios(), getLaboratorios(),
      ]);
      setCargos(c ?? []);
      setDepartamentos(d ?? []);
      setAllMunicipios(m ?? []);
      setLaboratorios(l ?? []);
    } catch {
      addToast("Error al cargar catálogos", "error");
    } finally {
      setCatalogsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadCatalogs(); }, [loadCatalogs]);

  const departamentoMap = useMemo(() => {
    const map = {};
    for (const d of departamentos) {
      map[d.nombreDepartamento] = d.idDepartamento;
    }
    return map;
  }, [departamentos]);

  const filteredMunicipios = useMemo(() => {
    const depId = departamentoMap[form.NombreDep];
    if (!depId) return [];
    return allMunicipios.filter((m) => m.idDepartamento === depId);
  }, [allMunicipios, departamentoMap, form.NombreDep]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nombreUsuario?.toLowerCase().includes(q) ||
      u.apellidoUsuario?.toLowerCase().includes(q) ||
      u.correoUsuario?.toLowerCase().includes(q)
    );
  });

  function validateField(name, value) {
    if (["NombreUsuario", "ApellidoUsuario", "CorreoUsuario", "Cargo", "NombreDep", "NombreMunic", "Laboratorio"].includes(name) && !value) {
      return "Este campo es requerido";
    }
    if (!editingUser && name === "Password" && !value) {
      return "La contraseña es requerida";
    }
    if (name === "CorreoUsuario" && value && !EMAIL_REGEX.test(value)) {
      return "Formato de correo inválido";
    }
    return "";
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    let next = value;
    if (name === "CelularUsuario") {
      next = formatTelefonoLocal(value);
    }
    const updates = { [name]: next };
    if (name === "NombreDep") {
      updates.NombreMunic = "";
    }
    setForm((prev) => ({ ...prev, ...updates }));
    const error = validateField(name, next);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
    if (name === "NombreDep") {
      setFormErrors((prev) => ({ ...prev, NombreMunic: "" }));
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
    setFormErrors({});
  }

  function isFormValid() {
    const fields = editingUser
      ? ["NombreUsuario", "ApellidoUsuario", "CorreoUsuario", "Cargo", "NombreDep", "NombreMunic", "Laboratorio"]
      : ["NombreUsuario", "ApellidoUsuario", "CorreoUsuario", "Password", "Cargo", "NombreDep", "NombreMunic", "Laboratorio"];
    for (const f of fields) {
      const val = form[f] || "";
      if (!val) return false;
      const err = validateField(f, val);
      if (err) return false;
    }
    if (!editingUser && !firmaFile) return false;
    return true;
  }

  function openCreateModal() {
    setEditingUser(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
    setModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setForm({
      NombreUsuario: user.nombreUsuario || "",
      ApellidoUsuario: user.apellidoUsuario || "",
      CorreoUsuario: user.correoUsuario || "",
      Password: "",
      PasswordNueva: "",
      Cargo: user.cargo || "",
      NombreDep: user.departamento || "",
      NombreMunic: user.municipio || "",
      Laboratorio: user.laboratorio || "",
      CelularUsuario: formatTelefonoLocal(user.celularUsuario || ""),
      CedulaUsuario: user.cedulaUsuario || "",
    });
    setFormErrors({});
    setFirmaFile(null);
    setSignatureResetVersion((v) => v + 1);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;
    setSaving(true);
    try {
      if (editingUser) {
        await updateUsuario(editingUser.idUsuario, form, firmaFile);
        addToast("Usuario actualizado exitosamente", "success");
      } else {
        await createUsuario(form, firmaFile);
        addToast("Usuario creado exitosamente", "success");
      }
      closeModal();
      await loadUsers();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(user) {
    setToggling(user.idUsuario);
    try {
      await toggleUsuarioStatus(user.idUsuario);
      addToast(
        user.activo ? "Usuario desactivado exitosamente" : "Usuario activado exitosamente",
        "success"
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.idUsuario === user.idUsuario ? { ...u, activo: !u.activo } : u
        )
      );
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setToggling(null);
      setConfirmToggle(null);
    }
  }

  async function handleDelete(user) {
    try {
      await deleteUsuario(user.idUsuario);
      addToast("Usuario eliminado exitosamente", "success");
      await loadUsers();
    } catch (err) {
      if (err.message?.toLowerCase().includes("registro") || err.message?.toLowerCase().includes("relacion")) {
        addToast("No se puede eliminar el usuario porque tiene registros de muestras asociados", "error");
      } else {
        addToast(err.message, "error");
      }
    } finally {
      setConfirmDelete(null);
    }
  }

  function openDetailModal(user) {
    setDetailUser(user);
  }

  function closeDetailModal() {
    setDetailUser(null);
  }

  const fullName = (u) => `${u.nombreUsuario || ""} ${u.apellidoUsuario || ""}`.trim();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">Nombre</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Correo Institucional</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando usuarios...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                  {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.idUsuario} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                    {fullName(user)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 sm:px-6">{user.correoUsuario}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.activo ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {user.activo ? "Activo" : "Inhabilitado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={user.activo}
                          disabled={toggling === user.idUsuario}
                          onChange={() => setConfirmToggle(user)}
                        />
                        <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                      </label>

                      <button
                        type="button"
                        title="Editar usuario"
                        onClick={() => openEditModal(user)}
                        className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        title="Ver detalle del usuario"
                        onClick={() => openDetailModal(user)}
                        className="rounded p-1.5  text-slate-600 hover:bg-blue-100"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>

                      {toggling === user.idUsuario && (
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Nombre"
                  name="NombreUsuario"
                  value={form.NombreUsuario}
                  error={formErrors.NombreUsuario}
                  onChange={handleFormChange}
                  required
                />
                <InputField
                  label="Apellido"
                  name="ApellidoUsuario"
                  value={form.ApellidoUsuario}
                  error={formErrors.ApellidoUsuario}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <InputField
                label="Correo Institucional"
                name="CorreoUsuario"
                type="email"
                value={form.CorreoUsuario}
                error={formErrors.CorreoUsuario}
                onChange={handleFormChange}
                required
                placeholder="usuario@correo.unan.edu.ni"
              />

              {editingUser ? (
                <InputField
                  label="Nueva Contraseña (dejar vacío para mantener)"
                  name="PasswordNueva"
                  type="password"
                  value={form.PasswordNueva}
                  onChange={handleFormChange}
                />
              ) : (
                <InputField
                  label="Contraseña"
                  name="Password"
                  type="password"
                  value={form.Password}
                  error={formErrors.Password}
                  onChange={handleFormChange}
                  required
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label="Cargo"
                  name="Cargo"
                  value={form.Cargo}
                  error={formErrors.Cargo}
                  onChange={handleFormChange}
                  options={cargos}
                  optionValue="nombreCargo"
                  optionLabel="nombreCargo"
                  loading={catalogsLoading}
                  required
                />
                <SelectField
                  label="Departamento"
                  name="NombreDep"
                  value={form.NombreDep}
                  error={formErrors.NombreDep}
                  onChange={handleFormChange}
                  options={departamentos}
                  optionValue="nombreDepartamento"
                  optionLabel="nombreDepartamento"
                  loading={catalogsLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label="Municipio"
                  name="NombreMunic"
                  value={form.NombreMunic}
                  error={formErrors.NombreMunic}
                  onChange={handleFormChange}
                  options={filteredMunicipios}
                  optionValue="nombreMunicipio"
                  optionLabel="nombreMunicipio"
                  loading={catalogsLoading}
                  disabled={!form.NombreDep}
                  required
                />
                <SelectField
                  label="Laboratorio"
                  name="Laboratorio"
                  value={form.Laboratorio}
                  error={formErrors.Laboratorio}
                  onChange={handleFormChange}
                  options={laboratorios}
                  optionValue="nombreLaboratorio"
                  optionLabel="nombreLaboratorio"
                  loading={catalogsLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Celular"
                  name="CelularUsuario"
                  value={form.CelularUsuario}
                  onChange={handleFormChange}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="0000-0000"
                />
                <InputField
                  label="Cédula"
                  name="CedulaUsuario"
                  value={form.CedulaUsuario}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Firma digital del usuario
                  {!editingUser && <span className="ml-0.5 text-red-500">*</span>}
                </p>
                <p className="mb-2 text-xs text-gray-500">
                  Área de captura. Firme en el recuadro apaisado. Se enviará como PNG.
                </p>
                {editingUser && (
                  <p className="mb-2 text-xs text-gray-600">
                    La firma guardada se conserva. Dibuje de nuevo solo si desea reemplazarla.
                  </p>
                )}
                <SignaturePad
                  resetVersion={signatureResetVersion}
                  disabled={saving}
                  onChange={setFirmaFile}
                />
                {!editingUser && !firmaFile && (
                  <p className="mt-1 text-xs text-amber-700">Debe firmar en el recuadro para crear el usuario.</p>
                )}
              </div>

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
                  disabled={!isFormValid() || saving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle del Usuario</h2>
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
                <DetailRow label="Nombre completo" value={fullName(detailUser)} />
                <DetailRow label="Correo" value={detailUser.correoUsuario} />
                <DetailRow label="Cédula" value={detailUser.cedulaUsuario} />
                <DetailRow label="Celular" value={formatTelefonoLocal(detailUser.celularUsuario || "") || "—"} />
                <DetailRow label="Cargo" value={detailUser.cargo} />
                <DetailRow label="Departamento" value={detailUser.departamento} />
                <DetailRow label="Municipio" value={detailUser.municipio} />
                <DetailRow label="Laboratorio" value={detailUser.laboratorio} />
                <DetailRow
                  label="Estado"
                  value={detailUser.activo ? "Activo" : "Inhabilitado"}
                />
              </dl>

              <div className="border-t pt-4">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Firma del usuario
                </h3>
                <div className="flex justify-center rounded-md border border-gray-200 bg-gray-50 p-4">
                  <FirmaDisplay src={detailUser.firmaUsuario} alt="Firma del usuario" />
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

      <ConfirmDialog
        open={!!confirmToggle}
        title="Cambiar Estado"
        message={`¿Está seguro de que desea ${confirmToggle?.activo ? "desactivar" : "activar"} al usuario "${confirmToggle ? fullName(confirmToggle) : ""}"?`}
        confirmText={confirmToggle?.activo ? "Desactivar" : "Activar"}
        confirmClass={confirmToggle?.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
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
  inputMode,
  autoComplete,
}) {
  const id = `field-${name}`;
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

function DetailRow({ label, value }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-3 sm:grid-cols-3 sm:gap-2">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">{display}</dd>
    </div>
  );
}

function SelectField({ label, name, value, error, onChange, options, optionValue, optionLabel, loading, disabled, required }) {
  const id = `field-${name}`;
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
        <option value="">{loading ? "Cargando..." : disabled ? "Seleccione un departamento primero" : `Seleccione ${label.toLowerCase()}`}</option>
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
