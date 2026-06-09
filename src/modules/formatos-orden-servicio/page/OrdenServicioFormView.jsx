import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";

const HORAS_COMPUESTO = [
  { key: "compuesto8h", label: "8 h" },
  { key: "compuesto12h", label: "12 h" },
  { key: "compuesto16h", label: "16 h" },
  { key: "compuesto24h", label: "24 h" },
];

function SectionCard({ number, title, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <h3 className="mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-blue-900">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm text-white">
          {number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder, error, className = "", as, children, rows = 3 }) {
  const id = `orden-${name}`;
  const base = `input w-full ${error ? "border-red-500" : ""}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </label>
      {as === "select" ? (
        <select id={id} name={name} value={value} onChange={onChange} className={base}>
          {children}
        </select>
      ) : as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={base}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={base}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function CheckField({ name, label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
      />
      {label}
    </label>
  );
}

function RadioField({ name, optionValue, label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
      <input
        type="radio"
        name={name}
        value={optionValue}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-gray-300 text-blue-900 focus:ring-blue-900"
      />
      {label}
    </label>
  );
}

export default function OrdenServicioFormView({
  form,
  formErrors,
  onChange,
  onDetalleChange,
  onAddDetalleRow,
  onRemoveDetalleRow,
  onControlRecepcionChange,
  onAddControlRecepcionRow,
  onRemoveControlRecepcionRow,
  onSubmit,
  onCancel,
  saving,
  catalogsLoading = false,
  departamentos,
  municipiosFiltrados,
}) {
  const compuesto = form.modalidadMuestreo === "compuesto";
  const otros = form.modalidadMuestreo === "otros";

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-gray-100 pb-12">
      <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-900 hover:text-blue-700"
        >
          <FaArrowLeft className="h-3.5 w-3.5" />
          Volver al listado
        </button>
        <h1 className="text-2xl font-bold text-blue-900">Solicitud de Servicio de Laboratorio</h1>
        <p className="mt-1 text-sm text-gray-600">
          Complete los detalles para iniciar el procesamiento de su muestra.
        </p>
        {catalogsLoading && (
          <p className="mt-2 text-sm text-amber-700">Cargando catálogos (usuarios, formatos, ubicación)…</p>
        )}
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* 1. Información del cliente */}
        <SectionCard number={1} title="Información del cliente">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Orden Nº"
              name="numeroOrden"
              type="number"
              value={form.numeroOrden}
              onChange={onChange}
              placeholder="Número de orden"
              error={formErrors.numeroOrden}
            />
            <Field
              label="Proforma Nº"
              name="proformaNo"
              value={form.proformaNo}
              onChange={onChange}
              placeholder="Número de proforma"
            />
            <Field
              label="Fecha"
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={onChange}
              error={formErrors.fecha}
            />
            <Field
              label="Usuario / Empresa"
              name="usuarioEmpresa"
              value={form.usuarioEmpresa}
              onChange={onChange}
              placeholder="Nombre de la institución"
              className="sm:col-span-2"
              error={formErrors.usuarioEmpresa}
            />
            <Field
              label="Atención a"
              name="atencionA"
              value={form.atencionA}
              onChange={onChange}
              placeholder="Persona de contacto"
            />
            <Field
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={onChange}
              placeholder="0000-0000"
              error={formErrors.telefono}
            />
            <Field
              label="Celular"
              name="celular"
              value={form.celular}
              onChange={onChange}
              placeholder="0000-0000"
              error={formErrors.celular}
            />
            <Field label="Ext." name="extension" value={form.extension} onChange={onChange} />
            <Field
              label="Correo electrónico"
              name="correo"
              type="email"
              value={form.correo}
              onChange={onChange}
              placeholder="ejemplo@cira.edu.ni"
              className="sm:col-span-2 lg:col-span-3"
            />
            <Field
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={onChange}
              className="sm:col-span-2 lg:col-span-3"
            />
            <Field label="Departamento" name="departamento" as="select" value={form.departamento} onChange={onChange}>
              <option value="">Seleccione departamento</option>
              {departamentos.map((d) => {
                const nombre = d.nombreDepartamento ?? d.NombreDepartamento ?? d.nombre ?? "";
                return (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                );
              })}
            </Field>
            <Field label="Municipio" name="municipio" as="select" value={form.municipio} onChange={onChange}>
              <option value="">
                {form.departamento ? "Seleccione municipio" : "Seleccione un departamento primero"}
              </option>
              {municipiosFiltrados.map((m) => {
                const nombre = m.nombreMunicipio ?? m.NombreMunicipio ?? m.nombre ?? "";
                return (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                );
              })}
            </Field>
          </div>
        </SectionCard>

        {/* 2 y 3. Servicio y tipo de muestreo */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard number={2} title="Servicio solicitado">
            <div className="space-y-3">
              <CheckField name="analisisOrden" label="Análisis" checked={form.analisisOrden} onChange={onChange} />
              <CheckField
                name="muestreoOrden"
                label="Muestreo in situ"
                checked={form.muestreoOrden}
                onChange={onChange}
              />
              <CheckField
                name="hojaObservacionOrden"
                label="Hoja de Observación"
                checked={form.hojaObservacionOrden}
                onChange={onChange}
              />
              <CheckField
                name="informeTecnicoOrden"
                label="Informe Técnico"
                checked={form.informeTecnicoOrden}
                onChange={onChange}
              />
              <Field
                label="Otro servicio (especifique)"
                name="otroServicio"
                value={form.otroServicio}
                onChange={onChange}
                placeholder="Especifique..."
                className="pt-2"
              />
            </div>
          </SectionCard>

          <SectionCard number={3} title="Tipo de muestreo">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Modalidad</p>
                <div className="flex flex-wrap gap-4">
                  <RadioField
                    name="modalidadMuestreo"
                    optionValue="puntual"
                    label="Puntual"
                    checked={form.modalidadMuestreo === "puntual"}
                    onChange={onChange}
                  />
                  <RadioField
                    name="modalidadMuestreo"
                    optionValue="compuesto"
                    label="Compuesto"
                    checked={form.modalidadMuestreo === "compuesto"}
                    onChange={onChange}
                  />
                  <RadioField
                    name="modalidadMuestreo"
                    optionValue="otros"
                    label="Otros"
                    checked={form.modalidadMuestreo === "otros"}
                    onChange={onChange}
                  />
                </div>
              </div>
              {otros && (
                <Field
                  label="Especifique el tipo de muestreo"
                  name="modalidadMuestreoOtros"
                  value={form.modalidadMuestreoOtros}
                  onChange={onChange}
                  placeholder="Describa el tipo de muestreo"
                  error={formErrors.modalidadMuestreoOtros}
                />
              )}
              {compuesto && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Opciones para compuesto
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {HORAS_COMPUESTO.map(({ key, label }) => (
                      <CheckField
                        key={key}
                        name={key}
                        label={label}
                        checked={form[key]}
                        onChange={onChange}
                      />
                    ))}
                  </div>
                  {formErrors.compuestoOpcion && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.compuestoOpcion}</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* 4. Detalle de muestras */}
        <SectionCard number={4} title="Detalle de muestras y análisis">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onAddDetalleRow}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-900 hover:bg-blue-50"
            >
              <FaPlus className="h-3 w-3" />
              Añadir fila
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nº muestra(s) o medicón</th>
                  <th className="px-4 py-3 font-semibold">Análisis solicitado / medición in situ</th>
                  <th className="px-4 py-3 font-semibold">Código asignado (uso lab)</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {form.detalleMuestras.map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.numeroMuestra}
                        onChange={(e) => onDetalleChange(index, "numeroMuestra", e.target.value)}
                        className="input w-full"
                        placeholder="01"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.analisis}
                        onChange={(e) => onDetalleChange(index, "analisis", e.target.value)}
                        className="input w-full"
                        placeholder="Ej: DQO, DBO5, pH..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.codigoLab}
                        onChange={(e) => onDetalleChange(index, "codigoLab", e.target.value)}
                        className="input w-full bg-gray-50"
                        placeholder="Reservado"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {form.detalleMuestras.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveDetalleRow(index)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="Eliminar fila"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* 5. Control de recepción */}
        <SectionCard number={5} title="Control de recepción (uso de laboratorio)">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onAddControlRecepcionRow}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-900 hover:bg-blue-50"
            >
              <FaPlus className="h-3 w-3" />
              Añadir fila
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Laboratorio(s)</th>
                  <th className="px-4 py-3 font-semibold">Recibido por</th>
                  <th className="px-4 py-3 font-semibold">Fecha de entrega de resultados al usuario</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {form.controlRecepcion.map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.laboratorio}
                        onChange={(e) => onControlRecepcionChange(index, "laboratorio", e.target.value)}
                        className="input w-full"
                        placeholder="Nombre del Lab"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.recibidoPor}
                        onChange={(e) => onControlRecepcionChange(index, "recibidoPor", e.target.value)}
                        className="input w-full"
                        placeholder="Nombre de receptor"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={row.fechaEntregaResultados}
                        onChange={(e) =>
                          onControlRecepcionChange(index, "fechaEntregaResultados", e.target.value)
                        }
                        className="input w-full"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {form.controlRecepcion.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveControlRecepcionRow(index)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="Eliminar fila"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* 6. Logística */}
        <SectionCard number={6} title="Logística y transporte">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Muestreo realizado por
              </p>
              <div className="flex flex-wrap gap-4">
                <RadioField
                  name="muestreoPor"
                  optionValue="usuario"
                  label="Usuario"
                  checked={form.muestreoPor === "usuario"}
                  onChange={onChange}
                />
                <RadioField
                  name="muestreoPor"
                  optionValue="cira"
                  label="Personal del CIRA"
                  checked={form.muestreoPor === "cira"}
                  onChange={onChange}
                />
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Transporte a cargo del
              </p>
              <div className="flex flex-wrap gap-4">
                <RadioField
                  name="transportePor"
                  optionValue="usuario"
                  label="Usuario"
                  checked={form.transportePor === "usuario"}
                  onChange={onChange}
                />
                <RadioField
                  name="transportePor"
                  optionValue="cira"
                  label="CIRA"
                  checked={form.transportePor === "cira"}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 7. Detalles finales */}
        <SectionCard number={7} title="Detalles finales y normativa">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Colocar en el informe de resultados la Norma o Decreto
              </p>
              <div className="flex flex-wrap gap-4">
                <RadioField
                  name="incluirNormaInforme"
                  optionValue="si"
                  label="Sí"
                  checked={form.incluirNormaInforme === "si"}
                  onChange={onChange}
                />
                <RadioField
                  name="incluirNormaInforme"
                  optionValue="no"
                  label="No fue solicitado por el usuario"
                  checked={form.incluirNormaInforme === "no"}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Especificar Lab"
                name="especificarLab"
                value={form.especificarLab}
                onChange={onChange}
                placeholder="Nombre del laboratorio"
              />
              <Field
                label="Especificar Norma/Decreto"
                name="especificarNorma"
                value={form.especificarNorma}
                onChange={onChange}
                placeholder="Ej: Decreto 33-95"
              />
            </div>
            <Field
              label="Observaciones"
              name="observacionOrden"
              as="textarea"
              rows={4}
              value={form.observacionOrden}
              onChange={onChange}
              placeholder="Cualquier requerimiento especial o detalle adicional..."
            />
          </div>
        </SectionCard>

        {/* 8. Firmas */}
        <SectionCard number={8} title="Protocolo de firmas">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <Field
                label="Firma del usuario"
                name="firmaUsuario"
                value={form.firmaUsuario}
                onChange={onChange}
                placeholder="Nombre y sello"
              />
              <div className="mt-6 border-b-2 border-gray-400 pb-1">
                <p className="text-center text-xs font-bold uppercase tracking-wide text-gray-600">
                  Firma del usuario
                </p>
                <p className="text-center text-xs text-gray-500">Nombre y sello</p>
              </div>
            </div>
            <div>
              <Field
                label="Firma Área de Proyección y Extensión"
                name="firmaApe"
                value={form.firmaApe}
                onChange={onChange}
                placeholder="Recepción CIRA"
              />
              <div className="mt-6 border-b-2 border-gray-400 pb-1">
                <p className="text-center text-xs font-bold uppercase tracking-wide text-gray-600">
                  Firma Área de Proyección y Extensión
                </p>
                <p className="text-center text-xs text-gray-500">Recepción CIRA</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Acciones */}
        <div className="flex justify-end border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-md hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Creando…" : "Crear Orden"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
