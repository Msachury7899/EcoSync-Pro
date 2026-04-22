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
  echo "ERROR: No se encontró $DEPLOY_DIR/.env"
  echo "   Copia .env.example -> .env y rellena las variables requeridas."
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$DEPLOY_DIR/.env"
set +a

echo "======================================================="
echo "  DAVI - Deploy Local"
echo "======================================================="

# -------------------------------------------------------------
# 1. Instalar dependencias — engine-co2
# -------------------------------------------------------------
echo ""
echo "[1/6] Instalando dependencias de davi-engine-co2..."
cd "$ENGINE_DIR"
npm ci

# -------------------------------------------------------------
# 2. Instalar dependencias — frontend
# -------------------------------------------------------------
echo ""
echo "[2/6] Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
npm ci

# -------------------------------------------------------------
# 3. Restaurar paquetes NuGet — BFF
# -------------------------------------------------------------
echo ""
echo "[3/6] Restaurando paquetes NuGet del BFF..."
cd "$BFF_DIR"
dotnet restore davi-bff.slnx

# -------------------------------------------------------------
# 4. Iniciar PostgreSQL para ejecutar migraciones desde el host
# -------------------------------------------------------------
echo ""
echo "[4/6] Levantando PostgreSQL para migraciones..."
cd "$DEPLOY_DIR"
docker-compose up -d postgres-db

echo "   Esperando a que PostgreSQL este listo..."
until docker-compose exec -T postgres-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
  sleep 2
done
echo "   PostgreSQL listo."

# -------------------------------------------------------------
# 5. Migraciones Drizzle + Seeder
# -------------------------------------------------------------
echo ""
echo "[5/6] Ejecutando migraciones Drizzle..."
cd "$ENGINE_DIR"

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
  npx drizzle-kit migrate

echo "   Ejecutando seeder..."
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
  npx ts-node -r tsconfig-paths/register src/db/drizzle/seed.ts

# -------------------------------------------------------------
# 6. Build de imágenes y docker-compose up
# -------------------------------------------------------------
echo ""
echo "[6/6] Construyendo imagenes y levantando servicios..."
cd "$DEPLOY_DIR"
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "======================================================="
echo "  Deploy completado"
echo ""
echo "  Frontend + BFF : http://localhost:5000"
echo "  Engine API     : http://localhost:3000"
echo "  Swagger BFF    : http://localhost:5000/swagger (solo Development)"
echo "======================================================="
