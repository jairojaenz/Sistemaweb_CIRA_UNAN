import { DEFAULT_LOCAL_PASSWORD, DEFAULT_LOCAL_USER } from "../model/constants.js";
import { apiPost, setAccessToken } from "../../../auth/api.js";

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

  const body = await apiPost("/api/auth/login", {
    Correo: username,
    Password: password,
  }, true);

  const { data } = body;
  if (!data?.token) throw new Error("Respuesta inválida del servidor");

  setAccessToken(data.token);

  return { token: data.token, user: data.user ?? { username, mode: "remote" } };
}
