---
id: SPEC-003
status: IMPLEMENTED
feature: swagger-api-documentation
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs: []
---

# Spec: Documentación API con Swagger (OpenAPI)

> **Estado:** `APPROVED` — listo para implementación
> **Prioridad:** Alta — es parte principal e inicial del reto AI

---

## 1. REQUERIMIENTOS

### Descripción
El equipo necesita descubrir los servicios y endpoints disponibles sin inspecionar el código. Se implementará Swagger/OpenAPI con una UI integrada que muestre:
- Todos los endpoints del monolito (launch.ts)
- Endpoints filtrados por microservicio individual (danos, core-ohs)
- Documentación automática generada desde anotaciones JSDoc/OpenAPI en los controllers
- Interfaz interactiva para testear endpoints

### Requerimiento de Negocio
```
Problema: El equipo desconoce qué servicios existen sin revisar el código.
Solución: Swagger integrado en Express con detección automática de endpoints.
Beneficio: Onboarding rápido, documentación siempre sincronizada con código.
```

### Historias de Usuario

#### HU-01: Acceder a documentación Swagger del monolito

```
Como:        Desarrollador nuevo
Quiero:      Acceder a una UI Swagger que liste TODOS los endpoints disponibles
Para:        Entender rápidamente la API sin revisar código

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna
Capa:        Backend
```

##### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Acceder a Swagger UI del monolito
  Dado que:  El servidor monolítico está ejecutándose (launch.ts)
  Cuando:    Navego a http://localhost:3000/api-docs
  Entonces:  Se abre la UI de Swagger con todos los endpoints registrados
             (quotations, policies, insured)
             agrupados por tag (danos, core-ohs)
```

**Error Path**
```gherkin
CRITERIO-1.2: Ruta /api-docs no existe sin Swagger
  Dado que:  Swagger no está registrado en el servidor
  Cuando:    Intento acceder a /api-docs
  Entonces:  Recibo un 404 Not Found
```

#### HU-02: Acceder a documentación Swagger del microservicio danos

```
Como:        Desarrollador del servicio danos
Quiero:      Acceder a una UI Swagger que muestre SOLO los endpoints de danos
Para:        Documentar las APIs que desarrollé sin ruido de otros servicios

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

##### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Acceder a Swagger UI del servicio danos
  Dado que:  El servicio danos está ejecutándose (dev:danos)
  Cuando:    Navego a http://localhost:3001/api-docs
  Entonces:  Se abre la UI de Swagger solo con endpoints de danos
             (POST /api/v1/danos/quotations, 
              GET /api/v1/danos/quotations,
              PUT /api/v1/danos/quotations,
              POST /api/v1/danos/policies,
              GET /api/v1/danos/policies,
              PUT /api/v1/danos/policies)
```

#### HU-03: Acceder a documentación Swagger del microservicio core-ohs

```
Como:        Desarrollador del servicio core-ohs
Quiero:      Acceder a una UI Swagger que muestre SOLO los endpoints de core-ohs
Para:        Documentar las APIs de insured sin ruido de otros servicios

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

##### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Acceder a Swagger UI del servicio core-ohs
  Dado que:  El servicio core-ohs está ejecutándose (dev:core-ohs)
  Cuando:    Navego a http://localhost:3002/api-docs
  Entonces:  Se abre la UI de Swagger solo con endpoints de core-ohs
             (POST /api/v1/core/insured,
              GET /api/v1/core/insured,
              PUT /api/v1/core/insured,
              PUT /api/v1/core/insured/changeState)
```

#### HU-04: Documentación con anotaciones JSDoc/OpenAPI en controllers

```
Como:        Desarrollador backend
Quiero:      Documentar mis endpoints en el código usando anotaciones estándar
Para:        Mantener la documentación sincronizada sin esfuerzo manual

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01
Capa:        Backend
```

##### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Endpoint documentado aparecer con descripción en Swagger
  Dado que:  Un método del controller tiene anotación JSDoc/OpenAPI
  Cuando:    Se ejecuta el servidor
  Entonces:  El endpoint aparece en Swagger con:
             - Descripción
             - Parámetros
             - Request body schema
             - Response schemas (200, 400, 401, 409)
             - Códigos HTTP
```

**Example de anotación**
```javascript
/**
 * @swagger
 * post:
 *   summary: Crear un asegurado
 *   tags: [Insured]
 *   requestBody:
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             firstName: { type: string }
 *             email: { type: string }
 *   responses:
 *     201:
 *       description: Asegurado creado exitosamente
 *     400:
 *       description: Validación fallida
 *     401:
 *       description: Token no válido
 */
```

### Reglas de Negocio

1. **Descubrimiento Automático**
   - Swagger debe generarse automáticamente desde los endpoints registrados
   - No se debe mantener un spec JSON/YAML separado manualmente

2. **Filtrado por Servicio**
   - El monolito (launch.ts) debe mostrar todos los endpoints
   - Cada microservicio (danos, core-ohs) muestra sus endpoints etiquetados por servicio

3. **Anotaciones Estándar**
   - Usar JSDoc con sintaxis compatible con OpenAPI 3.0
   - Cada endpoint debe tener descripción, parámetros y respuestas documentadas

4. **Rutas Consistentes**
   - Monolito: `http://localhost:<PORT>/api-docs`
   - Danos: `http://localhost:3001/api-docs`
   - Core-OHS: `http://localhost:3002/api-docs`

5. **Dependencias**
   - `swagger-ui-express` — ya está en package.json
   - `swagger-jsdoc` — aún no está instalado, debe agregarse
   - `@types/swagger-jsdoc` — tipos TypeScript

---

## 2. DISEÑO

### Modelos de Datos
No aplica. Swagger es solo documentación, no requiere persistencia.

### Arquitectura de la Solución

#### Stack
- **Generador de Spec**: `swagger-jsdoc` (Lee JSDoc y genera OpenAPI)
- **UI**: `swagger-ui-express` (Sirve la interfaz interactiva)
- **Versión OpenAPI**: 3.0.0

#### Flujo Arquitectónico

```
┌─────────────────────────────────────────────────────────────┐
│ Desarrollo: Controllers con anotaciones JSDoc               │
│  @swagger                                                   │
│   post:                                                     │
│     summary: Crear asegurado                               │
│     tags: [Insured]                                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓
        ┌──────────────────┐
        │ swagger-jsdoc    │
        │ (Build time)     │
        │ Lee JSDoc        │
        │ → OpenAPI Spec   │
        └────────┬─────────┘
                 │
                 ↓
        ┌──────────────────────────────────────────┐
        │ Server Express (runtime)                 │
        │ - GET /api-docs → swagger-ui-express    │
        │ - GET /api-docs.json → OpenAPI spec     │
        └──────────────────────────────────────────┘
```

#### Configuración por Entrypoint

##### 1. Monolito (launch.ts)
```typescript
// server.ts
import swaggerUi from 'swagger-ui-express';
import specs from './swagger.spec'; // generado por swagger-jsdoc

server.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

**Spec generada**: Incluye TODOS los endpoints de todos los microservicios

##### 2. Microservicio Danos (entrypoints/danos.ts)
```typescript
// Registra solo endpoints con tag "danos"
const danosSpecs = filterSpecsByTag(specs, 'danos');
server.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(danosSpecs));
```

##### 3. Microservicio Core-OHS (entrypoints/core-ohs.ts)
```typescript
// Registra solo endpoints con tag "core-ohs"
const coreOhsSpecs = filterSpecsByTag(specs, 'core-ohs');
server.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(coreOhsSpecs));
```

### Archivos Afectados

#### Nuevos
1. **`src/infraestructure/swagger/swagger.spec.ts`** — Configuración base de swagger-jsdoc
2. **`src/infraestructure/swagger/swagger-config.ts`** — Helper para filtrar specs por tag
3. **`.github/skills/generate-controller/SKILL.md`** — Actualizar con ejemplo de anotaciones Swagger

#### Modificados
1. **`src/application/config/server.ts`** — Registrar middleware Swagger
2. **`src/presentation/entrypoints/launch.ts`** — Registrar specs del monolito
3. **`src/presentation/entrypoints/danos.ts`** — Registrar specs filtradas (danos)
4. **`src/presentation/entrypoints/core-ohs.ts`** — Registrar specs filtradas (core-ohs)
5. **`package.json`** — Agregar `swagger-jsdoc` y `@types/swagger-jsdoc`
6. **`tsconfig.json`** — Habilitar decoradores/comentarios de JSDoc

#### Controllers Existentes (sin cambios de lógica, solo anotaciones)
- `src/application/features/insured/insured.controller.ts` — Agregar anotaciones Swagger
- `src/application/features/quotations/quotation.controller.ts` — Agregar anotaciones Swagger
- `src/application/features/policies/policy.controller.ts` — Agregar anotaciones Swagger

### Estructura de Anotaciones Swagger en Controllers

#### Ejemplo: InsuredController (tags: insured, service: core-ohs)

```typescript
/**
 * @swagger
 * /api/v1/core/insured:
 *   post:
 *     summary: Crear un nuevo asegurado
 *     description: Crea un registro de asegurado con validación de datos
 *     tags:
 *       - Insured
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastNames
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Juan"
 *               lastNames:
 *                 type: string
 *                 example: "Pérez García"
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Asegurado creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                 firstName: { type: string }
 *                 created_at: { type: string, format: date-time }
 *       400:
 *         description: Validación fallida (campo obligatorio faltante)
 *       401:
 *         description: Token ausente o expirado
 *       409:
 *         description: Email ya registrado
 */
public store = (req: Request, res: Response) => { ... }

/**
 * @swagger
 * /api/v1/core/insured:
 *   get:
 *     summary: Listar todos los asegurados
 *     tags:
 *       - Insured
 *     responses:
 *       200:
 *         description: Lista de asegurados
 */
public index = (req: Request, res: Response) => { ... }

/**
 * @swagger
 * /api/v1/core/insured:
 *   put:
 *     summary: Actualizar asegurado
 *     tags:
 *       - Insured
 */
public update = (req: Request, res: Response) => { ... }

/**
 * @swagger
 * /api/v1/core/insured/changeState:
 *   put:
 *     summary: Cambiar estado del asegurado
 *     tags:
 *       - Insured
 */
public changeState = (req: Request, res: Response) => { ... }
```

### Configuración de swagger.spec.ts

```typescript
// src/infraestructure/swagger/swagger.spec.ts
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Retos AI - Cotizador de Daños API',
      version: '1.0.0',
      description: 'Documentación completa de todos los microservicios',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Monolito (Desarrollo)',
      },
      {
        url: 'http://localhost:3001',
        description: 'Servicio Danos (Desarrollo)',
      },
      {
        url: 'http://localhost:3002',
        description: 'Servicio Core-OHS (Desarrollo)',
      },
    ],
  },
  apis: [
    // Rutas donde están las anotaciones @swagger
    path.join(__dirname, '../../application/features/insured/insured.controller.ts'),
    path.join(__dirname, '../../application/features/quotations/quotation.controller.ts'),
    path.join(__dirname, '../../application/features/policies/policy.controller.ts'),
  ],
};

export const specs = swaggerJsdoc(options);
```

### Complemento: Helper para Filtrar por Tag

```typescript
// src/infraestructure/swagger/swagger-config.ts
export function filterSpecsByTag(specs: any, tagName: string) {
  const filtered = { ...specs };
  
  if (filtered.paths) {
    const newPaths = {};
    Object.keys(filtered.paths).forEach(path => {
      newPaths[path] = {};
      Object.keys(filtered.paths[path]).forEach(method => {
        const operation = filtered.paths[path][method];
        if (operation?.tags?.includes(tagName)) {
          newPaths[path][method] = operation;
        }
      });
      if (Object.keys(newPaths[path]).length === 0) {
        delete newPaths[path];
      }
    });
    filtered.paths = newPaths;
  }

  if (filtered.tags) {
    filtered.tags = filtered.tags.filter(t => t.name === tagName);
  }

  return filtered;
}
```

### Modificación en server.ts

```typescript
import swaggerUi from 'swagger-ui-express';
import { specs } from '@infraestructure/swagger/swagger.spec';

// En Server.start() o constructor:
this.app.use('/api-docs', swaggerUi.serve);
this.app.get('/api-docs', swaggerUi.setup(specs, {
  customCss: '.swagger-ui { font-family: system-ui }',
  customSiteTitle: 'Retos AI - API Docs',
}));
```

---

## 3. LISTA DE TAREAS

> Checklist accionable. El Orchestrator monitorea progreso.

### Backend

#### Fase 1: Configuración Swagger + Dependencias
- [ ] Instalar `swagger-jsdoc` y `@types/swagger-jsdoc` en package.json
- [ ] Crear archivo `src/infraestructure/swagger/swagger.spec.ts` con configuración OpenAPI 3.0.0
- [ ] Crear archivo `src/infraestructure/swagger/swagger-config.ts` con helper `filterSpecsByTag()`
- [ ] Actualizar `src/application/config/server.ts` para registrar middleware Swagger en `/api-docs`

#### Fase 2: Integración en Entrypoints
- [ ] Registrar Swagger en `src/presentation/entrypoints/launch.ts` (monolito, todos los endpoints)
- [ ] Registrar Swagger filtrado en `src/presentation/entrypoints/danos.ts` (solo tag "danos")
- [ ] Registrar Swagger filtrado en `src/presentation/entrypoints/core-ohs.ts` (solo tag "core-ohs")

#### Fase 3: Anotaciones en Controllers
- [ ] Agregar anotaciones Swagger a `InsuredController` (todos los métodos)
  - [ ] POST /api/v1/core/insured (store)
  - [ ] GET /api/v1/core/insured (index)
  - [ ] PUT /api/v1/core/insured (update)
  - [ ] PUT /api/v1/core/insured/changeState (changeState)
- [ ] Agregar anotaciones Swagger a `QuotationController` (todos los métodos)
  - [ ] POST /api/v1/danos/quotations (store)
  - [ ] GET /api/v1/danos/quotations (index)
  - [ ] PUT /api/v1/danos/quotations (update)
  - [ ] PUT /api/v1/danos/quotations/changeState (changeState)
- [ ] Agregar anotaciones Swagger a `PolicyController` (todos los métodos)
  - [ ] POST /api/v1/danos/policies (store)
  - [ ] GET /api/v1/danos/policies (index)
  - [ ] PUT /api/v1/danos/policies (update)
  - [ ] PUT /api/v1/danos/policies/changeState (changeState)

#### Fase 4: Testing Swagger
- [ ] Test: GET /api-docs en monolito → retorna HTML de UI Swagger
- [ ] Test: GET /api-docs en danos → retorna solo endpoints con tag "danos"
- [ ] Test: GET /api-docs en core-ohs → retorna solo endpoints con tag "core-ohs"
- [ ] Test: GET /api-docs.json → retorna OpenAPI spec válido (validar con swagger-cli)
- [ ] Test: Cada endpoint documentado aparece en UI con descripción y schemas

### Skills y Documentación

#### Actualizar `.github/skills/generate-controller/SKILL.md`
- [ ] Agregar sección "Anotaciones Swagger" con ejemplo mínimo
- [ ] Documentar cómo agregar `@swagger` JSDoc a nuevos controladores
- [ ] Explique estructura: summary, tags, requestBody, responses, parameters

#### Crear Documentación de Referencia
- [ ] Crear `docs/SWAGGER_GUIDE.md` con:
  - [ ] Cómo ejecutar cada servicio
  - [ ] URLs de acceso a Swagger
  - [ ] Formato de anotación recomendado
  - [ ] Validación del spec con `swagger-cli validate`

### QA (Gherkin + Riesgos)

- [ ] Generar escenarios Gherkin con `/gherkin-case-generator`
- [ ] Generar análisis de riesgos con `/risk-identifier`
- [ ] Documentar casos de prueba en `docs/output/qa/RQ-03-gherkin.md`
- [ ] Documentar matriz de riesgos en `docs/output/qa/RQ-03-risks.md`

---

## 4. NOTAS TÉCNICAS

### Decisiones Arquitectónicas

1. **swagger-jsdoc vs Decoradores TypeScript**
   - **Elegido**: swagger-jsdoc (JSDoc)
   - **Razón**: No requiere dependencias extra (decoradores TypeScript necesitarían librerías adicionales), es estándar OpenAPI, y funciona con runtime JS/TS
   - **Alternativa rechazada**: Decoradores (@Post, @Get) requieren reflection y librerías como `reflect-metadata`

2. **Ubicación de Anotaciones**
   - **Elegido**: En los controllers (mismo archivo que la lógica)
   - **Razón**: Mantiene la documentación cerca del código, facilita sincronización
   - **Alternativa rechazada**: Archivo separado (swagger.json) requiere mantenimiento manual

3. **Filtrado de Endpoints por Tag**
   - **Elegido**: Filtrado en runtime via helper function `filterSpecsByTag()`
   - **Razón**: Reutiliza el mismo spec para todos los entrypoints
   - **Alternativa rechazada**: Specs separadas por servicio requiere duplicación y mayor mantenimiento

4. **Ruta de Acceso**
   - **Elegido**: `/api-docs` (estándar Swagger)
   - **Razón**: Convención REST, fácil de descubrir
   - **Nota**: No entra en conflicto con `/api/v1/...` (prefijo de features)

### Dependencias Nuevas

```json
{
  "swagger-jsdoc": "^6.x.x",
  "@types/swagger-jsdoc": "^6.x.x"
}
```

**Justificación:**
- `swagger-jsdoc` — lee comentarios JSDoc y genera OpenAPI spec
- `@types/swagger-jsdoc` — tipos TypeScript para seguridad de tipos

### Compatibilidad

- **Express 5.2.1** — compatible con swagger-ui-express
- **TypeScript 4.x+** — soporta JSDoc en comentarios
- **Node.js 18+** — requerido por Express 5.x

### Consideraciones de Performance

- Swagger spec se genera en build/startup (una sola vez)
- `/api-docs` y `/api-docs.json` son requests estáticas (Swagger UI cache-friendly)
- No genera overhead en runtime (spec está en memoria)

---

## 5. CRITERIOS DE ACEPTACIÓN Y VALIDACIÓN

### Tests Funcionales

```gherkin
Feature: Swagger API Documentation

Scenario: HU-01.1 — Monolito muestra todos los endpoints
  Given El servidor monolítico está executándose en puerto 3000
  When Accedo a http://localhost:3000/api-docs
  Then Veo la UI de Swagger
  And Aparecen endpoints:
    | /api/v1/core/insured           | POST   |
    | /api/v1/core/insured           | GET    |
    | /api/v1/core/insured           | PUT    |
    | /api/v1/core/insured/changeState | PUT  |
    | /api/v1/danos/quotations       | POST   |
    | /api/v1/danos/quotations       | GET    |
    | /api/v1/danos/quotations       | PUT    |
    | /api/v1/danos/quotations/changeState | PUT |
    | /api/v1/danos/policies         | POST   |
    | /api/v1/danos/policies         | GET    |
    | /api/v1/danos/policies         | PUT    |

Scenario: HU-02.1 — Servicio Danos muestra solo sus endpoints
  Given El servicio danos está ejecutándose en puerto 3001
  When Accedo a http://localhost:3001/api-docs
  Then Veo la UI de Swagger con SOLO endpoints de danos
  And NO aparecen endpoints de /api/v1/core/insured

Scenario: HU-03.1 — Servicio Core-OHS muestra solo sus endpoints
  Given El servicio core-ohs está ejecutándose en puerto 3002
  When Accedo a http://localhost:3002/api-docs
  Then Veo la UI de Swagger con SOLO endpoints de core-ohs
  And NO aparecen endpoints de /api/v1/danos/*

Scenario: HU-04.1 — Endpoint tiene descripción, parámetros y schemas
  Given Un endpoint está documentado con anotación @swagger
  When Accedo a /api-docs y abro ejecuta endpoint
  Then Veo descripción clara
  And Puedo ver request body schema
  And Puedo ver response schema (200, 400, 401, 409)
  And Hay un botón "Try it out" para testear
```

### Requisitos de Validación

- [ ] `GET /api-docs` retorna código 200
- [ ] `GET /api-docs.json` retorna JSON válido con estructura OpenAPI 3.0.0
- [ ] Swagger spec valida sin errores (validar con `npm run swagger:validate` si se crea ese script)
- [ ] UI es interactiva (botones "Try It Out", selector de servers, etc.)
- [ ] Cada endpoint tiene al menos: summary, tags, responses
- [ ] No hay duplicación de endpoints en spec

### Validación Manual en Desarrollo

```bash
# 1. Instalar swagger-cli
npm install -g @apidevtools/swagger-cli

# 2. Validar spec
swagger-cli validate http://localhost:3000/api-docs.json

# 3. Acceder a UI
open http://localhost:3000/api-docs
```

---

## 6. INTEGRACIÓN CON SKILLS

### Actualización Requerida de `.github/skills/generate-controller/SKILL.md`

La skill de `generate-controller` debe incluir una nueva sección **"Anotaciones Swagger"** con:

1. **Plantilla JSDoc estándar para un endpoint**
   ```javascript
   /**
    * @swagger
    * /api/v1/{feature}/{endpoint}:
    *   post:
    *     summary: [Descripción breve]
    *     tags:
    *       - [Feature]
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema: { ... }
    *     responses:
    *       201: { description: [...] }
    *       400: { description: [...] }
    *       401: { description: [...] }
    */
   ```

2. **Guía sobre tags**: Usar nombre del microservicio (danos, core-ohs, etc.)

3. **Ejemplo completo** copiado de un controller real (InsuredController.store)

4. **Validación**: Cómo testear que Swagger reconoce la anotación

---

## 7. ROADMAP DE IMPLEMENTACIÓN

### Sprint 1 (Fase 1-2): Infraestructura
- Instalar dependencias
- Crear swagger.spec.ts y swagger-config.ts
- Registrar middleware en server.ts y entrypoints
- **Deliverable**: `/api-docs` accesible pero sin documentación

### Sprint 2 (Fase 3): Documentación de Controllers
- Agregar anotaciones a InsuredController (4 endpoints)
- Agregar anotaciones a QuotationController (4 endpoints)
- Agregar anotaciones a PolicyController (4 endpoints)
- **Deliverable**: Swagger con 12 endpoints documentados

### Sprint 3 (Fase 4 + Skills): Testing + Skills
- Tests funcionales de Swagger
- Actualizar SKILL.md de generate-controller
- Crear docs/SWAGGER_GUIDE.md
- **Deliverable**: Documentación completa, skill actualizada

---

**Versión:** 1.0  
**Redactado:** spec-generator  
**Fecha:** 2026-03-30  
**Estado:** APPROVED — Listo para desarrollo
