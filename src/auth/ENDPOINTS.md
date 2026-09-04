# Mapa de endpoints Frontend ↔ API

Referencia rápida para evitar rutas rotas o 401 por configuración.

## Regla de desarrollo

1. API: `dotnet run --launch-profile http` → **solo** `http://localhost:5001`
2. Front: `VITE_API_URL=` vacío → el proxy Vite reenvía `/api` a `:5001`
3. En Network deben verse URLs `http://localhost:5173/api/...` (nunca `:7055`)
4. Listados: usar `asList()` / `normalizeNamedItem()` de `src/utils/apiList.js`
5. Catálogos simples: el UI usa `nombreCargo`, etc.; el service mapea a `nombre` del DTO API

## Auth

| Front | API |
|-------|-----|
| POST `/api/auth/login` | POST `/api/Auth/login` |
| POST `/api/auth/refresh` | POST `/api/Auth/refresh` |
| GET `/api/auth/me` | GET `/api/Auth/me` |
| POST `/api/auth/logout` | POST `/api/Auth/logout` |
| POST `/api/auth/change-password` | POST `/api/Auth/change-password` |

## Catálogos (`/api/catalogos/...`)

Rutas FE = rutas API (sin tilde): `cargos`, `departamentos`, `municipios`, `matrices`, `muestras`, `muestras-por-analisis`, `fuentes-matriz`, `medios-recepcion`, `preservantes`, `servicios`, `tipos-cliente`, `tipos-muestreo`, `equipos-muestreo`, `grupos-analisis`, `tecnicas-analisis`, `laboratorios`, `analisis`.

## Módulos

| Front | API |
|-------|-----|
| `/api/User/get-users` … | `UserController` |
| `/api/Clientes/clientes` | GET |
| `/api/Clientes/create-cliente` | POST multipart |
| `/api/Clientes/update-cliente/{id}` | PUT multipart |
| `/api/Clientes/delete-cliente/{id}` | DELETE |
| `/api/Clientes/toggle-cliente-status/{id}` | PUT |
| `/api/FormatosSolicitudServicio` | GET list / `{id}` |
| `…/create-solicitud` | POST |
| `…/update-solicitud/{id}` | PUT |
| `…/delete-solicitud/{id}` | DELETE |
| `/api/FormatosOrdenServicio/OrdenServicio` | GET list |
| `…/OrdenServicio/{id}` | GET by id |
| `…/Create-ordenServicio` | POST (`fechaRecepcion`, `tieneAnalisis`, …) |
| `…/Update-ordenServicio/{id}` | PUT |
| `…/Delete-ordenServicio/{id}` | DELETE |
| `/api/Clientes/clientes/{id}` | GET by id |
| `/api/FormatosProforma/proforma` | GET |
| `…/proforma/{id}` | GET by id |
| `…/create-proforma` | POST |
| `…/update-proforma/{id}` | PUT |
| `/api/FormatosPlanMuestreo` | GET list / `{id}` |
| `…/create-PlanMuestreo` | POST |
| `…/update-PlanMuestreo/{id}` | PUT |
| `…/delete-PlanMuestreo/{id}` | DELETE |
| `/api/FormatosCampoMuestra` | GET list / `{id}` / POST / PUT / DELETE (wizard: lugar, depto/municipio, fecha/hora, procedimiento, verificación) |
| `/api/catalogos/muestras` | GET (selectores Plan e Info Campo) |
| `/api/catalogos/analisis` | GET/POST/PUT/DELETE |
| `/api/FormatosCustodiaMuestra` | GET list / `{id}` / POST / PUT / DELETE |
| `/api/FormatosEnsayo/ensayos` | GET list |
| `…/ensayos/{id}` | GET by id |
| `…/create-ensayo` | POST |
| `…/update-ensayo/{id}` | PUT |
| `…/delete-ensayo/{id}` | DELETE |
| `/api/Graficos/kpis` | GET KPIs (proformas, órdenes, muestras, clientes) |
| `/api/Graficos/conversion-mensual` | GET proformas vs órdenes por mes |
| `/api/Graficos/muestras-por-matriz` | GET distribución de muestras |
| `/api/Graficos/tendencia-solicitudes` | GET solicitudes actual vs período anterior |
| `/api/Graficos/cumplimiento-planes` | GET planes programados / ejecutados |
| `/api/Graficos/puntos-clientes` | GET clientes con coordenadas reales |
| `/api/Graficos/puntos-planes` | GET planes de muestreo con coordenadas reales |
| `/api/Graficos/top-clientes` | GET clientes por volumen (paginado: `pagina`, `tamano`) |
| `/api/Graficos/analisis-solicitados` | GET análisis más pedidos |
| `/api/Graficos/alerta-custodia` | GET cadenas pendientes +24 h |

Query comunes de gráficos: `fechaInicio`, `fechaFin`, `idMatriz` (opcional). `top-clientes` también acepta `pagina` y `tamano` (20 por página).

## Roles

- Users y Clientes: solo **Administrador** (API + `ProtectedRoute`).
