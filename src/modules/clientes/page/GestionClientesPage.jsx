export default function GestionClientesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 p-4 sm:p-6">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center">
        <div className="rounded-full bg-blue-100 p-4">
          <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700">Gestión de Clientes</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Esta sección está en desarrollo. Pronto podrá administrar los clientes del sistema desde aquí.
        </p>
      </div>
    </div>
  );
}
