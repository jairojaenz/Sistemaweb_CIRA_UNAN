import { useState } from "react";

export default function CampoForm() {
  const [formData, setFormData] = useState({
    usuario: "",
    identificacion: "",
    lugar: "",
    comunidad: "",
    municipio: "",
    departamento: "",
    elevacion: "",
    coordenadasN: "",
    coordenadasE: "",
    fechaToma: "",
    horaToma: "",
    ensayos: "",
    matriz: "",
    fuente: "",

    temperatura: "",
    ph: "",
    conductividad: "",
    redox: "",
    cloro: "",
    salinidad: "",
    oxigeno: "",
    sat_oxigeno: "",
   
    tipoMuestreo: "",
    horasCompuesto: "",
    equipos: "",
    instructivoUsuario: "",
    procedimientoCira: "",
    observaciones: "",
    captadaPor: "",
    verificadaPor: "",
    inicialesAnalista: "",
    codigoMuestra: "",
  });

  // 🔹 Relación matriz → fuentes
  const fuentesPorMatriz = {
    "Agua Natural": [
      "Río",
      "Lago",
      "Mar",
      "Pozo excavado",
      "Pozo perforado",
      "Manantial",
      "Estero",
      "Lluvia",
      "Otro",
    ],
    "Agua Potable": ["Agua Envasada", "Tanque de almacenamiento", "Grifo", "Otro"],
    "Agua Residual": ["Industrial", "Doméstica", "Industrial tratada", "Doméstica tratada", "Cisterna", "Otro"],
    Suelo: ["Uso agrícola", "Uso forestal", "Uso pecuario", "Natural"],
    Sedimento: ["Marino", "Lacustre", "Fluvial", "Residual", "Otro"],
    Lodos: ["Primarios", "Secundarios", "Otro"],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si cambia la matriz, limpiar la fuente
    if (name === "matriz") {
      setFormData((prev) => ({ ...prev, matriz: value, fuente: "" }));
      return;
    }

    // Si el campo está dentro de un grupo (ej. parametros.ph)
    if (name.includes(".")) {
      const [group, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [group]: { ...prev[group], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Formulario enviado ");
    console.log(formData);
  };

  return (

    <div className="bg-white text-gray-800 min-h-screen flex flex-col">

      {/* Encabezado */}
      <header className="bg-blue-900 text-white py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <img
            src="/src/assets/CIRA.png"
            alt="Logo CIRA"
            className="h-16 mb-2 md:mb-0"
          />
          <div className="text-center">
            <h2 className="text-xl font-bold">INFORMACIÓN DE CAMPO DE MUESTRAS</h2>
            <p className="text-sm">FOR-CIRA-ATACC-27 V5 — UNAN Managua / CIRA</p>
          </div>
        </div>
      </header>

      {/* Subencabezado */}
      <div className="bg-yellow-400 text-blue-900 text-center py-2 font-semibold">
        ÁREA TÉCNICA, ASEGURAMIENTO Y CONTROL DE LA CALIDAD
      </div>

     {/* ****************************************************************************************************************** */}

      {/* Formulario */}
      <main className="flex-grow flex justify-center py-8 px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 space-y-6 border border-gray-200"
        >
          {/* Información General */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Información General
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
                placeholder="Usuario"
                className="input"
              />
              <input
                name="identificacion"
                value={formData.identificacion}
                onChange={handleChange}
                placeholder="Identificación de la muestra"
                className="input"
              />
            </div>
          </section>

       {/* *******************************************************************************************************************/}         

          {/* Localización */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Localización
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input name="lugar" value={formData.lugar} onChange={handleChange} placeholder="Lugar" className="input" />
              <input name="comunidad" value={formData.comunidad} onChange={handleChange} placeholder="Comunidad" className="input" />
              <input name="municipio" value={formData.municipio} onChange={handleChange} placeholder="Municipio" className="input" />
              <input name="departamento" value={formData.departamento} onChange={handleChange} placeholder="Departamento" className="input" />
              <input name="elevacion" value={formData.elevacion} onChange={handleChange} placeholder="Elevación (msnm)" className="input" />
              <input name="coordenadasN" value={formData.coordenadasN} onChange={handleChange} placeholder="Coordenadas N" className="input" />
              <input name="coordenadasE" value={formData.coordenadasE} onChange={handleChange} placeholder="Coordenadas E" className="input" />
              <input name="fechaToma" type="date" value={formData.fechaToma} onChange={handleChange} className="input" />
              <input name="horaToma" type="time" value={formData.horaToma} onChange={handleChange} className="input" />
              <input name="ensayos" value={formData.ensayos} onChange={handleChange} placeholder="Ensayos solicitados" className="input col-span-2" />
            </div>
          </section>

         {/* *******************************************************************************************************************/}

          {/* Matriz y Fuente */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Matriz y Fuente
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <select
                name="matriz"
                value={formData.matriz}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccione Matriz</option>
                {Object.keys(fuentesPorMatriz).map((matriz) => (
                  <option key={matriz} value={matriz}>
                    {matriz}
                  </option>
                ))}
              </select>

              <select
                name="fuente"
                value={formData.fuente}
                onChange={handleChange}
                className="input"
                disabled={!formData.matriz}
              >
                <option value="">
                  {formData.matriz
                    ? "Seleccione Fuente"
                    : "Seleccione primero una Matriz"}
                </option>
                {formData.matriz &&
                  fuentesPorMatriz[formData.matriz].map((fuente) => (
                    <option key={fuente} value={fuente}>
                      {fuente}
                    </option>
                  ))}
              </select>
            </div>
          </section>

        {/* *******************************************************************************************************************/}

          {/* Parámetros de campo */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">
              Parámetros de Campo
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <input name="temperatura" value={formData.temperatura} onChange={handleChange} placeholder="Temperatura(°C)" className="input" />
              <input name="ph" value={formData.ph} onChange={handleChange} placeholder="pH (Unidades)" className="input" />
              <input name="conductividad" value={formData.conductividad} onChange={handleChange} placeholder="Conductividad (µS/cm⁻¹)" className="input" />
              <input name="redox" value={formData.redox} onChange={handleChange} placeholder="Pot. Redox (mV)" className="input" />
              <input name="cloro" value={formData.cloro} onChange={handleChange} placeholder="Cloro Residual (mg.l⁻¹)" className="input" />
              <input name="Salinidad" value={formData.salinidad} onChange={handleChange} placeholder="Salinidad (‰)" className="input" />
              <input name="oxigeno" value={formData.oxigeno} onChange={handleChange} placeholder="Oxígeno Disuelto (mg.l⁻¹)" className="input" />
              <input name="sat_oxigeno"
               value={formData.sat_oxigeno}
               onChange={handleChange} 
               placeholder="Sat. Oxígeno (%)" 
               className="border-b border-blue-400 p-2 w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </section>

         {/* *******************************************************************************************************************/}
         
          {/* 5. Tipo de muestreo */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">Tipo de Muestreo</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <select name="tipoMuestreo" value={formData.tipoMuestreo} onChange={handleChange} className="input">
                <option value="">Seleccione</option>
                <option value="puntual">Puntual</option>
                <option value="compuesto">Compuesto 8 horas</option>
                <option value="compuesto">Compuesto 12 horas</option>
                <option value="compuesto">Compuesto 16 horas</option>
                <option value="compuesto">Compuesto 24 horas</option>
                <option value="otro">Otro</option>
              </select>
              <input name="horasCompuesto" value={formData.horasCompuesto} onChange={handleChange} placeholder="Duración (horas, si aplica)" className="input" />
            </div>
          </section>
          
          {/* *******************************************************************************************************************/}

           {/* 6. Equipos e instructivos */}
          <section>
            <h3 className="text-lg font-semibold text-blue-900 border-b pb-1 mb-3">Equipos e Instructivos</h3>
            <textarea name="equipos" value={formData.equipos} onChange={handleChange} placeholder="Equipo(s) utilizado(s)" className="input" rows={2} />
            <textarea name="instructivoUsuario" value={formData.instructivoUsuario} onChange={handleChange} placeholder="Instructivo operativo utilizado por el usuario" className="input" rows={2} />
            <textarea name="procedimientoCira" value={formData.procedimientoCira} onChange={handleChange} placeholder="Procedimiento de muestreo del CIRA" className="input" rows={2} />
          </section>

         {/* *******************************************************************************************************************/}

          {/* Botón */}
          <div className="text-center pt-4">
            <button
              type="submit"
              className="bg-blue-900 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-800 transition"
            >
              Guardar Información
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-2">
        <p>
          © {new Date().getFullYear()} CIRA - UNAN Managua | Área Técnica, Aseguramiento y Control de la Calidad
        </p>
      </footer>
    </div>
  );
}

/* Reutilizable */
//const input = `border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-900 focus:outline-none`;
