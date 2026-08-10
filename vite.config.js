import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Proxy de desarrollo: el navegador llama a `/api/...` (mismo origen)
 * y Vite reenvía al backend. El target sale de VITE_API_PROXY_TARGET
 * (ver .env.development), no de URLs hardcodeadas en el código de la app.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5001";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Navegador → mismo origen (:5173/api) → Vite reenvía a la API (HTTP :5001).
        // Importante: la API en Development no debe redirigir a HTTPS :7055 (rompe auth).
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
