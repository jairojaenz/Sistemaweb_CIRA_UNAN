# Autenticación — Frontend (Sistemaweb_CIRA_UNAN)

Cómo encaja el front con `CIRA_web_api`. Leer también `CIRA_web_api/Features/Authentication/AUTH.md`.

## Piezas

| Archivo | Qué hace |
|---------|----------|
| `src/auth/api.js` | Cliente HTTP: JWT en memoria, refresh por cookie, reintento en 401 |
| `src/auth/AuthContext.jsx` | Estado de sesión (`token`, `user`, `login`, `logout`) |
| `src/components/LoginForm.jsx` | UI de login → llama `login()` del contexto |
| `src/modules/auth/page/LoginPage.jsx` | Página `/` que monta `LoginForm` |
| `src/modules/auth/model/constants.js` | `AUTH_ROLES` + `isAdministrador(user)` |
| `src/components/ProtectedRoute.jsx` | Exige sesión; opcional `roles={["Administrador"]}` |
| `src/layouts/DashboardLayout.jsx` | Menú admin solo si `isAdministrador(user)` |

## Contrato con la API

**Login** `POST /api/auth/login` (público):

```json
{ "correo": "usuario@correo.com", "password": "secreto" }
```

Respuesta esperada:

```json
{
  "message": "Login exitoso",
  "data": {
    "token": "<jwt>",
    "expiresAt": "...",
    "user": { "id": 1, "correo": "...", "role": "Administrador", "cargoNombre": "Administrador", "activo": true }
  }
}
```

Además la API setea cookie httpOnly `refreshToken` (el JS no la lee).

**Me** `GET /api/auth/me` (Bearer) → `{ data: user }`

**Refresh** `POST /api/auth/refresh` (cookie, sin body) → mismo shape que login en `data`

**Logout** `POST /api/auth/logout` (Bearer + cookie)

## Desarrollo local

- `.env.development`: `VITE_API_URL=` (vacío) + `VITE_API_PROXY_TARGET=http://127.0.0.1:5001`
- El navegador habla con Vite (`:5173`); Vite reenvía `/api` a la API HTTP.
- Así la cookie de refresh funciona (mismo origen aparente).
- **No** pongas `VITE_API_URL=http://127.0.0.1:7055` ni uses el perfil HTTPS de la API con el proxy: el redirect HTTP→HTTPS rompe auth (401 en catálogos y refresh).
- Tras cambiar la API: reiníciala y vuelve a iniciar sesión (cierra sesión / limpia cookies del sitio si hace falta).

## Roles

- Backend: claim JWT `role` + `[Authorize(Roles = "Administrador")]` en Users/Clientes.
- Frontend: `ProtectedRoute roles={["Administrador"]}` en esas rutas + ocultar ítems del menú.
- Helper: `isAdministrador(user)` compara `user.role` y `user.cargoNombre`.

## Qué NO hay

- Bypass local `admin` / `123` (eliminado).
- Flujo “olvidé mi contraseña” (no se implementará por ahora).

## Cambio de contraseña (UI)

- Botón **Cambiar contraseña** en el pie del sidebar (`DashboardLayout`).
- Modal: `src/components/ChangePasswordModal.jsx` → `changePassword()` en `authService.js`.
- API: `POST /api/auth/change-password` con `{ contraseñaActual, contraseñaNueva }` (mín. 6 caracteres).
- Tras éxito: toast + `logout()` + redirección a login (la API revoca refresh tokens).
