/**
 * Roles alineados con el claim JWT "role" / cargoNombre del backend.
 * Usar en ProtectedRoute y en menús del dashboard.
 */
export const AUTH_ROLES = {
  Administrador: "Administrador",
};

/** True si el usuario tiene privilegios de administrador. */
export function isAdministrador(user) {
  if (!user) return false;
  return (
    user.role === AUTH_ROLES.Administrador ||
    user.cargoNombre === AUTH_ROLES.Administrador
  );
}
