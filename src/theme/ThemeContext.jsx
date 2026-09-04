import { createContext, useCallback, useContext, useState } from "react";

/**
 * Tema visual de la app (claro / oscuro).
 *
 * - Guarda la elección en localStorage (`cira-theme`) para que sobreviva recargas.
 * - Pone o quita la clase `dark` en <html>; Tailwind (`dark:`) y las variables de App.css la usan.
 * - Solo cambia el fondo del contenido (claro = gray-100, oscuro = #0d053c del home).
 * - El menú lateral y la barra superior no se re-colorean.
 */
const STORAGE_KEY = "cira-theme";
const ThemeContext = createContext(null);

/** Activa o desactiva la clase `dark` en el documento (lo que dispara el modo oscuro en CSS). */
function applyThemeClass(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Lee el tema guardado; si no hay nada, arranca en claro. */
function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* localStorage puede fallar en modo privado */
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const initial = readStoredTheme();
    applyThemeClass(initial);
    return initial;
  });

  /** Alterna claro ↔ oscuro, persiste y actualiza <html>. */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      applyThemeClass(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
