/**
 * Listado de cadenas de custodia.
 * Tabla + menú de acciones (ver / editar / eliminar) igual que Info Campo y Planes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisV, FaPlus, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import { deleteCustodia, getCustodiaById, getCustodias } from "../service/custodiaService.js";

const ACCIONES_MENU_ALTURA_PX = 168; // Si no hay espacio abajo, el menú se abre hacia arriba.

export default function ListaCustodiaPage() {
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
      setRegistros(await getCustodias());
    } catch (err) {
      addToast(err?.message || "Error al cargar las custodias", "error");
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
      [r.identificacionMuestra, r.usuario, r.estado, r.usuarioCreacion]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, registros]);

  function abrirMenu(e, registro) {
    e.stopPropagation();
    if (accionesMenu?.registro?.idFormatoCustodia === registro.idFormatoCustodia) {
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
      setDetail(await getCustodiaById(registro.idFormatoCustodia));
    } catch {
      setDetail(registro);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-900">Cadena de Custodia</h1>
          <p className="text-sm text-slate-500">Consulta las custodias y registra una nueva.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.custodiaNueva)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nueva custodia
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar custodia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">Muestra</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Campo</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Usuario</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando custodias...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  {search ? "No se encontraron custodias" : "No hay custodias registradas"}
                </td>
              </tr>
            ) : (
              filtered.map((registro) => (
                <tr key={registro.idFormatoCustodia} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                    {registro.identificacionMuestra || "—"}
                  </td>
                  <td className="px-4 py-3 sm:px-6">#{registro.idFormatoCampo}</td>
                  <td className="px-4 py-3 sm:px-6">{registro.usuario || "—"}</td>
                  <td className="px-4 py-3 sm:px-6">{registro.estado}</td>
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
                navigate(ROUTES.custodiaEditar(accionesMenu.registro.idFormatoCustodia));
                setAccionesMenu(null);
              }}
            >
              Editar
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
        title="Eliminar custodia"
        message={`¿Eliminar la custodia de ${confirmDelete?.identificacionMuestra || "muestra"}?`}
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            setDeleting(true);
            await deleteCustodia(confirmDelete.idFormatoCustodia);
            addToast("Custodia eliminada", "success");
            setConfirmDelete(null);
            await loadRegistros();
          } catch (err) {
            addToast(err?.message || "No se pudo eliminar la custodia", "error");
          } finally {
            setDeleting(false);
          }
        }}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalle de custodia</h2>
              <button type="button" onClick={() => setDetail(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <p><span className="font-medium text-gray-600">Muestra:</span> {detail.identificacionMuestra || "—"}</p>
              <p><span className="font-medium text-gray-600">Campo:</span> #{detail.idFormatoCampo}</p>
              <p><span className="font-medium text-gray-600">Usuario:</span> {detail.usuario || "—"}</p>
              <p><span className="font-medium text-gray-600">Estado:</span> {detail.estado}</p>
              <p><span className="font-medium text-gray-600">Muestras en cadena:</span> {(detail.detalles ?? []).length}</p>
              <p><span className="font-medium text-gray-600">Entregas:</span> {(detail.entregas ?? []).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
