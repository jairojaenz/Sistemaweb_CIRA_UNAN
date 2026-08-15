import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, MapPin, Phone, User } from "lucide-react";
import PlanMuestreoLayout from "./PlanMuestreoLayout.jsx";
import { loadDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { ROUTES } from "../../../router/routes.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";
import { getProformas } from "../../proforma/service/proformaService.js";
import { getMuestras } from "../../catalogos/service/muestrasService.js";

function SectionHeader({ accent = "bg-blue-900", title, subtitle }) {
  return (
    <div className="mb-3">
      <h3 className="mb-0.5 flex items-center gap-3 text-lg font-bold text-blue-900">
        <span className={`h-6 w-1 shrink-0 rounded-full ${accent}`} />
        {title}
      </h3>
      {subtitle && <p className="ml-4 text-sm text-[#6a7282]">{subtitle}</p>}
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

export default function PlanMuestreoPaso1() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromProforma = location.state?.fromProforma;

  const [proformas, setProformas] = useState([]);
  const [muestras, setMuestras] = useState([]);

  const loadCatalogos = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([getProformas(), getMuestras()]);
      setProformas(p ?? []);
      setMuestras((m ?? []).filter((x) => x.activo !== false));
    } catch {
      // El wizard sigue usable; el POST validará FKs.
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  const [draft, setDraft] = useState(() => {
    const draft = loadDraft();
    if (!fromProforma) return draft;
    const { cliente } = fromProforma;

    const detalleRows = (fromProforma.detalles ?? []).map((d) => ({
      lugarMuestreo: "",
      identificacionMuestra: "",
      coordenadas: "",
      matriz: "",
      idMatriz: "",
      fuente: "",
      idFuente: "",
      ensayosSolicitados: d.nombreAnalisis || "",
      idsEnsayos: d.idAnalisis ? [String(d.idAnalisis)] : [],
      tipoEnvaseVolumen: "",
      preservantes: "",
      idPreservante: "",
    }));

    return {
      ...draft,
      paso1: {
        ...draft.paso1,
        usuarioProyecto: `${cliente.nombreCliente} ${cliente.apellidoCliente}`.trim(),
        proformaNo: fromProforma.numeroProforma || "",
        idProforma: fromProforma.idProforma || "",
        direccionUsuario: cliente.direccionCliente || "",
        telefono: formatTelefonoLocal(cliente.telefonoCliente || cliente.celularCliente || ""),
        atencionA: `${cliente.nombreCliente} ${cliente.apellidoCliente}`.trim(),
        personaContacto: `${cliente.nombreCliente} ${cliente.apellidoCliente}`.trim(),
        telefonoContacto: formatTelefonoLocal(cliente.telefonoCliente || cliente.celularCliente || ""),
      },
      paso2: detalleRows.length > 0
        ? { ...draft.paso2, detalle: detalleRows }
        : draft.paso2,
    };
  });

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (fromProforma) {
      navigate(ROUTES.planMuestreoPaso(1), { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const paso1 = draft.paso1;

  const setPaso1 = (patch) => {
    setDraft((prev) => ({ ...prev, paso1: { ...prev.paso1, ...patch } }));
  };

  return (
    <PlanMuestreoLayout
      step={1}
      wide
      compact
      previousDisabled
      onPrevious={() => {}}
      onNext={() => navigate(ROUTES.planMuestreoPaso(2))}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Identificación del plan</h2>
          <p className="mt-0.5 text-sm text-[#6a7282]">
            Datos del usuario, contactos y programación del muestreo, como en el formato CIRA.
          </p>
        </div>

        <section>
          <SectionHeader
            title="Datos generales"
            subtitle="Código, proyecto, proforma y dirección del usuario"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Código de referencia" htmlFor="plan-codigoReferencia">
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                <input
                  id="plan-codigoReferencia"
                  className="input pl-10"
                  value={paso1.codigoReferencia}
                  onChange={(e) => setPaso1({ codigoReferencia: e.target.value })}
                  placeholder="Ej. PM-2026-001"
                />
              </div>
            </Field>

            <Field label="Usuario / Proyecto" htmlFor="plan-usuarioProyecto">
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                <input
                  id="plan-usuarioProyecto"
                  className="input pl-10"
                  value={paso1.usuarioProyecto}
                  onChange={(e) => setPaso1({ usuarioProyecto: e.target.value })}
                  placeholder="Nombre del usuario o proyecto"
                />
              </div>
            </Field>

            <Field label="Proforma N°" htmlFor="plan-idProforma">
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                <select
                  id="plan-idProforma"
                  className="select pl-10"
                  value={paso1.idProforma || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = proformas.find((x) => String(x.idProforma) === String(id));
                    setPaso1({
                      idProforma: id,
                      proformaNo: p?.numeroProforma ?? p?.NumeroProforma ?? paso1.proformaNo,
                    });
                  }}
                >
                  <option value="">Seleccione una proforma</option>
                  {proformas.map((p) => (
                    <option key={p.idProforma} value={p.idProforma}>
                      {p.numeroProforma ?? p.NumeroProforma ?? `Proforma #${p.idProforma}`}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Dirección del usuario" htmlFor="plan-direccionUsuario">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                <input
                  id="plan-direccionUsuario"
                  className="input pl-10"
                  value={paso1.direccionUsuario}
                  onChange={(e) => setPaso1({ direccionUsuario: e.target.value })}
                  placeholder="Dirección del usuario o empresa"
                />
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
          <SectionHeader
            accent="bg-blue-600"
            title="Contacto"
            subtitle="Persona de atención y coordinación del muestreo"
          />
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem] lg:grid-cols-[1fr_14rem]">
              <Field label="Con atención a" htmlFor="plan-atencionA">
                <input
                  id="plan-atencionA"
                  className="input"
                  value={paso1.atencionA}
                  onChange={(e) => setPaso1({ atencionA: e.target.value })}
                  placeholder="Nombre de la persona"
                />
              </Field>
              <Field label="Teléfono" htmlFor="plan-telefono">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                  <input
                    id="plan-telefono"
                    className="input pl-10"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0000-0000"
                    value={paso1.telefono}
                    onChange={(e) => setPaso1({ telefono: formatTelefonoLocal(e.target.value) })}
                  />
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_12rem] lg:grid-cols-[1fr_14rem]">
              <Field
                label="Persona de contacto para la coordinación del muestreo"
                htmlFor="plan-personaContacto"
              >
                <input
                  id="plan-personaContacto"
                  className="input"
                  value={paso1.personaContacto}
                  onChange={(e) => setPaso1({ personaContacto: e.target.value })}
                  placeholder="Nombre de quien coordina el muestreo"
                />
              </Field>
              <Field label="Teléfono" htmlFor="plan-telefonoContacto">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                  <input
                    id="plan-telefonoContacto"
                    className="input pl-10"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="0000-0000"
                    value={paso1.telefonoContacto}
                    onChange={(e) =>
                      setPaso1({ telefonoContacto: formatTelefonoLocal(e.target.value) })
                    }
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            accent="bg-emerald-600"
            title="Sitio y programación"
            subtitle="Lugar a muestrear, fecha y horarios de salida y regreso"
          />
          <div className="space-y-3">
            <Field label="Dirección del sitio(s) a muestrear" htmlFor="plan-direccionSitio">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700/60" />
                <input
                  id="plan-direccionSitio"
                  className="input pl-10"
                  value={paso1.direccionSitio}
                  onChange={(e) => setPaso1({ direccionSitio: e.target.value })}
                  placeholder="Ubicación o sitios donde se tomará la muestra"
                />
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Fecha del muestreo" htmlFor="plan-fechaMuestreo">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                  <input
                    id="plan-fechaMuestreo"
                    type="date"
                    className="input pl-10"
                    value={paso1.fechaMuestreo}
                    onChange={(e) => setPaso1({ fechaMuestreo: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Hora de salida" htmlFor="plan-horaSalida">
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                  <input
                    id="plan-horaSalida"
                    type="time"
                    className="input pl-10"
                    value={paso1.horaSalida}
                    onChange={(e) => setPaso1({ horaSalida: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Hora de regreso" htmlFor="plan-horaRegreso">
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900/50" />
                  <input
                    id="plan-horaRegreso"
                    type="time"
                    className="input pl-10"
                    value={paso1.horaRegreso}
                    onChange={(e) => setPaso1({ horaRegreso: e.target.value })}
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <SectionHeader
            accent="bg-amber-400"
            title="Vinculación en sistema"
            subtitle="Requerido por la API; no aparece en el formato impreso"
          />
          <Field label="Muestra" htmlFor="plan-idMuestra">
            <select
              id="plan-idMuestra"
              className="select"
              value={paso1.idMuestra || ""}
              onChange={(e) => setPaso1({ idMuestra: e.target.value })}
            >
              <option value="">Seleccione una muestra</option>
              {muestras.map((m) => (
                <option key={m.idMuestra} value={m.idMuestra}>
                  {m.identificacion || `Muestra #${m.idMuestra}`}
                </option>
              ))}
            </select>
          </Field>
        </section>
      </div>
    </PlanMuestreoLayout>
  );
}
