# Plan de Implementación — Deploy Completo del Proyecto

**Fecha:** 2026-04-22  
**Scope:** Dockerización del BFF, integración del frontend embebido, CORS engine, variables de entorno y script de despliegue local.

---

## Índice

1. [Contexto y arquitectura objetivo](#1-contexto-y-arquitectura-objetivo)
2. [Tarea 1 — CORS en davi-engine-co2](#2-tarea-1--cors-en-davi-engine-co2)
3. [Tarea 2 — Build Angular embebido en el BFF](#3-tarea-2--build-angular-embebido-en-el-bff)
4. [Tarea 3 — Dockerfile del BFF](#4-tarea-3--dockerfile-del-bff)
5. [Tarea 4 — Actualizar docker-compose.yml](#5-tarea-4--actualizar-docker-composeyml)
6. [Tarea 5 — Actualizar .env.example](#6-tarea-5--actualizar-envexample)
7. [Tarea 6 — Script de despliegue local](#7-tarea-6--script-de-despliegue-local)
8. [Orden de ejecución y dependencias](#8-orden-de-ejecución-y-dependencias)

---

## 1. Contexto y arquitectura objetivo

```
                    ┌────────────────────────────────────────────┐
                    │          Docker Compose (local)            │
                    │                                            │
  Browser ──────────► davi-bff  :5000                           │
                    │  └── serve Angular SPA (dist embebido)     │
                    │  └── /api/v1/* → proxy a engine            │
                    │                    │                        │
                    │              davi-engine-co2  :3000        │
                    │  CORS: permite origen http://localhost:5000 │
                    │              │                              │
                    │         postgres-db  :5432                  │
                    └────────────────────────────────────────────┘
```

**Stack:**
| Servicio | Runtime | Puerto interno | Puerto host |
|---|---|---|---|
| `postgres-db` | PostgreSQL 15.3 | 5432 | 5432 |
| `davi-engine-co2` | Node 20 Alpine | 3000 | 3000 |
| `davi-bff` | .NET 8 Alpine | 5000 | 5000 |

---

## 2. Tarea 1 — CORS en davi-engine-co2

**Archivo:** `davi-engine-co2/src/core/config/server.ts`

**Situación actual:** `this.app.use(cors())` acepta todos los orígenes (inseguro para producción).

**Cambio requerido:** Restringir a la lista de orígenes permitidos inyectada desde variables de entorno.

### 2.1 Actualizar `envs.ts`

**Archivo:** `davi-engine-co2/src/core/envs.ts`

Añadir variable `CORS_ORIGINS` (lista separada por comas):

```typescript
// antes
export const envs = {
    NODE_ENV: get('NODE_ENV').default('local').asEnum([...]),
    PORT: get('PORT').required().asPortNumber(),
    DATABASE_URL: get('DATABASE_URL').required().asString(),
}

// después
export const envs = {
    NODE_ENV: get('NODE_ENV').default('local').asEnum([...]),
    PORT: get('PORT').required().asPortNumber(),
    DATABASE_URL: get('DATABASE_URL').required().asString(),
    CORS_ORIGINS: get('CORS_ORIGINS').default('http://localhost:5000').asArray(','),
}
```

### 2.2 Actualizar `server.ts`

Reemplazar `this.app.use(cors())` con configuración explícita:

```typescript
// antes
this.app.use(cors());

// después
this.app.use(cors({
    origin: envs.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 2.3 Archivo `.env` de engine-co2 para local (no commitear)

Añadir al `.env.local` y al `.env.dev`:

```
CORS_ORIGINS=http://localhost:5000,http://localhost:4200
```

> **Nota:** `http://localhost:4200` mantiene compatibilidad con `ng serve` en desarrollo.

---

## 3. Tarea 2 — Build Angular embebido en el BFF

El BFF servirá la SPA Angular como archivos estáticos. Para ello:

### 3.1 Crear environment de producción para Angular

**Archivo a crear:** `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: '/api/v1',   // path relativo — el BFF atiende en el mismo origen
  useMocks: false,
};
```

> Usar path relativo evita hardcodear la URL del BFF y funciona en cualquier hostname/puerto.

### 3.2 Registrar la configuración en `angular.json`

Dentro de `projects.frontend.architect.build.configurations`, añadir:

```json
"production": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ],
  "budgets": [...],
  "outputHashing": "all"
}
```

> Verificar que la sección `production` existente no tenga ya `fileReplacements`; si no los tiene, agregarlos.

### 3.3 Output del build

Angular 21 con `@angular/build:application` genera el artefacto en:

```
frontend/dist/frontend/browser/
```

Este directorio será copiado al Dockerfile del BFF.

### 3.4 Configurar el BFF para servir archivos estáticos

**Archivo:** `davi-bff/davi.web-api/Program.cs`

```csharp
// ...existing services...

var app = builder.Build();

// CORS — debe ir antes de UseStaticFiles y MapControllers
app.UseCors("AllowFrontend");

// Swagger solo en Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Servir archivos estáticos del build Angular
app.UseDefaultFiles();   // sirve index.html por defecto
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// SPA fallback: cualquier ruta no-API devuelve index.html
app.MapFallbackToFile("index.html");

app.Run();
```

Añadir CORS en la configuración de servicios:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

**Archivo:** `davi-bff/davi.web-api/appsettings.json` — añadir sección CORS:

```json
{
  ...
  "Cors": {
    "AllowedOrigins": []
  }
}
```

**Archivo:** `davi-bff/davi.web-api/appsettings.example.json` — documenta el campo:

```json
{
  ...
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  }
}
```

---

## 4. Tarea 3 — Dockerfile del BFF

**Archivo a crear:** `davi-bff/Dockerfile`

Estrategia multi-stage:
- **Stage 1 (`angular-build`):** Node 20 Alpine → `npm ci` + `ng build --configuration production`
- **Stage 2 (`dotnet-build`):** SDK .NET 8 → `dotnet publish`
- **Stage 3 (`runner`):** Runtime .NET 8 Alpine → copia artefactos

```dockerfile
# =============================================================================
# Stage 1 — Angular build
# =============================================================================
FROM node:20-alpine AS angular-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build -- --configuration production

# =============================================================================
# Stage 2 — .NET publish
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS dotnet-build

WORKDIR /app

# Copiar solution y proyectos
COPY davi-bff/davi-bff.slnx ./
COPY davi-bff/davi.Application/ ./davi.Application/
COPY davi-bff/davi.Domain/ ./davi.Domain/
COPY davi-bff/davi.Infrastructure/ ./davi.Infrastructure/
COPY davi-bff/davi.Tests/ ./davi.Tests/
COPY davi-bff/davi.web-api/ ./davi.web-api/

# Restaurar y publicar
RUN dotnet restore davi-bff.slnx
RUN dotnet publish davi.web-api/davi.web-api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

# Copiar el build de Angular dentro del wwwroot del BFF
COPY --from=angular-build /app/frontend/dist/frontend/browser/ /app/publish/wwwroot/

# =============================================================================
# Stage 3 — Runtime
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runner

WORKDIR /app

COPY --from=dotnet-build /app/publish ./

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "davi.web-api.dll"]
```

> **Importante:** El contexto del build del Dockerfile es la **raíz del repositorio** (`prueba-davi/`), no dentro de `davi-bff/`. Esto permite al Stage 1 acceder a la carpeta `frontend/`.

---

## 5. Tarea 4 — Actualizar docker-compose.yml

**Archivo:** `deploy/local/docker-compose.yml`

Añadir el servicio `davi-bff` y actualizar el engine con la variable `CORS_ORIGINS`:

```yaml
version: "3.8"

services:
  postgres-db:
    image: postgres:15.3
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgressdbdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  davi-engine-co2:
    build:
      context: ../../davi-engine-co2
      dockerfile: Dockerfile
    environment:
      NODE_ENV: ${NODE_ENV:-dev}
      PORT: 3000
      DATABASE_URL: ${DATABASE_URL}
      CORS_ORIGINS: ${ENGINE_CORS_ORIGINS:-http://localhost:5000}
    ports:
      - "3000:3000"
    depends_on:
      - postgres-db

  davi-bff:
    build:
      context: ../../          # raíz del repo (necesario para copiar frontend/)
      dockerfile: davi-bff/Dockerfile
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:5000
      ConnectionStrings__Postgres: ${BFF_POSTGRES_URL}
      Engine__BaseUrl: ${ENGINE_BASE_URL:-http://davi-engine-co2:3000}
      Engine__TimeoutSeconds: 30
    ports:
      - "5000:5000"
    depends_on:
      - postgres-db
      - davi-engine-co2

volumes:
  postgressdbdata:
    driver: local
    driver_opts:
      o: bind
      type: none
      device: ${POSTGRES_DATA_PATH:-./data/postgres}
```

> **Nota sobre el volumen:** Se parametriza `device` con `POSTGRES_DATA_PATH` para evitar rutas absolutas hardcodeadas (Windows vs Linux). Cada desarrollador define la ruta en su `.env`.

---

## 6. Tarea 5 — Actualizar .env.example

**Archivo:** `deploy/local/.env.example`

```dotenv
# ============================================================
# VARIABLES REQUERIDAS — Copiar a .env y rellenar antes
# de ejecutar el script de despliegue local.
# ============================================================

# ── PostgreSQL ──────────────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_DB=CO2
POSTGRES_PASSWORD=123456

# Ruta absoluta del host donde se persistirán los datos de PG
# Windows ejemplo: E:/volumenes-docker/postgressdbdata
# Linux/Mac ejemplo: /opt/docker-volumes/postgressdbdata
POSTGRES_DATA_PATH=

# ── Engine (davi-engine-co2) ────────────────────────────────
# URL de conexión para Drizzle ORM (debe coincidir con PG arriba)
DATABASE_URL=postgresql://postgres:123456@postgres-db:5432/CO2

# NODE_ENV para el engine (dev | production)
NODE_ENV=dev

# Orígenes permitidos por CORS en el engine (separados por coma)
ENGINE_CORS_ORIGINS=http://localhost:5000

# ── BFF (.NET) ──────────────────────────────────────────────
# Connection string del BFF hacia PostgreSQL
BFF_POSTGRES_URL=Host=postgres-db;Port=5432;Database=CO2;Username=postgres;Password=123456

# URL interna del engine (dentro de docker network usa el nombre del servicio)
ENGINE_BASE_URL=http://davi-engine-co2:3000
```

---

## 7. Tarea 6 — Script de despliegue local

**Archivo a crear:** `deploy/local/deploy.sh`

El script ejecuta en orden:

1. Instala dependencias de todos los proyectos.
2. Aplica migraciones Drizzle sobre la base de datos.
3. Ejecuta el seeder.
4. Construye las imágenes Docker.
5. Levanta docker-compose.

```bash
#!/usr/bin/env bash
# =============================================================================
# deploy/local/deploy.sh
# Script de despliegue local completo.
# Requisitos: Node 20+, .NET 8 SDK, Docker, docker-compose
#
# Uso:
#   cd deploy/local
#   cp .env.example .env   # y rellenar las variables
#   bash deploy.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy/local"
ENGINE_DIR="$REPO_ROOT/davi-engine-co2"
FRONTEND_DIR="$REPO_ROOT/frontend"
BFF_DIR="$REPO_ROOT/davi-bff"

# Cargar variables del .env
if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
  echo "❌  No se encontró $DEPLOY_DIR/.env"
  echo "   Copia .env.example → .env y rellena las variables requeridas."
  exit 1
fi

set -a
source "$DEPLOY_DIR/.env"
set +a

echo "======================================================="
echo "  DAVI — Deploy Local"
echo "======================================================="

# -------------------------------------------------------------
# 1. Instalar dependencias — engine-co2
# -------------------------------------------------------------
echo ""
echo "▶ [1/6] Instalando dependencias de davi-engine-co2..."
cd "$ENGINE_DIR"
npm ci

# -------------------------------------------------------------
# 2. Instalar dependencias — frontend
# -------------------------------------------------------------
echo ""
echo "▶ [2/6] Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
npm ci

# -------------------------------------------------------------
# 3. Restaurar paquetes NuGet — BFF
# -------------------------------------------------------------
echo ""
echo "▶ [3/6] Restaurando paquetes NuGet del BFF..."
cd "$BFF_DIR"
dotnet restore davi-bff.slnx

# -------------------------------------------------------------
# 4. Iniciar PostgreSQL (solo el servicio de base de datos)
#    para poder ejecutar migraciones antes del compose completo.
# -------------------------------------------------------------
echo ""
echo "▶ [4/6] Levantando PostgreSQL para migraciones..."
cd "$DEPLOY_DIR"
docker-compose up -d postgres-db

echo "   Esperando a que PostgreSQL esté listo..."
until docker-compose exec -T postgres-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
  sleep 2
done
echo "   PostgreSQL listo."

# -------------------------------------------------------------
# 5. Migraciones Drizzle + Seeder
# -------------------------------------------------------------
echo ""
echo "▶ [5/6] Ejecutando migraciones Drizzle..."
cd "$ENGINE_DIR"

# Las migraciones necesitan la DATABASE_URL apuntando al postgres del host
# (el contenedor expone 5432 al host)
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
  npx drizzle-kit migrate

echo "   Ejecutando seeder..."
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
  npx ts-node -r tsconfig-paths/register src/db/drizzle/seed.ts

# -------------------------------------------------------------
# 6. Build de imágenes y docker-compose up
# -------------------------------------------------------------
echo ""
echo "▶ [6/6] Construyendo imágenes y levantando servicios..."
cd "$DEPLOY_DIR"
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "======================================================="
echo "  ✅  Deploy completado"
echo ""
echo "  Frontend + BFF : http://localhost:5000"
echo "  Engine API     : http://localhost:3000"
echo "  Swagger BFF    : http://localhost:5000/swagger (solo Development)"
echo "======================================================="
```

### 7.1 Permisos en Linux/Mac

```bash
chmod +x deploy/local/deploy.sh
```

### 7.2 Equivalente PowerShell (Windows)

Para entornos Windows sin WSL, crear `deploy/local/deploy.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path "$PSScriptRoot/../.."
$DeployDir = "$RepoRoot/deploy/local"
$EngineDir = "$RepoRoot/davi-engine-co2"
$FrontendDir = "$RepoRoot/frontend"
$BffDir = "$RepoRoot/davi-bff"

# Cargar .env
if (-not (Test-Path "$DeployDir/.env")) {
    Write-Error "No se encontró $DeployDir/.env. Copia .env.example → .env y rellena las variables."
    exit 1
}

Get-Content "$DeployDir/.env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
    }
}

Write-Host "======================================================="
Write-Host "  DAVI — Deploy Local (PowerShell)"
Write-Host "======================================================="

# 1. Dependencias engine
Write-Host "`n[1/6] Instalando dependencias davi-engine-co2..."
Set-Location $EngineDir ; npm ci

# 2. Dependencias frontend
Write-Host "`n[2/6] Instalando dependencias frontend..."
Set-Location $FrontendDir ; npm ci

# 3. Restaurar NuGet BFF
Write-Host "`n[3/6] Restaurando paquetes NuGet BFF..."
Set-Location $BffDir ; dotnet restore davi-bff.slnx

# 4. Iniciar PostgreSQL
Write-Host "`n[4/6] Levantando PostgreSQL..."
Set-Location $DeployDir ; docker-compose up -d postgres-db

Write-Host "   Esperando PostgreSQL..."
do {
    Start-Sleep -Seconds 2
    $ready = docker-compose exec -T postgres-db pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB 2>&1
} while ($LASTEXITCODE -ne 0)
Write-Host "   PostgreSQL listo."

# 5. Migraciones + Seeder
Write-Host "`n[5/6] Migraciones Drizzle..."
Set-Location $EngineDir
$env:DATABASE_URL = "postgresql://$($env:POSTGRES_USER):$($env:POSTGRES_PASSWORD)@localhost:5432/$($env:POSTGRES_DB)"
npx drizzle-kit migrate

Write-Host "   Seeder..."
npx ts-node -r tsconfig-paths/register src/db/drizzle/seed.ts

# 6. Build + compose up
Write-Host "`n[6/6] Build imágenes y docker-compose up..."
Set-Location $DeployDir
docker-compose build --no-cache
docker-compose up -d

Write-Host ""
Write-Host "======================================================="
Write-Host "  Deploy completado"
Write-Host "  Frontend + BFF : http://localhost:5000"
Write-Host "  Engine API     : http://localhost:3000"
Write-Host "======================================================="
```

---

## 8. Orden de ejecución y dependencias

```
Tarea 1 (CORS engine)         ──► independiente
Tarea 2 (env Angular prod)    ──► requerida por Tarea 3
Tarea 2 (static files BFF)    ──► requerida por Tarea 3
Tarea 3 (Dockerfile BFF)      ──► depende de Tarea 2
Tarea 4 (docker-compose)      ──► depende de Tarea 3
Tarea 5 (.env.example)        ──► independiente
Tarea 6 (script deploy)       ──► depende de Tareas 1-5
```

### Checklist de implementación

- [ ] **T1** Actualizar `envs.ts` — añadir `CORS_ORIGINS`
- [ ] **T1** Actualizar `server.ts` — CORS con lista de orígenes explícita
- [ ] **T2** Crear `frontend/src/environments/environment.prod.ts` con `apiUrl: '/api/v1'`
- [ ] **T2** Actualizar `angular.json` — registrar `fileReplacements` en configuración `production`
- [ ] **T2** Actualizar `Program.cs` — `UseDefaultFiles`, `UseStaticFiles`, `MapFallbackToFile`
- [ ] **T2** Registrar política CORS en `Program.cs` y `appsettings.json`
- [ ] **T3** Crear `davi-bff/Dockerfile` (multi-stage: angular-build → dotnet-build → runner)
- [ ] **T4** Actualizar `deploy/local/docker-compose.yml` — añadir servicio `davi-bff`, variable `CORS_ORIGINS` en engine, parametrizar volumen PG
- [ ] **T5** Actualizar `deploy/local/.env.example` — todas las variables documentadas
- [ ] **T6** Crear `deploy/local/deploy.sh` (bash)
- [ ] **T6** Crear `deploy/local/deploy.ps1` (PowerShell)

---

## Notas de seguridad

- Nunca commitear el archivo `.env` (ya debe estar en `.gitignore`).
- `CORS_ORIGINS` en producción debe ser el dominio exacto, no `*`.
- El BFF no expone HTTPS en Docker local (termina en el load balancer/proxy). Desactivar `UseHttpsRedirection` o configurar el certificado si se necesita TLS local.
- Los `appsettings.json` no deben contener credenciales reales; usar variables de entorno inyectadas por Docker.
