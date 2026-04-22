# EcoSync CO₂ — Monorepo

Sistema de gestión y cálculo de emisiones de CO₂ para plantas industriales.  
Arquitectura de tres capas: **motor de cálculo** (Node.js) · **BFF** (.NET 8) · **SPA** (Angular 21).

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Requisitos previos](#requisitos-previos)
3. [Setup — Configuración inicial](#setup--configuración-inicial)
4. [Ejecutar en desarrollo local](#ejecutar-en-desarrollo-local)
5. [Cobertura de tests (Coverage)](#cobertura-de-tests-coverage)
6. [Deploy local completo](#deploy-local-completo)
7. [Bitácora de prompts IA](#bitácora-de-prompts-ia)

---

## Arquitectura

```
Browser
  │
  ▼
davi-bff  :5000          (.NET 8 — Clean Architecture)
  ├── Sirve Angular SPA (wwwroot/*)
  └── /api/v1/*  ──proxy──►  davi-engine-co2  :3000  (Node.js + Drizzle)
                                      │
                               postgres-db  :5432
```

| Proyecto | Tecnología | Carpeta |
|---|---|---|
| Motor CO₂ | Node.js 20 · TypeScript · Drizzle ORM · Express | `davi-engine-co2/` |
| BFF | .NET 8 · ASP.NET Core · EF Core · Clean Arch | `davi-bff/` |
| SPA | Angular 21 · Tailwind CSS · ApexCharts | `frontend/` |
| Infraestructura | Docker Compose · PostgreSQL 15 | `deploy/local/` |

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| .NET SDK | 8.0 |
| Docker Desktop | 4.x |
| docker-compose | 2.x |

---

## Setup — Configuración inicial

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd prueba-davi
```

### 2. Crear el archivo `.env` de despliegue local

```bash
cd deploy/local
cp .env.example .env
```

Abrir `.env` y completar las variables obligatorias:

| Variable | Descripción |
|---|---|
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_DB` | Nombre de la base de datos |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `POSTGRES_DATA_PATH` | Ruta absoluta del host para persistir datos PG |
| `DATABASE_URL` | URL de conexión Drizzle (formato `postgresql://user:pass@host:5432/db`) |
| `ENGINE_CORS_ORIGINS` | Orígenes CORS permitidos en el engine (separados por coma) |
| `BFF_POSTGRES_URL` | Connection string del BFF hacia PostgreSQL |
| `ENGINE_BASE_URL` | URL interna del engine dentro de Docker network |

### 3. Instalar dependencias por proyecto

**Motor CO₂ (Node.js):**

```bash
cd davi-engine-co2
npm ci
```

**Frontend (Angular):**

```bash
cd frontend
npm ci
```

**BFF (.NET 8):**

```bash
cd davi-bff
dotnet restore davi-bff.slnx
```

### 4. Variables de entorno del motor CO₂ (desarrollo local sin Docker)

Crear `davi-engine-co2/.env.local` con:

```dotenv
PORT=3000
DATABASE_URL=postgresql://postgres:123456@localhost:5432/CO2
CORS_ORIGINS=http://localhost:5000,http://localhost:4200
```

### 5. Configuración del BFF (desarrollo local sin Docker)

Crear `davi-bff/davi.web-api/appsettings.Development.json` (no se commitea):

```json
{
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Port=5432;Database=CO2;Username=postgres;Password=123456"
  },
  "Engine": {
    "BaseUrl": "http://localhost:3000",
    "TimeoutSeconds": 30
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  }
}
```

---

## Ejecutar en desarrollo local

### Motor CO₂

```bash
cd davi-engine-co2
npm run dev
# Disponible en http://localhost:3000
# Swagger: http://localhost:3000/api-docs
```

### Frontend Angular

```bash
cd frontend
npm start
# Disponible en http://localhost:4200

# Con mocks (sin BFF):
npm run start:mock
```

### BFF .NET

```bash
cd davi-bff
dotnet run --project davi.web-api/davi.web-api.csproj
# Disponible en http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

---

## Cobertura de tests (Coverage)

### Motor CO₂ — Jest

Ejecuta tests unitarios con reporte de cobertura (umbral: **80 %** en statements, branches, functions y lines):

```bash
cd davi-engine-co2
npm run test:coverage
```

El reporte HTML se genera en `davi-engine-co2/coverage/lcov-report/index.html`.

Para correr solo los tests de la lógica de negocio:

```bash
npm run test:unit
```

### BFF .NET — xUnit + Coverlet

```bash
cd davi-bff
dotnet test davi-bff.slnx \
  --collect:"XPlat Code Coverage" \
  --results-directory ./coverage
```

Para generar reporte HTML con `reportgenerator` (requiere instalación global):

```bash
dotnet tool install -g dotnet-reportgenerator-globaltool   # solo la primera vez

reportgenerator \
  -reports:"davi-bff/coverage/**/coverage.cobertura.xml" \
  -targetdir:"davi-bff/coverage/html" \
  -reporttypes:Html
```

Abrir `davi-bff/coverage/html/index.html` en el navegador.

### Frontend Angular — Karma + Jasmine

```bash
cd frontend
npm test -- --watch=false --code-coverage
```

El reporte se genera en `frontend/coverage/frontend/index.html`.

Para correr en modo headless (CI):

```bash
npm test -- --watch=false --code-coverage --browsers=ChromeHeadless
```

---

## Deploy local completo

El script ejecuta en orden: instala dependencias → migra DB → ejecuta seeder → construye imágenes Docker → levanta docker-compose.

### Bash (Linux / Mac / WSL)

```bash
cd deploy/local
cp .env.example .env   # completar variables
bash deploy.sh
```

### PowerShell (Windows)

```powershell
cd deploy\local
Copy-Item .env.example .env   # completar variables
.\deploy.ps1
```

Una vez finalizado:

| Servicio | URL |
|---|---|
| Frontend + BFF | http://localhost:5000 |
| Motor CO₂ API | http://localhost:3000 |
| Swagger BFF | http://localhost:5000/swagger *(solo env Development)* |

---

## Bitácora de prompts IA

El proyecto mantiene tres archivos de registro de decisiones tomadas con asistencia de IA, siguiendo el formato `Prompt → Sugerencia IA → Decisión (ACEPTADO / RECHAZADO / MODIFICADO) → Razón técnica`.

| Archivo | Scope |
|---|---|
| [`IA_LOG.md`](IA_LOG.md) | Motor CO₂ + Frontend (decisiones transversales) |
| [`IA.LOG-BFF`](IA.LOG-BFF) | BFF .NET 8 — Clean Architecture |
| [`IA.LOG-ENGINE`](IA.LOG-ENGINE) | davi-engine-co2 — Node.js + Drizzle |

### Resumen de entradas registradas

#### IA_LOG.md — Motor CO₂ + Frontend

| ID | Título | Decisión |
|---|---|---|
| PROMPT-001 | Diseño del esquema de base de datos | ACEPTADO |
| PROMPT-002 | Implementación del backend (Node.js + Drizzle) | ACEPTADO con modificaciones |
| PROMPT-003 | Configuración del Dockerfile | RECHAZADO — reemplazado completamente |
| PROMPT-004 | Integración en docker-compose.yml | ACEPTADO |
| PROMPT-005 | Design System EcoSync con skill `ui-ux-pro-max` | MODIFICADO (light mode) |
| PROMPT-006 | Decisiones cerradas del sprint frontend (D1–D4) | ACEPTADO |
| PROMPT-007 | Incorporación de pruebas unitarias con Jasmine/Karma | MODIFICADO |
| PROMPT-008 | Contrato de endpoints del BFF | ACEPTADO |

#### IA.LOG-BFF — BFF .NET 8

| ID | Título | Decisión |
|---|---|---|
| PROMPT-001 | Arquitectura Clean Architecture para davi-bff (.NET 8) | ACEPTADO |
| PROMPT-002 | Plan de implementación con checklist por fases | ACEPTADO |
| PROMPT-003 | PostgreSQL con patrón Repository + Adapter | ACEPTADO |
| PROMPT-004 | Variables de entorno y appsettings.example.json | ACEPTADO |
| PROMPT-005 | Tests de use cases con Moq por capa | ACEPTADO |
| PROMPT-006 | Tests de repositorios con EF Core InMemory | ACEPTADO |

#### IA.LOG-ENGINE — davi-engine-co2

| ID | Título | Decisión |
|---|---|---|
| PROMPT-001 | Seeder de base de datos para visualización de gráficas | ACEPTADO |

> Para el detalle completo de cada entrada (prompt exacto, sugerencia generada y razón técnica) consultar los archivos de log enlazados en la tabla superior.
