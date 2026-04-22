#Requires -Version 5.1
# =============================================================================
# deploy/local/deploy.ps1  —  Despliegue local sin Docker (Windows PowerShell)
# Requisitos: Node 20+, .NET 8 SDK, PostgreSQL instalado localmente
#
# Uso:
#   cd deploy\local
#   Copy-Item .env.example .env   # rellenar variables
#   .\deploy.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$RepoRoot    = (Resolve-Path "$PSScriptRoot/../..").Path
$DeployDir   = "$RepoRoot\deploy\local"
$EngineDir   = "$RepoRoot\davi-engine-co2"
$FrontendDir = "$RepoRoot\frontend"
$BffDir      = "$RepoRoot\davi-bff"

# ── Cargar .env ─────────────────────────────────────────────
if (-not (Test-Path "$DeployDir\.env")) {
    Write-Error "No se encontro $DeployDir\.env. Copia .env.example -> .env y rellena las variables."
    exit 1
}

$envVars = @{}
Get-Content "$DeployDir\.env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
        $key   = $Matches[1].Trim()
        $value = $Matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        $envVars[$key] = $value
    }
}

# Construir DATABASE_URL desde componentes
$pgHost = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
$pgPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
$env:DATABASE_URL = "postgresql://$($env:POSTGRES_USER):$($env:POSTGRES_PASSWORD)@${pgHost}:${pgPort}/$($env:POSTGRES_DB)"

$enginePort = if ($env:ENGINE_PORT) { $env:ENGINE_PORT } else { "3000" }
$bffPort    = if ($env:BFF_PORT)    { $env:BFF_PORT }    else { "5000" }
$corsOrigins = if ($env:CORS_ORIGINS) { $env:CORS_ORIGINS } else { "http://localhost:5000,http://localhost:4200" }

Write-Host "======================================================="
Write-Host "  DAVI - Deploy Local"
Write-Host "======================================================="

# ── [1/6] Instalar dependencias ─────────────────────────────
Write-Host "`n[1/6] Instalando dependencias..."

Write-Host "   davi-engine-co2..."
Set-Location $EngineDir ; npm ci

Write-Host "   frontend..."
Set-Location $FrontendDir ; npm ci

Write-Host "   davi-bff (NuGet)..."
Set-Location $BffDir ; dotnet restore davi-bff.slnx

# ── [2/6] Replicar configuracion a los proyectos ────────────
Write-Host "`n[2/6] Replicando variables de entorno a los proyectos..."

# -> davi-engine-co2/.env.local
@"
NODE_ENV=local
PORT=$enginePort
DATABASE_URL=$($env:DATABASE_URL)
CORS_ORIGINS=$corsOrigins
"@ | Set-Content "$EngineDir\.env.local" -Encoding UTF8
Write-Host "   -> davi-engine-co2/.env.local"

# -> davi-bff/davi.web-api/appsettings.Development.json
@"
{
  "ConnectionStrings": {
    "Postgres": "Host=${pgHost};Port=${pgPort};Database=$($env:POSTGRES_DB);Username=$($env:POSTGRES_USER);Password=$($env:POSTGRES_PASSWORD)"
  },
  "Engine": {
    "BaseUrl": "http://localhost:$enginePort",
    "TimeoutSeconds": 30
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200", "http://localhost:$bffPort"]
  }
}
"@ | Set-Content "$BffDir\davi.web-api\appsettings.Development.json" -Encoding UTF8
Write-Host "   -> davi-bff/davi.web-api/appsettings.Development.json"

# ── [3/6] Migraciones Drizzle + Seeder ──────────────────────
Write-Host "`n[3/6] Ejecutando migraciones Drizzle..."
Set-Location $EngineDir
$env:NODE_ENV = "local"
npx drizzle-kit migrate

Write-Host "   Ejecutando seeder..."
npx ts-node -r tsconfig-paths/register src/db/drizzle/seed.ts

# ── [4/6] Coverage de tests ─────────────────────────────────
Write-Host "`n[4/6] Ejecutando cobertura de tests..."

Write-Host "   Coverage davi-engine-co2 (Jest)..."
Set-Location $EngineDir
npm run test:coverage
if ($LASTEXITCODE -ne 0) { Write-Warning "Tests del engine con fallos" }

Write-Host "   Coverage davi-bff (xUnit + Coverlet)..."
Set-Location $BffDir
dotnet test davi-bff.slnx `
    --collect:"XPlat Code Coverage" `
    --results-directory ./coverage
if ($LASTEXITCODE -ne 0) { Write-Warning "Tests del BFF con fallos" }

# ── [5/6] Build BFF ─────────────────────────────────────────
Write-Host "`n[5/6] Compilando BFF..."
Set-Location $BffDir
dotnet build davi-bff.slnx --configuration Release --no-restore

# ── [6/6] Iniciar servicios ──────────────────────────────────
Write-Host "`n[6/6] Iniciando servicios..."

$env:NODE_ENV = "local"
$engineProc = Start-Process -FilePath "npm" -ArgumentList "run","dev" `
    -WorkingDirectory $EngineDir `
    -RedirectStandardOutput "$env:TEMP\davi-engine.log" `
    -RedirectStandardError  "$env:TEMP\davi-engine-err.log" `
    -PassThru -WindowStyle Hidden
Write-Host "   Engine iniciado  PID=$($engineProc.Id)  (log: $env:TEMP\davi-engine.log)"

$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://+:$bffPort"
$bffProc = Start-Process -FilePath "dotnet" `
    -ArgumentList "run","--project","davi.web-api/davi.web-api.csproj","--no-build" `
    -WorkingDirectory $BffDir `
    -RedirectStandardOutput "$env:TEMP\davi-bff.log" `
    -RedirectStandardError  "$env:TEMP\davi-bff-err.log" `
    -PassThru -WindowStyle Hidden
Write-Host "   BFF iniciado     PID=$($bffProc.Id)  (log: $env:TEMP\davi-bff.log)"

Write-Host ""
Write-Host "======================================================="
Write-Host "  Deploy completado"
Write-Host ""
Write-Host "  BFF + Swagger  : http://localhost:$bffPort"
Write-Host "  Engine API     : http://localhost:$enginePort"
Write-Host "  Swagger BFF    : http://localhost:$bffPort/swagger"
Write-Host ""
Write-Host "  Frontend (dev) :"
Write-Host "    cd frontend ; npm start"
Write-Host "    -> http://localhost:4200"
Write-Host ""
Write-Host "  Para detener servicios:"
Write-Host "    Stop-Process -Id $($engineProc.Id),$($bffProc.Id)"
Write-Host "======================================================="