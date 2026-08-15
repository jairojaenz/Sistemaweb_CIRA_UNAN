/**
 * Formulario de ensayo: cabecera + tabla de resultados.
 * "Cargar muestras" lee la orden y arma una fila por cada muestra/análisis.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaSpinner, FaTrash } from "react-icons/fa";
import { useAuth } from "../../../auth/AuthContext.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getMuestras } from "../../catalogos/service/muestrasService.js";
import { getOrdenesServicio, getOrdenServicioById } from "../../formatos-orden-servicio/service/formatoOrdenServicioService.js";
import { getLaboratorios } from "../../laboratorios/service/laboratorioService.js";
import {
  createEnsayo,
  formToEnsayoPayload,
  getEnsayoById,
  updateEnsayo,
} from "../service/ensayoService.js";

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function nowDateTimeLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}T${h}:${min}`;
}

function emptyResultado() {
  return {
    idMuestra: "",
    idAnalisis: "",
    idMuestraxAnalisis: "",
    identificacionMuestra: "",
    nombreAnalisis: "",
    metodo: "",
    limiteRangoCuantificacion: "",
    resultado: "",
    incertidumbre: "",
    unidad: "",
    meq: "",
    valorMaximoAdmisible: "",
  };
}

function sessionUserName(user) {
  return [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim();
}

export default function EnsayoPage() {
  const { idEnsayo } = useParams();
  const isEdit = Boolean(idEnsayo);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [laboratorios, setLaboratorios] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [analisis, setAnalisis] = useState([]);
  const [form, setForm] = useState({
    datosCampo: false,
    fechaInicio: todayIso(),
    fechaFin: todayIso(),
    planMuestreo: "",
    condicionesAmbientales: "",
    condicionesItem: "",
    clave: "",
    equivalencia: "",
    observaciones: "",
    usuarioElaboracion: sessionUserName(user),
    fechaElaboracion: nowDateTimeLocal(),
    idLaboratorio: "",
    idFormatoOrden: "",
    resultados: [emptyResultado()],
  });

  const analisisMap = useMemo(() => {
    const map = {};
    analisis.forEach((a) => {
      map[String(a.idAnalisis)] = a.nombreAnalisis;
    });
    return map;
  }, [analisis]);

  const muestraMap = useMemo(() => {
    const map = {};
    muestras.forEach((m) => {
      map[String(m.idMuestra)] = m.identificacion;
    });
    return map;
  }, [muestras]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [labs, ords, mues, anal] = await Promise.all([
          getLaboratorios(),
          getOrdenesServicio(),
          getMuestras(),
          getAnalisis(),
        ]);
        if (cancelled) return;
        setLaboratorios(labs);
        setOrdenes(ords);
        setMuestras(mues);
        setAnalisis(anal);

        if (isEdit) {
          const detalle = await getEnsayoById(idEnsayo);
          if (cancelled) return;
          setForm({
            datosCampo: detalle.datosCampo,
            fechaInicio: detalle.fechaInicio || todayIso(),
            fechaFin: detalle.fechaFin || todayIso(),
            planMuestreo: detalle.planMuestreo || "",
            condicionesAmbientales: detalle.condicionesAmbientales || "",
            condicionesItem: detalle.condicionesItem || "",
            clave: detalle.clave || "",
            equivalencia: detalle.equivalencia || "",
            observaciones: detalle.observaciones || "",
            usuarioElaboracion: detalle.usuarioElaboracion || sessionUserName(user),
            fechaElaboracion: detalle.fechaElaboracion || nowDateTimeLocal(),
            idLaboratorio: detalle.idLaboratorio ? String(detalle.idLaboratorio) : "",
            idFormatoOrden: detalle.idFormatoOrden ? String(detalle.idFormatoOrden) : "",
            resultados: (detalle.resultados ?? []).length
              ? detalle.resultados.map((r) => ({
                  ...emptyResultado(),
                  ...r,
                  idMuestra: r.idMuestra ? String(r.idMuestra) : "",
                  idAnalisis: r.idAnalisis ? String(r.idAnalisis) : "",
                  idMuestraxAnalisis: r.idMuestraxAnalisis ? String(r.idMuestraxAnalisis) : "",
                }))
              : [emptyResultado()],
          });
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
  }, [addToast, idEnsayo, isEdit, user]);

  function updateResultado(index, patch) {
    setForm((p) => ({
      ...p,
      resultados: p.resultados.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  }

  async function cargarDesdeOrden(idOrden) {
    // Parte las muestras de la orden en filas de resultado (una por análisis).
    if (!idOrden) return;
    try {
      const orden = await getOrdenServicioById(idOrden);
      const filas = [];
      for (const d of orden.detalles ?? []) {
        const ids = (d.idsAnalisis ?? []).filter((id) => Number(id) > 0);
        if (ids.length === 0) {
          filas.push({
            ...emptyResultado(),
            idMuestra: d.idMuestra ? String(d.idMuestra) : "",
            identificacionMuestra: d.identificacion || "",
          });
        } else {
          ids.forEach((idAnalisis) => {
            filas.push({
              ...emptyResultado(),
              idMuestra: d.idMuestra ? String(d.idMuestra) : "",
              identificacionMuestra: d.identificacion || "",
              idAnalisis: String(idAnalisis),
              nombreAnalisis: analisisMap[String(idAnalisis)] || "",
            });
          });
        }
      }
      setForm((p) => ({
        ...p,
        idFormatoOrden: String(idOrden),
        resultados: filas.length ? filas : [emptyResultado()],
      }));
      addToast("Se cargaron las muestras de la orden", "success");
    } catch (err) {
      addToast(err?.message || "No se pudo cargar la orden", "error");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!Number(form.idLaboratorio) || !Number(form.idFormatoOrden)) {
      addToast("Seleccione laboratorio y orden de servicio", "error");
      return;
    }
    const incompletos = form.resultados.filter(
      (r) => Number(r.idMuestra) > 0 && !Number(r.idAnalisis) && !Number(r.idMuestraxAnalisis),
    );
    if (incompletos.length) {
      addToast("Cada resultado debe tener análisis o vínculo muestra-análisis", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = formToEnsayoPayload({
        ...form,
        usuarioElaboracion: form.usuarioElaboracion || sessionUserName(user),
      });
      if (isEdit) {
        await updateEnsayo(idEnsayo, payload);
        addToast("Ensayo actualizado", "success");
      } else {
        await createEnsayo(payload);
        addToast("Ensayo creado", "success");
      }
      navigate(ROUTES.ensayos);
    } catch (err) {
      addToast(err?.message || "No se pudo guardar el ensayo", "error");
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
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-blue-900">
          {isEdit ? "Editar formato de ensayo" : "Nuevo formato de ensayo"}
        </h1>
        <p className="text-sm text-slate-500">Capture cabecera y resultados por muestra y análisis.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Cabecera</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Laboratorio</label>
            <select
              className="input"
              value={form.idLaboratorio}
              onChange={(e) => setForm((p) => ({ ...p, idLaboratorio: e.target.value }))}
              required
            >
              <option value="">Seleccione...</option>
              {laboratorios.map((l) => (
                <option key={l.idLaboratorio} value={l.idLaboratorio}>
                  {l.nombreLaboratorio}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Orden de servicio</label>
            <div className="flex gap-2">
              <select
                className="input"
                value={form.idFormatoOrden}
                onChange={(e) => setForm((p) => ({ ...p, idFormatoOrden: e.target.value }))}
                required
              >
                <option value="">Seleccione...</option>
                {ordenes.map((o) => (
                  <option key={o.idFormatoOrden} value={o.idFormatoOrden}>
                    Orden {o.numeroOrden ?? o.idFormatoOrden}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => cargarDesdeOrden(form.idFormatoOrden)}
                className="whitespace-nowrap rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-blue-900 hover:bg-slate-200"
              >
                Cargar muestras
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha inicio</label>
            <input
              type="date"
              className="input"
              value={form.fechaInicio}
              onChange={(e) => setForm((p) => ({ ...p, fechaInicio: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha fin</label>
            <input
              type="date"
              className="input"
              value={form.fechaFin}
              onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Plan de muestreo</label>
            <input
              className="input"
              value={form.planMuestreo}
              onChange={(e) => setForm((p) => ({ ...p, planMuestreo: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Condiciones ambientales</label>
            <input
              className="input"
              value={form.condicionesAmbientales}
              onChange={(e) => setForm((p) => ({ ...p, condicionesAmbientales: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Condiciones del ítem</label>
            <input
              className="input"
              value={form.condicionesItem}
              onChange={(e) => setForm((p) => ({ ...p, condicionesItem: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Clave</label>
            <input className="input" value={form.clave} onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Equivalencia</label>
            <input
              className="input"
              value={form.equivalencia}
              onChange={(e) => setForm((p) => ({ ...p, equivalencia: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              className="input min-h-[80px]"
              value={form.observaciones}
              onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.datosCampo}
              onChange={(e) => setForm((p) => ({ ...p, datosCampo: e.target.checked }))}
            />
            Incluye datos de campo
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-gray-500">Resultados</h2>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, resultados: [...p.resultados, emptyResultado()] }))}
            className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            <FaPlus className="h-3 w-3" /> Agregar resultado
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-2 py-2">Muestra</th>
                <th className="px-2 py-2">Análisis</th>
                <th className="px-2 py-2">Método</th>
                <th className="px-2 py-2">Resultado</th>
                <th className="px-2 py-2">Unidad</th>
                <th className="px-2 py-2">Límite</th>
                <th className="px-2 py-2">Incert.</th>
                <th className="px-2 py-2">Meq</th>
                <th className="px-2 py-2">VMA</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {form.resultados.map((fila, index) => (
                <tr key={index} className="border-t">
                  <td className="px-2 py-2">
                    <select
                      className="input"
                      value={fila.idMuestra}
                      onChange={(e) =>
                        updateResultado(index, {
                          idMuestra: e.target.value,
                          identificacionMuestra: muestraMap[e.target.value] || "",
                        })
                      }
                    >
                      <option value="">—</option>
                      {muestras.map((m) => (
                        <option key={m.idMuestra} value={m.idMuestra}>
                          {m.identificacion}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="input"
                      value={fila.idAnalisis}
                      onChange={(e) =>
                        updateResultado(index, {
                          idAnalisis: e.target.value,
                          nombreAnalisis: analisisMap[e.target.value] || "",
                        })
                      }
                    >
                      <option value="">—</option>
                      {analisis.map((a) => (
                        <option key={a.idAnalisis} value={a.idAnalisis}>
                          {a.nombreAnalisis}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input className="input" value={fila.metodo} onChange={(e) => updateResultado(index, { metodo: e.target.value })} />
                  </td>
                  <td className="px-2 py-2">
                    <input className="input" value={fila.resultado} onChange={(e) => updateResultado(index, { resultado: e.target.value })} />
                  </td>
                  <td className="px-2 py-2">
                    <input className="input" value={fila.unidad} onChange={(e) => updateResultado(index, { unidad: e.target.value })} />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="input"
                      value={fila.limiteRangoCuantificacion}
                      onChange={(e) => updateResultado(index, { limiteRangoCuantificacion: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="input"
                      value={fila.incertidumbre}
                      onChange={(e) => updateResultado(index, { incertidumbre: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input className="input" value={fila.meq} onChange={(e) => updateResultado(index, { meq: e.target.value })} />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="input"
                      value={fila.valorMaximoAdmisible}
                      onChange={(e) => updateResultado(index, { valorMaximoAdmisible: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {form.resultados.length > 1 && (
                      <button
                        type="button"
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setForm((p) => ({ ...p, resultados: p.resultados.filter((_, i) => i !== index) }))
                        }
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.ensayos)}
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
          {isEdit ? "Guardar cambios" : "Crear ensayo"}
        </button>
      </div>
    </form>
  );
}
