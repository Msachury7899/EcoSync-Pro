import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { MicroserviceConfig } from '@core/interfaces/microservices.config';

const ROOT = path.resolve(__dirname, '../../..');

export function buildSwaggerSpec(configs: MicroserviceConfig[]): object {
    const apis = configs
        .filter((c) => c.swaggerDocsGlob)
        .map((c) => path.join(ROOT, c.swaggerDocsGlob!));

    return swaggerJsdoc({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Odin API',
                version: '1.0.0',
                description: 'Documentación generada automáticamente a partir de los microservicios',
            },
        },
        apis,
    });
}
