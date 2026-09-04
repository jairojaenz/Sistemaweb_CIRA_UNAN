import { useId } from "react";
import { useTheme } from "../theme/ThemeContext.jsx";
import "./ThemeToggle.css";

/**
 * Botón de modo claro / oscuro (animación sol ↔ luna, Uiverse Type-Delta).
 *
 * Sirve para que el usuario cambie el tema de la interfaz.
 * Checkbox marcado = modo claro (icono de sol); desmarcado = modo oscuro (luna).
 * Va en el encabezado, a la izquierda del logo CIRA.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  // useId incluye ":" y eso rompe url(#id) de la máscara SVG.
  const reactId = useId().replace(/:/g, "");
  const inputId = `themeToggle-${reactId}`;
  const maskId = `moon-mask-${reactId}`;
  const isLight = theme === "light";

  return (
    <label
      htmlFor={inputId}
      className="themeToggle st-sunMoonThemeToggleBtn"
      title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      <input
        type="checkbox"
        id={inputId}
        className="themeToggleInput"
        checked={isLight}
        onChange={toggleTheme}
        aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      />
      {/* El SVG se recorta con una máscara: círculo completo = luna; al marcar, se mueve y aparecen los rayos (sol). */}
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" stroke="none" aria-hidden="true">
        <mask id={maskId}>
          <rect x="0" y="0" width="20" height="20" fill="white" />
          <circle cx="11" cy="3" r="8" fill="black" />
        </mask>
        <circle className="sunMoon" cx="10" cy="10" r="8" mask={`url(#${maskId})`} />
        <g>
          <circle className="sunRay sunRay1" cx="18" cy="10" r="1.5" />
          <circle className="sunRay sunRay2" cx="14" cy="16.928" r="1.5" />
          <circle className="sunRay sunRay3" cx="6" cy="16.928" r="1.5" />
          <circle className="sunRay sunRay4" cx="2" cy="10" r="1.5" />
          <circle className="sunRay sunRay5" cx="6" cy="3.1718" r="1.5" />
          <circle className="sunRay sunRay6" cx="14" cy="3.1718" r="1.5" />
        </g>
      </svg>
    </label>
  );
}
