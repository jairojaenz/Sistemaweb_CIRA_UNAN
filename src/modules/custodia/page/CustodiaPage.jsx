/**
 * Formulario de cadena de custodia (alta y edición).
 * Tres bloques: cabecera (campo + estado), muestras/análisis, entregas.
 * El PUT manda el formulario completo; el backend reemplaza los pivotes.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaSpinner, FaTrash } from "react-icons/fa";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
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

function todayIso() {
  // Fecha local yyyy-MM-dd (toISOString() sería UTC y puede cambiar el día).
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
          clientesData = await getClientes(); // Solo Administrador; si falla, el select queda vacío.
        } catch {
          clientesData = [];
        }
        try {
          usuariosData = await getUsuarios(); // Igual: UserController es admin-only.
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
    // Si getUsuarios falló (no admin), al menos aparece el usuario de la sesión.
    if (usuarios.length) return usuarios;
    if (!idUsuarioSesion) return [];
    return [{ idUsuario: idUsuarioSesion, nombreUsuario: sessionUserName(user) || "Usuario actual" }];
  }, [usuarios, idUsuarioSesion, user]);

  function updateDetalle(index, patch) {
    // Inmutable: copia el array y fusiona solo la fila tocada.
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
    if (!Number(form.idFormatoCampo)) {
      addToast("Seleccione el formato de campo", "error");
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
      addToast(err?.message || "No se pudo guardar la custodia", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-blue-900">
        <FaSpinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-blue-900">
          {isEdit ? "Editar cadena de custodia" : "Nueva cadena de custodia"}
        </h1>
        <p className="text-sm text-slate-500">Registre muestras, análisis solicitados y entregas.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Cabecera</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Formato de campo</label>
            <select
              className="input"
              value={form.idFormatoCampo}
              onChange={(e) => setForm((p) => ({ ...p, idFormatoCampo: e.target.value }))}
              required
            >
              <option value="">Seleccione...</option>
              {campos.map((c) => (
                <option key={c.idFormatoCampo} value={c.idFormatoCampo}>
                  #{c.idFormatoCampo} — {c.identificacionMuestra || c.comunidad || "Campo"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
            <select
              className="input"
              value={form.estado}
              onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En tránsito">En tránsito</option>
              <option value="Recibida">Recibida</option>
              <option value="Cerrada">Cerrada</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-gray-500">Muestras y análisis</h2>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, detalles: [...p.detalles, emptyDetalle()] }))}
            className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            <FaPlus className="h-3 w-3" /> Agregar muestra
          </button>
        </div>
        <div className="space-y-4">
          {form.detalles.map((detalle, index) => (
            <div key={index} className="rounded-md border border-gray-100 p-3">
              <div className="mb-2 flex justify-end">
                {form.detalles.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    onClick={() =>
                      setForm((p) => ({ ...p, detalles: p.detalles.filter((_, i) => i !== index) }))
                    }
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Muestra</label>
                  <select
                    className="input"
                    value={detalle.idMuestra}
                    onChange={(e) => updateDetalle(index, { idMuestra: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {muestras.map((m) => (
                      <option key={m.idMuestra} value={m.idMuestra}>
                        {m.identificacion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Análisis</label>
                  <EnsayosMultiSelect
                    opciones={analisisActivos}
                    selectedIds={detalle.idsAnalisis}
                    onChange={(ids) => updateDetalle(index, { idsAnalisis: ids })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-gray-500">Entregas</h2>
          <button
            type="button"
            onClick={() =>
              setForm((p) => ({ ...p, entregas: [...p.entregas, emptyEntrega(idUsuarioSesion)] }))
            }
            className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            <FaPlus className="h-3 w-3" /> Agregar entrega
          </button>
        </div>
        <div className="space-y-4">
          {form.entregas.map((entrega, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-gray-100 p-3 sm:grid-cols-2">
              <div className="sm:col-span-2 flex justify-end">
                {form.entregas.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    onClick={() =>
                      setForm((p) => ({ ...p, entregas: p.entregas.filter((_, i) => i !== index) }))
                    }
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fecha entrega</label>
                <input
                  type="date"
                  className="input"
                  value={entrega.fechaEntrega}
                  onChange={(e) => updateEntrega(index, { fechaEntrega: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hora entrega</label>
                <input
                  type="time"
                  className="input"
                  value={entrega.horaEntrega}
                  onChange={(e) => updateEntrega(index, { horaEntrega: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fecha recibido</label>
                <input
                  type="date"
                  className="input"
                  value={entrega.fechaRecibido}
                  onChange={(e) => updateEntrega(index, { fechaRecibido: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hora recibido</label>
                <input
                  type="time"
                  className="input"
                  value={entrega.horaRecibido}
                  onChange={(e) => updateEntrega(index, { horaRecibido: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Usuario</label>
                <select
                  className="input"
                  value={entrega.idUsuario}
                  onChange={(e) => updateEntrega(index, { idUsuario: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {usuarioOptions.map((u) => {
                    const id = u.idUsuario ?? u.IdUsuario;
                    const nombre = u.nombreUsuario ?? u.nombre ?? sessionUserName(u);
                    return (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
                <select
                  className="input"
                  value={entrega.idCliente}
                  onChange={(e) => updateEntrega(index, { idCliente: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {clientes.map((c) => (
                    <option key={c.idCliente} value={c.idCliente}>
                      {c.nombreCliente}
                    </option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    No hay clientes disponibles. Un administrador debe registrarlos.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.custodia)}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {saving && <FaSpinner className="h-4 w-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear custodia"}
        </button>
      </div>
    </form>
  );
}
