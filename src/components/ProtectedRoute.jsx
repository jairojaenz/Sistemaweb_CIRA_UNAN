import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../router/routes";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

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

  return children;
}
