/**
 * Listado de formatos de ensayo.
 * "Editar / resultados" abre el formulario donde se capturan las filas de resultado.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisV, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import { deleteEnsayo, getEnsayoById, getEnsayos } from "../service/ensayoService.js";

const ACCIONES_MENU_ALTURA_PX = 168; // Si no hay espacio abajo, el menú se abre hacia arriba.

export default function ListaEnsayosPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [accionesMenu, setAccionesMenu] = useState(null);

  const loadRegistros = useCallback(async () => {
    try {
      setLoading(true);
      setRegistros(await getEnsayos());
    } catch (err) {
      addToast(err?.message || "Error al cargar los ensayos", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadRegistros();
  }, [loadRegistros]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return registros;
    return registros.filter((r) =>
      [r.nombreLaboratorio, r.numeroOrden, r.usuarioElaboracion, r.planMuestreo, r.clave]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, registros]);

  function abrirMenu(e, registro) {
    e.stopPropagation();
    if (accionesMenu?.registro?.idFormatoEnsayo === registro.idFormatoEnsayo) {
      setAccionesMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const placement = espacioAbajo >= ACCIONES_MENU_ALTURA_PX ? "bottom" : "top";
    setAccionesMenu({
      registro,
      x: rect.right,
      y: placement === "bottom" ? rect.bottom + 4 : rect.top - 4,
      placement,
    });
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

  async function abrirDetalle(registro) {
    try {
      setDetail(await getEnsayoById(registro.idFormatoEnsayo));
    } catch {
      setDetail(registro);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-900">Formatos de Ensayo</h1>
          <p className="text-sm text-slate-500">Consulta los ensayos y captura resultados.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.ensayoNuevo)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo ensayo
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar ensayo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">Orden</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Laboratorio</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Periodo</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Elaboró</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando ensayos...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  {search ? "No se encontraron ensayos" : "No hay ensayos registrados"}
                </td>
              </tr>
            ) : (
              filtered.map((registro) => (
                <tr key={registro.idFormatoEnsayo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                    {registro.numeroOrden ?? `#${registro.idFormatoOrden}`}
                  </td>
                  <td className="px-4 py-3 sm:px-6">{registro.nombreLaboratorio || "—"}</td>
                  <td className="px-4 py-3 sm:px-6">
                    {registro.fechaInicio || "—"} → {registro.fechaFin || "—"}
                  </td>
                  <td className="px-4 py-3 sm:px-6">{registro.usuarioElaboracion || "—"}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <button
                      type="button"
                      title="Más acciones"
                      onClick={(e) => abrirMenu(e, registro)}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                    >
                      <FaEllipsisV className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
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
                accionesMenu.placement === "bottom" ? "translateX(-100%)" : "translate(-100%, -100%)",
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                abrirDetalle(accionesMenu.registro);
                setAccionesMenu(null);
              }}
            >
              Ver detalle
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                navigate(ROUTES.ensayoEditar(accionesMenu.registro.idFormatoEnsayo));
                setAccionesMenu(null);
              }}
            >
              Editar / resultados
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setConfirmDelete(accionesMenu.registro);
                setAccionesMenu(null);
              }}
            >
              Eliminar
            </button>
          </div>,
          document.body,
        )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar ensayo"
        message="¿Eliminar este formato de ensayo y sus resultados?"
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            setDeleting(true);
            await deleteEnsayo(confirmDelete.idFormatoEnsayo);
            addToast("Ensayo eliminado", "success");
            setConfirmDelete(null);
            await loadRegistros();
          } catch (err) {
            addToast(err?.message || "No se pudo eliminar el ensayo", "error");
          } finally {
            setDeleting(false);
          }
        }}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de ensayo</h2>
              <button type="button" onClick={() => setDetail(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <p><span className="font-medium text-gray-600">Orden:</span> {detail.numeroOrden ?? `#${detail.idFormatoOrden}`}</p>
              <p><span className="font-medium text-gray-600">Laboratorio:</span> {detail.nombreLaboratorio || "—"}</p>
              <p><span className="font-medium text-gray-600">Plan:</span> {detail.planMuestreo || "—"}</p>
              <p><span className="font-medium text-gray-600">Resultados:</span> {(detail.resultados ?? []).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
