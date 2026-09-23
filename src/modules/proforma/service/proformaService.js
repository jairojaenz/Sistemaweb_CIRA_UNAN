/**
 * Service: Proformas
 * API: /api/FormatosProforma/...
 * Listados pasan por asList() por si la API envuelve en data.
 *
 * La API devuelve nombres canónicos (precioUnitario, total, subtotalBruto…).
 * El listado, el modal y el PDF aún leen alias del wizard (precioUnitarioDetalle…).
 * Aquí se unifican para que Number() no reciba undefined → C$NaN.
 */
import { apiGet, apiPost, apiPut } from "../../../auth/api";
import { asList } from "../../../utils/apiList.js";

export { getSolicitudById } from "../../solicitud-servicio/service/solicitudServicioService.js";

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapDetalleProforma(d) {
  const cantidad = num(d.cantidadDetalleProforma ?? d.cantidad, 0);
  const precioUnitario = num(d.precioUnitarioDetalle ?? d.precioUnitario, 0);
  const total = num(d.totalDetalleProforma ?? d.total, 0);
  return {
    ...d,
    cantidad,
    precioUnitario,
    total,
    cantidadDetalleProforma: cantidad,
    precioUnitarioDetalle: precioUnitario,
    totalDetalleProforma: total,
  };
}

function mapProforma(p) {
  if (!p || typeof p !== "object") return p;
  return {
    ...p,
    fechaMuestreoProforma: p.fechaMuestreoProforma ?? p.fechaMuestreo ?? "",
    fechaCreacionProforma: p.fechaCreacionProforma ?? p.fechaCreacion ?? "",
    sumaProforma: num(p.sumaProforma ?? p.subtotalBruto, 0),
    descuentoProforma: num(p.descuentoProforma ?? p.descuento, 0),
    subTotalProforma: num(p.subTotalProforma ?? p.subtotalNeto, 0),
    ivaProforma: num(p.ivaProforma ?? p.iva, 0),
    totalProforma: num(p.totalProforma ?? p.total, 0),
    observacionProforma: p.observacionProforma ?? p.observacion ?? "",
    detalles: asList(p.detalles).map(mapDetalleProforma),
    matrices: asList(p.matrices).map((m) => ({
      ...m,
      nombreMatriz: m.nombreMatriz ?? m.nombre ?? "",
    })),
  };
}

export async function getProformas() {
  const res = await apiGet("/api/FormatosProforma/proforma");
  return asList(res).map(mapProforma);
}

export async function getTiposMuestreo() {
  const res = await apiGet("/api/catalogos/tipos-muestreo");
  return asList(res);
}

export async function createProforma(data) {
  return await apiPost("/api/FormatosProforma/create-proforma", data);
}

export async function updateProforma(id, data) {
  return await apiPut(`/api/FormatosProforma/update-proforma/${id}`, data);
}
