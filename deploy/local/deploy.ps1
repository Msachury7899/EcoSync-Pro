#Requires -Version 5.1
# =============================================================================
# deploy/local/deploy.ps1
# Script de despliegue local completo (Windows PowerShell).
# Requisitos: Node 20+, .NET 8 SDK, Docker Desktop, docker-compose
#
# Uso:
#   cd deploy\local
#   Copy-Item .env.example .env   # y rellenar las variables
#   .\deploy.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$RepoRoot  = (Resolve-Path "$PSScriptRoot/../..").Path
$DeployDir = "$RepoRoot\deploy\local"
$EngineDir = "$RepoRoot\davi-engine-co2"
$FrontendDir = "$RepoRoot\frontend"
$BffDir    = "$RepoRoot\davi-bff"

# Cargar .env
if (-not (Test-Path "$DeployDir\.env")) {
    Write-Error "No se encontro $DeployDir\.env. Copia .env.example -> .env y rellena las variables."
    exit 1
}

Get-Content "$DeployDir\.env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
    }
}

Write-Host "======================================================="
Write-Host "  DAVI - Deploy Local (PowerShell)"
Write-Host "======================================================="

# 1. Dependencias engine
Write-Host "`n[1/6] Instalando dependencias davi-engine-co2..."
Set-Location $EngineDir
npm ci

# 2. Dependencias frontend
Write-Host "`n[2/6] Instalando dependencias frontend..."
Set-Location $FrontendDir
npm ci

# 3. Restaurar NuGet BFF
Write-Host "`n[3/6] Restaurando paquetes NuGet BFF..."
Set-Location $BffDir
dotnet restore davi-bff.slnx

# 4. Iniciar PostgreSQL
Write-Host "`n[4/6] Levantando PostgreSQL..."
Set-Location $DeployDir
docker-compose up -d postgres-db

Write-Host "   Esperando PostgreSQL..."
do {
    Start-Sleep -Seconds 2
    docker-compose exec -T postgres-db pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB 2>&1 | Out-Null
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
Write-Host "`n[6/6] Build imagenes y docker-compose up..."
Set-Location $DeployDir
docker-compose build --no-cache
docker-compose up -d

Write-Host ""
Write-Host "======================================================="
Write-Host "  Deploy completado"
Write-Host "  Frontend + BFF : http://localhost:5000"
Write-Host "  Engine API     : http://localhost:3000"
Write-Host "======================================================="
