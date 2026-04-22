# Plan de Implementación — Clean Architecture BFF (`davi-bff`)

> Fecha: 2026-04-22  
> Stack: .NET 8 · Clean Architecture · EF Core · PostgreSQL (Npgsql) · xUnit · Moq  
> Objetivo: Implementar los 14 endpoints del contrato `bff-api-endpoints.md` sobre una arquitectura limpia de 3 capas + API.

---

## Decisión de diseño — Repository + Adapter (intercambiabilidad de proveedor)

El BFF necesita dos tipos de integración de datos:

| Origen | Entidades | Mecanismo |
|---|---|---|
| **PostgreSQL directo** | `Plant`, agregaciones Dashboard | `IRepository` → `PostgresRepository` (EF Core) |
| **Engine HTTP** | `FuelType`, `EmissionRecord` | `IPort` → `HttpAdapter` (HttpClient) |

Para garantizar que se pueda cambiar el proveedor de DB (PostgreSQL → MongoDB, Dapper, etc.) sin tocar `Application` ni `Domain`, se aplica la siguiente separación:

```
[ UseCase ]  →  [ IPort (Domain/Ports) ]          ← abstracción de caso de uso
                       ↑
              [ HttpAdapter / DbAdapter ]           ← implementación en Infrastructure
                       ↑
              [ IRepository (Domain/Repositories) ] ← abstracción de acceso a datos
                       ↑
              [ PostgresRepository ]               ← implementación concreta intercambiable
```

**Regla:** `Domain` no sabe si hay HTTP ni Postgres. `Application` solo habla con `IPort`. `Infrastructure` conecta todo.

---

## Estructura de proyectos objetivo

```
davi-bff/
├── davi-bff.slnx
├── davi.web-api/           → Presentation (Composition Root)
├── davi.Domain/            → Entidades + Puertos (interfaces)
├── davi.Application/       → DTOs + Casos de Uso
├── davi.Infrastructure/    → Adapters HTTP + Extensions DI
└── davi.Tests/             → xUnit + Moq
```

### Diagrama de dependencias (Clean Arch)

```
davi.web-api
    ↓ referencia
davi.Application  ←  davi.Infrastructure
    ↓ referencia         ↓ referencia
davi.Domain         davi.Domain
```

> Regla de oro: `davi.Domain` no tiene referencias externas. `davi.Application` solo conoce `davi.Domain`. `davi.Infrastructure` implementa los puertos del dominio. `davi.web-api` es el único Composition Root.

---

## FASE 0 — Scaffolding del Solution

### Checklist

- [ ] Crear `davi.Domain` — `dotnet new classlib`
- [ ] Crear `davi.Application` — `dotnet new classlib` → referencia `davi.Domain`
- [ ] Crear `davi.Infrastructure` — `dotnet new classlib` → referencia `davi.Domain` + `davi.Application`
- [ ] Crear `davi.Tests` — `dotnet new xunit` → referencia `davi.Application` + `davi.Infrastructure`
- [ ] Agregar `davi.Application` + `davi.Infrastructure` como referencias en `davi.web-api`
- [ ] Registrar los 4 proyectos nuevos en `davi-bff.slnx`
- [ ] Eliminar `WeatherForecast.cs` y `WeatherForecastController.cs` (scaffold vacío)
- [ ] Instalar `Moq` en `davi.Tests`
- [ ] Instalar `Microsoft.Extensions.Http` en `davi.Infrastructure`

#### Paquetes NuGet — `davi.Infrastructure`

```
dotnet add davi.Infrastructure package Microsoft.Extensions.Http
dotnet add davi.Infrastructure package Microsoft.EntityFrameworkCore
dotnet add davi.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add davi.Infrastructure package Microsoft.EntityFrameworkCore.Design
```

#### Paquetes NuGet — `davi.web-api`

```
dotnet add davi.web-api package Microsoft.EntityFrameworkCore.Design
```

#### Paquetes NuGet — `davi.Tests`

```
dotnet add davi.Tests package Moq
dotnet add davi.Tests package Microsoft.EntityFrameworkCore.InMemory
```

### Corrección esperada

```
dotnet build davi-bff.slnx  →  Build succeeded, 0 Error(s)
```

---

## FASE 1 — `davi.Domain`

### Estructura de carpetas

```
davi.Domain/
├── Entities/
│   ├── Plant.cs
│   ├── FuelType.cs
│   ├── EmissionRecord.cs
│   ├── EmissionRecordHistory.cs
│   └── PaginatedResult.cs
├── Ports/                          ← abstracción de caso de uso (usada por Application)
│   ├── IPlantPort.cs
│   ├── IFuelTypePort.cs
│   ├── IEmissionRecordPort.cs
│   └── IDashboardPort.cs
└── Repositories/                   ← abstracción de acceso a datos (usada por Infrastructure)
    ├── IPlantRepository.cs         ← acceso directo a DB (engine no expone plants)
    └── IDashboardRepository.cs     ← queries de agregación en DB
```

> **Ports vs Repositories:**
> - `IPort` — contrato de negocio. `Application` lo consume. Puede ser HTTP o DB.
> - `IRepository` — contrato de datos. Solo `Infrastructure` lo consume internamente. Permite intercambiar EF Core por Dapper/ADO.NET/MongoDB sin tocar `Application`.

### Checklist — Entities

- [ ] `Plant` — `Id`, `Name`, `MonthlyLimitTco2`, `CreatedAt`
- [ ] `FuelType` — `Id`, `Name`, `Description`, `Units` (`List<string>`), `CreatedAt`
- [ ] `EmissionRecord` — `Id`, `PlantId`, `PlantName`, `FuelTypeId`, `FuelTypeName`, `Quantity`, `Unit`, `FactorSnapshot`, `Tco2Calculated`, `Status`, `RecordedDate`, `Notes`, `CreatedAt`, `UpdatedAt`
- [ ] `EmissionRecordHistory` — `Id`, `EmissionRecordId`, `Action`, `PreviousStatus`, `NewStatus`, `ChangedBy`, `Metadata`, `CreatedAt`
- [ ] `PaginatedResult<T>` — `Data`, `Page`, `Limit`, `TotalCount`, `TotalPages` (calculado)

### Checklist — Ports (abstracciones de caso de uso)

- [ ] `IPlantPort`
  - `Task<IEnumerable<Plant>> GetAllAsync()`
  - `Task<Plant?> GetByIdAsync(string id)`
- [ ] `IFuelTypePort`
  - `Task<IEnumerable<FuelType>> GetAllAsync()`
  - `Task<FuelType?> GetByIdAsync(string id)`
- [ ] `IEmissionRecordPort`
  - `Task<EmissionRecord> CreateAsync(CreateEmissionRecordCommand command)`
  - `Task<PaginatedResult<EmissionRecord>> GetAllAsync(EmissionRecordQuery query)`
  - `Task<EmissionRecord?> GetByIdAsync(string id)`
  - `Task<EmissionRecord> AuditAsync(string id, string? auditedBy)`
  - `Task<IEnumerable<EmissionRecordHistory>> GetHistoryAsync(string id)`
  - `Task<ExportResult> ExportAsync(ExportEmissionRecordQuery query)`
- [ ] `IDashboardPort`
  - `Task<ComplianceData> GetComplianceAsync(string plantId, int year)`
  - `Task<TrendData> GetTrendAsync(string plantId, string month)`
  - `Task<FuelBreakdownData> GetFuelBreakdownAsync(string plantId, string month)`
  - `Task<SummaryData> GetSummaryAsync(string plantId, string month)`

### Checklist — Repositories (abstracciones de acceso a datos)

> Solo `Infrastructure` las implementa. Permiten intercambiar el proveedor de DB sin tocar `Application`.

- [ ] `IPlantRepository`
  - `Task<IEnumerable<Plant>> GetAllAsync()`
  - `Task<Plant?> GetByIdAsync(string id)`
- [ ] `IDashboardRepository`
  - `Task<decimal> GetMonthlyTco2Async(string plantId, int year, int month)`
  - `Task<IEnumerable<(DateTime Date, decimal Tco2)>> GetDailyTco2Async(string plantId, string month)`
  - `Task<IEnumerable<(string FuelTypeId, string FuelTypeName, decimal Tco2)>> GetFuelBreakdownAsync(string plantId, string month)`
  - `Task<int> GetRecordCountAsync(string plantId, string month)`

### Corrección esperada

```
dotnet build davi.Domain/davi.Domain.csproj  →  0 Error(s)
```

---

## FASE 2 — `davi.Application`

### Estructura de carpetas

```
davi.Application/
├── DTOs/
│   ├── Plants/
│   │   └── PlantDto.cs
│   ├── FuelTypes/
│   │   └── FuelTypeDto.cs
│   ├── EmissionRecords/
│   │   ├── CreateEmissionRecordRequest.cs
│   │   ├── EmissionRecordDto.cs
│   │   ├── EmissionRecordFilters.cs
│   │   ├── AuditEmissionRecordRequest.cs
│   │   └── ExportEmissionRecordFilters.cs
│   └── Dashboard/
│       ├── ComplianceResponse.cs
│       ├── TrendResponse.cs
│       ├── FuelBreakdownResponse.cs
│       └── SummaryResponse.cs
├── UseCases/
│   ├── Plants/
│   │   ├── GetPlantsUseCase.cs
│   │   └── GetPlantByIdUseCase.cs
│   ├── FuelTypes/
│   │   ├── GetFuelTypesUseCase.cs
│   │   └── GetFuelTypeByIdUseCase.cs
│   ├── EmissionRecords/
│   │   ├── CreateEmissionRecordUseCase.cs
│   │   ├── GetEmissionRecordsUseCase.cs
│   │   ├── GetEmissionRecordByIdUseCase.cs
│   │   ├── AuditEmissionRecordUseCase.cs
│   │   ├── GetEmissionRecordHistoryUseCase.cs
│   │   └── ExportEmissionRecordsUseCase.cs
│   └── Dashboard/
│       ├── GetComplianceUseCase.cs
│       ├── GetTrendUseCase.cs
│       ├── GetFuelBreakdownUseCase.cs
│       └── GetSummaryUseCase.cs
└── Extensions/
    └── ApplicationExtensions.cs
```

### Checklist — DTOs

- [ ] `PlantDto` — mapea de `Plant` entity
- [ ] `FuelTypeDto` — mapea de `FuelType` entity (incluye `Units[]`)
- [ ] `CreateEmissionRecordRequest` — `PlantId`, `FuelTypeId`, `Quantity`, `Unit`, `RecordedDate`, `Notes`
- [ ] `EmissionRecordDto` — todos los campos enriquecidos (`PlantName`, `FuelTypeName`)
- [ ] `EmissionRecordFilters` — `PlantId?`, `Status?`, `FromDate?`, `ToDate?`, `Page` (default 1), `Limit` (default 20)
- [ ] `AuditEmissionRecordRequest` — `AuditedBy?`
- [ ] `ExportEmissionRecordFilters` — `PlantId?`, `Status?`, `FromDate?`, `ToDate?`, `Format` (default `csv`)
- [ ] `ComplianceResponse` — `PlantId`, `PlantName`, `MonthlyLimitTco2`, `Months[]`
- [ ] `TrendResponse` — `PlantId`, `Month`, `MonthlyLimitTco2`, `Days[]`
- [ ] `FuelBreakdownResponse` — `PlantId`, `Month`, `TotalTco2`, `Breakdown[]`
- [ ] `SummaryResponse` — `PlantId`, `Month`, `TotalTco2`, `MonthlyLimitTco2`, `PercentOfLimit`, `TotalRecords`, `RemainingDays`, `Status`

### Checklist — Use Cases

> Patrón: constructor recibe el puerto via inyección. Método `ExecuteAsync(...)` retorna el DTO.

- [ ] `GetPlantsUseCase` — llama `IPlantPort.GetAllAsync()` → `IEnumerable<PlantDto>`
- [ ] `GetPlantByIdUseCase` — llama `IPlantPort.GetByIdAsync(id)` → `PlantDto?` (lanza `KeyNotFoundException` si null)
- [ ] `GetFuelTypesUseCase` — llama `IFuelTypePort.GetAllAsync()` → `IEnumerable<FuelTypeDto>`
- [ ] `GetFuelTypeByIdUseCase` — llama `IFuelTypePort.GetByIdAsync(id)` → `FuelTypeDto?`
- [ ] `CreateEmissionRecordUseCase` — mapea request → command → llama port → retorna `EmissionRecordDto`
- [ ] `GetEmissionRecordsUseCase` — llama `IEmissionRecordPort.GetAllAsync(query)` → `PaginatedResult<EmissionRecordDto>`
- [ ] `GetEmissionRecordByIdUseCase` — llama `IEmissionRecordPort.GetByIdAsync(id)` → `EmissionRecordDto?`
- [ ] `AuditEmissionRecordUseCase` — llama `IEmissionRecordPort.AuditAsync(id, auditedBy)` → `EmissionRecordDto`
- [ ] `GetEmissionRecordHistoryUseCase` — llama `IEmissionRecordPort.GetHistoryAsync(id)` → `IEnumerable<EmissionRecordHistoryDto>`
- [ ] `ExportEmissionRecordsUseCase` — llama `IEmissionRecordPort.ExportAsync(query)` → `ExportResult`
- [ ] `GetComplianceUseCase` → `ComplianceResponse`
- [ ] `GetTrendUseCase` → `TrendResponse`
- [ ] `GetFuelBreakdownUseCase` → `FuelBreakdownResponse`
- [ ] `GetSummaryUseCase` → `SummaryResponse`

### Checklist — Extensions

- [ ] `ApplicationExtensions.AddApplication(IServiceCollection)` — registra todos los use cases con `AddScoped`

### Corrección esperada

```
dotnet build davi.Application/davi.Application.csproj  →  0 Error(s)
```

---

## FASE 3 — `davi.Infrastructure`

### Estructura de carpetas

```
davi.Infrastructure/
├── Configuration/
│   └── EngineOptions.cs                   ← record con BaseUrl del engine
├── Persistence/
│   ├── BffDbContext.cs                    ← DbContext EF Core (solo tablas que el BFF lee)
│   └── Configurations/
│       └── PlantConfiguration.cs          ← IEntityTypeConfiguration<Plant>
├── Repositories/                          ← implementaciones intercambiables de IRepository
│   ├── PlantPostgresRepository.cs         ← IPlantRepository vía EF Core + Npgsql
│   └── DashboardPostgresRepository.cs     ← IDashboardRepository vía EF Core + Npgsql
├── HttpAdapters/                          ← adaptadores HTTP al engine
│   ├── PlantAdapter.cs                    ← IPlantPort → usa IPlantRepository (DB)
│   ├── FuelTypeAdapter.cs                 ← IFuelTypePort → proxy HTTP engine
│   ├── EmissionRecordAdapter.cs           ← IEmissionRecordPort → proxy HTTP engine
│   └── DashboardAdapter.cs                ← IDashboardPort → usa IDashboardRepository (DB)
└── Extensions/
    └── InfrastructureExtensions.cs
```

### Checklist — Configuration

- [ ] `EngineOptions` — `record` con `string BaseUrl`
- [ ] Bind desde `appsettings.json` sección `"Engine"`

### Checklist — Persistence (EF Core + PostgreSQL)

- [ ] `BffDbContext` extiende `DbContext`
  - `DbSet<Plant> Plants`
  - `DbSet<EmissionRecord> EmissionRecords` (solo lectura para Dashboard)
  - `DbSet<EmissionRecordHistory> EmissionRecordHistories` (solo lectura para Dashboard)
  - `DbSet<FuelType> FuelTypes` (solo lectura)
  - `OnModelCreating` → aplica configuraciones de `Configurations/`
- [ ] `PlantConfiguration : IEntityTypeConfiguration<Plant>`
  - Mapea tabla `plants`, columnas snake_case, PK, índices únicos
- [ ] Cadena de conexión en `appsettings.json`:
  ```json
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Port=5432;Database=ecosync;Username=postgres;Password=secret"
  }
  ```

> **Principio de intercambiabilidad:** para cambiar de EF Core + Npgsql a Dapper o MongoDB,
> solo se reemplazan `PlantPostgresRepository` y `DashboardPostgresRepository`. El resto del sistema no cambia.

### Checklist — Repositories

- [ ] `PlantPostgresRepository : IPlantRepository`
  - `GetAllAsync()` → `dbContext.Plants.AsNoTracking().ToListAsync()`
  - `GetByIdAsync(id)` → `dbContext.Plants.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id)`
- [ ] `DashboardPostgresRepository : IDashboardRepository`
  - `GetMonthlyTco2Async(plantId, year, month)` → query EF por `plantId`, año y mes sobre `EmissionRecords`
  - `GetDailyTco2Async(plantId, month)` → agrupa `EmissionRecords` por día
  - `GetFuelBreakdownAsync(plantId, month)` → `JOIN` con `FuelTypes`, agrupa por `fuelTypeId`
  - `GetRecordCountAsync(plantId, month)` → count con filtros de plantId y mes

### Checklist — HttpAdapters

- [ ] `PlantAdapter : IPlantPort` — delega a `IPlantRepository` (sin HTTP, acceso directo a DB)
  - Constructor: `PlantAdapter(IPlantRepository repository)`
  - `GetAllAsync()` → `repository.GetAllAsync()`
  - `GetByIdAsync(id)` → `repository.GetByIdAsync(id)`
- [ ] `FuelTypeAdapter : IFuelTypePort` — proxy HTTP al engine
  - `GetAllAsync()` → `GET {BaseUrl}/api/v1/emissions/fuel-types`
  - `GetByIdAsync(id)` → `GET {BaseUrl}/api/v1/emissions/fuel-types/{id}`
- [ ] `EmissionRecordAdapter : IEmissionRecordPort` — proxy HTTP al engine
  - `CreateAsync` → `POST {BaseUrl}/api/v1/emissions/emission-records`
  - `GetAllAsync` → `GET {BaseUrl}/api/v1/emissions/emission-records?{querystring}`
  - `GetByIdAsync` → `GET {BaseUrl}/api/v1/emissions/emission-records/{id}`
  - `AuditAsync` → `PATCH {BaseUrl}/api/v1/emissions/emission-records/{id}/audit`
  - `GetHistoryAsync` → `GET {BaseUrl}/api/v1/emissions/emission-records/{id}/history`
  - `ExportAsync` → `GET {BaseUrl}/api/v1/emissions/emission-records/export?{querystring}`
- [ ] `DashboardAdapter : IDashboardPort` — usa `IDashboardRepository` (sin HTTP)
  - Constructor: `DashboardAdapter(IDashboardRepository repository, IPlantRepository plantRepository)`
  - `GetComplianceAsync` → agrega 12 meses vía `repository.GetMonthlyTco2Async` + `plantRepository.GetByIdAsync`
  - `GetTrendAsync` → usa `repository.GetDailyTco2Async`
  - `GetFuelBreakdownAsync` → usa `repository.GetFuelBreakdownAsync`, calcula porcentajes
  - `GetSummaryAsync` → compone los 4 KPIs con llamadas al repository

### Checklist — Extensions

- [ ] `InfrastructureExtensions.AddInfrastructure(IServiceCollection, IConfiguration)`
  - `services.AddDbContext<BffDbContext>(opt => opt.UseNpgsql(config.GetConnectionString("Postgres")))`
  - `services.Configure<EngineOptions>(config.GetSection("Engine"))`
  - `services.AddHttpClient("engine", ...)` con `BaseAddress` desde `EngineOptions`
  - `services.AddScoped<IPlantRepository, PlantPostgresRepository>()`
  - `services.AddScoped<IDashboardRepository, DashboardPostgresRepository>()`
  - `services.AddScoped<IPlantPort, PlantAdapter>()`
  - `services.AddScoped<IFuelTypePort, FuelTypeAdapter>()`
  - `services.AddScoped<IEmissionRecordPort, EmissionRecordAdapter>()`
  - `services.AddScoped<IDashboardPort, DashboardAdapter>()`

### Corrección esperada

```
dotnet build davi.Infrastructure/davi.Infrastructure.csproj  →  0 Error(s)
```

---

## FASE 4 — `davi.web-api` (Presentation)

### Estructura de carpetas nuevas

```
davi.web-api/
├── Controllers/
│   ├── PlantsController.cs
│   ├── FuelTypesController.cs
│   ├── EmissionRecordsController.cs
│   └── DashboardController.cs
├── appsettings.json               ← agregar sección "Engine"
└── Program.cs                     ← registrar .AddApplication() + .AddInfrastructure()
```

### Checklist — Controllers

**`PlantsController`** — Route: `api/v1/plants`
- [ ] `GET /` → `GetPlantsUseCase.ExecuteAsync()` → `200 OK`
- [ ] `GET /{id}` → `GetPlantByIdUseCase.ExecuteAsync(id)` → `200 OK` / `404 Not Found`

**`FuelTypesController`** — Route: `api/v1/fuel-types`
- [ ] `GET /` → `GetFuelTypesUseCase.ExecuteAsync()` → `200 OK`
- [ ] `GET /{id}` → `GetFuelTypeByIdUseCase.ExecuteAsync(id)` → `200 OK` / `404 Not Found`

**`EmissionRecordsController`** — Route: `api/v1/emission-records`
- [ ] `POST /` → `CreateEmissionRecordUseCase.ExecuteAsync(request)` → `201 Created`
- [ ] `GET /` → `GetEmissionRecordsUseCase.ExecuteAsync(filters)` → `200 OK` con paginación
- [ ] `GET /export` → `ExportEmissionRecordsUseCase.ExecuteAsync(filters)` → `200 File`
- [ ] `GET /{id}` → `GetEmissionRecordByIdUseCase.ExecuteAsync(id)` → `200 OK` / `404`
- [ ] `PATCH /{id}/audit` → `AuditEmissionRecordUseCase.ExecuteAsync(id, request)` → `200 OK`
- [ ] `GET /{id}/history` → `GetEmissionRecordHistoryUseCase.ExecuteAsync(id)` → `200 OK`

**`DashboardController`** — Route: `api/v1/dashboard`
- [ ] `GET /compliance?plantId=&year=` → `GetComplianceUseCase.ExecuteAsync(plantId, year)` → `200 OK`
- [ ] `GET /trend?plantId=&month=` → `GetTrendUseCase.ExecuteAsync(plantId, month)` → `200 OK`
- [ ] `GET /fuel-breakdown?plantId=&month=` → `GetFuelBreakdownUseCase.ExecuteAsync(plantId, month)` → `200 OK`
- [ ] `GET /summary?plantId=&month=` → `GetSummaryUseCase.ExecuteAsync(plantId, month)` → `200 OK`

### Checklist — Variables de entorno

.NET resuelve configuración en este orden de prioridad (mayor gana):
```
appsettings.json  <  appsettings.{Environment}.json  <  Variables de entorno
```

Las variables de entorno usan `__` (doble guion bajo) como separador de secciones:

| Variable de entorno | Sección en appsettings | Descripción |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | — | `Development` / `Staging` / `Production` |
| `ASPNETCORE_URLS` | — | Puertos donde escucha la API (ej: `http://+:8080`) |
| `ConnectionStrings__Postgres` | `ConnectionStrings.Postgres` | Cadena de conexión PostgreSQL |
| `Engine__BaseUrl` | `Engine.BaseUrl` | URL base del motor davi-engine-co2 |
| `Engine__TimeoutSeconds` | `Engine.TimeoutSeconds` | Timeout en segundos del HttpClient al engine |

> Archivo de referencia: `davi.web-api/appsettings.example.json`  
> **Nunca** commitear credenciales reales. Usar variables de entorno en CI/CD y contenedores.

### Checklist — Program.cs + appsettings.json

- [ ] `builder.Services.AddApplication()` en `Program.cs`
- [ ] `builder.Services.AddInfrastructure(builder.Configuration)` en `Program.cs`
- [ ] `appsettings.json` — valores de placeholder (sin credenciales reales):
  ```json
  {
    "ConnectionStrings": {
      "Postgres": ""
    },
    "Engine": {
      "BaseUrl": "",
      "TimeoutSeconds": 30
    }
  }
  ```
- [ ] `appsettings.Development.json` — valores locales para desarrollo (en `.gitignore`):
  ```json
  {
    "ConnectionStrings": {
      "Postgres": "Host=localhost;Port=5432;Database=ecosync;Username=postgres;Password=secret"
    },
    "Engine": {
      "BaseUrl": "http://localhost:3000",
      "TimeoutSeconds": 30
    }
  }
  ```
- [ ] `appsettings.example.json` — guía de todas las variables (sí se commitea, con valores de ejemplo)
- [ ] Agregar `appsettings.Development.json` al `.gitignore`
- [ ] `EngineOptions` extendido con `int TimeoutSeconds` para configurar `HttpClient.Timeout`
- [ ] Eliminar `WeatherForecast.cs`
- [ ] Eliminar `WeatherForecastController.cs`

### Corrección esperada

```
dotnet build davi.web-api/davi.web-api.csproj  →  0 Error(s)
dotnet run --project davi.web-api  →  Swagger disponible en /swagger
```

---

## FASE 5 — `davi.Tests` (xUnit + Moq)

### Estructura de carpetas

```
davi.Tests/
├── UseCases/
│   ├── Plants/
│   │   ├── GetPlantsUseCaseTests.cs
│   │   └── GetPlantByIdUseCaseTests.cs
│   ├── FuelTypes/
│   │   ├── GetFuelTypesUseCaseTests.cs
│   │   └── GetFuelTypeByIdUseCaseTests.cs
├── Repositories/
│   ├── PlantPostgresRepositoryTests.cs    ← usa EF Core InMemory provider
│   └── DashboardPostgresRepositoryTests.cs
│   ├── EmissionRecords/
│   │   ├── CreateEmissionRecordUseCaseTests.cs
│   │   ├── GetEmissionRecordsUseCaseTests.cs
│   │   ├── GetEmissionRecordByIdUseCaseTests.cs
│   │   ├── AuditEmissionRecordUseCaseTests.cs
│   │   ├── GetEmissionRecordHistoryUseCaseTests.cs
│   │   └── ExportEmissionRecordsUseCaseTests.cs
│   └── Dashboard/
│       ├── GetComplianceUseCaseTests.cs
│       ├── GetTrendUseCaseTests.cs
│       ├── GetFuelBreakdownUseCaseTests.cs
│       └── GetSummaryUseCaseTests.cs
```

### Patrón de test — Use Cases (Moq sobre puertos)

```csharp
// Arrange
var mockPort = new Mock<I{Entidad}Port>();
mockPort.Setup(p => p.{Metodo}(...)).ReturnsAsync({dato});
var useCase = new {CasoDeUso}(mockPort.Object);

// Act
var result = await useCase.ExecuteAsync(...);

// Assert
Assert.NotNull(result);
mockPort.Verify(p => p.{Metodo}(...), Times.Once);
```

### Patrón de test — Repositories (EF Core InMemory)

```csharp
// Arrange — base de datos en memoria, intercambiable con Postgres en CI/CD
var options = new DbContextOptionsBuilder<BffDbContext>()
    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
    .Options;

await using var context = new BffDbContext(options);
context.Plants.Add(new Plant { Id = "1", Name = "Planta Norte", MonthlyLimitTco2 = 150m, CreatedAt = DateTime.UtcNow });
await context.SaveChangesAsync();

var repo = new PlantPostgresRepository(context);

// Act
var result = await repo.GetAllAsync();

// Assert
Assert.Single(result);
```

> El uso de `InMemory` valida la lógica de queries. Para validar SQL real usar `Testcontainers.PostgreSql` en tests de integración (fuera de scope de esta fase).

### Checklist por archivo de test

**Plants**
- [ ] `GetPlantsUseCaseTests` — retorna lista de plantas / lista vacía
- [ ] `GetPlantByIdUseCaseTests` — retorna planta existente / lanza excepción si no existe

**Repositories**
- [ ] `PlantPostgresRepositoryTests`
  - `GetAllAsync` retorna todas las plantas seeded
  - `GetByIdAsync` retorna planta por id / `null` si no existe
- [ ] `DashboardPostgresRepositoryTests`
  - `GetMonthlyTco2Async` suma correctamente tco2 del mes
  - `GetDailyTco2Async` agrupa por día con valores correctos
  - `GetFuelBreakdownAsync` agrupa por fuelType y retorna suma correcta
  - `GetRecordCountAsync` cuenta solo registros del mes y planta indicados

**FuelTypes**
- [ ] `GetFuelTypesUseCaseTests` — retorna lista de fuel types
- [ ] `GetFuelTypeByIdUseCaseTests` — retorna fuel type existente / null si no existe

**EmissionRecords**
- [ ] `CreateEmissionRecordUseCaseTests` — crea registro y retorna DTO con campos enriquecidos
- [ ] `GetEmissionRecordsUseCaseTests` — retorna resultado paginado / respeta filtros
- [ ] `GetEmissionRecordByIdUseCaseTests` — retorna registro / null si no existe
- [ ] `AuditEmissionRecordUseCaseTests` — cambia status a `audited` / verifica `auditedBy`
- [ ] `GetEmissionRecordHistoryUseCaseTests` — retorna historial del registro
- [ ] `ExportEmissionRecordsUseCaseTests` — retorna `ExportResult` con `ContentType` y bytes

**Dashboard**
- [ ] `GetComplianceUseCaseTests` — retorna meses con `status` calculado (`ok`/`warning`/`exceeded`)
- [ ] `GetTrendUseCaseTests` — retorna días con `tco2` acumulado
- [ ] `GetFuelBreakdownUseCaseTests` — retorna breakdown con porcentajes que suman 100
- [ ] `GetSummaryUseCaseTests` — retorna KPIs con `percentOfLimit` calculado

### Corrección esperada

```
dotnet test davi.Tests/davi.Tests.csproj  →  All tests passed
```

---

## Variables de entorno — referencia completa

> Esta sección es la fuente de verdad para DevOps / CI/CD / Docker.  
> El archivo `davi.web-api/appsettings.example.json` es la representación JSON de esta tabla.

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Sí | `Development` | Entorno activo. Acepta `Development`, `Staging`, `Production` |
| `ASPNETCORE_URLS` | No | `http://localhost:5000` | URL(s) donde escucha el proceso. Ej: `http://+:8080` en contenedor |
| `ConnectionStrings__Postgres` | Sí | — | Cadena de conexión completa a PostgreSQL. Formato Npgsql: `Host=...;Port=5432;Database=...;Username=...;Password=...` |
| `Engine__BaseUrl` | Sí | — | URL base del `davi-engine-co2`. Ej: `http://engine:3000` en Docker, `http://localhost:3000` en local |
| `Engine__TimeoutSeconds` | No | `30` | Timeout en segundos del `HttpClient` que hace proxy al engine |

### Cómo inyectar en Docker Compose

```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Production
  - ASPNETCORE_URLS=http://+:8080
  - ConnectionStrings__Postgres=Host=db;Port=5432;Database=ecosync;Username=postgres;Password=${POSTGRES_PASSWORD}
  - Engine__BaseUrl=http://engine:3000
  - Engine__TimeoutSeconds=30
```

### Cómo inyectar en GitHub Actions

```yaml
env:
  ConnectionStrings__Postgres: ${{ secrets.POSTGRES_CONNECTION_STRING }}
  Engine__BaseUrl: ${{ secrets.ENGINE_BASE_URL }}
```

---

## Criterios de aceptación global

| Verificación | Comando | Resultado esperado |
|---|---|---|
| Compilación completa | `dotnet build davi-bff.slnx` | `0 Error(s)` |
| Tests unitarios | `dotnet test davi.Tests/davi.Tests.csproj` | `All tests passed` |
| Swagger accesible | `dotnet run --project davi.web-api` | `/swagger` disponible |
| 14 endpoints registrados | Inspección Swagger UI | 4 grupos · 14 rutas |
| Sin referencias circulares | `dotnet build` con warnings | `0 Warning(s)` críticos |

---

## Orden de implementación recomendado

```
FASE 0  →  FASE 1  →  FASE 2  →  FASE 5 (esqueletos de test)
                                       ↓
                              FASE 3  →  FASE 4
                                       ↓
                              FASE 5 (completar tests)
```

> Los tests se escriben en paralelo con Application. Se completan después de Infrastructure.
