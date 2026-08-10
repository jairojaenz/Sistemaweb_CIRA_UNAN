/**
 * Cliente HTTP centralizado para la API CIRA.
 *
 * - Base URL: `import.meta.env.VITE_API_URL` (vacío = rutas relativas; en dev el proxy de Vite reenvía `/api`).
 * - JWT en memoria (`accessToken`); refresh en cookie httpOnly vía `credentials: "include"`.
 * - Ante 401 (excepto login/refresh) intenta `POST /api/auth/refresh` una vez y reintenta.
 * - Si el refresh falla, limpia el token y dispara `cira:auth-lost` para que AuthContext cierre sesión en UI.
 */

/** URL base sin slash final. Vacío = mismo origen (proxy Vite en desarrollo). */
const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

let accessToken = null;
/** Evita varios refresh en paralelo cuando varias peticiones reciben 401 a la vez. */
let refreshPromise = null;

/** Avisa a AuthContext que la sesión ya no es válida (evita UI “logueado” con 401). */
function notifyAuthLost() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cira:auth-lost"));
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

async function doRefresh() {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    clearAccessToken();
    throw new Error("Refresh failed");
  }
  const body = await res.json();
  accessToken = body.data?.token ?? null;
  return accessToken;
}

async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * @param {string} url - Ruta absoluta de API, p. ej. "/api/auth/login"
 * @param {{ method?: string, body?: unknown, formData?: boolean, skipAuth?: boolean }} options
 */
async function request(url, { method = "GET", body, formData = false, skipAuth = false } = {}) {
  const headers = {};
  if (!formData && body != null) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let fetchBody;
  if (formData) {
    fetchBody = body;
  } else if (body != null) {
    fetchBody = JSON.stringify(body);
  }

  const fullUrl = `${API_BASE}${url}`;

  let res = await fetch(fullUrl, {
    method,
    credentials: "include",
    headers,
    body: fetchBody,
  });

  // Token expirado: renovar con cookie y reintentar una vez.
  if (res.status === 401 && !skipAuth) {
    try {
      const newToken = await refreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(fullUrl, {
          method,
          credentials: "include",
          headers,
          body: fetchBody,
        });
      } else {
        notifyAuthLost();
      }
    } catch {
      clearAccessToken();
      notifyAuthLost();
    }
  }

  if (!res.ok) {
    let errorMessage = "Error en la petición";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.title || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  // 204 / cuerpo vacío
  if (res.status === 204) {
    return {};
  }

  const text = await res.text();
  let result = {};
  if (text?.trim()) {
    try {
      result = JSON.parse(text);
    } catch {
      result = {};
    }
  }

  // Login/refresh suelen devolver data.token: mantener accessToken sincronizado.
  const newToken = result.data?.token;
  if (newToken) {
    accessToken = newToken;
  }

  return result;
}

export async function apiPost(url, body, skipAuth = false) {
  return request(url, { method: "POST", body, skipAuth });
}

export async function apiGet(url, skipAuth = false) {
  return request(url, { method: "GET", skipAuth });
}

export async function apiPut(url, body, skipAuth = false) {
  return request(url, { method: "PUT", body, skipAuth });
}

export async function apiDelete(url, skipAuth = false) {
  return request(url, { method: "DELETE", skipAuth });
}

export async function apiPostFormData(url, formDataBody, skipAuth = false) {
  return request(url, { method: "POST", body: formDataBody, formData: true, skipAuth });
}

export async function apiPutFormData(url, formDataBody, skipAuth = false) {
  return request(url, { method: "PUT", body: formDataBody, formData: true, skipAuth });
}
