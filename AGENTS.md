# AGENTS.md — Sistemaweb CIRA UNAN

## Quick start
```bash
npm install
npm run dev      # Vite :5173, proxy /api -> VITE_API_PROXY_TARGET (default 127.0.0.1:5001)
npm run build    # vite build
npm run lint     # eslint flat config (eslint.config.js)
npm run preview  # vite preview
```

## Tech stack
- **React 19** + **Vite 7** with SWC (`@vitejs/plugin-react-swc`)
- **Tailwind CSS v4** — CSS-first config via `@import "tailwindcss"` in `App.css`; no `tailwind.config.js`. The `@tailwindcss/vite` plugin is used, so no PostCSS config needed (the `postcss`/`autoprefixer` devDeps are unused).
- **react-router-dom v7** — lazy-loaded routes via `React.lazy` + `Suspense`
- **No TypeScript** — plain `.jsx`
- **No test framework** — none configured
- **ESLint** flat config (`eslint.config.js`) — `react-hooks` (recommended-latest) + `react-refresh/vite`

## Architecture
- `src/main.jsx` → `App.jsx` → `AuthProvider` > `ToastProvider` > `AppRoutes`
- `src/auth/api.js` — cliente HTTP (`apiGet`/`apiPost`/…). Base: `VITE_API_URL` (vacío = proxy Vite). Detalle: `src/auth/AUTH.md`.
- `src/modules/` — feature modules, each with `page/`, `components/`, `service/`, `model/` subdirs
- `src/router/AppRoutes.jsx` — lazy routes. Dashboard bajo `/dashboard` con `ProtectedRoute` + `DashboardLayout`.
- **Login at `/`** — solo API real (`LoginForm` + `AuthContext`). Sin bypass `admin/123`.
- **Admin-only**: menú y rutas `gestion-usuarios` / `gestion-clientes` con `isAdministrador(user)` y `ProtectedRoute roles={["Administrador"]}`.
- All UI text is in **Spanish**

## Relevant files
- `src/auth/AUTH.md` — contrato de autenticación front ↔ API
- `src/auth/ENDPOINTS.md` — mapa de rutas FE ↔ API (catálogos y módulos)
- `src/modules/home/service/graficosService.js` — dashboard ejecutivo ↔ `/api/Graficos`
- `src/utils/apiList.js` — `asList()` para listados de la API
- `src/router/routes.js` — centralized route path constants
- `src/components/ProtectedRoute.jsx` — auth + optional role guard
- `src/components/LoginForm.jsx` — formulario de login (usa AuthContext)
- `src/components/ToastContext.jsx` — toast notification provider (useToast)
- `src/modules/auth/model/constants.js` — `AUTH_ROLES` / `isAdministrador`
- `.env.development` — `VITE_API_URL` vacío + `VITE_API_PROXY_TARGET` para el proxy Vite + `VITE_GOOGLE_MAPS_API_KEY`
