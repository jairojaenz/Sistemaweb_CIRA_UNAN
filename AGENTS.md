# AGENTS.md — Sistemaweb CIRA UNAN

## Quick start
```bash
npm install
npm run dev      # Vite dev server on :5173, proxies /api -> http://localhost:5001
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
- `src/auth/api.js` — API client (`apiGet`/`apiPost`/`apiPut`/`apiDelete`/`apiPostFormData`/`apiPutFormData`). Auto-refreshes JWT on 401. `credentials: "include"` for httpOnly cookie refresh.
- `src/modules/` — feature modules, each with `page/`, `components/`, `service/`, `model/` subdirs
- `src/router/AppRoutes.jsx` — all routes defined here (lazy imports). Dashboard routes are under `/dashboard` wrapped in `ProtectedRoute` + `DashboardLayout`.
- **Login at `/`** — supports local credentials (`admin` / `123`) bypassing API — `src/modules/auth/model/constants.js`
- **Admin-only nav items** (Gestión Usuarios, Gestión Clientes) gated by `user.cargoNombre === "Administrador" || user.role === "admin"` in `DashboardLayout.jsx:269`
- All UI text is in **Spanish**

## Relevant files
- `src/router/routes.js` — centralized route path constants
- `src/components/ProtectedRoute.jsx` — auth guard wrapper
- `src/components/ToastContext.jsx` — toast notification provider (useToast)
