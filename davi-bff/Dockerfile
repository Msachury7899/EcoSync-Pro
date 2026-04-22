# =============================================================================
# Stage 1 — Angular build
# Contexto de build: raíz del repositorio (prueba-davi/)
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

COPY davi-bff/davi-bff.slnx ./
COPY davi-bff/davi.Application/ ./davi.Application/
COPY davi-bff/davi.Domain/ ./davi.Domain/
COPY davi-bff/davi.Infrastructure/ ./davi.Infrastructure/
COPY davi-bff/davi.Tests/ ./davi.Tests/
COPY davi-bff/davi.web-api/ ./davi.web-api/

RUN dotnet restore davi-bff.slnx
RUN dotnet publish davi.web-api/davi.web-api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

# Copiar el build Angular dentro de wwwroot del BFF
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
