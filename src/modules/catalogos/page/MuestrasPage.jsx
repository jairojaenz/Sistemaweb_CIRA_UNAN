import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaEye, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import ElevationField, { fetchElevacion } from "../../../components/ElevationField.jsx";
import { parseLatLng } from "../../../components/NicaraguaMapModal.jsx";
import { useToast } from "../../../components/ToastContext.jsx";

const NicaraguaMapModal = lazy(() => import("../../../components/NicaraguaMapModal.jsx"));
import { getDepartamentos } from "../service/departamentosService.js";
import { getFuentesMatriz } from "../service/fuentesMatrizService.js";
import { getMatrices } from "../service/matrizService.js";
import { getMunicipios } from "../service/municipiosService.js";
import {
  createMuestra,
  getMuestras,
  toggleMuestraStatus,
  updateMuestra,
} from "../service/muestrasService.js";

const initialForm = {
  identificacion: "",
  idMatriz: "",
  idFuente: "",
  idDepartamento: "",
  idMunicipio: "",
  latitud: "",
  longitud: "",
  elevacion: "",
  fechaToma: "",
  horaToma: "",
  cantidadEnvases: 1,
};

function validateField(name, value) {
  if (["identificacion", "idMatriz", "idFuente", "idDepartamento", "idMunicipio"].includes(name)) {
    if (!String(value ?? "").trim()) return "Este campo es requerido";
  }
  if (name === "cantidadEnvases" && Number(value) < 1) return "Debe ser al menos 1";
  return "";
}

export default function MuestrasPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [matrices, setMatrices] = useState([]);
  const [fuentes, setFuentes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [muestrasData, matricesData, fuentesData, deptosData, munisData] = await Promise.all([
        getMuestras(),
        getMatrices(),
        getFuentesMatriz(),
        getDepartamentos(),
        getMunicipios(),
      ]);
      setItems(muestrasData);
      setMatrices(matricesData);
      setFuentes(fuentesData);
      setDepartamentos(deptosData);
      setMunicipios(munisData);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((i) =>
      [i.identificacion, i.nombreMatriz, i.nombreFuente, i.nombreMunicipio, i.estado]
        .some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [items, search]);

  const fuentesFiltradas = useMemo(() => {
    if (!form.idMatriz) return fuentes;
    return fuentes.filter((f) => String(f.idMatriz) === String(form.idMatriz));
  }, [fuentes, form.idMatriz]);

  const municipiosFiltrados = useMemo(() => {
    if (!form.idDepartamento) return municipios;
    return municipios.filter((m) => String(m.idDepartamento) === String(form.idDepartamento));
  }, [municipios, form.idDepartamento]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === "idMatriz") next.idFuente = "";
      if (name === "idDepartamento") next.idMunicipio = "";
      return next;
    });
    setFormErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  }

  function isFormValid() {
    return ["identificacion", "idMatriz", "idFuente", "idDepartamento", "idMunicipio"]
      .every((name) => !validateField(name, form[name]));
  }

  function openCreateModal() {
    setEditing(null);
    setForm({ ...initialForm });
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditing(item);
    setForm({
      identificacion: item.identificacion || "",
      idMatriz: String(item.idMatriz || ""),
      idFuente: String(item.idFuente || ""),
      idDepartamento: String(item.idDepartamento || ""),
      idMunicipio: String(item.idMunicipio || ""),
      latitud: item.latitud || "",
      longitud: item.longitud || "",
      elevacion: item.elevacion || "",
      fechaToma: item.fechaToma || "",
      horaToma: item.horaToma || "",
      cantidadEnvases: item.cantidadEnvases || 1,
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateMuestra(editing.idMuestra, {
          ...form,
          estado: editing.estado || "Activo",
        });
        addToast("Muestra actualizada exitosamente", "success");
      } else {
        await createMuestra({ ...form, estado: "Activo" });
        addToast("Muestra creada exitosamente", "success");
      }
      closeModal();
      await loadData();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item) {
    setTogglingId(item.idMuestra);
    try {
      await toggleMuestraStatus(item);
      addToast(item.activo ? "Muestra desactivada" : "Muestra activada", "success");
      await loadData();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setTogglingId(null);
      setConfirmToggle(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" /> Nueva Muestra
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar por identificación, matriz, fuente o municipio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">Identificación</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Matriz</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Fuente</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Municipio</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando muestras...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500 sm:px-6">
                  {search ? "No se encontraron muestras" : "No hay muestras registradas"}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.idMuestra} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                    {item.identificacion}
                  </td>
                  <td className="px-4 py-3 text-gray-700 sm:px-6">{item.nombreMatriz || "—"}</td>
                  <td className="px-4 py-3 text-gray-700 sm:px-6">{item.nombreFuente || "—"}</td>
                  <td className="px-4 py-3 text-gray-700 sm:px-6">{item.nombreMunicipio || "—"}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.activo ? "bg-green-800" : "bg-red-800"}`} />
                      {item.estado || (item.activo ? "Activo" : "Inactivo")}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={item.activo}
                          disabled={togglingId === item.idMuestra}
                          onChange={() => setConfirmToggle(item)}
                        />
                        <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                      </label>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEditModal(item)}
                        className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Ver detalle"
                        onClick={() => setDetailItem(item)}
                        className="rounded p-1.5 text-blue-900 hover:bg-slate-100"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      {togglingId === item.idMuestra && (
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? "Editar Muestra" : "Nueva Muestra"}
              </h2>
              <button type="button" onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
              <InputField
                label="Identificación"
                name="identificacion"
                value={form.identificacion}
                error={formErrors.identificacion}
                onChange={handleFormChange}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Matriz"
                  name="idMatriz"
                  value={form.idMatriz}
                  error={formErrors.idMatriz}
                  onChange={handleFormChange}
                  required
                  options={matrices.map((m) => ({ value: String(m.idMatriz), label: m.nombreMatriz }))}
                />
                <SelectField
                  label="Fuente"
                  name="idFuente"
                  value={form.idFuente}
                  error={formErrors.idFuente}
                  onChange={handleFormChange}
                  required
                  options={fuentesFiltradas.map((f) => ({
                    value: String(f.idFuente),
                    label: f.nombreFuente,
                  }))}
                />
                <SelectField
                  label="Departamento"
                  name="idDepartamento"
                  value={form.idDepartamento}
                  error={formErrors.idDepartamento}
                  onChange={handleFormChange}
                  required
                  options={departamentos.map((d) => ({
                    value: String(d.idDepartamento),
                    label: d.nombreDepartamento,
                  }))}
                />
                <SelectField
                  label="Municipio"
                  name="idMunicipio"
                  value={form.idMunicipio}
                  error={formErrors.idMunicipio}
                  onChange={handleFormChange}
                  required
                  options={municipiosFiltrados.map((m) => ({
                    value: String(m.idMunicipio),
                    label: m.nombreMunicipio,
                  }))}
                />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Coordenadas
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="input cursor-pointer flex-1"
                      readOnly
                      placeholder="Marque el punto en el mapa"
                      value={
                        form.latitud && form.longitud
                          ? `${form.latitud}, ${form.longitud}`
                          : ""
                      }
                      onClick={() => setMapOpen(true)}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                      onClick={() => setMapOpen(true)}
                    >
                      Mapa
                    </button>
                  </div>
                </div>
                <ElevationField
                  value={form.elevacion}
                  onChange={(elevacion) => setForm((p) => ({ ...p, elevacion }))}
                  latitud={form.latitud}
                  longitud={form.longitud}
                />
                <InputField
                  label="Cantidad de envases"
                  name="cantidadEnvases"
                  type="number"
                  value={form.cantidadEnvases}
                  error={formErrors.cantidadEnvases}
                  onChange={handleFormChange}
                />
                <InputField
                  label="Fecha de toma"
                  name="fechaToma"
                  type="date"
                  value={form.fechaToma}
                  onChange={handleFormChange}
                />
                <InputField
                  label="Hora de toma"
                  name="horaToma"
                  type="time"
                  value={form.horaToma}
                  onChange={handleFormChange}
                />
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
                  className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
                  {editing ? "Guardar Cambios" : "Crear Muestra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de la muestra</h2>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <dl className="space-y-3">
                <DetailRow label="Identificación" value={detailItem.identificacion} />
                <DetailRow label="Matriz" value={detailItem.nombreMatriz} />
                <DetailRow label="Fuente" value={detailItem.nombreFuente} />
                <DetailRow label="Departamento" value={detailItem.nombreDepartamento} />
                <DetailRow label="Municipio" value={detailItem.nombreMunicipio} />
                <DetailRow label="Coordenadas" value={[detailItem.latitud, detailItem.longitud].filter(Boolean).join(", ")} />
                <DetailRow label="Elevación" value={detailItem.elevacion} />
                <DetailRow label="Fecha de toma" value={detailItem.fechaToma} />
                <DetailRow label="Hora de toma" value={detailItem.horaToma} />
                <DetailRow label="Envases" value={detailItem.cantidadEnvases} />
                <DetailRow label="Estado" value={detailItem.estado} />
                <DetailRow label="ID Muestra" value={detailItem.idMuestra} />
              </dl>
              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="rounded-md bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mapOpen ? (
        <Suspense fallback={null}>
          <NicaraguaMapModal
            open
            initialValue={
              form.latitud && form.longitud
                ? `${form.latitud}, ${form.longitud}`
                : ""
            }
            onConfirm={async (coords) => {
              const parsed = parseLatLng(coords);
              if (parsed) {
                const lat = parsed.lat.toFixed(6);
                const lng = parsed.lng.toFixed(6);
                setForm((p) => ({ ...p, latitud: lat, longitud: lng }));
                try {
                  const meters = await fetchElevacion(parsed.lat, parsed.lng);
                  setForm((p) => ({ ...p, elevacion: String(meters) }));
                } catch {
                  // El usuario puede ajustar la elevación a mano.
                }
              }
              setMapOpen(false);
            }}
            onCancel={() => setMapOpen(false)}
          />
        </Suspense>
      ) : null}

      <ConfirmDialog
        open={!!confirmToggle}
        title="Cambiar Estado"
        message={`¿Está seguro de que desea ${confirmToggle?.activo ? "desactivar" : "activar"} la muestra "${confirmToggle?.identificacion || ""}"?`}
        confirmText={confirmToggle?.activo ? "Desactivar" : "Activar"}
        confirmClass={confirmToggle?.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
        onConfirm={() => handleToggleStatus(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  );
}

function InputField({ label, name, value, error, onChange, required, type = "text" }) {
  const id = `muestra-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`input ${error ? "border-red-400 ring-1 ring-red-400" : ""}`}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function SelectField({ label, name, value, error, onChange, required, options }) {
  const id = `muestra-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`input ${error ? "border-red-400 ring-1 ring-red-400" : ""}`}
      >
        <option value="">Seleccione...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
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
