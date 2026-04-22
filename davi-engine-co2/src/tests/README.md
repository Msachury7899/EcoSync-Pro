# tests/ — Tests manuales críticos

Esta carpeta es **exclusiva para tests escritos a mano** que cubren casos que los agentes no generan automáticamente.

## Cuándo usar esta carpeta

- **Integración multi-feature** — flujos que cruzan varios módulos
- **Regresiones específicas** — bugs reportados que no pueden repetirse
- **E2E HTTP** — levantar el `Server` con supertest y ejercer la API real
- **Contratos externos** — validar shapes de DTOs frente a clientes conocidos
- **Casos críticos** marcados con `@critico` o `@smoke` que no pertenecen a un único archivo

## Cuándo NO usar esta carpeta

- Tests unitarios de un use-case, entity, mapper, controller, repository → van **co-locados** junto al archivo bajo prueba (`*.spec.ts` en la misma carpeta que el código fuente).
- Tests generados por `test-engineer-backend` → siempre co-locados.

## Estructura sugerida

```
tests/
  integration/
    jobs-flow.spec.ts         # crea job → cambia estado → lista
  e2e/
    jobs-api.spec.ts          # supertest contra Server real
  regression/
    issue-123.spec.ts         # repro del bug #123
```

## Reglas

- Nombre de archivo: `*.spec.ts`
- AAA obligatorio (`GIVEN / WHEN / THEN`)
- Mockear DB y servicios externos salvo en `e2e/` (usar SQLite in-memory)
- Tags `@smoke`, `@critico`, `@regression` en el `describe` o `it`:
  ```ts
  it('@smoke crea job y devuelve 201', async () => { ... });
  ```
- Ejecutar solo esta carpeta: `npm run test:manual`
