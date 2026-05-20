import { normalizeClienteFromApi } from "../../clientes/service/clienteService.js";
import { formatTelefonoLocal } from "../../../utils/phoneFormat.js";

const TIPO_INDIVIDUO = "Individuo";

/**
 * Campos del formulario de solicitud a partir de un cliente del API (GET clientes).
 * @param {object} c
 * @returns {object} Campos parciales para el estado del formulario de solicitud
 */
export function mapClienteToSolicitudPrefill(c) {
  if (!c) return {};
  const cliente = normalizeClienteFromApi(c);
  const tipo = cliente.tiposCliente ?? TIPO_INDIVIDUO;
  const esInd = tipo === TIPO_INDIVIDUO;
  const nombre = `${cliente.nombreCliente || ""} ${cliente.apellidoCliente || ""}`.trim();
  const tel = formatTelefonoLocal(cliente.telefonoCliente ?? "");
  const cel = formatTelefonoLocal(cliente.celularCliente ?? "");

  return {
    nombreUsuario: nombre,
    direccionUsuario: cliente.direccionCliente ?? "",
    ruc: esInd ? "" : cliente.numeroRuc,
    cedula: esInd ? (cliente.cedulaCliente ?? "") : "",
    correo: cliente.correoCliente ?? "",
    atencionA: esInd ? "" : String(cliente.nombreContacto ?? "").trim(),
    contacto1: cel || tel,
    contacto2: cel && tel && cel !== tel ? tel : "",
  };
}

export function nombreCompletoCliente(c) {
  if (!c) return "";
  const cliente = normalizeClienteFromApi(c);
  return `${cliente.nombreCliente || ""} ${cliente.apellidoCliente || ""}`.trim();
}
