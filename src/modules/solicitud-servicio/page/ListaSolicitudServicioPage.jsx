import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaEdit,
  FaEye,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

import { useToast } from "../../../components/ToastContext.jsx";

import {
  getSolicitudes,
} from "../service/solicitudServicioService.js";

export default function ListaSolicitudServicioPage() {
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

  function openDetailModal(solicitud) {
    setDetailSolicitud(solicitud);
  }

  function closeDetailModal() {
    setDetailSolicitud(null);
  }


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
                  colSpan={7}
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
                  colSpan={7}
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
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-700 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                        </label>

                        <button
                          type="button"
                          title="Editar"
                          className="rounded p-1.5 text-blue-900 hover:bg-blue-100"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={() =>
                            openDetailModal(
                              solicitud
                            )
                          }
                          className="rounded p-1.5 text-blue-900 hover:bg-slate-100"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      

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
                  {detailSolicitud.detallesSolicitud?.map(
                    (
                      detalle,
                      index
                    ) => (
                      <div
                        key={`${detalle.analisis}-${index}`}
                        className="rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {
                            detalle.analisis
                          }
                        </p>

                        <p className="text-sm text-gray-600">
                          {
                            detalle.grupoAnalisis
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