import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisV, FaPlus, FaSearch, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import CampoDetalleModal from "../components/CampoDetalleModal.jsx";
import { deleteInfoCampo, getFormatoCampoById, getFormatosCampo } from "../service/infoCampoService.js";

const ACCIONES_MENU_ALTURA_PX = 168;

export default function ListaInfoCampoPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [accionesMenu, setAccionesMenu] = useState(null);
  const detalleRequestId = useRef(0);

  const loadRegistros = useCallback(async () => {
    try {
      setLoading(true);
      setRegistros(await getFormatosCampo());
    } catch (err) {
      addToast(err?.message || "Error al cargar la información de campo", "error");
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
      [r.identificacionMuestra, r.numeroProforma, r.comunidad, r.matriz, r.usuario, r.estado]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, registros]);

  function abrirMenu(e, registro) {
    e.stopPropagation();
    if (accionesMenu?.registro?.idFormatoCampo === registro.idFormatoCampo) {
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-900">Información de Campo</h1>
          <p className="text-sm text-slate-500">Consulta los formatos de campo y registra uno nuevo.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.infoCampoNueva)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo formato
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar formato de campo..."
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
              <th className="px-4 py-3 font-semibold sm:px-6">Proforma</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Comunidad</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Matriz</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Usuario</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Estado</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando formatos...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  {search ? "No se encontraron formatos" : "No hay información de campo registrada"}
                </td>
              </tr>
            ) : (
              filtered.map((registro) => (
                <tr key={registro.idFormatoCampo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">{registro.identificacionMuestra}</td>
                  <td className="px-4 py-3 sm:px-6">{registro.numeroProforma}</td>
                  <td className="px-4 py-3 sm:px-6">{registro.comunidad || "—"}</td>
                  <td className="px-4 py-3 sm:px-6">{registro.matriz}</td>
                  <td className="px-4 py-3 sm:px-6">{registro.usuario}</td>
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
              onClick={async () => {
                const registro = accionesMenu.registro;
                const req = ++detalleRequestId.current;
                setAccionesMenu(null);
                setDetail(null);
                setDetailLoading(true);
                try {
                  const data = await getFormatoCampoById(registro.idFormatoCampo);
                  if (req !== detalleRequestId.current) return;
                  setDetail(data);
                } catch {
                  if (req !== detalleRequestId.current) return;
                  setDetail(registro);
                } finally {
                  if (req === detalleRequestId.current) setDetailLoading(false);
                }
              }}
            >
              Ver detalle
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                navigate(ROUTES.infoCampoEditar(accionesMenu.registro.idFormatoCampo));
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
        title="Eliminar formato de campo"
        message={`¿Eliminar el formato de ${confirmDelete?.identificacionMuestra || "campo"}?`}
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            setDeleting(true);
            await deleteInfoCampo(confirmDelete.idFormatoCampo);
            addToast("Formato de campo eliminado", "success");
            setConfirmDelete(null);
            await loadRegistros();
          } catch (err) {
            addToast(err?.message || "No se pudo eliminar el formato", "error");
          } finally {
            setDeleting(false);
          }
        }}
      />

      {(detailLoading || detail) && (
        <CampoDetalleModal
          detail={detail}
          loading={detailLoading && !detail}
          onClose={() => {
            detalleRequestId.current += 1;
            setDetail(null);
            setDetailLoading(false);
          }}
          onEdit={() => {
            if (!detail?.idFormatoCampo) return;
            detalleRequestId.current += 1;
            navigate(ROUTES.infoCampoEditar(detail.idFormatoCampo));
            setDetail(null);
            setDetailLoading(false);
          }}
        />
      )}
    </div>
  );
}
