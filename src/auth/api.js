let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

async function doRefresh() {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    accessToken = null;
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

export async function apiPost(url, body, skipAuth = false) {
  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    let errorMessage = "Error en la petición";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.title || errorMessage;
    } catch {
    }
    throw new Error(errorMessage);
  }

  const result = await res.json();
  const newToken = result.data?.token;
  if (newToken) {
    accessToken = newToken;
  }

  return result;
}
