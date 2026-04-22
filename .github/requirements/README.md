# Requirements — Requerimientos de Negocio

Este directorio contiene los requerimientos de negocio que están **listos para ser especificados** pero aún no tienen una spec generada.

## ¿Qué es un Requerimiento?

Un requerimiento es un documento que describe **qué necesita el negocio**, antes de que el `Spec Generator` lo convierta en una spec técnica ASDD. Es la entrada al pipeline ASDD.

## Lifecycle

```
requirements/<feature>.md  →  /generate-spec  →  specs/<feature>.spec.md
  (requerimiento de negocio)     (Spec Generator)    (especificación técnica)
```

## Cómo Usar

1. Crear un archivo `<feature>.md` en este directorio con la descripción del requerimiento
2. Ejecutar `/generate-spec` o usar `@Spec Generator` en Copilot Chat
3. Una vez generada la spec en `.github/specs/`, el requerimiento puede archivarse o eliminarse

## Convención de Nombres

```
.github/requirements/<nombre-feature-kebab-case>.md
```

## Requerimientos

| ID | Feature | Archivo | Estado |
|----|---------|---------|--------|
| RQ-01 | Definición de Dominio DDD | `RQ-01.md` | SPEC GENERADA → `RQ-01-domain.spec.md` |
| RQ-02 | Despliegue y Configuración (Microservicios) | `RQ-02.md` | SPEC GENERADA → `RQ-02-microservices-bundling.spec.md` |
| RQ-03 | Mejoras Documentación (Swagger) | `RQ-03.md` | SPEC GENERADA → `RQ-03-swagger.spec.md` |
| RQ-04 | Endpoints REST del Cotizador de Daños | `RQ-04.md` | LISTO PARA SPEC |
| RQ-05 | Integración con Servicios de Referencia (Core OHS) | `RQ-05.md` | LISTO PARA SPEC |
| RQ-06 | Motor de Cálculo Técnico y Modelo de Datos | `RQ-06.md` | LISTO PARA SPEC |

> Actualiza esta tabla al agregar o procesar requerimientos.
