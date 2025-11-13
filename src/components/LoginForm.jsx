import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserAlt, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginForm() {
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
      const response = await fetch(
        "http://127.0.0.1:8000/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, password }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Error al iniciar sesión";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error ||
            "Credenciales incorrectas o usuario no encontrado";
        } catch {
          errorMessage = "Error de conexión con el servidor";
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.token) throw new Error("Respuesta inválida del servidor");

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
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
    <div className="bg-white text-gray-800 min-h-screen flex flex-col justify-between">

      {/* Encabezado */}
      <header className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-4">
          <div className="flex justify-center md:justify-start w-full md:w-1/3">
            <img
              src="/src/assets/CIRA.png"
              alt="Logo CIRA"
              className="h-20 object-contain"
            />
          </div>
          <div className="text-center w-full md:w-1/3">
            <h4 className="text-gray-200 text-lg font-semibold whitespace-nowrap">
              Sistema de Gestión de Ingreso de Muestras Ambientales (SGIMA)
            </h4>
            <h2 className="text-2xl font-bold text-gray-100">Portal Web</h2>
          </div>
          <div className="w-full md:w-1/3"></div>
        </div>
      </header>

      {/* Subencabezado */}
      <div className="bg-yellow-400 py-2">
        <p className="text-center text-blue-900 font-semibold">
          ÁREA DE PROYECCIÓN Y EXTENSIÓN
        </p>
      </div>

      {/* Formulario */}
      <main className="flex flex-col items-center justify-center py-10 px-4 flex-grow relative">
        <div className="max-w-md w-full space-y-6 relative">
          <div className="bg-white rounded-lg shadow-md p-6 relative overflow-hidden">
            
            {/* Loader flotante encima del formulario */}
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-10">
                <svg
                  className="animate-spin h-10 w-10 text-blue-900 mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <p className="text-blue-900 font-semibold">Cargando...</p>
              </div>
            )}

            <div className="text-center mb-4">
              <img
                src="https://img.freepik.com/fotos-premium/grupo-jovenes-investigadores-que-analizan-datos-quimicos-laboratorio_52137-34195.jpg?semt=ais_hybrid&w=740&q=80"
                alt="Héroes"
                className="w-full h-auto rounded"
              />
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email:
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-900">
                    <FaUserAlt />
                  </span>
                  <input
                    type="email"
                    id="correo"
                    name="username"
                    placeholder="Ingrese su correo electrónico"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña:
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-900">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                  <span
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-900 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-center text-sm animate-pulse">
                  {error}
                </p>
              )}

              {/* Botón Iniciar Sesión */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-semibold py-2 rounded-md transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed text-white"
                    : "bg-blue-900 hover:bg-blue-800 text-white"
                }`}
              >
                Iniciar Sesión
              </button>

              {/* Separador */}
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <hr className="flex-grow border-gray-300" />
                <span>o</span>
                <hr className="flex-grow border-gray-300" />
              </div>

              {/* Olvidó contraseña */}
              <p className="text-center mt-4">
                <a href="#" className="text-sm text-blue-900 hover:underline">
                  ¿Olvidó su contraseña?
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-2">
        <p>
          &copy;{" "}
          <a
            href="https://cira.unan.edu.ni/"
            className="underline hover:text-gray-300"
          >
            CIRA - Managua
          </a>{" "}
          - 2025
        </p>
      </footer>
    </div>
  );
}
