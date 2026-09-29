import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  FaEllipsisV,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";

import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import {
  deleteSolicitudServicio,
  getSolicitudById,
  getSolicitudes,
} from "../service/solicitudServicioService.js";
import { getClienteById } from "../../clientes/service/clienteService.js";
import { getMediosRecepcion } from "../../catalogos/service/medioRecepcionService.js";
import { getServicios } from "../../catalogos/service/servicioService.js";
import { getMatrices } from "../../catalogos/service/matrizService.js";
import { getAnalisis } from "../../catalogos/service/analisisService.js";
import { getUsuarios } from "../../usuarios/service/usuarioService.js";

const ACCIONES_MENU_ALTURA_PX = 220;

export default function ListaSolicitudServicioPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [solicitudes, setSolicitudes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [detailSolicitud, setDetailSolicitud] =
    useState(null);
  const [detailCliente, setDetailCliente] = useState(null);
  const [detailCatalogos, setDetailCatalogos] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  const loadSolicitudes = useCallback(
    async () => {
      try {
        setLoading(true);

        const data =
          await getSolicitudes();

        setSolicitudes(data);
      } catch (err) {
        addToast(
          err?.message ||
            "Error al cargar las solicitudes",
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadSolicitudes();
  }, [loadSolicitudes]);

  const filteredSolicitudes = useMemo(() => {
    const query =
      search.toLowerCase().trim();

    if (!query) return solicitudes;

    return solicitudes.filter((item) => {
      return [
        item.numeroSolicitud,
        item.cliente,
        item.usuario,
        item.estado,
        item.servicio,
        item.matriz,
      ]
        .filter(Boolean)
        .some((value) =>
          value
            .toLowerCase()
            .includes(query)
        );
    });
  }, [search, solicitudes]);

  const [accionesMenu, setAccionesMenu] = useState(null);

  async function openDetailModal(solicitud) {
    setDetailSolicitud(solicitud);
    setDetailCliente(null);
    setDetailCatalogos({});
    setDetailLoading(true);
    try {
      const results = await Promise.allSettled([
          getSolicitudById(solicitud.idFormatoSolicitud),
          solicitud.idCliente ? getClienteById(solicitud.idCliente) : Promise.resolve(null),
          getMediosRecepcion(),
          getServicios(),
          getMatrices(),
          getAnalisis(),
          getUsuarios(),
        ]);
      const [fullResult, clienteResult, mediosResult, serviciosResult, matricesResult, analisisResult, usuariosResult] = results;
      if (fullResult.status === "rejected") throw fullResult.reason;
      setDetailSolicitud(fullResult.value ?? solicitud);
      setDetailCliente(clienteResult.status === "fulfilled" ? clienteResult.value : null);
      setDetailCatalogos({
        medios: mediosResult.status === "fulfilled" ? mediosResult.value : [],
        servicios: serviciosResult.status === "fulfilled" ? serviciosResult.value : [],
        matrices: matricesResult.status === "fulfilled" ? matricesResult.value : [],
        analisis: analisisResult.status === "fulfilled" ? analisisResult.value : [],
        usuarios: usuariosResult.status === "fulfilled" ? usuariosResult.value : [],
      });
    } catch (err) {
      try {
        const full = await getSolicitudById(solicitud.idFormatoSolicitud);
        setDetailSolicitud(full ?? solicitud);
      } catch {
        addToast(err?.message || "No se pudo cargar el detalle completo de la solicitud.", "error");
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetailModal() {
    setDetailSolicitud(null);
    setDetailCliente(null);
    setDetailCatalogos({});
    setDetailLoading(false);
  }

  function abrirMenuAcciones(e, solicitud) {
    e.stopPropagation();
    if (accionesMenu?.solicitud?.idFormatoSolicitud === solicitud.idFormatoSolicitud) {
      setAccionesMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const placement = espacioAbajo >= ACCIONES_MENU_ALTURA_PX ? "bottom" : "top";
    setAccionesMenu({
      solicitud,
      x: rect.right,
      y: placement === "bottom" ? rect.bottom + 4 : rect.top - 4,
      placement,
    });
  }

  function cerrarMenuAcciones() {
    setAccionesMenu(null);
  }

  useEffect(() => {
    if (!accionesMenu) return;
    const cerrar = () => setAccionesMenu(null);
    document.addEventListener("click", cerrar);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("click", cerrar);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [accionesMenu]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-900">
            Lista de Solicitudes de Servicio
          </h1>

          <p className="text-sm text-slate-500">
            Consulta y administra las
            solicitudes registradas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.gestionClientes)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />

        <input
          type="text"
          placeholder="Buscar solicitud..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="input w-full pl-10"
        />
      </div>

      <div className="theme-table overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Solicitud
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Cliente
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Usuario
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Fecha
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Estado
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Matriz
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Servicios
              </th>

              <th className="px-4 py-3 font-semibold sm:px-6">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    <FaSpinner className="mx-auto h-6 w-6 animate-spin" />

                    <span className="mt-2 block">
                      Cargando solicitudes...
                    </span>
                  </td>
                </tr>
              ) : filteredSolicitudes.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  {search
                    ? "No se encontraron solicitudes"
                    : "No hay solicitudes registradas"}
                </td>
              </tr>
            ) : (
              filteredSolicitudes.map(
                (solicitud) => (
                  <tr
                    key={
                      solicitud.idFormatoSolicitud
                    }
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {
                        solicitud.numeroSolicitud
                      }
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      {solicitud.cliente}
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      {solicitud.usuario}
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      {
                        solicitud.fechaRecepcionSolicitud
                      }
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          solicitud.estado === "Pendiente"  
                            ? "bg-yellow-100 text-yellow-800"
                            : solicitud.estado === "Completada"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {solicitud.estado}
                      </span>
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      {
                        solicitud.matriz
                      }
                    </td>
                    
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        {solicitud.servicios?.map(
                          (item) => (
                            <span
                              key={item}
                              className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 sm:px-6">
                      <button
                        type="button"
                        title="Más acciones"
                        aria-expanded={accionesMenu?.solicitud?.idFormatoSolicitud === solicitud.idFormatoSolicitud}
                        aria-haspopup="menu"
                        onClick={(e) => abrirMenuAcciones(e, solicitud)}
                        className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                      >
                        <FaEllipsisV className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {accionesMenu &&
        createPortal(
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className="theme-menu fixed z-[100] min-w-[10.5rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            style={{
              left: accionesMenu.x,
              top: accionesMenu.y,
              transform:
                accionesMenu.placement === "bottom"
                  ? "translateX(-100%)"
                  : "translate(-100%, -100%)",
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                openDetailModal(accionesMenu.solicitud);
                cerrarMenuAcciones();
              }}
            >
              Ver detalle
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                const id = accionesMenu.solicitud.idFormatoSolicitud;
                cerrarMenuAcciones();
                navigate(ROUTES.nuevaProformaFromSolicitud(id));
              }}
            >
              Crear Proforma
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                const id = accionesMenu.solicitud.idFormatoSolicitud;
                cerrarMenuAcciones();
                navigate(ROUTES.formatosOrdenServicioNuevaFromSolicitud(id));
              }}
            >
              Crear Orden de servicio
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                const id = accionesMenu.solicitud.idFormatoSolicitud;
                cerrarMenuAcciones();
                navigate(ROUTES.solicitudServicioEditar(id));
              }}
            >
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setConfirmDelete(accionesMenu.solicitud);
                cerrarMenuAcciones();
              }}
            >
              Eliminar
            </button>
          </div>,
          document.body
        )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar solicitud"
        message={`¿Eliminar la solicitud ${confirmDelete?.numeroSolicitud || ""}? Quedará inactiva (eliminación lógica) y no se listará.`}
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete?.idFormatoSolicitud) return;
          try {
            setDeleting(true);
            await deleteSolicitudServicio(confirmDelete.idFormatoSolicitud);
            addToast("Solicitud eliminada", "success");
            setConfirmDelete(null);
            await loadSolicitudes();
          } catch (err) {
            addToast(err?.message || "No se pudo eliminar la solicitud", "error");
          } finally {
            setDeleting(false);
          }
        }}
      />

      {detailSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Detalle de la solicitud
              </h2>

              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {detailLoading && <p className="text-sm text-slate-500">Cargando detalle completo...</p>}

              <DetailSection title="Datos principales">
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <DetailRow label="Solicitud No." value={detailSolicitud.numeroSolicitud} />
                  <DetailRow label="Estado" value={detailSolicitud.estado} />
                  <DetailRow label="Cliente" value={detailSolicitud.cliente || detailCliente?.nombreCliente} />
                  <DetailRow label="Usuario" value={detailSolicitud.usuario} />
                  <DetailRow label="Fecha de recepción" value={detailSolicitud.fechaRecepcionSolicitud} />
                  <DetailRow label="Medio de recepción" value={catalogLabel(detailSolicitud.idMedioRecepcion, detailCatalogos.medios, "idMedioRecepcion", "nombreMedioRecepcion")} />
                  <DetailRow label="Correo" value={detailSolicitud.correoCliente || detailCliente?.correoCliente} />
                  <DetailRow label="Dirección del solicitante" value={detailSolicitud.direccionCliente || detailCliente?.direccionCliente} />
                  <DetailRow label="RUC" value={detailSolicitud.numeroRuc || detailCliente?.numeroRuc} />
                  <DetailRow label="Cédula" value={detailSolicitud.cedulaCliente || detailCliente?.cedulaCliente} />
                  <DetailRow label="Contacto principal" value={detailSolicitud.nombreContactoSolicitud || detailCliente?.nombreContacto} />
                  <DetailRow label="Teléfono principal" value={detailSolicitud.num1ContactoSolicitud || detailCliente?.celularCliente || detailCliente?.telefonoCliente} />
                  <DetailRow label="Contacto secundario" value={detailSolicitud.nombreContacto2Solicitud} />
                  <DetailRow label="Teléfono secundario" value={detailSolicitud.num2ContactoSolicitud} />
                </div>
              </DetailSection>

              <DetailSection title="Servicios">
                <p className="text-sm text-slate-700">
                  {detailSolicitud.idServicios?.length
                    ? detailSolicitud.idServicios.map((id) => catalogLabel(id, detailCatalogos.servicios, "idServicio", "nombreServicio")).join(", ")
                    : detailSolicitud.servicios?.map((item) => typeof item === "string" ? item : item.nombreServicio ?? item.nombre ?? "").filter(Boolean).join(", ") || detailSolicitud.servicio || "Sin servicios registrados."}
                </p>
              </DetailSection>

              <DetailSection title="Matrices y muestras">
                {detailSolicitud.matrices?.length ? (
                  <div className="theme-table overflow-x-auto rounded border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                        <tr><th className="px-3 py-2">Matriz</th><th className="px-3 py-2 text-right">Cantidad de muestras</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {detailSolicitud.matrices.map((m, index) => (
                          <tr key={`${m.idMatriz ?? m.nombreMatriz}-${index}`}>
                            <td className="px-3 py-2">{m.nombreMatriz || catalogLabel(m.idMatriz, detailCatalogos.matrices, "idMatriz", "nombreMatriz")}</td>
                            <td className="px-3 py-2 text-right">{m.numMuestras}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold">
                        <tr><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right">{detailSolicitud.numMuestras || detailSolicitud.matrices.reduce((sum, m) => sum + (Number(m.numMuestras) || 0), 0)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <DetailRow label="Matriz" value={detailSolicitud.matriz} />
                )}
                {!detailSolicitud.matrices?.length && <DetailRow label="Total de muestras" value={detailSolicitud.numMuestras} />}
              </DetailSection>

              <DetailSection title="Análisis solicitados">
                {detailSolicitud.detalles?.length > 0 ? (
                  <div className="theme-table overflow-x-auto rounded border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                        <tr><th className="px-3 py-2">Análisis</th><th className="px-3 py-2">Técnica / Abreviatura</th><th className="px-3 py-2 text-center">Cantidad</th><th className="px-3 py-2">Laboratorio</th><th className="px-3 py-2 text-right">Precio</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {detailSolicitud.detalles.map((d, index) => (
                          <tr key={`${d.idAnalisis ?? d.nombreAnalisis}-${index}`}>
                            <td className="px-3 py-2 font-medium">{d.nombreAnalisis || catalogLabel(d.idAnalisis, detailCatalogos.analisis, "idAnalisis", "nombreAnalisis") || "—"}</td>
                            <td className="px-3 py-2 text-gray-600">{d.nombreTecnicaTexto || d.abreviacionAnalisis || "—"}</td>
                            <td className="px-3 py-2 text-center">{d.cantidad ?? 1}</td>
                            <td className="px-3 py-2 text-gray-600">{d.nombreLaboratorio || "—"}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{d.precioAnalisis != null ? `C$${Number(d.precioAnalisis).toLocaleString("es-NI", { minimumFractionDigits: 2 })}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-gray-500">Sin análisis registrados.</p>}
              </DetailSection>

              <DetailSection title="Muestreo y observaciones">
                <DetailRow label="Ubicación de muestreo" value={detailSolicitud.direccionMuestreo} />
                <DetailRow label="Observaciones" value={detailSolicitud.observacionSolicitud} />
              </DetailSection>

              <DetailSection title="Verificación">
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <DetailRow label="Firma del usuario" value={catalogLabel(detailSolicitud.firmaSolicitud, detailCatalogos.usuarios, "idUsuario", "nombreUsuario")} />
                  <DetailRow label="Solicitud recibida por" value={catalogLabel(detailSolicitud.recibidoPorSolicitud, detailCatalogos.usuarios, "idUsuario", "nombreUsuario")} />
                  <DetailRow label="Fecha de envío de proforma" value={detailSolicitud.fechaEnvioProforma} />
                  <DetailRow label="ID de usuario responsable" value={detailSolicitud.idUsuario} />
                </div>
              </DetailSection>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-2 sm:grid-cols-3">
      <dt className="text-sm font-medium text-gray-600">
        {label}
      </dt>

      <dd className="text-sm text-gray-900 sm:col-span-2">
        {value || "—"}
      </dd>
    </div>
  );
}

function catalogLabel(value, items = [], idKey, nameKey) {
  if (value == null || value === "") return "—";
  const id = typeof value === "object"
    ? value[idKey] ?? value[idKey.charAt(0).toUpperCase() + idKey.slice(1)] ?? value.id ?? value.Id
    : value;
  const item = items.find((entry) => String(entry[idKey] ?? entry[idKey.charAt(0).toUpperCase() + idKey.slice(1)] ?? entry.id ?? entry.Id) === String(id));
  if (!item) return typeof value === "object" ? value[nameKey] ?? value.nombre ?? value.Nombre ?? String(id) : String(value);
  const name = item[nameKey] ?? item[nameKey.charAt(0).toUpperCase() + nameKey.slice(1)] ?? item.nombre ?? item.Nombre ?? "";
  if (nameKey === "nombreUsuario") {
    return `${name} ${item.apellidoUsuario ?? item.ApellidoUsuario ?? ""}`.trim() || item.correoUsuario || String(id);
  }
  return name || String(id);
}

function DetailSection({ title, children }) {
  return (
    <section className="border-b border-gray-200 pb-5 last:border-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </section>
  );
}