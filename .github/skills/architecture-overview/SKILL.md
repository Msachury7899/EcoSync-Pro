---
name: architecture-overview
description: Explica la arquitectura del proyecto Node.js con TypeScript.
---

# Descripción de la Arquitectura

## Estructura del Proyecto
- **`src`**: Código fuente principal.
  - **`prisma`**: Configuración de Prisma y migraciones.
  - **`domain`**: Entidades, servicios y contratos de dominio.
  - **`infraestructure`**: Casos de uso, servicios de base de datos y utilidades.
  - **`application`**: Controladores, rutas y puntos de entrada.

## Patrón Hexagonal
- **Dominio**: Contiene la lógica de negocio pura.
- **Infraestructura**: Implementa detalles técnicos como acceso a datos.
- **Aplicación**: Maneja la interacción con el mundo exterior (HTTP, eventos, etc.).

## Flujo de Datos
1. **Request**: Llega al controlador en `application`.
2. **Validación**: Se valida la entrada en el controlador.
3. **Lógica de Negocio**: Se delega al dominio o casos de uso en `infraestructure`.
4. **Respuesta**: Se envía la respuesta al cliente.

## Ejemplo de Flujo
1. Un cliente realiza una petición `GET /api/hello`.
2. El controlador `HelloController` maneja la petición.
3. Se utiliza `CustomResponse` para enviar la respuesta.

## Herramientas y Configuración
- **TypeScript**: Tipado estático.
- **Jest**: Pruebas unitarias.
- **Express**: Framework para manejar HTTP.
- **Prisma**: ORM para la base de datos.

> **Nota**: Esta arquitectura está diseñada para ser escalable y fácil de mantener.