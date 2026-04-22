# =============================================================================
# Build-time configuration — override with --build-arg at `docker build`
#
#   Monolith (default):
#     docker build -t odin-api .
#
#   Single microservice:
#     docker build --build-arg SERVICE_NAME=jobs -t odin-jobs .
#
# The same image pattern works for every service — only the build arg changes.
# =============================================================================
ARG SERVICE_NAME=""

# =============================================================================
# Stage 1 — Builder
# Installs ALL deps (devDeps needed for esbuild + tsc) and produces the bundle.
# =============================================================================
FROM node:20-alpine AS builder

ARG SERVICE_NAME

WORKDIR /app

# Copy manifests first to leverage Docker layer cache
COPY package.json package-lock.json ./

# Install ALL deps (devDependencies needed for esbuild + tsc)
RUN npm ci

# Copy source and build config
COPY tsconfig.json build.mjs ./
COPY src ./src

# Type-check + esbuild bundle
# Routes automatically to monolith or microservice based on SERVICE_NAME arg:
#   - Empty        → dist/monolith/index.js
#   - "jobs"       → dist/microservices/jobs/index.js
RUN if [ -n "$SERVICE_NAME" ]; then \
      node build.mjs --service="$SERVICE_NAME"; \
    else \
      node build.mjs; \
    fi

# =============================================================================
# Stage 2 — Runner
# Lean production image: bundle + production node_modules only.
#
# IMPORTANT — externals from build.mjs must be present at runtime:
#   @prisma/client, swagger-ui-express, swagger-ui-dist, swagger-jsdoc
#   and any native binaries (bcrypt, sharp…) must be in `dependencies`
#   (not devDependencies) so `npm ci --omit=dev` installs them here.
#
# No .env file is baked in — secrets must come from the host environment
# (AWS Secrets Manager, ECS task definition, or Docker -e flags).
# =============================================================================
FROM node:20-alpine AS runner

# Redeclare ARG so it's accessible in this stage (ARGs don't cross FROM)
ARG SERVICE_NAME

WORKDIR /app

# Bake the target service name into the image as a runtime ENV.
# This is the only knob needed to switch behaviour between monolith / micro.
ENV ODIN_SERVICE=${SERVICE_NAME}

# Copy package manifests and install production dependencies only.
# External libraries that esbuild did NOT bundle (see build.mjs `external` list)
# are resolved from this node_modules at runtime.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the compiled bundle(s) produced by the builder stage
COPY --from=builder /app/dist ./dist

# Regenerate Prisma client binaries for the target OS/arch (Alpine Linux).
# The schema path matches the output directory chosen by build.mjs.
RUN if [ -n "$ODIN_SERVICE" ]; then \
      npx prisma generate --schema="dist/microservices/${ODIN_SERVICE}/schema.prisma"; \
    else \
      npx prisma generate --schema="dist/monolith/schema.prisma"; \
    fi

EXPOSE 3000

# Entry point resolves dynamically from ODIN_SERVICE at container start.
CMD ["sh", "-c", \
  "if [ -n \"$ODIN_SERVICE\" ]; then \
     node dist/microservices/$ODIN_SERVICE/index.js; \
   else \
     node dist/monolith/index.js; \
   fi"]
