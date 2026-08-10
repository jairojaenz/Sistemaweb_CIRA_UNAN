import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isAdministrador } from "../modules/auth/model/constants.js";
import { ROUTES } from "../router/routes";

/**
 * Protege rutas del dashboard.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] - Si se indica, el usuario debe tener uno de estos roles
 *   (p. ej. ["Administrador"]). Sin roles: basta con estar autenticado.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (roles?.length) {
    const allowed = roles.some((role) => {
      if (role === "Administrador") return isAdministrador(user);
      return user?.role === role || user?.cargoNombre === role;
    });

    if (!allowed) {
      // Autenticado pero sin permiso: vuelve al inicio del dashboard.
      return <Navigate to={ROUTES.dashboard} replace />;
    }
  }

  return children;
}
