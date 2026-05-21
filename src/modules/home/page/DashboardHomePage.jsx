import { useState, useMemo } from "react";
import { useAuth } from "../../../auth/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { FaExclamationTriangle, FaFlask, FaFileInvoiceDollar, FaClipboardCheck, FaFilter, FaIndustry } from "react-icons/fa";
import {
  monthlyConversionData, matrixDistribution, solicitudesTrend,
  gaugeData, topClientes, analisisSolicitados, alertsData,
} from "../components/dashboardData";
import GaugeChart from "../components/GaugeChart";
import NicaraguaMap from "../components/NicaraguaMap";

const COLORS = {
  primary: "#1e3a8a",
  secondary: "#3b82f6",
  light: "#60a5fa",
  pale: "#93c5fd",
  emerald: "#059669",
  emeraldLight: "#10b981",
  emeraldPale: "#34d399",
  warning: "#d97706",
  danger: "#dc2626",
  gray: "#6b7280",
  grayLight: "#9ca3af",
  grayBg: "#f3f4f6",
};

const DONUT_COLORS = ["#1e3a8a", "#3b82f6", "#059669", "#10b981", "#34d399", "#9ca3af"];

const KPI_CARDS = [
  { label: "Proformas Emitidas", value: "6,240", sub: "Últimos 12 meses", icon: FaFileInvoiceDollar, color: "from-blue-700 to-blue-500", textColor: "text-white" },
  { label: "Órdenes Confirmadas", value: "4,420", sub: "70.8% tasa de conversión", icon: FaClipboardCheck, color: "from-emerald-600 to-emerald-400", textColor: "text-white" },
  { label: "Muestras Procesadas", value: "5,850", sub: "~488/mes en promedio", icon: FaFlask, color: "from-cyan-600 to-cyan-400", textColor: "text-white" },
  { label: "Clientes Atendidos", value: "128", sub: "+12% vs año anterior", icon: FaIndustry, color: "from-violet-600 to-violet-400", textColor: "text-white" },
];

function formatTooltipDate(label) {
  const map = { Ene: "Enero", Feb: "Febrero", Mar: "Marzo", Abr: "Abril", May: "Mayo", Jun: "Junio", Jul: "Julio", Ago: "Agosto", Sep: "Septiembre", Oct: "Octubre", Nov: "Noviembre", Dic: "Diciembre" };
  return map[label] || label;
}

function formatTooltipValue(value, name) {
  const labels = { proformas: "Proformas", ordenes: "Órdenes", solicitudes: "Solicitudes" };
  return [`${value}`, labels[name] || name];
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ start: "2025-01-01", end: "2025-12-31" });
  const [matrixFilter, setMatrixFilter] = useState("todas");

  const filteredData = useMemo(() => {
    if (matrixFilter === "todas") return matrixDistribution;
    return matrixDistribution.filter((m) => m.name === matrixFilter);
  }, [matrixFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard Ejecutivo
          </h1>
          <p className="text-sm text-gray-500">
            Bienvenido, <span className="font-semibold text-blue-700">{user?.nombre} {user?.apellido || "Usuario"}</span> — Panel de indicadores estratégicos CIRA
          </p>
          
        </div>
      </div>

    

      {/* Global Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <FaFilter className="h-4 w-4" />
          Filtros:
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Fecha Inicio</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Fecha Fin</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de Matriz</label>
          <select
            value={matrixFilter}
            onChange={(e) => setMatrixFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="todas">Todas las matrices</option>
            {matrixDistribution.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setDateRange({ start: "2025-01-01", end: "2025-12-31" }); setMatrixFilter("todas"); }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Limpiar
        </button>
      </div>

      {/* Alert Widget */}
      <div className="flex items-start gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
          <FaExclamationTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700">{alertsData.cadenasPendientes}</span>
            <span className="text-sm font-medium text-amber-800">Cadenas de Custodia sin procesar</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            De <strong>{alertsData.totalCadenas}</strong> cadenas recibidas, <strong>{alertsData.cadenasPendientes}</strong> tienen más de 24 horas sin ser procesadas. Tiempo promedio de espera: <strong>{alertsData.tiempoPromedioHoras}h</strong>.
            Se recomienda priorizar su revisión para evitar retrasos en la cadena de frío.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.color} p-4 text-white shadow-md`}
            >
              <div className="absolute right-2 top-2 opacity-10">
                <Icon className="h-12 w-12" />
              </div>
              <p className="relative text-xs font-medium opacity-80">{card.label}</p>
              <p className="relative mt-1 text-2xl font-bold">{card.value}</p>
              <p className="relative mt-1 text-xs opacity-75">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Row 1: Stacked Bar + Donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Proformas Emitidas vs Órdenes de Servicio Confirmadas</h2>
          <p className="mb-4 text-xs text-gray-400">Comparativa mensual — Tasa de conversión acumulada: 70.8%</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyConversionData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={formatTooltipValue}
                  labelFormatter={formatTooltipDate}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (value === "proformas" ? "Proformas Emitidas" : "Órdenes Confirmadas")}
                />
                <Bar
                  dataKey="proformas"
                  fill="#1e3a8a"
                  radius={[4, 4, 0, 0]}
                  name="proformas"
                  maxBarSize={32}
                />
                <Bar
                  dataKey="ordenes"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  name="ordenes"
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Muestras por Matriz</h2>
          <p className="mb-4 text-xs text-gray-400">Distribución porcentual del total procesado</p>
          <div className="flex h-72 flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {filteredData.map((entry, idx) => (
                    <Cell key={entry.name} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, "Participación"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
                  formatter={(value) => <span className="text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Line Chart */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-800">Tendencia de Solicitudes de Servicio</h2>
        <p className="mb-4 text-xs text-gray-400">Último semestre — Volumen de solicitudes recibidas</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={solicitudesTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value}`, "Solicitudes"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
              />
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="solicitudes"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={{ r: 5, fill: "#1e3a8a", stroke: "white", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: "#1e3a8a", stroke: "white", strokeWidth: 2 }}
                name="solicitudes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Gauge + Map */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Cumplimiento de Planes de Muestreo</h2>
          <p className="mb-4 text-xs text-gray-400">{gaugeData.ejecutados} de {gaugeData.programados} planes ejecutados</p>
          <div className="flex items-center justify-center">
            <GaugeChart value={gaugeData.cumplimiento} size={240} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Procedencia Geográfica de Muestras</h2>
          <p className="mb-4 text-xs text-gray-400">Distribución departamental — el tamaño del círculo indica el volumen</p>
          <NicaraguaMap filterMatrix={matrixFilter} />
        </div>
      </div>

      {/* Row 4: Bonus Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Top Clientes por Volumen de Muestras</h2>
          <p className="mb-4 text-xs text-gray-400">Clientes con mayor actividad en el período</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClientes} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  formatter={(value) => [`${value} muestras`, "Volumen"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="muestras" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800">Análisis Más Solicitados</h2>
          <p className="mb-4 text-xs text-gray-400">Demanda por tipo de análisis de laboratorio</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analisisSolicitados} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value} solicitudes`, "Cantidad"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="cantidad" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {analisisSolicitados.map((_, idx) => (
                    <Cell key={idx} fill={idx < 2 ? "#1e3a8a" : idx < 4 ? "#059669" : "#34d399"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-xl bg-white p-4 text-center text-xs text-gray-400 shadow-sm">
        CIRA UNAN — Centro de Investigación de Recursos Acuáticos · Datos simulados con fines demostrativos · {new Date().getFullYear()}
      </div>
    </div>
  );
}
