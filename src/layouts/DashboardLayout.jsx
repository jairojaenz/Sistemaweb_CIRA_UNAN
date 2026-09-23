import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChevronDown,
  FaClipboardCheck,
  FaClipboardList,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaFolder,
  FaFlask,
  FaGlobeAmericas,
  FaHome,
  FaMicroscope,
  FaSignOutAlt,
  FaTasks,
  FaUniversity,
  FaUserCircle,
  FaUsersCog,
} from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";
import { isAdministrador } from "../modules/auth/model/constants.js";
import { ROUTES } from "../router/routes";
import ThemeToggle from "../components/ThemeToggle.jsx";
import ciraLogo from "../assets/CIRA.png";
import unanLogo from "../assets/unan-managua.png";

function navLinkClass({ isActive }) {
  return [
    "flex w-full items-center rounded-xl border-l-4 py-2.5 text-sm font-medium transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
    isActive
      ? "border-yellow-400 bg-blue-800 text-white shadow-inner"
      : "border-transparent text-blue-100 hover:border-yellow-400/50 hover:bg-blue-800/70 hover:text-white",
  ].join(" ");
}

function ConfirmDialog({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/60 backdrop-blur-sm">
      <div className="w-80 overflow-hidden rounded-2xl border border-blue-800/50 bg-white shadow-2xl shadow-black/40 dark:border-blue-800/60 dark:bg-[#12123a]">
        <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-red-500" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-4 ring-red-500/5 dark:bg-red-500/15 dark:text-red-400">
              <FaSignOutAlt className="h-5 w-5" />
            </span>
            <div className="min-w-0 pt-1">
              <h3 className="text-base font-semibold text-gray-800 dark:text-slate-100">
                Cerrar Sesión
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                ¿Está seguro de que desea salir del sistema? Tendrá que iniciar sesión de nuevo para continuar.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-700/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-red-500/30 transition-colors hover:bg-red-600"
            >
              Sí, cerrar sesión
            </button>
          </div>
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
  const esGeolocalizacion = pathname.includes("/geolocalizacion");
  const [catalogosOpen, setCatalogosOpen] = useState(catalogosActive);

  const catalogosSubmenu = [
    { label: "Cargos", to: ROUTES.catalogosCargos },
    { label: "Departamentos", to: ROUTES.catalogosDepartamentos },
    { label: "Fuentes", to: ROUTES.catalogosFuentes },
    { label: "Matriz", to: ROUTES.catalogosMatriz },
    { label: "Muestras", to: ROUTES.catalogosMuestras },
    { label: "Médios de recepción", to: ROUTES.catalogosMediosRecepcion },
    { label: "Municipios", to: ROUTES.catalogosMunicipios },
    { label: "Preservantes", to: ROUTES.catalogosPreservantes },
    { label: "Servicios", to: ROUTES.catalogosServicios },
    { label: "Tipos de clientes", to: ROUTES.catalogosTiposClientes },
    { label: "Grupos de análisis", to: ROUTES.catalogosGruposAnalisis },
    { label: "Técnicas de análisis", to: ROUTES.catalogosTecnicasAnalisis },
    { label: "Tipos de muestreo", to: ROUTES.catalogosTiposMuestreo },
    { label: "Equipos de muestreo", to: ROUTES.catalogosEquiposMuestreo },
    { label: "Análisis", to: ROUTES.catalogosAnalisis },
  ];

  function getPageTitle(p) {
    if (p === "/dashboard" || p === "/dashboard/") return "Bienvenido al Sistema de Gestión de Información de Campo de Muestras (SGIMA)";
    if (p.includes("/geolocalizacion")) return "Geolocalización";
    if (p.includes("/info-campo/editar/")) return "Editar Información de Campo";
    if (p.includes("/info-campo/nueva")) return "Nueva Información de Campo";
    if (p.includes("/info-campo")) return "Lista de Información de Campo";
    if (p.includes("/solicitud-servicio/editar/")) return "Editar Solicitud de Servicio";
    if (/\/dashboard\/solicitud-servicio\/\d+/.test(p)) return "Crear Solicitud de Servicio";
    if (p.includes("/solicitud-servicio")) return "Lista de Solicitud de Servicios";
    if (p.includes("/plan-muestreo/paso-")) return "Plan de Muestreo";
    if (p.includes("/plan-muestreo")) return "Lista de Planes de Muestreo";
    if (p.includes("/gestion-usuarios")) return "Gestión de Usuarios";
    if (p.includes("/gestion-clientes")) return "Gestión de Clientes";
    if (p.includes("/gestion-laboratorios")) return "Gestión de Laboratorios";
    if (p.includes("/custodia/editar/")) return "Editar Cadena de Custodia";
    if (p.includes("/custodia/nueva")) return "Nueva Cadena de Custodia";
    if (p.includes("/custodia")) return "Lista de Cadenas de Custodia";
    if (p.includes("/ensayos/editar/")) return "Editar Formato de Ensayo";
    if (p.includes("/ensayos/nuevo")) return "Nuevo Formato de Ensayo";
    if (p.includes("/ensayos")) return "Lista de Formatos de Ensayo";
    if (p.includes("/formatos-orden-servicio/nueva")) return "Nueva Orden de Servicio";
    if (p.includes("/formatos-orden-servicio") && p.includes("/editar")) return "Editar Orden de Servicio";
    if (p.includes("/formatos-orden-servicio")) return "Órdenes de Servicio";
    if (p.includes("/catalogos/servicios")) return "Catálogo de Servicios";
    if (p.includes("/catalogos/medios-recepcion")) return "Catálogo de Médios de Recepción";
    if (p.includes("/catalogos/matriz")) return "Catálogo de Matriz";
    if (p.includes("/catalogos/muestras")) return "Catálogo de Muestras";
    if (p.includes("/catalogos/preservantes")) return "Catálogo de Preservantes";
    if (p.includes("/dashboard/proformas")) return "Proformas";
    if (p.includes("/catalogos/cargos")) return "Catálogo de Cargos";
    if (p.includes("/catalogos/departamentos")) return "Catálogo de Departamentos";
    if (p.includes("/catalogos/fuentes")) return "Catálogo de Fuentes";
    if (p.includes("/catalogos/municipios")) return "Catálogo de Municipios";
    if (p.includes("/catalogos/tipos-clientes")) return "Catálogo de Tipos de Clientes";
    if (p.includes("/catalogos/grupos-analisis")) return "Catálogo de Grupos de Análisis";
    if (p.includes("/catalogos/tecnicas-analisis")) return "Catálogo de Técnicas de Análisis";
    if (p.includes("/catalogos/tipos-muestreo")) return "Catálogo de Tipos de Muestreo";
    if (p.includes("/catalogos/equipos-muestreo")) return "Catálogo de Equipos de Muestreo";
    if (p.includes("/catalogos/analisis")) return "Catálogo de Análisis";
    return "INFORMACIÓN DE CAMPO DE MUESTRAS";
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate(ROUTES.login);
  };

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-gray-100 dark:bg-[#0d053c]">
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
            <h2 className="truncate text-lg font-bold tracking-tight">UNAN Managua/CIRA</h2>
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
            to={ROUTES.geolocalizacion}
            title={!sidebarOpen ? "Geolocalización" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaGlobeAmericas className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Geolocalización</span>}
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
            {sidebarOpen && <span className="truncate">Solicitudes de Servicios</span>}
          </NavLink>

          <Link
            to={ROUTES.planMuestreo}
            title={!sidebarOpen ? "Plan de Muestreo" : undefined}
            className={[
              "flex w-full items-center rounded-xl border-l-4 py-2.5 text-sm font-medium transition-colors duration-200",
              sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              planMuestreoActive
                ? "border-yellow-400 bg-blue-800 text-white shadow-inner"
                : "border-transparent text-blue-100 hover:border-yellow-400/50 hover:bg-blue-800/70 hover:text-white",
            ].join(" ")}
          >
            <FaTasks className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Plan de Muestreo</span>}
          </Link>

          {/* Cadena de custodia: nace del formato de campo. */}
          <NavLink
            to={ROUTES.custodia}
            title={!sidebarOpen ? "Cadena de Custodia" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaExchangeAlt className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Cadena de Custodia</span>}
          </NavLink>

          {/* Ensayos: captura de resultados ligados a una orden. */}
          <NavLink
            to={ROUTES.ensayos}
            title={!sidebarOpen ? "Ensayos" : undefined}
            className={({ isActive }) =>
              [
                navLinkClass({ isActive }),
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
              ].join(" ")
            }
          >
            <FaMicroscope className="h-5 w-5 flex-shrink-0 opacity-90" />
            {sidebarOpen && <span className="truncate">Ensayos</span>}
          </NavLink>

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
                "flex w-full items-center rounded-xl border-l-4 py-2.5 text-sm font-medium transition-colors duration-200",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
                catalogosActive
                  ? "border-yellow-400 bg-blue-800 text-white shadow-inner"
                  : "border-transparent text-blue-100 hover:border-yellow-400/50 hover:bg-blue-800/70 hover:text-white",
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
                        "flex w-full items-center rounded-xl border-l-4 py-2 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "border-yellow-400 bg-blue-800 text-white shadow-inner"
                          : "border-transparent text-blue-100 hover:border-yellow-400/50 hover:bg-blue-800/70 hover:text-white",
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

          {/* Menú admin: mismo criterio que ProtectedRoute / claim role del JWT */}
          {isAdministrador(user) && (
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
           {isAdministrador(user) && (
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

        <div className="border-t border-blue-800/60 p-3 space-y-2">

<div className="border-t border-blue-800/70 bg-blue-950/20 p-3">
  {/* Información del usuario */}
  {sidebarOpen && user && (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-yellow-400/30 bg-blue-800/40 p-3 shadow-sm backdrop-blur-sm">

      {/* Avatar */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 shadow-md ring-2 ring-yellow-400/30">
        <FaUserCircle className="h-6 w-6 text-blue-900" />
      </div>

      {/* Información */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {user.nombre} {user.apellido}
        </p>

        <p className="mt-0.5 truncate text-xs text-blue-300">
          {user.cargoNombre}
        </p>
      </div>
    </div>
  )}

  {/* Botón cerrar sesión */}
  <button
    type="button"
    title={!sidebarOpen ? "Cerrar sesión" : undefined}
    onClick={() => setShowLogoutConfirm(true)}
    className={[
      "group flex w-full items-center rounded-xl border border-yellow-400/30 bg-blue-800/40 shadow-sm backdrop-blur-sm",
      "py-2.5 font-semibold text-white",
      "transition-all duration-200",
      "hover:border-yellow-400/60 hover:bg-blue-800/70 hover:shadow-md hover:-translate-y-[1px]",
      "active:translate-y-0 active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/60",
      sidebarOpen ? "justify-start gap-3 px-3" : "h-[3.25rem] w-[3.25rem] justify-center p-0",
    ].join(" ")}
  >
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 text-blue-900 shadow-md ring-2 ring-yellow-400/30 transition-transform duration-200 group-hover:scale-105">
      <FaSignOutAlt className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </span>

    {sidebarOpen && (
      <span className="truncate text-sm">
        Cerrar Sesión
      </span>
    )}
  </button>
</div>


</div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gray-100 dark:bg-[#0d053c]">
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
            <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:gap-3">
              {/* Interruptor claro/oscuro: a la izquierda del logo CIRA. */}
              <ThemeToggle />
              <img
                src={ciraLogo}
                alt="CIRA"
                className="h-10 w-auto max-w-[32vw] object-contain sm:h-12 sm:max-w-[13rem] md:h-14"
              />
            </div>
          </div>
        </header>

        {/* El tema solo pinta el contenido: claro = gray-100; oscuro = #0d053c. Sidebar y topbar no cambian. */}
        <main
          className={
            esGeolocalizacion
              ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-black"
              : "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-gray-100 dark:bg-[#0d053c]"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
