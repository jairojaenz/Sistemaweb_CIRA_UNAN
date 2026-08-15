import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Trash2 } from "lucide-react";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import EnsayosMultiSelect, {
  idsEnsayosFromRow,
  labelsEnsayos,
} from "../components/EnsayosMultiSelect.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { ROUTES } from "../../../router/routes.js";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getMatrices } from "../../catalogos/service/matrizService.js";
import { getFuentesMatriz } from "../../catalogos/service/fuentesMatrizService.js";
import { getPreservantes } from "../../catalogos/service/preservanteServicio.js";

const NicaraguaMapModal = lazy(() => import("../components/NicaraguaMapModal.jsx"));

function SectionHeader({ accent = "bg-blue-900", title, subtitle }) {
  return (
    <div className="mb-5">
      <h3 className="mb-1 flex items-center gap-3 text-lg font-bold text-blue-900">
        <span className={`h-7 w-1 shrink-0 rounded-full ${accent}`} />
        {title}
      </h3>
      {subtitle ? <p className="ml-4 text-sm text-[#6a7282]">{subtitle}</p> : null}
    </div>
  );
}

function Field({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

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
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        ) : null}
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const ENVASES = ["Plástico", "Vidrio", "Bolsa", "No aplica", "Otro"];

function ToggleChip({ checked, label, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function mismosCoordinadores(paso2) {
  const coordinador = String(paso2?.coordinador ?? "").trim().toLowerCase();
  const reemplazo = String(paso2?.reemplazoCoordinador ?? "").trim().toLowerCase();
  return Boolean(coordinador && reemplazo && coordinador === reemplazo);
}

export default function PlanMuestreoPaso2() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [draft, setDraft] = useState(() => loadDraft());
  const [errorCoordinadores, setErrorCoordinadores] = useState("");
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
      return paso2.horaPuntual
        ? `Puntual (${paso2.horaPuntual})`
        : "Puntual";
    }
    const horas = (paso2.compuestoHoras ?? []).filter((h) => h !== HORA_OTRO);
    const partes = [...horas];
    if (paso2.compuestoOtroTiempo) partes.push(`Otro: ${paso2.compuestoOtroTiempo}`);
    return partes.length
      ? `Compuesto (${partes.join(", ")})`
      : "Compuesto";
  }, [paso2.tipoMuestreo, paso2.horaPuntual, paso2.compuestoHoras, paso2.compuestoOtroTiempo]);

  const updateDetalleRow = (idx, patch) => {
    setDraft((prev) => {
      const next = [...(prev.paso2.detalle ?? [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, paso2: { ...prev.paso2, detalle: next } };
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
    if (mismosCoordinadores(paso2)) {
      const mensaje = "El reemplazo no puede ser la misma persona que el coordinador del muestreo.";
      setErrorCoordinadores(mensaje);
      addToast(mensaje, "error");
      return;
    }
    setErrorCoordinadores("");
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
    <PlanMuestreoLayout
      step={2}
      wide
      onPrevious={() => navigate(ROUTES.planMuestreoPaso(1))}
      onNext={irAlPaso3}
    >
      <div className="space-y-6">
          <div className="border border-gray-200 rounded-md">
            <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">
              TIPO DE MUESTREO
            </div>
            <div className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="tipo"
                    checked={paso2.tipoMuestreo === "puntual"}
                    onChange={seleccionarPuntual}
                  />
                  Puntual
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="tipo"
                    checked={paso2.tipoMuestreo === "compuesto"}
                    onChange={seleccionarCompuesto}
                  />
                  Compuesto
                </label>
              </div>

              {paso2.tipoMuestreo === "puntual" ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  {paso2.horaPuntual ? (
                    <span>
                      Hora puntual:{" "}
                      <span className="font-semibold">{paso2.horaPuntual}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      Seleccione la hora en que se tomó la muestra.
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-800 underline hover:text-blue-900"
                    onClick={() => openModalPuntual(paso2.horaPuntual ?? "")}
                  >
                    {paso2.horaPuntual ? "Cambiar hora" : "Indicar hora"}
                  </button>
                </div>
              ) : null}

              {paso2.tipoMuestreo === "compuesto" ? (
                <>
                  <p className="mt-3 text-sm text-gray-600">
                    Seleccione la duración del muestreo compuesto (8 a 24 h). Si
                    el tiempo es distinto o mayor a 24 horas, use{" "}
                    <span className="font-semibold">Otro</span>.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-5">
                    {HORAS_COMPUESTO.map((h) => (
                      <ToggleChip
                        key={h}
                        label={h}
                        checked={(paso2.compuestoHoras ?? []).includes(h)}
                        onChange={() => toggleHora(h)}
                      />
                    ))}
                    <ToggleChip
                      label={HORA_OTRO}
                      checked={(paso2.compuestoHoras ?? []).includes(HORA_OTRO)}
                      onChange={toggleOtro}
                    />
                  </div>
                  {paso2.compuestoOtroTiempo ? (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                      <span>
                        Tiempo adicional:{" "}
                        <span className="font-semibold">
                          {paso2.compuestoOtroTiempo}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="text-sm font-semibold text-blue-800 underline hover:text-blue-900"
                        onClick={() => {
                          setOtroTiempoDraft(paso2.compuestoOtroTiempo);
                          setModalOtroOpen(true);
                        }}
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Coordinador del muestreo
                  </label>
                  <select
                    className={`select mt-1 ${errorCoordinadores ? "border-red-500" : ""}`}
                    value={paso2.coordinador}
                    onChange={(e) => {
                      setPaso2({ coordinador: e.target.value });
                      setErrorCoordinadores("");
                    }}
                  >
                    <option value="">— Seleccionar —</option>
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
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Reemplazo del coordinador del muestreo
                  </label>
                  <select
                    className={`select mt-1 ${errorCoordinadores ? "border-red-500" : ""}`}
                    value={paso2.reemplazoCoordinador}
                    onChange={(e) => {
                      setPaso2({ reemplazoCoordinador: e.target.value });
                      setErrorCoordinadores("");
                    }}
                  >
                    <option value="">— Seleccionar —</option>
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
                </div>
                {errorCoordinadores ? (
                  <p className="text-sm text-red-600 md:col-span-2">{errorCoordinadores}</p>
                ) : null}
              </div>
            </div>
          </div>

          <section className="mt-8">
            <SectionHeader
              accent="bg-emerald-600"
              title="Detalle del muestreo"
              subtitle="Cada tarjeta es un punto de muestreo. Marque las coordenadas en el mapa de Nicaragua."
            />

            <div className="space-y-4">
              {detalle.map((row, idx) => (
                <article
                  key={idx}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-blue-900">
                          Punto de muestreo {idx + 1}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {row.identificacionMuestra ||
                            row.lugarMuestreo ||
                            "Sin identificación"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Eliminar punto"
                      disabled={detalle.length <= 1}
                      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => removeRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Eliminar punto</span>
                    </button>
                  </header>

                  <div className="space-y-5 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Lugar de muestreo"
                        htmlFor={`detalle-lugar-${idx}`}
                      >
                        <input
                          id={`detalle-lugar-${idx}`}
                          className="input"
                          value={row.lugarMuestreo}
                          onChange={(e) =>
                            updateDetalleRow(idx, { lugarMuestreo: e.target.value })
                          }
                          placeholder="Sitio o estación"
                        />
                      </Field>

                      <Field
                        label="Identificación de la muestra"
                        htmlFor={`detalle-id-${idx}`}
                      >
                        <input
                          id={`detalle-id-${idx}`}
                          className="input"
                          value={row.identificacionMuestra}
                          onChange={(e) =>
                            updateDetalleRow(idx, {
                              identificacionMuestra: e.target.value,
                            })
                          }
                          placeholder="Código o nombre"
                        />
                      </Field>

                      <Field
                        label="Coordenadas"
                        htmlFor={`detalle-coords-${idx}`}
                        className="sm:col-span-2"
                      >
                        <div className="flex gap-2">
                          <div className="relative min-w-0 flex-1">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600" />
                            <input
                              id={`detalle-coords-${idx}`}
                              className="input cursor-pointer pl-10"
                              placeholder="Lat, Long"
                              value={row.coordenadas}
                              readOnly
                              onClick={() => setMapRowIdx(idx)}
                            />
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                            onClick={() => setMapRowIdx(idx)}
                          >
                            Mapa
                          </button>
                        </div>
                      </Field>

                      <Field label="Matriz" htmlFor={`detalle-matriz-${idx}`}>
                        <select
                          id={`detalle-matriz-${idx}`}
                          className="select"
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
                      </Field>

                      <Field label="Fuente" htmlFor={`detalle-fuente-${idx}`}>
                        <select
                          id={`detalle-fuente-${idx}`}
                          className="select"
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
                      </Field>

                      <Field
                        label="Tipo de envase / Volumen"
                        htmlFor={`detalle-envase-${idx}`}
                      >
                        <select
                          id={`detalle-envase-${idx}`}
                          className="select"
                          value={row.tipoEnvaseVolumen}
                          onChange={(e) =>
                            updateDetalleRow(idx, {
                              tipoEnvaseVolumen: e.target.value,
                            })
                          }
                        >
                          <option value="">Seleccionar</option>
                          {ENVASES.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        label="Preservantes"
                        htmlFor={`detalle-preservantes-${idx}`}
                      >
                        <select
                          id={`detalle-preservantes-${idx}`}
                          className="select"
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
                      </Field>
                    </div>

                    <Field
                      label="Ensayos solicitados"
                      htmlFor={`detalle-ensayos-${idx}`}
                    >
                      <EnsayosMultiSelect
                        id={`detalle-ensayos-${idx}`}
                        opciones={analisisCatalogo}
                        selectedIds={idsEnsayosFromRow(row, analisisCatalogo)}
                        onChange={(ids) =>
                          updateDetalleRow(idx, {
                            idsEnsayos: ids,
                            ensayosSolicitados: labelsEnsayos(
                              ids,
                              analisisCatalogo
                            ).join(", "),
                          })
                        }
                      />
                    </Field>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                onClick={addRow}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Agregar punto
              </button>
              <p className="text-xs text-gray-500">
                Claves: P = Plástico, V = Vidrio, B = Bolsa, NA = No aplica, INP =
                información no proporcionada
              </p>
            </div>
          </section>

        <div className="text-xs text-gray-600">
          Estado actual: <span className="font-semibold">{tipoLabel}</span>
        </div>
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
            className="input mt-1"
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
            className="input mt-1"
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
  );
}

