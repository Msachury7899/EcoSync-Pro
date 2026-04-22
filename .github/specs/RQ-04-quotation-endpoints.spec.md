---
id: SPEC-004
status: IMPLEMENTED
feature: quotation-endpoints
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs: ["SPEC-001", "SPEC-002", "SPEC-003"]
---

# Spec: Construcción de Endpoints REST del Cotizador de Daños

> **Estado:** `IN_PROGRESS` — aprobada el 2026-03-30. Implementación en curso.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Se requiere implementar la capa de endpoints REST que conecte el dominio DDD ya construido (RQ-01) con los consumidores HTTP. La capa de aplicación debe exponer 13 endpoints específicos del cotizador de daños, cada uno delegando a su caso de uso correspondiente definido en `domain/contracts/use-cases/`.

### Requerimiento de Negocio

Actualmente los controladores y rutas (`quotation.routes.ts`, `quotation.controller.ts`) usan stubs genéricos (CRUD básico: POST /, PUT /, GET /) que **no coinciden** con los endpoints específicos requeridos por el negocio. Se necesita reescribir las rutas y controladores para reflejar el flujo real del cotizador:

1. El usuario crea o recupera un folio.
2. Captura datos generales de la cotización.
3. Configura el layout y registra ubicaciones.
4. El backend consulta catálogos y tarifas técnicas.
5. El backend calcula la prima total.

### Historias de Usuario

#### HU-01: Crear folio de cotización con idempotencia

```
Como:        Cliente o agente de seguros
Quiero:      Crear un folio único para iniciar una cotización de daños
Para:        Tener un identificador inmutable para rastrear toda la cotización

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna (RQ-01 implementado)
Capa:        Backend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Crear folio exitosamente con datos asegurado
  Dado que:  tengo insuredData válido y businessType definido
  Cuando:    ejecuto POST /api/v1/danos/v1/folios
  Entonces:  recibo HTTP 201 con { folioNumber, createdAt }
```

**Edge Case — Idempotencia**
```gherkin
CRITERIO-1.2: Folio duplicado retorna el existente
  Dado que:  un folio con los mismos datos ya existe
  Cuando:    intente crear otro con los mismos datos
  Entonces:  retorna el folioNumber existente sin errores
```

**Error Path**
```gherkin
CRITERIO-1.3: Datos asegurado inválidos
  Dado que:  insuredData es null o incompleta
  Cuando:    ejecuto POST /api/v1/danos/v1/folios
  Entonces:  recibo HTTP 400 con mensaje de validación
```

---

#### HU-02: Consultar datos generales de la cotización

```
Como:        Agente de seguros
Quiero:      Recuperar los datos generales de la cotización (asegurado, riesgo)
Para:        Continuar editando o mostrar el progreso actual

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Obtener datos generales exitosamente
  Dado que:  un folio folioNumber existe
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/general-info
  Entonces:  recibo HTTP 200 con QuotationAggregate completo
```

**Error Path**
```gherkin
CRITERIO-2.2: Folio no encontrado
  Dado que:  el folioNumber no existe en base de datos
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/general-info
  Entonces:  recibo HTTP 404 { error: "QuotationNotFound" }
```

---

#### HU-03: Guardar datos generales con versionado optimista

```
Como:        Agente de seguros
Quiero:      Actualizar datos generales de la cotización (insuredData, businessType)
Para:        Capturar los datos que define el flujo de cotización

Prioridad:   Alta
Estimación:  M
Dependencias: HU-02
Capa:        Backend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Guardar datos generales con versión válida
  Dado que:  tengo el folio, version actual y datos nuevos
  Cuando:    ejecuto PUT /api/v1/danos/v1/quotes/{folio}/general-info
            con body { generalData, version }
  Entonces:  recibo HTTP 200, version se incrementa, updated_at se actualiza
```

**Error Path — Conflicto de Versión**
```gherkin
CRITERIO-3.2: Version desactualizada detiene la actualización
  Dado que:  la version en el request es menor que la version actual
  Cuando:    ejecuto PUT /api/v1/danos/v1/quotes/{folio}/general-info
  Entonces:  recibo HTTP 409 { error: "VersionConflict" }
```

---

#### HU-04: Recuperar layout de ubicaciones

```
Como:        Agente de seguros
Quiero:      Consultar la configuración actual del layout de ubicaciones
Para:        Saber qué campos debo capturar para cada ubicación

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Obtener layout exitosamente
  Dado que:  folio existe
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/locations/layout
  Entonces:  recibo HTTP 200 con { layout: LayoutConfiguration }
```

---

#### HU-05: Guardar configuración de layout

```
Como:        Agente de seguros
Quiero:      Establecer qué campos capturar en cada ubicación
Para:        Personalizar el layout según el tipo de riesgo

Prioridad:   Media
Estimación:  S
Dependencias: HU-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: Guardar layout con versión válida
  Dado que:  tengo folio, version y LayoutConfiguration
  Cuando:    ejecuto PUT /api/v1/danos/v1/quotes/{folio}/locations/layout
            con body { layout, version }
  Entonces:  recibo HTTP 200, version se incrementa
```

---

#### HU-06: Listar ubicaciones de la cotización

```
Como:        Agente de seguros
Quiero:      Ver todas las ubicaciones registradas en la cotización
Para:        Validar cobertura y estado

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: Listar ubicaciones exitosamente
  Dado que:  folio existe (con 0 o más ubicaciones)
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/locations
  Entonces:  recibo HTTP 200 con { locations: Location[] }
```

---

#### HU-07: Registrar nuevas ubicaciones

```
Como:        Agente de seguros
Quiero:      Agregar nuevas ubicaciones (direcciones con riesgos) a la cotización
Para:        Calcular cobertura y prima por cada ubicación

Prioridad:   Alta
Estimación:  M
Dependencias: HU-06
Capa:        Backend
```

#### Criterios de Aceptación — HU-07

**Happy Path**
```gherkin
CRITERIO-7.1: Registrar ubicación(es) nueva(s)
  Dado que:  tengo LocationPayload(s) válida(s) con dirección y garantías
  Cuando:    ejecuto PUT /api/v1/danos/v1/quotes/{folio}/locations
            con body { locations: LocationPayload[] }
  Entonces:  recibo HTTP 200, ubicaciones se agregan al agregado
```

**Error Path**
```gherkin
CRITERIO-7.2: Ubicación sin código postal válido
  Dado que:  LocationPayload tiene postalCode nulo o inválido
  Cuando:    ejecuto PUT /api/v1/danos/v1/quotes/{folio}/locations
  Entonces:  recibo HTTP 400 con error de validación
```

---

#### HU-08: Editar ubicación existente

```
Como:        Agente de seguros
Quiero:      Actualizar datos de una ubicación ya registrada (por índice)
Para:        Corregir o cambiar detalles de cobertura

Prioridad:   Alta
Estimación:  M
Dependencias: HU-07
Capa:        Backend
```

#### Criterios de Aceptación — HU-08

**Happy Path**
```gherkin
CRITERIO-8.1: Editar ubicación por índice con versión
  Dado que:  ubicación en índice X existe y tengo version actual
  Cuando:    ejecuto PATCH /api/v1/danos/v1/quotes/{folio}/locations/{indice}
            con body { location: LocationPayload, version }
  Entonces:  recibo HTTP 200, ubicación se actualiza
```

**Error Path — Índice fuera de rango**
```gherkin
CRITERIO-8.2: Índice inválido o fuera de rango
  Dado que:  indice >= cantidad de ubicaciones o indice < 0
  Cuando:    ejecuto PATCH /api/v1/danos/v1/quotes/{folio}/locations/{indice}
  Entonces:  recibo HTTP 400 o 404
```

---

#### HU-09: Consultar resumen de ubicaciones

```
Como:        Agente de seguros
Quiero:      Obtener un resumen del estado de validación de todas las ubicaciones
Para:        Saber cuáles ubicaciones estén listas para calcular

Prioridad:   Media
Estimación:  M
Dependencias: HU-07
Capa:        Backend
```

#### Criterios de Aceptación — HU-09

**Happy Path**
```gherkin
CRITERIO-9.1: Resumen de ubicaciones exitoso
  Dado que:  folio existe con una o más ubicaciones
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/locations/summary
  Entonces:  recibo HTTP 200 con { summary: { totalLocations, validLocations, alerts } }
```

---

#### HU-10: Consultar estado de la cotización

```
Como:        Agente de seguros
Quiero:      Ver el estado actual de la cotización (% completitud, última actualización)
Para:        Conocer el progreso del flujo

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-10

**Happy Path**
```gherkin
CRITERIO-10.1: Estado de cotización
  Dado que:  folio existe
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/state
  Entonces:  recibo HTTP 200 con { quotationStatus, percentComplete, incompleteLocations }
```

---

#### HU-11: Recuperar opciones de cobertura

```
Como:        Agente de seguros
Quiero:      Consultar las opciones de cobertura disponibles para esta cotización
Para:        Mostrar al cliente qué coberturas adicionales puede contratar

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-11

**Happy Path**
```gherkin
CRITERIO-11.1: Obtener opciones de cobertura
  Dado que:  folio existe
  Cuando:    ejecuto GET /api/v1/danos/v1/quotes/{folio}/coverage-options
  Entonces:  recibo HTTP 200 con { coverageOptions: CoverageOptions }
```

---

#### HU-12: Guardar opciones de cobertura seleccionadas

```
Como:        Agente de seguros
Quiero:      Registrar qué coberturas adicionales seleccionó el cliente
Para:        Incluirlas en el cálculo final de primas

Prioridad:   Media
Estimación:  S
Dependencias: HU-11
Capa:        Backend
```

#### Criterios de Aceptación — HU-12

**Happy Path**
```gherkin
CRITERIO-12.1: Guardar opciones de cobertura
  Dado que:  tengo folio, version y CoverageOptions
  Cuando:    ejecuto PUT /api/v1/danos/v1/quotes/{folio}/coverage-options
            con body { coverageOptions, version }
  Entonces:  recibo HTTP 200
```

---

#### HU-13: Calcular prima neta y comercial

```
Como:        Sistema de cotización
Quiero:      Ejecutar el cálculo automático de primas por ubicación y total
Para:        Ofrecer la tarifa final al cliente

Prioridad:   Alta
Estimación:  L
Dependencias: HU-07, HU-11
Capa:        Backend
```

#### Criterios de Aceptación — HU-13

**Happy Path**
```gherkin
CRITERIO-13.1: Cálculo de prima exitoso para ubicaciones completas
  Dado que:  cotización tiene ubicaciones válidas (código postal, giro, garantías)
  Cuando:    ejecuto POST /api/v1/danos/v1/quotes/{folio}/calculate
  Entonces:  recibo HTTP 200 con { netPremium, commercialPremium, premiumsByLocation }
```

**Warning Path — Ubicaciones incompletas no bloquean**
```gherkin
CRITERIO-13.2: Ubicaciones incompletas generan alerta pero no bloquean
  Dado que:  tienen ubicaciones sin código postal o sin garantías tarifables
  Cuando:    ejecuto POST /api/v1/danos/v1/quotes/{folio}/calculate
  Entonces:  recibo HTTP 200 con { netPremium (de ubicaciones válidas), incompleteLocations: [] }
```

**Error Path**
```gherkin
CRITERIO-13.3: Sin ubicaciones válidas retorna error
  Dado que:  todas las ubicaciones están incompletas
  Cuando:    ejecuto POST /api/v1/danos/v1/quotes/{folio}/calculate
  Entonces:  recibo HTTP 400 { error: "NoValidLocationsForCalculation" }
```

---

### Reglas de Negocio Obligatorias

1. **La cotización se identifica por `folioNumber`** — es el identificador principal en todas las rutas y debe ser inmutable.

2. **El backend debe persistir la cotización como agregado principal** — usar `QuotationAggregate`, no crear entidades sueltas.

3. **Las escrituras deben hacerse por actualización parcial** — usar `IQuotationRepository.updatePartial()`, no reemplazar todo el documento.

4. **Al editar secciones funcionales, debe incrementarse la `version`** — el agregado lo hace internamente vía `withUpdatedSection()`.

5. **Debe actualizarse `metadata.updated_at`** — `QuotationMetadata.withUpdatedDate()` ya está construido.

6. **El cálculo debe guardar `netPremium`, `commercialPremium` y `premiumsByLocation` en una misma operación lógica** — usar `IPremiumResultRepository.savePremiumResult()`.

7. **Si una ubicación está incompleta, genera alerta pero no impide calcular las demás** — `LocationValidationService` ya implementa esto.

8. **Una ubicación no debe calcularse si no tiene código postal válido, `business.claveIncendio` o garantías tarifables** — validar en el use case.

9. **Manejar versionado optimista en operaciones de edición** — rechazar con HTTP 409 si `version` en request < `version` en DB.

10. **Los errores de dominio deben convertirse a códigos HTTP específicos:**
    - `QuotationNotFoundError` → 404
    - `VersionConflictError` → 409
    - Errores de validación → 400

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Quotation` | `quotations` collection (Prisma/MongoDB) | existente | Entidad raíz del agregado QuotationAggregate |
| `Location` | `locations[]` array en documento Quotation | existente | Ubicación anidada en Quotation |
| `IGetLocationsSummaryUseCase` | N/A (contrato nuevo) | **nuevo** | Contrato para resumen de ubicaciones |

#### Campos del modelo Quotation (vista resumida)
| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `folioNumber` | string | sí | única, inmutable | Identificador único |
| `quotationStatus` | enum | sí | `DRAFT \| IN_PROGRESS \| CALCULATED` | Estado actual |
| `insuredData` | object | sí | completo | Datos del asegurado |
| `businessType` | string | sí | max 50 chars | Tipo de negocio (ej. incendio) |
| `layoutConfiguration` | object | no | parcial | Layout de ubicaciones |
| `locations` | Location[] | no | min 0 | Ubicaciones registradas |
| `netPremium` | number | no | >= 0 | Prima neta total |
| `commercialPremium` | number | no | >= 0 | Prima comercial total |
| `premiumsByLocation` | PremiumByLocation[] | no | min 0 | Desglose por ubicación |
| `version` | integer | sí | >= 1 | Contador optimista |
| `metadata.created_at` | datetime (UTC) | sí | auto-generado | Creación |
| `metadata.updated_at` | datetime (UTC) | sí | auto-generado | Última actualización |

#### Índices / Constraints
- Índice único en `folioNumber` — búsqueda frecuente y unicidad.
- Índice en `quotationStatus` — filtrado por estado.
- Índice en `metadata.updated_at` — recuperar cotizaciones recientes.

---

### API Endpoints

#### POST /api/v1/danos/v1/folios
**Crear folio de cotización**

- **Descripción**: Crea un nuevo folio con datos del asegurado. Garantiza idempotencia.
- **Auth requerida**: sí (Bearer token)
- **Request Body**:
  ```json
  {
    "insuredData": {
      "name": "string",
      "email": "string",
      "phone": "string"
    },
    "businessType": "string",
    "drivingData": { /* opcional */ },
    "createdBy": "string"
  }
  ```
- **Response 201**:
  ```json
  {
    "folioNumber": "string",
    "createdAt": "2026-03-30T10:15:00Z"
  }
  ```
- **Response 400**: insuredData inválido o incompleto
- **Response 409**: folio duplicado con idempotencia
- **Use Case**: `ICreateFolioUseCase.execute()`

---

#### GET /api/v1/danos/v1/quotes/{folio}/general-info
**Consultar datos generales de la cotización**

- **Descripción**: Recupera el agregado completo de la cotización por folioNumber.
- **Auth requerida**: sí
- **Path params**: `folio` (string) — folioNumber
- **Response 200**:
  ```json
  {
    "folioNumber": "string",
    "quotationStatus": "DRAFT|IN_PROGRESS|CALCULATED",
    "insuredData": { /* object */ },
    "businessType": "string",
    "version": 1,
    "metadata": {
      "created_at": "2026-03-30T10:15:00Z",
      "updated_at": "2026-03-30T10:15:00Z"
    }
  }
  ```
- **Response 404**: folio no encontrado
- **Use Case**: `IGetQuotationUseCase.execute(folio)`

---

#### PUT /api/v1/danos/v1/quotes/{folio}/general-info
**Guardar datos generales con versionado optimista**

- **Descripción**: Actualiza insuredData, businessType, drivingData. Valida versión.
- **Auth requerida**: sí
- **Path params**: `folio` (string)
- **Request Body**:
  ```json
  {
    "generalData": {
      "insuredData": { /* object */ },
      "businessType": "string",
      "drivingData": { /* opcional */ }
    },
    "version": 1
  }
  ```
- **Response 200**: datos actualizados, version incrementada
- **Response 404**: folio no encontrado
- **Response 409**: conflicto de versión (version en request < version en DB)
- **Response 400**: validación de datos fallida
- **Use Case**: `ISaveGeneralDataUseCase.execute(folio, data, version)`

---

#### GET /api/v1/danos/v1/quotes/{folio}/locations/layout
**Consultar configuración del layout de ubicaciones**

- **Descripción**: Obtiene la LayoutConfiguration actual.
- **Auth requerida**: sí
- **Response 200**:
  ```json
  {
    "layout": {
      "fields": ["postalCode", "address", "businessLine", "guarantees"],
      "required": ["postalCode", "address"]
    }
  }
  ```
- **Response 404**: folio no encontrado
- **Use Case**: `IGetQuotationUseCase.execute()` (sección layout)

---

#### PUT /api/v1/danos/v1/quotes/{folio}/locations/layout
**Guardar configuración del layout**

- **Descripción**: Establece qué campos capturar en ubicaciones. Incrementa version.
- **Auth requerida**: sí
- **Request Body**:
  ```json
  {
    "layout": {
      "fields": ["postalCode", "address", "businessLine"],
      "required": ["postalCode", "address"]
    },
    "version": 1
  }
  ```
- **Response 200**: layout actualizado
- **Response 409**: conflicto de versión
- **Use Case**: `ISaveLayoutConfigurationUseCase.execute(folio, layout, version)`

---

#### GET /api/v1/danos/v1/quotes/{folio}/locations
**Listar ubicaciones de la cotización**

- **Descripción**: Retorna array de todas las ubicaciones registradas.
- **Auth requerida**: sí
- **Response 200**:
  ```json
  {
    "locations": [
      {
        "locationName": "string",
        "address": { /* object */ },
        "postalCode": "string",
        "business": { /* object */ },
        "guarantees": [ /* array */ ]
      }
    ]
  }
  ```
- **Response 404**: folio no encontrado
- **Use Case**: `IManageLocationUseCase.getAll(folio)`

---

#### PUT /api/v1/danos/v1/quotes/{folio}/locations
**Registrar nueva(s) ubicación(es)**

- **Descripción**: Agrega una o más ubicaciones nuevas. No requiere version.
- **Auth requerida**: sí
- **Request Body**:
  ```json
  {
    "locations": [
      {
        "locationName": "Oficina Central",
        "address": { /* object */ },
        "postalCode": "28001",
        "state": "Madrid",
        "city": "Madrid",
        "constructiveType": "concreto",
        "constructionYear": 2010,
        "businessLine": "comercial",
        "business": {
          "claveIncendio": "1001",
          "description": "Oficina"
        },
        "guarantees": [ /* array */ ]
      }
    ]
  }
  ```
- **Response 200**: ubicaciones agregadas
- **Response 400**: validación fallida (código postal inválido, sin guarantees)
- **Response 404**: folio no encontrado
- **Use Case**: `IManageLocationUseCase.add(folio, location)` (para cada)"

---

#### PATCH /api/v1/danos/v1/quotes/{folio}/locations/{indice}
**Editar ubicación existente por índice**

- **Descripción**: Actualiza una ubicación específica por su índice en el array. Valida version.
- **Auth requerida**: sí
- **Path params**: `folio` (string), `indice` (number)
- **Request Body**:
  ```json
  {
    "location": {
      "locationName": "string",
      "address": { /* object */ },
      "postalCode": "string",
      "business": { /* object */ },
      "guarantees": [ /* array */ ]
    },
    "version": 2
  }
  ```
- **Response 200**: ubicación actualizada
- **Response 400**: índice fuera de rango o validación fallida
- **Response 404**: folio no encontrado
- **Response 409**: conflicto de versión
- **Use Case**: `IManageLocationUseCase.update(folio, indice, location, version)`

---

#### GET /api/v1/danos/v1/quotes/{folio}/locations/summary
**Consultar resumen de ubicaciones (validación y alertas)**

- **Descripción**: Retorna métricas de validación: cantidad total, cantidad válida, alertas por ubicación.
- **Auth requerida**: sí
- **Response 200**:
  ```json
  {
    "summary": {
      "totalLocations": 3,
      "validLocations": 2,
      "alerts": [
        {
          "index": 1,
          "message": "Ubicación sin código postal válido",
          "severity": "warning"
        }
      ]
    }
  }
  ```
- **Response 404**: folio no encontrado
- **Use Case**: **`IGetLocationsSummaryUseCase.execute(folio)`** ← **Nuevo contrato requerido**

---

#### GET /api/v1/danos/v1/quotes/{folio}/state
**Consultar estado de la cotización**

- **Descripción**: Retorna estado actual, porcentaje de completitud y número de ubicaciones incompletas.
- **Auth requerida**: sí
- **Response 200**:
  ```json
  {
    "folioNumber": "string",
    "quotationStatus": "DRAFT",
    "percentComplete": 45,
    "lastUpdated": "2026-03-30T10:20:00Z",
    "incompleteLocations": 1
  }
  ```
- **Response 404**: folio no encontrado
- **Use Case**: `IGetQuotationStatusUseCase.execute(folio)`

---

#### GET /api/v1/danos/v1/quotes/{folio}/coverage-options
**Consultar opciones de cobertura disponibles**

- **Descripción**: Retorna las coberturas disponibles para esta cotización.
- **Auth requerida**: sí
- **Response 200**:
  ```json
  {
    "coverageOptions": {
      "robo": { "code": "ROB", "premium": 150, "included": false },
      "responsabilidad": { "code": "RC", "premium": 300, "included": true }
    }
  }
  ```
- **Response 404**: folio no encontrado
- **Use Case**: `IGetQuotationUseCase.execute()` (sección coverageOptions)

---

#### PUT /api/v1/danos/v1/quotes/{folio}/coverage-options
**Guardar opciones de cobertura seleccionadas**

- **Descripción**: Registra qué coberturas adicionales seleccionó el cliente. Incrementa version.
- **Auth requerida**: sí
- **Request Body**:
  ```json
  {
    "coverageOptions": {
      "robo": { "code": "ROB", "premium": 150, "included": true },
      "responsabilidad": { "code": "RC", "premium": 300, "included": true }
    },
    "version": 2
  }
  ```
- **Response 200**: opciones actualizadas
- **Response 404**: folio no encontrado
- **Response 409**: conflicto de versión
- **Use Case**: `ISaveCoverageOptionsUseCase.execute(folio, options, version)`

---

#### POST /api/v1/danos/v1/quotes/{folio}/calculate
**Ejecutar cálculo de prima neta y comercial**

- **Descripción**: Calcula primas por ubicación y totales. Ubicaciones incompletas no bloquean.
- **Auth requerida**: sí
- **Request Body**: (vacío o `{}`)
- **Response 200**:
  ```json
  {
    "netPremium": 2500.50,
    "commercialPremium": 3500.75,
    "premiumsByLocation": [
      {
        "index": 0,
        "locationName": "Oficina Central",
        "netPremium": 1500.00,
        "commercialPremium": 2100.00
      }
    ],
    "incompleteLocations": [
      {
        "index": 1,
        "locationName": "Sucursal 2",
        "alerts": ["Código postal faltante"]
      }
    ],
    "calculatedAt": "2026-03-30T10:25:00Z"
  }
  ```
- **Response 400**: sin ubicaciones válidas (todas incompletas)
- **Response 404**: folio no encontrado
- **Use Case**: `ICalculatePremiumUseCase.execute(folio)`

---

### Resumen de Endpoints — Tabla de Mapeo

| Método | Ruta | Use Case | HU | Status |
|--------|------|----------|----|----|
| `POST` | `/v1/folios` | `ICreateFolioUseCase` | HU-01 | ✓ Contrato existe |
| `GET` | `/v1/quotes/{folio}/general-info` | `IGetQuotationUseCase` | HU-02 | ✓ Contrato existe |
| `PUT` | `/v1/quotes/{folio}/general-info` | `ISaveGeneralDataUseCase` | HU-03 | ✓ Contrato existe |
| `GET` | `/v1/quotes/{folio}/locations/layout` | `IGetQuotationUseCase` (sección) | HU-04 | ✓ Contrato existe |
| `PUT` | `/v1/quotes/{folio}/locations/layout` | `ISaveLayoutConfigurationUseCase` | HU-05 | ✓ Contrato existe |
| `GET` | `/v1/quotes/{folio}/locations` | `IManageLocationUseCase.getAll()` | HU-06 | ✓ Contrato existe |
| `PUT` | `/v1/quotes/{folio}/locations` | `IManageLocationUseCase.add()` | HU-07 | ✓ Contrato existe |
| `PATCH` | `/v1/quotes/{folio}/locations/{indice}` | `IManageLocationUseCase.update()` | HU-08 | ✓ Contrato existe |
| `GET` | `/v1/quotes/{folio}/locations/summary` | **`IGetLocationsSummaryUseCase`** | HU-09 | ⚠️ **Nuevo contrato** |
| `GET` | `/v1/quotes/{folio}/state` | `IGetQuotationStatusUseCase` | HU-10 | ✓ Contrato existe |
| `GET` | `/v1/quotes/{folio}/coverage-options` | `IGetQuotationUseCase` (sección) | HU-11 | ✓ Contrato existe |
| `PUT` | `/v1/quotes/{folio}/coverage-options` | `ISaveCoverageOptionsUseCase` | HU-12 | ✓ Contrato existe |
| `POST` | `/v1/quotes/{folio}/calculate` | `ICalculatePremiumUseCase` | HU-13 | ✓ Contrato existe |

---

### Diseño Frontend

#### Componentes nuevos (indicativo)
| Componente | Archivo | Props principales | Descripción |
|------------|---------|------------------|-------------|
| `QuotationForm` | `components/QuotationForm.tsx` | `onSubmit, initialData` | Formulario de datos generales |
| `LocationList` | `components/LocationList.tsx` | `locations, onAdd, onEdit, onDelete` | Listado de ubicaciones |
| `LocationFormModal` | `components/LocationFormModal.tsx` | `isOpen, onSubmit, onClose, location` | Agregar/editar ubicación |
| `QuotationSummary` | `components/QuotationSummary.tsx` | `folio, state, locations` | Resumen de estado |
| `CoverageSelector` | `components/CoverageSelector.tsx` | `options, onChange, selected` | Selector de coberturas |
| `PremiumResults` | `components/PremiumResults.tsx` | `calculation, premiumsByLocation` | Resultado del cálculo |

#### Páginas nuevas
| Página | Ruta | Protegida | Descripción |
|--------|------|-----------|-------------|
| `QuotationPage` | `/quotations/{folio}` | sí | Flujo completo de cotización |
| `QuotationListPage` | `/quotations` | sí | Listado de cotizaciones (futuro) |

#### Hooks y State Management
| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useQuotation` | `hooks/useQuotation.ts` | `{ quotation, loading, error, fetch, save }` | Estado de cotización |
| `useLocations` | `hooks/useLocations.ts` | `{ locations, add, update, delete }` | Gestión de ubicaciones |
| `usePremiumCalculation` | `hooks/usePremiumCalculation.ts` | `{ calculate, result, loading }` | Cálculo de primas |

#### Services (API Client)
| Función | Archivo | Endpoint |
|---------|---------|---------|
| `quotationService.createFolio(data)` | `services/quotationService.ts` | `POST /v1/folios` |
| `quotationService.getGeneralInfo(folio)` | `services/quotationService.ts` | `GET /v1/quotes/{folio}/general-info` |
| `quotationService.saveGeneralData(folio, data, version)` | `services/quotationService.ts` | `PUT /v1/quotes/{folio}/general-info` |
| `quotationService.getLocations(folio)` | `services/quotationService.ts` | `GET /v1/quotes/{folio}/locations` |
| `quotationService.addLocations(folio, locations)` | `services/quotationService.ts` | `PUT /v1/quotes/{folio}/locations` |
| `quotationService.updateLocation(folio, index, location, version)` | `services/quotationService.ts` | `PATCH /v1/quotes/{folio}/locations/{index}` |
| `quotationService.getLocationsSummary(folio)` | `services/quotationService.ts` | `GET /v1/quotes/{folio}/locations/summary` |
| `quotationService.getState(folio)` | `services/quotationService.ts` | `GET /v1/quotes/{folio}/state` |
| `quotationService.getCoverageOptions(folio)` | `services/quotationService.ts` | `GET /v1/quotes/{folio}/coverage-options` |
| `quotationService.saveCoverageOptions(folio, options, version)` | `services/quotationService.ts` | `PUT /v1/quotes/{folio}/coverage-options` |
| `quotationService.calculatePremium(folio)` | `services/quotationService.ts` | `POST /v1/quotes/{folio}/calculate` |

---

### Arquitectura y Dependencias

#### Stack Técnico
- **Backend**: Node.js + TypeScript + Express
- **Database**: Prisma ORM + MongoDB
- **Frontend**: React + TypeScript (indicativo)
- **Testing**: Jest + Supertest (backend), Jest + React Testing Library (frontend)

#### Paquetes nuevos requeridos
- Ninguno — se aprovechan las dependencias existentes: `express`, `prisma`, `@nestjs/common`, etc.

#### Servicios externos
- **Consulta de Catálogos**: El backend debe integrar llamadas a `plataforma-core-ohs` (ya existente en config).
- **Cálculo de Tarifas**: Integración con microservicios de tarifación (vía adapters existentes).

#### Impacto en punto de entrada
- Registrar router `/v1/folios` y `/v1/quotes` en `plataforma-danos-back.config.ts`.
- Actualizar `AppRoutes` en `src/application/features/AppRoutes.ts`.
- Aplicar middleware de autenticación a todos los endpoints.

---

### Notas de Implementación

1. **Contrato nuevo requerido**: `IGetLocationsSummaryUseCase` debe agregarse a `src/domain/contracts/use-cases/`.

2. **Versionado optimista**: Todos los PUT/PATCH deben:
   - Leer `version` del request body o header.
   - Lanzar `VersionConflictError` si `version` request < `version` DB.
   - Incrementar `version` en el agregado (ya está en `QuotationAggregate.withUpdatedSection()`).

3. **Idempotencia en createFolio**: El use case debe detectar si un folio con los mismos datos ya existe y retornarlo.

4. **Gestión de errores**:
   - `QuotationNotFoundError` → mapear a 404.
   - `VersionConflictError` → mapear a 409.
   - `ValidationError` → mapear a 400.
   - Errores de negocio → mapear a 422 Unprocessable Entity.

5. **Rutas comentadas**: Actualmente `/quotations` está comentado en `plataforma-danos-back.config.ts`. Descomentar y registrar las nuevas rutas.

6. **Swagger/JSDoc**: Cada método del controlador debe tener anotaciones JSDoc (RQ-03).

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Implementación

**Contratos**
- [ ] Crear `IGetLocationsSummaryUseCase` en `src/domain/contracts/use-cases/`
- [ ] Exportar desde `src/domain/contracts/use-cases/index.ts`

**Use Cases (Implementación Concreta)**
- [ ] Implementar `CreateFolioUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `GetQuotationUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `SaveGeneralDataUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `SaveLayoutConfigurationUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `ManageLocationUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `GetQuotationStatusUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `SaveCoverageOptionsUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `CalculatePremiumUseCase` en `src/infraestructure/use-cases/`
- [ ] Implementar `GetLocationsSummaryUseCase` en `src/infraestructure/use-cases/`

**Repositorios Concretos**
- [ ] Implementar `QuotationRepository` (Prisma) — métodos: `createFolio()`, `getByFolio()`, `updatePartial()`, etc.
- [ ] Implementar `PremiumResultRepository` (Prisma) — método: `savePremiumResult()`
- [ ] Registrar en contenedor de dependencias (inversión de control)

**Controlador y Rutas**
- [ ] Reescribir `QuotationController` con 13 métodos HTTP específicos
  - [ ] `createFolio()` → POST /v1/folios
  - [ ] `getGeneralInfo()` → GET /v1/quotes/{folio}/general-info
  - [ ] `saveGeneralData()` → PUT /v1/quotes/{folio}/general-info
  - [ ] `getLayoutConfiguration()` → GET /v1/quotes/{folio}/locations/layout
  - [ ] `saveLayoutConfiguration()` → PUT /v1/quotes/{folio}/locations/layout
  - [ ] `getLocations()` → GET /v1/quotes/{folio}/locations
  - [ ] `addLocations()` → PUT /v1/quotes/{folio}/locations
  - [ ] `updateLocation()` → PATCH /v1/quotes/{folio}/locations/{indice}
  - [ ] `getLocationsSummary()` → GET /v1/quotes/{folio}/locations/summary
  - [ ] `getQuotationStatus()` → GET /v1/quotes/{folio}/state
  - [ ] `getCoverageOptions()` → GET /v1/quotes/{folio}/coverage-options
  - [ ] `saveCoverageOptions()` → PUT /v1/quotes/{folio}/coverage-options
  - [ ] `calculatePremium()` → POST /v1/quotes/{folio}/calculate

- [ ] Reescribir `QuotationRoutes` con las 13 rutas específicas
- [ ] Inyectar los 9 use cases en el controlador (no stubs)
- [ ] Registrar rutas en `plataforma-danos-back.config.ts`

**Manejo de Errores**
- [ ] Mapear `QuotationNotFoundError` → 404
- [ ] Mapear `VersionConflictError` → 409
- [ ] Mapear errores de validación → 400
- [ ] Usar `CustomResponse.handleError()` en catch blocks

#### Tests Backend

**Use Cases**
- [ ] `test_createFolio_success` — crear folio con datos válidos
- [ ] `test_createFolio_idempotent` — crear folio duplicado retorna existente
- [ ] `test_getQuotation_success` — obtener cotización existente
- [ ] `test_getQuotation_not_found` — lanza `QuotationNotFoundError` para folio inexistente
- [ ] `test_saveGeneralData_success` — guardar datos con versionado correcto
- [ ] `test_saveGeneralData_version_conflict` — lanza `VersionConflictError` si version < actual
- [ ] `test_manageLocation_add_success` — agregar ubicación
- [ ] `test_manageLocation_add_invalid_postal_code` — rechaza ubicación sin código postal
- [ ] `test_manageLocation_update_success` — editar ubicación por índice
- [ ] `test_calculatePremium_success` — calcular primas para ubicaciones válidas
- [ ] `test_calculatePremium_partial_locations` — ubicaciones incompletas no bloquean
- [ ] `test_calculatePremium_no_valid_locations` — lanza error si todas incompletas

**Controlador (HTTP)**
- [ ] `test_POST_folios_returns_201` — endpoint createFolio retorna 201
- [ ] `test_POST_folios_returns_400_invalid_data` — validación de entrada
- [ ] `test_GET_general_info_returns_200` — endpoint getGeneralInfo
- [ ] `test_GET_general_info_returns_404` — folio no existe
- [ ] `test_PUT_general_info_returns_200` — actualiza datos
- [ ] `test_PUT_general_info_returns_409_version_conflict` — versionado optimista
- [ ] `test_GET_locations_returns_200` — lista de ubicaciones
- [ ] `test_PUT_locations_returns_200` — agregar ubicación
- [ ] `test_PATCH_location_returns_200` — editar ubicación
- [ ] `test_GET_locations_summary_returns_200` — resumen de validación
- [ ] `test_GET_state_returns_200` — estado de cotización
- [ ] `test_GET_coverage_options_returns_200` — opciones de cobertura
- [ ] `test_PUT_coverage_options_returns_200` — guardar coberturas
- [ ] `test_POST_calculate_returns_200` — cálculo de prima
- [ ] `test_POST_calculate_returns_400_no_valid_locations` — sin ubicaciones válidas

### Frontend

#### Implementación

**Services**
- [ ] Crear `quotationService.ts` con funciones para todos los 13 endpoints
- [ ] Configurar headers de autenticación (Bearer token)
- [ ] Manejar errores HTTP (401, 404, 409, etc.)

**Hooks**
- [ ] Crear `useQuotation` — estado, loading, error, métodos fetch/save
- [ ] Crear `useLocations` — gestión de array de ubicaciones
- [ ] Crear `usePremiumCalculation` — estado del cálculo, resultado

**Componentes**
- [ ] `QuotationForm` — formulario de datos generales (insuredData, businessType)
- [ ] `LocationList` — listado con acciones agregar/editar/eliminar
- [ ] `LocationFormModal` — modal para crear/editar ubicación
- [ ] `QuotationSummary` — resumen de estado, completitud, alertas
- [ ] `CoverageSelector` — selector de coberturas adicionales
- [ ] `PremiumResults` — visualización de primas neta, comercial, por ubicación

**Páginas**
- [ ] Crear `QuotationPage.tsx` — orquesta el flujo completo
- [ ] Registrar ruta `/quotations/{folio}` en `AppRoutes` (o equivalente)

**Validación Frontend**
- [ ] Validar campos obligatorios antes de enviar
- [ ] Mostrar errores de API al usuario
- [ ] Reintentos automáticos en caso de timeout
- [ ] Mostrar loading spinner durante operaciones

#### Tests Frontend

**Services**
- [ ] `test_quotationService_createFolio_calls_POST_folios`
- [ ] `test_quotationService_getGeneralInfo_calls_GET_general_info`
- [ ] `test_quotationService_handles_401_unauthorized`
- [ ] `test_quotationService_handles_404_not_found`

**Hooks**
- [ ] `test_useQuotation_initializes_with_undefined`
- [ ] `test_useQuotation_fetches_on_mount`
- [ ] `test_useQuotation_save_updates_quotation`
- [ ] `test_useQuotation_handles_error`
- [ ] `test_useLocations_add_appends_location`
- [ ] `test_useLocations_update_modifies_by_index`
- [ ] `test_useLocations_delete_removes_by_index`

**Componentes**
- [ ] `[QuotationForm] renders input fields`
- [ ] `[QuotationForm] calls onSubmit with data`
- [ ] `[LocationList] renders location items`
- [ ] `[LocationList] calls onAdd when Add button clicked`
- [ ] `[LocationFormModal] opens and closes`
- [ ] `[LocationFormModal] submits form with valid data`
- [ ] `[CoverageSelector] toggles coverage selection`
- [ ] `[PremiumResults] displays primas neta y comercial`

### QA

#### Criterios Gherkin
- [ ] Ejecutar skill `/gherkin-case-generator` sobre esta spec
- [ ] Generar escenarios Gherkin para todos los criterios CRITERIO-1.1 a 13.3
- [ ] Generar datos de prueba (fixtures, factories)
- [ ] Documentar en `docs/output/qa/RQ-04-gherkin.md`

#### Identificación de Riesgos
- [ ] Ejecutar skill `/risk-identifier`
- [ ] Clasificar riesgos ASD (Alto/Medio/Bajo)
- [ ] Documentar en `docs/output/qa/RQ-04-risks.md`
- [ ] Priorizar test cases según riesgos altos

#### Cobertura de Tests
- [ ] Verificar que cada criterio de aceptación tiene al menos un test
- [ ] Validar que todas las reglas de negocio se cubren
- [ ] Checks de boundary: índices de ubicaciones, versión 0, datos nulos

#### Validación Final
- [ ] Revisar spec contra requerimiento original RQ-04.md
- [ ] Confirmar que los 13 endpoints están documentados
- [ ] Confirmar que las HUs cubren el flujo completo
- [ ] Validar que el nuevo contrato `IGetLocationsSummaryUseCase` está claramente identificado

### Orchestration

- [ ] Actualizar estado spec: `status: APPROVED` cuando el usuario lo valide
- [ ] Pasar a fase de implementación (Backend Developerparalelo con Frontend Developer
- [ ] Monitorear progreso via este checklist
- [ ] Transicionar a fase de testing cuando backend completado

---

**Fin de Spec RQ-04**
