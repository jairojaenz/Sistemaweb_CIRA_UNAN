const STORAGE_KEY = "solicitud_servicio_last_v1";

export function saveSolicitudServicioLocal(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

const API_URL = "http://localhost:5001/api/FormatosSolicitudServicio";

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage =
      "Ocurrió un error en la solicitud";

    try {
      const errorData = await response.json();

      errorMessage =
        errorData.message ||
        errorData.title ||
        errorMessage;
    } catch {
      try {
        errorMessage = await response.text();
      } catch {
        //
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Obtener todas las solicitudes
export async function getSolicitudes() {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
   const data = await response.json();

  console.log(data);

  return data;
}

// Obtener solicitud por ID
export async function getSolicitudById(id) {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  return handleResponse(response);
}
