import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";

const TIPO_INDIVIDUO = "Individuo";

/**
 * Campos del formulario de solicitud a partir de un cliente del API (GET clientes).
 * @param {object} c
 * @returns {object} Campos parciales para el estado del formulario de solicitud
 */
export function mapClienteToSolicitudPrefill(c) {
  if (!c) return {};
  const tipo = c.tiposCliente ?? c.nombreTipoCliente ?? TIPO_INDIVIDUO;
  const esInd = tipo === TIPO_INDIVIDUO;
  const nombre = `${c.nombreCliente || ""} ${c.apellidoCliente || ""}`.trim();
  const tel = formatTelefonoLocal(c.telefonoCliente ?? "");
  const cel = formatTelefonoLocal(c.celularCliente ?? "");

  return {
    nombreUsuario: nombre,
    direccionUsuario: c.direccionCliente ?? "",
    ruc: esInd ? "" : String(c.numeroRuc ?? c.NumeroRuc ?? "").trim(),
    cedula: esInd ? (c.cedulaCliente ?? "") : "",
    correo: c.correoCliente ?? "",
    atencionA: esInd ? "" : String(c.nombreContacto ?? c.NombreContacto ?? "").trim(),
    contacto1: cel || tel,
    contacto2: cel && tel && cel !== tel ? tel : "",
  };
}

export function nombreCompletoCliente(c) {
  if (!c) return "";
  return `${c.nombreCliente || ""} ${c.apellidoCliente || ""}`.trim();
}
