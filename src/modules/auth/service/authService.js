import { DEFAULT_LOCAL_PASSWORD, DEFAULT_LOCAL_USER } from "../model/constants.js";

const API_LOGIN = "http://127.0.0.1:8000/api/login";

/**
 * @param {{ username: string, password: string }} creds
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(creds) {
  const username = creds.username.trim();
  const { password } = creds;

  if (username === DEFAULT_LOCAL_USER && password === DEFAULT_LOCAL_PASSWORD) {
    return {
      token: "local-admin",
      user: { username: DEFAULT_LOCAL_USER, role: "admin", mode: "local" },
    };
  }

  const response = await fetch(API_LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo: username, password }),
  });

  if (!response.ok) {
    let errorMessage = "Error al iniciar sesión";
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.message || errorData.error || "Credenciales incorrectas o usuario no encontrado";
    } catch {
      errorMessage = "Error de conexión con el servidor";
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data.token) throw new Error("Respuesta inválida del servidor");

  return { token: data.token, user: data.user ?? { username, mode: "remote" } };
}
