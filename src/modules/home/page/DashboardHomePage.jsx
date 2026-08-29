import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceDot,
} from "recharts";
import { FaFilter } from "react-icons/fa";
import GaugeChart from "../components/GaugeChart";
import NicaraguaMap from "../components/NicaraguaMap";
import KpiStatCards from "../components/KpiStatCards";
import HudPanel, { GlowTooltip } from "../components/HudPanel";
import ConversionBarChart from "../components/ConversionBarChart";
import AnalisisCapsuleChart from "../components/AnalisisCapsuleChart";
import TopClientesList from "../components/TopClientesList";
import { conTonos } from "../components/dashboardTonos";
import { getMatrices } from "../../catalogos/service/matrizService";
import {
  periodoVacio,
  rangoDesdePeriodo,
  etiquetaPeriodo,
  opcionesAnios,
  opcionesMeses,
  diasDelMes,
  getKpisGrafico,
  getConversionMensual,
  getMuestrasPorMatriz,
  getTendenciaSolicitudes,
  getCumplimientoPlanes,
  getPuntosClientesMapa,
  getPuntosPlanesMapa,
  getTopClientesGrafico,
  getAnalisisSolicitados,
} from "../service/graficosService";

function formatTooltipDate(label) {
  const map = {
    Ene: "Enero",
    Feb: "Febrero",
    Mar: "Marzo",
    Abr: "Abril",
    May: "Mayo",
    Jun: "Junio",
    Jul: "Julio",
    Ago: "Agosto",
    Sep: "Septiembre",
    Oct: "Octubre",
    Nov: "Noviembre",
    Dic: "Diciembre",
  };
  return map[label] || label;
}

function PeakCallout({ cx, cy, value }) {
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r="10" fill="#38bdf8" opacity="0.25" />
      <circle cx={cx} cy={cy} r="5.5" fill="#fff" />
      <circle cx={cx} cy={cy} r="3" fill="#38bdf8" />
      <rect x={cx - 24} y={cy - 38} rx="9" width="48" height="22" fill="#0ea5e9" />
      <text x={cx} y={cy - 23} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
        {value}
      </text>
    </g>
  );
}

const inputClass =
  "rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 outline-none ring-sky-400/0 transition placeholder:text-slate-500 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20";

const VACIO = {
  kpis: {},
  conversion: { conversionAcumulada: 0, series: [] },
  matrices: [],
  tendencia: [],
  planes: { programados: 0, ejecutados: 0, cumplimiento: 0, aTiempo: 0 },
  puntos: [],
  topClientes: { items: [], total: 0, pagina: 1, tamano: 20, totalPaginas: 1 },
  analisis: [],
};

export default function DashboardHomePage() {
  const [periodo, setPeriodo] = useState(periodoVacio);
  const [matrixFilter, setMatrixFilter] = useState("todas");
  const [catalogoMatrices, setCatalogoMatrices] = useState([]);
  const [data, setData] = useState(VACIO);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [mapaModo, setMapaModo] = useState("muestras");
  const [cargandoMapa, setCargandoMapa] = useState(false);
  const [error, setError] = useState("");
  const mapaReqRef = useRef(0);

  useEffect(() => {
    getMatrices()
      .then((list) => setCatalogoMatrices(list.filter((m) => m.activo !== false)))
      .catch(() => setCatalogoMatrices([]));
  }, []);

  const rango = useMemo(() => rangoDesdePeriodo(periodo), [periodo]);
  const filtrosBase = useMemo(
    () => ({
      fechaInicio: rango.start,
      fechaFin: rango.end,
      idMatriz: matrixFilter === "todas" ? undefined : Number(matrixFilter),
    }),
    [rango.start, rango.end, matrixFilter],
  );

  useEffect(() => {
    setPaginaClientes(1);
  }, [filtrosBase]);

  useEffect(() => {
    let cancelado = false;
    setError("");

    Promise.all([
      getKpisGrafico(filtrosBase),
      getConversionMensual(filtrosBase),
      getMuestrasPorMatriz(filtrosBase),
      getTendenciaSolicitudes(filtrosBase),
      getCumplimientoPlanes(filtrosBase),
      getAnalisisSolicitados(filtrosBase),
    ])
      .then(([kpis, conversion, matrices, tendencia, planes, analisis]) => {
        if (cancelado) return;
        setData((prev) => ({
          ...prev,
          kpis: {
            proformas: kpis.proformas ?? kpis.Proformas,
            ordenes: kpis.ordenes ?? kpis.Ordenes,
            muestras: kpis.muestras ?? kpis.Muestras,
            clientes: kpis.clientes ?? kpis.Clientes,
          },
          conversion,
          matrices,
          tendencia: tendencia.map((t) => ({
            mes: t.mes ?? t.Mes,
            solicitudes: Number(t.solicitudes ?? t.Solicitudes ?? 0),
            anterior: Number(t.anterior ?? t.Anterior ?? 0),
          })),
          planes: {
            programados: Number(planes.programados ?? planes.Programados ?? 0),
            ejecutados: Number(planes.ejecutados ?? planes.Ejecutados ?? 0),
            cumplimiento: Number(planes.cumplimiento ?? planes.Cumplimiento ?? 0),
            aTiempo: Number(planes.aTiempo ?? planes.ATiempo ?? 0),
          },
          analisis,
        }));
      })
      .catch((err) => {
        if (cancelado) return;
        setData(VACIO);
        setError(err?.message || "No se pudieron cargar los gráficos");
      });

    return () => {
      cancelado = true;
    };
  }, [filtrosBase]);

  useEffect(() => {
    let cancelado = false;
    setCargandoClientes(true);
    getTopClientesGrafico({ ...filtrosBase, pagina: paginaClientes, tamano: 20 })
      .then((topClientes) => {
        if (!cancelado) setData((prev) => ({ ...prev, topClientes }));
      })
      .catch(() => {
        if (!cancelado) {
          setData((prev) => ({
            ...prev,
            topClientes: { items: [], total: 0, pagina: 1, tamano: 20, totalPaginas: 1 },
          }));
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoClientes(false);
      });

    return () => {
      cancelado = true;
    };
  }, [filtrosBase, paginaClientes]);

  const cargarPuntosMapa = useCallback((modo) => {
    const tipo = modo === "clientes" ? "clientes" : "muestras";
    setMapaModo(tipo);
    setCargandoMapa(true);
    setData((prev) => ({ ...prev, puntos: [] }));
    const reqId = ++mapaReqRef.current;
    const pedido = tipo === "clientes" ? getPuntosClientesMapa() : getPuntosPlanesMapa(filtrosBase.idMatriz);
    pedido
      .then((puntos) => {
        if (reqId === mapaReqRef.current) setData((prev) => ({ ...prev, puntos }));
      })
      .catch((err) => {
        if (reqId === mapaReqRef.current) {
          setData((prev) => ({ ...prev, puntos: [] }));
          setError(err?.message || "No se pudieron cargar los puntos del mapa");
        }
      })
      .finally(() => {
        if (reqId === mapaReqRef.current) setCargandoMapa(false);
      });
  }, [filtrosBase.idMatriz]);

  useEffect(() => {
    cargarPuntosMapa(mapaModo);
  }, [filtrosBase.idMatriz, cargarPuntosMapa]);

  const matricesChart = useMemo(() => conTonos(data.matrices), [data.matrices]);
  const analisisChart = useMemo(() => conTonos(data.analisis), [data.analisis]);
  const conversionSeries = useMemo(
    () =>
      (data.conversion.series ?? []).map((r) => ({
        mes: r.mes ?? r.Mes,
        proformas: Number(r.proformas ?? r.Proformas ?? 0),
        ordenes: Number(r.ordenes ?? r.Ordenes ?? 0),
      })),
    [data.conversion],
  );

  const matrizTotal = useMemo(
    () => matricesChart.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [matricesChart],
  );

  const picoSolicitudes = useMemo(
    () =>
      data.tendencia.reduce(
        (best, row) => (row.solicitudes > (best?.solicitudes ?? -1) ? row : best),
        null,
      ),
    [data.tendencia],
  );

  return (
    <div className="dash-exec min-h-full bg-[#0d053c] p-4 md:p-6 space-y-5">
      <div className="dash-glass flex flex-wrap items-end gap-4 rounded-2xl bg-[#251d50] p-4 ring-1 ring-sky-400/20">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <FaFilter className="h-4 w-4 text-sky-300" />
          Filtros
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Año</label>
          <select
            value={periodo.anio}
            onChange={(e) => {
              const anio = e.target.value;
              if (!anio) {
                setPeriodo(periodoVacio());
                return;
              }
              const maxDia = diasDelMes(anio, periodo.mes);
              const dia =
                periodo.mes && periodo.dia && Number(periodo.dia) > maxDia
                  ? String(maxDia)
                  : periodo.mes
                    ? periodo.dia
                    : "";
              setPeriodo({ anio, mes: periodo.mes, dia });
            }}
            className={inputClass}
          >
            <option value="">Todos</option>
            {opcionesAnios().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Mes</label>
          <select
            value={periodo.mes}
            disabled={!periodo.anio}
            onChange={(e) => {
              const mes = e.target.value;
              const maxDia = diasDelMes(periodo.anio, mes);
              const dia = mes && periodo.dia && Number(periodo.dia) > maxDia ? String(maxDia) : mes ? periodo.dia : "";
              setPeriodo((p) => ({ ...p, mes, dia }));
            }}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <option value="">Todo el año</option>
            {opcionesMeses().map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Día</label>
          <select
            value={periodo.dia}
            disabled={!periodo.anio || !periodo.mes}
            onChange={(e) => setPeriodo((p) => ({ ...p, dia: e.target.value }))}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <option value="">Todo el mes</option>
            {Array.from({ length: diasDelMes(periodo.anio, periodo.mes) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Tipo de matriz</label>
          <select
            value={matrixFilter}
            onChange={(e) => setMatrixFilter(e.target.value)}
            className={inputClass}
          >
            <option value="todas">Todas las matrices</option>
            {catalogoMatrices.map((m) => (
              <option key={m.idMatriz} value={m.idMatriz}>
                {m.nombreMatriz}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setPeriodo(periodoVacio());
            setMatrixFilter("todas");
          }}
          className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
        >
          Limpiar
        </button>
        <p className="w-full text-[11px] text-slate-400">
          Mostrando: <span className="font-medium text-sky-200">{etiquetaPeriodo(periodo)}</span>
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
      ) : null}

      <KpiStatCards kpis={data.kpis} />

      <div className="grid gap-5 lg:grid-cols-3">
        <HudPanel
          className="lg:col-span-2"
          title="Proformas vs órdenes confirmadas"
          subtitle={`Comparativa mensual · conversión acumulada ${data.conversion.conversionAcumulada}%`}
        >
          {conversionSeries.length ? (
            <ConversionBarChart data={conversionSeries} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No hay proformas ni órdenes en este período.</p>
          )}
        </HudPanel>

        <HudPanel title="Muestras por matriz" subtitle="Distribución del total procesado">
          {matricesChart.length ? (
            <>
              <div className="relative mx-auto h-52 w-52">
                <div className="absolute inset-2 rounded-full bg-[#251d50] shadow-[inset_0_12px_28px_rgba(0,0,0,0.4)] ring-1 ring-white/10" />
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {matricesChart.map((entry, i) => (
                        <linearGradient key={entry.name} id={`matriz-g-${i}`} x1="0" y1="1" x2="1" y2="0">
                          <stop offset="0%" stopColor={entry.deep} />
                          <stop offset="45%" stopColor={entry.color} />
                          <stop offset="100%" stopColor={entry.glow} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={matricesChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      stroke="transparent"
                    >
                      {matricesChart.map((entry, i) => (
                        <Cell key={entry.name} fill={`url(#matriz-g-${i})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlowTooltip suffix="%" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold tabular-nums text-white">{matrizTotal}%</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {matrixFilter === "todas" ? "Total" : "Filtro"}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5">
                {matricesChart.map((item) => (
                  <li key={item.name} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto tabular-nums text-slate-400">{item.value}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No hay muestras en este período.</p>
          )}
        </HudPanel>
      </div>

      <HudPanel title="Tendencia de solicitudes de servicio" subtitle="Período actual vs el anterior de igual duración">
        {data.tendencia.length ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.tendencia} margin={{ top: 28, right: 24, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaSolicitudes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaAnterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 10" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={
                      <GlowTooltip
                        labelFormatter={formatTooltipDate}
                        nameMap={{ solicitudes: "Este período", anterior: "Período anterior" }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="anterior"
                    stroke="none"
                    fill="url(#areaAnterior)"
                    name="anteriorFill"
                    legendType="none"
                    tooltipType="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="solicitudes"
                    stroke="#7dd3fc"
                    strokeWidth={3}
                    fill="url(#areaSolicitudes)"
                    dot={{ r: 3.5, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: "#fff", stroke: "#38bdf8", strokeWidth: 3 }}
                    name="solicitudes"
                  />
                  <Line
                    type="monotone"
                    dataKey="anterior"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                    name="anterior"
                  />
                  {picoSolicitudes ? (
                    <ReferenceDot
                      x={picoSolicitudes.mes}
                      y={picoSolicitudes.solicitudes}
                      ifOverflow="extendDomain"
                      shape={<PeakCallout value={picoSolicitudes.solicitudes} />}
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-6 rounded bg-sky-300" /> Este período
              </span>
              <span className="flex items-center gap-2">
                <span className="h-px w-6 border-t border-dashed border-slate-400" /> Período anterior
              </span>
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-slate-400">No hay solicitudes en este período.</p>
        )}
      </HudPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <HudPanel
          title="Cumplimiento de planes de muestreo"
          subtitle={`${data.planes.ejecutados} de ${data.planes.programados} planes ejecutados`}
        >
          <GaugeChart
            value={data.planes.cumplimiento}
            programados={data.planes.programados}
            ejecutados={data.planes.ejecutados}
            aTiempo={data.planes.aTiempo}
            size={240}
          />
        </HudPanel>

        <HudPanel
          title={mapaModo === "clientes" ? "Ubicación de clientes" : "Procedencia geográfica de muestras"}
          subtitle={
            mapaModo === "clientes"
              ? "Coordenadas registradas de cada cliente"
              : "Planes de muestreo con coordenadas reales"
          }
        >
          <NicaraguaMap
            puntos={data.puntos}
            modo={mapaModo}
            onModo={cargarPuntosMapa}
            cargando={cargandoMapa}
          />
        </HudPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <HudPanel title="Top clientes por volumen" subtitle="Clientes con mayor actividad en el período">
          {data.topClientes.items.length || cargandoClientes ? (
            <TopClientesList
              clientes={data.topClientes.items}
              pagina={data.topClientes.pagina}
              tamano={data.topClientes.tamano}
              total={data.topClientes.total}
              totalPaginas={data.topClientes.totalPaginas}
              onPagina={setPaginaClientes}
              cargando={cargandoClientes}
            />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No hay clientes con solicitudes en este período.</p>
          )}
        </HudPanel>

        <HudPanel title="Análisis más solicitados" subtitle="Demanda por tipo de análisis de laboratorio">
          {analisisChart.length ? (
            <AnalisisCapsuleChart data={analisisChart} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No hay análisis solicitados en este período.</p>
          )}
        </HudPanel>
      </div>

      <p className="px-1 pb-1 text-center text-xs text-slate-500">
        CIRA UNAN — Centro de Investigación de Recursos Acuáticos · {new Date().getFullYear()}
      </p>
    </div>
  );
}
