import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaClipboardList,
  FaFlask,
  FaHome,
  FaSignOutAlt,
  FaTasks,
  FaUserCircle,
} from "react-icons/fa";
import { ROUTES } from "../router/routes";

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
  const [menuOpen, setMenuOpen] = useState(false);

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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <h1 className="truncate text-lg font-semibold text-blue-900 md:text-xl">
            Panel de Control — CIRA UNAN Managua
          </h1>
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700"
            >
              <FaUserCircle size={24} />
              <span className="hidden font-semibold md:inline">Usuario</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <ul className="py-1">
                  <li>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      onClick={() => alert("Perfil del usuario")}
                    >
                      Perfil
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
