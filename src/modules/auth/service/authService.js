import { apiGet, apiPost, setAccessToken } from "../../../auth/api.js";

/**
 * Login contra la API (POST /api/auth/login).
 * Preferir useAuth().login desde la UI; este servicio sirve para llamadas puntuales.
 *
 * @param {{ username: string, password: string }} creds
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(creds) {
  const correo = creds.username.trim();
  const { password } = creds;

  const body = await apiPost(
    "/api/auth/login",
    {
      correo,
      password,
    },
    true
  );

  const { data } = body;
  if (!data?.token) throw new Error("Respuesta inválida del servidor");

  setAccessToken(data.token);

  const profile = await fetchMeProfile(data.user);
  return { token: data.token, user: profile };
}

/** Perfil desde /api/auth/me; si falla, usa el user del login. */
async function fetchMeProfile(fallbackUser) {
  try {
    const body = await apiGet("/api/auth/me");
    return body.data ?? fallbackUser ?? null;
  } catch {
    return fallbackUser ?? null;
  }
}

/**
 * Cambia la contraseña del usuario autenticado (POST /api/auth/change-password).
 * Body: { contraseñaActual, contraseñaNueva } — IdUsuario lo toma la API del JWT.
 * Tras el éxito la API revoca refresh tokens: hay que volver a iniciar sesión.
 *
 * @param {string} contraseñaActual
 * @param {string} contraseñaNueva
 * @returns {Promise<string>} mensaje de la API
 */
export async function changePassword(contraseñaActual, contraseñaNueva) {
  const body = await apiPost("/api/auth/change-password", {
    contraseñaActual,
    contraseñaNueva,
  });
  return body.message || "Contraseña actualizada exitosamente";
}
