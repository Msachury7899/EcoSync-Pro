---
name: ia-log-updater
description: Documenta una decisión de IA en IA_LOG.md. Registra el prompt usado, la sugerencia de la IA y la razón técnica (rendimiento / seguridad / arquitectura) para aceptarla, rechazarla o modificarla.
argument-hint: "<descripción de la decisión o contexto a documentar>"
---

# IA Log Updater

## Propósito

Mantener `IA_LOG.md` actualizado con cada decisión significativa tomada con asistencia de IA durante el desarrollo del proyecto. Este archivo es evaluado como artefacto de entrega.

## Cuándo usar esta skill

Invocar `/ia-log-update` después de cualquiera de estos eventos:

- Se acepta una sugerencia de IA para implementar lógica de negocio, infraestructura o tests.
- Se rechaza total o parcialmente una sugerencia de IA.
- Se modifica una sugerencia antes de aplicarla.
- Se toma una decisión arquitectónica guiada por un prompt.

## Proceso

1. **Leer el estado actual** de `IA_LOG.md` para determinar el próximo número de entrada (`PROMPT-NNN`).
2. **Identificar la categoría** de la decisión:
   - `ACEPTADO` — se aplicó la sugerencia sin cambios significativos.
   - `MODIFICADO` — se aplicó con ajustes, documentar qué cambió y por qué.
   - `RECHAZADO` — no se aplicó, documentar la alternativa elegida.
3. **Clasificar la razón** usando al menos uno de estos ejes:
   - **Seguridad** — referencia a OWASP Top 10 si aplica.
   - **Rendimiento** — impacto en latencia, throughput, cold start, queries.
   - **Arquitectura** — coherencia con capas, patrones o convenciones del proyecto.
   - **Calidad** — deuda técnica, mantenibilidad, dead code.
4. **Añadir la entrada** al final de la sección de entradas en `IA_LOG.md`, antes de la sección `## Pendientes`.
5. **Actualizar la tabla de pendientes** si la decisión genera un ítem de seguimiento.

## Plantilla de entrada

```markdown
## [PROMPT-NNN] — <título corto descriptivo>

**Fecha:** YYYY-MM-DD

**Prompt:**
> "Texto del prompt o descripción del contexto"

**Sugerencia IA:**
Descripción de lo que la IA generó o propuso.

**Decisión:** ACEPTADO | MODIFICADO | RECHAZADO

**Razón:**
- **[Eje]:** explicación técnica concreta.
- **[Eje]:** explicación técnica concreta.
```

## Reglas

- Cada entrada debe tener **al menos una razón técnica** — no son válidas razones como "no me gustó" o "preferí otra cosa" sin justificación técnica.
- Si la razón involucra seguridad, **citar el control OWASP** correspondiente (ej. A03 - Injection).
- No modificar ni reescribir entradas anteriores — el log es **append-only**.
- El número `NNN` es secuencial y nunca se reutiliza.
- Actualizar la tabla `## Pendientes` si la decisión deja un ítem de seguimiento abierto.

## Ubicación del archivo

```
/IA_LOG.md  ← raíz del repositorio
```
