import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaClipboardList,
  FaFlask,
  FaHome,
  FaSignOutAlt,
  FaTasks,
} from "react-icons/fa";
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

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const planMuestreoActive = pathname.includes("/plan-muestreo");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
        </nav>

        <div className="border-t border-blue-800 p-2">
          <button
            type="button"
            title={!sidebarOpen ? "Cerrar sesión" : undefined}
            onClick={handleLogout}
            className={[
              "flex w-full items-center rounded-lg bg-red-500 py-2.5 font-medium text-white transition hover:bg-red-600",
              sidebarOpen ? "gap-3 px-4" : "justify-center px-0",
            ].join(" ")}
          >
            <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">Cerrar Sesión</span>}
          </button>
        </div>
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
                INFORMACIÓN DE CAMPO DE MUESTRAS
              </p>
              <p className="mt-0.5 text-[0.65rem] font-semibold leading-tight text-white/95 sm:text-xs md:text-sm">
                FOR-CIRA-ATACC-27 V5 — UNAN Managua / CIRA
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
