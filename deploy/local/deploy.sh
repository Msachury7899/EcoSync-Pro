#!/usr/bin/env bash
# =============================================================================
# deploy/local/deploy.sh  —  Despliegue local sin Docker
# Requisitos: Node 20+, .NET 8 SDK, PostgreSQL instalado localmente
#
# Uso:
#   cd deploy/local
#   cp .env.example .env   # rellenar variables
#   bash deploy.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy/local"
ENGINE_DIR="$REPO_ROOT/davi-engine-co2"
FRONTEND_DIR="$REPO_ROOT/frontend"
BFF_DIR="$REPO_ROOT/davi-bff"

# Cargar .env
if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
  echo "ERROR: No se encontro $DEPLOY_DIR/.env"
  echo "   Copia .env.example -> .env y rellena las variables."
  exit 1
fi

set -a
source "$DEPLOY_DIR/.env"
set +a

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}"
export DATABASE_URL

echo "======================================================="
echo "  DAVI - Deploy Local"
echo "======================================================="

# [1/6] Instalar dependencias
echo ""
echo "[1/6] Instalando dependencias..."
echo "   davi-engine-co2..."
cd "$ENGINE_DIR" && npm ci
echo "   frontend..."
cd "$FRONTEND_DIR" && npm ci
echo "   davi-bff (NuGet)..."
cd "$BFF_DIR" && dotnet restore davi-bff.slnx

# [2/6] Replicar configuracion a los proyectos
echo ""
echo "[2/6] Replicando variables de entorno a los proyectos..."

cat > "$ENGINE_DIR/.env" << EOF
NODE_ENV=local
PORT=${ENGINE_PORT:-3000}
DATABASE_URL=${DATABASE_URL}
CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:5000,http://localhost:4200}
EOF
echo "   -> davi-engine-co2/.env"

cat > "$BFF_DIR/davi.web-api/appsettings.Development.json" << EOF
{
  "ConnectionStrings": {
    "Postgres": "Host=${POSTGRES_HOST:-localhost};Port=${POSTGRES_PORT:-5432};Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}"
  },
  "Engine": {
    "BaseUrl": "http://localhost:${ENGINE_PORT:-3000}",
    "TimeoutSeconds": 30
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200", "http://localhost:${BFF_PORT:-5000}"]
  }
}
EOF
echo "   -> davi-bff/davi.web-api/appsettings.Development.json"

# [3/6] Migraciones Drizzle + Seeder
echo ""
echo "[3/6] Ejecutando migraciones Drizzle..."
cd "$ENGINE_DIR"
npm run drizzle:migrate

echo "   Ejecutando seeder..."
npm run drizzle:seed

# [4/6] Coverage de tests
echo ""
echo "[4/6] Ejecutando cobertura de tests..."

echo "   Coverage davi-engine-co2 (Jest)..."
cd "$ENGINE_DIR"
NODE_ENV=local npm run test:coverage || echo "   WARN: tests del engine con fallos"

echo "   Coverage davi-bff (xUnit + Coverlet)..."
cd "$BFF_DIR"
dotnet test davi-bff.slnx \
    --collect:"XPlat Code Coverage" \
    --results-directory ./coverage || echo "   WARN: tests del BFF con fallos"

# [5/6] Build BFF
echo ""
echo "[5/6] Compilando BFF..."
cd "$BFF_DIR"
dotnet build davi-bff.slnx --configuration Release --no-restore

# [6/6] Iniciar servicios en segundo plano
echo ""
echo "[6/6] Iniciando servicios..."

cd "$ENGINE_DIR"
NODE_ENV=local npm run dev > /tmp/davi-engine.log 2>&1 &
ENGINE_PID=$!
echo "   Engine iniciado  PID=$ENGINE_PID  (log: /tmp/davi-engine.log)"

cd "$BFF_DIR"
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS="http://+:${BFF_PORT:-5000}" \
dotnet run --project davi.web-api/davi.web-api.csproj --no-build > /tmp/davi-bff.log 2>&1 &
BFF_PID=$!
echo "   BFF iniciado     PID=$BFF_PID  (log: /tmp/davi-bff.log)"

echo ""
echo "======================================================="
echo "  Deploy completado"
echo ""
echo "  BFF + Swagger  : http://localhost:${BFF_PORT:-5000}"
echo "  Engine API     : http://localhost:${ENGINE_PORT:-3000}"
echo "  Swagger BFF    : http://localhost:${BFF_PORT:-5000}/swagger"
echo ""
echo "  Frontend (dev) :"
echo "    cd frontend && npm start"
echo "    -> http://localhost:4200"
echo ""
echo "  Para detener servicios: kill $ENGINE_PID $BFF_PID"
echo "======================================================="