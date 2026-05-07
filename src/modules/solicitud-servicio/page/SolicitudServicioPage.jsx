import { useState } from "react";
import { saveSolicitudServicioLocal } from "../service/solicitudServicioService.js";

export default function SolicitudServicioPage() {
  const [formData, setFormData] = useState({
    solicitudNo: "",
    medioRecepcion: "",
    fechaRecepcion: "",
    nombreUsuario: "",
    direccionUsuario: "",
    ruc: "",
    cedula: "",
    correo: "",
    atencionA: "",
    contacto1: "",
    contacto2: "",
    servicios: {
      analisis: false,
      muestreo: false,
      informeTecnico: false,
      medicionNeaNd: false,
    },
    matriz: "",
    matrizOtro: "",
    numMuestras: "",
    analisisSolicitados: "",
    coordenadas: "",
    observacion: "",
    firmaUsuario: "",
    solicitudRecibidaPor: "",
    fechaEnvioProforma: "",
  });

  const matrices = [
    "Agua Natural",
    "Agua Residual",
    "Sedimento",
    "Suelo",
    "Lodo",
    "Otro",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [group, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [group]: { ...prev[group], [field]: type === "checkbox" ? checked : value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveSolicitudServicioLocal(formData);
  };

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-white text-gray-800">
      <div className="bg-yellow-400 py-2 text-center font-semibold text-blue-900">
        ÁREA DE PROYECCIÓN Y EXTENSIÓN
      </div>

      {/* Formulario */}
      <main className="flex flex-grow justify-center bg-white py-8 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-lg"
        >
          {/* Datos generales */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Datos Generales
              </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="solicitudNo" value={formData.solicitudNo} onChange={handleChange} placeholder="Solicitud No." className="input" />
              <select name="medioRecepcion" value={formData.medioRecepcion} onChange={handleChange} className="input">
                <option value="">Medio de recepción</option>
                <option value="Vía telefónica">Vía telefónica</option>
                <option value="Vía correo electrónico">Vía correo electrónico</option>
                <option value="Personal">Personal</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
              <input type="date" name="fechaRecepcion" value={formData.fechaRecepcion} onChange={handleChange} className="input" />
            </div>
          </section>

          {/* Usuario */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Información del Usuario
              </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="nombreUsuario" value={formData.nombreUsuario} onChange={handleChange} placeholder="Nombre del usuario (empresa o institución)" className="input" />
              <input name="direccionUsuario" value={formData.direccionUsuario} onChange={handleChange} placeholder="Dirección del usuario" className="input" />
              <input name="ruc" value={formData.ruc} onChange={handleChange} placeholder="No. RUC" className="input" />
              <input name="cedula" value={formData.cedula} onChange={handleChange} placeholder="No. de cédula" className="input" />
              <input name="correo" type="email" value={formData.correo} onChange={handleChange} placeholder="Correo electrónico" className="input" />
              <input name="atencionA" value={formData.atencionA} onChange={handleChange} placeholder="Con atención a (nombre)" className="input" />
              <input name="contacto1" value={formData.contacto1} onChange={handleChange} placeholder="No. de contacto 1" className="input" />
              <input name="contacto2" value={formData.contacto2} onChange={handleChange} placeholder="No. de contacto 2" className="input" />
            </div>
          </section>

          {/* Servicio solicitado */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Servicio Solicitado
              </h3>
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(formData.servicios).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" name={`servicios.${key}`} checked={value} onChange={handleChange} />
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </label>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <select name="matriz" value={formData.matriz} onChange={handleChange} className="input">
                <option value="">Seleccione matriz</option>
                {matrices.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {formData.matriz === "Otro" && (
                <input
                  name="matrizOtro"
                  value={formData.matrizOtro}
                  onChange={handleChange}
                  placeholder="Especifique otra matriz"
                  className="input"
                />
              )}

              <input
                name="numMuestras"
                type="number"
                value={formData.numMuestras}
                onChange={handleChange}
                placeholder="No. de muestras"
                className="input"
              />
            </div>
          </section>

          {/* Detalles */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Detalles de la Solicitud
              </h3>
            <textarea name="analisisSolicitados" value={formData.analisisSolicitados} onChange={handleChange} placeholder="Análisis solicitados" className="input" rows={3} />
            <textarea name="coordenadas" value={formData.coordenadas} onChange={handleChange} placeholder="Dirección y/o coordenadas de los puntos de muestreo" className="input" rows={3} />
            <textarea name="observacion" value={formData.observacion} onChange={handleChange} placeholder="Observación" className="input" rows={3} />
          </section>

          {/* Firmas */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Firma y Recepción
              </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <input name="firmaUsuario" value={formData.firmaUsuario} onChange={handleChange} placeholder="Firma del usuario" className="input" />
              <input name="solicitudRecibidaPor" value={formData.solicitudRecibidaPor} onChange={handleChange} placeholder="Solicitud recibida por" className="input" />
              <input type="date" name="fechaEnvioProforma" value={formData.fechaEnvioProforma} onChange={handleChange} className="input" />
            </div>
          </section>

          {/* Botón */}
          <div className="text-center pt-4">
            <button
              type="submit"
              className="bg-blue-900 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-800 transition"
            >
              Guardar Solicitud
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-2">
        <p>© {new Date().getFullYear()} CIRA - UNAN Managua | Área de Proyección y Extensión</p>
      </footer>
    </div>
  );
}
