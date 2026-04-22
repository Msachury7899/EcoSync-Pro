---
id: SPEC-005
status: IMPLEMENTED
feature: core-integration
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs: ["SPEC-001", "SPEC-002", "SPEC-004"]
---

# Spec: Integración con Servicios de Referencia (Plataforma Core OHS)

> **Estado:** `IN_PROGRESS` — aprobada el 2026-03-30. Implementación en curso.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

El cotizador de daños debe consumir o simular las capacidades del servicio core (`plataforma-core-ohs`) para resolver datos de catálogos, tarifas técnicas y validaciones externas. Se requieren **9 contratos de integración** que actúen como puertos hacia servicios externos (reales o stubs). El patrón de selección es configuración por entorno: `CORE_OHS_MODE=local` (stubs/fixtures) o `CORE_OHS_MODE=remote` (HTTP real).

### Requerimiento de Negocio

Actualmente el dominio define servicios críticos (`PremiumCalculationService`, `LocationValidationService`) que dependen de datos técnicos externos (tarifas, catálogos, validaciones geográficas, folio secuencial) pero **no existen contratos ni adaptadores** que resuelvan estos datos. Sin esta integración, el motor de cálculo no puede resolver parámetros técnicos requeridos por ubicación, y el cotizador no puede generar folios secuenciales o validar códigos postales contra datos del core.

### Historias de Usuario

#### HU-01: Integración con Catálogo de Suscriptores

```
Como:        Motor de cotización
Quiero:      Validar que el suscriptor (cliente) sea válido contra un catálogo
Para:        Garantizar que solo se cotizan clientes registrados en el core

Prioridad:   Alta
Estimación:  M
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Obtener listado de suscriptores activos
  Dado que:  El servicio ISubscriberService está inyectado
  Cuando:    Ejecuto subscriberService.findAll()
  Entonces:  Retorna Promise<Subscriber[]> con { subscriberId, name, status, registeredDate }

CRITERIO-1.2: Validación de suscriptor durante creación de folio
  Dado que:  InsuredData.subscriberId = "SUB-001" (válido en catálogo)
  Cuando:    CreateFolioUseCase valida contra ISubscriberService
  Entonces:  El folio se crea exitosamente
```

**Error Path**
```gherkin
CRITERIO-1.3: Suscriptor inválido rechazado
  Dado que:  InsuredData.subscriberId = "INVALID-999"
  Cuando:    CreateFolioUseCase valida contra ISubscriberService
  Entonces:  Lanza DomainError "Subscriber not found"

CRITERIO-1.4: Fallback cuando servicio no está disponible
  Dado que:  ISubscriberService retorna error de conexión
  Cuando:    CreateFolioUseCase intenta validar
  Entonces:  Retorna error descriptivo HTTP 503 Service Unavailable
```

---

#### HU-02: Integración con Catálogo de Agentes

```
Como:        Motor de cotización
Quiero:      Resolver datos del agente (nombre, sucursal) por su código
Para:        Enriquecer la cotización con información del agente que la genera

Prioridad:   Media
Estimación:  M
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Consultar agente por código
  Dado que:  DrivingData.agentCode = "AGENT-123"
  Cuando:    Ejecuto agentService.findByCode("AGENT-123")
  Entonces:  Retorna Promise<Agent> con { agentCode, name, branch, email, commissionRate }

CRITERIO-2.2: Enriquecimiento de agente durante cálculo
  Dado que:  El agente "AGENT-456" existe en el catálogo
  Cuando:    ICalculatePremiumUseCase ejecuta el cálculo
  Entonces:  Valida el agentCode contra IAgentService
```

**Error Path**
```gherkin
CRITERIO-2.3: Agente no encontrado
  Dado que:  DrivingData.agentCode = "AGENT-INVALID"
  Cuando:    agentService.findByCode("AGENT-INVALID")
  Entonces:  Retorna null o lanza error específico
```

---

#### HU-03: Integración con Catálogo de Giros (Líneas de Negocio)

```
Como:        Motor de cotización
Quiero:      Obtener el listado de giros (business lines) y sus fireKey asociados
Para:        Validar y resolver el fireKey automáticamente según el giro

Prioridad:   Media
Estimación:  M
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Obtener catálogo de giros
  Dado que:  El servicio IBusinessLineService está inyectado
  Cuando:    Ejecuto businessLineService.findAll()
  Entonces:  Retorna Promise<BusinessLine[]> con { giroCode, giroDescript, fireKey, categoryId } para cada giro

CRITERIO-3.2: Resolución automática de fireKey
  Dado que:  Location.business.businessLine = "HOTEL"
  Cuando:    IManageLocationUseCase valida la ubicación
  Entonces:  Resuelve automáticamente Location.business.fireKey desde el catálogo
```

**Error Path**
```gherkin
CRITERIO-3.3: Giro no encontrado en catálogo
  Dado que:  Location.business.businessLine = "INVALID-GIRO"
  Cuando:    businessLineService intenta resolver
  Entonces:  Lanza error que propaga a ValidationAlert
```

---

#### HU-04: Integración con Validación de Códigos Postales

```
Como:        Motor de cotización
Quiero:      Validar y resolver dirección completa (estado, municipio, ciudad, colonia) a partir del código postal
Para:        Asegurar que Location.address contenga datos completos y válidos

Prioridad:   Alta
Estimación:  L
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Validación individual de código postal
  Dado que:  LocationPayload.address.postalCode = "28001" (Madrid)
  Cuando:    zipCodeService.findByCode("28001")
  Entonces:  Retorna Promise<ZipCodeInfo> con { state, municipality, neighborhood, city, isValid, geographicZone }

CRITERIO-4.2: Validación masiva de códigos postales
  Dado que:  Se registran 10 ubicaciones con 10 códigos postales diferentes
  Cuando:    zipCodeService.validateBatch([code1, code2, ..., code10])
  Entonces:  Retorna Promise<ValidationResult[]> en una sola consulta (no 10 llamadas individuales)

CRITERIO-4.3: Resolución de zona geográfica
  Dado que:  postalCode = "28001" es validado exitosamente
  Cuando:    Se almacena ZipCodeInfo
  Entonces:  Location.address.geographicZone se completa para uso en cálculo de CAT factors
```

**Error Path**
```gherkin
CRITERIO-4.4: Código postal inválido bloqueado
  Dado que:  postalCode = "00000" (inválido)
  Cuando:    zipCodeService.findByCode("00000")
  Entonces:  Retorna { isValid: false } y se genera ValidationAlert con isBlocking=true

CRITERIO-4.5: Servicio no disponible durante validación masiva
  Dado que:  zipCodeService.validateBatch() retorna error de conexión
  Cuando:    Se intenta registrar 10 ubicaciones
  Entonces:  Se propaga error con HTTP 503 y mensaje "Cannot validate locations at this moment"
```

---

#### HU-05: Integración con Generación Secuencial de Folio

```
Como:        Motor de cotización
Quiero:      Obtener un número de folio secuencial (no random) desde el core
Para:        Tener folios auditables y controlados desde una fuente única

Prioridad:   Media
Estimación:  M
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: Generación de folio secuencial
  Dado que:  CreateFolioUseCase inicia
  Cuando:    Ejecuto folioGeneratorService.generateNext()
  Entonces:  Retorna Promise<string> con formato "FOL-YYYY-NNNNNNN" (ej. FOL-2026-0000001)

CRITERIO-5.2: Folio es único e inmutable
  Dado que:  folioGeneratorService.generateNext() retorna "FOL-2026-0000001"
  Cuando:    Se crea una Quotation con ese folio
  Entonces:  El folio es único en base de datos (índice único)
```

**Error Path**
```gherkin
CRITERIO-5.3: Fallback a formato legacy si servicio no disponible
  Dado que:  folioGeneratorService retorna error
  Cuando:    CreateFolioUseCase intenta obtener folio
  Entonces:  Retorna folio en formato legacy "FOLIO-<timestamp>-<random>" (patrón RQ-01)

CRITERIO-5.4: Generador respeta secuencia sin colisiones
  Dado que:  Se solicitan 100 folios consecutivamente
  Cuando:    Cada llamada a generateNext() se ejecuta
  Entonces:  Retorna folios únicos sin saltos ni colisiones en secuencia
```

---

#### HU-06: Integración con Catálogo de Clasificación de Riesgo

```
Como:        Motor de cotización
Quiero:      Obtener catálogos de clasificación de riesgo (por tipo de inmueble, ocupancia, etc.)
Para:        Validar y asignar RiskClassification correctamente durante creación de ubicación

Prioridad:   Media
Estimación:  M
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: Obtener catálogo de clasificaciones de riesgo
  Dado que:  El servicio ICatalogService está inyectado
  Cuando:    Ejecuto catalogService.getRiskClassifications()
  Entonces:  Retorna Promise<RiskClassification[]> con { classificationId, description, baseRiskRate, riskGroup }

CRITERIO-6.2: Validación de clasificación en ubicación
  Dado que:  LocationPayload.riskClassification = "CLASS-001"
  Cuando:    IManageLocationUseCase valida la ubicación
  Entonces:  Valida contra catálogo y rechaza si no existe
```

**Error Path**
```gherkin
CRITERIO-6.3: Clasificación inválida rechazada
  Dado que:  LocationPayload.riskClassification = "INVALID"
  Cuando:    Se intenta crear ubicación
  Entonces:  Lanza error "RiskClassification not found"
```

---

#### HU-07: Integración con Catálogo de Garantías

```
Como:        Motor de cotización
Quiero:      Obtener catálogo de garantías disponibles con tasas base e isTariffable
Para:        Validar garantías solicitadas y hacer disponibles solo las tarifables

Prioridad:   Alta
Estimación:  M
Dependencias: RQ-01, RQ-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-07

**Happy Path**
```gherkin
CRITERIO-7.1: Obtener catálogo de garantías
  Dado que:  El servicio ICatalogService está inyectado
  Cuando:    Ejecuto catalogService.getGuarantees()
  Entonces:  Retorna Promise<Guarantee[]> con { guaranteeId, description, baseRate, isTariffable, maxInsuredValue }

CRITERIO-7.2: Filtrado de garantías tarifables
  Dado que:  Location.guarantees contiene 5 garantías
  Cuando:    PremiumCalculationService calcula prima
  Entonces:  Solo calcula sobre guarantees donde isTariffable === true
```

**Error Path**
```gherkin
CRITERIO-7.3: Garantía no disponible rechazada
  Dado que:  LocationPayload solicita guaranteeId = "INVALID"
  Cuando:    IManageLocationUseCase valida la ubicación
  Entonces:  Rechaza la garantía con error "Guarantee not available"
```

---

#### HU-08: Integración con Tarifas Técnicas de Incendio

```
Como:        Motor de cotización
Quiero:      Obtener tarifas técnicas de incendio según fireKey y zona geográfica
Para:        Calcular prima neta usando tasas reales del core

Prioridad:   Alta
Estimación:  L
Dependencias: RQ-01, RQ-04, HU-04 (validación de código postal)
Capa:        Backend
```

#### Criterios de Aceptación — HU-08

**Happy Path**
```gherkin
CRITERIO-8.1: Consulta de tarifas de incendio
  Dado que:  PremiumCalculationService inicia cálculo para Location
  Cuando:    tariffService.getFireTariffs(fireKey="HOTEL") retorna tarifas
  Entonces:  Retorna Promise<FireTariff> con { incendioEdificios, incendioContenidos, extension, remocionEscombros, gastosExtraordinarios }

CRITERIO-8.2: Aplicación de tarifa según zona
  Dado que:  location.address.geographicZone = "ZONE-001"
  Cuando:    PremiumCalculationService busca tariff para esa zona
  Entonces:  Aplica el factor de zona (catastrófica vs. normal)
```

**Error Path**
```gherkin
CRITERIO-8.3: Tarifa no disponible para fireKey
  Dado que:  fireKey = "INVALID-FIRE-KEY"
  Cuando:    tariffService.getFireTariffs("INVALID-FIRE-KEY")
  Entonces:  Retorna null o lanza error "Tariff not found"
```

---

#### HU-09: Integración con Factores Técnicos (CAT, FHM, Equipo Electrónico)

```
Como:        Motor de cotización
Quiero:      Obtener factores técnicos (CAT, FHM, equipo electrónico) según zona geográfica
Para:        Aplicar modificadores a tasas base en el cálculo de prima

Prioridad:   Alta
Estimación:  L
Dependencias: RQ-01, RQ-04, HU-04 (validación de código postal), HU-08 (tarifas base)
Capa:        Backend
```

#### Criterios de Aceptación — HU-09

**Happy Path**
```gherkin
CRITERIO-9.1: Consulta de factores CAT por zona
  Dado que:  location.address.geographicZone = "ZONE-CAT-001" (zona de catastrofes)
  Cuando:    tariffService.getCatFactors(zone="ZONE-CAT-001")
  Entonces:  Retorna Promise<CatFactors> con { factor, categoryId, description }

CRITERIO-9.2: Consulta de factores FHM por grupo de riesgo y zona
  Dado que:  location.riskClassification.riskGroup = "GROUP-B" y zone = "ZONE-001"
  Cuando:    tariffService.getFhmRates(group="GROUP-B", zone="ZONE-001")
  Entonces:  Retorna Promise<FhmRate> con { rate, description, effectiveDate }

CRITERIO-9.3: Consulta de factores de equipo electrónico
  Dado que:  Location.guarantees incluye equipo electrónico con isTariffable=true
  Cuando:    tariffService.getElectronicEquipmentFactors()
  Entonces:  Retorna Promise<EEFactors> con { baseFactor, zoneFactors, validityPeriod }

CRITERIO-9.4: Aplicación de factores en cálculo
  Dado que:  Todos los factores (tariff base + CAT + FHM + EE) están disponibles
  Cuando:    PremiumCalculationService ejecuta _calculateLocationPremium()
  Entonces:  Aplica: netPremium = totalInsuredValue * baseRate * catFactor * fhmFactor * ...
```

**Error Path**
```gherkin
CRITERIO-9.5: Factor no disponible para zona
  Dado que:  zone = "ZONE-UNKNOWN"
  Cuando:    tariffService.getCatFactors("ZONE-UNKNOWN")
  Entonces:  Retorna factor = 1.0 (sin modificación) o error descriptivo
```

### Reglas de Negocio

1. **Aislamiento de Adaptadores**: Los servicios de dominio (`PremiumCalculationService`, `LocationValidationService`) **NO deben conocer** detalles HTTP/fixtures. Solo consumen interfaces (`ISubscriberService`, `ITariffService`, etc.).

2. **Resolución por Configuración**: `ServiceAdapterFactory` resuelve la implementación concreta (HTTP o Local) según `CORE_OHS_MODE` en variables de entorno.

3. **Fallback Controlado**: Si el servicio core no está disponible:
   - Para validación: generar `ValidationAlert` con `isBlocking=true`
   - Para folios: usar formato legacy como fallback
   - Para tarifas: retornar error HTTP 503 y proposición: "Contact support"

4. **Datos Suficientes en Stubs**: Los fixtures deben contener datos realistas y suficientes para probar E2E (100+ códigos postales, 20+ giros, 50+ garantías, etc.)

5. **Unicidad de Folio**: El folio generado debe ser único en la colección `quotations` — validar con índice único en DB.

6. **Sin Datos Sensibles**: Los fixtures **NO deben** incluir datos reales de clientes, RFC, emails operacionales ni información confidencial de tarifas.

---

## 2. DISEÑO

### Arquitectura de Integración

```
┌─────────────────────────────────────────────────────────────────┐
│                     Domain Services Layer                        │
│                                                                   │
│  PremiumCalculationService                                       │
│    ├─ Depende de: ISubscriberService ───────┐                   │
│    ├─ Depende de: ITariffService ─────┐     │                   │
│    ├─ Depende de: ICatalogService ────┤     │                   │
│    └─ Depende de: IBusinessLineService │     │                   │
│                                         │     │                   │
│  LocationValidationService              │     │                   │
│    ├─ Depende de: IZipCodeService ─────┼─┐   │                   │
│    └─ Depende de: IBusinessLineService ──┤   │                   │
│                                           │   │                   │
│  QuotationManagementService               │   │                   │
│    ├─ Depende de: IFolioGeneratorService ┼─┐ │                   │
│    └─ Depende de: ISubscriberService ──┐ │ │ │                   │
│                                         │ │ │ │                   │
└─────────────────────────────────────────│─│─│─│───────────────────┘
                                          │ │ │ │
┌─────────────────────────────────────────│─│─│─│───────────────────┐
│              Infrastructure Layer        │ │ │ │                   │
│                                          │ │ │ │                   │
│  ServiceAdapterFactory                   │ │ │ │                   │
│    ├─ mode: 'local' ──┐                  │ │ │ │                   │
│    └─ mode: 'remote'  │  ┌───────────────┤ │ │ │                   │
│                       │  │               │ │ │ │                   │
│  LocalServiceAdapter  │  │  HttpServiceAdapter                     │
│    │                  │  │    │                                    │
│    └─ LocalHandler ───┘  │    └─ fetch() → HTTP GET/POST/PUT      │
│         │                │                    │                     │
│         └─ Fixtures ─────────────────────────→ CORE_OHS_BASE_URL   │
│            (JSON files)    │                   (Remote Service)     │
│                            │                                       │
│  Implementations:          │                                       │
│    ├─ SubscriberStub ──────┘                                       │
│    ├─ AgentStub                                                    │
│    ├─ BusinessLineStub                                             │
│    ├─ ZipCodeStub                                                  │
│    ├─ FolioGeneratorStub                                           │
│    ├─ CatalogStub                                                  │
│    └─ TariffStub                                                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                     Persistence Layer                               │
│  (Ya existe en RQ-02: IQuotationRepository, etc.)                  │
└────────────────────────────────────────────────────────────────────┘
```

### Contratos de Integración (Interfaces)

#### 1. ISubscriberService

**Archivo**: `src/domain/contracts/integrations/ISubscriberService.ts`

```typescript
export interface Subscriber {
  readonly subscriberId: string;
  readonly name: string;
  readonly status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  readonly registeredDate: Date;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
}

export interface ISubscriberService {
  /**
   * Obtiene el listado de todos los suscriptores registrados.
   * Se utiliza para validar que el cliente existe antes de crear una cotización.
   */
  findAll(): Promise<Subscriber[]>;

  /**
   * Busca un suscriptor específico por su ID.
   * Retorna null si no existe.
   */
  findById(subscriberId: string): Promise<Subscriber | null>;
}
```

---

#### 2. IAgentService

**Archivo**: `src/domain/contracts/integrations/IAgentService.ts`

```typescript
export interface Agent {
  readonly agentCode: string;
  readonly name: string;
  readonly branch: string;
  readonly email: string;
  readonly commissionRate: number; // 0.05 = 5%
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly registeredDate: Date;
}

export interface IAgentService {
  /**
   * Busca un agente por su código único.
   * Se usa para validar BrivingData.agentCode durante cálculo.
   * Retorna null si no existe.
   */
  findByCode(agentCode: string): Promise<Agent | null>;
}
```

---

#### 3. IBusinessLineService

**Archivo**: `src/domain/contracts/integrations/IBusinessLineService.ts`

```typescript
export interface BusinessLine {
  readonly giroCode: string;
  readonly giroDescript: string;
  readonly fireKey: string;      // Clave de fuego para búsqueda de tarifas
  readonly categoryId: string;    // Categoría de riesgo
  readonly isActive: boolean;
}

export interface IBusinessLineService {
  /**
   * Obtiene el listado de todos los giros (business lines) y sus fireKey.
   * Se usa para poblar Business.fireKey automáticamente.
   */
  findAll(): Promise<BusinessLine[]>;

  /**
   * Busca un giro específico por código.
   * Retorna null si no existe.
   */
  findByCode(giroCode: string): Promise<BusinessLine | null>;

  /**
   * Busca un giro por su fireKey.
   * Retorna null si no existe.
   */
  findByFireKey(fireKey: string): Promise<BusinessLine | null>;
}
```

---

#### 4. IZipCodeService

**Archivo**: `src/domain/contracts/integrations/IZipCodeService.ts`

```typescript
export interface ZipCodeInfo {
  readonly postalCode: string;
  readonly state: string;
  readonly municipality: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly geographicZone: string;      // Zona catastrófica, normal, etc.
  readonly isValid: boolean;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface ValidationResult {
  readonly postalCode: string;
  readonly isValid: boolean;
  readonly errorMessage?: string;
  readonly data?: ZipCodeInfo;
}

export interface IZipCodeService {
  /**
   * Valida y resuelve dirección completa a partir de código postal.
   * Retorna null si no es válido.
   */
  findByCode(postalCode: string): Promise<ZipCodeInfo | null>;

  /**
   * Valida múltiples códigos postales en una sola llamada (batch).
   * Retorna un array con el resultado de cada validación.
   */
  validateBatch(postalCodes: string[]): Promise<ValidationResult[]>;
}
```

---

#### 5. IFolioGeneratorService

**Archivo**: `src/domain/contracts/integrations/IFolioGeneratorService.ts`

```typescript
export interface IFolioGeneratorService {
  /**
   * Genera el siguiente número de folio secuencial.
   * Formato esperado: "FOL-YYYY-NNNNNNN" (ej. FOL-2026-0000001)
   *
   * Si el servicio no está disponible, retorna folio en formato legacy:
   * "FOLIO-<timestamp>-<random>"
   */
  generateNext(): Promise<string>;

  /**
   * Reserva un folio específico para uso futuro (opcional).
   * Si ya está reservado, retorna false.
   */
  reserve(folioNumber: string): Promise<boolean>;
}
```

---

#### 6. ICatalogService

**Archivo**: `src/domain/contracts/integrations/ICatalogService.ts`

```typescript
export interface RiskClassification {
  readonly classificationId: string;
  readonly description: string;
  readonly baseRiskRate: number;     // Tasa base (ej. 0.02 = 2%)
  readonly riskGroup: string;        // GROUP-A, GROUP-B, etc.
  readonly isActive: boolean;
  readonly effectiveDate: Date;
}

export interface Guarantee {
  readonly guaranteeId: string;
  readonly description: string;
  readonly baseRate: number;         // Tasa base de garantía
  readonly isTariffable: boolean;    // Si se cobra
  readonly maxInsuredValue: number;
  readonly isActive: boolean;
  readonly categoryType: 'Fire' | 'Theft' | 'Electronic' | 'Perishable' | 'Other';
}

export interface ICatalogService {
  /**
   * Obtiene el catálogo de clasificaciones de riesgo disponibles.
   */
  getRiskClassifications(): Promise<RiskClassification[]>;

  /**
   * Obtiene el catálogo de garantías disponibles.
   */
  getGuarantees(): Promise<Guarantee[]>;

  /**
   * Busca una garantía específica por ID.
   * Retorna null si no existe.
   */
  findGuaranteeById(guaranteeId: string): Promise<Guarantee | null>;

  /**
   * Busca una clasificación de riesgo específica.
   * Retorna null si no existe.
   */
  findRiskClassificationById(classificationId: string): Promise<RiskClassification | null>;
}
```

---

#### 7. ITariffService

**Archivo**: `src/domain/contracts/integrations/ITariffService.ts`

```typescript
export interface FireTariff {
  readonly fireKey: string;
  readonly incendioEdificios: number;      // Tasa / componente
  readonly incendioContenidos: number;
  readonly extension: number;
  readonly catTev: number;
  readonly catFhm: number;
  readonly remocionEscombros: number;
  readonly gastosExtraordinarios: number;
  readonly perdidaRentas: number;
  readonly effectiveDate: Date;
  readonly expirationDate?: Date;
}

export interface CatFactors {
  readonly geographicZone: string;
  readonly factor: number;                 // 1.0 = sin modificación, 1.5 = 50% extra
  readonly description: string;
  readonly categoryId: string;
  readonly effectiveDate: Date;
}

export interface FhmRate {
  readonly riskGroup: string;
  readonly geographicZone: string;
  readonly rate: number;
  readonly description: string;
  readonly effectiveDate: Date;
}

export interface EEFactors {
  readonly baseFactor: number;
  readonly zoneFactors: Record<string, number>;
  readonly validityPeriod: { from: Date; to: Date };
}

export interface ITariffService {
  /**
   * Obtiene tarifas técnicas de incendio para un fireKey.
   * Retorna null si no existen tarifas para ese fireKey.
   */
  getFireTariffs(fireKey: string): Promise<FireTariff | null>;

  /**
   * Obtiene factores CAT (catastrofes) para una zona geográfica.
   * Si la zona no está en lista CAT, retorna factor = 1.0.
   */
  getCatFactors(geographicZone: string): Promise<CatFactors>;

  /**
   * Obtiene tasa FHM (Fenómenos Hidrometeorológicos) para grupo de riesgo y zona.
   */
  getFhmRates(riskGroup: string, geographicZone: string): Promise<FhmRate | null>;

  /**
   * Obtiene factores para equipo electrónico garantía.
   */
  getElectronicEquipmentFactors(): Promise<EEFactors>;
}
```

---

### Modelos de Datos (Request/Response)

#### Fixtures Structure (stubs/local mode)

Ubicación: `src/infraestructure/services/fixtures/`

```
fixtures/
├── subscribers.json        # Catálogo de suscriptores
├── agents.json            # Catálogo de agentes
├── business-lines.json    # Catálogo de giros y fireKeys
├── zip-codes.json         # Catálogo de código postales México
├── risk-classifications.json # Catálogo de clasificaciones
├── guarantees.json        # Catálogo de garantías
├── fire-tariffs.json      # Tarifas de incendio por fireKey
├── cat-factors.json       # Factores CAT por zona
├── fhm-rates.json         # Tasas FHM por grupo + zona
└── ee-factors.json        # Factores de equipo electrónico
```

**Ejemplo: `subscribers.json`**
```json
{
  "subscribers": [
    {
      "subscriberId": "SUB-001",
      "name": "Acme Corporation S.A.",
      "status": "ACTIVE",
      "registeredDate": "2024-01-15T10:00:00Z",
      "contactEmail": "seguros@acme.mx",
      "contactPhone": "+52-55-1234-5678"
    },
    {
      "subscriberId": "SUB-002",
      "name": "Global Logistics Ltd.",
      "status": "ACTIVE",
      "registeredDate": "2024-02-20T14:30:00Z",
      "contactEmail": "compliance@global.mx",
      "contactPhone": "+52-55-8765-4321"
    }
  ]
}
```

**Ejemplo: `zip-codes.json`**
```json
{
  "zipCodes": [
    {
      "postalCode": "28001",
      "state": "Madrid",
      "municipality": "Madrid",
      "neighborhood": "Gran Vía",
      "city": "Madrid",
      "geographicZone": "NORMAL",
      "isValid": true,
      "latitude": 40.4168,
      "longitude": -3.7038
    },
    {
      "postalCode": "10001",
      "state": "Ciudad de México",
      "municipality": "Cuauhtémoc",
      "neighborhood": "Centro",
      "city": "Ciudad de México",
      "geographicZone": "CAT-ZONE-001",
      "isValid": true,
      "latitude": 19.4326,
      "longitude": -99.1332
    }
  ]
}
```

---

### Flujo de Resolución con ServiceAdapterFactory

```
User Request (CreateFolioUseCase)
        ↓
QuotationManagementService.createFolio()
        ├─ Inyecta: ISubscriberService (interfaz)
        ├─ Inyecta: IFolioGeneratorService (interfaz)
        └─ ...otros servicios de integración
        ↓
ServiceAdapterFactory.resolve('CORE_OHS', localHandler?)
        ├─ Lee: process.env.CORE_OHS_MODE
        │   ├─ Si "local"  → LocalServiceAdapter(LocalHandler) → Fixtures JSON
        │   └─ Si "remote" → HttpServiceAdapter({ baseUrl: 'http://core.ohs.local' })
        ↓
ISubscriberService.findAll() / IFolioGeneratorService.generateNext()
        └─ Retorna datos (desde fixtures o HTTP)
```

---

### Wiring / Inyección de Dependencias

**Archivo**: `src/application/config/server.ts` (actualizar)

```typescript
// Pseudo-código ilustrativo
class AppContainer {
  // Resolver adapters por configuración
  const coreOhsAdapter = ServiceAdapterFactory.resolve(
    'CORE_OHS',
    new LocalCoreOhsHandler()  // Si es local, incluir handler
  );

  // Crear implementaciones de servicios de integración
  const subscriberService = new SubscriberServiceImpl(coreOhsAdapter);
  const agentService = new AgentServiceImpl(coreOhsAdapter);
  const businessLineService = new BusinessLineServiceImpl(coreOhsAdapter);
  const zipCodeService = new ZipCodeServiceImpl(coreOhsAdapter);
  const folioGeneratorService = new FolioGeneratorServiceImpl(coreOhsAdapter);
  const catalogService = new CatalogServiceImpl(coreOhsAdapter);
  const tariffService = new TariffServiceImpl(coreOhsAdapter);

  // Inyectar en servicios de dominio
  const premiumCalcService = new PremiumCalculationService(
    quotationRepository,
    { /* parámetros */, tariffService, catalogService }
  );

  const locationValidationService = new LocationValidationService({
    zipCodeService,
    businessLineService
  });

  // Inyectar en casos de uso
  const createFolioUseCase = new CreateFolioUseCaseImpl(
    quotationRepository,
    subscriberService,
    folioGeneratorService
  );

  // Registrar servicios como singletons
  // ...
}
```

---

### Implementaciones Concretas

#### Opción A: HttpServiceAdapterImpl (servicio real)

**Archivo**: `src/infraestructure/services/core-ohs/SubscriberServiceHttpImpl.ts`

```typescript
import { ISubscriberService, Subscriber } from '../../../domain/contracts/integrations/ISubscriberService';
import { IServiceAdapter } from '../../adapters/IServiceAdapter';

export class SubscriberServiceHttpImpl implements ISubscriberService {
  constructor(private readonly adapter: IServiceAdapter) {}

  async findAll(): Promise<Subscriber[]> {
    // GET http://core.ohs.local/v1/subscribers
    return this.adapter.get<Subscriber[]>('/v1/subscribers');
  }

  async findById(subscriberId: string): Promise<Subscriber | null> {
    // GET http://core.ohs.local/v1/subscribers/{subscriberId}
    try {
      return await this.adapter.get<Subscriber>(`/v1/subscribers/${subscriberId}`);
    } catch {
      return null;
    }
  }
}
```

---

#### Opción B: LocalServiceAdapterImpl (stubs/fixtures)

**Archivo**: `src/infraestructure/services/core-ohs/SubscriberServiceLocalImpl.ts`

```typescript
import { ISubscriberService, Subscriber } from '../../../domain/contracts/integrations/ISubscriberService';
import * as subscribersData from '../fixtures/subscribers.json';

export class SubscriberServiceLocalImpl implements ISubscriberService {
  async findAll(): Promise<Subscriber[]> {
    // Simula latencia de red
    await new Promise(r => setTimeout(r, 50));
    return subscribersData.subscribers;
  }

  async findById(subscriberId: string): Promise<Subscriber | null> {
    await new Promise(r => setTimeout(r, 50));
    return (
      subscribersData.subscribers.find(s => s.subscriberId === subscriberId) ||
      null
    );
  }
}
```

---

### Configuración de Variables de Entorno

**Archivo**: `.env.development` (ejemplo)

```
# Modo local: fixtures JSON / remote: HTTP hacia Core OHS
CORE_OHS_MODE=local
CORE_OHS_BASE_URL=http://core.ohs.local:3002
CORE_OHS_PORT=3002

# Modo de plataforma de daños
DANOS_PORT=3001
DANOS_MODE=local
```

---

### Mapeo: Qué Servicio Consume Qué Contrato

| Servicio de Dominio | Contratos que consume |
|---|---|
| `PremiumCalculationService` | `ISubscriberService`, `ITariffService`, `ICatalogService` |
| `LocationValidationService` | `IZipCodeService`, `IBusinessLineService`, `ICatalogService` |
| `QuotationManagementService` | `ISubscriberService`, `IFolioGeneratorService` |
| `CreateFolioUseCase` | `IQuotationRepository`, `ISubscriberService`, `IFolioGeneratorService` |
| `IManageLocationUseCase` | `IZipCodeService`, `IBusinessLineService`, `ICatalogService`, `ILocationRepository` |
| `ICalculatePremiumUseCase` | `ITariffService`, `ICatalogService`, `IPremiumResultRepository` |

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend — Infraestructure (Contratos y Factory)

#### Contratos de Integración
- [ ] Crear `src/domain/contracts/integrations/ISubscriberService.ts` con interfaz + tipos
- [ ] Crear `src/domain/contracts/integrations/IAgentService.ts`
- [ ] Crear `src/domain/contracts/integrations/IBusinessLineService.ts`
- [ ] Crear `src/domain/contracts/integrations/IZipCodeService.ts`
- [ ] Crear `src/domain/contracts/integrations/IFolioGeneratorService.ts`
- [ ] Crear `src/domain/contracts/integrations/ICatalogService.ts`
- [ ] Crear `src/domain/contracts/integrations/ITariffService.ts`
- [ ] Crear index.ts en `src/domain/contracts/integrations/` que exporte todas las interfaces
- [ ] Validar que todos los tipos sean conformes a diccionario de dominio (snake_case para timestamps, uid para Firebase, etc.)

#### Fixtures (stubs/local mode)
- [ ] Crear `src/infraestructure/services/fixtures/subscribers.json` con 20+ registros realistas
- [ ] Crear `src/infraestructure/services/fixtures/agents.json` con 15+ agentes
- [ ] Crear `src/infraestructure/services/fixtures/business-lines.json` con 12+ giros y fireKeys
- [ ] Crear `src/infraestructure/services/fixtures/zip-codes.json` con 100+ códigos postales validados (España + México)
- [ ] Crear `src/infraestructure/services/fixtures/risk-classifications.json` con 10+ clasificaciones
- [ ] Crear `src/infraestructure/services/fixtures/guarantees.json` con 20+ garantías (isTariffable mix)
- [ ] Crear `src/infraestructure/services/fixtures/fire-tariffs.json` con tarifas para 5+ fireKeys
- [ ] Crear `src/infraestructure/services/fixtures/cat-factors.json` con 5+ zonas CAT
- [ ] Crear `src/infraestructure/services/fixtures/fhm-rates.json` con factores por grupo + zona
- [ ] Crear `src/infraestructure/services/fixtures/ee-factors.json` para equipo electrónico
- [ ] Validar que NO hay datos sensibles (RFC, emails operacionales, información confidencial)
- [ ] Validar que datos de fixtures son coherentes (ej. businessLine.fireKey existe en fire-tariffs)

#### Implementaciones (stubs para local mode)
- [ ] Crear `src/infraestructure/services/core-ohs/SubscriberServiceLocalImpl.ts` que lea subscribers.json
- [ ] Crear `src/infraestructure/services/core-ohs/AgentServiceLocalImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/BusinessLineServiceLocalImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/ZipCodeServiceLocalImpl.ts` (soportar validateBatch)
- [ ] Crear `src/infraestructure/services/core-ohs/FolioGeneratorServiceLocalImpl.ts` (contador secuencial en memoria)
- [ ] Crear `src/infraestructure/services/core-ohs/CatalogServiceLocalImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/TariffServiceLocalImpl.ts` (soportar getCatFactors, getFhmRates, getElectronicEquipmentFactors)
- [ ] Crear `src/infraestructure/services/core-ohs/LocalCoreOhsHandler.ts` que maneje ruteo local

#### Implementaciones (HTTP para remote mode)
- [ ] Crear `src/infraestructure/services/core-ohs/SubscriberServiceHttpImpl.ts` usando HttpServiceAdapter
- [ ] Crear `src/infraestructure/services/core-ohs/AgentServiceHttpImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/BusinessLineServiceHttpImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/ZipCodeServiceHttpImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/FolioGeneratorServiceHttpImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/CatalogServiceHttpImpl.ts`
- [ ] Crear `src/infraestructure/services/core-ohs/TariffServiceHttpImpl.ts`

#### Wiring / inyección de dependencias
- [ ] Actualizar `src/application/config/envs.ts` para incluir `CORE_OHS_MODE` y `CORE_OHS_BASE_URL`
- [ ] Crear factory en `src/application/config/serviceFactory.ts` que resuelva adaptadores + implementations
- [ ] Registrar servicios de integración en contenedor de DI (ej. AppContainer)
- [ ] Inyectar servicios en `PremiumCalculationService`
- [ ] Inyectar servicios en `LocationValidationService`
- [ ] Inyectar servicios en `QuotationManagementService`
- [ ] Validar que wiring respete principios SOLID: inyección clear, sin circular dependencies

### Backend — Domain (Actualización de servicios)

#### Actualización de PremiumCalculationService
- [ ] Agregar parámetro constructor: `private readonly tariffService: ITariffService`
- [ ] Agregar parámetro constructor: `private readonly catalogService: ICatalogService`
- [ ] Actualizar `_calculateLocationPremium()` para consumir `tariffService.getFireTariffs(fireKey)`
- [ ] Actualizar `_calculateLocationPremium()` para aplicar `tariffService.getCatFactors(zone)`
- [ ] Actualizar `_calculateLocationPremium()` para aplicar `tariffService.getFhmRates(riskGroup, zone)`
- [ ] Agregar validación de Guarantee usando `catalogService.getGuarantees()`
- [ ] Validar que locaciones completas conozcan `geographicZone` (resuelto por IZipCodeService)

#### Actualización de LocationValidationService
- [ ] Agregar parámetro constructor: `private readonly zipCodeService: IZipCodeService`
- [ ] Agregar parámetro constructor: `private readonly businessLineService: IBusinessLineService`
- [ ] En validación, invocar `zipCodeService.findByCode(location.address.postalCode)` y generar alert si no es válido
- [ ] En validación, resolver `businessLineService.findByCode(location.business.businessLine)` para validar fireKey
- [ ] Si zipCode no es válido, generar ValidationAlert con `isBlocking=true`

#### Actualización de QuotationManagementService
- [ ] Agregar parámetro constructor: `private readonly subscriberService: ISubscriberService`
- [ ] Agregar parámetro constructor: `private readonly folioGeneratorService: IFolioGeneratorService`
- [ ] En `createFolio()`, invocar `subscriberService.findById(insuredData.subscriberId)` y rechazar si no existe
- [ ] En `createFolio()`, invocar `folioGeneratorService.generateNext()` para obtener folio
- [ ] Implementar fallback a formato legacy si generateNext() falla

#### Actualización de use cases
- [ ] `CreateFolioUseCase`: inyectar `ISubscriberService`, `IFolioGeneratorService`
- [ ] `IManageLocationUseCase`: inyectar `IZipCodeService`, `IBusinessLineService`, `ICatalogService`
- [ ] `ICalculatePremiumUseCase`: ya depende de `PremiumCalculationService` (que a su vez consume `ITariffService`, etc.)

### Backend — Tests

#### Unit Tests - Servicios de Integración (Stubs)
- [ ] `test_SubscriberServiceLocal_findAll_returns_list` — mock de fixtures
- [ ] `test_SubscriberServiceLocal_findById_returns_subscriber`
- [ ] `test_SubscriberServiceLocal_findById_null_if_not_found`
- [ ] `test_ZipCodeServiceLocal_validateBatch_returns_validation_results` — batch mode
- [ ] `test_FolioGeneratorServiceLocal_generateNext_returns_sequential` — verificar secuencia
- [ ] `test_FolioGeneratorServiceLocal_generateNext_no_duplicates` — 100 llamadas sin duplicados

#### Unit Tests - Servicios de Dominio (actualizado)
- [ ] `test_PremiumCalculationService_calculateLocationPremium_applies_tariff_factors`
- [ ] `test_PremiumCalculationService_calculateLocationPremium_applies_cat_factor` — para zona CAT
- [ ] `test_PremiumCalculationService_calculateLocationPremium_filters_tariffable_guarantees`
- [ ] `test_LocationValidationService_validateLocation_generates_alert_invalid_zip`
- [ ] `test_LocationValidationService_validateLocation_resolves_firekey_from_business_line`
- [ ] `test_QuotationManagementService_createFolio_rejects_invalid_subscriber`
- [ ] `test_QuotationManagementService_createFolio_uses_sequential_folio`

#### Integration Tests - Flujo E2E (local mode)
- [ ] `test_CreateFolioUseCase_E2E_with_local_services` — crear folio con fixtures
- [ ] `test_ManageLocationUseCase_E2E_register_and_validate_location` — registrar + validar
- [ ] `test_CalculatePremiumUseCase_E2E_full_calculation_with_tariffs` — calcular prima
- [ ] `test_SwitchBetweenLocalAndRemote_adapter_resolution` — verificar que switch local↔remote funciona

#### Integration Tests - Adaptadores (si hay servicio real disponible)
- [ ] `test_SubscriberServiceHttpImpl_GET_subscribers_returns_list` — contra servicio real
- [ ] `test_HttpServiceAdapter_respects_timeout` — validar timeout en HttpServiceAdapter
- [ ] `test_HttpServiceAdapter_retries_on_5xx` — reintentos si aplica

### QA — Test Strategy

#### Gherkin Scenarios (critical paths)
- [ ] Escenario: Crear folio con suscriptor válido desde catálogo (fixtures)
- [ ] Escenario: Rechazar folio si suscriptor no existe
- [ ] Escenario: Registrar ubicación con código postal válido → resuelve geographicZone
- [ ] Escenario: Rechazar ubicación si código postal inválido
- [ ] Escenario: Calcular prima aplicando taritas de incendio + factores CAT
- [ ] Escenario: Generar folios secuenciales sin colisiones

#### Performance Tests
- [ ] Validación masiva de 100 códigos postales con `validateBatch()` < 2s (local) / < 5s (remote)
- [ ] Cálculo de prima para 50 ubicaciones < 1s
- [ ] Descarga de catálogos (subscribers, agents, guarantee, risk-classifications) < 1s

#### Risk Assessment
- [ ] **Alto**: Integridad de folio secuencial — hay índice único en DB
- [ ] **Medio**: Fallback de folio si servicio core no disponible — documentado en error handling
- [ ] **Medio**: Coherencia de datos en fixtures — validación cruzada (fireKey, riskGroup, etc.)
- [ ] **Bajo**: Latencia de validación masiva de ZipCodes — aceptable con batch endpoint

### Documentation

#### API Contracts
- [ ] Documentar en Swagger/OpenAPI cada endpoint de referencia del core (GET /v1/subscribers, etc.)
- [ ] Documentar request/response de cada contrato de integración
- [ ] Incluir ejemplos de JSON para fixtures y respuestas HTTP

#### README Updates
- [ ] Sección "Core OHS Integration" en README.md explicando:
  - Qué 9 servicios se integran
  - Cómo seleccionar entre local (fixtures) y remote (HTTP)
  - Ejemplo de configuración `.env`
  - Estructura de fixtures
- [ ] Guía para developers: "Cómo agregar un nuevo servicio de integración"

#### ADR (Architecture Decision Record) *(opcional)*
- [ ] Documento `docs/ADR-005-core-osh-integration.md` explicando:
  - Decisión: ServiceAdapterFactory para resolución de implementación
  - Alternativas evaluadas
  - Razones de la decisión
  - Implicaciones a futuro
