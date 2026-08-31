/** Icono de pantalla completa de Google Maps (cuatro esquinas). */
export default function IconoPantallaCompleta({ activo = false, className = "h-[18px] w-[18px]" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      {activo ? (
        <path
          fill="currentColor"
          d="M2 8V2h6v2H4v4H2zm14 0h-2V4h-4V2h6v6zM4 14h4v2H2v-6h2v4zm10 2v-2h4v-4h2v6h-6z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M0 0v6h2V2h4V0H0zm16 0h-6v2h4v4h2V0zm0 16v-6h-2v4h-4v2h6zM2 12H0v6h6v-2H2v-4z"
        />
      )}
    </svg>
  );
}
