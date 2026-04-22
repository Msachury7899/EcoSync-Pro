import { RequestHandler, Router } from 'express';

export interface MicroserviceConfig {
    name: string;                       // Nombre del servicio (ej. "jobs")
    port: number;                       // Puerto de escucha del servidor
    routePrefix: string;                // Prefijo base (ej. "/api/v1/jobs")
    routers: RouterEntry[];             // Lista de routers a montar
    description?: string;              // Descripción del servicio (swagger info / logs)
    swaggerDocsGlob?: string;          // Glob a los archivos *.docs.ts del feature
    middlewares?: RequestHandler[];    // Middlewares aplicados a todas las rutas del servicio
}

export interface RouterEntry {
    path: string;                      // Sub-path relativo al routePrefix
    routerFactory: () => Router;       // Factory que instancia el router del feature
}
