import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserAlt, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { login } from "../service/authService.js";
import { ROUTES } from "../../../router/routes.js";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const { token, user } = await login({ username: correo, password });
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate(ROUTES.dashboard);
    } catch (err) {
      if (err.name === "TypeError") {
        setError("No se pudo conectar con el servidor. Verifique su conexión!!!");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-white text-gray-800">
      <header className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 py-4 md:flex-row">
          <div className="flex w-full justify-center md:w-1/3 md:justify-start">
            <img src="/src/assets/CIRA.png" alt="Logo CIRA" className="h-20 object-contain" />
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
          <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-md">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
                <svg
                  className="mb-3 h-10 w-10 animate-spin text-blue-900"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="font-semibold text-blue-900">Cargando...</p>
              </div>
            )}

            <div className="mb-4 text-center">
              <img
                src="https://img.freepik.com/fotos-premium/grupo-jovenes-investigadores-que-analizan-datos-quimicos-laboratorio_52137-34195.jpg?semt=ais_hybrid&w=740&q=80"
                alt=""
                className="h-auto w-full rounded"
              />
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                  Usuario / Email:
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-900">
                    <FaUserAlt />
                  </span>
                  <input
                    type="text"
                    id="correo"
                    name="username"
                    placeholder="Ingrese su usuario o correo (admin / 123)"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña:
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-900">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-10 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-blue-900"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && <p className="animate-pulse text-center text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-md py-2 font-semibold transition ${
                  loading ? "cursor-not-allowed bg-blue-400 text-white" : "bg-blue-900 text-white hover:bg-blue-800"
                }`}
              >
                Iniciar Sesión
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <hr className="flex-grow border-gray-300" />
                <span>o</span>
                <hr className="flex-grow border-gray-300" />
              </div>

              <p className="mt-4 text-center">
                <a href="#" className="text-sm text-blue-900 hover:underline">
                  ¿Olvidó su contraseña?
                </a>
              </p>
            </form>
          </div>
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
