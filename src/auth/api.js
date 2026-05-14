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

async function request(url, { method = "GET", body, formData = false, skipAuth = false } = {}) {
  const headers = {};
  if (!formData && body != null) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let fetchBody;
  if (formData) {
    fetchBody = body;
  } else if (body != null) {
    fetchBody = JSON.stringify(body);
  }

  let res = await fetch(url, {
    method,
    credentials: "include",
    headers,
    body: fetchBody,
  });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method,
        credentials: "include",
        headers,
        body: fetchBody,
      });
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

  const text = await res.text();
  let result = {};
  if (text?.trim()) {
    try {
      result = JSON.parse(text);
    } catch {
      result = {};
    }
  }
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

export async function apiPostFormData(url, formData, skipAuth = false) {
  return request(url, { method: "POST", body: formData, formData: true, skipAuth });
}

export async function apiPutFormData(url, formData, skipAuth = false) {
  return request(url, { method: "PUT", body: formData, formData: true, skipAuth });
}
