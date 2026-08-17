import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Beaker,
  CircleDot,
  Clock,
  Container,
  Droplets,
  FlaskConical,
  Hash,
  HardHat,
  Landmark,
  Layers,
  MapPin,
  MoreHorizontal,
  Navigation,
  Plus,
  Trash2,
  UserCog,
} from "lucide-react";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import EnsayosMultiSelect, {
  idsEnsayosFromRow,
  labelsEnsayos,
} from "../components/EnsayosMultiSelect.jsx";
import { CatalogChoiceCard, HoraChoiceCard, ICON_INPUT, IconField } from "../../../components/formFields.jsx";
import ValidationIssuesModal from "../../../components/ValidationIssuesModal.jsx";
import { loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { collectPlanIssues, issuesToFormErrors, PLAN_STEP_LABELS } from "../utils/planMuestreoValidation.js";
import { ROUTES } from "../../../router/routes.js";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getMatrices } from "../../catalogos/service/matrizService.js";
import { getFuentesMatriz } from "../../catalogos/service/fuentesMatrizService.js";
import { getPreservantes } from "../../catalogos/service/preservanteServicio.js";

const NicaraguaMapModal = lazy(() => import("../components/NicaraguaMapModal.jsx"));

function labelUsuario(u) {
  const nombre = u.nombreUsuario ?? u.NombreUsuario ?? "";
  const apellido = u.apellidoUsuario ?? u.ApellidoUsuario ?? "";
  return `${nombre} ${apellido}`.trim() || nombre;
}

const HORAS_COMPUESTO = ["8 h", "10 h", "12 h", "16 h", "24 h"];
const HORA_OTRO = "Otro";

function TipoMuestreoModal({
  open,
  title,
  description,
  children,
  confirmText = "Guardar",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-blue-900">{title}</h3>
        {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const ENVASES = ["Plástico", "Vidrio", "Bolsa", "No aplica", "Otro"];

export default function PlanMuestreoPaso2() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => loadDraft());
  const [errors, setErrors] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [modalPuntualOpen, setModalPuntualOpen] = useState(false);
  const [modalOtroOpen, setModalOtroOpen] = useState(false);
  const [horaPuntualDraft, setHoraPuntualDraft] = useState("");
  const [otroTiempoDraft, setOtroTiempoDraft] = useState("");
  const [mapRowIdx, setMapRowIdx] = useState(null);
  const [analisisCatalogo, setAnalisisCatalogo] = useState([]);
  const [matrices, setMatrices] = useState([]);
  const [fuentes, setFuentes] = useState([]);
  const [preservantes, setPreservantes] = useState([]);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState([]);

  const loadUsuarios = useCallback(async () => {
    try {
      const data = await getUsuarios();
      setUsuarios((data ?? []).filter((u) => u.activo !== false && u.Activo !== false));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getAnalisis(), getMatrices(), getFuentesMatriz(), getPreservantes()])
      .then(([analisisData, matricesData, fuentesData, preservantesData]) => {
        if (!mounted) return;
        setAnalisisCatalogo((analisisData ?? []).filter((a) => a.activo !== false));
        setMatrices((matricesData ?? []).filter((m) => m.activo !== false && Number(m.idMatriz) > 0));
        setFuentes((fuentesData ?? []).filter((f) => f.activo !== false && Number(f.idFuente) > 0));
        setPreservantes((preservantesData ?? []).filter((p) => p.activo !== false && Number(p.idPreservante) > 0));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const paso2 = draft?.paso2 ?? {};
  const detalle = Array.isArray(paso2.detalle) ? paso2.detalle : [];

  const setPaso2 = (patch) => {
    setDraft((prev) => ({ ...prev, paso2: { ...prev.paso2, ...patch } }));
  };

  const tipoLabel = useMemo(() => {
    if (paso2.tipoMuestreo === "puntual") {
      return paso2.horaPuntual ? `Puntual (${paso2.horaPuntual})` : "Puntual";
    }
    const horas = (paso2.compuestoHoras ?? []).filter((h) => h !== HORA_OTRO);
    const partes = [...horas];
    if (paso2.compuestoOtroTiempo) partes.push(`Otro: ${paso2.compuestoOtroTiempo}`);
    return partes.length ? `Compuesto (${partes.join(", ")})` : "Compuesto";
  }, [paso2.tipoMuestreo, paso2.horaPuntual, paso2.compuestoHoras, paso2.compuestoOtroTiempo]);

  const updateDetalleRow = (idx, patch) => {
    setDraft((prev) => {
      const next = [...(prev.paso2.detalle ?? [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, paso2: { ...prev.paso2, detalle: next } };
    });
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => {
        delete next[`${key === "idMatriz" ? "matriz" : key === "idsEnsayos" ? "ensayos" : key}-${idx}`];
        if (key === "lugarMuestreo") delete next[`lugar-${idx}`];
        if (key === "identificacionMuestra") delete next[`identificacion-${idx}`];
      });
      return next;
    });
  };

  const emptyDetalleRow = () => ({
    lugarMuestreo: "",
    identificacionMuestra: "",
    coordenadas: "",
    matriz: "",
    idMatriz: "",
    fuente: "",
    idFuente: "",
    ensayosSolicitados: "",
    idsEnsayos: [],
    tipoEnvaseVolumen: "",
    preservantes: "",
    idPreservante: "",
  });

  const addRow = () => {
    setDraft((prev) => ({
      ...prev,
      paso2: {
        ...prev.paso2,
        detalle: [...(prev.paso2.detalle ?? []), emptyDetalleRow()],
      },
    }));
  };

  const removeRow = (idx) => {
    setDraft((prev) => {
      const rows = [...(prev.paso2.detalle ?? [])];
      if (rows.length <= 1) return prev;
      rows.splice(idx, 1);
      return { ...prev, paso2: { ...prev.paso2, detalle: rows } };
    });
  };

  const openModalPuntual = (horaActual = "") => {
    setHoraPuntualDraft(horaActual);
    setModalPuntualOpen(true);
  };

  const seleccionarPuntual = () => {
    setPaso2({
      tipoMuestreo: "puntual",
      compuestoHoras: [],
      compuestoOtroTiempo: "",
    });
    openModalPuntual(paso2.horaPuntual ?? "");
  };

  const seleccionarCompuesto = () => {
    setPaso2({
      tipoMuestreo: "compuesto",
      horaPuntual: "",
    });
    setModalPuntualOpen(false);
  };

  const confirmarHoraPuntual = () => {
    if (!horaPuntualDraft) return;
    setPaso2({ tipoMuestreo: "puntual", horaPuntual: horaPuntualDraft });
    setModalPuntualOpen(false);
  };

  const toggleHora = (label) => {
    const current = paso2.compuestoHoras ?? [];
    const has = current.includes(label);
    setPaso2({
      compuestoHoras: has ? current.filter((x) => x !== label) : [...current, label],
    });
  };

  const toggleOtro = () => {
    const current = paso2.compuestoHoras ?? [];
    const has = current.includes(HORA_OTRO);
    if (has) {
      setPaso2({
        compuestoHoras: current.filter((x) => x !== HORA_OTRO),
        compuestoOtroTiempo: "",
      });
      return;
    }
    setOtroTiempoDraft(paso2.compuestoOtroTiempo ?? "");
    setModalOtroOpen(true);
  };

  const irAlPaso3 = () => {
    const issues = collectPlanIssues(draft, { steps: [2] });
    if (issues.length > 0) {
      setErrors(issuesToFormErrors(issues));
      setValidationIssues(issues);
      setValidationOpen(true);
      return;
    }
    setErrors({});
    navigate(ROUTES.planMuestreoPaso(3));
  };

  const confirmarOtroTiempo = () => {
    const valor = otroTiempoDraft.trim();
    if (!valor) return;
    const current = (paso2.compuestoHoras ?? []).filter((x) => x !== HORA_OTRO);
    setPaso2({
      compuestoHoras: [...current, HORA_OTRO],
      compuestoOtroTiempo: valor,
    });
    setModalOtroOpen(false);
  };

  return (
    <>
      <PlanMuestreoLayout
        step={2}
        wide
        onPrevious={() => navigate(ROUTES.planMuestreoPaso(1))}
        onNext={irAlPaso3}
      >
        <div className="space-y-8">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-blue-900 sm:text-3xl">Detalle del muestreo</h2>
            <p className="text-gray-600">Tipo de muestreo, coordinadores y puntos a muestrear</p>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-blue-900" />
              Tipo de muestreo
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">Seleccione solo 1</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CatalogChoiceCard
                selected={paso2.tipoMuestreo === "puntual"}
                icon={CircleDot}
                tone="bg-sky-50 text-sky-700"
                label="Puntual"
                hint="Una sola toma en un instante"
                onClick={seleccionarPuntual}
              />
              <CatalogChoiceCard
                selected={paso2.tipoMuestreo === "compuesto"}
                icon={Layers}
                tone="bg-amber-50 text-amber-800"
                label="Compuesto"
                hint="Varias tomas a lo largo del tiempo"
                onClick={seleccionarCompuesto}
              />
            </div>
            {errors.horaPuntual ? (
              <p className="mt-3 text-xs font-medium text-red-500">{errors.horaPuntual}</p>
            ) : null}

            {paso2.tipoMuestreo === "puntual" ? (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-gray-700">
                {paso2.horaPuntual ? (
                  <span>
                    Hora puntual: <span className="font-semibold text-blue-900">{paso2.horaPuntual}</span>
                  </span>
                ) : (
                  <span className="text-amber-800">Seleccione la hora en que se tomó la muestra.</span>
                )}
                <button
                  type="button"
                  className="ml-3 font-semibold text-blue-800 underline hover:text-blue-900"
                  onClick={() => openModalPuntual(paso2.horaPuntual ?? "")}
                >
                  {paso2.horaPuntual ? "Cambiar hora" : "Indicar hora"}
                </button>
              </div>
            ) : null}

            {paso2.tipoMuestreo === "compuesto" ? (
              <div className="mt-5">
                <p className="mb-3 text-sm text-gray-600">
                  Seleccione la duración del muestreo compuesto (8 a 24 h). Si el tiempo es distinto, use Otro.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {HORAS_COMPUESTO.map((h) => (
                    <HoraChoiceCard
                      key={h}
                      label={h}
                      icon={Clock}
                      selected={(paso2.compuestoHoras ?? []).includes(h)}
                      onClick={() => toggleHora(h)}
                    />
                  ))}
                  <HoraChoiceCard
                    label="Otro"
                    icon={MoreHorizontal}
                    selected={(paso2.compuestoHoras ?? []).includes(HORA_OTRO)}
                    onClick={toggleOtro}
                  />
                </div>
                {errors.compuestoHoras ? (
                  <p className="mt-3 text-xs font-medium text-red-500">{errors.compuestoHoras}</p>
                ) : null}
                {paso2.compuestoOtroTiempo ? (
                  <p className="mt-3 text-sm text-gray-700">
                    Tiempo adicional: <span className="font-semibold">{paso2.compuestoOtroTiempo}</span>
                    <button
                      type="button"
                      className="ml-3 font-semibold text-blue-800 underline hover:text-blue-900"
                      onClick={() => {
                        setOtroTiempoDraft(paso2.compuestoOtroTiempo);
                        setModalOtroOpen(true);
                      }}
                    >
                      Cambiar
                    </button>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <IconField
                id="plan-coordinador"
                icon={HardHat}
                tone="bg-amber-50 text-amber-800"
                label="Coordinador del muestreo"
                hint="Responsable de dirigir el muestreo"
                required
                error={errors.coordinador}
              >
                <select
                  id="plan-coordinador"
                  className={ICON_INPUT}
                  value={paso2.coordinador}
                  onChange={(e) => setPaso2({ coordinador: e.target.value })}
                >
                  <option value="">Seleccione un usuario</option>
                  {usuarios.map((u) => {
                    const id = u.idUsuario ?? u.IdUsuario;
                    const nombre = labelUsuario(u);
                    return (
                      <option key={id} value={nombre} disabled={nombre === paso2.reemplazoCoordinador}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </IconField>
              <IconField
                id="plan-reemplazo"
                icon={UserCog}
                tone="bg-indigo-50 text-indigo-700"
                label="Reemplazo del coordinador"
                hint="Debe ser una persona distinta"
                required
                error={errors.reemplazoCoordinador}
              >
                <select
                  id="plan-reemplazo"
                  className={ICON_INPUT}
                  value={paso2.reemplazoCoordinador}
                  onChange={(e) => setPaso2({ reemplazoCoordinador: e.target.value })}
                >
                  <option value="">Seleccione un usuario</option>
                  {usuarios.map((u) => {
                    const id = u.idUsuario ?? u.IdUsuario;
                    const nombre = labelUsuario(u);
                    return (
                      <option key={id} value={nombre} disabled={nombre === paso2.coordinador}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </IconField>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
              <span className="h-7 w-1 rounded-full bg-yellow-400" />
              Detalle del muestreo
            </h3>
            <p className="mb-5 ml-4 text-sm text-gray-500">
              Cada tarjeta es un punto de muestreo. Marque las coordenadas en el mapa de Nicaragua.
            </p>

            <div className="space-y-4">
              {detalle.map((row, idx) => (
                <article key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-blue-900">Punto de muestreo {idx + 1}</p>
                        <p className="truncate text-xs text-gray-500">
                          {row.identificacionMuestra || row.lugarMuestreo || "Sin identificación"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Eliminar punto"
                      disabled={detalle.length <= 1}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => removeRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Eliminar punto</span>
                    </button>
                  </header>

                  <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    <IconField
                      id={`detalle-lugar-${idx}`}
                      icon={MapPin}
                      tone="bg-rose-50 text-rose-700"
                      label="Lugar de muestreo"
                      hint="Sitio o estación"
                      required
                      error={errors[`lugar-${idx}`]}
                    >
                      <input
                        id={`detalle-lugar-${idx}`}
                        className={ICON_INPUT}
                        value={row.lugarMuestreo}
                        onChange={(e) => updateDetalleRow(idx, { lugarMuestreo: e.target.value })}
                        placeholder="Sitio o estación"
                      />
                    </IconField>
                    <IconField
                      id={`detalle-id-${idx}`}
                      icon={Hash}
                      tone="bg-blue-50 text-blue-800"
                      label="Identificación de la muestra"
                      hint="Código o nombre"
                      required
                      error={errors[`identificacion-${idx}`]}
                    >
                      <input
                        id={`detalle-id-${idx}`}
                        className={ICON_INPUT}
                        value={row.identificacionMuestra}
                        onChange={(e) =>
                          updateDetalleRow(idx, { identificacionMuestra: e.target.value })
                        }
                        placeholder="Código o nombre"
                      />
                    </IconField>
                    <IconField
                      id={`detalle-coords-${idx}`}
                      icon={Navigation}
                      tone="bg-cyan-50 text-cyan-700"
                      label="Coordenadas"
                      hint="Marque el punto en el mapa"
                      className="md:col-span-2"
                    >
                      <div className="flex gap-2">
                        <input
                          id={`detalle-coords-${idx}`}
                          className={`${ICON_INPUT} cursor-pointer`}
                          placeholder="Lat, Long"
                          value={row.coordenadas}
                          readOnly
                          onClick={() => setMapRowIdx(idx)}
                        />
                        <button
                          type="button"
                          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                          onClick={() => setMapRowIdx(idx)}
                        >
                          <MapPin className="h-4 w-4" />
                          Mapa
                        </button>
                      </div>
                    </IconField>
                    <IconField
                      id={`detalle-matriz-${idx}`}
                      icon={Droplets}
                      tone="bg-sky-50 text-sky-700"
                      label="Matriz"
                      hint="Tipo de matriz de este punto"
                      required
                      error={errors[`matriz-${idx}`]}
                    >
                      <select
                        id={`detalle-matriz-${idx}`}
                        className={ICON_INPUT}
                        value={row.idMatriz || ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          const item = matrices.find((m) => String(m.idMatriz) === String(id));
                          updateDetalleRow(idx, {
                            idMatriz: id,
                            matriz: item?.nombreMatriz ?? "",
                            idFuente: "",
                            fuente: "",
                          });
                        }}
                      >
                        <option value="">Seleccionar</option>
                        {matrices.map((m) => (
                          <option key={m.idMatriz} value={m.idMatriz}>
                            {m.nombreMatriz}
                          </option>
                        ))}
                      </select>
                    </IconField>
                    <IconField
                      id={`detalle-fuente-${idx}`}
                      icon={Landmark}
                      tone="bg-amber-50 text-amber-800"
                      label="Fuente"
                      hint="Fuente de la matriz elegida"
                    >
                      <select
                        id={`detalle-fuente-${idx}`}
                        className={ICON_INPUT}
                        value={row.idFuente || ""}
                        disabled={!row.idMatriz}
                        onChange={(e) => {
                          const id = e.target.value;
                          const item = fuentes.find((f) => String(f.idFuente) === String(id));
                          updateDetalleRow(idx, {
                            idFuente: id,
                            fuente: item?.nombreFuente ?? "",
                          });
                        }}
                      >
                        <option value="">
                          {row.idMatriz ? "Seleccionar" : "Seleccione una matriz primero"}
                        </option>
                        {fuentes
                          .filter((f) => String(f.idMatriz) === String(row.idMatriz))
                          .map((f) => (
                            <option key={f.idFuente} value={f.idFuente}>
                              {f.nombreFuente}
                            </option>
                          ))}
                      </select>
                    </IconField>
                    <IconField
                      id={`detalle-envase-${idx}`}
                      icon={Container}
                      tone="bg-slate-100 text-slate-700"
                      label="Tipo de envase / Volumen"
                      hint="Plástico, vidrio, bolsa u otro"
                    >
                      <select
                        id={`detalle-envase-${idx}`}
                        className={ICON_INPUT}
                        value={row.tipoEnvaseVolumen}
                        onChange={(e) =>
                          updateDetalleRow(idx, { tipoEnvaseVolumen: e.target.value })
                        }
                      >
                        <option value="">Seleccionar</option>
                        {ENVASES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </IconField>
                    <IconField
                      id={`detalle-preservantes-${idx}`}
                      icon={FlaskConical}
                      tone="bg-violet-50 text-violet-700"
                      label="Preservantes"
                      hint="Conservante de la muestra"
                    >
                      <select
                        id={`detalle-preservantes-${idx}`}
                        className={ICON_INPUT}
                        value={row.idPreservante || ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          const item = preservantes.find((p) => String(p.idPreservante) === String(id));
                          updateDetalleRow(idx, {
                            idPreservante: id,
                            preservantes: item?.nombrePreservante ?? "",
                          });
                        }}
                      >
                        <option value="">Seleccionar</option>
                        {preservantes.map((p) => (
                          <option key={p.idPreservante} value={p.idPreservante}>
                            {p.nombrePreservante}
                          </option>
                        ))}
                      </select>
                    </IconField>
                    <IconField
                      id={`detalle-ensayos-${idx}`}
                      icon={Beaker}
                      tone="bg-teal-50 text-teal-700"
                      label="Ensayos solicitados"
                      hint="Uno o más análisis del catálogo"
                      required
                      error={errors[`ensayos-${idx}`]}
                      className="md:col-span-2"
                    >
                      <EnsayosMultiSelect
                        id={`detalle-ensayos-${idx}`}
                        opciones={analisisCatalogo}
                        selectedIds={idsEnsayosFromRow(row, analisisCatalogo)}
                        onChange={(ids) =>
                          updateDetalleRow(idx, {
                            idsEnsayos: ids,
                            ensayosSolicitados: labelsEnsayos(ids, analisisCatalogo).join(", "),
                          })
                        }
                      />
                    </IconField>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
                onClick={addRow}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Agregar punto
              </button>
              <p className="text-xs text-gray-500">
                Estado actual: <span className="font-semibold text-blue-900">{tipoLabel}</span>
              </p>
            </div>
          </section>
        </div>

        <TipoMuestreoModal
          open={modalPuntualOpen}
          title="Hora puntual de la muestra"
          description="Indique la hora en que se realizó el muestreo puntual."
          confirmDisabled={!horaPuntualDraft}
          onConfirm={confirmarHoraPuntual}
          onCancel={() => setModalPuntualOpen(false)}
        >
          <label className="block text-sm font-semibold text-gray-700">
            Hora
            <input
              type="time"
              className={`${ICON_INPUT} mt-1`}
              value={horaPuntualDraft}
              onChange={(e) => setHoraPuntualDraft(e.target.value)}
            />
          </label>
        </TipoMuestreoModal>

        <TipoMuestreoModal
          open={modalOtroOpen}
          title="Tiempo de muestreo distinto"
          description="Use este campo si el muestreo no se realizó en el lapso de 8 a 24 horas (por ejemplo 36 h, 48 h o 3 días)."
          confirmDisabled={!otroTiempoDraft.trim()}
          onConfirm={confirmarOtroTiempo}
          onCancel={() => setModalOtroOpen(false)}
        >
          <label className="block text-sm font-semibold text-gray-700">
            Hora o tiempo
            <input
              type="text"
              className={`${ICON_INPUT} mt-1`}
              placeholder="Ej. 36 h, 48 h, 3 días"
              value={otroTiempoDraft}
              onChange={(e) => setOtroTiempoDraft(e.target.value)}
            />
          </label>
        </TipoMuestreoModal>

        {mapRowIdx != null ? (
          <Suspense fallback={null}>
            <NicaraguaMapModal
              open
              initialValue={detalle[mapRowIdx]?.coordenadas ?? ""}
              onConfirm={(coords) => {
                updateDetalleRow(mapRowIdx, { coordenadas: coords });
                setMapRowIdx(null);
              }}
              onCancel={() => setMapRowIdx(null)}
            />
          </Suspense>
        ) : null}
      </PlanMuestreoLayout>

      <ValidationIssuesModal
        open={validationOpen}
        title="No puede continuar al siguiente paso"
        description={`Revise los campos pendientes del paso 2 — ${PLAN_STEP_LABELS[1]}.`}
        issues={validationIssues}
        onClose={() => setValidationOpen(false)}
        onGoToStep={() => setValidationOpen(false)}
        primaryLabel="Ir a corregir"
      />
    </>
  );
}
