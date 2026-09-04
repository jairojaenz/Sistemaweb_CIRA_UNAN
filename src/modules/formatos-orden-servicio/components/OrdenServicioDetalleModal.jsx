import { useEffect } from "react";
import {
  ClipboardList,
  FileText,
  FlaskConical,
  MapPin,
  PenLine,
  Truck,
  UserRound,
} from "lucide-react";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import { labelFormatoCampo } from "../service/catalogosOrdenService.js";
import FirmaDisplay from "../../../components/FirmaDisplay.jsx";

function texto(value) {
  const t = String(value ?? "").trim();
  return t || "—";
}

function formatFecha(value) {
  const t = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const [y, m, d] = t.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return t || "—";
}

function formatFechaHora(value) {
  const t = String(value ?? "").trim();
  if (!t) return "—";
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const fecha = formatFecha(t);
    const timeMatch = t.match(/T(\d{2}:\d{2})/);
    return timeMatch ? `${fecha} ${timeMatch[1]}` : fecha;
  }
  return t;
}

function etiquetaEstadoClase(estado) {
  const n = String(estado ?? "").toLowerCase();
  if (n.includes("pendiente")) return "bg-amber-50 text-amber-800 border-amber-200";
  if (n.includes("proceso")) return "bg-sky-50 text-sky-800 border-sky-200";
  if (n.includes("complet")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (n.includes("anul")) return "bg-red-50 text-red-800 border-red-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function etiquetaQuien(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "usuario") return "Usuario";
  if (v === "cira") return "Personal CIRA";
  return texto(value);
}

function etiquetaFormatoCampo(detail, formatosCampo) {
  const id = Number(detail?.idFormatoCampo ?? detail?.formatoCampo);
  if (!id) return "—";
  const match = (formatosCampo ?? []).find((f) => Number(f.idFormatoCampo) === id);
  return match ? labelFormatoCampo(match) : `#${id}`;
}

function labelUsuario(u) {
  const nombre = u?.nombreUsuario ?? u?.NombreUsuario ?? "";
  const apellido = u?.apellidoUsuario ?? u?.ApellidoUsuario ?? "";
  return `${nombre} ${apellido}`.trim() || nombre;
}

function usuarioPorNombre(usuarios, nombre) {
  const n = String(nombre ?? "").trim().toLowerCase();
  if (!n) return null;
  return (
    (usuarios ?? []).find((u) => labelUsuario(u).toLowerCase() === n) ||
    (usuarios ?? []).find((u) => String(u.nombreUsuario ?? "").trim().toLowerCase() === n) ||
    null
  );
}

function firmaDigitalDe(u) {
  return String(u?.firmaUsuario ?? u?.FirmaUsuario ?? u?.firma ?? u?.Firma ?? "").trim();
}

function FirmaDetalle({ titulo, nombre, usuario }) {
  const src = firmaDigitalDe(usuario);
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900">{texto(nombre)}</p>
      {src ? (
        <div className="mt-3">
          <FirmaDisplay src={src} alt={`Firma de ${texto(nombre)}`} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-500">
          {usuario ? "Este usuario no tiene firma digital registrada." : "Sin imagen de firma."}
        </p>
      )}
    </div>
  );
}

function filasMuestras(detail) {
  const wizard = detail?.detalleMuestras ?? [];
  if (wizard.length) {
    return wizard.map((d) => ({
      numero: d.numeroMuestra,
      analisis: d.analisisSolicitado,
      codigo: d.codigoAsignado,
    }));
  }
  return (detail?.detalles ?? []).map((d) => ({
    numero: d.identificacion,
    analisis: d.analisisSolicitado,
    codigo: "",
  }));
}

function horasCompuesto(raw) {
  return String(raw ?? "")
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function telefono(value) {
  const t = String(value ?? "").trim();
  if (!t) return "—";
  return formatTelefonoLocal(t) || t;
}

function DetailItem({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{texto(value)}</p>
    </div>
  );
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-900">
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : (
          <span className="h-5 w-1 rounded-full bg-blue-900" />
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ServicioChip({ activo, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        activo
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-gray-200 bg-white text-gray-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? "bg-emerald-500" : "bg-gray-300"}`} />
      {label}
      <span className="font-medium opacity-80">{activo ? "Sí" : "No"}</span>
    </span>
  );
}

export default function OrdenServicioDetalleModal({
  detail,
  loading = false,
  formatosCampo = [],
  usuarios = [],
  onClose,
  onEdit,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const muestras = filasMuestras(detail);
  const control = detail?.controlRecepcion ?? [];
  const horas = horasCompuesto(detail?.compuestoHorasOrden);
  const servicios = [
    { key: "analisis", label: "Análisis", activo: !!detail?.analisisOrden },
    { key: "muestreo", label: "Muestreo", activo: !!detail?.muestreoOrden },
    { key: "hoja", label: "Hoja de observación", activo: !!detail?.hojaObservacionOrden },
    { key: "informe", label: "Informe técnico", activo: !!detail?.informeTecnicoOrden },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                Orden de servicio
              </p>
              <h2 className="mt-1 truncate text-xl font-bold">
                Nº {texto(detail?.numeroOrden)}
              </h2>
              <p className="mt-1 text-sm text-blue-100">
                Recepción {formatFecha(detail?.fechaRecepcionMuestra)}
                {detail?.usuario ? ` · ${detail.usuario}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              {detail?.estadoOrden ? (
                <span
                  className={`mt-0.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${etiquetaEstadoClase(
                    detail.estadoOrden,
                  )}`}
                >
                  {detail.estadoOrden}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {loading && !detail ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
            <FaSpinner className="h-5 w-5 animate-spin text-blue-900" />
            Cargando detalle de la orden…
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/70 pt-16">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                  <FaSpinner className="h-3.5 w-3.5 animate-spin text-blue-900" />
                  Actualizando datos…
                </span>
              </div>
            ) : null}

            <DetailSection title="Identificación" icon={ClipboardList}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Número de orden" value={detail?.numeroOrden} />
                <DetailItem
                  label="Fecha de recepción"
                  value={formatFecha(detail?.fechaRecepcionMuestra)}
                />
                <DetailItem label="Usuario del sistema" value={detail?.usuario} />
                <DetailItem
                  label="Formato de campo"
                  value={etiquetaFormatoCampo(detail, formatosCampo)}
                />
                <DetailItem
                  label="Solicitud de origen"
                  value={detail?.idFormatoSolicitud ? `#${detail.idFormatoSolicitud}` : ""}
                />
              </div>
            </DetailSection>

            <DetailSection title="Cliente y contacto" icon={UserRound}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Usuario / empresa"
                  value={detail?.usuarioEmpresaOrden}
                  className="sm:col-span-2"
                />
                <DetailItem label="Atención a" value={detail?.atencionAOrden} />
                <DetailItem label="Correo" value={detail?.correoOrden} />
                <DetailItem label="Teléfono" value={telefono(detail?.telefonoOrden)} />
                <DetailItem label="Celular" value={telefono(detail?.celularOrden)} />
                <DetailItem label="Extensión" value={detail?.extensionOrden} />
              </div>
            </DetailSection>

            <DetailSection title="Ubicación" icon={MapPin}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Dirección"
                  value={detail?.direccionOrden}
                  className="sm:col-span-2 lg:col-span-3"
                />
                <DetailItem label="Departamento" value={detail?.departamentoOrden} />
                <DetailItem label="Municipio" value={detail?.municipioOrden} />
              </div>
            </DetailSection>

            <DetailSection title="Servicios y muestreo" icon={FlaskConical}>
              <div className="mb-4 flex flex-wrap gap-2">
                {servicios.map((s) => (
                  <ServicioChip key={s.key} activo={s.activo} label={s.label} />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Tipo de muestreo" value={detail?.tipoMuestreo} />
                <DetailItem label="Otro tipo (especificado)" value={detail?.modalidadMuestreoOtros} />
                <div>
                  <p className="text-xs font-medium text-gray-500">Duración del compuesto</p>
                  {horas.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {horas.map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">—</p>
                  )}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Detalle de muestras" icon={FlaskConical}>
              {muestras.length === 0 ? (
                <p className="text-sm text-gray-500">No hay muestras registradas en esta orden.</p>
              ) : (
                <div className="theme-table overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Nº muestra</th>
                        <th className="px-3 py-2">Análisis solicitado</th>
                        <th className="px-3 py-2">Código asignado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {muestras.map((row, i) => (
                        <tr key={`${row.numero}-${i}`}>
                          <td className="px-3 py-2 font-medium text-gray-900">{texto(row.numero)}</td>
                          <td className="px-3 py-2 text-gray-800">{texto(row.analisis)}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-700">
                            {texto(row.codigo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailSection>

            <DetailSection title="Control de recepción" icon={Truck}>
              {control.length === 0 ? (
                <p className="text-sm text-gray-500">No hay registros de recepción.</p>
              ) : (
                <div className="theme-table overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Laboratorio</th>
                        <th className="px-3 py-2">Recibido por</th>
                        <th className="px-3 py-2">Entrega de resultados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {control.map((row, i) => (
                        <tr key={`${row.laboratorio}-${i}`}>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {texto(row.laboratorio)}
                          </td>
                          <td className="px-3 py-2 text-gray-800">{texto(row.recibidoPor)}</td>
                          <td className="px-3 py-2 text-gray-800">
                            {formatFecha(row.fechaEntregaResultados)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailSection>

            <DetailSection title="Logística y normativa" icon={FileText}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Muestreo realizado por" value={etiquetaQuien(detail?.muestreoPorOrden)} />
                <DetailItem label="Transporte a cargo de" value={etiquetaQuien(detail?.transportePorOrden)} />
                <DetailItem
                  label="Incluir norma en el informe"
                  value={detail?.incluirNormaInforme ? "Sí" : "No fue solicitado"}
                />
                <DetailItem
                  label="Laboratorio específico"
                  value={detail?.especificarLabOrden}
                  className="sm:col-span-2"
                />
              </div>
            </DetailSection>

            <DetailSection title="Observaciones">
              <p className="whitespace-pre-line text-sm font-medium text-gray-800">
                {texto(detail?.observacionOrden)}
              </p>
            </DetailSection>

            <DetailSection title="Firmas" icon={PenLine}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FirmaDetalle
                  titulo="Firma del usuario"
                  nombre={detail?.firmaUsuarioOrden}
                  usuario={usuarioPorNombre(usuarios, detail?.firmaUsuarioOrden)}
                />
                <FirmaDetalle
                  titulo="Recepción CIRA (APE)"
                  nombre={detail?.firmaApeOrden}
                  usuario={usuarioPorNombre(usuarios, detail?.firmaApeOrden)}
                />
              </div>
            </DetailSection>

            <DetailSection title="Registro">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Creado"
                  value={formatFechaHora(detail?.fechaCreacionOrden)}
                />
                <DetailItem label="Creado por" value={detail?.usuarioCreacionOrden} />
              </div>
            </DetailSection>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          {onEdit && detail ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Editar orden
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
