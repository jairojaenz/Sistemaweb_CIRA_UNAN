/** Rutas centralizadas del panel (todo bajo /dashboard comparte layout). */
export const ROUTES = {
  login: "/",
  dashboard: "/dashboard",
  home: "/dashboard",
  infoCampo: "/dashboard/info-campo",
  solicitudServicio: "/dashboard/solicitud-servicio",
  planMuestreoPaso: (n) => `/dashboard/plan-muestreo/paso-${n}`,
};
