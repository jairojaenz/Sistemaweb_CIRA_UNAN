import { Link } from "react-router-dom";
import { FaClipboardList, FaFlask, FaTasks } from "react-icons/fa";
import { ROUTES } from "../../../router/routes.js";

export default function DashboardHomePage() {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-semibold text-blue-900">Bienvenido al Sistema</h2>
        <p className="text-gray-600">
          Selecciona una opción del menú lateral o una tarjeta para abrir el módulo (se carga solo lo necesario).
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            to={ROUTES.infoCampo}
            className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-700 hover:shadow-lg"
          >
            <FaFlask className="mb-2 text-3xl text-blue-900" />
            <h3 className="text-lg font-semibold text-blue-900">Información de Campo</h3>
            <p className="text-sm text-gray-600">
              Registra datos de muestreo, coordenadas y parámetros técnicos.
            </p>
          </Link>

          <Link
            to={ROUTES.solicitudServicio}
            className="rounded-lg border border-gray-200 p-4 transition hover:border-yellow-500 hover:shadow-lg"
          >
            <FaClipboardList className="mb-2 text-3xl text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-600">Solicitud de Servicios</h3>
            <p className="text-sm text-gray-600">
              Registra solicitudes de análisis, muestreo e informes técnicos.
            </p>
          </Link>

          <Link
            to={ROUTES.planMuestreoPaso(1)}
            className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-700 hover:shadow-lg md:col-span-2 lg:col-span-1"
          >
            <FaTasks className="mb-2 text-3xl text-blue-900" />
            <h3 className="text-lg font-semibold text-blue-900">Plan de Muestreo</h3>
            <p className="text-sm text-gray-600">Asistente en 3 pasos para registrar el plan de muestreo.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
