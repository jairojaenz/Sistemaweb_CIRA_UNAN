import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext.jsx";
import LoginForm from "../../../components/LoginForm.jsx";
import { ROUTES } from "../../../router/routes.js";
import ciraLogo from "../../../assets/CIRA.png";

/**
 * Página de login en `/`.
 * Si ya hay sesión válida (refresh cookie + JWT), redirige al dashboard.
 */
export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-white text-gray-800">
      <header className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 py-4 md:flex-row">
          <div className="flex w-full justify-center md:w-1/3 md:justify-start">
            <img src={ciraLogo} alt="Logo CIRA" className="h-20 object-contain" />
          </div>
          <div className="w-full text-center md:w-1/3">
            <h4 className="text-lg font-semibold whitespace-nowrap text-gray-200">
              Sistema de Gestión de Ingreso de Muestras Ambientales (SGIMA)
            </h4>
            <h2 className="text-2xl font-bold text-gray-100">Portal Web</h2>
          </div>
          <div className="hidden w-full md:block md:w-1/3" />
        </div>
      </header>

      <div className="bg-yellow-400 py-2">
        <p className="text-center font-semibold text-blue-900">ÁREA DE PROYECCIÓN Y EXTENSIÓN</p>
      </div>

      <main className="relative flex flex-grow flex-col items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md space-y-6">
          <LoginForm onSuccess={() => navigate(ROUTES.dashboard, { replace: true })} />
        </div>
      </main>

      <footer className="bg-blue-900 py-2 text-center text-white">
        <p>
          &copy;{" "}
          <a href="https://cira.unan.edu.ni/" className="underline hover:text-gray-300">
            CIRA - Managua
          </a>{" "}
          — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
