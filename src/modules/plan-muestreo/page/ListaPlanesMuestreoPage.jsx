import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisV, FaPlus, FaSearch, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../components/ToastContext.jsx";
import { ROUTES } from "../../../router/routes.js";
import PlanMuestreoDetalleModal from "../components/PlanMuestreoDetalleModal.jsx";
import { clearDraft, saveDraft } from "../service/planMuestreoDraftStorage.js";
import { deletePlanMuestreo, getPlanMuestreoById, getPlanesMuestreo } from "../service/planMuestreoService.js";
import { mapPlanToDraft } from "../utils/mapPlanToDraft.js";

const ACCIONES_MENU_ALTURA_PX = 168;

export default function ListaPlanesMuestreoPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [accionesMenu, setAccionesMenu] = useState(null);

  const loadPlanes = useCallback(async () => {
    try {
      setLoading(true);
      setPlanes(await getPlanesMuestreo());
    } catch (err) {
      addToast(err?.message || "Error al cargar los planes de muestreo", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPlanes();
  }, [loadPlanes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return planes;
    return planes.filter((p) =>
      [p.codReferencia, p.formatosProforma, p.coordinador, p.tiposMuestreo, p.usuario, p.muestra]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, planes]);

  function abrirMenu(e, plan) {
    e.stopPropagation();
    if (accionesMenu?.plan?.idFormatoMuestreo === plan.idFormatoMuestreo) {
      setAccionesMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const placement = espacioAbajo >= ACCIONES_MENU_ALTURA_PX ? "bottom" : "top";
    setAccionesMenu({
      plan,
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
          <h1 className="text-2xl font-semibold text-blue-900">Planes de Muestreo</h1>
          <p className="text-sm text-slate-500">Consulta los planes registrados y crea uno nuevo.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearDraft();
            navigate(ROUTES.planMuestreoPaso(1));
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          <FaPlus className="h-4 w-4" />
          Nuevo plan
        </button>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-900" />
        <input
          type="text"
          placeholder="Buscar plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">Referencia</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Proforma</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Coordinador</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Tipo muestreo</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Muestra</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Usuario</th>
              <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  <FaSpinner className="mx-auto h-6 w-6 animate-spin" />
                  <span className="mt-2 block">Cargando planes...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  {search ? "No se encontraron planes" : "No hay planes de muestreo registrados"}
                </td>
              </tr>
            ) : (
              filtered.map((plan) => (
                <tr key={plan.idFormatoMuestreo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">{plan.codReferencia}</td>
                  <td className="px-4 py-3 sm:px-6">{plan.formatosProforma}</td>
                  <td className="px-4 py-3 sm:px-6">{plan.coordinador}</td>
                  <td className="px-4 py-3 sm:px-6">{plan.tiposMuestreo}</td>
                  <td className="px-4 py-3 sm:px-6">{plan.muestra}</td>
                  <td className="px-4 py-3 sm:px-6">{plan.usuario}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <button
                      type="button"
                      title="Más acciones"
                      onClick={(e) => abrirMenu(e, plan)}
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
                const plan = accionesMenu.plan;
                setAccionesMenu(null);
                setLoadingDetail(true);
                setDetail(plan);
                try {
                  const detalle = await getPlanMuestreoById(plan.idFormatoMuestreo);
                  setDetail(detalle);
                } catch (err) {
                  setDetail(null);
                  addToast(err?.message || "No se pudo cargar el detalle del plan", "error");
                } finally {
                  setLoadingDetail(false);
                }
              }}
            >
              Ver detalle
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              onClick={async () => {
                const plan = accionesMenu.plan;
                setAccionesMenu(null);
                try {
                  const detalle = await getPlanMuestreoById(plan.idFormatoMuestreo);
                  saveDraft(mapPlanToDraft(detalle));
                  navigate(ROUTES.planMuestreoPaso(1));
                } catch (err) {
                  addToast(err?.message || "No se pudo cargar el plan para editar", "error");
                }
              }}
            >
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={() => {
                setConfirmDelete(accionesMenu.plan);
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
        title="Eliminar plan de muestreo"
        message={`¿Eliminar el plan ${confirmDelete?.codReferencia || ""}?`}
        confirmText="Eliminar"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          try {
            setDeleting(true);
            await deletePlanMuestreo(confirmDelete.idFormatoMuestreo);
            addToast("Plan eliminado", "success");
            setConfirmDelete(null);
            await loadPlanes();
          } catch (err) {
            addToast(err?.message || "No se pudo eliminar el plan", "error");
          } finally {
            setDeleting(false);
          }
        }}
      />

      {(detail || loadingDetail) && (
        <PlanMuestreoDetalleModal
          plan={detail}
          loading={loadingDetail && !detail}
          onClose={() => {
            setDetail(null);
            setLoadingDetail(false);
          }}
        />
      )}
    </div>
  );
}
