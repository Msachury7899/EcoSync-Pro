#!/usr/bin/env bash
# =============================================================================
# deploy/deploy.sh  —  Configura variables de entorno para todos los proyectos
# Requisitos: PostgreSQL configurado
#
# Uso:
#   cd deploy/local
#   cp .env.example .env   # rellenar variables
#   bash ../deploy.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"
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
echo "  DAVI - Configuracion de variables de entorno"
echo "======================================================="

# [1/3] davi-engine-co2/.env
cat > "$ENGINE_DIR/.env" << EOF
NODE_ENV=local
PORT=${ENGINE_PORT:-3000}
DATABASE_URL=${DATABASE_URL}
CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:5000,http://localhost:4200}
EOF
echo "   -> davi-engine-co2/.env"

# [2/3] davi-bff appsettings.Development.json
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

# [3/3] frontend/src/environments/environment.ts
cat > "$FRONTEND_DIR/src/environments/environment.ts" << EOF
export const environment = {
  production: false,
  bffApiUrl: 'http://localhost:${BFF_PORT:-5000}'
};
EOF
echo "   -> frontend/src/environments/environment.ts"

echo ""
echo "======================================================="
echo "  Configuracion completada"
echo ""
echo "  Engine .env        : $ENGINE_DIR/.env"
echo "  BFF appsettings    : $BFF_DIR/davi.web-api/appsettings.Development.json"
echo "  Frontend env       : $FRONTEND_DIR/src/environments/environment.ts"
echo "======================================================="