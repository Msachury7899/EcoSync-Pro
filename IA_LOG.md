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

## Pendientes / Decisiones futuras

| # | Tema | Estado |
|---|------|--------|
| 1 | Agregar `healthcheck` a `postgres-db` en docker-compose | Pendiente |
| 2 | Validar que Zod schemas usen `.strict()` en todos los validators | Pendiente |
| 3 | Confirmar que `DATABASE_URL` usa SSL en entornos no-local | Pendiente |
| 4 | Documentar decisiones de frontend (Angular + Tailwind) | Pendiente |
