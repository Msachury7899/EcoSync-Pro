# =============================================================================
# Stage 1 — Builder
# Installs all deps (devDeps needed for esbuild + tsc) and produces the bundle.
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json build.mjs ./
COPY src ./src

RUN node build.mjs

# =============================================================================
# Stage 2 — Runner
# Lean production image: bundle + production node_modules only.
# Secrets must come from the host environment — no .env baked in.
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/monolith/index.js"]
