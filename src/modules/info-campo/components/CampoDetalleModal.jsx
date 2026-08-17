import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Droplets,
  FlaskConical,
  Hash,
  MapPin,
  Percent,
  Thermometer,
  UserRound,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { FaTimes } from "react-icons/fa";
import { getEquiposMuestreo } from "../../catalogos/service/equiposMuestreoService.js";

function textoOGuion(value) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function etiquetaTipoMuestreo(nombre) {
  const n = String(nombre ?? "").trim();
  if (!n) return "—";
  if (/completo/i.test(n) && !/compuesto/i.test(n)) {
    return n.replace(/completo/gi, "Compuesto");
  }
  return n;
}

function esTipoCompuesto(nombre) {
  return /compuesto|completo/i.test(String(nombre ?? ""));
}

function etiquetaQuienToma(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "cliente") return "Cliente";
  if (v === "tecnico") return "Técnico del CIRA";
  return textoOGuion(value);
}

function coordenadasTexto(detail) {
  const n = String(detail?.coordenadasN ?? "").trim();
  const e = String(detail?.coordenadasE ?? "").trim();
  if (n && e) return `${n}, ${e}`;
  return n || e || "—";
}

function verificacionPartes(value) {
  const text = String(value ?? "").trim();
  if (!text) return { nombre: "—", fecha: "—" };
  const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (!iso) return { nombre: text, fecha: "—" };
  const nombre = text.replace(iso[0], "").replace(/[\s|—–-]+/g, " ").trim();
  return { nombre: nombre || "—", fecha: iso[1] };
}

function formatFecha(value) {
  const t = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const [y, m, d] = t.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return t || "—";
}

function formatHora(value) {
  const t = String(value ?? "").trim();
  if (!t) return "—";
  return t.length >= 5 ? t.slice(0, 5) : t;
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

function estadoClase(estado) {
  const n = String(estado ?? "").toLowerCase();
  if (/pendiente/.test(n)) return "bg-amber-50 text-amber-800 border-amber-200";
  if (/aprob|complet|final/.test(n)) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (/rechaz|anul/.test(n)) return "bg-red-50 text-red-800 border-red-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

const PARAMETROS_DETALLE = [
  { key: "temperatura", label: "Temperatura", unit: "°C", icon: Thermometer, tone: "bg-orange-50 text-orange-700" },
  { key: "ph", label: "pH", unit: "pH", icon: Droplets, tone: "bg-teal-50 text-teal-700" },
  { key: "conductividadElectrica", label: "Conductividad", unit: "µS/cm", icon: Zap, tone: "bg-amber-50 text-amber-700" },
  { key: "potencialRedox", label: "Potencial redox", unit: "mV", icon: Activity, tone: "bg-violet-50 text-violet-700" },
  { key: "cloroResidual", label: "Cloro residual", unit: "mg/l", icon: FlaskConical, tone: "bg-sky-50 text-sky-700" },
  { key: "salinidad", label: "Salinidad", unit: "‰", icon: Waves, tone: "bg-cyan-50 text-cyan-700" },
  { key: "oxigenoDisuelto", label: "Oxígeno disuelto", unit: "mg/l", icon: Wind, tone: "bg-blue-50 text-blue-800" },
  { key: "saturacionOxigeno", label: "Saturación O₂", unit: "%", icon: Percent, tone: "bg-emerald-50 text-emerald-700" },
];

function DetailItem({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{textoOGuion(value)}</p>
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

function ChipList({ items, empty = "—" }) {
  const list = (items ?? []).map((item) => String(item ?? "").trim()).filter(Boolean);
  if (list.length === 0) {
    return <p className="text-sm font-semibold text-gray-900">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function nombresEquiposDesdeDetalle(detail) {
  return (detail?.nombresEquipos ?? []).map((n) => String(n ?? "").trim()).filter(Boolean);
}

function idsEquiposDesdeDetalle(detail) {
  return (detail?.idsEquipos ?? []).map(Number).filter((id) => id > 0);
}

export default function CampoDetalleModal({ detail, loading, onClose, onEdit }) {
  const [equipos, setEquipos] = useState(() => nombresEquiposDesdeDetalle(detail));
  const verificacion = verificacionPartes(detail?.verificacionFecha);
  const parametros = detail?.parametros ?? {};
  const ensayos = (detail?.ensayos ?? []).map((e) => e.nombreAnalisis).filter(Boolean);
  const compuesto = esTipoCompuesto(detail?.tipoMuestreo);

  useEffect(() => {
    const nombres = nombresEquiposDesdeDetalle(detail);
    if (nombres.length) {
      setEquipos(nombres);
      return undefined;
    }
    const ids = idsEquiposDesdeDetalle(detail);
    if (!ids.length) {
      setEquipos([]);
      return undefined;
    }
    let cancelado = false;
    getEquiposMuestreo()
      .then((lista) => {
        if (cancelado) return;
        const porId = new Map(
          (lista ?? []).map((eq) => [Number(eq.idEquipo), eq.nombreEquipo || eq.nombre]),
        );
        setEquipos(ids.map((id) => String(porId.get(id) ?? "").trim() || `Equipo #${id}`));
      })
      .catch(() => {
        if (!cancelado) setEquipos(ids.map((id) => `Equipo #${id}`));
      });
    return () => {
      cancelado = true;
    };
  }, [detail]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-blue-900">Detalle de campo</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {textoOGuion(detail?.identificacionMuestra)}
              {detail?.numeroProforma ? ` · ${detail.numeroProforma}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {loading || !detail ? (
          <p className="p-8 text-sm text-gray-500">Cargando detalle del formato…</p>
        ) : (
          <div className="max-h-[calc(92vh-8.5rem)] space-y-4 overflow-y-auto p-6">
            <DetailSection title="Identificación" icon={ClipboardList}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Muestra" value={detail.identificacionMuestra} />
                <DetailItem label="Proforma" value={detail.numeroProforma} />
                <DetailItem label="Usuario" value={detail.usuario} />
                <div>
                  <p className="text-xs font-medium text-gray-500">Estado</p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoClase(detail.estado)}`}
                  >
                    {textoOGuion(detail.estado)}
                  </span>
                </div>
                <DetailItem label="Fecha de registro" value={formatFechaHora(detail.fechaCreacion)} />
              </div>
            </DetailSection>

            <DetailSection title="Ubicación" icon={MapPin}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Lugar" value={detail.lugar} />
                <DetailItem label="Comunidad" value={detail.comunidad} />
                <DetailItem label="Departamento" value={detail.departamento} />
                <DetailItem label="Municipio" value={detail.municipio} />
                <DetailItem label="Elevación" value={detail.elevacion ? `${detail.elevacion} m` : ""} />
                <DetailItem label="Coordenadas" value={coordenadasTexto(detail)} />
              </div>
            </DetailSection>

            <DetailSection title="Muestreo" icon={CalendarDays}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Fecha de muestreo" value={formatFecha(detail.fechaMuestreo)} />
                <DetailItem label="Hora de toma" value={formatHora(detail.horaMuestreo)} />
                <DetailItem label="Tipo de muestreo" value={etiquetaTipoMuestreo(detail.tipoMuestreo)} />
                {compuesto ? (
                  <DetailItem label="Horas del compuesto" value={detail.horasCompuesto} />
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="Características de la muestra" icon={FlaskConical}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="Matriz" value={detail.matriz} />
                <DetailItem label="Fuente" value={detail.fuente} />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Ensayos</p>
                <ChipList items={ensayos} empty="Sin ensayos registrados" />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Equipos</p>
                <ChipList items={equipos} empty="Sin equipos asociados" />
              </div>
            </DetailSection>

            <DetailSection title="Parámetros de campo" icon={Activity}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PARAMETROS_DETALLE.map((param) => {
                  const Icon = param.icon;
                  const valor = parametros[param.key];
                  return (
                    <div key={param.key} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${param.tone}`}>
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <p className="text-xs font-semibold text-gray-700">{param.label}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {textoOGuion(valor)}
                        {String(valor ?? "").trim() ? (
                          <span className="ml-1 text-xs font-medium text-gray-500">{param.unit}</span>
                        ) : null}
                      </p>
                    </div>
                  );
                })}
              </div>
            </DetailSection>

            <DetailSection title="Procedimiento" icon={UserRound}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Quién tomó la muestra" value={etiquetaQuienToma(detail.quienTomaMuestra)} />
                <DetailItem label="Instructivo del cliente" value={detail.instructivoCliente} />
                <DetailItem label="Procedimiento CIRA" value={detail.procedimientoCira} />
              </div>
            </DetailSection>

            <DetailSection title="Verificación" icon={Hash}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Captada por" value={detail.muestraCaptada} />
                <DetailItem label="Nombre de quien verifica" value={verificacion.nombre} />
                <DetailItem label="Fecha de verificación" value={formatFecha(verificacion.fecha)} />
                <DetailItem label="Iniciales del analista" value={detail.inicialesAnalista} />
                <DetailItem label="Código de muestra" value={detail.codigoMuestra} />
              </div>
            </DetailSection>

            <DetailSection title="Observación">
              <p className="whitespace-pre-line text-sm font-medium text-gray-800">
                {textoOGuion(detail.observacion)}
              </p>
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
              Editar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
