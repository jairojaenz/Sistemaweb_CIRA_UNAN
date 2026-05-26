import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChevronDown,
  FaClipboardCheck,
  FaClipboardList,
  FaFileInvoiceDollar,
  FaFolder,
  FaFlask,
  FaHome,
  FaSignOutAlt,
  FaTasks,
  FaUniversity,
  FaUserCircle,
  FaUsersCog,
} from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../router/routes";
import ciraLogo from "../assets/CIRA.png";
import unanLogo from "../assets/unan-managua.png";

function navLinkClass({ isActive }) {
  return [
    "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
    isActive
      ? "bg-blue-800 text-white shadow-inner"
      : "text-blue-100 hover:bg-blue-800/70 hover:text-white",
  ].join(" ");
}

function ConfirmDialog({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800">Cerrar Sesión</h3>
        <p className="mt-2 text-sm text-gray-600">
          ¿Está seguro de que desea cerrar la sesión?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const planMuestreoActive = pathname.includes("/plan-muestreo");
  const catalogosActive = pathname.includes("/catalogos");
  const [catalogosOpen, setCatalogosOpen] = useState(catalogosActive);

  const catalogosSubmenu = [
    { label: "Cargos", to: ROUTES.catalogosCargos },
    { label: "Departamentos", to: ROUTES.catalogosDepartamentos },
    { label: "Fuentes", to: ROUTES.catalogosFuentes },
    { label: "Matriz", to: ROUTES.catalogosMatriz },
    { label: "Médios de recepción", to: ROUTES.catalogosMediosRecepcion },
    { label: "Municipios", to: ROUTES.catalogosMunicipios },
    { label: "Preservantes", to: ROUTES.catalogosPreservantes },
    { label: "Servicios", to: ROUTES.catalogosServicios },
    { label: "Tipos de clientes", to: ROUTES.catalogosTiposClientes },
    { label: "Grupos de análisis", to: ROUTES.catalogosGruposAnalisis },
    { label: "Técnicas de análisis", to: ROUTES.catalogosTecnicasAnalisis },
    { label: "Tipos de muestreo", to: ROUTES.catalogosTiposMuestreo },
    { label: "Equipos de muestreo", to: ROUTES.catalogosEquiposMuestreo },
  ];

  function getPageTitle(p) {
    if (p === "/dashboard" || p === "/dashboard/") return "Bienvenido al Sistema de Gestión de Información de Campo de Muestras";
    if (p.includes("/info-campo")) return "Información de Campo de Muestras";
    if (p.includes("/solicitud-servicio")) return "Lista de Solicitud de Servicios";
    if (p.includes("/plan-muestreo")) return "Plan de Muestreo";
    if (p.includes("/gestion-usuarios")) return "Gestión de Usuarios";
    if (p.includes("/gestion-clientes")) return "Gestión de Clientes";
    if (p.includes("/gestion-laboratorios")) return "Gestión de Laboratorios";
    if (p.includes("/formatos-orden-servicio")) return "Órdenes de Servicio";
    if (p.includes("/catalogos/servicios")) return "Catálogo de Servicios";
    if (p.includes("/catalogos/medios-recepcion")) return "Catálogo de Médios de Recepción";
    if (p.includes("/catalogos/matriz")) return "Catálogo de Matriz";
    if (p.includes("/catalogos/preservantes")) return "Catálogo de Preservantes";
    if (p.includes("/dashboard/proformas")) return "Proformas";
    return "INFORMACIÓN DE CAMPO DE MUESTRAS";
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate(ROUTES.login);
  };

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-gray-100">
      <aside
        className={`flex h-full flex-shrink-0 flex-col overflow-hidden border-r border-blue-950/30 bg-blue-900 text-white transition-[width] duration-300 ease-out ${
          sidebarOpen ? "w-64" : "w-[4.5rem]"
        }`}
      >
        <div className="flex min-h-[3.5rem] items-center gap-2 border-b border-blue-800 px-3 py-3">
          <div
            className={`min-w-0 flex-1 overflow-hidden transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100" : "pointer-events-none max-w-0 opacity-0"
            }`}
          >
            <h2 className="truncate text-lg font-bold tracking-tight">CIRA UNAN</h2>
          </div>
          <button
            type="button"
            title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
            onClick={() => setSidebarOpen((v) => !v)}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white hover:bg-blue-800"
          >
            <FaBars />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <NavLink
            to={ROUTES.dashboard}
            end
            title={!sidebarOpen ? "Inicio" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaHome className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Inicio</span>}
          </NavLink>

          <NavLink
            to={ROUTES.infoCampo}
            title={!sidebarOpen ? "Información de Campo" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaFlask className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Información de Campo</span>}
          </NavLink>

          <NavLink
            to={ROUTES.solicitudServicio}
            title={!sidebarOpen ? "Solicitud de Servicios" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaClipboardList className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Solicitud de Servicios</span>}
          </NavLink>

          <Link
            to={ROUTES.planMuestreoPaso(1)}
            title={!sidebarOpen ? "Plan de Muestreo" : undefined}
            className={[
              "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition",
              sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              planMuestreoActive
                ? "bg-blue-800 text-white shadow-inner"
                : "text-blue-100 hover:bg-blue-800/70 hover:text-white",
            ].join(" ")}
          >
            <FaTasks className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Plan de Muestreo</span>}
          </Link>

          <NavLink
            to={ROUTES.formatosOrdenServicio}
            title={!sidebarOpen ? "Órdenes de Servicio" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaClipboardCheck className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Órdenes de Servicio</span>}
          </NavLink>

          <NavLink
            to={ROUTES.proformas}
            title={!sidebarOpen ? "Proformas" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaFileInvoiceDollar className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Proformas</span>}
          </NavLink>

          <div>
            <button
              type="button"
              onClick={() => setCatalogosOpen((v) => !v)}
              title={!sidebarOpen ? "Catálogos" : undefined}
              className={[
                "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
                catalogosActive
                  ? "bg-blue-800 text-white shadow-inner"
                  : "text-blue-100 hover:bg-blue-800/70 hover:text-white",
              ].join(" ")}
            >
              <FaFolder className="h-5 w-5 flex-shrink-0 opacity-90" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 truncate text-left">Catálogos</span>
                  <FaChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${
                      catalogosOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </>
              )}
            </button>
            {sidebarOpen && catalogosOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-blue-700 pl-2">
                {catalogosSubmenu.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "flex w-full items-center rounded-lg py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-blue-800 text-white shadow-inner"
                          : "text-blue-100 hover:bg-blue-800/70 hover:text-white",
                        sidebarOpen ? "px-3" : "justify-center px-0",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink
            to={ROUTES.gestionLaboratorios}
            title={!sidebarOpen ? "Gestión de Laboratorios" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaUniversity className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Gestión de Laboratorios</span>}
          </NavLink>

          {(user?.cargoNombre === "Administrador" || user?.role === "admin") && (
            <NavLink
              to={ROUTES.gestionUsuarios}
              title={!sidebarOpen ? "Gestión de Usuarios" : undefined}
              className={({ isActive }) =>
                [
                  navLinkClass({ isActive }),
                  sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
                ].join(" ")
              }
            >
              <FaUsersCog className="h-5 w-5 flex-shrink-0 opacity-90" />
              {sidebarOpen && <span className="truncate">Gestión de Usuarios</span>}
            </NavLink>
          )}
           {(user?.cargoNombre === "Administrador" || user?.role === "admin") && (
            <NavLink
              to={ROUTES.gestionClientes}
              title={!sidebarOpen ? "Gestión de Clientes" : undefined}
              className={({ isActive }) =>
                [
                  navLinkClass({ isActive }),
                  sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
                ].join(" ")
              }
            >
              <FaUserCircle className="h-5 w-5 shrink-0 opacity-90" />
              {sidebarOpen && <span className="truncate">Gestión de Clientes</span>}
            </NavLink>
          )}
        </nav>

        <div className="border-t border-blue-800 p-2 space-y-1">
          {sidebarOpen && user && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-blue-200 truncate">
              <FaUserCircle className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{user.nombre} {user.apellido}</span>
            </div>
          )}
          <button
            type="button"
            title={!sidebarOpen ? "Cerrar sesión" : undefined}
            onClick={() => setShowLogoutConfirm(true)}
            className={[
              "flex w-full items-center rounded-lg bg-red-500 py-2.5 font-medium text-white transition hover:bg-red-600",
              sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
            ].join(" ")}
          >
            <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">Cerrar Sesión</span>}
          </button>
        </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <header className="flex-shrink-0 border-b border-blue-800 bg-blue-900 px-3 py-3 shadow-sm sm:px-4 md:px-6">
          <div className="mx-auto flex w-full max-w-full items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-shrink-0 items-start gap-2 sm:gap-3">
              <img
                src={unanLogo}
                alt="UNAN Managua"
                className="h-10 w-auto max-w-[26vw] shrink-0 object-contain sm:h-12 sm:max-w-[7.5rem] md:h-14 md:max-w-[9rem]"
              />
              <div className="min-w-0">
                <div className="flex gap-2 sm:gap-2.5">
                  <div
                    className="w-px shrink-0 bg-white self-stretch"
                    aria-hidden
                  />
                  <div className="text-left uppercase leading-[1.12] text-white">
                    <span className="block text-[0.5rem] font-semibold tracking-[0.02em] sm:text-[0.58rem] md:text-[0.65rem]">
                      UNIVERSIDAD
                    </span>
                    <span className="block text-[0.5rem] font-semibold tracking-[0.02em] sm:text-[0.58rem] md:text-[0.65rem]">
                      NACIONAL
                    </span>
                    <span className="block text-[0.5rem] font-semibold tracking-[0.02em] sm:text-[0.58rem] md:text-[0.65rem]">
                      AUTÓNOMA DE
                    </span>
                    <span className="block text-[0.5rem] font-semibold tracking-[0.02em] sm:text-[0.58rem] md:text-[0.65rem]">
                      NICARAGUA,
                    </span>
                    <span className="block text-[0.5rem] font-semibold tracking-[0.02em] sm:text-[0.58rem] md:text-[0.65rem]">
                      MANAGUA
                    </span>
                  </div>
                </div>
                <p className="mt-1 pl-[9px] text-[0.45rem] font-medium uppercase leading-none tracking-wide text-white sm:pl-2.5 sm:text-[0.52rem] md:text-[0.58rem]">
                  UNAN-MANAGUA
                </p>
              </div>
            </div>
            <div className="min-w-0 flex-1 text-center text-white">
              <p className="text-[0.7rem] font-bold leading-tight sm:text-sm md:text-base lg:text-lg">
                {getPageTitle(pathname)}
              </p>
            </div>
            <div className="flex flex-shrink-0 justify-end">
              <img
                src={ciraLogo}
                alt="CIRA"
                className="h-10 w-auto max-w-[32vw] object-contain sm:h-12 sm:max-w-[13rem] md:h-14"
              />
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
