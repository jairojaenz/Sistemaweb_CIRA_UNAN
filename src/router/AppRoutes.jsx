import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import { ROUTES } from "./routes.js";

const LoginPage = lazy(() => import("../modules/auth/page/LoginPage.jsx"));
const DashboardHomePage = lazy(() => import("../modules/home/page/DashboardHomePage.jsx"));
const InfoCampoPage = lazy(() => import("../modules/info-campo/page/InfoCampoPage.jsx"));
const SolicitudServicioPage = lazy(() =>
  import("../modules/solicitud-servicio/page/SolicitudServicioPage.jsx")
);
const PlanMuestreoPaso1 = lazy(() => import("../modules/plan-muestreo/page/PlanMuestreoPaso1.jsx"));
const PlanMuestreoPaso2 = lazy(() => import("../modules/plan-muestreo/page/PlanMuestreoPaso2.jsx"));
const PlanMuestreoPaso3 = lazy(() => import("../modules/plan-muestreo/page/PlanMuestreoPaso3.jsx"));
const GestionUsuariosPage = lazy(() => import("../modules/usuarios/page/GestionUsuariosPage.jsx"));
const GestionClientesPage = lazy(() => import("../modules/clientes/page/GestionClientesPage.jsx"));
const GestionLaboratoriosPage = lazy(() => import("../modules/laboratorios/page/GestionLaboratoriosPage.jsx"));
const CargosPage = lazy(() => import("../modules/catalogos/page/CargosPage.jsx"));
const DepartamentosPage = lazy(() => import("../modules/catalogos/page/DepartamentosPage.jsx"));
const FuentesPage = lazy(() => import("../modules/catalogos/page/FuentesPage.jsx"));
const MatrizPage = lazy(() => import("../modules/catalogos/page/MatrizPage.jsx"));
const MetodosRecepcionPage = lazy(() => import("../modules/catalogos/page/MetodosRecepcionPage.jsx"));
const MunicipiosPage = lazy(() => import("../modules/catalogos/page/MunicipiosPage.jsx"));
const PreservantesPage = lazy(() => import("../modules/catalogos/page/PreservantesPage.jsx"));
const ServiciosPage = lazy(() => import("../modules/catalogos/page/ServiciosPage.jsx"));
const TiposClientesPage = lazy(() => import("../modules/catalogos/page/TiposClientesPage.jsx"));
const GruposAnalisisPage = lazy(() => import("../modules/catalogos/page/GruposAnalisisPage.jsx"));
const TecnicasAnalisisPage = lazy(() => import("../modules/catalogos/page/TecnicasAnalisisPage.jsx"));
const TiposMuestreoPage = lazy(() => import("../modules/catalogos/page/TiposMuestreoPage.jsx"));
const EquiposMuestreoPage = lazy(() => import("../modules/catalogos/page/EquiposMuestreoPage.jsx"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-blue-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-900 border-t-transparent" />
        <p className="text-sm font-medium">Cargando módulo…</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHomePage />} />
            <Route path="info-campo" element={<InfoCampoPage />} />
            <Route path="solicitud-servicio/:idCliente" element={<SolicitudServicioPage />} />
            <Route path="solicitud-servicio" element={<SolicitudServicioPage />} />
            <Route path="plan-muestreo/paso-1" element={<PlanMuestreoPaso1 />} />
            <Route path="plan-muestreo/paso-2" element={<PlanMuestreoPaso2 />} />
            <Route path="plan-muestreo/paso-3" element={<PlanMuestreoPaso3 />} />
            <Route path="gestion-usuarios" element={<GestionUsuariosPage />} />
            <Route path="gestion-clientes" element={<GestionClientesPage />} />
            <Route path="gestion-laboratorios" element={<GestionLaboratoriosPage />} />
            <Route path="catalogos/cargos" element={<CargosPage />} />
            <Route path="catalogos/departamentos" element={<DepartamentosPage />} />
            <Route path="catalogos/fuentes" element={<FuentesPage />} />
            <Route path="catalogos/matriz" element={<MatrizPage />} />
            <Route path="catalogos/metodos-recepcion" element={<MetodosRecepcionPage />} />
            <Route path="catalogos/municipios" element={<MunicipiosPage />} />
            <Route path="catalogos/preservantes" element={<PreservantesPage />} />
            <Route path="catalogos/servicios" element={<ServiciosPage />} />
            <Route path="catalogos/tipos-clientes" element={<TiposClientesPage />} />
            <Route path="catalogos/grupos-analisis" element={<GruposAnalisisPage />} />
            <Route path="catalogos/tecnicas-analisis" element={<TecnicasAnalisisPage />} />
            <Route path="catalogos/tipos-muestreo" element={<TiposMuestreoPage />} />
            <Route path="catalogos/equipos-muestreo" element={<EquiposMuestreoPage />} />
          </Route>

          <Route path="/info-campo" element={<Navigate to="/dashboard/info-campo" replace />} />
          <Route
            path="/solicitud-servicio"
            element={<Navigate to="/dashboard/solicitud-servicio" replace />}
          />
          <Route
            path="/plan-muestreo/paso-1"
            element={<Navigate to="/dashboard/plan-muestreo/paso-1" replace />}
          />
          <Route
            path="/plan-muestreo/paso-2"
            element={<Navigate to="/dashboard/plan-muestreo/paso-2" replace />}
          />
          <Route
            path="/plan-muestreo/paso-3"
            element={<Navigate to="/dashboard/plan-muestreo/paso-3" replace />}
          />

          <Route
            path="/gestion-clientes"
            element={<Navigate to="/dashboard/gestion-clientes" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
