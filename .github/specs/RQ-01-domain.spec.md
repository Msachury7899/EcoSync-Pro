---
id: SPEC-001
status: IMPLEMENTED
feature: RQ-01-domain-driven-design-layer
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs: []
---

# Spec: Construcción de la Capa de Dominio DDD del Cotizador de Daños

> **Estado:** `IMPLEMENTED` — Capa de dominio implementada. QA completado el 2026-03-30.
> **Ciclo de vida:** APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Construcción de la capa de dominio (`src/domain/`) siguiendo principios de Domain-Driven Design (DDD). Esta capa contendrá todas las entidades, value objects, agregados, contratos (interfaces), servicios de dominio y repositorios que encapsulen la lógica de negocio del cotizador de daños sin dependencias de infraestructura.

### Requerimiento de Negocio

La capa de dominio debe hablar por sí sola cuando un desarrollador la revise. Debe ser clara, autoexplicativa y alineada con las reglas de negocio y los casos de uso definidos. Esto permitirá que cualquier miembro del equipo pueda trabajar eficientemente en el desarrollo y mantenimiento del sistema.

### Historias de Usuario

#### HU-01: Construir Entidades de Dominio (Quotation y Location)

```
Como:        Desarrollador backend
Quiero:      Crear las entidades principales Quotation (raíz de agregado) y Location
Para:        Encapsular la identidad, estado y ciclo de vida de las cotizaciones y ubicaciones

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna
Capa:        Backend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Quotation se construye con folioNumber único e inmutable
  Dado que:  No existe una cotización con ese folioNumber
  Cuando:    Se instancia Quotation con folioNumber, insuredData y businessType
  Entonces:  La entidad se crea exitosamente con version=1 y metadata.createdAt asignados automáticamente

CRITERIO-1.2: Location se crea con índice y datos mínimos requeridos
  Dado que:  Se asocia una Location a un Quotation
  Cuando:    Se instancia Location con index, locationName y address
  Entonces:  La entidad se crea así como parte del agregado QuotationAggregate

CRITERIO-1.3: Quotation mantiene una lista de Location[] como entidades internas
  Dado que:  Un Quotation tiene 3 ubicaciones registradas
  Cuando:    Se accede a quotation.locations
  Entonces:  Se retorna un array de entidades Location[]
```

**Error Path**
```gherkin
CRITERIO-1.4: Quotation lanza error si folioNumber es nulo o vacío
  Dado que:  Se intenta crear Quotation sin folioNumber
  Cuando:    Se ejecuta new Quotation({ folioNumber: null })
  Entonces:  Lanza DomainError con mensaje "folioNumber es obligatorio"

CRITERIO-1.5: Location lanza error si index es negativo
  Dado que:  Se intenta crear Location con índice inválido
  Cuando:    Se ejecuta new Location({ index: -1 })
  Entonces:  Lanza DomainError con mensaje "index no puede ser negativo"
```

---

#### HU-02: Construir Value Objects de Dominio

```
Como:        Desarrollador backend
Quiero:      Crear todos los value objects encapsulados (InsuredData, Address, Business, Guarantee, etc.)
Para:        Validar datos de forma inmutable y reutilizable sin duplicar lógica de validación

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: InsuredData se construye con name, taxId y contactInfo validados
  Dado que:  Se instancia InsuredData con datos válidos
  Cuando:    Se ejecuta new InsuredData({ name: "Empresa ABC", taxId: "RFC123", contactInfo: {...} })
  Entonces:  Se crea exitosamente y es inmutable (no permite reassignación)

CRITERIO-2.2: Address agrupa todos los campos de ubicación geográfica
  Dado que:  Se necesitan datos de dirección en Location
  Cuando:    Se crea Location con address: Address
  Entonces:  Address contiene street, postalCode, neighborhood, municipality, state, city

CRITERIO-2.3: Business encapsula fireKey como dato obligatorio
  Dado que:  location.business está presente
  Cuando:    Se accede a location.business.fireKey
  Entonces:  Retorna el código de clave de incendio validado

CRITERIO-2.4: Guarantee encapsula datos de garantía tarifable
  Dado que:  Se instancia Guarantee con rate e isTariffable
  Cuando:    guarantee.isTariffable === true
  Entonces:  La garantía se considera en el cálculo de prima
```

**Error Path**
```gherkin
CRITERIO-2.5: InsuredData lanza error si taxId no cumple formato
  Dado que:  Se intenta crear InsuredData con taxId inválido
  Cuando:    Se ejecuta new InsuredData({ taxId: "INVALID" })
  Entonces:  Lanza DomainError con mensaje "taxId no cumple formato obligatorio"

CRITERIO-2.6: Address lanza error si postalCode está vacío
  Dado que:  Se intenta crear Address sin postalCode
  Cuando:    Se ejecuta new Address({ postalCode: "" })
  Entonces:  Lanza DomainError con mensaje "postalCode es obligatorio"
```

---

#### HU-03: Construir Aggregate QuotationAggregate

```
Como:        Desarrollador backend
Quiero:      Crear el agregado raíz que encapsule invariantes de negocio
Para:        Garantizar que Quotation y Location[] se actualicen de forma consistente

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, HU-02
Capa:        Backend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: QuotationAggregate incrementa version en cada escritura
  Dado que:  Una cotización tiene version=5 actualmente
  Cuando:    Se edita una sección (ej: coverageOptions)
  Entonces:  La version se incrementa a 6 automáticamente

CRITERIO-3.2: QuotationAggregate actualiza lastUpdateDate en cada modificación
  Dado que:  Se modifica coverageOptions
  Cuando:    Se ejecuta la actualización
  Entonces:  metadata.lastUpdateDate se actualiza a la fecha/hora actual (UTC)

CRITERIO-3.3: QuotationAggregate protege invariante de folioNumber único
  Dado que:  Existe una cotización con folioNumber="FOLIO-001"
  Cuando:    Se intenta crear otra con el mismo folioNumber
  Entonces:  El repositorio rechaza la operación (handled en infraestructure, dominio define interfaz)
```

**Error Path**
```gherkin
CRITERIO-3.4: Location dentro del agregado no puede calcularse si está incompleta
  Dado que:  location.postalCode es null
  Cuando:    Se intenta calcular prima para esa ubicación
  Entonces:  Se genera ValidationAlert pero no bloquea el cálculo de otras ubicaciones
```

---

#### HU-04: Construir Contratos de Casos de Uso

```
Como:        Desarrollador backend
Quiero:      Definir interfaces (puertos) para todos los 8 casos de uso
Para:        Desacoplar la lógica de dominio de las implementaciones de infraestructura

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01, HU-02, HU-03
Capa:        Backend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: ICreateFolioUseCase define execute() con CreateFolioRequest/Response
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/contracts/ICreateFolioUseCase.ts
  Entonces:  Tiene execute(request: CreateFolioRequest): Promise<CreateFolioResponse>

CRITERIO-4.2: IGetQuotationUseCase recupera agregado por folioNumber
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/contracts/IGetQuotationUseCase.ts
  Entonces:  Tiene execute(folioNumber: string): Promise<QuotationAggregate>

CRITERIO-4.3: IManageLocationUseCase soporta add, update y getAll
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/contracts/IManageLocationUseCase.ts
  Entonces:  Tiene métodos separados para add(), update() y getAll()

CRITERIO-4.4: ICalculatePremiumUseCase retorna resultado con alertas de ubicaciones incompletas
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/contracts/ICalculatePremiumUseCase.ts
  Entonces:  Retorna { netPremium, commercialPremium, premiumsByLocation, incompleteLocations }
```

---

#### HU-05: Construir Contratos de Reglas de Negocio

```
Como:        Desarrollador backend
Quiero:      Definir interfaces para las 3 reglas de negocio críticas
Para:        Permitir cambios en reglas sin modificar el dominio

Prioridad:   Media
Estimación:  S
Dependencias: HU-01, HU-02
Capa:        Backend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: ILocationCalculabilityRule define isCalculable() y getAlerts()
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/contracts/ILocationCalculabilityRule.ts
  Entonces:  Define métodos para determinar si una Location es calculable y generar alertas

CRITERIO-5.2: IOptimisticVersionRule valida versionado sin lanzar error fatal
  Dado que:  Se intenta actualizar con version=3 pero la actual es 4
  Cuando:    Se ejecuta validate(currentVersion=4, incomingVersion=3)
  Entonces:  Lanza VersionConflictError con mensaje claro de conflicto

CRITERIO-5.3: IPremiumPersistenceRule asegura operación atómica de financiero
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/contracts/IPremiumPersistenceRule.ts
  Entonces:  Define regla que netPremium, commercialPremium y premiumsByLocation se guardan juntos
```

---

#### HU-06: Construir Repositorios (Puertos DDD)

```
Como:        Desarrollador backend
Quiero:      Definir 4 interfaces de repositorio para acceso a datos
Para:        Permitir que infraestructure implemente adaptadores sin tocar el dominio

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, HU-02, HU-03
Capa:        Backend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: IQuotationRepository define findByFolio, save, updatePartial
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/repositories/IQuotationRepository.ts
  Entonces:  Define findByFolio(folioNumber), save(quotation), updatePartial(folioNumber, section, version)

CRITERIO-6.2: ILocationRepository soporta CRUD de ubicaciones por folio e índice
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/repositories/ILocationRepository.ts
  Entonces:  Define findAllByFolio, findByIndex, upsert, deleteByIndex

CRITERIO-6.3: ICalculationParametersRepository recupera parámetros globales de cálculo
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/repositories/ICalculationParametersRepository.ts
  Entonces:  Define getGlobalParameters(): Promise<CalculationParameters>

CRITERIO-6.4: IPremiumResultRepository persiste resultados financieros atómicamente
  Dado que:  Se define el contrato
  Cuando:    Se revisa domain/repositories/IPremiumResultRepository.ts
  Entonces:  Define savePremiumResult(folioNumber, result, version): Promise<void>
```

---

#### HU-07: Construir Servicios de Dominio

```
Como:        Desarrollador backend
Quiero:      Implementar 3 servicios de dominio que orquesten agregados y repositorios
Para:        Encapsular lógica compleja que no pertenece a una sola entidad

Prioridad:   Alta
Estimación:  L
Dependencias: HU-04, HU-05, HU-06
Capa:        Backend
```

#### Criterios de Aceptación — HU-07

**Happy Path**
```gherkin
CRITERIO-7.1: QuotationManagementService garantiza idempotencia en crear folios
  Dado que:  Se crea un folio con folioNumber="FOLIO-001"
  Cuando:    Se intenta crear otro con el mismo folioNumber
  Entonces:  Retorna el existente sin crear duplicado

CRITERIO-7.2: QuotationManagementService valida versionado optimista antes de actualizar
  Dado que:  Se intenta updatePartial con version=3 pero la cotización está en version=4
  Cuando:    Se ejecuta el servicio
  Entonces:  Lanza VersionConflictError sin modificar la cotización

CRITERIO-7.3: PremiumCalculationService calcula prima neta y comercial correctamente
  Dado que:  Existen 2 ubicaciones calculables con parámetros globales cargados
  Cuando:    Se ejecuta calculatePremium(folioNumber)
  Entonces:  Retorna { netPremium: XX, commercialPremium: YY, premiumsByLocation: [...] }

CRITERIO-7.4: PremiumCalculationService identifica ubicaciones incompletas sin bloquear cálculo
  Dado que:  Existen 3 ubicaciones pero una está incompleta (sin fireKey)
  Cuando:    Se ejecuta calculatePremium(folioNumber)
  Entonces:  Retorna incompleteLocations=[location que falta fireKey] pero calcula las demás

CRITERIO-7.5: LocationValidationService genera ValidationAlert[] sin lanzar excepciones
  Dado que:  Se valida una Location incompleta
  Cuando:    Se ejecuta validateLocation(location)
  Entonces:  Retorna { validationStatus, blockingAlerts: [...] } sin lanzar error
```

---

#### HU-08: Asegurar Compilación y Estructura DDD Limpia

```
Como:        Desarrollador backend
Quiero:      Garantizar que la capa de dominio compile sin errores y respete restricciones DDD
Para:        Evitar que el dominio dependa de infraestructura y mantener la separación de capas

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01 a HU-07
Capa:        Backend
```

#### Criterios de Aceptación — HU-08

**Happy Path**
```gherkin
CRITERIO-8.1: Código compila sin errores de TypeScript
  Dado que:  Se ejecuta npm run build en la raíz
  Cuando:    TypeScript procesa src/domain/**/*.ts
  Entonces:  No hay errores de compilación

CRITERIO-8.2: Ninguna importación desde infraestructure en domain/
  Dado que:  Se revisa cada archivo dentro de src/domain/
  Cuando:    Se buscan imports de infraestructure o application
  Entonces:  No existen referencias a src/infraestructure ni src/application

CRITERIO-8.3: Todos los value objects son inmutables
  Dado que:  Se instancia un value object (ej: Address)
  Cuando:    Se intenta reasignar sus propiedades
  Entonces:  No es posible modificarlas (readonly o clase sellada)

CRITERIO-8.4: Todas las entidades poseen identidad única (ej: folioNumber en Quotation)
  Dado que:  Se revisa cada entidad
  Cuando:    Se examina su constructor y propiedades
  Entonces:  Cada una tiene un campo de identidad ineludible y bien documentado
```

---

### Reglas de Negocio

1. **Idempotencia en creación de folios**: Un folioNumber debe ser único en el sistema. Si se intenta crear otro con el mismo número, retorna el existente.
2. **Versionado optimista**: Toda escritura parcial sobre el agregado requiere validar que `incomingVersion === currentVersion`. Si no coinciden, lanza `VersionConflictError`.
3. **Actualización de metadatos**: `lastUpdateDate` se actualiza automáticamente en cada modificación del agregado. No debe ser modificado manualmente.
4. **Calculabilidad condicional**: Una Location solo es calculable si tiene:
   - `postalCode` válido y no nulo
   - `business.fireKey` presente
   - Al menos una Guarantee con `isTariffable === true`
5. **Persistencia atómica de resultados financieros**: `netPremium`, `commercialPremium` y `premiumsByLocation` deben persistirse en una única operación transaccional.
6. **Ubicaciones incompletas sin bloqueo**: Si una Location no es calculable, genera una `ValidationAlert` pero no bloquea el cálculo de las demás ubicaciones.
7. **Desacoplamiento DDD estricto**: El dominio jamás importa desde `infraestructure` o `application`. Solo define contratos (`interfaces`). Las implementaciones viven en infraestructure.
8. **Componentes técnicos**: El cálculo de prima debe considerar los 14 componentes técnicos definidos en RQ-01.

---

## 2. DISEÑO

### Estructura de Archivos a Crear

```
src/domain/
├── entities/
│   ├── Quotation.ts               → Entidad raíz del agregado
│   ├── Location.ts                → Entidad interna del agregado
│   └── index.ts                   → Exportaciones
├── value-objects/
│   ├── InsuredData.ts             → Datos del asegurado
│   ├── DrivingData.ts             → Datos de conducción
│   ├── Address.ts                 → Dirección geográfica
│   ├── Business.ts                → Datos del negocio/giro
│   ├── Guarantee.ts               → Garantía individual
│   ├── PremiumByLocation.ts       → Prima por ubicación
│   ├── CoverageOptions.ts         → Opciones de cobertura
│   ├── LayoutConfiguration.ts     → Configuración de layout
│   ├── QuotationMetadata.ts       → Metadatos de la cotización
│   ├── ValidationAlert.ts         → Alerta de validación
│   ├── RiskClassification.ts      → Clasificación de riesgo
│   ├── CalculationParameters.ts   → Parámetros de cálculo
│   └── index.ts                   → Exportaciones
├── aggregates/
│   ├── QuotationAggregate.ts      → Agregado raíz y sus invariantes
│   └── index.ts                   → Exportaciones
├── services/
│   ├── QuotationManagementService.ts    → Crear, editar, consultar cotizaciones
│   ├── PremiumCalculationService.ts     → Calcular primas neta y comercial
│   ├── LocationValidationService.ts     → Validar ubicaciones
│   └── index.ts                         → Exportaciones
├── contracts/
│   ├── use-cases/
│   │   ├── ICreateFolioUseCase.ts
│   │   ├── IGetQuotationUseCase.ts
│   │   ├── ISaveGeneralDataUseCase.ts
│   │   ├── ISaveLayoutConfigurationUseCase.ts
│   │   ├── IManageLocationUseCase.ts
│   │   ├── IGetQuotationStatusUseCase.ts
│   │   ├── ISaveCoverageOptionsUseCase.ts
│   │   ├── ICalculatePremiumUseCase.ts
│   │   └── index.ts
│   ├── rules/
│   │   ├── ILocationCalculabilityRule.ts
│   │   ├── IOptimisticVersionRule.ts
│   │   ├── IPremiumPersistenceRule.ts
│   │   └── index.ts
│   └── index.ts                         → Exportaciones centralizadas
├── repositories/
│   ├── IQuotationRepository.ts
│   ├── ILocationRepository.ts
│   ├── ICalculationParametersRepository.ts
│   ├── IPremiumResultRepository.ts
│   └── index.ts                         → Exportaciones
├── errors/
│   ├── DomainError.ts                   → Error base del dominio
│   ├── VersionConflictError.ts          → Error específico de versión
│   ├── LocationNotCalculableError.ts    → Error de calculabilidad
│   └── index.ts                         → Exportaciones
└── index.ts                             → Exportación central del dominio
```

### Modelos de Datos — Definiciones de Tipo

#### Entidad: Quotation
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `folioNumber` | string | sí | no vacío, único | Identificador único de cotización |
| `quotationStatus` | enum | sí | "draft" \| "in_progress" \| "completed" | Estado de la cotización |
| `insuredData` | InsuredData | sí | N/A | Value object con datos del asegurado |
| `drivingData` | DrivingData | sí | N/A | Value object con datos del agente de conducción |
| `riskClassification` | RiskClassification | sí | N/A | Clasificación de riesgo |
| `businessType` | string | sí | no vacío | Tipo de negocio |
| `layoutConfiguration` | LayoutConfiguration | no | N/A | Configuración visual del layout |
| `coverageOptions` | CoverageOptions | no | N/A | Opciones de cobertura seleccionadas |
| `locations` | Location[] | sí | mín 1 | Lista de ubicaciones del agregado |
| `netPremium` | number | no | >= 0 | Prima neta total calculada |
| `commercialPremium` | number | no | >= 0 | Prima comercial total calculada |
| `premiumsByLocation` | PremiumByLocation[] | no | N/A | Desglose de primas por ubicación |
| `version` | number | sí | >= 1 | Versión para control optimista |
| `metadata` | QuotationMetadata | sí | N/A | Metadatos (createdAt, lastUpdateDate, createdBy) |

#### Entidad: Location
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `index` | number | sí | >= 0 | Índice único dentro del agregado |
| `locationName` | string | sí | no vacío, máx 100 | Nombre de la ubicación |
| `address` | Address | sí | N/A | Value object de dirección completa |
| `postalCode` | string | sí | válido según formato | Código postal |
| `state` | string | sí | no vacío | Estado/Provincia |
| `municipality` | string | sí | no vacío | Municipio |
| `neighborhood` | string | sí | no vacío | Colonia/Barrio |
| `city` | string | sí | no vacío | Ciudad |
| `constructiveType` | string | sí | no vacío | Tipo constructivo (material, forma) |
| `level` | number | sí | >= 0 | Número de piso/nivel |
| `constructionYear` | number | sí | 1900 <= año <= actual | Año de construcción |
| `businessLine` | string | sí | no vacío | Giro del negocio |
| `business` | Business | sí | N/A | Value object con fireKey y descripción |
| `guarantees` | Guarantee[] | sí | mín 1 | Lista de garantías ofrecidas |
| `catastrophicZone` | boolean | no | N/A | ¿Está en zona catastrófica? |
| `blockingAlerts` | ValidationAlert[] | no | N/A | Alertas que bloquean cálculo |
| `validationStatus` | enum | sí | "valid" \| "incomplete" \| "has_warnings" | Estado de validación |

#### Value Object: InsuredData
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `name` | string | sí | Nombre o razón social |
| `taxId` | string | sí | RFC o identificador fiscal (formato validado) |
| `contactInfo` | object | sí | { email, phone, address } |

#### Value Object: Address
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `street` | string | sí | Calle y número |
| `postalCode` | string | sí | Código postal válido |
| `neighborhood` | string | sí | Colonia |
| `municipality` | string | sí | Municipio |
| `state` | string | sí | Estado |
| `city` | string | sí | Ciudad |

#### Value Object: Business
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `fireKey` | string | sí | Clave de incendio única |
| `businessLine` | string | sí | Descripción del giro |

#### Value Object: Guarantee
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `guaranteeCode` | string | sí | Código único de la garantía |
| `guaranteeName` | string | sí | Nombre de la garantía |
| `insuredValue` | number | sí | Suma asegurada |
| `rate` | number | sí | Tasa aplicada (porcentaje) |
| `isTariffable` | boolean | sí | ¿Se usa en cálculo técnico? |

#### Value Object: PremiumByLocation
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `locationIndex` | number | sí | Referencia al índice de Location |
| `netPremium` | number | sí | Prima neta de la ubicación |
| `components` | object | no | { incendio, cat_tev, cat_fhm, ... } |

#### Value Object: CoverageOptions
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `selectedCoverages` | string[] | sí | Códigos de coberturas seleccionadas |
| `deductibles` | { [key: string]: number } | no | Deducibles por cobertura |

#### Value Object: LayoutConfiguration
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `columns` | string[] | sí | Columnas visibles en tabla de ubicaciones |
| `visibleSections` | string[] | sí | Secciones del formulario a mostrar |

#### Value Object: QuotationMetadata
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `createdAt` | datetime | sí | Timestamp de creación (UTC) |
| `lastUpdateDate` | datetime | sí | Timestamp de última actualización (UTC) |
| `createdBy` | string | sí | UID del usuario que creó el folio |

#### Value Object: ValidationAlert
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `alertCode` | string | sí | Código único de la alerta |
| `alertMessage` | string | sí | Descripción legible |
| `isBlocking` | boolean | sí | ¿Bloquea el cálculo? |
| `field` | string | sí | Campo de Origin de la alerta |

#### Value Object: RiskClassification
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `classCode` | string | sí | Código de clasificación |
| `description` | string | sí | Descripción del riesgo |

#### Value Object: CalculationParameters
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `baseRates` | { [component: string]: number } | sí | Tasas base por componente técnico |
| `commercialFactor` | number | sí | Factor multiplicador para derivar prima comercial |
| `catZoneFactor` | number | sí | Factor de zona catastrófica |

### Contratos — Interfaces de Casos de Uso

#### ICreateFolioUseCase
```typescript
interface CreateFolioRequest {
  insuredData: InsuredData;
  businessType: string;
  drivingData?: DrivingData;
}

interface CreateFolioResponse {
  folioNumber: string;
  createdAt: Date;
}

interface ICreateFolioUseCase {
  execute(request: CreateFolioRequest): Promise<CreateFolioResponse>;
}
```

#### IGetQuotationUseCase
```typescript
interface IGetQuotationUseCase {
  execute(folioNumber: string): Promise<QuotationAggregate>;
}
```

#### ISaveGeneralDataUseCase
```typescript
interface GeneralDataPayload {
  insuredData?: Partial<InsuredData>;
  drivingData?: Partial<DrivingData>;
  businessType?: string;
  riskClassification?: RiskClassification;
}

interface ISaveGeneralDataUseCase {
  execute(folioNumber: string, data: GeneralDataPayload, version: number): Promise<void>;
}
```

#### ISaveLayoutConfigurationUseCase
```typescript
interface ISaveLayoutConfigurationUseCase {
  execute(folioNumber: string, config: LayoutConfiguration, version: number): Promise<void>;
}
```

#### IManageLocationUseCase
```typescript
interface LocationPayload {
  locationName: string;
  address: Address;
  postalCode: string;
  state: string;
  municipality: string;
  neighborhood: string;
  city: string;
  constructiveType: string;
  level: number;
  constructionYear: number;
  businessLine: string;
  business: Business;
  guarantees: Guarantee[];
  catastrophicZone?: boolean;
}

interface IManageLocationUseCase {
  add(folioNumber: string, location: LocationPayload): Promise<void>;
  update(folioNumber: string, index: number, location: LocationPayload, version: number): Promise<void>;
  getAll(folioNumber: string): Promise<Location[]>;
  deleteLocation(folioNumber: string, index: number, version: number): Promise<void>;
}
```

#### IGetQuotationStatusUseCase
```typescript
interface QuotationStatus {
  folioNumber: string;
  quotationStatus: string;
  percentComplete: number;
  lastUpdated: Date;
  incompleteLocations: number;
}

interface IGetQuotationStatusUseCase {
  execute(folioNumber: string): Promise<QuotationStatus>;
}
```

#### ISaveCoverageOptionsUseCase
```typescript
interface ISaveCoverageOptionsUseCase {
  execute(folioNumber: string, options: CoverageOptions, version: number): Promise<void>;
}
```

#### ICalculatePremiumUseCase
```typescript
interface PremiumCalculationResult {
  netPremium: number;
  commercialPremium: number;
  premiumsByLocation: PremiumByLocation[];
  incompleteLocations: Location[];
  calculatedAt: Date;
}

interface ICalculatePremiumUseCase {
  execute(folioNumber: string): Promise<PremiumCalculationResult>;
}
```

### Contratos — Interfaces de Reglas de Negocio

#### ILocationCalculabilityRule
```typescript
interface ILocationCalculabilityRule {
  isCalculable(location: Location): boolean;
  getAlerts(location: Location): ValidationAlert[];
}
```
**Criterio de calculabilidad**: Una Location es calculable si cumple las 3 condiciones:
1. `postalCode` es válido y no nulo
2. `business.fireKey` existe
3. Al menos una Guarantee tiene `isTariffable === true`

#### IOptimisticVersionRule
```typescript
interface IOptimisticVersionRule {
  validate(currentVersion: number, incomingVersion: number): void;
  // Lanza VersionConflictError si incomingVersion !== currentVersion
}
```

#### IPremiumPersistenceRule
```typescript
interface IPremiumPersistenceRule {
  mustPersistAtomically(result: PremiumCalculationResult): boolean;
  // Retorna true si los 3 componentes (netPremium, commercialPremium, premiumsByLocation)
  // deben guardarse en una sola transacción sin sobrescribir otras secciones
}
```

### Repositorios — Interfaces de Acceso a Datos

#### IQuotationRepository
```typescript
interface IQuotationRepository {
  findByFolio(folioNumber: string): Promise<QuotationAggregate | null>;
  save(quotation: QuotationAggregate): Promise<void>;
  updatePartial(folioNumber: string, section: Partial<QuotationAggregate>, version: number): Promise<void>;
  existsByFolio(folioNumber: string): Promise<boolean>;
}
```

#### ILocationRepository
```typescript
interface ILocationRepository {
  findAllByFolio(folioNumber: string): Promise<Location[]>;
  findByIndex(folioNumber: string, index: number): Promise<Location | null>;
  upsert(folioNumber: string, location: Location): Promise<void>;
  deleteByIndex(folioNumber: string, index: number): Promise<void>;
}
```

#### ICalculationParametersRepository
```typescript
interface ICalculationParametersRepository {
  getGlobalParameters(): Promise<CalculationParameters>;
}
```

#### IPremiumResultRepository
```typescript
interface IPremiumResultRepository {
  savePremiumResult(folioNumber: string, result: PremiumCalculationResult, version: number): Promise<void>;
}
```

### Servicios de Dominio — Definiciones

#### QuotationManagementService
- **Responsabilidad**: Gestionar el ciclo de vida del agregado Quotation (crear, editar, consultar).
- **Métodos clave**:
  - `createFolio(request: CreateFolioRequest): Promise<QuotationAggregate>` — Crea folio con idempotencia.
  - `getQuotation(folioNumber: string): Promise<QuotationAggregate>` — Recupera cotización.
  - `updateGeneralData(folioNumber: string, data: GeneralDataPayload, version: number): Promise<void>` — Actualiza parcialmente respetando versionado.
- **Dependencias**: `IQuotationRepository`, `IOptimisticVersionRule`

#### PremiumCalculationService
- **Responsabilidad**: Calcular primas neta y comercial considerando 14 componentes técnicos.
- **Métodos clave**:
  - `calculatePremium(folioNumber: string): Promise<PremiumCalculationResult>` — Ejecuta cálculo completo.
  - Aplicar `ILocationCalculabilityRule` para filtrar ubicaciones calculables.
  - Consolidar totales y persistir vía `IPremiumResultRepository`.
- **Dependencias**: `IQuotationRepository`, `ICalculationParametersRepository`, `IPremiumResultRepository`, `ILocationCalculabilityRule`

#### LocationValidationService
- **Responsabilidad**: Validar cada ubicación y generar alertas sin bloquear cálculo.
- **Métodos clave**:
  - `validateLocation(location: Location): { validationStatus: string, blockingAlerts: ValidationAlert[] }` — Valida y retorna alertas.
  - `propagateAlerts(quotation: QuotationAggregate): void` — Actualiza `blockingAlerts` en cada Location.
- **Dependencias**: `ILocationCalculabilityRule`

### Notas de Implementación

> La capa de dominio es **agnóstica de infraestructura**. Todos los accesos a datos se hacen a través de interfaces (`repositories`). Las implementaciones concretas (adaptadores) se crean en `src/infraestructure/services/database/`.
> 
> **TypeScript**: Usar `readonly` para value objects e inmutabilidad. Las entidades pueden tener setters privados para métodos internos que mantengan invariantes.
>
> **Errores de dominio**: Crear clase base `DomainError` en `src/domain/errors/` y errores específicos que hereden (`VersionConflictError`, `LocationNotCalculableError`, etc.).
>
> **Índice central de exportaciones**: `src/domain/index.ts` debe exportar todas las entidades, value objects, interfaces y servicios para que `application` e `infraestructure` importen desde un solo punto.
>
> **14 Componentes técnicos**: El cálculo debe desglosar prima por estos componentes:
> 1. Incendio edificios
> 2. Incendio contenidos
> 3. Extensión de cobertura
> 4. CAT TEV
> 5. CAT FHM
> 6. Remoción de escombros
> 7. Gastos extraordinarios
> 8. Pérdida de rentas
> 9. BI
> 10. Equipo electrónico
> 11. Robo
> 12. Dinero y valores
> 13. Vidrios
> 14. Anuncios luminosos

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend — Dominio

#### Entidades y Value Objects
- [ ] Crear clase `Quotation` en `src/domain/entities/Quotation.ts` con propiedades defining, constructor y métodos de invariante
- [ ] Crear clase `Location` en `src/domain/entities/Location.ts` como entidad interna del agregado
- [ ] Crear value object `InsuredData` en `src/domain/value-objects/InsuredData.ts` con inmutabilidad
- [ ] Crear value object `DrivingData` en `src/domain/value-objects/DrivingData.ts`
- [ ] Crear value object `Address` en `src/domain/value-objects/Address.ts` con validación de formato
- [ ] Crear value object `Business` en `src/domain/value-objects/Business.ts` con fireKey obligatorio
- [ ] Crear value object `Guarantee` en `src/domain/value-objects/Guarantee.ts` con flag `isTariffable`
- [ ] Crear value object `PremiumByLocation` en `src/domain/value-objects/PremiumByLocation.ts`
- [ ] Crear value object `CoverageOptions` en `src/domain/value-objects/CoverageOptions.ts`
- [ ] Crear value object `LayoutConfiguration` en `src/domain/value-objects/LayoutConfiguration.ts`
- [ ] Crear value object `QuotationMetadata` en `src/domain/value-objects/QuotationMetadata.ts`
- [ ] Crear value object `ValidationAlert` en `src/domain/value-objects/ValidationAlert.ts`
- [ ] Crear value object `RiskClassification` en `src/domain/value-objects/RiskClassification.ts`
- [ ] Crear value object `CalculationParameters` en `src/domain/value-objects/CalculationParameters.ts`
- [ ] Crear `index.ts` en `src/domain/value-objects/` exportando todos los value objects

#### Agregados
- [ ] Crear clase `QuotationAggregate` en `src/domain/aggregates/QuotationAggregate.ts` que encapsule Quotation + Location[]
- [ ] Implementar invariante: `version` se incrementa en cada escritura
- [ ] Implementar invariante: `lastUpdateDate` se actualiza automáticamente
- [ ] Implementar invariante: `folioNumber` es único e inmutable
- [ ] Crear `index.ts` en `src/domain/aggregates/` exportando QuotationAggregate

#### Contratos de Casos de Uso
- [ ] Crear interfaz `ICreateFolioUseCase` en `src/domain/contracts/use-cases/ICreateFolioUseCase.ts`
- [ ] Crear interfaz `IGetQuotationUseCase` en `src/domain/contracts/use-cases/IGetQuotationUseCase.ts`
- [ ] Crear interfaz `ISaveGeneralDataUseCase` en `src/domain/contracts/use-cases/ISaveGeneralDataUseCase.ts`
- [ ] Crear interfaz `ISaveLayoutConfigurationUseCase` en `src/domain/contracts/use-cases/ISaveLayoutConfigurationUseCase.ts`
- [ ] Crear interfaz `IManageLocationUseCase` en `src/domain/contracts/use-cases/IManageLocationUseCase.ts` con add, update, getAll, delete
- [ ] Crear interfaz `IGetQuotationStatusUseCase` en `src/domain/contracts/use-cases/IGetQuotationStatusUseCase.ts`
- [ ] Crear interfaz `ISaveCoverageOptionsUseCase` en `src/domain/contracts/use-cases/ISaveCoverageOptionsUseCase.ts`
- [ ] Crear interfaz `ICalculatePremiumUseCase` en `src/domain/contracts/use-cases/ICalculatePremiumUseCase.ts` retornando resultado con incompleteLocations
- [ ] Crear `index.ts` en `src/domain/contracts/use-cases/` exportando todas las interfaces

#### Contratos de Reglas de Negocio
- [ ] Crear interfaz `ILocationCalculabilityRule` en `src/domain/contracts/rules/ILocationCalculabilityRule.ts`
- [ ] Crear interfaz `IOptimisticVersionRule` en `src/domain/contracts/rules/IOptimisticVersionRule.ts`
- [ ] Crear interfaz `IPremiumPersistenceRule` en `src/domain/contracts/rules/IPremiumPersistenceRule.ts`
- [ ] Crear `index.ts` en `src/domain/contracts/rules/` exportando todas las interfaces
- [ ] Crear `index.ts` centralizado en `src/domain/contracts/` exportando use-cases y rules

#### Repositorios (Puertos DDD)
- [ ] Crear interfaz `IQuotationRepository` en `src/domain/repositories/IQuotationRepository.ts`
- [ ] Crear interfaz `ILocationRepository` en `src/domain/repositories/ILocationRepository.ts`
- [ ] Crear interfaz `ICalculationParametersRepository` en `src/domain/repositories/ICalculationParametersRepository.ts`
- [ ] Crear interfaz `IPremiumResultRepository` en `src/domain/repositories/IPremiumResultRepository.ts`
- [ ] Crear `index.ts` en `src/domain/repositories/` exportando todas las interfaces

#### Errores de Dominio
- [ ] Crear clase base `DomainError` en `src/domain/errors/DomainError.ts`
- [ ] Crear clase `VersionConflictError` en `src/domain/errors/VersionConflictError.ts`
- [ ] Crear clase `LocationNotCalculableError` en `src/domain/errors/LocationNotCalculableError.ts`
- [ ] Crear clase `QuotationNotFoundError` en `src/domain/errors/QuotationNotFoundError.ts`
- [ ] Crear `index.ts` en `src/domain/errors/` exportando todas las clases de error

#### Servicios de Dominio
- [ ] Crear clase `QuotationManagementService` en `src/domain/services/QuotationManagementService.ts`
  - [ ] Método `createFolio()` con idempotencia
  - [ ] Método `getQuotation()`
  - [ ] Método `updateGeneralData()` con versionado optimista
  - [ ] Método `updatePartial()` respetando versión
- [ ] Crear clase `PremiumCalculationService` en `src/domain/services/PremiumCalculationService.ts`
  - [ ] Método `calculatePremium()` considerando 14 componentes
  - [ ] Aplicar `ILocationCalculabilityRule` para filtrar ubicaciones
  - [ ] Consolidar netPremium y derivar commercialPremium
  - [ ] Retornar incompleteLocations en resultado
- [ ] Crear clase `LocationValidationService` en `src/domain/services/LocationValidationService.ts`
  - [ ] Método `validateLocation()` generando ValidationAlert[] sin excepciones
  - [ ] Método `propagateAlerts()`
- [ ] Crear `index.ts` en `src/domain/services/` exportando todos los servicios

#### Compilación y Validación
- [ ] Ejecutar `npm run build` — no debe haber errores TypeScript
- [ ] Verificar que NO hay imports de `infraestructure` ni `application` dentro de `src/domain/`
- [ ] Verificar que todos los value objects son inmutables (readonly o con Object.freeze)
- [ ] Verificar que todas las entidades tienen identidad única (folioNumber para Quotation, index para Location)
- [ ] Crear `index.ts` central en `src/domain/` exportando entidades, value objects, agregados, servicios, contratos y repositorios
- [ ] Documentar en comentario TypeScript cada clase y interfaz con su responsabilidad y reglas

### Frontend

- [ ] No aplica en esta fase (dominio es backend-only)

### QA

- [x] Generar suite de tests unitarios de dominio en `src/domain/__tests__/` (value objects, entidades, agregado, servicios, errores)
- [x] Ejecutar tests unitarios de dominio con Jest (`npx jest --config jest.config.cjs --runInBand`)
- [x] Ejecutar skill `/gherkin-case-generator` sobre esta spec → generar casos BDD para cada HU (`docs/output/qa/RQ-01-gherkin.md` — 22 escenarios)
- [x] Ejecutar skill `/risk-identifier` → clasificar riesgos (ASD: Alto/Medio/Bajo) (`docs/output/qa/RQ-01-risks.md` — 13 riesgos: 5 Alto, 5 Medio, 3 Bajo)
- [ ] Revisar cobertura de tests backend contra CRITERIO-1.1 a CRITERIO-8.4
- [ ] Validar que no hay circularidades en imports entre paquetes de dominio
- [ ] Verificar que todas las reglas de negocio están codificadas como contratos o servicios
- [ ] Ejecutar linter (ESLint) y formatter (Prettier) sobre `src/domain/**`
- [x] Actualizar estado spec: `status: IMPLEMENTED` una vez fase completada

---

## Criterios de Aceptación Técnicos

1. ✅ Se deben construir las 2 entidades (`Quotation`, `Location`) con identidad propia y ciclo de vida.
2. ✅ Se deben construir los 12 value objects definidos, todos inmutables.
3. ✅ Se debe crear el agregado `QuotationAggregate` que encapsule invariantes.
4. ✅ Se deben crear 8 interfaces de casos de uso en `domain/contracts/use-cases/`.
5. ✅ Se deben crear 3 interfaces de reglas de negocio en `domain/contracts/rules/`.
6. ✅ Se deben crear 4 interfaces de repositorio en `domain/repositories/`.
7. ✅ Se deben crear 3 servicios de dominio implementando lógica compleja.
8. ✅ Ningún archivo en `src/domain/` puede importar desde `infraestructure` o `application`.
9. ✅ El código debe compilar sin errores TypeScript (`npm run build`).
10. ✅ Cada entidad, value object e interfaz debe tener documentación Clara en comentarios TypeScript.

---

## Restricciones y Convenciones DDD

1. **Expresividad**: Los nombres debe hablar por sí solos. Ej: `Location.isCalculable()` es más claro que `Location.check()`.
2. **Immutabilidad**: Los value objects JAMÁS pueden modificarse después de instanciación. Usar `readonly` en TypeScript.
3. **Validación en el constructor**: Los value objects validan datos e inmediatamente. Si hay error, lanzan `DomainError`.
4. **Invariantes en el agregado**: El agregado `QuotationAggregate` protege que `version` y `lastUpdateDate` se actualicen correctamente.
5. **Sin lógica infraestructural**: El dominio cero dependencias de bases de datos, caches, APIs externas, etc. Solo interfaces.
6. **Servicios de dominio son "orquestadores"**: NO crean nuevas entidades. Leen del repositorio, aplican reglas y persisten cambios.
7. **Componentes técnicos**: El cálculo de prima debe ser extensible a futuro (new Component() → se agrega a lista sin cambiar servicio).
8. **Lenguaje único**: Todos los nombres match el diccionario de dominio de RQ-01 (folioNumber, insuredData, fireKey, etc.).

