/**
 * Gráficos del dashboard ejecutivo.
 * API: /api/Graficos
 */
import { apiGet } from "../../../auth/api.js";
import { asList } from "../../../utils/apiList.js";
import { getClientes } from "../../clientes/service/clienteService.js";

function parseLatLng(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function queryFiltro({ fechaInicio, fechaFin, idMatriz, pagina, tamano, tipo } = {}) {
  const q = new URLSearchParams();
  const inicio = String(fechaInicio ?? "").trim();
  const fin = String(fechaFin ?? "").trim();
  if (inicio && fin) {
    q.set("fechaInicio", inicio);
    q.set("fechaFin", fin);
  }
  if (idMatriz) q.set("idMatriz", String(idMatriz));
  if (pagina) q.set("pagina", String(pagina));
  if (tamano) q.set("tamano", String(tamano));
  if (tipo) q.set("tipo", String(tipo));
  const s = q.toString();
  return s ? `?${s}` : "";
}

function unwrap(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.$values)) return res.$values;
  if (res && typeof res === "object" && res.data != null && !Array.isArray(res)) {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.$values)) return res.data.$values;
    return res.data;
  }
  return res;
}

export function periodoVacio() {
  return { anio: "", mes: "", dia: "" };
}

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export function opcionesAnios(desde = 2020) {
  const actual = new Date().getFullYear();
  const anios = [];
  for (let y = actual; y >= desde; y -= 1) anios.push(y);
  return anios;
}

export function opcionesMeses() {
  return MESES;
}

export function diasDelMes(anio, mes) {
  const y = Number(anio);
  const m = Number(mes);
  if (!y || !m) return 0;
  return new Date(y, m, 0).getDate();
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Convierte año / mes / día en el rango que entiende la API. */
export function rangoDesdePeriodo({ anio, mes, dia } = {}) {
  const y = Number(anio);
  if (!y) return { start: "", end: "" };
  const m = Number(mes);
  const d = Number(dia);
  if (!m) return { start: `${y}-01-01`, end: `${y}-12-31` };
  const ultimo = diasDelMes(y, m);
  if (!d) return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(ultimo)}` };
  const diaOk = Math.min(d, ultimo);
  const fecha = `${y}-${pad(m)}-${pad(diaOk)}`;
  return { start: fecha, end: fecha };
}

export function etiquetaPeriodo({ anio, mes, dia } = {}) {
  if (!anio) return "Todos los registros";
  const nombreMes = MESES.find((x) => x.value === String(Number(mes)))?.label;
  if (!mes) return `Año ${anio}`;
  if (!dia) return `${nombreMes} de ${anio}`;
  return `${Number(dia)} de ${nombreMes} de ${anio}`;
}

export async function getKpisGrafico(filtros) {
  return unwrap(await apiGet(`/api/Graficos/kpis${queryFiltro(filtros)}`)) || {};
}

export async function getConversionMensual(filtros) {
  const raw = unwrap(await apiGet(`/api/Graficos/conversion-mensual${queryFiltro(filtros)}`)) || {};
  return {
    conversionAcumulada: Number(raw.conversionAcumulada ?? raw.ConversionAcumulada ?? 0),
    series: asList(raw.series ?? raw.Series ?? raw),
  };
}

export async function getMuestrasPorMatriz(filtros) {
  return asList(unwrap(await apiGet(`/api/Graficos/muestras-por-matriz${queryFiltro(filtros)}`)));
}

export async function getTendenciaSolicitudes(filtros) {
  return asList(unwrap(await apiGet(`/api/Graficos/tendencia-solicitudes${queryFiltro(filtros)}`)));
}

export async function getCumplimientoPlanes(filtros) {
  return unwrap(await apiGet(`/api/Graficos/cumplimiento-planes${queryFiltro(filtros)}`)) || {};
}

function mapPuntoMapa(p) {
  return {
    id: p.id ?? p.Id,
    nombre: p.nombre ?? p.Nombre ?? "",
    latitud: p.latitud ?? p.Latitud ?? "",
    longitud: p.longitud ?? p.Longitud ?? "",
    coordenadas: p.coordenadas ?? p.Coordenadas ?? "",
    departamento: p.departamento ?? p.Departamento ?? "",
    municipio: p.municipio ?? p.Municipio ?? "",
    origen: p.origen ?? p.Origen ?? "",
    matriz: p.matriz ?? p.Matriz ?? "",
    plan: p.plan ?? p.Plan ?? "",
    idGrupo: p.idGrupo ?? p.IdGrupo ?? "",
  };
}

function puntosDesdeListadoClientes(clientes) {
  return (clientes ?? []).flatMap((c) => {
    const parsed = parseLatLng(c.coordenadasCliente ?? c.coordenadas ?? c.Coordenadas ?? "");
    if (!parsed) return [];
    const nombre = `${c.nombreCliente ?? c.nombre ?? ""} ${c.apellidoCliente ?? c.apellido ?? ""}`.trim();
    return [
      {
        id: `cliente-${c.idCliente ?? c.IdCliente}`,
        idGrupo: `cliente-${c.idCliente ?? c.IdCliente}`,
        nombre: nombre || "Cliente",
        latitud: String(parsed.lat),
        longitud: String(parsed.lng),
        coordenadas: c.coordenadasCliente ?? c.coordenadas ?? "",
        departamento: c.departamento ?? "",
        municipio: c.municipio ?? "",
        origen: "Cliente",
        matriz: "",
        plan: "",
      },
    ];
  });
}

function puntoTieneCoords(p) {
  return Boolean(parseLatLng(`${p.latitud}, ${p.longitud}`) || parseLatLng(p.coordenadas));
}

export async function getPuntosClientesMapa() {
  try {
    const desdeClientes = puntosDesdeListadoClientes(await getClientes());
    if (desdeClientes.length) return desdeClientes;
  } catch {
    /* el listado es solo Administrador; se intenta el endpoint de gráficos */
  }

  const delGrafico = asList(unwrap(await apiGet(`/api/Graficos/puntos-clientes?_=${Date.now()}`)))
    .map(mapPuntoMapa)
    .filter(puntoTieneCoords);
  return delGrafico;
}

export async function getPuntosPlanesMapa(idMatriz) {
  const query = queryFiltro({ idMatriz });
  const sep = query ? "&" : "?";
  return asList(unwrap(await apiGet(`/api/Graficos/puntos-planes${query}${sep}_=${Date.now()}`))).map(mapPuntoMapa);
}

export async function getPuntosDemanda(filtros) {
  if (filtros?.tipo === "clientes") return getPuntosClientesMapa();
  return getPuntosPlanesMapa(filtros?.idMatriz);
}

function mapTopCliente(c) {
  return {
    idCliente: c.idCliente ?? c.IdCliente,
    name: c.nombre ?? c.Nombre,
    muestras: Number(c.muestras ?? c.Muestras ?? 0),
    ordenes: Number(c.ordenes ?? c.Ordenes ?? 0),
    spark: c.spark ?? c.Spark ?? [],
  };
}

export async function getTopClientesGrafico(filtros) {
  const raw = unwrap(await apiGet(`/api/Graficos/top-clientes${queryFiltro(filtros)}`)) || {};
  const items = asList(raw.items ?? raw.Items ?? raw).map(mapTopCliente);
  const total = Number(raw.total ?? raw.Total ?? items.length);
  const pagina = Number(raw.pagina ?? raw.Pagina ?? 1);
  const tamano = Number(raw.tamano ?? raw.Tamano ?? 20);
  const totalPaginas = Number(raw.totalPaginas ?? raw.TotalPaginas ?? Math.max(1, Math.ceil(total / tamano)));
  return { items, total, pagina, tamano, totalPaginas };
}

export async function getAnalisisSolicitados(filtros) {
  return asList(unwrap(await apiGet(`/api/Graficos/analisis-solicitados${queryFiltro(filtros)}`))).filter(
    (a) => Number(a.cantidad ?? a.Cantidad ?? 0) > 0,
  );
}

export async function getAlertaCustodia(filtros) {
  return unwrap(await apiGet(`/api/Graficos/alerta-custodia${queryFiltro(filtros)}`)) || {};
}
