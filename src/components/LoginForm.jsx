import { useState } from "react";
import { FaUserAlt, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * Formulario de login.
 * Usa AuthContext (POST /api/auth/login + cookie refresh). No hay bypass local.
 */
export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await login({ username: correo.trim(), password });
      onSuccess?.();
    } catch (err) {
      if (err?.name === "TypeError") {
        setError("No se pudo conectar con el servidor. Verifique su conexión.");
      } else {
        setError(err?.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-md">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80">
          <svg
            className="mb-3 h-10 w-10 animate-spin text-blue-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
            Correo electrónico:
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-900">
              <FaUserAlt />
            </span>
            <input
              type="email"
              id="correo"
              name="correo"
              autoComplete="username"
              placeholder="Ingrese su correo electrónico"
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
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-10 focus:ring-2 focus:ring-blue-900 focus:outline-none"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-blue-900"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-md py-2 font-semibold transition ${
            loading ? "cursor-not-allowed bg-blue-400 text-white" : "bg-blue-900 text-white hover:bg-blue-800"
          }`}
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}
