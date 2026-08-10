import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, clearAccessToken, setAccessToken } from "./api";

const AuthContext = createContext(null);

/**
 * Perfil desde GET /api/auth/me (requiere JWT en memoria).
 * Si falla (red o 401), usa fallbackUser (p. ej. el user del login/refresh).
 */
async function fetchCurrentUser(fallbackUser) {
  try {
    const body = await apiGet("/api/auth/me");
    return body.data ?? fallbackUser ?? null;
  } catch {
    return fallbackUser ?? null;
  }
}

/**
 * Proveedor de autenticación.
 * - Al montar: intenta refresh con cookie httpOnly.
 * - login: POST /api/auth/login → guarda JWT → GET /api/auth/me.
 * - logout: POST /api/auth/logout → limpia estado local.
 * Ver src/auth/AUTH.md para el contrato con la API.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function tryRefresh() {
      try {
        // skipAuth=true: no intenta refresh-sobre-refresh si falla.
        const body = await apiPost("/api/auth/refresh", null, true);
        const { data } = body;
        if (data?.token) {
          if (!cancelled) {
            setAccessToken(data.token);
            setToken(data.token);
            const profile = await fetchCurrentUser(data.user);
            if (!cancelled) setUser(profile);
          }
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  // Si api.js pierde la sesión (refresh fallido → 401 en catálogos), alinea el estado de UI.
  useEffect(() => {
    function onAuthLost() {
      clearAccessToken();
      setToken(null);
      setUser(null);
    }
    window.addEventListener("cira:auth-lost", onAuthLost);
    return () => window.removeEventListener("cira:auth-lost", onAuthLost);
  }, []);

  const login = useCallback(async (creds) => {
    const correo = creds.username.trim();
    const { password } = creds;

    // Body en camelCase; la API acepta Correo/Password por binding case-insensitive.
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
    setToken(data.token);
    const profile = await fetchCurrentUser(data.user);
    setUser(profile);

    return { token: data.token, user: profile };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout", null);
    } catch {
      // Aunque falle el logout remoto, limpia estado local.
    } finally {
      clearAccessToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook de contexto: vive junto al Provider (excepción habitual de react-refresh).
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
