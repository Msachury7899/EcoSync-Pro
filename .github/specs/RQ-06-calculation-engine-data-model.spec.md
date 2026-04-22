---
id: SPEC-006
status: IMPLEMENTED
feature: RQ-06-calculation-engine-data-model
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-001 (RQ-01 domain-driven-design-layer)
  - SPEC-004 (RQ-04 quotation-endpoints)
  - SPEC-005 (RQ-05 core-integration)
---

# Spec: Motor de Cálculo Técnico de Prima y Modelo de Datos

> **Estado:** `IN_PROGRESS` — aprobada el 2026-03-30. Implementación en curso.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Se requiere implementar el motor de cálculo técnico de prima a nivel de infraestructura e ir completar el modelo de datos (colecciones Prisma) necesario para soportar la persistencia del cotizador de daños. El dominio ya define el flujo abstracto (`PremiumCalculationService`) y los contratos de repositorios; este requerimiento cubre:

1. **Schema Prisma** con 9 colecciones (1 transaccional + 8 de referencia)
2. **Implementaciones concretas** de 4 repositorios (puertos → adaptadores)
3. **Reglas de negocio concretas** que implementen los contratos
4. **Seed data** para todas las colecciones de referencia
5. **Flujo de cálculo real** que resuelve datos técnicos de tarifas

### Requerimiento de Negocio

El servicio de dominio `PremiumCalculationService` define el flujo de 8 pasos pero depende de repositorios que **no tienen implementación concreta**. Sin persistencia en Prisma ni datos técnicos resolubles, el cálculo no puede ejecutarse de punta a punta. Este requerimiento materializa la capa de infraestructura que cierra el circuito.

---

### Historias de Usuario

#### HU-01: Crear Schema Prisma con 9 Colecciones de Cálculo

```
Como:        Desarrollador backend de infraestructura
Quiero:      Definir el schema de Prisma con las 9 colecciones necesarias (1 transaccional + 8 referencia)
Para:        Materializar la persistencia del cotizador de daños y sus datos técnicos

Prioridad:   Alta
Estimación:  L
Dependencias: RQ-01 (dominio), RQ-05 (estructura de tarifas)
Capa:        Backend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Schema define colección cotizaciones_danos con estructura del agregado Quotation
  Dado que:  Se ejecuta prisma migrate dev
  Cuando:    Se crea el documento de cotización completo
  Entonces:  Los campos folioNumber, insuredData, locations, coverageOptions, financialResult y version se persisten correctamente

CRITERIO-1.2: Colecciones de referencia (tarifas, parámetros) están indexadas para consulta rápida
  Dado que:  Se define índice en tarifas_incendio por fireKey
  Cuando:    Se consulta por fireKey desde el cálculo
  Entonces:  La consulta usa el índice (verificable en explain plan)

CRITERIO-1.3: Seed data tiene cohesión: 5 fireKeys, 5 zonas CAT, 3 grupos FHM con factores de equipo
  Dado que:  Se ejecuta npm run seed:all
  Cuando:    Se consulta parametros_calculo
  Entonces:  Existe un documento vigente con baseRates para los 10 componentes mínimos
```

**Error Path**
```gherkin
CRITERIO-1.4: Prisma valida restricciones de no nulibilidad en campos obligatorios
  Dado que:  Se intenta insertar documento sin folioNumber
  Cuando:    Se ejecuta save() en cotizaciones_danos
  Entonces:  Lanza error de validación Prisma: "folioNumber es obligatorio"

CRITERIO-1.5: Tipos Prisma están alineados con value objects del dominio (no hay type mismatch)
  Dado que:  Se instancia CalculationParameters desde DB
  Cuando:    Se mapea a VO del dominio
  Entonces:  Todos los tipos coinciden (no hay conversiones forzadas)
```

---

#### HU-02: Implementar Repositorio IQuotationRepository en Prisma/MongoDB

```
Como:        Desarrollador backend de infraestructura
Quiero:      Crear adaptador concreto QuotationRepositoryImpl que persista en cotizaciones_danos
Para:        Resolver el puerto IQuotationRepository y soportar operaciones CRUD del agregado

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, RQ-01 (IQuotationRepository interfaz)
Capa:        Backend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: findByFolio(folioNumber) retorna QuotationAggregate con locations poblado
  Dado que:  Existe documento en cotizaciones_danos con folio FLO-2024-001
  Cuando:    Se ejecuta repository.findByFolio("FLO-2024-001")
  Entonces:  Retorna QuotationAggregate con array de 3 Location intactos

CRITERIO-2.2: save(quotation) persiste el agregado completo sin sobrescribir versionado
  Dado que:  Se crea nueva instancia QuotationAggregate
  Cuando:    Se ejecuta repository.save(quotation)
  Entonces:  El documento se persiste con version=1 (autogenerado) y campos intactos

CRITERIO-2.3: updatePartial(folioNumber, section, version) implementa versionado optimista
  Dado que:  version actual en BD es 2 y se intenta actualizar con version=2
  Cuando:    Se ejecuta updatePartial(folio, { locations }, 2)
  Entonces:  Se actualiza solo locations manteniendo version=3 y otros campos intactos
```

**Error Path**
```gherkin
CRITERIO-2.4: findByFolio retorna null si no existe
  Dado que:  No existe documento con folio FLO-INEXISTENTE
  Cuando:    Se ejecuta repository.findByFolio("FLO-INEXISTENTE")
  Entonces:  Retorna null sin lanzar excepción

CRITERIO-2.5: updatePartial lanza VersionConflictError si versión no coincide
  Dado que:  version actual es 2 pero se intenta actualizar con version=1
  Cuando:    Se ejecuta updatePartial(folio, section, 1)
  Entonces:  Lanza VersionConflictError con mensaje "Conflicto de versión"
```

---

#### HU-03: Implementar Repositorio ICalculationParametersRepository

```
Como:        Desarrollador backend de infraestructura
Quiero:      Crear adaptador CalculationParametersRepositoryImpl que lea de parametros_calculo
Para:        Resolver tasas base, factor comercial y factor CAT vigentes para el cálculo

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01, RQ-01 (ICalculationParametersRepository interfaz)
Capa:        Backend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: getGlobalParameters() retorna CalculationParameters con baseRates para 10 componentes mínimos
  Dado que:  Existe documento vigente en parametros_calculo
  Cuando:    Se ejecuta repository.getGlobalParameters()
  Entonces:  Retorna CalculationParameters con baseRates para: incendioEdificios, incendioContenidos, extensionCobertura, catTev, catFhm, remocionEscombros, gastosExtraordinarios, perdidaRentas, bi, equipoElectronico

CRITERIO-3.2: Parámetros incluyen comercialFactor y catZoneFactor además de baseRates
  Dado que:  Se obtienen parámetros globales
  Cuando:    Se instancia CalculationParameters
  Entonces:  Todos los campos (baseRates, commercialFactor, catZoneFactor) están poblados y son válidos
```

---

#### HU-04: Implementar Repositorio IPremiumResultRepository (Persistencia Atómica)

```
Como:        Desarrollador backend de infraestructura
Quiero:      Crear adaptador PremiumResultRepositoryImpl que persista atomicamente los resultados financieros
Para:        Garantizar que netPremium, commercialPremium y premiumsByLocation se guardan juntos sin parcialidad

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, HU-02, RQ-01 (IPremiumResultRepository interfaz)
Capa:        Backend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: savePremiumResult persiste netPremium, commercialPremium y premiumsByLocation en una transacción atómica
  Dado que:  Se calcula prima de 2 ubicaciones (una calculable, una incompleta)
  Cuando:    Se ejecuta repository.savePremiumResult(folio, result, version)
  Entonces:  Los 3 campos se persisten juntos sin sobrescribir otras secciones de cotizaciones_danos

CRITERIO-4.2: incompleteLocations se guarda también en el resultado para auditoría
  Dado que:  1 de 2 ubicaciones no es calculable
  Cuando:    Se persiste el resultado
  Entonces:  incompleteLocations contiene la ubicación con razón de por qué no fue calculable
```

**Error Path**
```gherkin
CRITERIO-4.3: Lanza VersionConflictError si versión no coincide
  Dado que:  version actual es 3 pero se intenta persistir con version=2
  Cuando:    Se ejecuta savePremiumResult(folio, result, 2)
  Entonces:  Lanza VersionConflictError sin actualizar documento
```

---

#### HU-05: Implementar Reglas de Negocio Concretas

```
Como:        Desarrollador backend de infraestructura
Quiero:      Implementar ILocationCalculabilityRule, IOptimisticVersionRule (si aplica), IPremiumPersistenceRule
Para:        Encapsular las reglas de negocio concretas sin lógica en repositorios

Prioridad:   Alta
Estimación:  M
Dependencias: RQ-01 (contratos de reglas)
Capa:        Backend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: LocationCalculabilityRule retorna true si postalCode, fireKey y tariffable guarantee existen
  Dado que:  Una Location tiene postalCode="64000", business.fireKey="FK-COM-003", y 1+ Guarantee con isTariffable=true
  Cuando:    Se ejecuta rule.isCalculable(location)
  Entonces:  Retorna true

CRITERIO-5.2: LocationCalculabilityRule retorna false si falta algún criterio
  Dado que:  Una Location tiene postalCode="" (vacío)
  Cuando:    Se ejecuta rule.isCalculable(location)
  Entonces:  Retorna false y getAlerts() incluye "postalCode es obligatorio"
```

---

#### HU-06: Implementar Seed Data para Colecciones de Referencia

```
Como:        Desarrollador backend de infraestructura
Quiero:      Crear seed data coherente para tarifas, parámetros, catálogos y dimensiones
Para:        Tener datos suficientes para probar el flujo E2E con 2 ubicaciones (una calculable, una incompleta)

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: Seed data de tarifas_incendio incluye 5 fireKeys con tasas para componentes obligatorios
  Dado que:  Se ejecuta npm run seed:fire-tariffs
  Cuando:    Se consulta tarifas_incendio
  Entonces:  Existen 5 documentos (FK-HOTEL-001, FK-REST-002, FK-COM-003, FK-BOD-004, FK-OFI-005) con tasas base válidas

CRITERIO-6.2: Seed data de parametros_calculo contiene un documento vigente con 10 baseRates mínimos
  Dado que:  Se ejecuta npm run seed:calculation-parameters
  Cuando:    Se consulta parametros_calculo
  Entonces:  Existe documento con commercialFactor=1.25, catZoneFactor=1.35 y baseRates populado

CRITERIO-6.3: Seed data de catalogo_cp_zonas mapea 5 códigos postales a zonas catastróficas
  Dado que:  Se ejecuta npm run seed:cp-zones
  Cuando:    Se consulta por código postal "64000"
  Entonces:  Retorna municipio="Monterrey", estado="Nuevo León", catastrophicZone="CAT-ZONE-001"
```

---

#### HU-07: Conexión del Cálculo Real con Tarifas (Resolver Datos Técnicos)

```
Como:        Desarrollador backend de infraestructura
Quiero:      Modificar PremiumCalculationService para resolver datos reales de tarifas vía ITariffService o repositorios
Para:        Que el cálculo no use tasas hardcodeadas sino que consulte colecciones de referencia

Prioridad:   Alta
Estimación:  L
Dependencias: HU-01 a HU-06, RQ-05 (ITariffService)
Capa:        Backend
```

#### Criterios de Aceptación — HU-07

**Happy Path**
```gherkin
CRITERIO-7.1: _calculateLocationPremium resuelve tarifas dinámicamente desde FireTariff por fireKey
  Dado que:  Una Location tiene business.fireKey="FK-COM-003"
  Cuando:    Se calcula prima de esa ubicación
  Entonces:  Los componentes (incendioEdificios, incendioContenidos, etc.) se calculan usando tasas reales de tarifas_incendio

CRITERIO-7.2: Componentes CAT usan factores específicos de zona si location.catastrophicZone existe
  Dado que:  Una Location tiene catastrophicZone="CAT-ZONE-001"
  Cuando:    Se resuelve catTev y catFhm
  Entonces:  Se aplica factor 1.5 para catTev de esa zona
```

---

#### HU-08: Tests Unitarios e Integración del Motor de Cálculo

```
Como:        Test Engineer
Quiero:      Crear suite de tests para todos los repositorios, reglas y el flujo E2E
Para:        Validar que el motor funciona correctamente con datos reales

Prioridad:   Alta
Estimación:  L
Dependencias: HU-01 a HU-07
Capa:        Backend
```

#### Criterios de Aceptación — HU-08

**Happy Path**
```gherkin
CRITERIO-8.1: Test E2E: encontro folio + leer parámetros + calcular 2 ubicaciones + persistir atomicamente
  Dado que:  Existen 2 ubicaciones (una con postalCode válido y fireKey, otra sin fireKey)
  Cuando:    Se ejecuta calculatePremium("FLO-TEST-001")
  Entonces:  Retorna result con netPremium > 0, commercialPremium correcto, premiumsByLocation[] con 1 item, incompleteLocations[] con 1 item

CRITERIO-8.2: Test de VersionConflictError cuando hay conflicto de versión
  Dado que:  version en BD es 5 pero se intenta persistir con version=3
  Cuando:    Se ejecuta savePremiumResult
  Entonces:  Lanza VersionConflictError
```

---

### Reglas de Negocio

1. **Cálculo Atómico**: netPremium, commercialPremium y premiumsByLocation deben guardarse en una única operación de base de datos. No hay estados intermedios.

2. **Ubicaciones Incompletas No Bloquean**: Una Location que no cumple criterios de calculabilidad debe reportarse en `incompleteLocations[]` pero no frenar el cálculo de las demás.

3. **Versionado Optimista**: Toda actualización de `cotizaciones_danos` valida la versión actual. Si hay conflicto, lanza `VersionConflictError` sin actualizar.

4. **Datos Técnicos Resolubles**: Las queries a tarifas, parámetros y catálogos deben ser rápidas (indexadas). Todas las tasas deben estar vigentes (validar `effectiveDate` y `expirationDate` si aplica).

5. **Colecciones de Referencia Solo Lectura**: Desde el cotizador, solo se leen tarifas, parámetros, catálogos. No se escriben. La única escritura es en `cotizaciones_danos`.

6. **Cálculo por Componente**: Para cada componente, la fórmula es: `suma_asegurada_tarificable × tasa_base × factor_zona_cat (si aplica) × factor_equipo (si aplica)`.

---

## 2. DISEÑO

### Modelo de Datos — Schema Prisma

#### Estructura General

```plaintext
cotizaciones_danos (transaccional, lectura+escritura)
  ↓
  Embeds: insuredData, locations, coverageOptions, financialResult, metadata, version

parametros_calculo (referencia, solo lectura)
tarifas_incendio (referencia, solo lectura)
tarifas_cat (referencia, solo lectura)
tarifa_fhm (referencia, solo lectura)
factores_equipo_electronico (referencia, solo lectura)
catalogo_cp_zonas (referencia, solo lectura)
dim_zona_tev (referencia, solo lectura)
dim_zona_fhm (referencia, solo lectura)
```

#### Colección 1: cotizaciones_danos

**Propósito**: Almacena el agregado raíz `QuotationAggregate` con todas sus secciones: datos generales, ubicaciones, opciones de cobertura y resultado financiero.

**Estructura**:
```json
{
  "_id": "ObjectId (autogenerado)",
  "folioNumber": "FLO-2024-001",
  "version": 1,
  "insuredData": {
    "name": "Empresa ABC SRL",
    "taxId": "RFC-12345",
    "contactInfo": {
      "email": "contacto@empresa.com",
      "phone": "+52-1-8888-0000"
    }
  },
  "businessType": "comercio_general",
  "locations": [
    {
      "index": 0,
      "locationName": "Matriz",
      "address": {
        "street": "Av. Principal 123",
        "postalCode": "64000",
        "city": "Monterrey",
        "state": "Nuevo León",
        "country": "México"
      },
      "business": {
        "fireKey": "FK-COM-003",
        "description": "Comercio mayorista"
      },
      "catastrophicZone": "CAT-ZONE-001",
      "guarantees": [
        {
          "guaranteeId": "GAR-001",
          "description": "Incendio Edificios",
          "insuredValue": 50000000,
          "isTariffable": true
        }
      ]
    }
  ],
  "coverageOptions": {
    "includeDebris": true,
    "businessInterruption": true,
    "electronicEquipment": false
  },
  "financialResult": {
    "netPremium": 125000.50,
    "commercialPremium": 156250.62,
    "premiumsByLocation": [
      {
        "locationIndex": 0,
        "netPremium": 125000.50,
        "components": {
          "incendioEdificios": 60000.00,
          "incendioContenidos": 35000.00,
          "extensionCobertura": 15000.00,
          "catTev": 7500.50,
          "catFhm": 5000.00,
          "remocionEscombros": 1250.00,
          "gastosExtraordinarios": 500.00,
          "perdidaRentas": 750.00
        }
      }
    ],
    "incompleteLocations": []
  },
  "metadata": {
    "createdAt": "2026-03-30T10:15:00Z",
    "updatedAt": "2026-03-30T10:15:00Z",
    "calculatedAt": "2026-03-30T10:20:00Z"
  },
  "createdAt": "2026-03-30T10:15:00Z",
  "updatedAt": "2026-03-30T10:20:00Z"
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `_id` | ObjectId | único | ID automático MongoDB |
| `folioNumber` | string | único | Identificador único de cotización |
| `version` | number | — | Versionado optimista (comienza en 1) |
| `insuredData` | object | — | Datos asegurado |
| `businessType` | string | — | Tipo de negocio del asegurado |
| `locations` | array | — | Array de ubicaciones |
| `coverageOptions` | object | — | Opciones de cobertura seleccionadas |
| `financialResult` | object | — | Resultado del cálculo de prima |
| `metadata` | object | — | Timestamps y auditoría |
| `createdAt` | date | — | Fecha creación UTC |
| `updatedAt` | date | — | Fecha actualización UTC |

**Índices**:
- `folioNumber` (único): búsqueda de cotización por folio
- `createdAt`: ordenamiento por fecha

---

#### Colección 2: parametros_calculo

**Propósito**: Almacena parámetros globales para aplicar al cálculo de prima (tasas base para todos los componentes, factor comercial, factor CAT).

**Estructura**:
```json
{
  "_id": "ObjectId",
  "version": "1.0",
  "effectiveDate": "2026-01-01T00:00:00Z",
  "expirationDate": null,
  "commercialFactor": 1.25,
  "catZoneFactor": 1.35,
  "baseRates": {
    "incendioEdificios": 0.0012,
    "incendioContenidos": 0.0015,
    "extensionCobertura": 0.0008,
    "catTev": 0.0025,
    "catFhm": 0.003,
    "remocionEscombros": 0.0005,
    "gastosExtraordinarios": 0.0004,
    "perdidaRentas": 0.0018,
    "bi": 0.0002,
    "equipoElectronico": 0.0035
  }
}
```

**Campos obligatorios**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `version` | string | Versión del parámetro (ej. "1.0") |
| `effectiveDate` | date | Fecha vigencia inicio |
| `expirationDate` | date (nullable) | Fecha vigencia fin |
| `commercialFactor` | number | Factor para pasar prima neta a comercial (ej. 1.25) |
| `catZoneFactor` | number | Factor para zonas catastróficas (ej. 1.35) |
| `baseRates` | object | Tasas por componente técnico |

---

#### Colección 3: tarifas_incendio

**Propósito**: Tasas base por giro (fireKey). Incluye componentes de incendio, CAT y derivados.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "fireKey": "FK-COM-003",
  "incendioEdificios": 0.001,
  "incendioContenidos": 0.0013,
  "extension": 0.0007,
  "catTev": 0.0025,
  "catFhm": 0.003,
  "remocionEscombros": 0.0004,
  "gastosExtraordinarios": 0.0003,
  "perdidaRentas": 0.0016,
  "effectiveDate": "2024-01-01T00:00:00Z",
  "expirationDate": null
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `fireKey` | string | único | Clave giro (ej. FK-COM-003) |
| `incendioEdificios` | number | — | Tasa base edificios |
| `incendioContenidos` | number | — | Tasa base contenidos |
| `extension` | number | — | Tasa es extensión de cobertura |
| `catTev` | number | — | Tasa CAT TEV |
| `catFhm` | number | — | Tasa CAT FHM |
| `remocionEscombros` | number | — | Tasa remoción escombros |
| `gastosExtraordinarios` | number | — | Tasa gastos extraordinarios |
| `perdidaRentas` | number | — | Tasa pérdida de rentas |
| `effectiveDate` | date | — | Vigencia inicio |
| `expirationDate` | date (nullable) | — | Vigencia fin |

---

#### Colección 4: tarifas_cat

**Propósito**: Factores CAT por zona geográfica catastrófica.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "geographicZone": "CAT-ZONE-001",
  "categoryId": "CAT-A",
  "factor": 1.5,
  "description": "Zona Centro México - Alta Sismicidad",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `geographicZone` | string | único | ID de zona (ej. CAT-ZONE-001) |
| `categoryId` | string | — | Categoría de riesgo (CAT-A, CAT-B, CAT-NONE) |
| `factor` | number | — | Factor multiplicador (ej. 1.5) |
| `description` | string | — | Descripción de zona y riesgos |
| `effectiveDate` | date | — | Vigencia |

---

#### Colección 5: tarifa_fhm

**Propósito**: Cuotas FHM por grupo de riesgo, zona geográfica y condición.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "riskGroup": "GRP-COM",
  "geographicZone": "CAT-ZONE-001",
  "condition": "standard",
  "rate": 0.0035,
  "description": "Comercio zona de alta sismicidad",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `riskGroup` | string | compuesto | Grupo de riesgo (ej. GRP-COM) |
| `geographicZone` | string | compuesto | Zona geográfica (ej. CAT-ZONE-001) |
| `condition` | string | compuesto | Condición (standard, improved, etc.) |
| `rate` | number | — | Cuota FHM |
| `description` | string | — | Descripción |
| `effectiveDate` | date | — | Vigencia |

**Índice compuesto**: `(riskGroup, geographicZone, condition)`

---

#### Colección 6: factores_equipo_electronico

**Propósito**: Factores de equipo electrónico por tipo de equipo.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "equipmentType": "servidores",
  "baseFactor": 0.025,
  "categoryDescription": "Servidores y equipos de TI",
  "maxInsuredValue": 50000000,
  "validityPeriod": {
    "from": "2024-01-01T00:00:00Z",
    "to": null
  }
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `equipmentType` | string | único | Tipo de equipo (ej. servidores) |
| `baseFactor` | number | — | Factor base |
| `categoryDescription` | string | — | Descripción |
| `maxInsuredValue` | number | — | Suma asegurada máxima |
| `validityPeriod` | object | — | Período vigencia (from, to) |

---

#### Colección 7: catalogo_cp_zonas

**Propósito**: Mapeo código postal → zona, estado, municipio, ciudad.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "postalCode": "64000",
  "state": "Nuevo León",
  "municipality": "Monterrey",
  "city": "Monterrey",
  "neighborhood": "Centro",
  "geographicZone": "CAT-ZONE-001",
  "isValid": true,
  "latitude": 25.6866,
  "longitude": -100.3161
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `postalCode` | string | único | Código postal |
| `state` | string | — | Entidad federativa |
| `municipality` | string | — | Municipio |
| `city` | string | — | Ciudad |
| `neighborhood` | string | — | Colonia/barrio |
| `geographicZone` | string | — | Zona CAT asignada |
| `isValid` | boolean | — | Validez del código postal |
| `latitude` | number | — | Latitud (opcional) |
| `longitude` | number | — | Longitud (opcional) |

---

#### Colección 8: dim_zona_tev

**Propósito**: Dimensión de zonas TEV con clasificación y descripción.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "zone": "CAT-ZONE-001",
  "zoneDescription": "Zona Centro México - Alta Sismicidad",
  "zoneClass": "A",
  "riskLevel": "alto",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `zone` | string | único | ID zona TEV |
| `zoneDescription` | string | — | Descripción |
| `zoneClass` | string | — | Clase de riesgo |
| `riskLevel` | string | — | Nivel de riesgo (bajo, medio, alto) |
| `effectiveDate` | date | — | Vigencia |

---

#### Colección 9: dim_zona_fhm

**Propósito**: Dimensión de zonas FHM con clasificación y grupo.

**Estructura**:
```json
{
  "_id": "ObjectId",
  "zone": "CAT-ZONE-001",
  "zoneDescription": "Zona Centro México",
  "zoneGroup": "GRP-A",
  "riskClassification": "alta_sismicidad",
  "effectiveDate": "2024-01-01T00:00:00Z"
}
```

**Campos obligatorios**:
| Campo | Tipo | Índice | Descripción |
|-------|------|--------|-------------|
| `zone` | string | único | ID zona FHM |
| `zoneDescription` | string | — | Descripción |
| `zoneGroup` | string | — | Grupo asignado |
| `riskClassification` | string | — | Clasificación riesgo |
| `effectiveDate` | date | — | Vigencia |

---

### Implementación de Repositorios — Adaptadores

#### QuotationRepositoryImpl

**Archivo**: `src/infraestructure/services/database/QuotationRepositoryImpl.ts`

**Métodos**:

```typescript
async findByFolio(folioNumber: string): Promise<QuotationAggregate | null>
  // Busca documento en cotizaciones_danos por folioNumber
  // Mapea DocumentoCotizacion → QuotationAggregate
  // Retorna null si no existe

async save(quotation: QuotationAggregate): Promise<void>
  // Inserta nuevo documento o actualiza existente
  // Asigna version=1 si es nuevo
  // Lanza si folioNumber ya existe

async updatePartial(folioNumber: string, section: Partial<QuotationAggregate>, version: number): Promise<void>
  // Actualiza solo campos específicos validando versión
  // Si versión no coincide, lanza VersionConflictError
  // Incrementa version automáticamente

async existsByFolio(folioNumber: string): Promise<boolean>
  // Retorna true/false si existe cotización con ese folio
```

---

#### CalculationParametersRepositoryImpl

**Archivo**: `src/infraestructure/services/database/CalculationParametersRepositoryImpl.ts`

**Métodos**:

```typescript
async getGlobalParameters(): Promise<CalculationParameters>
  // Busca documento vigente en parametros_calculo
  // Valida effectiveDate <= hoy <= expirationDate (si aplica)
  // Mapea DocumentoParametros → CalculationParameters (VO)
  // Si no existe documento vigente, lanza error
```

---

#### PremiumResultRepositoryImpl

**Archivo**: `src/infraestructure/services/database/PremiumResultRepositoryImpl.ts`

**Métodos**:

```typescript
async savePremiumResult(folioNumber: string, result: PremiumCalculationResult, version: number): Promise<void>
  // Actualiza financialResult atómicamente en una txn
  // Valida versión antes de actualizar
  // Solo modifica financialResult, no toca otras secciones
  // Lanza VersionConflictError si version no coincide
  // Incrementa version automáticamente a version+1
```

---

#### LocationRepositoryImpl

**Archivo**: `src/infraestructure/services/database/LocationRepositoryImpl.ts`

**Métodos**:

```typescript
async findAllByFolio(folioNumber: string): Promise<Location[]>
  // Busca documento en cotizaciones_danos
  // Retorna array locations[] mapeados a entidades Location

async findByIndex(folioNumber: string, index: number): Promise<Location | null>
  // Busca ubicación específica por index dentro de locations[]
  // Retorna null si no existe

async upsert(folioNumber: string, location: Location): Promise<void>
  // Crea o actualiza Location dentro del array locations[]
  // Usa $set para actualizar posición específica
  // Valida que folio exista

async deleteByIndex(folioNumber: string, index: number): Promise<void>
  // Elimina ubicación de array locations[] por index
  // Reindexea si es necesario
```

---

### Flujo del Cálculo Técnico — De Punta a Punta

```
1. Endpoint POST /v1/quotes/{folio}/calculate invoca ICalculatePremiumUseCase.execute(folio)
2. CalculatePremiumUseCase delega a PremiumCalculationService.calculatePremium(folio)
3. PremiumCalculationService:
   3.1. Busca agregado por folio usando IQuotationRepository.findByFolio()
        - Obtiene QuotationAggregate con locations[] completo
   3.2. Lee parámetros globales usando ICalculationParametersRepository.getGlobalParameters()
        - Obtiene baseRates[], commercialFactor, catZoneFactor
   3.3. Itera sobre locations y clasifica:
        - Calculables: cumplen los 3 criterios de ILocationCalculabilityRule
        - Incompletas: reportadas sin bloquear
   3.4. Para cada Location calculable:
        3.4.1. Resuelve tarifa de incendio por location.business.fireKey
               - Consulta tarifas_incendio[fireKey]
        3.4.2. Resuelve factores CAT por location.catastrophicZone
               - Consulta tarifas_cat[geographicZone] si zona existe
        3.4.3. Resuelve factores equipo electrónico si aplica
               - Consulta factores_equipo_electronico[equipmentType]
        3.4.4. Calcula componentes: para cada componente, aplica fórmula
               prima_componente = suma_asegurada_tarificable × tasa × factor_cat × factor_equipo
        3.4.5. Suma prima neta de ubicación
        3.4.6. Retorna PremiumByLocation con componentes desglosados
   3.5. Suma prima neta total = ∑ netPremium por ubicación calculable
   3.6. Calcula prima comercial = netPremium × commercialFactor
   3.7. Construye PremiumCalculationResult con:
        - netPremium, commercialPremium, premiumsByLocation[], incompleteLocations[]
   3.8. Persiste atomicamente usando IPremiumResultRepository.savePremiumResult()
        - Valida versión optimista
        - Actualiza financialResult sin sobrescribir otros campos
        - Incrementa versión
4. Retorna PremiumCalculationResult al endpoint
```

---

### Fórmulas por Componente Técnico

Cada componente se calcula aplicando la tasa base a la suma asegurada tarificable, con ajustes por zona catastrófica y equipo:

| Componente | Fórmula |
|---|---|
| `incendioEdificios` | suma_asegurada × tasa_base × (1 + factor_tev) |
| `incendioContenidos` | suma_asegurada × tasa_base × (1 + factor_tev) |
| `extensionCobertura` | suma_asegurada × tasa_base |
| `catTev` | suma_asegurada × tasa_base × (1 + factor_tev) |
| `catFhm` | suma_asegurada × tasa_fhm_zona × (1 + factor_fhm) |
| `remocionEscombros` | suma_asegurada × tasa_base |
| `gastosExtraordinarios` | suma_asegurada × tasa_base |
| `perdidaRentas` | suma_asegurada × tasa_base |
| `bi` | suma_asegurada × tasa_base |
| `equipoElectronico` | suma_asegurada_equipo × factor_equipo |

> **Nota**: Los componentes adicionales (`robo`, `dineroValores`, `vidrios`, `anunciosLuminosos`) siguen el mismo patrón pero no son obligatorios en esta fase.

---

### Diagrama de Dependencias

```
┌─────────────────────────────────────┐
│ POST /v1/quotes/{folio}/calculate   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ICalculatePremiumUseCase           │
│  CalculatePremiumUseCase            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ PremiumCalculationService                               │
│ (Servicio de Dominio - Orquesta el flujo 8 pasos)      │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┼──────────┬──────────┐
       │       │          │          │
       ▼       ▼          ▼          ▼
  IQuotation  ICalculation IPremiumResult  ILocation
  Repository  Parameters   Repository      Calculability
              Repository                    Rule
       │       │          │          │
       ▼       ▼          ▼          ▼
     Qtn     CalcParams   Premium    Location
     Repo    Repo         Repo       Calc
     Impl    Impl         Impl       Rule Impl
       │       │          │
       └───────┴──────────┴─────────────┐
                                        ▼
                    ┌──────────────────────────────────┐
                    │ Prisma Client (ORM)              │
                    │ - cotizaciones_danos             │
                    │ - parametros_calculo             │
                    │ - tarifas_incendio               │
                    │ - tarifas_cat                    │
                    │ - tarifa_fhm                     │
                    │ - factores_equipo_electronico    │
                    │ - catalogo_cp_zonas              │
                    │ - dim_zona_tev                   │
                    │ - dim_zona_fhm                   │
                    └──────────────────────────────────┘
```

---

### Mapeo Colección ↔ Contrato Integración ↔ Repositorio

| Colección | Contrato Integración (RQ-05) | Repositorio | Método |
|---|---|---|---|
| `tarifas_incendio` | `ITariffService` | `QuotationRepositoryImpl` | Resuelve tasas en `_calculateLocationPremium` |
| `tarifas_cat` | `ITariffService` | interno (cálculo) | Factor CAT por zona |
| `tarifa_fhm` | `ITariffService` | interno (cálculo) | Cuota FHM por grupo/zona |
| `factores_equipo_electronico` | `ITariffService` | interno (cálculo) | Factor equipo por tipo |
| `catalogo_cp_zonas` | `IZipCodeService` | interno (validación) | Mapeo CP → zona |
| `parametros_calculo` | N/A (datos puros) | `CalculationParametersRepositoryImpl` | `getGlobalParameters()` |
| `cotizaciones_danos` | N/A (negocio) | `QuotationRepositoryImpl` | CRUD agregado |

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### Fase 1: Schema Prisma y Migraciones
- [ ] Crear `src/prisma/schema.prisma` con definición de 9 colecciones
- [ ] Validar campos obligatorios, tipos y índices en schema
- [ ] Ejecutar `prisma migrate dev --name init` para crear migraciones
- [ ] Ejecutar `prisma generate` para generar tipos TypeScript
- [ ] Verificar no hay errores de schema (rerun `prisma validate`)

#### Fase 2: Implementación de Repositorios
- [ ] Crear `src/infraestructure/services/database/QuotationRepositoryImpl.ts`
  - [ ] Implementar `findByFolio()`
  - [ ] Implementar `save()`
  - [ ] Implementar `updatePartial()` con versionado optimista
  - [ ] Implementar `existsByFolio()`
- [ ] Crear `src/infraestructure/services/database/CalculationParametersRepositoryImpl.ts`
  - [ ] Implementar `getGlobalParameters()`
  - [ ] Validar vigencia con `effectiveDate` y `expirationDate`
- [ ] Crear `src/infraestructure/services/database/PremiumResultRepositoryImpl.ts`
  - [ ] Implementar `savePremiumResult()` con transacción atómica
  - [ ] Validar VersionConflictError
- [ ] Crear `src/infraestructure/services/database/LocationRepositoryImpl.ts`
  - [ ] Implementar `findAllByFolio()`
  - [ ] Implementar `findByIndex()`
  - [ ] Implementar `upsert()`
  - [ ] Implementar `deleteByIndex()`

#### Fase 3: Implementación de Reglas de Negocio
- [ ] Crear `src/infraestructure/services/rules/LocationCalculabilityRuleImpl.ts`
  - [ ] Implementar `isCalculable()` con 3 criterios (postalCode, fireKey, tariffable guarantee)
  - [ ] Implementar `getAlerts()` retornando array ValidationAlert[]
- [ ] Crear `src/infraestructure/services/rules/OptimisticVersionRuleImpl.ts` (si aplica)
- [ ] Crear `src/infraestructure/services/rules/PremiumPersistenceRuleImpl.ts`
  - [ ] Implementar `mustPersistAtomically()`

#### Fase 4: Seed Data
- [ ] Crear `src/infraestructure/services/seed/tarifas-incendio.seed.ts`
  - [ ] Definir 5 fireKeys con tasas completas
  - [ ] Validar tasas coherentes
- [ ] Crear `src/infraestructure/services/seed/parametros-calculo.seed.ts`
  - [ ] Definir baseRates para 10 componentes mínimos
  - [ ] Definir commercialFactor=1.25 y catZoneFactor=1.35
- [ ] Crear `src/infraestructure/services/seed/catalogo-cp-zonas.seed.ts`
  - [ ] Mapear 5-10 códigos postales a zonas y municipios
- [ ] Crear `src/infraestructure/services/seed/tarifas-cat.seed.ts`
  - [ ] 5 zonas CAT con factores
- [ ] Crear `src/infraestructure/services/seed/tarifa-fhm.seed.ts`
  - [ ] 3 grupos × 2 zonas × 2 condiciones = 12 registros
- [ ] Crear `src/infraestructure/services/seed/factores-equipo.seed.ts`
  - [ ] 3 tipos de equipo con factores
- [ ] Crear `src/infraestructure/services/seed/dim-zonas.seed.ts`
  - [ ] Dimension tables (TEV y FHM)
- [ ] Crear script `npm run seed:all` en package.json para ejecutar seed completo

#### Fase 5: Modificar Cálculo Real (Resolución de Datos Técnicos)
- [ ] Refactorizar `PremiumCalculationService._calculateLocationPremium()`
  - [ ] Resolver tarifa incendio dinámicamente por fireKey (no hardcodeado)
  - [ ] Resolver factores CAT por zona si existe
  - [ ] Resolver factores equipo si aplica
  - [ ] Aplicar fórmulas reales por componente
- [ ] Inyectar `ITariffService` en `PremiumCalculationService` (o usar repositorio directo)
- [ ] Validar que todas las llamadas resuelven datos vigentes

#### Fase 6: Validación de Arquitectura
- [ ] Verificar versionado optimista funciona en `updatePartial()`
- [ ] Verificar `VersionConflictError` se lanza correctamente
- [ ] Verificar ubicaciones incompletas se reportan sin bloquear cálculo
- [ ] Verificar transacción atómica en `savePremiumResult()`

### Backend — Tests

#### Tests Unitarios
- [ ] `test_QuotationRepositoryImpl_findByFolio_returns_aggregate`
- [ ] `test_QuotationRepositoryImpl_save_new_quotation_assigns_version_1`
- [ ] `test_QuotationRepositoryImpl_updatePartial_with_valid_version_succeeds`
- [ ] `test_QuotationRepositoryImpl_updatePartial_with_invalid_version_raises_error`
- [ ] `test_CalculationParametersRepositoryImpl_getGlobalParameters_returns_valid_params`
- [ ] `test_CalculationParametersRepositoryImpl_returns_error_if_no_vigent_document`
- [ ] `test_PremiumResultRepositoryImpl_savePremiumResult_updates_atomically`
- [ ] `test_PremiumResultRepositoryImpl_savePremiumResult_raises_version_conflict`
- [ ] `test_LocationRepositoryImpl_findAllByFolio_returns_locations`
- [ ] `test_LocationRepositoryImpl_upsert_creates_or_updates`
- [ ] `test_LocationCalculabilityRuleImpl_isCalculable_true_with_valid_location`
- [ ] `test_LocationCalculabilityRuleImpl_isCalculable_false_when_postalCode_missing`
- [ ] `test_LocationCalculabilityRuleImpl_getAlerts_returns_reasons`

#### Tests de Integración (E2E)
- [ ] `test_E2E_calculate_premium_with_2_locations_1_calculable_1_incomplete`
  - [ ] Verifica netPremium > 0
  - [ ] Verifica commercialPremium correcto
  - [ ] Verifica premiumsByLocation[] con 1 item
  - [ ] Verifica incompleteLocations[] con 1 item (con razón)
- [ ] `test_E2E_premium_calculation_uses_real_tariffs_from_db`
  - [ ] Verifica que se consultan tarifas_incendio por fireKey
  - [ ] Verifica que se aplican factores CAT correctos
- [ ] `test_E2E_quotation_version_conflict_blocks_update`
  - [ ] Inserta cotización con version=1
  - [ ] Intenta actualizar con version=0
  - [ ] Verifica VersionConflictError

### Frontend
- [ ] No aplica (cálculo es backend-only)

### QA / Manual Testing
- [ ] Validar seed data coherencia: 5 fireKeys con tasas, 5 zonas CAT, 3 grupos FHM
- [ ] Validar flujo E2E: cotizar 2 ubicaciones, una calculable, una incompleta → resultado correcto
- [ ] Validar versionado: cotización versión 5, intenta actualizar como versión 3 → error
- [ ] Validar persistencia atómica: resultado financiero nunca queda incompleto
- [ ] Validar índices y performance: consulta tarifas con índice < 50ms

---

## Referencias

- **RQ-01**: Capa de dominio con `PremiumCalculationService`, value objects y puertos
- **RQ-04**: Endpoints que invocan `ICalculatePremiumUseCase`
- **RQ-05**: Contratos de integración (`ITariffService`, `ICatalogService`, `IZipCodeService`) y fixtures de tarifas
- **Backend Instructions**: [`.github/instructions/backend.instructions.md`]
- **Diccionario de Dominio**: [`.github/copilot-instructions.md`] → sección final
