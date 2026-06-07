import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  FaEllipsisV,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";

import {
  getSolicitudes,
} from "../service/solicitudServicioService.js";

const ACCIONES_MENU_ALTURA_PX = 132;

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

  function openDetailModal(solicitud) {
    setDetailSolicitud(solicitud);
  }

  function closeDetailModal() {
    setDetailSolicitud(null);
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
      <div>
        <h1 className="text-2xl font-semibold text-blue-900">
          Lista de Solicitudes de Servicio
        </h1>

        <p className="text-sm text-slate-500">
          Consulta y administra las
          solicitudes registradas.
        </p>
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

      <div className="overflow-x-auto rounded-lg border border-gray-200">
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
            className="fixed z-[100] min-w-[10.5rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
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
                cerrarMenuAcciones();
              }}
            >
              Editar
            </button>
          </div>,
          document.body
        )}

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
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow
                  label="Solicitud"
                  value={
                    detailSolicitud.numeroSolicitud
                  }
                />

                <DetailRow
                  label="Cliente"
                  value={
                    detailSolicitud.cliente
                  }
                />

                <DetailRow
                  label="Usuario"
                  value={
                    detailSolicitud.usuario
                  }
                />

                <DetailRow
                  label="Estado"
                  value={
                    detailSolicitud.estado
                  }
                />

                <DetailRow
                  label="Fecha recepción"
                  value={
                    detailSolicitud.fechaRecepcionSolicitud
                  }
                />

                <DetailRow
                  label="Contacto"
                  value={
                    detailSolicitud.num1ContactoSolicitud
                  }
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Detalles de análisis
                </h3>

                <div className="space-y-3">
                  {detailSolicitud.detalles?.map(
                    (
                      detalles,
                      index
                    ) => (
                      <div
                        key={`${detalles.nombreAnalisis}-${index}`}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {
                            detalles.nombreAnalisis
                          }
                        </p>

                        <p className="text-sm text-gray-600">
                          {
                            detalles.abreviacionAnalisis
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {
                            detalles.precioAnalisis
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-600">
                  Observación
                </p>

                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {detailSolicitud.observacionSolicitud ||
                    "—"}
                </div>
              </div>

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