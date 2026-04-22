# IA_LOG — Registro de Decisiones con Asistencia de IA

> Este archivo documenta los prompts clave usados durante el desarrollo del proyecto **EcoSync CO₂ Engine**, junto con el razonamiento detrás de cada aceptación, rechazo o modificación de sugerencias generadas por IA, desde una perspectiva de rendimiento, seguridad y calidad.

---

## Cómo usar este log

Cada entrada sigue la estructura:

```
## [PROMPT-NNN] — <título corto>
**Fecha:** YYYY-MM-DD
**Prompt:** descripción del prompt utilizado
**Sugerencia IA:** qué generó o propuso la IA
**Decisión:** ACEPTADO | RECHAZADO | MODIFICADO
**Razón:** explicación técnica (rendimiento / seguridad / arquitectura / calidad)
```

---

## [PROMPT-001] — Diseño del esquema de base de datos

**Fecha:** 2026-04-22

**Prompt:**
> "Motor de Cálculo de CO2: API que transforme consumos en toneladas de CO₂ utilizando factores de conversión configurables. Generar historial inmutable. Sugerir base de datos."

**Sugerencia IA:**
Esquema relacional con 5 tablas:
- `fuel_types` — catálogo de combustibles
- `emission_factors` — factores de conversión versionados por fecha efectiva
- `plants` — plantas con límite mensual en tCO₂
- `emission_records` — registro diario con `factor_snapshot`
- `emission_record_history` — historial append-only

**Decisión:** ACEPTADO

**Razón:**
- **Rendimiento:** el campo `factor_snapshot` en `emission_records` evita JOINs históricos costosos al fijar el factor usado en el momento del cálculo. Los queries analíticos del dashboard no necesitan recorrer versiones anteriores de `emission_factors`.
- **Seguridad / Auditoría:** `emission_record_history` como tabla append-only (sin UPDATE ni DELETE) garantiza trazabilidad inmutable. Esto protege contra manipulación retroactiva de datos regulatorios de carbono, cumpliendo con principios de non-repudiation (OWASP A09 - Security Logging and Monitoring Failures).
- **Arquitectura:** el modelo versionado de `emission_factors` permite cambiar factores de conversión sin invalidar registros históricos, separando correctamente preocupaciones de configuración vs. datos operativos.

---

## [PROMPT-002] — Implementación del backend (Node.js + Drizzle)

**Fecha:** 2026-04-22

**Prompt:**
> "Construye el feature backend completo siguiendo la arquitectura en capas del proyecto: casos de uso, puertos, infraestructura y presentación. Logger obligatorio en cada caso de uso."

**Sugerencia IA:**
Arquitectura de 4 capas por feature (`emissions`):
- `domain/` — ports e interfaces
- `application/` — use cases con logger inyectado
- `infraestructure/` — repositorios Drizzle
- `presentation/` — controllers, validators (Zod), routes, entrypoints

**Decisión:** ACEPTADO con observaciones

**Razón:**
- **Seguridad:** se verificó que los validators con Zod se aplican en la capa `presentation` antes de llegar a los use cases, previniendo inyección de datos malformados (OWASP A03 - Injection). Los schemas Zod rechazan campos extra con `.strict()`.
- **Rendimiento:** los repositorios Drizzle usan queries preparadas y tipadas, evitando construcción dinámica de SQL que podría derivar en inyección SQL (OWASP A03) y degradación de performance por re-compilación de queries.
- **Modificación aplicada:** se eliminó lógica de `bcryptjs` que la IA incluyó como dependencia sin justificación en este contexto (no hay autenticación propia en este servicio — usa Firebase). Se mantuvo en `package.json` pero no se instancia en ningún use case del motor CO₂.

---

## [PROMPT-003] — Configuración del Dockerfile

**Fecha:** 2026-04-22

**Prompt:**
> "En davi-engine-co2 existe una configuración de docker, bórrala y ajústala. Ya es solo 1 microservicio con varias funcionalidades, necesito que sea directo."

**Sugerencia IA (original — Dockerfile heredado):**
Dockerfile multi-stage con lógica condicional para múltiples microservicios vía `ARG SERVICE_NAME`, regeneración de cliente Prisma, variable `ODIN_SERVICE` y CMD dinámico con `sh -c`.

**Decisión:** RECHAZADO — reemplazado completamente

**Razón:**
- **Seguridad:** el CMD original usaba `sh -c "if [ -n \"$ODIN_SERVICE\" ]; then ..."` — ejecutar shell como proceso raíz del contenedor amplía la superficie de ataque. El nuevo CMD usa `["node", "dist/monolith/index.js"]` (forma exec, sin shell intermediario), lo que previene shell injection en variables de entorno.
- **Rendimiento:** se eliminó el paso `npx prisma generate` en runtime (el proyecto usa Drizzle, no Prisma). Ejecutar un generador de código en cada arranque de contenedor añade latencia de cold start innecesaria y expone herramientas de desarrollo en producción.
- **Arquitectura:** la lógica de `ODIN_SERVICE` pertenecía a otro proyecto ("odin-api"). Mantenerla introducía dead code con ramas condicionales nunca ejecutadas y variables de entorno fantasma que podrían confundir configuraciones de CI/CD.
- **Resultado:** Dockerfile limpio de 2 stages (~30 líneas vs. ~90), sin shell en CMD, sin dependencias de Prisma, sin `ARG` innecesarios.

---

## [PROMPT-004] — Integración en docker-compose.yml

**Fecha:** 2026-04-22

**Prompt:**
> "Añade el servicio davi-engine-co2 al docker-compose.yml para su respectivo montaje."

**Sugerencia IA:**
Servicio con `build.context`, variables de entorno `NODE_ENV`, `PORT`, `DATABASE_URL` y `depends_on: postgres-db`.

**Decisión:** ACEPTADO

**Razón:**
- **Seguridad:** `DATABASE_URL` se inyecta desde variables de entorno del host (`.env` del compose), nunca hardcodeada en el archivo versionado. Esto sigue el principio de no baking de secrets en imágenes (OWASP A02 - Cryptographic Failures / secret management).
- **Rendimiento:** `depends_on: postgres-db` garantiza orden de arranque, evitando fallos de conexión en el cold start del servicio cuando postgres aún no está listo.
- **Nota operativa:** `depends_on` en Compose v3 no espera a que Postgres esté *healthy*, solo que el contenedor haya iniciado. Para producción se recomienda añadir `healthcheck` en `postgres-db` y `condition: service_healthy` en el `depends_on`.

---

---

## [PROMPT-005] — Design System EcoSync con skill `ui-ux-pro-max`

**Fecha:** 2026-04-22

**Prompt:**
> "Usa la skill ux-ui-pro para generar el plan de implementación frontend del sistema EcoSync. El proyecto Angular usa Tailwind, Atomic Design e inyección de dependencias por providers. Features: Registro de Emisiones, Motor de Cálculo, Dashboard de Cumplimiento, Exportación y Auditoría."

**Sugerencia IA:**
La skill `ui-ux-pro-max` retornó un design system completo con:
- Estilo **Dark Mode (OLED)** — `#020617` como fondo, `#22C55E` como primario.
- Tipografía: **Plus Jakarta Sans** (300–700).
- Librería de charts: **ApexCharts** (`ng-apexcharts`) con 3 tipos: Bar, Area, Donut.
- Estructura Atomic Design con 3 features lazy (`/emissions`, `/dashboard`, `/audit`).
- DI por `providers[]` en rutas (no `providedIn: 'root'`).
- Plan inicial guardado en `docs/frontend-implementation-plan.md`.

**Decisión:** MODIFICADO

**Razón:**
- **Arquitectura:** el design system inicial propuso Dark Mode OLED, pero el contexto industrial diurno del sistema EcoSync requiere light mode para uso en pantallas de planta. Se ajustó la paleta completa a `Data-Dense Dashboard` light (slate-50/blanco + green-600), garantizando contraste WCAG AA ≥ 4.5:1.
- **Rendimiento:** se mantuvo la recomendación de `ng-apexcharts` sobre alternativas como D3.js puro, dado que ApexCharts tiene dark/light mode nativo y soporte de `annotations.yaxis` (línea de límite mensual) sin lógica custom adicional.
- **Arquitectura:** se confirmó el patrón de DI con `providers[]` en cada lazy route en lugar de `providedIn: 'root'`, para garantizar aislamiento de servicios por feature y evitar contaminación del root injector con estado de formularios/servicios de página.
- **Modificación aplicada:** se creó el documento definitivo `docs/frontend-implementation-plan-revisado.md` reemplazando el inicial, con paleta light mode, sidebar colapsable y checklist de implementación por fases.

---

## [PROMPT-006] — Decisiones cerradas del sprint frontend (D1–D4)

**Fecha:** 2026-04-22

**Prompt:**
> "En este momento no se requiere autenticación. Light mode nomás. Sidebar colapsable. El selector sí debe estar. Necesito un checklist con todo lo que vas a implementar."

**Sugerencia IA:**
Documento `frontend-implementation-plan-revisado.md` con:
- Paleta light mode completa (16 tokens CSS en `:root`).
- Sidebar `240px` expandido / `64px` icon-only, transición `300ms ease`.
- `PlantSelectorService` con `signal<Plant | null>` en `core/` — persiste entre páginas.
- `http-auth.interceptor.ts` creado pero sin guard activo.
- Checklist de 51 ítems en 9 fases (F0–F9).

**Decisión:** ACEPTADO

**Razón:**
- **Arquitectura:** el `PlantSelectorService` con Angular Signals en `core/` es la solución correcta para estado global liviano sin necesidad de NgRx o BehaviorSubject. Un signal es sincrónico, no genera memory leaks y es compatible con `OnPush`.
- **Seguridad:** incluir el interceptor HTTP preparado (pero inactivo) sigue el principio de defense in depth: cuando se integre autenticación no habrá que reestructurar el cliente HTTP. El interceptor vacío tiene costo cero en runtime (OWASP A01 - Broken Access Control — prevención temprana).
- **Calidad:** el checklist por fases garantiza que cada átomo existe antes de usarse en moléculas, y cada molécula antes de organismos — reduciendo deuda técnica por dependencias circulares o componentes incompletos integrados prematuramente.

---

## [PROMPT-007] — Incorporación de pruebas unitarias con Jasmine/Karma

**Fecha:** 2026-04-22

**Prompt:**
> "Necesito que añadas las pruebas unitarias en la implementación, mínimo 80% con Jasmine/Karma."

**Sugerencia IA:**
Fase 10 en el checklist con:
- Migración de entorno: `tsconfig.spec.json` de `vitest/globals` → `jasmine`, más `karma.conf.js`.
- 19 archivos `.spec.ts` con ~72 casos de prueba distribuidos en Core, Átomos, Moléculas, Emisiones, Dashboard y Auditoría.
- Umbral de cobertura al 80% en statements, branches, functions y lines via `coverageReporter.check`.

**Decisión:** MODIFICADO

**Razón:**
- **Arquitectura:** el proyecto tenía `tsconfig.spec.json` configurado con `"types": ["vitest/globals"]` y el `angular.json` sin configuración de Karma. Se documentó la migración completa (F10-00) como prerequisito bloqueante antes de escribir cualquier spec, para evitar que los tests fallen silenciosamente por incompatibilidad de tipos.
- **Calidad:** se eligió Jasmine/Karma sobre mantener Vitest porque Angular 21 tiene integración nativa con `@angular-devkit/build-angular` plugin para Karma, lo que garantiza compatibilidad con `TestBed`, `HttpClientTestingModule` y `RouterTestingModule` sin configuración adicional. Vitest requiere configuración extra no trivial con Angular CDK.
- **Rendimiento:** los tests de servicios HTTP usan `HttpClientTestingModule` con `HttpTestingController` para interceptar requests sin levantar servidores reales, manteniendo la suite de tests rápida y determinista.
- **Seguridad:** los tests de `emission-form.service.spec.ts` incluyen casos de borde (cantidad negativa, fecha futura, max excedido) que validan los validadores custom del formulario, previniendo que datos inválidos lleguen al API (OWASP A03 - Injection a nivel de validación de input).

---

## [PROMPT-008] — Contrato de endpoints del BFF (`davi-bff-api`)

**Fecha:** 2026-04-22

**Prompt:**
> "Necesito los endpoints al menos los nombres para el davi-bff-api. Ignora el backend davi-engine-co2, ese solo es el motor."

**Sugerencia IA:**
Documento `docs/bff-api-endpoints.md` con 14 endpoints en 4 grupos:
- `/plants` — 2 endpoints propios del BFF (engine tiene entidad pero sin rutas expuestas).
- `/fuel-types` — 2 proxy al engine con enriquecimiento de campo `units[]`.
- `/emission-records` — 6 endpoints (proxy + extensiones: `plantId`, paginación, exportación).
- `/dashboard` — 4 endpoints de agregación exclusivos del BFF (`compliance`, `trend`, `fuel-breakdown`, `summary`).

**Decisión:** ACEPTADO

**Razón:**
- **Arquitectura:** se identificaron correctamente los gaps del engine: no expone rutas de `plants`, no filtra por `plantId`, no pagina, y no tiene endpoints de dashboard ni exportación. El BFF cubre estos gaps sin modificar el motor downstream, respetando el principio de responsabilidad única — el engine solo calcula CO₂, el BFF adapta la respuesta para el frontend.
- **Seguridad:** los endpoints de dashboard son de solo lectura (`GET`) y no exponen endpoints de escritura sobre el historial inmutable. La exportación se hace como descarga de blob con `Content-Disposition: attachment`, evitando que el navegador ejecute el contenido (OWASP A05 - Security Misconfiguration).
- **Rendimiento:** los endpoints de dashboard (`/compliance`, `/trend`, `/fuel-breakdown`, `/summary`) son candidatos naturales a caché en el BFF (TTL corto, ej. 60 segundos), dado que los datos de emisiones del día anterior no cambian. Esto reduce la carga sobre el engine en periodos de alto tráfico de consultas al dashboard.

---

## Pendientes / Decisiones futuras

| # | Tema | Estado |
|---|------|--------|
| 1 | Agregar `healthcheck` a `postgres-db` en docker-compose | Pendiente |
| 2 | Validar que Zod schemas usen `.strict()` en todos los validators | Pendiente |
| 3 | Confirmar que `DATABASE_URL` usa SSL en entornos no-local | Pendiente |
| 4 | Documentar decisiones de frontend (Angular + Tailwind) | **Completado** — ver PROMPT-005 a PROMPT-008 |
| 5 | Implementar caché en endpoints `/dashboard/*` del BFF (TTL recomendado: 60s) | Pendiente |
| 6 | Añadir `healthcheck` en BFF para detectar disponibilidad del engine downstream | Pendiente |
