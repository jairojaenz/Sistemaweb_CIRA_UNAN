import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiPost } from "./api";
import { DEFAULT_LOCAL_PASSWORD, DEFAULT_LOCAL_USER } from "../modules/auth/model/constants.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function tryRefresh() {
      try {
        const body = await apiPost("/api/auth/refresh", null, true);
        const { data } = body;
        if (data?.token) {
          if (!cancelled) {
            setToken(data.token);
            setUser(data.user ?? null);
          }
        }
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    tryRefresh();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (creds) => {
    const username = creds.username.trim();
    const { password } = creds;

    if (username === DEFAULT_LOCAL_USER && password === DEFAULT_LOCAL_PASSWORD) {
      const localUser = { username: DEFAULT_LOCAL_USER, role: "admin", mode: "local" };
      setToken("local-admin");
      setUser(localUser);
      return { token: "local-admin", user: localUser };
    }

    const body = await apiPost("/api/auth/login", {
      Correo: username,
      Password: password,
    }, true);

    const { data } = body;
    if (!data?.token) throw new Error("Respuesta inválida del servidor");

    setToken(data.token);
    setUser(data.user ?? null);

    return { token: data.token, user: data.user };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout", null);
    } catch {
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = { token, user, loading, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
